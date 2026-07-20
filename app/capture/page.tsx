"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CameraCapture, { type Quality } from "@/components/CameraCapture";
import { ALBUM, codeSort } from "@/lib/album";
import { setCaptureMissing } from "@/lib/client";

type Phase = "capture" | "processing" | "done";

export default function CapturePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("capture");
  const [photos, setPhotos] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);
  const [seenTeams, setSeenTeams] = useState<string[]>([]);
  const [failed, setFailed] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  function handleCapture(dataUrl: string, quality: Quality) {
    setPhotos((p) => [...p, dataUrl]);
    setNote(
      quality.ok
        ? null
        : (quality.reason || "Bildqualität könnte besser sein") +
            " – Foto wurde trotzdem hinzugefügt."
    );
  }

  function removePhoto(idx: number) {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  }

  async function evaluate() {
    setPhase("processing");
    setProgress(0);
    setFailed(0);
    const foundMissing = new Set<string>();
    const foundTeams = new Set<string>();
    let fails = 0;

    for (let i = 0; i < photos.length; i++) {
      setProgress(i + 1);
      try {
        const res = await fetch("/api/recognize/page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: [photos[i]] }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erkennung fehlgeschlagen.");
        (data.missing || []).forEach((c: string) => foundMissing.add(c));
        (data.seenTeams || []).forEach((c: string) => foundTeams.add(c));
      } catch {
        fails++;
      }
      setMissing(Array.from(foundMissing).sort(codeSort));
      setSeenTeams(Array.from(foundTeams));
    }

    setFailed(fails);
    setPhase("done");
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

      {/* -------- CAPTURE PHASE -------- */}
      {phase === "capture" && (
        <>
          <div className="center">
            <h2 style={{ margin: 0 }}>Seiten mit Lücken fotografieren</h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Fotografiere <b>nur die Seiten, auf denen dir noch Sticker
              fehlen</b> – die vollen Seiten kannst du überspringen. Reihenfolge
              egal. Erst alle Fotos sammeln, dann in einem Rutsch auswerten.
            </p>
          </div>

          {note && <div className="toast warn">{note}</div>}

          <CameraCapture
            onCapture={handleCapture}
            shutterLabel={photos.length ? "Weitere Seite aufnehmen" : "Seite aufnehmen"}
          />

          {photos.length > 0 && (
            <>
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 10 }}>
                  {photos.length} Foto{photos.length === 1 ? "" : "s"} gesammelt
                  <span className="muted" style={{ fontWeight: 400 }}>
                    {" "}
                    · zum Entfernen antippen
                  </span>
                </div>
                <div className="thumbs">
                  {photos.map((src, i) => (
                    <button
                      key={i}
                      className="thumb"
                      onClick={() => removePhoto(i)}
                      aria-label="Foto entfernen"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Foto ${i + 1}`} />
                      <span className="thumb-x">×</span>
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-success" onClick={evaluate}>
                Auswerten ({photos.length} Foto{photos.length === 1 ? "" : "s"})
              </button>
            </>
          )}
        </>
      )}

      {/* -------- PROCESSING PHASE -------- */}
      {phase === "processing" && (
        <div className="stack">
          <div className="center">
            <h2 style={{ margin: 0 }}>Fotos werden ausgewertet …</h2>
            <p className="muted" style={{ margin: 0 }}>
              Du musst nicht warten – bleib einfach hier.
            </p>
          </div>
          <div className="progress">
            <span
              style={{
                width: `${Math.round((progress / Math.max(photos.length, 1)) * 100)}%`,
              }}
            />
          </div>
          <div className="card center stack" style={{ alignItems: "center" }}>
            <div className="spinner" />
            <div className="muted">
              Bild {progress} von {photos.length}
            </div>
          </div>
        </div>
      )}

      {/* -------- DONE PHASE -------- */}
      {phase === "done" && (
        <div className="stack">
          <div className="center">
            <h2 style={{ margin: 0 }}>Fertig ausgewertet ✓</h2>
          </div>
          <div className="card">
            <div className="stats-row">
              <div className="stat">
                <b>{photos.length}</b>
                <span>Fotos</span>
              </div>
              <div className="stat">
                <b>
                  {seenTeams.length}/{ALBUM.teamCount}
                </b>
                <span>Teams erkannt</span>
              </div>
              <div className="stat">
                <b style={{ color: "var(--need)" }}>{missing.length}</b>
                <span>fehlend</span>
              </div>
            </div>
          </div>

          {failed > 0 && (
            <div className="toast warn">
              {failed} Foto{failed === 1 ? "" : "s"} konnten nicht ausgewertet
              werden (z.B. unscharf). Du kannst sie neu aufnehmen.
            </div>
          )}

          {missing.length > 0 && (
            <details className="card" open>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                Fehlende Sticker ({missing.length})
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

          <button className="btn" onClick={() => setPhase("capture")}>
            + Weitere Seiten scannen
          </button>
          <button className="btn btn-success" onClick={finish}>
            Weiter zu den Doppelten →
          </button>
        </div>
      )}
    </div>
  );
}
