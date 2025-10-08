import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { ok: false, error: "Brak pliku" },
                { status: 400 }
            );
        }

        console.log(
            "🟢 BLOB TOKEN:",
            process.env.BLOB_READ_WRITE_TOKEN ? "OK" : "MISSING"
        );

        const blob = await put(file.name, file, {
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: true,
        });

        return NextResponse.json({ ok: true, url: blob.url });
    } catch {
        console.error("❌ Upload error:");
        
    }
}
