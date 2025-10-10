import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

const ORS_API_KEY = process.env.ORS_API_KEY!;

interface Order {
    id: number;
    address: string;
    type: string;
}

async function getCoords(address: string) {
    const res = await fetch(
        `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(
            address
        )}&size=1`
    );
    const data = await res.json();
    if (!data.features || data.features.length === 0)
        throw new Error(`Nie znaleziono współrzędnych dla adresu: ${address}`);
    return data.features[0].geometry.coordinates; // [lon, lat]
}

// Zaokrąglanie startu w dół do pełnej lub pół godziny
function floorHalfHour(t: number) {
    const h = Math.floor(t);
    const m = Math.round((t - h) * 60);
    if (m < 30) return `${String(h).padStart(2, "0")}:00`;
    return `${String(h).padStart(2, "0")}:30`;
}

// Zaokrąglanie końca w górę do pełnej lub pół godziny
function ceilHalfHour(t: number) {
    const h = Math.floor(t);
    const m = Math.round((t - h) * 60);
    if (m === 0 || m === 30)
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    if (m < 30) return `${String(h).padStart(2, "0")}:30`;
    return `${String(h + 1).padStart(2, "0")}:00`;
}

// Funkcja, aby uniknąć takiego samego start === end
function fixTimeRange(start: string, end: string) {
    if (start === end) {
        // Dodaj 30 minut do end
        const [h, m] = start.split(":").map(Number);
        let newH = h;
        let newM = m + 30;
        if (newM >= 60) {
            newH += 1;
            newM -= 60;
        }
        return `${start} - ${String(newH).padStart(2, "0")}:${String(
            newM
        ).padStart(2, "0")}`;
    }
    return `${start} - ${end}`;
}

export async function POST(req: Request) {
    try {
        await initDb();
        const { orders } = await req.json();
        if (!orders || orders.length === 0)
            return NextResponse.json({ ok: false, error: "Brak zleceń" });

        // 🔹 Zamień adresy na współrzędne
        const coords: number[][] = await Promise.all(
            orders.map((o: Order) => getCoords(o.address))
        );

        // 🔹 Pobierz macierz czasów i odległości ORS
        const matrixRes = await fetch(
            "https://api.openrouteservice.org/v2/matrix/driving-car",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: ORS_API_KEY,
                },
                body: JSON.stringify({
                    locations: coords,
                    metrics: ["duration", "distance"],
                }),
            }
        );
        const matrixData = await matrixRes.json();

        // Pobierz start_hour z tabeli settings
        const settings = await sql`SELECT start_hour FROM settings LIMIT 1;`;
        const startHour = settings.rows[0]?.start_hour ?? 10;
        let currentTime = startHour;
        const updatedOrders = [];

        for (let i = 0; i < orders.length; i++) {
            const o = orders[i];
            const travelSeconds = i === 0 ? 0 : matrixData.durations[i - 1][i];
            const travelMinutes = travelSeconds / 60;
            const distanceKm =
                i === 0 ? 0 : matrixData.distances[i - 1][i] / 1000;

            const durationHours =
                o.type === "Transport"
                    ? 0.1
                    : o.type === "Transport + wniesienie"
                    ? 0.6
                    : 2;

            const start = currentTime + 1 + travelMinutes / 60;
            const end = start + durationHours;
            currentTime = end;

            const startStr = floorHalfHour(start);
            const endStr = ceilHalfHour(end);
            const time_range = fixTimeRange(startStr, endStr);

            // 💾 Zapisz do bazy
            await sql`
                UPDATE orders
                SET time_range = ${time_range}
                WHERE id = ${o.id};
            `;

            updatedOrders.push({
                ...o,
                travelTime: travelMinutes,
                distanceKm,
                time_range,
            });
        }

        return NextResponse.json({ ok: true, updated: updatedOrders });
    } catch (err) {
        console.error("Travel calc error:", err);
        return NextResponse.json({ ok: false, error: (err as Error).message });
    }
}
