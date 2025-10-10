// app/api/settings/route.ts
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initDb } from "@/lib/db";

export async function GET() {
    await initDb();
    const result = await sql`SELECT * FROM settings LIMIT 1;`;
    return NextResponse.json(result.rows[0]);
}

export async function POST(req: Request) {
    await initDb();
    const { start_hour, page_title } = await req.json();

    await sql`
    UPDATE settings
    SET start_hour = ${start_hour}, page_title = ${page_title}
    WHERE id = 1;
  `;

    return NextResponse.json({ ok: true });
}
