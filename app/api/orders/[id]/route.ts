import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const awaitedParams = await Promise.resolve(params);
  const { id } = awaitedParams;
  const { photoUrls } = await req.json().catch(() => ({}));

  if (photoUrls && photoUrls.length > 0) {
    await sql`
      UPDATE orders
      SET completed = true,
          completed_at = NOW(),
          photo_urls = COALESCE(photo_urls, '{}') || ${photoUrls}
      WHERE id = ${id};
    `;
  } else {
    await sql`
      UPDATE orders
      SET completed = true,
          completed_at = NOW()
      WHERE id = ${id};
    `;
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const awaitedParams = await Promise.resolve(params);
  const { id } = awaitedParams;

  await sql`DELETE FROM orders WHERE id = ${id};`;

  return NextResponse.json({ ok: true });
}