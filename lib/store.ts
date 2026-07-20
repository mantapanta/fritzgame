import { randomBytes } from "crypto";
import { redis, redisConfigured } from "./redis";

export type Collection = {
  id: string;
  createdAt: number;
  updatedAt: number;
  setId: string;
  /** User-ID des Besitzers (bei eingeloggten Sammlungen). */
  ownerUserId?: string;
  /** Fehlende Sticker-Codes (z.B. "CZE7"). */
  missing: string[];
  /** Doppelte (tauschbare) Sticker-Codes. */
  doubles: string[];
  /** Optionaler Anzeigename des Sammlers. */
  owner?: string;
};

const PREFIX = "collection:";
const USER_COL_PREFIX = "usercol:"; // usercol:{userId} -> collectionId

// Fallback-Speicher für lokale Entwicklung ohne Redis (nicht persistent!).
const memColl = new Map<string, Collection>();
const memUserCol = new Map<string, string>();

/** Kurze, URL-freundliche ID (ohne mehrdeutige Zeichen). */
function makeId(): string {
  const alphabet = "23456789abcdefghijkmnpqrstuvwxyz";
  const bytes = randomBytes(8);
  let id = "";
  for (let i = 0; i < bytes.length; i++) id += alphabet[bytes[i] % alphabet.length];
  return id;
}

export async function getCollection(id: string): Promise<Collection | null> {
  if (!id) return null;
  if (redisConfigured()) {
    const value = await redis.get<Collection>(PREFIX + id);
    return value ?? null;
  }
  return memColl.get(id) ?? null;
}

async function putCollection(collection: Collection): Promise<void> {
  if (redisConfigured()) {
    await redis.set(PREFIX + collection.id, collection);
  } else {
    memColl.set(collection.id, collection);
  }
}

export async function getUserCollectionId(
  userId: string
): Promise<string | null> {
  if (!userId) return null;
  if (redisConfigured()) {
    return (await redis.get<string>(USER_COL_PREFIX + userId)) ?? null;
  }
  return memUserCol.get(userId) ?? null;
}

async function setUserCollectionId(userId: string, id: string): Promise<void> {
  if (redisConfigured()) {
    await redis.set(USER_COL_PREFIX + userId, id);
  } else {
    memUserCol.set(userId, id);
  }
}

/**
 * Legt die Sammlung eines eingeloggten Nutzers an ODER aktualisiert sie in-place
 * (gleiche ID/gleicher Link bleibt erhalten).
 */
export async function upsertUserCollection(
  userId: string,
  data: { missing: string[]; doubles: string[]; owner?: string; setId: string }
): Promise<Collection> {
  const existingId = await getUserCollectionId(userId);
  const now = Date.now();

  if (existingId) {
    const existing = await getCollection(existingId);
    const collection: Collection = {
      id: existingId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      ownerUserId: userId,
      setId: data.setId,
      missing: data.missing,
      doubles: data.doubles,
      owner: data.owner ?? existing?.owner,
    };
    await putCollection(collection);
    return collection;
  }

  const collection: Collection = {
    id: makeId(),
    createdAt: now,
    updatedAt: now,
    ownerUserId: userId,
    setId: data.setId,
    missing: data.missing,
    doubles: data.doubles,
    owner: data.owner,
  };
  await putCollection(collection);
  await setUserCollectionId(userId, collection.id);
  return collection;
}
