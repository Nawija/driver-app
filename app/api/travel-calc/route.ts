import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function POST(req: Request) {
    await initDb();
    const { orders } = await req.json();

    if (!orders || orders.length < 2) {
        return NextResponse.json({ error: "Za mało adresów" }, { status: 400 });
    }

    const apiKey = process.env.ORS_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "Brak klucza ORS_API_KEY" },
            { status: 500 }
        );
    }

    try {
        // 1️⃣ Zgeokoduj wszystkie adresy naraz
        const geocoded = await Promise.all(
            orders.map(async (o: any) => {
                const geoUrl = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(
                    o.address
                )}`;
                const res = await fetch(geoUrl);
                const data = await res.json();
                const coords = data?.features?.[0]?.geometry?.coordinates;
                return { ...o, lng: coords?.[0], lat: coords?.[1] };
            })
        );

        // 2️⃣ Oblicz travelTime między kolejnymi punktami
        const updated = [];

        for (let i = 0; i < geocoded.length - 1; i++) {
            const start = geocoded[i];
            const end = geocoded[i + 1];

            if (!start.lng || !end.lng) {
                updated.push({ ...start, travelTime: 20 }); // fallback
                continue;
            }

            const routeRes = await fetch(
                "https://api.openrouteservice.org/v2/directions/driving-car",
                {
                    method: "POST",
                    headers: {
                        Authorization: apiKey,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        coordinates: [
                            [start.lng, start.lat],
                            [end.lng, end.lat],
                        ],
                    }),
                }
            );

            const routeData = await routeRes.json();
            const travelMinutes = routeData?.routes?.[0]?.summary?.duration
                ? routeData.routes[0].summary.duration / 60
                : 20;

            updated.push({ ...start, travelTime: travelMinutes });
        }

        // ostatni punkt zawsze 0
        updated.push({ ...geocoded[geocoded.length - 1], travelTime: 0 });

        // 3️⃣ Zapisz wszystkie travelTime do bazy (jeden raz)
        for (const o of updated) {
            await sql`
        UPDATE orders
        SET travel_time = ${o.travelTime}
        WHERE id = ${o.id};
      `;
        }

        return NextResponse.json({ ok: true, updated });
    } catch (err) {
        console.error("Travel calc error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
