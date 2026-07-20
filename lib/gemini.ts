import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  STICKERS_PER_TEAM,
  isValidCode,
  normalizeCode,
  teamByName,
} from "./album";

export const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

/**
 * Liest den API-Key und entfernt häufige Copy-&-Paste-Fehler: umschließende
 * Anführungszeichen sowie Leerzeichen/Zeilenumbrüche.
 */
export function getGeminiKey(): string {
  return (process.env.GEMINI_API_KEY || "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\s+/g, "") // API-Keys enthalten nie Whitespace (z.B. Zeilenumbruch beim Kopieren)
    .trim();
}

function client(): GoogleGenerativeAI {
  const key = getGeminiKey();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY ist nicht gesetzt. Bitte in den Umgebungsvariablen hinterlegen (siehe .env.example)."
    );
  }
  return new GoogleGenerativeAI(key);
}

/** Zerlegt einen data:-URL oder rohen Base64-String in {data, mimeType}. */
export function parseImage(input: string): { data: string; mimeType: string } {
  const match = /^data:(.+?);base64,(.*)$/s.exec(input.trim());
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: "image/jpeg", data: input.trim() };
}

/** Extrahiert das erste JSON aus einer Modellantwort (robust gegen Codeblöcke). */
function extractJson(text: string): any {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Konnte keine gültige JSON-Antwort vom Modell lesen.");
  }
}

async function runVision(prompt: string, images: string[]): Promise<any> {
  const model = client().getGenerativeModel({
    model: MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0 },
  });

  const parts: any[] = [{ text: prompt }];
  for (const img of images) {
    const { data, mimeType } = parseImage(img);
    parts.push({ inlineData: { data, mimeType } });
  }

  const result = await model.generateContent(parts);
  return extractJson(result.response.text());
}

function dedupeSorted(codes: string[]): string[] {
  return Array.from(new Set(codes));
}

export type AlbumRecognition = {
  /** Fehlende Sticker-Codes (leere Plätze auf den Fotos). */
  missing: string[];
  /** Auf den Fotos erkannte Team-Codes (für Fortschritt „Teams gescannt"). */
  seenTeams: string[];
  /** Hinweise/Warnungen (z.B. Land nicht sicher erkannt). */
  notes: string[];
};

/**
 * Album-Foto(s): Erkennt je Seite das gezeigte Land bzw. den Spezialabschnitt und
 * die Nummern der LEEREN Klebeplätze. Baut daraus die fehlenden Sticker-Codes.
 *
 * Im echten Album steht in Teamseiten meist nur die Nummer (1–20) im leeren Feld,
 * das Land nur in der Überschrift — daher lesen wir Land + leere Nummern getrennt.
 */
export async function recognizeAlbumPhoto(
  images: string[]
): Promise<AlbumRecognition> {
  const prompt = `Du analysierst Fotos aus einem Panini-Sammelalbum zur FIFA Fußball-WM 2026.
Jede Seite gehört entweder zu EINER Nationalmannschaft (Teamseite) oder ist eine SPEZIALSEITE (Panini-Logo, Turnier-Embleme, Maskottchen, Pokal, FIFA-Museum).
Ein Klebeplatz ist BELEGT, wenn dort ein Sticker klebt. Er ist LEER, wenn nur der bedruckte Platzhalter mit Nummer/Code sichtbar ist (kein Sticker).

Aufgabe für JEDES Foto:
1. Erkenne, zu welchem Land die Seite gehört (englischer Ländername), oder ob es eine Spezialseite ist.
2. Lies die NUMMERN aller LEEREN Klebeplätze.
   - Auf Teamseiten sind die Plätze 1 bis 20 nummeriert -> gib die leeren Nummern als Zahlen an.
   - Auf Spezialseiten tragen die Plätze Codes wie "00" oder "FWC5" -> gib diese als Strings an.

Gib ausschließlich JSON in genau diesem Format zurück (ein Eintrag pro Foto):
{"pages":[
  {"country":"<englischer Ländername oder null>","special":<true|false>,"emptyNumbers":[<leere Zahlen auf Teamseiten>],"emptyCodes":[<leere Codes auf Spezialseiten, z.B. "FWC5","00">]}
]}
Wenn alle Plätze belegt sind, gib leere Listen zurück. Rate nicht bei unleserlichen Stellen.`;

  const json = await runVision(prompt, images);
  const pages: any[] = Array.isArray(json?.pages) ? json.pages : [];

  const missing: string[] = [];
  const seenTeams: string[] = [];
  const notes: string[] = [];

  for (const page of pages) {
    const isSpecial = page?.special === true;
    const emptyNumbers: number[] = Array.isArray(page?.emptyNumbers)
      ? page.emptyNumbers.map((x: unknown) => Number(x)).filter((x: number) => Number.isInteger(x))
      : [];
    const emptyCodes: string[] = Array.isArray(page?.emptyCodes)
      ? page.emptyCodes.map((x: unknown) => String(x))
      : [];

    // Spezialseite: Codes direkt übernehmen.
    for (const raw of emptyCodes) {
      const c = normalizeCode(raw);
      if (isValidCode(c)) missing.push(c);
    }

    // Teamseite: Land -> Code-Präfix, dann Nummern anhängen.
    const country: string | null =
      typeof page?.country === "string" ? page.country : null;
    const team = country ? teamByName(country) : undefined;

    if (!isSpecial && emptyNumbers.length > 0) {
      if (!team) {
        notes.push(
          country
            ? `Land „${country}" konnte keinem Team zugeordnet werden.`
            : "Land einer Teamseite nicht erkannt."
        );
        continue;
      }
      for (const n of emptyNumbers) {
        if (n >= 1 && n <= STICKERS_PER_TEAM) missing.push(`${team.code}${n}`);
      }
    }

    if (team) seenTeams.push(team.code);
  }

  return {
    missing: dedupeSorted(missing),
    seenTeams: dedupeSorted(seenTeams),
    notes,
  };
}

export type SparesRecognition = {
  /** Erkannte doppelte Sticker-Codes. */
  doubles: string[];
  /** Roh-Anzahl gelesener Sticker (inkl. nicht zuordenbarer). */
  readCount: number;
  notes: string[];
};

/**
 * Doppel-Stapel: liest lose Sticker aus. Jeder Sticker trägt vorne eine Nummer
 * und gehört zu einem Land/Abschnitt (am Bild erkennbar).
 */
export async function recognizeSpares(
  images: string[]
): Promise<SparesRecognition> {
  const prompt = `Auf den Fotos liegen lose Panini-Sticker der FIFA WM 2026 ausgebreitet (Doppelte zum Tauschen).
Jeder Sticker trägt vorne eine Nummer; Team-Sticker gehören zu einem Land (Wappen/Trikot/Name erkennbar), Spezialsticker tragen Codes wie "00" oder "FWC5".
Lies ALLE klar erkennbaren Sticker aus. Für jeden Sticker:
- Team-Sticker: gib das Land (englischer Name) und die Nummer (1–20) an.
- Spezialsticker: gib den Code an (z.B. "FWC5","00").

Gib ausschließlich JSON in genau diesem Format zurück:
{"stickers":[
  {"country":"<englischer Ländername oder null>","number":<Zahl oder null>,"code":"<Spezialcode oder null>"}
]}
Wenn eine Nummer mehrfach vorkommt, liste sie mehrfach. Rate nicht bei unleserlichen Stickern.`;

  const json = await runVision(prompt, images);
  const stickers: any[] = Array.isArray(json?.stickers) ? json.stickers : [];

  const doubles: string[] = [];
  const notes: string[] = [];
  let readCount = 0;

  for (const s of stickers) {
    readCount++;
    const code = typeof s?.code === "string" ? normalizeCode(s.code) : "";
    if (code && isValidCode(code)) {
      doubles.push(code);
      continue;
    }
    const country: string | null =
      typeof s?.country === "string" ? s.country : null;
    const number = Number(s?.number);
    const team = country ? teamByName(country) : undefined;
    if (team && Number.isInteger(number) && number >= 1 && number <= STICKERS_PER_TEAM) {
      doubles.push(`${team.code}${number}`);
    } else if (country && !team) {
      notes.push(`Land „${country}" konnte keinem Team zugeordnet werden.`);
    }
  }

  return { doubles: dedupeSorted(doubles), readCount, notes };
}
