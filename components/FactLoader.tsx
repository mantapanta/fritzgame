"use client";

import { useEffect, useState } from "react";

// Kuratierte, bewusst nicht-banale Fußball-/WM-Fakten.
export const FOOTBALL_FACTS: string[] = [
  "Das schnellste WM-Tor der Geschichte fiel nach nur 10,8 Sekunden – Hakan Şükür für die Türkei, 2002.",
  "Der gestohlene WM-Pokal wurde 1966 in London von einem Hund namens „Pickles“ unter einer Hecke gefunden.",
  "Die WM 2026 ist die erste mit 48 Teams – und die erste mit drei Gastgebern: Kanada, Mexiko und die USA.",
  "Mexiko richtet 2026 zum dritten Mal WM-Spiele aus (1970, 1986, 2026) – das schaffte noch kein anderes Land.",
  "Miroslav Klose hält mit 16 Treffern den WM-Torrekord – erzielt über vier Turniere.",
  "Nur acht Nationen haben je eine WM gewonnen. Schaffst du es, sie alle aufzuzählen?",
  "Beim „Maracanazo“ 1950 verstummten fast 200.000 Zuschauer, als Uruguay Brasilien im Finale schlug.",
  "Das höchste WM-Ergebnis eines Teams: Ungarn schlug El Salvador 1982 mit 10:1.",
  "Im ersten WM-Finale 1930 spielte man je Halbzeit mit einem anderen Ball – einer pro Nation.",
  "Roger Milla tanzte 1990 mit 38 Jahren an der Eckfahne – und wurde zum Kult.",
  "Panini bringt seit der WM 1970 in Mexiko offizielle Sammelalben heraus.",
  "Mit 980 Stickern ist das WM-2026-Album das größte WM-Album, das es je gab.",
  "Pelé wurde 1958 mit 17 Jahren jüngster WM-Torschütze – und direkt Weltmeister.",
  "1994 in den USA stieß man mittags bei über 40 °C an – Sonnenschutz inklusive.",
  "Der erste WM-Treffer überhaupt: Lucien Laurent für Frankreich, 1930 gegen Mexiko.",
];

function pickStart(len: number): number {
  // Kein Math.random am Server nötig – rein clientseitig ok.
  return Math.floor(Math.random() * len);
}

export default function FactLoader({
  progress,
  title = "Wird ausgewertet …",
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
            stroke="var(--accent)"
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
        <div className="fact-kicker">⚽ Wusstest du …</div>
        <p key={idx} className="fact-text">
          {FOOTBALL_FACTS[idx]}
        </p>
      </div>
    </div>
  );
}
