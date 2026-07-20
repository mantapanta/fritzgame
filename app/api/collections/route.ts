import { NextResponse } from "next/server";
import { ALBUM, codeSort, isValidCode, normalizeCode } from "@/lib/album";
import { saveCollection } from "@/lib/store";

export const runtime = "nodejs";

function cleanCodes(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const codes = input
    .map((x) => normalizeCode(String(x)))
    .filter((c) => isValidCode(c));
  return Array.from(new Set(codes)).sort(codeSort);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const missing = cleanCodes(body?.missing);
    const doubles = cleanCodes(body?.doubles);
    const owner =
      typeof body?.owner === "string" && body.owner.trim()
        ? String(body.owner).trim().slice(0, 40)
        : undefined;

    const collection = await saveCollection({
      setId: ALBUM.setId,
      missing,
      doubles,
      owner,
    });

    return NextResponse.json({ id: collection.id, collection });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Speichern fehlgeschlagen." },
      { status: 500 }
    );
  }
}
