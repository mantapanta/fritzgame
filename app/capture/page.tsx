"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CameraCapture, { type Quality } from "@/components/CameraCapture";
import { ALBUM, codeSort } from "@/lib/album";
import { setCaptureMissing } from "@/lib/client";

type Phase = "camera" | "recognizing" | "idle";

export default function CapturePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("camera");
  const [missing, setMissing] = useState<string[]>([]);
  const [seenTeams, setSeenTeams] = useState<string[]>([]);
  const [shots, setShots] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function recognize(dataUrl: string) {
    setPhase("recognizing");
    setError(null);
    try {
      const res = await fetch("/api/recognize/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [dataUrl] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erkennung fehlgeschlagen.");

      const foundMissing: string[] = data.missing || [];
      const foundTeams: string[] = data.seenTeams || [];
      const notes: string[] = data.notes || [];

      setMissing((prev) =>
        Array.from(new Set([...prev, ...foundMissing])).sort(codeSort)
      );
      setSeenTeams((prev) => Array.from(new Set([...prev, ...foundTeams])));
      setShots((s) => s + 1);

      if (notes.length) {
        setNote(notes[0]);
      } else if (!foundTeams.length && !foundMissing.length) {
        setNote("Auf diesem Foto nichts erkannt – näher ran oder mehr Licht.");
      } else {
        setNote(
          `Erkannt: ${foundTeams.length} Team-Seite(n), ${foundMissing.length} fehlende gefunden.`
        );
      }
      setPhase("idle");
    } catch (e: any) {
      setError(e?.message || "Erkennung fehlgeschlagen.");
      setPhase("idle");
    }
  }

  function handleCapture(dataUrl: string, quality: Quality) {
    if (!quality.ok) setNote(quality.reason || "Bildqualität könnte besser sein.");
    recognize(dataUrl);
  }

  function finish() {
    setCaptureMissing(missing);
    router.push("/spares");
  }

  const teamsProgress = Math.round((seenTeams.length / ALBUM.teamCount) * 100);

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/" className="back-link">
          ← Abbrechen
        </Link>
        <span className="pill">Album scannen</span>
      </header>

      <div className="center">
        <h2 style={{ margin: 0 }}>Album Seite für Seite fotografieren</h2>
        <p className="muted" style={{ margin: 0 }}>
          Fotografiere jede Seite (Reihenfolge egal). Die App erkennt Land und
          leere Plätze automatisch.
        </p>
      </div>

      <div className="progress">
        <span style={{ width: `${teamsProgress}%` }} />
      </div>
      <div className="stats-row">
        <div className="stat">
          <b>{shots}</b>
          <span>Fotos</span>
        </div>
        <div className="stat">
          <b>
            {seenTeams.length}/{ALBUM.teamCount}
          </b>
          <span>Teams gescannt</span>
        </div>
        <div className="stat">
          <b style={{ color: "var(--need)" }}>{missing.length}</b>
          <span>fehlend</span>
        </div>
      </div>

      {error && <div className="toast err">{error}</div>}
      {note && phase !== "recognizing" && <div className="toast warn">{note}</div>}

      {phase === "recognizing" ? (
        <div className="card center stack" style={{ alignItems: "center" }}>
          <div className="spinner" />
          <div className="muted">Seite wird ausgewertet …</div>
        </div>
      ) : (
        <CameraCapture
          onCapture={handleCapture}
          shutterLabel={shots ? "Nächste Seite" : "Seite fotografieren"}
        />
      )}

      {missing.length > 0 && (
        <details className="card">
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>
            Bisher fehlend ({missing.length})
          </summary>
          <div className="grid-numbers" style={{ marginTop: 12 }}>
            {missing.map((c) => (
              <span key={c} className="chip get">
                {c}
              </span>
            ))}
          </div>
        </details>
      )}

      {shots > 0 && phase !== "recognizing" && (
        <button className="btn btn-success" onClick={finish}>
          Fertig – weiter zu den Doppelten →
        </button>
      )}
    </div>
  );
}
