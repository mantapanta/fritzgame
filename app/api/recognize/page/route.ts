import { NextResponse } from "next/server";
import { pageByNo } from "@/lib/album";
import { recognizePage } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pageNo = Number(body?.pageNo);
    const images: unknown = body?.images;

    const page = pageByNo(pageNo);
    if (!page) {
      return NextResponse.json({ error: "Unbekannte Seite." }, { status: 400 });
    }
    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Kein Bild übermittelt." },
        { status: 400 }
      );
    }

    const result = await recognizePage(page, images as string[]);
    return NextResponse.json({
      pageNo,
      label: page.label,
      slotCount: page.slots.length,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erkennung fehlgeschlagen." },
      { status: 500 }
    );
  }
}
