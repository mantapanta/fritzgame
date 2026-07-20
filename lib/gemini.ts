import { GoogleGenerativeAI } from "@google/generative-ai";
import { isValidNumber, numberByPos, type Page } from "./album";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function client(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
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
  // Roher Base64 ohne Prefix -> als JPEG annehmen.
  return { mimeType: "image/jpeg", data: input.trim() };
}

/** Extrahiert das erste JSON-Objekt aus einer Modellantwort (robust gegen Codeblöcke). */
function extractJson(text: string): any {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
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

export type PageRecognition = {
  /** Fehlende Sticker-Nummern auf dieser Seite. */
  missing: number[];
  /** Wie viele Slots als leer erkannt wurden. */
  emptyCount: number;
};

/**
 * Album-Seite: Präsenz-Erkennung gegen das bekannte Layout.
 * Das Modell muss nicht die (verdeckten) Nummern lesen, sondern nur pro
 * Rasterposition entscheiden, ob ein Sticker klebt oder der Platz leer ist.
 */
export async function recognizePage(
  page: Page,
  images: string[]
): Promise<PageRecognition> {
  const prompt = `Du analysierst das Foto einer Sammelalbum-Seite ("${page.label}", Seite ${page.pageNo}).
Auf dieser Seite gibt es ${page.slots.length} Klebeplätze, angeordnet als Raster mit ${page.gridCols} Spalten und ${page.gridRows} Zeilen.
Die Plätze werden zeilenweise von oben-links nach unten-rechts durchnummeriert, beginnend bei 0 (also 0 = oben links, 1 = rechts daneben, usw.).
Ein Platz ist BELEGT, wenn dort ein Sticker/Bild klebt. Ein Platz ist LEER, wenn man den bedruckten Platzhalter/Umriss (meist mit Nummer) ohne Sticker sieht.
Gib ausschließlich JSON in genau diesem Format zurück:
{"emptyPositions":[<0-basierte Positionen aller LEEREN Plätze>]}
Wenn alle Plätze belegt sind, gib {"emptyPositions":[]} zurück.`;

  const json = await runVision(prompt, images);
  const raw: unknown = json?.emptyPositions;
  const positions: number[] = Array.isArray(raw)
    ? raw.map((x) => Number(x)).filter((x) => Number.isInteger(x))
    : [];

  const missing: number[] = [];
  for (const pos of positions) {
    const num = numberByPos(page.pageNo, pos);
    if (num !== undefined) missing.push(num);
  }
  missing.sort((a, b) => a - b);

  return { missing: Array.from(new Set(missing)), emptyCount: positions.length };
}

export type SparesRecognition = {
  /** Erkannte doppelte Sticker-Nummern. */
  doubles: number[];
  /** Vom Modell gemeldete Roh-Anzahl gelesener Nummern (inkl. ungültiger). */
  readCount: number;
};

/**
 * Doppel-Stapel: Nummern-OCR der ausgelegten losen Sticker.
 */
export async function recognizeSpares(
  images: string[]
): Promise<SparesRecognition> {
  const prompt = `Auf den Fotos liegen lose Sammelsticker ausgebreitet (Doppelte, die getauscht werden sollen).
Auf jedem Sticker ist eine Nummer aufgedruckt (meist in einer Ecke).
Lies die Nummern ALLER klar erkennbaren Sticker aus.
Gib ausschließlich JSON in genau diesem Format zurück:
{"numbers":[<alle erkannten Sticker-Nummern als Ganzzahlen>]}
Wenn eine Nummer mehrfach vorkommt, liste sie mehrfach auf. Rate nicht bei unleserlichen Stickern.`;

  const json = await runVision(prompt, images);
  const raw: unknown = json?.numbers;
  const nums: number[] = Array.isArray(raw)
    ? raw.map((x) => Number(x)).filter((x) => Number.isInteger(x))
    : [];

  const doubles = nums.filter((n) => isValidNumber(n));
  return {
    doubles: Array.from(new Set(doubles)).sort((a, b) => a - b),
    readCount: nums.length,
  };
}
