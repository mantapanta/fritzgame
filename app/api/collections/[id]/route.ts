import { NextResponse } from "next/server";
import { getCollection } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const collection = await getCollection(params.id);
  if (!collection) {
    return NextResponse.json(
      { error: "Sammlung nicht gefunden." },
      { status: 404 }
    );
  }
  return NextResponse.json({ collection });
}
