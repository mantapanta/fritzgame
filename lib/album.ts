// Album-Definition für das echte Set „Panini FIFA World Cup 2026".
//
// Sticker werden über String-CODES identifiziert (nicht über fortlaufende Zahlen):
//   "00"            – Panini-Logo (Opener)
//   "FWC1".."FWC19" – Turnier-Specials (Emblem/Maskottchen/Pokal/Host-Folien + FIFA-Museum)
//   "<XXX><n>"       – Team-Sticker, XXX = FIFA-Länderkürzel, n = 1..20 (z.B. "CZE7")
//
// 980 Sticker gesamt = 20 Specials + 48 Teams × 20.
//
// Die Team→Code-Zuordnung basiert auf recherchierten FIFA-Kürzeln. Für die
// Tausch-Korrektheit ist sie unkritisch (verglichen werden die real vom Album
// gelesenen Codes); sie dient der Anzeige und der Erkennungs-Disambiguierung.

export type Team = {
  /** FIFA-Länderkürzel, Code-Präfix (z.B. "CZE"). */
  code: string;
  /** Kanonischer englischer Name (so fragen wir das Vision-Modell). */
  name: string;
  /** Deutsche Anzeige. */
  label: string;
  confederation: "Gastgeber" | "AFC" | "CAF" | "CONCACAF" | "CONMEBOL" | "OFC" | "UEFA";
  /** Weitere Schreibweisen (EN/DE), für die Namens→Code-Zuordnung. */
  aliases: string[];
};

export const STICKERS_PER_TEAM = 20;

/** Spezialsticker in Albumreihenfolge. */
export const SPECIALS: string[] = [
  "00",
  ...Array.from({ length: 19 }, (_, i) => `FWC${i + 1}`),
];

/** Die 48 Teams – Gastgeber zuerst, dann nach Konföderation. */
export const TEAMS: Team[] = [
  { code: "MEX", name: "Mexico", label: "Mexiko", confederation: "Gastgeber", aliases: ["mexiko"] },
  { code: "CAN", name: "Canada", label: "Kanada", confederation: "Gastgeber", aliases: ["kanada"] },
  { code: "USA", name: "United States", label: "USA", confederation: "Gastgeber", aliases: ["usa", "united states of america", "vereinigte staaten"] },

  { code: "AUS", name: "Australia", label: "Australien", confederation: "AFC", aliases: ["australien"] },
  { code: "IRQ", name: "Iraq", label: "Irak", confederation: "AFC", aliases: ["irak"] },
  { code: "IRN", name: "Iran", label: "Iran", confederation: "AFC", aliases: ["ir iran", "islamic republic of iran"] },
  { code: "JPN", name: "Japan", label: "Japan", confederation: "AFC", aliases: [] },
  { code: "JOR", name: "Jordan", label: "Jordanien", confederation: "AFC", aliases: ["jordanien"] },
  { code: "KOR", name: "South Korea", label: "Südkorea", confederation: "AFC", aliases: ["korea republic", "republic of korea", "korea", "suedkorea", "südkorea"] },
  { code: "QAT", name: "Qatar", label: "Katar", confederation: "AFC", aliases: ["katar"] },
  { code: "KSA", name: "Saudi Arabia", label: "Saudi-Arabien", confederation: "AFC", aliases: ["saudi arabien", "saudi-arabien"] },
  { code: "UZB", name: "Uzbekistan", label: "Usbekistan", confederation: "AFC", aliases: ["usbekistan"] },

  { code: "ALG", name: "Algeria", label: "Algerien", confederation: "CAF", aliases: ["algerien"] },
  { code: "CPV", name: "Cape Verde", label: "Kap Verde", confederation: "CAF", aliases: ["cabo verde", "kap verde"] },
  { code: "COD", name: "DR Congo", label: "DR Kongo", confederation: "CAF", aliases: ["congo dr", "democratic republic of the congo", "congo", "kongo", "dr kongo"] },
  { code: "CIV", name: "Ivory Coast", label: "Elfenbeinküste", confederation: "CAF", aliases: ["cote d'ivoire", "côte d'ivoire", "elfenbeinkueste", "elfenbeinküste"] },
  { code: "EGY", name: "Egypt", label: "Ägypten", confederation: "CAF", aliases: ["aegypten", "ägypten"] },
  { code: "GHA", name: "Ghana", label: "Ghana", confederation: "CAF", aliases: [] },
  { code: "MAR", name: "Morocco", label: "Marokko", confederation: "CAF", aliases: ["marokko"] },
  { code: "SEN", name: "Senegal", label: "Senegal", confederation: "CAF", aliases: [] },
  { code: "RSA", name: "South Africa", label: "Südafrika", confederation: "CAF", aliases: ["suedafrika", "südafrika"] },
  { code: "TUN", name: "Tunisia", label: "Tunesien", confederation: "CAF", aliases: ["tunesien"] },

  { code: "CUW", name: "Curacao", label: "Curaçao", confederation: "CONCACAF", aliases: ["curaçao", "curacao"] },
  { code: "HAI", name: "Haiti", label: "Haiti", confederation: "CONCACAF", aliases: [] },
  { code: "PAN", name: "Panama", label: "Panama", confederation: "CONCACAF", aliases: [] },

  { code: "ARG", name: "Argentina", label: "Argentinien", confederation: "CONMEBOL", aliases: ["argentinien"] },
  { code: "BRA", name: "Brazil", label: "Brasilien", confederation: "CONMEBOL", aliases: ["brasilien", "brasil"] },
  { code: "COL", name: "Colombia", label: "Kolumbien", confederation: "CONMEBOL", aliases: ["kolumbien"] },
  { code: "ECU", name: "Ecuador", label: "Ecuador", confederation: "CONMEBOL", aliases: [] },
  { code: "PAR", name: "Paraguay", label: "Paraguay", confederation: "CONMEBOL", aliases: [] },
  { code: "URU", name: "Uruguay", label: "Uruguay", confederation: "CONMEBOL", aliases: [] },

  { code: "NZL", name: "New Zealand", label: "Neuseeland", confederation: "OFC", aliases: ["neuseeland"] },

  { code: "AUT", name: "Austria", label: "Österreich", confederation: "UEFA", aliases: ["oesterreich", "österreich"] },
  { code: "BEL", name: "Belgium", label: "Belgien", confederation: "UEFA", aliases: ["belgien"] },
  { code: "BIH", name: "Bosnia and Herzegovina", label: "Bosnien-Herzegowina", confederation: "UEFA", aliases: ["bosnia", "bosnia-herzegovina", "bosnien", "bosnien-herzegowina"] },
  { code: "CRO", name: "Croatia", label: "Kroatien", confederation: "UEFA", aliases: ["kroatien"] },
  { code: "CZE", name: "Czechia", label: "Tschechien", confederation: "UEFA", aliases: ["czech republic", "tschechien"] },
  { code: "ENG", name: "England", label: "England", confederation: "UEFA", aliases: [] },
  { code: "FRA", name: "France", label: "Frankreich", confederation: "UEFA", aliases: ["frankreich"] },
  { code: "GER", name: "Germany", label: "Deutschland", confederation: "UEFA", aliases: ["deutschland", "deutsch"] },
  { code: "NED", name: "Netherlands", label: "Niederlande", confederation: "UEFA", aliases: ["holland", "niederlande"] },
  { code: "NOR", name: "Norway", label: "Norwegen", confederation: "UEFA", aliases: ["norwegen"] },
  { code: "POR", name: "Portugal", label: "Portugal", confederation: "UEFA", aliases: [] },
  { code: "SCO", name: "Scotland", label: "Schottland", confederation: "UEFA", aliases: ["schottland"] },
  { code: "ESP", name: "Spain", label: "Spanien", confederation: "UEFA", aliases: ["spanien", "espana", "españa"] },
  { code: "SWE", name: "Sweden", label: "Schweden", confederation: "UEFA", aliases: ["schweden"] },
  { code: "SUI", name: "Switzerland", label: "Schweiz", confederation: "UEFA", aliases: ["schweiz"] },
  { code: "TUR", name: "Turkey", label: "Türkei", confederation: "UEFA", aliases: ["turkiye", "türkiye", "tuerkei", "türkei"] },
];

export const ALBUM = {
  setId: "panini-wc-2026",
  name: "Panini FIFA World Cup 2026",
  season: "FIFA WM 2026",
  totalStickers: SPECIALS.length + TEAMS.length * STICKERS_PER_TEAM, // 980
  teamCount: TEAMS.length,
};

/** Alle 980 Codes in Anzeige-/Albumreihenfolge. */
export function allCodes(): string[] {
  const codes = [...SPECIALS];
  for (const t of TEAMS) {
    for (let n = 1; n <= STICKERS_PER_TEAM; n++) codes.push(`${t.code}${n}`);
  }
  return codes;
}

// Sortier-Index für stabile Reihenfolge in der Anzeige.
const CODE_INDEX: Map<string, number> = new Map(
  allCodes().map((c, i) => [c, i])
);

/** Vergleichsfunktion für Codes gemäß Albumreihenfolge (unbekannte ans Ende). */
export function codeSort(a: string, b: string): number {
  const ia = CODE_INDEX.has(a) ? (CODE_INDEX.get(a) as number) : Number.MAX_SAFE_INTEGER;
  const ib = CODE_INDEX.has(b) ? (CODE_INDEX.get(b) as number) : Number.MAX_SAFE_INTEGER;
  if (ia !== ib) return ia - ib;
  return a.localeCompare(b);
}

const SPECIALS_SET = new Set(SPECIALS);
const TEAM_PATTERN = /^[A-Z]{3}(?:[1-9]|1[0-9]|20)$/;

/** Normalisiert einen roh gelesenen Code (Groß, ohne Leer-/Sonderzeichen). */
export function normalizeCode(raw: string): string {
  let s = (raw || "").toUpperCase().replace(/[\s.\-_#]/g, "");
  if (s === "0") s = "00";
  return s;
}

/**
 * Gültig sind Specials sowie jedes Muster „3 Buchstaben + 1..20". Das Muster
 * akzeptiert bewusst auch Präfixe, die wir nicht gemappt haben, damit das echte
 * Album immer funktioniert.
 */
export function isValidCode(raw: string): boolean {
  const s = normalizeCode(raw);
  if (SPECIALS_SET.has(s)) return true;
  // „FWC"/„00" sind Spezial-Präfixe – nicht als Team-Code zulassen (z.B. FWC20).
  if (s.startsWith("FWC") || s.startsWith("00")) return false;
  return TEAM_PATTERN.test(s);
}

// Namens-Lookup: normalisierter Name/Alias -> Team.
function normName(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z]/g, ""); // nur Buchstaben – entfernt auch Akzent-Kombizeichen
}

const NAME_INDEX: Map<string, Team> = (() => {
  const m = new Map<string, Team>();
  for (const t of TEAMS) {
    m.set(normName(t.name), t);
    m.set(normName(t.label), t);
    m.set(normName(t.code), t);
    for (const a of t.aliases) m.set(normName(a), t);
  }
  return m;
})();

/** Findet ein Team anhand eines (englischen/deutschen) Namens oder Codes. */
export function teamByName(name: string): Team | undefined {
  if (!name) return undefined;
  return NAME_INDEX.get(normName(name));
}

/** Findet ein Team anhand eines Sticker-Codes (Präfix). */
export function teamByCode(code: string): Team | undefined {
  const s = normalizeCode(code);
  const prefix = s.slice(0, 3);
  return TEAMS.find((t) => t.code === prefix);
}
