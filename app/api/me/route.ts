import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserCollectionId } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ authenticated: false });
  }
  const collectionId = await getUserCollectionId(userId);
  return NextResponse.json({
    authenticated: true,
    email: session.user?.email ?? null,
    name: session.user?.name ?? null,
    collectionId,
  });
}
