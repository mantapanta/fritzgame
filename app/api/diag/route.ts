import { NextResponse } from "next/server";
import { MODEL, getGeminiKey } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Diagnose-Endpunkt: prüft in der laufenden Umgebung, ob der Gemini-Key
 * korrekt gesetzt und bei Google gültig ist, und ob der Redis-Speicher
 * verbunden ist. Gibt KEINEN Klartext-Key aus (nur Länge/Flags).
 * Nach dem Debuggen kann die Datei entfernt werden.
 */
export async function GET() {
  const raw = process.env.GEMINI_API_KEY ?? "";
  const key = getGeminiKey();

  const gemini = {
    present: raw.length > 0,
    rawLength: raw.length,
    cleanedLength: key.length,
    hadSurroundingQuotes: /^['"]|['"]$/.test(raw.trim()),
    hadWhitespace: raw !== raw.trim() || /\s/.test(raw.trim()),
    startsWithAIza: key.startsWith("AIza"),
    model: MODEL,
  };

  // Echter Live-Check gegen Google (server-seitig, wo Egress zu Google erlaubt ist).
  let live: {
    ok: boolean;
    status: number | null;
    reason: string | null;
    message: string | null;
  } = { ok: false, status: null, reason: null, message: null };

  // Verfügbare Flash-Modelle (unterstützen generateContent) für dieses Projekt.
  let availableFlashModels: string[] = [];

  if (key) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
        key
      )}`;
      const res = await fetch(url, { cache: "no-store" });
      let reason: string | null = null;
      let message: string | null = null;
      if (!res.ok) {
        try {
          const body: any = await res.json();
          reason = body?.error?.status ?? body?.error?.details?.[0]?.reason ?? null;
          message = body?.error?.message ?? null;
        } catch {
          /* ignore parse errors */
        }
      } else {
        try {
          const body: any = await res.json();
          const models: any[] = Array.isArray(body?.models) ? body.models : [];
          availableFlashModels = models
            .filter((m) =>
              Array.isArray(m?.supportedGenerationMethods)
                ? m.supportedGenerationMethods.includes("generateContent")
                : true
            )
            .map((m) => String(m?.name || "").replace(/^models\//, ""))
            .filter((n) => n.includes("flash"));
        } catch {
          /* ignore parse errors */
        }
      }
      live = { ok: res.ok, status: res.status, reason, message };
    } catch (e: any) {
      live = { ok: false, status: null, reason: "FETCH_ERROR", message: e?.message ?? null };
    }
  } else {
    live.reason = "NO_KEY";
  }

  const storage = {
    redisConfigured: Boolean(
      (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
        (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ),
    envPresent: [
      "KV_REST_API_URL",
      "KV_REST_API_TOKEN",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ].filter((n) => Boolean(process.env[n])),
  };

  return NextResponse.json({
    gemini,
    geminiLiveCheck: live,
    availableFlashModels,
    storage,
  });
}
