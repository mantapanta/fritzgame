// Hardcodierte Album-Definition für ein konkretes Set.
//
// Das Set ist bewusst deterministisch aus einer kompakten Kapitel-Liste aufgebaut
// (kein externer Datenbezug), damit es leicht durch ein echtes Panini-Set ersetzt
// werden kann: einfach CHAPTERS / SPECIAL_PAGES anpassen bzw. `buildAlbum` durch
// eine echte Sticker-Liste ersetzen.

export type Slot = {
  /** Rasterposition auf der Seite (0-basiert, zeilenweise). */
  pos: number;
  /** Globale Sticker-Nummer im Album. */
  number: number;
};

export type Page = {
  pageNo: number;
  label: string;
  gridCols: number;
  gridRows: number;
  slots: Slot[];
};

export type Album = {
  setId: string;
  name: string;
  season: string;
  pages: Page[];
  totalStickers: number;
};

// Kapitel = eine Doppelseite/Team im Album. Jedes Kapitel bekommt `slots` Sticker.
const CHAPTERS: { label: string; slots: number; cols: number }[] = [
  { label: "Intro & Logos", slots: 12, cols: 4 },
  { label: "FC Sonnental", slots: 18, cols: 3 },
  { label: "SV Bergheim", slots: 18, cols: 3 },
  { label: "Rot-Weiß Auer", slots: 18, cols: 3 },
  { label: "Kickers Waldau", slots: 18, cols: 3 },
  { label: "TSV Marburg", slots: 18, cols: 3 },
  { label: "Union Nordstadt", slots: 18, cols: 3 },
  { label: "Blau-Gelb Isar", slots: 18, cols: 3 },
  { label: "FC Hafenkante", slots: 18, cols: 3 },
  { label: "Grün-Weiß Lahn", slots: 18, cols: 3 },
  { label: "Sportfreunde Ost", slots: 18, cols: 3 },
  { label: "VfL Steinbach", slots: 18, cols: 3 },
  { label: "Eintracht Rheinau", slots: 18, cols: 3 },
  { label: "SC Möwenweg", slots: 18, cols: 3 },
  { label: "FC Talblick", slots: 18, cols: 3 },
  { label: "Dynamo Seestadt", slots: 18, cols: 3 },
  { label: "TuS Ahorn", slots: 18, cols: 3 },
  { label: "Legenden", slots: 16, cols: 4 },
  { label: "Stadien", slots: 12, cols: 4 },
  { label: "Pokal-Highlights", slots: 14, cols: 2 },
];

function buildAlbum(): Album {
  const pages: Page[] = [];
  let number = 1;

  CHAPTERS.forEach((chapter, index) => {
    const cols = chapter.cols;
    const rows = Math.ceil(chapter.slots / cols);
    const slots: Slot[] = [];
    for (let pos = 0; pos < chapter.slots; pos++) {
      slots.push({ pos, number: number++ });
    }
    pages.push({
      pageNo: index + 1,
      label: chapter.label,
      gridCols: cols,
      gridRows: rows,
      slots,
    });
  });

  return {
    setId: "fritzliga-2024",
    name: "Fritz-Liga Sammelalbum",
    season: "Saison 2024/25",
    pages,
    totalStickers: number - 1,
  };
}

export const ALBUM: Album = buildAlbum();

/** Alle Sticker-Nummern des Sets (aufsteigend). */
export function allNumbers(): number[] {
  return ALBUM.pages.flatMap((p) => p.slots.map((s) => s.number));
}

export function pageByNo(pageNo: number): Page | undefined {
  return ALBUM.pages.find((p) => p.pageNo === pageNo);
}

/** Sticker-Nummer an einer Rasterposition einer Seite. */
export function numberByPos(pageNo: number, pos: number): number | undefined {
  return pageByNo(pageNo)?.slots.find((s) => s.pos === pos)?.number;
}

/** Prüft, ob eine Nummer zum Set gehört. */
export function isValidNumber(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= ALBUM.totalStickers;
}

export const TOTAL_PAGES = ALBUM.pages.length;
