import { NextResponse } from "next/server";
import { ALBUM, isValidNumber } from "@/lib/album";
import { saveCollection } from "@/lib/store";

export const runtime = "nodejs";

function cleanNumbers(input: unknown): number[] {
  if (!Array.isArray(input)) return [];
  const nums = input
    .map((x) => Number(x))
    .filter((x) => Number.isInteger(x) && isValidNumber(x));
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const missing = cleanNumbers(body?.missing);
    const doubles = cleanNumbers(body?.doubles);
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
