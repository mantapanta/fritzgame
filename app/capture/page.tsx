"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CameraCapture, { type Quality } from "@/components/CameraCapture";
import FactLoader from "@/components/FactLoader";
import ChipList from "@/components/ChipList";
import AddSticker from "@/components/AddSticker";
import Steps from "@/components/Steps";
import { ALBUM, TEAMS, codeSort } from "@/lib/album";
import { setCaptureMissing } from "@/lib/client";

type Status = "pending" | "ok" | "empty" | "failed";

type Shot = {
  id: number;
  dataUrl: string;
  status: Status;
  missing: string[];
  teams: string[];
  label: string;
};

const ANALYZE_TIMEOUT_MS = 45_000;

const labelForTeams = (codes: string[]) =>
  codes
    .map((c) => TEAMS.find((t) => t.code === c)?.label || c)
    .join(", ");

export default function CapturePage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [shots, setShots] = useState<Shot[]>([]);
  const [finishing, setFinishing] = useState(false);
  const [removedCodes, setRemovedCodes] = useState<Set<string>>(new Set());
  const [manualMissing, setManualMissing] = useState<string[]>([]);
  const [lastRemoved, setLastRemoved] = useState<string | null>(null);
  const nextId = useRef(1);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analyze = useCallback(async (id: number, dataUrl: string) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ANALYZE_TIMEOUT_MS);
    try {
      const res = await fetch("/api/recognize/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [dataUrl] }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erkennung fehlgeschlagen");

      const missing: string[] = data.missing || [];
      const teams: string[] = data.seenTeams || [];
      const recognizedSomething = teams.length > 0 || missing.length > 0;

      setShots((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: recognizedSomething ? "ok" : "empty",
                missing,
                teams,
                label: recognizedSomething
                  ? `${teams.length ? labelForTeams(teams) : "Extra-Seite"} · ${missing.length} fehlen`
                  : "Nichts erkannt. Mach das Foto neu!",
              }
            : s
        )
      );
    } catch (e: any) {
      setShots((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: "failed", label: "Hat nicht geklappt." }
            : s
        )
      );
    } finally {
      clearTimeout(timer);
    }
  }, []);

  function handleCapture(dataUrl: string, _quality: Quality) {
    const id = nextId.current++;
    setShots((prev) => [
      ...prev,
      { id, dataUrl, status: "pending", missing: [], teams: [], label: "Wird geprüft …" },
    ]);
    // Direkt im Hintergrund analysieren – Nutzer kann weiter fotografieren.
    analyze(id, dataUrl);
  }

  function removeShot(id: number) {
    setShots((prev) => prev.filter((s) => s.id !== id));
  }

  function retryShot(id: number) {
    const shot = shots.find((s) => s.id === id);
    if (!shot) return;
    setShots((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "pending", label: "Wird geprüft …" } : s
      )
    );
    analyze(id, shot.dataUrl);
  }

  function removeCode(code: string) {
    setRemovedCodes((prev) => new Set(prev).add(code));
    setManualMissing((prev) => prev.filter((c) => c !== code));
    setLastRemoved(code);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setLastRemoved(null), 6000);
  }

  function undoRemove() {
    if (!lastRemoved) return;
    setRemovedCodes((prev) => {
      const next = new Set(prev);
      next.delete(lastRemoved);
      return next;
    });
    setLastRemoved(null);
  }

  function addCode(code: string) {
    setRemovedCodes((prev) => {
      const next = new Set(prev);
      next.delete(code);
      return next;
    });
    setManualMissing((prev) => (prev.includes(code) ? prev : [...prev, code]));
  }

  const pending = shots.filter((s) => s.status === "pending").length;
  const problems = shots.filter((s) => s.status === "failed" || s.status === "empty");
  const okShots = shots.filter((s) => s.status === "ok");

  // Eine Quelle der Wahrheit: erkannt + nachgetragen − entfernt
  const effectiveMissing = useMemo(
    () =>
      Array.from(
        new Set([...okShots.flatMap((s) => s.missing), ...manualMissing])
      )
        .filter((c) => !removedCodes.has(c))
        .sort(codeSort),
    [okShots, manualMissing, removedCodes]
  );
  const seenTeams = Array.from(new Set(okShots.flatMap((s) => s.teams)));

  function finish() {
    if (pending > 0) {
      setFinishing(true); // auf ausstehende Prüfungen warten (mit Fakten-Loader)
      return;
    }
    setCaptureMissing(effectiveMissing);
    router.push("/spares");
  }

  // Sobald alle Prüfungen durch sind, automatisch weiter.
  useEffect(() => {
    if (finishing && pending === 0) {
      setCaptureMissing(effectiveMissing);
      router.push("/spares");
    }
  }, [finishing, pending, effectiveMissing, router]);

  // ---- Login-Gate ----
  if (authStatus === "loading") {
    return (
      <div className="card center" style={{ marginTop: 40 }}>
        <div className="spinner" />
      </div>
    );
  }
  if (authStatus !== "authenticated") {
    return (
      <div className="stack">
        <header className="topbar">
          <Link href="/swap" className="back-link">← Zurück</Link>
          <span className="pill">Fotografieren</span>
        </header>
        <div className="toast warn">Melde dich zuerst an!</div>
        <Link href="/login?callbackUrl=/capture" className="btn btn-primary">
          🔑 Anmelden
        </Link>
      </div>
    );
  }

  if (finishing) {
    const analyzed = shots.length - pending;
    return (
      <div className="stack">
        <header className="topbar">
          <span className="back-link">&nbsp;</span>
          <span className="pill">Auswertung</span>
        </header>
        <FactLoader
          progress={shots.length ? analyzed / shots.length : 1}
          title="Deine Fotos werden geprüft …"
          subtitle={`${analyzed} von ${shots.length} fertig`}
        />
      </div>
    );
  }

  const badge = (s: Shot) => {
    if (s.status === "pending") return <span className="badge b-pending">⏳</span>;
    if (s.status === "ok") return <span className="badge b-ok">✓</span>;
    return <span className="badge b-warn">!</span>;
  };

  const actionFor = (s: Shot) => {
    if (s.status === "ok") return { label: "✕ Löschen", fn: () => removeShot(s.id) };
    if (s.status === "failed")
      return { label: "🔄 Nochmal versuchen", fn: () => retryShot(s.id) };
    return { label: "🗑️ Weg damit", fn: () => removeShot(s.id) };
  };

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/swap" className="back-link">← Zurück</Link>
        <span className="pill">Schritt 1 von 3</span>
      </header>

      <Steps current={1} />

      <div className="center">
        <h2 style={{ margin: 0 }}>Fotografiere dein Album! 📖</h2>
        <p className="muted" style={{ margin: "4px 0 0", fontSize: 16 }}>
          Nur Seiten mit leeren Feldern. Jedes Foto wird sofort geprüft.
        </p>
      </div>

      <div className="stats-row">
        <div className="stat"><b>{shots.length}</b><span>Fotos</span></div>
        <div className="stat"><b>{seenTeams.length}/{ALBUM.teamCount}</b><span>Teams</span></div>
        <div className="stat"><b style={{ color: "var(--need)" }}>{effectiveMissing.length}</b><span>fehlen mir</span></div>
      </div>

      <CameraCapture
        onCapture={handleCapture}
        shutterLabel={shots.length ? "📷 Nächste Seite" : "📷 Foto machen"}
      />

      {problems.length > 0 && (
        <div className="toast warn">
          {problems.length === 1 ? "1 Foto hat" : `${problems.length} Fotos haben`} nicht geklappt.
          <br />
          Tipp bei ihnen auf 🔄 Nochmal versuchen.
        </div>
      )}

      {shots.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>
            Deine Fotos{pending ? ` · ${pending} werden geprüft …` : ""}
          </div>
          <div className="shotlist">
            {shots.map((s) => {
              const action = actionFor(s);
              return (
                <div key={s.id} className={`shot ${s.status}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.dataUrl} alt="" />
                  <div className="shot-info">
                    {badge(s)}
                    <span className="shot-label">{s.label}</span>
                  </div>
                  <button className="shot-action" onClick={action.fn}>
                    {action.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lastRemoved && (
        <div className="toast warn" style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
          <span>{lastRemoved} ist weg.</span>
          <button className="shot-action" onClick={undoRemove}>↩️ Zurückholen</button>
        </div>
      )}

      {(effectiveMissing.length > 0 || okShots.length > 0) && (
        <details className="card" open={effectiveMissing.length > 0 && effectiveMissing.length <= 24}>
          <summary>Diese Sticker fehlen dir ({effectiveMissing.length})</summary>
          <div className="stack" style={{ marginTop: 12 }}>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              Falsche Nummer dabei? Tipp sie an!
            </p>
            <ChipList codes={effectiveMissing} variant="get" onRemove={removeCode} />
            <AddSticker onAdd={addCode} />
          </div>
        </details>
      )}

      {okShots.length > 0 && (
        <button
          className="btn btn-success"
          onClick={finish}
          disabled={pending > 0}
        >
          {pending > 0
            ? `Warte kurz … (${pending} Fotos)`
            : "Weiter: Deine Doppelten →"}
        </button>
      )}
    </div>
  );
}
