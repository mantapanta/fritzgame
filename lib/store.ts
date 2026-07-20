import { randomBytes } from "crypto";

export type Collection = {
  id: string;
  createdAt: number;
  setId: string;
  /** Fehlende Sticker-Nummern. */
  missing: number[];
  /** Doppelte (tauschbare) Sticker-Nummern. */
  doubles: number[];
  /** Optionaler Anzeigename des Sammlers. */
  owner?: string;
};

const PREFIX = "collection:";
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 Tage

function kvEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Fallback-Speicher für lokale Entwicklung ohne KV (nicht persistent!).
const memory = new Map<string, Collection>();

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

  if (kvEnabled()) {
    const { kv } = await import("@vercel/kv");
    await kv.set(PREFIX + collection.id, collection, { ex: TTL_SECONDS });
  } else {
    memory.set(collection.id, collection);
  }

  return collection;
}

export async function getCollection(id: string): Promise<Collection | null> {
  if (!id) return null;

  if (kvEnabled()) {
    const { kv } = await import("@vercel/kv");
    const value = await kv.get<Collection>(PREFIX + id);
    return value ?? null;
  }

  return memory.get(id) ?? null;
}
