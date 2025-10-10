import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { del } from "@vercel/blob";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const awaitedParams = await Promise.resolve(params);
  const { id } = awaitedParams;

  const body = await req.json().catch(() => ({}));
  const { photoUrls, time_range } = body;

  try {
    // 🔹 Jeśli przyszło `time_range` – aktualizujemy tylko czas
    if (time_range) {
      await sql`
        UPDATE orders
        SET time_range = ${time_range}
        WHERE id = ${id};
      `;
      return NextResponse.json({ ok: true, updated: "time_range" });
    }

    // 🔹 Jeśli przyszły zdjęcia – kończymy zlecenie + zapisujemy zdjęcia
    if (photoUrls && photoUrls.length > 0) {
      await sql`
        UPDATE orders
        SET completed = true,
            completed_at = NOW(),
            photo_urls = COALESCE(photo_urls, '{}') || ${photoUrls}
        WHERE id = ${id};
      `;
    } else {
      // 🔹 Brak zdjęć — tylko zakończ zlecenie
      await sql`
        UPDATE orders
        SET completed = true,
            completed_at = NOW()
        WHERE id = ${id};
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Błąd PATCH:", err);
    return NextResponse.json(
      { ok: false, error: "Błąd przy aktualizacji zlecenia" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const awaitedParams = await Promise.resolve(params);
  const { id } = awaitedParams;

  try {
    const { rows } = await sql`
      SELECT photo_urls FROM orders WHERE id = ${id};
    `;

    const photoUrls = rows[0]?.photo_urls || [];

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

    await sql`DELETE FROM orders WHERE id = ${id};`;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Błąd DELETE:", err);
    return NextResponse.json(
      { ok: false, error: "Błąd przy usuwaniu zlecenia" },
      { status: 500 }
    );
  }
}
