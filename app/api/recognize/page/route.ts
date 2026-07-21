import { NextResponse } from "next/server";
import { recognizeAlbumPhoto } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const images: unknown = body?.images;

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Kein Foto da. Mach erst ein Foto!" },
        { status: 400 }
      );
    }

    const result = await recognizeAlbumPhoto(images as string[]);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("recognize failed:", err);
    const msg = err?.friendly
      ? err.message
      : "Das hat nicht geklappt. Versuch es gleich nochmal!";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
