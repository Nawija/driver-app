//api/orders/route.ts
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function GET() {
    await initDb();
    const result = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
    return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
  await initDb();
  const { clientName, phoneNumber, description, type, address } = await req.json();

  if (!clientName  || !type || !address || !phoneNumber) {
    return NextResponse.json({ ok: false, error: "Missing fields" });
  }

  await sql`
    INSERT INTO orders (client_name, phone_number, description, type, address)
    VALUES (${clientName}, ${phoneNumber}, ${description}, ${type}, ${address});
  `;

  return NextResponse.json({ ok: true });
}

