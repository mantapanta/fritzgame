import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCollection, getUserCollectionId } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tausch-Abgleich zwischen der eigenen (eingeloggten) Sammlung und der per Link
 * angegebenen Sammlung des Gegenübers.
 *   iGive = meine Doppel ∩ deren fehlende  (ich gebe ab)
 *   iGet  = deren Doppel ∩ meine fehlende  (ich bekomme)
 */
export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const theirsId = searchParams.get("theirs") || "";

  const mineId = await getUserCollectionId(userId);
  if (!mineId) {
    return NextResponse.json(
      { error: "Du hast noch keine eigene Sammlung erfasst." },
      { status: 409 }
    );
  }

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
  if (theirs.id === mine.id) {
    return NextResponse.json(
      { error: "Das ist deine eigene Sammlung." },
      { status: 400 }
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
