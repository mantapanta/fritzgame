import { randomBytes } from "crypto";

export type Collection = {
  id: string;
  createdAt: number;
  setId: string;
  /** Fehlende Sticker-Codes (z.B. "CZE7"). */
  missing: string[];
  /** Doppelte (tauschbare) Sticker-Codes. */
  doubles: string[];
  /** Optionaler Anzeigename des Sammlers. */
  owner?: string;
};

const PREFIX = "collection:";
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 Tage

// Redis-Zugangsdaten: akzeptiert sowohl die Vercel-KV-kompatiblen Namen als auch
// die nativen Upstash-Namen (je nachdem, was die Vercel-Integration injiziert).
function redisCreds(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

// Fallback-Speicher für lokale Entwicklung ohne Redis (nicht persistent!).
const memory = new Map<string, Collection>();

async function redis() {
  const creds = redisCreds();
  if (!creds) return null;
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url: creds.url, token: creds.token });
}

/** Kurze, URL-freundliche ID (ohne mehrdeutige Zeichen). */
function makeId(): string {
  const alphabet = "23456789abcdefghijkmnpqrstuvwxyz";
  const bytes = randomBytes(8);
  let id = "";
  for (let i = 0; i < bytes.length; i++) {
    id += alphabet[bytes[i] % alphabet.length];
  }
  return id;
}

export async function saveCollection(
  data: Omit<Collection, "id" | "createdAt">
): Promise<Collection> {
  const collection: Collection = {
    id: makeId(),
    createdAt: Date.now(),
    ...data,
  };

  const client = await redis();
  if (client) {
    await client.set(PREFIX + collection.id, collection, { ex: TTL_SECONDS });
  } else {
    memory.set(collection.id, collection);
  }

  return collection;
}

export async function getCollection(id: string): Promise<Collection | null> {
  if (!id) return null;

  const client = await redis();
  if (client) {
    const value = await client.get<Collection>(PREFIX + id);
    return value ?? null;
  }

  return memory.get(id) ?? null;
}
