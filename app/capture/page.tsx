"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import CameraCapture, { type Quality } from "@/components/CameraCapture";
import { ALBUM, TOTAL_PAGES } from "@/lib/album";
import { setCaptureMissing } from "@/lib/client";

type Phase = "camera" | "checking" | "recognizing" | "result";

type PageResult = {
  missing: number[];
  emptyCount: number;
  slotCount: number;
};

export default function CapturePage() {
  const router = useRouter();
  const [pageIdx, setPageIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("camera");
  const [captured, setCaptured] = useState<{
    dataUrl: string;
    quality: Quality;
  } | null>(null);
  const [result, setResult] = useState<PageResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fehlende Sticker je Seite (überschreibbar bei Neuaufnahme).
  const missingByPage = useRef<Map<number, number[]>>(new Map());

  const page = ALBUM.pages[pageIdx];
  const progress = useMemo(
    () => Math.round((pageIdx / TOTAL_PAGES) * 100),
    [pageIdx]
  );

  async function recognize(dataUrl: string) {
    setPhase("recognizing");
    setError(null);
    try {
      const res = await fetch("/api/recognize/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageNo: page.pageNo, images: [dataUrl] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erkennung fehlgeschlagen.");
      setResult({
        missing: data.missing || [],
        emptyCount: data.emptyCount ?? 0,
        slotCount: data.slotCount ?? page.slots.length,
      });
      setPhase("result");
    } catch (e: any) {
      setError(e?.message || "Erkennung fehlgeschlagen.");
      setPhase("camera");
      setCaptured(null);
    }
  }

  function handleCapture(dataUrl: string, quality: Quality) {
    setCaptured({ dataUrl, quality });
    if (!quality.ok) {
      setPhase("checking");
    } else {
      recognize(dataUrl);
    }
  }

  function retake() {
    setCaptured(null);
    setResult(null);
    setError(null);
    setPhase("camera");
  }

  function acceptPage() {
    if (result) missingByPage.current.set(page.pageNo, result.missing);
    if (pageIdx + 1 < TOTAL_PAGES) {
      setPageIdx((i) => i + 1);
      retake();
    } else {
      finish();
    }
  }

  function finish() {
    if (result) missingByPage.current.set(page.pageNo, result.missing);
    const all = new Set<number>();
    for (const nums of missingByPage.current.values()) {
      nums.forEach((n) => all.add(n));
    }
    setCaptureMissing(Array.from(all).sort((a, b) => a - b));
    router.push("/spares");
  }

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/" className="back-link">
          ← Abbrechen
        </Link>
        <span className="pill">
          Seite {pageIdx + 1} / {TOTAL_PAGES}
        </span>
      </header>

      <div className="progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="center">
        <h2 style={{ margin: "4px 0 0" }}>{page.label}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {page.slots.length} Klebeplätze · Nr. {page.slots[0].number}–
          {page.slots[page.slots.length - 1].number}
        </p>
      </div>

      {error && <div className="toast err">{error}</div>}

      {phase === "camera" && (
        <>
          <p className="muted center" style={{ margin: 0 }}>
            Halte die ganze Seite formatfüllend und gerade ins Bild.
          </p>
          <CameraCapture onCapture={handleCapture} shutterLabel="Seite fotografieren" />
        </>
      )}

      {phase === "checking" && captured && (
        <div className="stack">
          <div className="camera-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={captured.dataUrl} alt="Aufnahme" />
          </div>
          <div className="toast warn">
            {captured.quality.reason || "Bildqualität könnte besser sein."}
          </div>
          <div className="row">
            <button className="btn" onClick={retake}>
              Neu aufnehmen
            </button>
            <button
              className="btn btn-primary"
              onClick={() => recognize(captured.dataUrl)}
            >
              Trotzdem verwenden
            </button>
          </div>
        </div>
      )}

      {phase === "recognizing" && (
        <div className="card center stack" style={{ alignItems: "center" }}>
          <div className="spinner" />
          <div className="muted">Seite wird ausgewertet …</div>
        </div>
      )}

      {phase === "result" && result && (
        <div className="stack">
          {captured && (
            <div className="camera-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={captured.dataUrl} alt="Aufnahme" />
            </div>
          )}
          <div className="card stack">
            <div className="stats-row">
              <div className="stat">
                <b>{result.slotCount - result.missing.length}</b>
                <span>vorhanden</span>
              </div>
              <div className="stat">
                <b style={{ color: "var(--need)" }}>{result.missing.length}</b>
                <span>fehlt</span>
              </div>
            </div>
            {result.missing.length > 0 && (
              <div className="grid-numbers">
                {result.missing.map((n) => (
                  <span key={n} className="chip get">
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="row">
            <button className="btn" onClick={retake}>
              Neu aufnehmen
            </button>
            <button className="btn btn-success" onClick={acceptPage}>
              {pageIdx + 1 < TOTAL_PAGES ? "Passt, weiter →" : "Fertig, weiter"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
