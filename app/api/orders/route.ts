//api/orders/route.ts
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function GET() {
    await initDb();
    const result = await sql`SELECT * FROM orders ORDER BY created_at DESC`;

    const mapped = result.rows.map((o) => {
        if (o.coords) {
            // coords w formacie [lat, lon] dla Leaflet
            return { ...o, coords: [o.coords.y, o.coords.x] };
        }
        return o;
    });

    return NextResponse.json(mapped);
}


export async function POST(req: Request) {
    await initDb();
    const { clientName, phoneNumber, description, type, address } =
        await req.json();

    if (!clientName || !type || !address || !phoneNumber) {
        return NextResponse.json({ ok: false, error: "Missing fields" });
    }

    await sql`
    INSERT INTO orders (client_name, phone_number, description, type, address)
    VALUES (${clientName}, ${phoneNumber}, ${description}, ${type}, ${address});
  `;

    return NextResponse.json({ ok: true });
}

// 🟥 Usuwanie wszystkich zleceń
export async function DELETE() {
    await initDb();
    try {
        await sql`DELETE FROM orders;`;
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({
            ok: false,
            error: "Błąd przy usuwaniu wszystkich zleceń",
        });
    }
}
