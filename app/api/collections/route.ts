import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ALBUM, codeSort, isValidCode, normalizeCode } from "@/lib/album";
import { upsertUserCollection } from "@/lib/store";

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
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Melde dich zuerst an!" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const missing = cleanCodes(body?.missing);
    const doubles = cleanCodes(body?.doubles);
    const owner =
      (typeof body?.owner === "string" && body.owner.trim()) ||
      session.user?.name ||
      session.user?.email ||
      undefined;

    const collection = await upsertUserCollection(userId, {
      setId: ALBUM.setId,
      missing,
      doubles,
      owner: owner ? String(owner).slice(0, 60) : undefined,
    });

    return NextResponse.json({ id: collection.id, collection });
  } catch (err: any) {
    console.error("save collection failed:", err);
    return NextResponse.json(
      { error: "Speichern hat nicht geklappt. Versuch es nochmal!" },
      { status: 500 }
    );
  }
}
