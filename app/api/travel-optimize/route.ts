import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

const ORS_API_KEY = process.env.ORS_API_KEY!;

if (!ORS_API_KEY) {
    console.error("ORS_API_KEY is not set in environment variables.");
}

interface Order {
    id: number;
    address: string;
    type: string;
}

interface UpdatedOrder extends Order {
    coords: [number, number];
    travelTime: number;
    distanceKm: number;
    time_range: string;
}

interface InputOrder {
    id: number;
    client_name?: string;
    phone_number?: string;
    time_range?: string;
    description?: string;
    type: string;
    address: string;
    completed?: boolean;
    completed_at?: string;
    photo_urls?: string[];
    coords?: [number, number];
    travelTime?: number;
}

const WAREHOUSE_ADDRESS = "Starowiejska 10, 08-110 Siedlce";

/**
 * 🗺️ Geokodowanie (tylko Polska + okolice Siedlec)
 */
async function getCoords(address: string) {
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(
        address
    )}&boundary.country=POL&focus.point.lon=22.3&focus.point.lat=52.2&size=1`;

    const res = await fetch(url);
    const data = await res.json();
    if (!data.features || data.features.length === 0)
        throw new Error(`Nie znaleziono współrzędnych: ${address}`);

    const [lon, lat] = data.features[0].geometry.coordinates;

    // sprawdź, czy w rejonie Siedlec
    if (lon < 21 || lon > 23 || lat < 51.5 || lat > 52.5) {
        console.warn(`⚠️ ${address} wygląda na poza Siedlcami (${lon},${lat})`);
        // spróbuj ponownie z dopiskiem "Siedlce"
        const retryUrl = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(
            `${address}, Siedlce`
        )}&boundary.country=POL&focus.point.lon=22.3&focus.point.lat=52.2&size=1`;
        const retryRes = await fetch(retryUrl);
        const retryData = await retryRes.json();
        if (retryData.features?.length > 0)
            return retryData.features[0].geometry.coordinates;
    }

    return [lon, lat];
}

/**
 * 🕒 Pomocnicze funkcje czasu
 */
function floorHalfHour(t: number) {
    const h = Math.floor(t);
    const m = Math.round((t - h) * 60);
    if (m < 30) return `${String(h).padStart(2, "0")}:00`;
    return `${String(h).padStart(2, "0")}:30`;
}

function ceilHalfHour(t: number) {
    const h = Math.floor(t);
    const m = Math.round((t - h) * 60);
    if (m === 0 || m === 30)
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    if (m < 30) return `${String(h).padStart(2, "0")}:30`;
    return `${String(h + 1).padStart(2, "0")}:00`;
}

function fixTimeRange(start: string, end: string) {
    if (start === end) {
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

interface ORSStep {
    type: "start" | "end" | "job";
    id?: number;
    location_index: number;
    arrival: number;
    duration: number;
    distance: number;
}

interface ORSResult {
    routes?: {
        steps: ORSStep[];
    }[];
}
/**
 * 🚛 Główna logika
 */
export async function POST(req: Request) {
    try {
        await initDb();
        const { orders } = await req.json();
        if (!orders?.length)
            return NextResponse.json({ ok: false, error: "Brak zleceń" });

        // 1️⃣ Geokoduj magazyn i adresy
        const warehouseCoords = await getCoords(WAREHOUSE_ADDRESS);
        const coords: number[][] = [];
        const validOrders: Order[] = [];
        // map of original input orders by id so we can return full objects
        const inputById = new Map<number, InputOrder>();
        for (const o of orders) inputById.set(o.id, o as InputOrder);

        for (const o of orders) {
            try {
                const c = await getCoords(o.address);
                coords.push(c);
                validOrders.push(o);
            } catch (e) {
                console.error(`❌ Błąd geokodowania dla ${o.address}:`, e);
            }
        }

        if (validOrders.length === 0)
            throw new Error("Brak poprawnych adresów do optymalizacji");

        // 2️⃣ Pobierz godzinę startu z bazy
        const settings = await sql`SELECT start_hour FROM settings LIMIT 1;`;
        const startHour = settings.rows[0]?.start_hour ?? 10;

        // 3️⃣ Przygotuj dane do ORS Optimization
        const vehicle = {
            id: 1,
            profile: "driving-car",
            start: warehouseCoords,
            end: warehouseCoords,
        };

        const jobs = validOrders.map((o, i) => ({
            id: o.id,
            service: 300,
            location: coords[i],
        }));

        // 4️⃣ Zapytanie do API
        const resOpt = await fetch(
            "https://api.openrouteservice.org/optimization",
            {
                method: "POST",
                headers: {
                    Authorization: ORS_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jobs,
                    vehicles: [vehicle],
                }),
            }
        );

        const result: ORSResult = await resOpt.json();

        // 5️⃣ Sprawdź wynik lub fallback
        if (!result.routes || result.routes.length === 0) {
            console.warn(
                "⚠️ Brak wyniku optymalizacji — fallback na prostą kolejność"
            );
            validOrders.sort((a, b) =>
                a.address.localeCompare(b.address, "pl", {
                    sensitivity: "base",
                })
            );
        }

        const orderedIds =
            result.routes?.[0]?.steps
                ?.filter((s) => s.type === "job")
                ?.map((s) => s.id) || validOrders.map((o) => o.id);

        const orderedOrders = orderedIds
            .map((id) => validOrders.find((o) => o.id === id))
            .filter(Boolean) as Order[];

        console.log("🚚 Kolejność zoptymalizowana:", orderedIds);

        // 6️⃣ Oblicz trasę czasowo (macierz)
        const matrixRes = await fetch(
            "https://api.openrouteservice.org/v2/matrix/driving-car",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: ORS_API_KEY,
                },
                body: JSON.stringify({
                    locations: [warehouseCoords, ...coords],
                    metrics: ["duration", "distance"],
                }),
            }
        );

        const matrixData = await matrixRes.json();
        // 7️⃣ Harmonogram
        // Create a map from order id -> index in the matrix locations array
        // locations = [warehouseCoords, ...coords] so first order coords = index 1
        const idToMatrixIndex = new Map<number, number>();
        for (let i = 0; i < validOrders.length; i++) {
            idToMatrixIndex.set(validOrders[i].id, i + 1);
        }

        let currentTime = startHour + 0.5;
        const updatedOrders: UpdatedOrder[] = [];

        for (let i = 0; i < orderedOrders.length; i++) {
            const o = orderedOrders[i];
            const toIndex = idToMatrixIndex.get(o.id)!; // location index in matrix
            const fromIndex =
                i === 0 ? 0 : idToMatrixIndex.get(orderedOrders[i - 1].id)!;

            const travelSeconds =
                matrixData.durations?.[fromIndex]?.[toIndex] ?? 0;
            const travelMinutes = travelSeconds / 60;

            const distanceKm = [
                "Transport",
                "Transport + wniesienie",
                "Transport + wniesienie + montaż",
            ].includes(o.type)
                ? 0
                : (matrixData.distances?.[fromIndex]?.[toIndex] ?? 0) / 1000;

            const durationHours =
                o.type === "Transport"
                    ? 0.5
                    : o.type === "Transport + wniesienie"
                    ? 1
                    : 1.7;

            const start = currentTime + travelMinutes / 60;
            const end = start + durationHours;
            currentTime = end;

            const startStr = floorHalfHour(start);
            const endStr = ceilHalfHour(end);
            const time_range = fixTimeRange(startStr, endStr);

            await sql`
    UPDATE orders
    SET time_range = ${time_range}
    WHERE id = ${o.id};
  `;

            const coordPair = coords[toIndex - 1];

            const orig = inputById.get(o.id) || o;
            updatedOrders.push({
                ...orig,
                id: o.id,
                address: o.address,
                type: o.type,
                coords: [coordPair[1], coordPair[0]],
                travelTime: travelMinutes,
                distanceKm,
                time_range,
            });
        }

        // Validate coords and fallback to original input coords if necessary
        const validated = updatedOrders.map((u) => {
            const ok =
                Array.isArray(u.coords) &&
                u.coords.length === 2 &&
                Number.isFinite(u.coords[0]) &&
                Number.isFinite(u.coords[1]);
            if (!ok) {
                const orig = inputById.get(u.id);
                if (orig?.coords && Array.isArray(orig.coords)) {
                    return { ...u, coords: orig.coords };
                }
            }
            return u;
        });

        console.log(
            `Optimization result: updated ${validated.length} orders. sample:`,
            validated.slice(0, 3)
        );

        return NextResponse.json({
            ok: true,
            warehouse: WAREHOUSE_ADDRESS,
            updated: validated,
        });
    } catch (err) {
        console.error("Optimization error:", err);
        return NextResponse.json({
            ok: false,
            error: (err as Error).message,
        });
    }
}
