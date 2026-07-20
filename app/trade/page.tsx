"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { parseCollectionId } from "@/lib/client";

type MatchResult = {
  iGive: string[];
  iGet: string[];
  theirs: { id: string; owner?: string };
};

function TradeInner() {
  const searchParams = useSearchParams();
  const { status: authStatus } = useSession();
  const [myCollectionId, setMyCollectionId] = useState<string | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runMatch = useCallback(async (theirs: string) => {
    setLoading(true);
    setError(null);
    setMatch(null);
    try {
      const res = await fetch(
        `/api/match?theirs=${encodeURIComponent(theirs)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Abgleich fehlgeschlagen.");
      setMatch(data);
    } catch (e: any) {
      setError(e?.message || "Abgleich fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      if (authStatus === "unauthenticated") setMeLoaded(true);
      return;
    }
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setMyCollectionId(d?.collectionId ?? null))
      .catch(() => {})
      .finally(() => setMeLoaded(true));
  }, [authStatus]);

  useEffect(() => {
    const theirs = searchParams.get("theirs");
    if (authStatus === "authenticated" && myCollectionId && theirs) {
      setInput(theirs);
      runMatch(theirs);
    }
  }, [searchParams, runMatch, authStatus, myCollectionId]);

  function submit() {
    const theirs = parseCollectionId(input);
    if (!theirs) {
      setError("Konnte keinen gültigen Link / keine ID erkennen.");
      return;
    }
    if (theirs === myCollectionId) {
      setError("Das ist deine eigene Sammlung 🙂");
      return;
    }
    runMatch(theirs);
  }

  if (authStatus === "loading" || !meLoaded) {
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
          <Link href="/swap" className="back-link">← Start</Link>
          <span className="pill">Tauschen</span>
        </header>
        <div className="toast warn">Bitte melde dich zuerst an.</div>
        <Link href="/login?callbackUrl=/trade" className="btn btn-primary">
          Anmelden
        </Link>
      </div>
    );
  }

  if (!myCollectionId) {
    return (
      <div className="stack">
        <header className="topbar">
          <Link href="/swap" className="back-link">← Start</Link>
          <span className="pill">Tauschen</span>
        </header>
        <div className="toast warn">
          Du brauchst zuerst eine eigene Sammlung, um vergleichen zu können.
        </div>
        <Link href="/capture" className="btn btn-primary">
          📷 Sticker jetzt erfassen
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/" className="back-link">
          ← Start
        </Link>
        <span className="pill">Tauschen</span>
      </header>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>Link des Gegenübers</h3>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          Füge den geteilten FritzSwap-Link (oder die ID) ein.
        </p>
        <textarea
          className="textarea"
          placeholder="https://…/collection/abc123"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? "Vergleiche …" : "Vergleichen"}
        </button>
      </div>

      {error && <div className="toast err">{error}</div>}

      {loading && (
        <div className="card center stack" style={{ alignItems: "center" }}>
          <div className="spinner" />
        </div>
      )}

      {match && (
        <div className="stack">
          <div className="center">
            <h2 style={{ margin: 0 }}>
              {match.iGive.length + match.iGet.length > 0
                ? "🎉 Ihr könnt tauschen!"
                : "Kein direkter Tausch möglich"}
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              Abgleich mit {match.theirs.owner || "der anderen Sammlung"}
            </p>
          </div>

          <div className="card stack">
            <div className="row" style={{ alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Du gibst ab</h3>
              <span className="pill" style={{ flex: "0 0 auto" }}>
                {match.iGive.length}
              </span>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Deine Doppelten, die dem anderen fehlen.
            </p>
            {match.iGive.length ? (
              <div className="grid-numbers">
                {match.iGive.map((n) => (
                  <span key={n} className="chip give">
                    {n}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Nichts Passendes.
              </p>
            )}
          </div>

          <div className="card stack">
            <div className="row" style={{ alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Du bekommst</h3>
              <span className="pill" style={{ flex: "0 0 auto" }}>
                {match.iGet.length}
              </span>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Doppelte des anderen, die dir fehlen.
            </p>
            {match.iGet.length ? (
              <div className="grid-numbers">
                {match.iGet.map((n) => (
                  <span key={n} className="chip get">
                    {n}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Nichts Passendes.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TradePage() {
  return (
    <Suspense
      fallback={
        <div className="card center" style={{ marginTop: 40 }}>
          <div className="spinner" />
        </div>
      }
    >
      <TradeInner />
    </Suspense>
  );
}
