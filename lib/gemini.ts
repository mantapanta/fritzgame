import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
  STICKERS_PER_TEAM,
  isValidCode,
  normalizeCode,
  teamByName,
} from "./album";

// „gemini-flash-lite-latest" ist das schnellste/günstigste aktuelle Flash-Modell –
// für OCR + Länder-Erkennung völlig ausreichend und deutlich flotter als das große
// Flash. Alias wird bei neuen Releases automatisch mitgezogen. Per GEMINI_MODEL
// überschreibbar (z.B. "gemini-flash-latest" oder "gemini-3.5-flash").
export const MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

/**
 * Fehler mit kindgerechter Botschaft, die gefahrlos bis in die UI durchgereicht
 * werden darf (keine technischen Details / Markennamen). Die API-Routen zeigen
 * nur .friendly-Fehler wortwörtlich an, alles andere wird generisch maskiert.
 */
export class FriendlyError extends Error {
  friendly = true as const;
}

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
    console.error("GEMINI_API_KEY ist nicht gesetzt (siehe .env.example).");
    throw new FriendlyError(
      "Die Foto-Erkennung macht gerade Pause. Sag Fritz Bescheid!"
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

/** Extrahiert JSON aus einer Modellantwort (robust gegen Codeblöcke/Trailing). */
function extractJson(text: string): any {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Auf den ersten JSON-Block eingrenzen …
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (start !== -1 && end !== -1 && end > start) {
      const slice = cleaned.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {
        // … und einfache Reparaturen versuchen (Trailing-Kommas entfernen).
        try {
          return JSON.parse(slice.replace(/,\s*([}\]])/g, "$1"));
        } catch {
          /* unten freundlich abbrechen */
        }
      }
    }
    throw new FriendlyError(
      "Das Foto konnte nicht gelesen werden. Mach es nochmal!"
    );
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Wiederholt transiente Fehler (Überlastung/Rate-Limit) mit exponentiellem Backoff. */
async function generateWithRetry(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  parts: any[],
  attempts = 3
): Promise<any> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await model.generateContent(parts);
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || "");
      const transient =
        /\b(429|500|502|503|504)\b/.test(msg) ||
        /overload|unavailable|high demand|try again|temporarily/i.test(msg);
      if (i === attempts - 1 && transient) {
        console.error("Bilderkennung überlastet:", msg);
        throw new FriendlyError(
          "Gerade ist viel los. Warte kurz. Dann nochmal!"
        );
      }
      if (!transient) {
        console.error("Bilderkennung fehlgeschlagen:", e);
        throw e;
      }
      await sleep(800 * Math.pow(2, i)); // 0.8s, 1.6s, ...
    }
  }
  throw lastErr;
}

// Erzwungene JSON-Schemata – verhindern unsauberes/abgeschnittenes JSON.
const ALBUM_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    pages: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          country: { type: SchemaType.STRING, nullable: true },
          special: { type: SchemaType.BOOLEAN },
          emptyNumbers: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.INTEGER },
          },
          emptyCodes: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["special", "emptyNumbers", "emptyCodes"],
      },
    },
  },
  required: ["pages"],
} as const;

const SPARES_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    stickers: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          country: { type: SchemaType.STRING, nullable: true },
          number: { type: SchemaType.INTEGER, nullable: true },
          code: { type: SchemaType.STRING, nullable: true },
        },
      },
    },
  },
  required: ["stickers"],
} as const;

async function runVision(
  prompt: string,
  images: string[],
  responseSchema?: any
): Promise<any> {
  const model = client().getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,
      maxOutputTokens: 2048,
      ...(responseSchema ? { responseSchema } : {}),
    },
  });

  const parts: any[] = [{ text: prompt }];
  for (const img of images) {
    const { data, mimeType } = parseImage(img);
    parts.push({ inlineData: { data, mimeType } });
  }

  const result = await generateWithRetry(model, parts);
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

  const json = await runVision(prompt, images, ALBUM_SCHEMA);
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
 * Doppel-Stapel: liest lose Sticker aus. Die Sticker liegen mit der RÜCKSEITE
 * nach oben – dort ist der Sticker-Code/die Nummer aufgedruckt.
 */
export async function recognizeSpares(
  images: string[]
): Promise<SparesRecognition> {
  const prompt = `Auf den Fotos liegen lose Panini-Sticker der FIFA WM 2026 mit der RÜCKSEITE nach oben (typischerweise in einem 3x3-Raster, also bis zu 9 Stück pro Foto).
Auf der Rückseite ist der Sticker-Code aufgedruckt – meist ein Länderkürzel + Nummer wie "CZE 7", "GER 13" oder ein Spezialcode wie "FWC 5" bzw. "00".
Lies für JEDEN klar lesbaren Sticker den aufgedruckten Code exakt aus.

Gib ausschließlich JSON in genau diesem Format zurück:
{"stickers":[
  {"code":"<aufgedruckter Code exakt, z.B. CZE7 / FWC5 / 00, oder null>","country":"<englischer Ländername, falls statt Code erkennbar, sonst null>","number":<Zahl 1-20, falls statt Code erkennbar, sonst null>}
]}
Bevorzuge immer das Feld "code" mit dem exakt abgelesenen Kürzel+Nummer. Wenn eine Nummer mehrfach vorkommt, liste sie mehrfach. Rate nicht bei unleserlichen Stickern.`;

  const json = await runVision(prompt, images, SPARES_SCHEMA);
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
