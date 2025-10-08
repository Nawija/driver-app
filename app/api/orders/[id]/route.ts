import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
)  {

  await initDb();
  const awaitedParams = await Promise.resolve(params);
    const { id } = awaitedParams;
  const { photoUrl } = await req.json().catch(() => ({}));

  if (photoUrl) {
    await sql`
      UPDATE orders
      SET completed = true,
          completed_at = NOW(),
          photo_urls = ARRAY[${photoUrl}]
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
