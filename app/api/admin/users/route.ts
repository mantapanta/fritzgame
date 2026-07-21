import { NextResponse } from "next/server";
import { createUser, listUsers } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAdmin(req: Request): NextResponse | null {
  const configured = process.env.ADMIN_SECRET;
  if (!configured) {
    return NextResponse.json(
      { error: "Admin ist nicht konfiguriert (ADMIN_SECRET fehlt)." },
      { status: 503 }
    );
  }
  const provided = req.headers.get("x-admin-secret") || "";
  if (provided !== configured) {
    return NextResponse.json({ error: "Falsches Admin-Passwort." }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const denied = checkAdmin(req);
  if (denied) return denied;
  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const denied = checkAdmin(req);
  if (denied) return denied;
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name : "";
    const user = await createUser(name);
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Anlegen fehlgeschlagen." },
      { status: 500 }
    );
  }
}
