"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useCallback, useEffect, useState } from "react";
import qrcodegen from "qrcode-generator";
import FactLoader from "@/components/FactLoader";
import ChipList from "@/components/ChipList";
import { parseCollectionId } from "@/lib/client";

type MatchResult = {
  iGive: string[];
  iGet: string[];
  theirs: { id: string; owner?: string };
};

function qrSvg(text: string): string {
  try {
    const qr = qrcodegen(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  } catch {
    return "";
  }
}

function TradeInner() {
  const searchParams = useSearchParams();
  const { status: authStatus } = useSession();
  const [myCollectionId, setMyCollectionId] = useState<string | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const runMatch = useCallback(async (theirs: string) => {
    setLoading(true);
    setError(null);
    setMatch(null);
    try {
      const res = await fetch(
        `/api/match?theirs=${encodeURIComponent(theirs)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Das hat nicht geklappt. Versuch es nochmal!");
      setMatch(data);
    } catch (e: any) {
      setError(e?.message || "Das hat nicht geklappt. Versuch es nochmal!");
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
      setError("Das ist kein FritzSwap-Link. Frag nochmal nach!");
      return;
    }
    if (theirs === myCollectionId) {
      setError("Das ist dein eigener Link! 😄");
      return;
    }
    runMatch(theirs);
  }

  async function shareMyLink() {
    if (!myCollectionId) return;
    const url = `${window.location.origin}/collection/${myCollectionId}`;
    const text = `Meine Sticker-Sammlung! Tipp auf den Link. Dann siehst du, was wir tauschen können:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FritzSwap", text, url });
        return;
      } catch {
        /* abgebrochen – Fallback unten */
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      "_blank"
    );
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
          <Link href="/swap" className="back-link">← Zurück</Link>
          <span className="pill">Tauschen</span>
        </header>
        <div className="toast warn">Melde dich zuerst an!</div>
        <Link href="/login?callbackUrl=/trade" className="btn btn-primary">
          🔑 Anmelden
        </Link>
      </div>
    );
  }

  if (!myCollectionId) {
    return (
      <div className="stack">
        <header className="topbar">
          <Link href="/swap" className="back-link">← Zurück</Link>
          <span className="pill">Tauschen</span>
        </header>
        <div className="toast warn">Du brauchst erst deine Sammlung.</div>
        <Link href="/capture" className="btn btn-primary">
          📷 Album fotografieren
        </Link>
      </div>
    );
  }

  const qrUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/trade?theirs=${myCollectionId}`
      : "";

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/swap" className="back-link">
          ← Zurück
        </Link>
        <span className="pill">Tauschen</span>
      </header>

      <div className="card stack">
        <h3 style={{ margin: 0 }}>🤝 So tauschst du</h3>
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 2, fontSize: 16 }}>
          <li>Schick deinem Freund deinen Link.</li>
          <li>Dein Freund tippt drauf.</li>
          <li>Ihr seht sofort euren Tausch!</li>
        </ol>
        <button className="btn btn-primary" onClick={shareMyLink}>
          📤 Meinen Link schicken
        </button>
        <button className="btn" onClick={() => setShowQr((v) => !v)}>
          {showQr ? "QR-Code verstecken" : "🔳 QR-Code zeigen"}
        </button>
        {showQr && (
          <div className="stack center" style={{ alignItems: "center" }}>
            <div
              className="qr-box"
              dangerouslySetInnerHTML={{ __html: qrSvg(qrUrl) }}
            />
            <p className="muted" style={{ margin: 0, fontSize: 15 }}>
              Zeig das deinem Freund!
              <br />
              Er scannt es mit seiner Kamera. 📱
            </p>
          </div>
        )}
      </div>

      <details className="card">
        <summary>Du hast einen Link bekommen? 📬</summary>
        <div className="stack" style={{ marginTop: 12 }}>
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>
            Füg den Link hier ein:
          </p>
          <textarea
            className="textarea"
            placeholder="https://…/collection/abc123"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? "Moment …" : "Zeig mir den Tausch!"}
          </button>
        </div>
      </details>

      {error && <div className="toast err">{error}</div>}

      {loading && <FactLoader title="Ich vergleiche eure Sticker …" />}

      {match && (
        <div className="stack">
          <div className="center">
            <h2 style={{ margin: 0 }}>
              {match.iGive.length + match.iGet.length > 0
                ? "🎉 Ihr könnt tauschen!"
                : "😕 Diesmal passt nichts."}
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              {match.iGive.length + match.iGet.length > 0
                ? `Tausch mit ${match.theirs.owner || "deinem Freund"}`
                : "Frag einen anderen Freund!"}
            </p>
          </div>

          <div className="card stack">
            <div className="row" style={{ alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>🫴 Du gibst ab</h3>
              <span className="pill" style={{ flex: "0 0 auto" }}>
                {match.iGive.length}
              </span>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              Die hast du doppelt. Dein Freund braucht sie.
            </p>
            {match.iGive.length ? (
              <ChipList codes={match.iGive} variant="give" />
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Nichts dabei.
              </p>
            )}
          </div>

          <div className="card stack">
            <div className="row" style={{ alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>🎁 Du bekommst</h3>
              <span className="pill" style={{ flex: "0 0 auto" }}>
                {match.iGet.length}
              </span>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              Die fehlen dir. Dein Freund hat sie doppelt.
            </p>
            {match.iGet.length ? (
              <ChipList codes={match.iGet} variant="get" />
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Nichts dabei.
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
