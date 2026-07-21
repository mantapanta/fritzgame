"use client";

import { useEffect, useState } from "react";

// Kurze Fußball-Fakten für Kinder (unter 10) – max. ~10 Wörter.
export const FOOTBALL_FACTS: string[] = [
  "Das schnellste WM-Tor fiel nach 11 Sekunden! ⚡",
  "Ein Hund namens Pickles fand mal den WM-Pokal! 🐶",
  "2026 spielen zum ersten Mal 48 Teams mit!",
  "Miroslav Klose schoss 16 WM-Tore. Rekord! 🥇",
  "Dein Album hat 980 Sticker. Wahnsinn! 😲",
  "Pelé war Weltmeister mit nur 17 Jahren!",
  "Die WM 2026 ist in 3 Ländern gleichzeitig!",
  "Panini-Sticker gibt es seit über 50 Jahren!",
  "Ungarn gewann mal ein WM-Spiel 10:1! 😲",
  "Roger Milla tanzte nach jedem Tor. 💃",
  "Nur 8 Länder haben je die WM gewonnen!",
  "Brasilien war 5-mal Weltmeister. 🏆",
  "Elfmeter: 11 Meter bis zum Tor.",
  "Tauschen macht dein Album voll! 🔁",
];

function pickStart(len: number): number {
  // Kein Math.random am Server nötig – rein clientseitig ok.
  return Math.floor(Math.random() * len);
}

export default function FactLoader({
  progress,
  title = "Einen Moment …",
  subtitle,
}: {
  /** 0..1 für determinierten Ring; weglassen für unendliches Drehen. */
  progress?: number;
  title?: string;
  subtitle?: string;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(pickStart(FOOTBALL_FACTS.length));
    const t = setInterval(
      () => setIdx((i) => (i + 1) % FOOTBALL_FACTS.length),
      5000
    );
    return () => clearInterval(t);
  }, []);

  const R = 54;
  const C = 2 * Math.PI * R;
  const determinate = typeof progress === "number";
  const clamped = Math.max(0, Math.min(1, progress ?? 0));
  const offset = C * (1 - clamped);

  return (
    <div className="factloader">
      <div className={`ring ${determinate ? "" : "ring-spin"}`}>
        <svg viewBox="0 0 120 120" width="140" height="140">
          <defs>
            <linearGradient id="foilring" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9a7b1a" />
              <stop offset="35%" stopColor="#f6e27a" />
              <stop offset="55%" stopColor="#d4af37" />
              <stop offset="80%" stopColor="#fff6c9" />
              <stop offset="100%" stopColor="#9a7b1a" />
            </linearGradient>
          </defs>
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--bg-elev-2)"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="url(#foilring)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={determinate ? offset : C * 0.7}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="ring-center">
          {determinate ? (
            <b>{Math.round(clamped * 100)}%</b>
          ) : (
            <span className="ball">⚽</span>
          )}
        </div>
      </div>

      <h2 style={{ margin: "6px 0 0" }}>{title}</h2>
      {subtitle && (
        <p className="muted" style={{ margin: 0 }}>
          {subtitle}
        </p>
      )}

      <div className="fact-card">
        <div className="fact-kicker">⚽ Wusstest du das?</div>
        <p key={idx} className="fact-text">
          {FOOTBALL_FACTS[idx]}
        </p>
      </div>
    </div>
  );
}
