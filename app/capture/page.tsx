"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import CameraCapture, { type Quality } from "@/components/CameraCapture";
import FactLoader from "@/components/FactLoader";
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

const labelForTeams = (codes: string[]) =>
  codes
    .map((c) => TEAMS.find((t) => t.code === c)?.label || c)
    .join(", ");

export default function CapturePage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [shots, setShots] = useState<Shot[]>([]);
  const [finishing, setFinishing] = useState(false);
  const nextId = useRef(1);

  const analyze = useCallback(async (id: number, dataUrl: string) => {
    try {
      const res = await fetch("/api/recognize/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [dataUrl] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erkennung fehlgeschlagen.");

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
                  ? `${teams.length ? labelForTeams(teams) : "Spezialseite"} · ${missing.length} leer`
                  : "Nichts erkannt – neu aufnehmen",
              }
            : s
        )
      );
    } catch (e: any) {
      setShots((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: "failed", label: "Fehlgeschlagen – neu aufnehmen" }
            : s
        )
      );
    }
  }, []);

  function handleCapture(dataUrl: string, _quality: Quality) {
    const id = nextId.current++;
    setShots((prev) => [
      ...prev,
      { id, dataUrl, status: "pending", missing: [], teams: [], label: "wird geprüft …" },
    ]);
    // Direkt im Hintergrund analysieren – Nutzer kann weiter fotografieren.
    analyze(id, dataUrl);
  }

  function removeShot(id: number) {
    setShots((prev) => prev.filter((s) => s.id !== id));
  }

  function retakeShot(id: number) {
    // Foto entfernen; der Nutzer nimmt es einfach neu auf.
    removeShot(id);
  }

  const pending = shots.filter((s) => s.status === "pending").length;
  const problems = shots.filter((s) => s.status === "failed" || s.status === "empty");
  const okShots = shots.filter((s) => s.status === "ok");

  const allMissing = Array.from(
    new Set(okShots.flatMap((s) => s.missing))
  ).sort(codeSort);
  const seenTeams = Array.from(new Set(okShots.flatMap((s) => s.teams)));

  function finish() {
    if (pending > 0) {
      setFinishing(true); // auf ausstehende Prüfungen warten (mit Fakten-Loader)
      return;
    }
    setCaptureMissing(allMissing);
    router.push("/spares");
  }

  // Sobald alle Prüfungen durch sind, automatisch weiter.
  useEffect(() => {
    if (finishing && pending === 0) {
      setCaptureMissing(allMissing);
      router.push("/spares");
    }
  }, [finishing, pending, allMissing, router]);

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
          <Link href="/" className="back-link">← Start</Link>
          <span className="pill">Sticker erfassen</span>
        </header>
        <div className="toast warn">Bitte melde dich zuerst an.</div>
        <Link href="/login?callbackUrl=/capture" className="btn btn-primary">
          Anmelden
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
          title="Fotos werden ausgewertet …"
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

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/" className="back-link">← Abbrechen</Link>
        <span className="pill">Sticker erfassen</span>
      </header>

      <div className="center">
        <h2 style={{ margin: 0 }}>Seiten mit Lücken fotografieren</h2>
        <p className="muted" style={{ margin: "4px 0 0" }}>
          Fotografiere <b>nur Seiten, auf denen dir Sticker fehlen</b>. Jedes Foto
          wird sofort geprüft – du siehst gleich, ob es passt.
        </p>
      </div>

      <div className="stats-row">
        <div className="stat"><b>{shots.length}</b><span>Fotos</span></div>
        <div className="stat"><b>{seenTeams.length}/{ALBUM.teamCount}</b><span>Teams</span></div>
        <div className="stat"><b style={{ color: "var(--need)" }}>{allMissing.length}</b><span>fehlend</span></div>
      </div>

      <CameraCapture
        onCapture={handleCapture}
        shutterLabel={shots.length ? "Nächste Seite aufnehmen" : "Seite aufnehmen"}
      />

      {problems.length > 0 && (
        <div className="toast warn">
          {problems.length} Foto{problems.length === 1 ? "" : "s"} sind nicht
          verwertbar (unten mit „!" markiert). Nimm genau diese neu auf, solange
          die Seiten noch offen sind.
        </div>
      )}

      {shots.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>
            Aufnahmen{pending ? ` · ${pending} werden geprüft …` : ""}
          </div>
          <div className="shotlist">
            {shots.map((s) => (
              <div key={s.id} className={`shot ${s.status}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.dataUrl} alt="" />
                <div className="shot-info">
                  {badge(s)}
                  <span className="shot-label">{s.label}</span>
                </div>
                <button
                  className="shot-action"
                  onClick={() =>
                    s.status === "ok" ? removeShot(s.id) : retakeShot(s.id)
                  }
                >
                  {s.status === "ok" ? "Entfernen" : "Neu aufnehmen"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {allMissing.length > 0 && (
        <details className="card">
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>
            Bisher fehlend ({allMissing.length})
          </summary>
          <div className="grid-numbers" style={{ marginTop: 12 }}>
            {allMissing.map((c) => (
              <span key={c} className="chip get">{c}</span>
            ))}
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
            ? `Warte auf Prüfung (${pending}) …`
            : "Weiter zu den Doppelten →"}
        </button>
      )}
    </div>
  );
}
