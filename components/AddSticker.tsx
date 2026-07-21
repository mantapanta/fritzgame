"use client";

import { useState } from "react";
import { SPECIALS, STICKERS_PER_TEAM, TEAMS, normalizeCode } from "@/lib/album";

// Nummer nachtragen ohne Tastatur: erst Team antippen, dann Zahl antippen.
export default function AddSticker({ onAdd }: { onAdd: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [team, setTeam] = useState<string | null>(null); // Teamcode oder "SPECIAL"

  function close() {
    setOpen(false);
    setTeam(null);
  }

  function pick(code: string) {
    onAdd(normalizeCode(code));
    close();
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
        ➕ Fehlt eine Nummer? Tipp sie an!
      </button>
    );
  }

  return (
    <div className="card stack">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {team ? (
          <button type="button" className="shot-action" onClick={() => setTeam(null)}>
            ← Zurück
          </button>
        ) : (
          <b style={{ fontSize: 17 }}>Welches Team?</b>
        )}
        {team && <b style={{ fontSize: 17 }}>Welche Nummer?</b>}
        <button type="button" className="shot-action" onClick={close} aria-label="Schließen">
          ✕
        </button>
      </div>

      {!team ? (
        <div className="numpad teams">
          <button type="button" onClick={() => setTeam("SPECIAL")}>
            ⭐ Extra-Sticker
          </button>
          {TEAMS.map((t) => (
            <button key={t.code} type="button" onClick={() => setTeam(t.code)}>
              {t.label}
            </button>
          ))}
        </div>
      ) : team === "SPECIAL" ? (
        <div className="numpad">
          {SPECIALS.map((c) => (
            <button key={c} type="button" onClick={() => pick(c)}>
              {c}
            </button>
          ))}
        </div>
      ) : (
        <div className="numpad">
          {Array.from({ length: STICKERS_PER_TEAM }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" onClick={() => pick(`${team}${n}`)}>
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
