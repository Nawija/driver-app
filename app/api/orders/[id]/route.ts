import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();

  // bezpieczne i pewne wyciągnięcie id
  const { id } = await params;

  // parsujemy body requestu
  let photoUrl: string | undefined;
  try {
    const body = await req.json();
    photoUrl = body.photoUrl;
  } catch {
    photoUrl = undefined;
  }

  // aktualizacja bazy
  if (photoUrl) {
    await sql`
      UPDATE orders
      SET completed = true,
          completed_at = NOW(),
          photo_urls = ARRAY_APPEND(COALESCE(photo_urls, '{}'), ${photoUrl})
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
