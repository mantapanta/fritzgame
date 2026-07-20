"use client";

// Client-seitige Hilfsfunktionen (Browser).

const MY_ID_KEY = "fritzswap.myId";
const MISSING_KEY = "fritzswap.captureMissing";

export function saveMyId(id: string) {
  try {
    localStorage.setItem(MY_ID_KEY, id);
  } catch {}
}

export function getMyId(): string | null {
  try {
    return localStorage.getItem(MY_ID_KEY);
  } catch {
    return null;
  }
}

export function setCaptureMissing(numbers: number[]) {
  try {
    sessionStorage.setItem(MISSING_KEY, JSON.stringify(numbers));
  } catch {}
}

export function getCaptureMissing(): number[] {
  try {
    const raw = sessionStorage.getItem(MISSING_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function clearCaptureMissing() {
  try {
    sessionStorage.removeItem(MISSING_KEY);
  } catch {}
}

/** Extrahiert eine Sammlungs-ID aus einer eingefügten URL oder rohem ID-String. */
export function parseCollectionId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const urlMatch = /\/collection\/([a-z0-9]+)/i.exec(s);
  if (urlMatch) return urlMatch[1];
  const theirsMatch = /[?&]theirs=([a-z0-9]+)/i.exec(s);
  if (theirsMatch) return theirsMatch[1];
  // Reiner ID-String?
  if (/^[a-z0-9]{6,20}$/i.test(s)) return s;
  return null;
}
