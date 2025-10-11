import { put, PutBlobResult } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "edge";

// Typ zwracany przez naszą funkcję uploadFile
interface UploadedBlob {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

type UploadError = Error;

async function uploadFile(file: File, retries = 2): Promise<UploadedBlob> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing");
  }

  if (!file || file.size === 0) {
    throw new Error("Plik jest pusty lub nie został przesłany");
  }

  try {
    const result: PutBlobResult = await put(file.name, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true,
    });

    // Tworzymy własny obiekt z potrzebnymi polami
    const blob: UploadedBlob = {
      url: result.url,
      name: file.name,
      size: file.size,
      mimeType: file.type,
    };

    return blob;
  } catch (err) {
    if (retries > 0) {
      console.warn("Upload failed, retrying...", err);
      return uploadFile(file, retries - 1);
    }
    throw err as UploadError;
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Brak pliku" },
        { status: 400 }
      );
    }

    const blob = await uploadFile(file);

    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    console.error("❌ Upload error:", err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
