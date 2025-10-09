//api/orders/[id]/route.ts
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { del } from "@vercel/blob"; // ✅ dodajemy

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

  try {
    // ✅ najpierw pobieramy photo_urls z bazy
    const { rows } = await sql`
      SELECT photo_urls FROM orders WHERE id = ${id};
    `;

    const photoUrls = rows[0]?.photo_urls || [];

    // ✅ jeśli są zdjęcia – usuwamy je z Blob
    if (Array.isArray(photoUrls) && photoUrls.length > 0) {
      for (const url of photoUrls) {
        try {
          await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
          console.log("🗑️ Usunięto z blob:", url);
        } catch (err) {
          console.error("❌ Błąd przy usuwaniu z blob:", err);
        }
      }
    }

    // ✅ dopiero teraz usuwamy rekord z bazy
    await sql`DELETE FROM orders WHERE id = ${id};`;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Błąd DELETE:", err);
    return NextResponse.json({ ok: false, error: "Błąd przy usuwaniu zlecenia" }, { status: 500 });
  }
}
