import { Redis } from "@upstash/redis";

// Gemeinsamer Upstash-Redis-Client für Store und Auth-Adapter.
// Akzeptiert die Vercel-KV-kompatiblen Namen ODER die nativen Upstash-Namen.
export function redisConfigured(): boolean {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

// Konstruktion darf beim Import nie werfen (sonst bricht der Build), daher
// Platzhalter, falls (noch) keine Env gesetzt ist. Echte Aufrufe scheitern dann
// erst zur Laufzeit – für lokale Entwicklung ohne Redis nutzt der Store einen
// In-Memory-Fallback (siehe lib/store.ts).
export const redis = new Redis({
  url:
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    "https://placeholder.upstash.io",
  token:
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "placeholder-token",
});
