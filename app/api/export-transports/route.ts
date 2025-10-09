
import JSZip from "jszip";
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export const maxDuration = 300; // dla dużych plików
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows: orders } = await sql`SELECT * FROM orders ORDER BY id ASC;`;

    if (!orders.length) {
      return NextResponse.json({ error: "Brak zleceń do eksportu." }, { status: 404 });
    }

    const zip = new JSZip();

    for (const [index, o] of orders.entries()) {
      const folderName = `${String(index + 1).padStart(2, "0")}_${sanitize(
        o.client_name
      )}`;

      const folder = zip.folder(folderName);
      if (!folder) continue;

      const info = [
        `Klient: ${o.client_name}`,
        `Telefon: ${o.phone_number}`,
        `Adres: ${o.address}`,
        `Godziny: ${o.time_range}`,
        `Rodzaj: ${o.type}`,
        `Opis: ${o.description || "Brak"}`,
        `Zrealizowano: ${o.completed ? "Tak" : "Nie"}`,
        o.completed_at ? `Czas realizacji: ${new Date(o.completed_at).toLocaleString("pl-PL")}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      folder.file("info.txt", info);

      // pobierz zdjęcia z blobów
      if (Array.isArray(o.photo_urls) && o.photo_urls.length > 0) {
        for (const [i, url] of o.photo_urls.entries()) {
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const arrayBuffer = await blob.arrayBuffer();
            folder.file(`photo_${i + 1}.jpg`, arrayBuffer);
          } catch (err) {
            console.error("❌ Błąd przy pobieraniu zdjęcia:", url, err);
          }
        }
      }
    }

const zipArrayBuffer = await zip.generateAsync({ type: "arraybuffer" });

    const now = new Date().toISOString().split("T")[0];

    return new NextResponse(zipArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="transporty_${now}.zip"`,
      },
    });
  } catch (err) {
    console.error("❌ Błąd eksportu:", err);
    return NextResponse.json({ error: "Błąd eksportu ZIP." }, { status: 500 });
  }
}

function sanitize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}
