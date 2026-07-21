"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import CameraCapture, { type Quality } from "@/components/CameraCapture";
import FactLoader from "@/components/FactLoader";
import ChipList from "@/components/ChipList";
import AddSticker from "@/components/AddSticker";
import Steps from "@/components/Steps";
import { codeSort } from "@/lib/album";
import { clearCaptureMissing, getCaptureMissing } from "@/lib/client";

type Phase = "camera" | "recognizing" | "idle" | "saving";

export default function SparesPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("camera");
  const [doubles, setDoubles] = useState<string[]>([]);
  const [shots, setShots] = useState(0);
  const [owner, setOwner] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRemoved, setLastRemoved] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (!res.ok) throw new Error(data?.error || "Das hat nicht geklappt.");
      const found: string[] = data.doubles || [];
      setDoubles((prev) =>
        Array.from(new Set([...prev, ...found])).sort(codeSort)
      );
      setShots((s) => s + 1);
      setNote(
        found.length
          ? `Super! ${found.length} ${found.length === 1 ? "Nummer" : "Nummern"} gefunden. 🎉`
          : "Keine Nummer gefunden. Mach das Foto neu!"
      );
      setPhase("idle");
    } catch (e: any) {
      setError(e?.message || "Das hat nicht geklappt. Probier's nochmal!");
      setPhase("idle");
    }
  }

  function handleCapture(dataUrl: string, quality: Quality) {
    if (!quality.ok) setNote(quality.reason || "Das Foto ist unscharf.");
    recognize(dataUrl);
  }

  function removeCode(code: string) {
    setDoubles((prev) => prev.filter((c) => c !== code));
    setLastRemoved(code);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setLastRemoved(null), 6000);
  }

  function undoRemove() {
    if (!lastRemoved) return;
    const code = lastRemoved;
    setDoubles((prev) =>
      prev.includes(code) ? prev : [...prev, code].sort(codeSort)
    );
    setLastRemoved(null);
  }

  function addCode(code: string) {
    setDoubles((prev) =>
      prev.includes(code) ? prev : [...prev, code].sort(codeSort)
    );
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
      if (!res.ok) throw new Error(data?.error || "Speichern hat nicht geklappt.");
      clearCaptureMissing();
      router.push(`/collection/${data.id}`);
    } catch (e: any) {
      setError(e?.message || "Speichern hat nicht geklappt. Versuch es nochmal!");
      setPhase("idle");
    }
  }

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/capture" className="back-link">
          ← Zurück
        </Link>
        <span className="pill">Schritt 2 von 3</span>
      </header>

      <Steps current={2} />

      <div className="center">
        <h2 style={{ margin: 0 }}>Deine doppelten Sticker 🔁</h2>
      </div>

      {(phase === "camera" || phase === "idle") && (
        <div className="card">
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 2, fontSize: 16 }}>
            <li>
              Dreh die Sticker um. <b>Die Nummer muss oben sein!</b>
            </li>
            <li>
              <b>Höchstens 9 Sticker.</b> Ein Sticker pro Kästchen im Bild.
            </li>
            <li>Alle Sticker müssen ins Bild passen.</li>
          </ol>
          <p className="muted" style={{ margin: "8px 0 0", fontSize: 14 }}>
            Mehr als 9? Mach einfach noch ein Foto!
          </p>
        </div>
      )}

      {error && <div className="toast err">{error}</div>}
      {note && phase === "idle" && <div className="toast warn">{note}</div>}

      {(phase === "camera" || phase === "idle") && (
        <CameraCapture
          onCapture={handleCapture}
          gridOverlay
          shutterLabel={shots ? "📷 Noch ein Foto" : "📷 Sticker fotografieren"}
        />
      )}

      {phase === "recognizing" && (
        <FactLoader title="Ich lese die Nummern …" />
      )}

      {phase === "saving" && (
        <FactLoader title="Dein Link wird gebaut …" />
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
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Falsche Nummer dabei? Tipp sie an!
          </p>
        )}
        <ChipList codes={doubles} variant="give" onRemove={removeCode} />
        {(phase === "camera" || phase === "idle") && (
          <AddSticker onAdd={addCode} />
        )}
      </div>

      {lastRemoved && (
        <div className="toast warn" style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
          <span>{lastRemoved} ist weg.</span>
          <button className="shot-action" onClick={undoRemove}>↩️ Zurückholen</button>
        </div>
      )}

      {(phase === "idle" || phase === "camera") && (
        <div className="stack">
          <label style={{ fontWeight: 700, fontSize: 16 }}>
            Wie heißt du?
            <input
              className="textarea"
              style={{ minHeight: 0, height: 56, marginTop: 6 }}
              placeholder="Dein Name"
              value={owner}
              maxLength={40}
              onChange={(e) => setOwner(e.target.value)}
            />
          </label>
          <button
            className="btn btn-success"
            onClick={finish}
            disabled={phase === ("saving" as Phase)}
          >
            ✅ Fertig! Link erstellen
          </button>
        </div>
      )}
    </div>
  );
}
