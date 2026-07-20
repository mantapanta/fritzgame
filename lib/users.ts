import { randomBytes } from "crypto";
import { redis, redisConfigured } from "./redis";

export type User = {
  code: string;
  name: string;
  createdAt: number;
};

const U_PREFIX = "user:"; // user:{CODE} -> User
const U_INDEX = "users:index"; // Set aller Codes

// Buchstaben ohne leicht verwechselbare (kein I/O).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LEN = 6;

// In-Memory-Fallback für lokale Entwicklung ohne Redis.
const memUsers = new Map<string, User>();

export function normalizeUserCode(raw: string): string {
  return (raw || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, CODE_LEN);
}

function randomCode(): string {
  const bytes = randomBytes(CODE_LEN);
  let code = "";
  for (let i = 0; i < CODE_LEN; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return code;
}

export async function getUserByCode(code: string): Promise<User | null> {
  const c = normalizeUserCode(code);
  if (c.length !== CODE_LEN) return null;
  if (redisConfigured()) {
    return (await redis.get<User>(U_PREFIX + c)) ?? null;
  }
  return memUsers.get(c) ?? null;
}

export async function createUser(name: string): Promise<User> {
  const clean = (name || "").trim().slice(0, 60) || "Sammler";

  // Eindeutigen Code finden.
  let code = "";
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = randomCode();
    const exists = await getUserByCode(candidate);
    if (!exists) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new Error("Konnte keinen freien Code erzeugen.");

  const user: User = { code, name: clean, createdAt: Date.now() };
  if (redisConfigured()) {
    await redis.set(U_PREFIX + code, user);
    await redis.sadd(U_INDEX, code);
  } else {
    memUsers.set(code, user);
  }
  return user;
}

export async function listUsers(): Promise<User[]> {
  let codes: string[] = [];
  if (redisConfigured()) {
    codes = (await redis.smembers(U_INDEX)) as string[];
  } else {
    codes = Array.from(memUsers.keys());
  }
  const users = await Promise.all(codes.map((c) => getUserByCode(c)));
  return users
    .filter((u): u is User => Boolean(u))
    .sort((a, b) => b.createdAt - a.createdAt);
}
