"use client";

// Client-seitige Hilfsfunktionen (Browser).
// Identität/Besitz kommt jetzt aus der Login-Session (nicht mehr aus localStorage).

const MISSING_KEY = "fritzswap.captureMissing";

export function setCaptureMissing(codes: string[]) {
  try {
    sessionStorage.setItem(MISSING_KEY, JSON.stringify(codes));
  } catch {}
}

export function getCaptureMissing(): string[] {
  try {
    const raw = sessionStorage.getItem(MISSING_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
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
  if (/^[a-z0-9]{6,20}$/i.test(s)) return s;
  return null;
}
