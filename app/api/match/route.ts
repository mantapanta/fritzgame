import { NextResponse } from "next/server";
import { getCollection } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Tausch-Abgleich zweier Sammlungen.
 *   iGive = meine Doppel ∩ deren fehlende  (ich gebe ab)
 *   iGet  = deren Doppel ∩ meine fehlende  (ich bekomme)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mineId = searchParams.get("mine") || "";
  const theirsId = searchParams.get("theirs") || "";

  const [mine, theirs] = await Promise.all([
    getCollection(mineId),
    getCollection(theirsId),
  ]);

  if (!theirs) {
    return NextResponse.json(
      { error: "Sammlung des Gegenübers nicht gefunden." },
      { status: 404 }
    );
  }
  if (!mine) {
    return NextResponse.json(
      { error: "Eigene Sammlung nicht gefunden." },
      { status: 404 }
    );
  }

  const theirMissing = new Set(theirs.missing);
  const theirDoubles = new Set(theirs.doubles);

  const iGive = mine.doubles.filter((n) => theirMissing.has(n));
  const iGet = mine.missing.filter((n) => theirDoubles.has(n));

  return NextResponse.json({
    iGive,
    iGet,
    mine: { id: mine.id, owner: mine.owner },
    theirs: { id: theirs.id, owner: theirs.owner },
  });
}
