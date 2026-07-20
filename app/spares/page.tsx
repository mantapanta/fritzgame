"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CameraCapture, { type Quality } from "@/components/CameraCapture";
import {
  clearCaptureMissing,
  getCaptureMissing,
  saveMyId,
} from "@/lib/client";

type Phase = "camera" | "recognizing" | "idle" | "saving";

export default function SparesPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("camera");
  const [doubles, setDoubles] = useState<number[]>([]);
  const [shots, setShots] = useState(0);
  const [owner, setOwner] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function recognize(dataUrl: string) {
    setPhase("recognizing");
    setError(null);
    try {
      const res = await fetch("/api/recognize/spares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [dataUrl] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erkennung fehlgeschlagen.");
      const found: number[] = data.doubles || [];
      setDoubles((prev) =>
        Array.from(new Set([...prev, ...found])).sort((a, b) => a - b)
      );
      setShots((s) => s + 1);
      setNote(
        found.length
          ? `${found.length} Nummer(n) auf diesem Foto erkannt.`
          : "Keine lesbare Nummer auf diesem Foto gefunden."
      );
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

  async function finish() {
    setPhase("saving");
    setError(null);
    try {
      const missing = getCaptureMissing();
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missing,
          doubles,
          owner: owner.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Speichern fehlgeschlagen.");
      saveMyId(data.id);
      clearCaptureMissing();
      router.push(`/collection/${data.id}`);
    } catch (e: any) {
      setError(e?.message || "Speichern fehlgeschlagen.");
      setPhase("idle");
    }
  }

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/capture" className="back-link">
          ← Album
        </Link>
        <span className="pill">Doppelte erfassen</span>
      </header>

      <div className="center">
        <h2 style={{ margin: 0 }}>Doppelte Sticker</h2>
        <p className="muted" style={{ margin: 0 }}>
          Lege deine Doppelten gut sichtbar aus (Nummer nach oben) und
          fotografiere sie – gern mehrere Fotos.
        </p>
      </div>

      {error && <div className="toast err">{error}</div>}
      {note && phase === "idle" && <div className="toast warn">{note}</div>}

      {(phase === "camera" || phase === "idle") && (
        <CameraCapture
          onCapture={handleCapture}
          shutterLabel={shots ? "Weiteres Foto" : "Doppelte fotografieren"}
        />
      )}

      {phase === "recognizing" && (
        <div className="card center stack" style={{ alignItems: "center" }}>
          <div className="spinner" />
          <div className="muted">Nummern werden gelesen …</div>
        </div>
      )}

      {phase === "saving" && (
        <div className="card center stack" style={{ alignItems: "center" }}>
          <div className="spinner" />
          <div className="muted">Sammlung wird gespeichert …</div>
        </div>
      )}

      <div className="card stack">
        <div className="stats-row">
          <div className="stat">
            <b>{shots}</b>
            <span>Fotos</span>
          </div>
          <div className="stat">
            <b style={{ color: "var(--accent-2)" }}>{doubles.length}</b>
            <span>Doppelte</span>
          </div>
        </div>
        {doubles.length > 0 && (
          <div className="grid-numbers">
            {doubles.map((n) => (
              <span key={n} className="chip give">
                {n}
              </span>
            ))}
          </div>
        )}
      </div>

      {(phase === "idle" || phase === "camera") && (
        <div className="stack">
          <input
            className="textarea"
            style={{ minHeight: 0, height: 48 }}
            placeholder="Dein Name (optional, für den Tausch-Chat)"
            value={owner}
            maxLength={40}
            onChange={(e) => setOwner(e.target.value)}
          />
          <button
            className="btn btn-success"
            onClick={finish}
            disabled={phase === ("saving" as Phase)}
          >
            Fertig – Sammlung &amp; Link erstellen
          </button>
        </div>
      )}
    </div>
  );
}
