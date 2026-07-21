"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import FactLoader from "@/components/FactLoader";
import ChipList from "@/components/ChipList";
import Steps from "@/components/Steps";
import { ALBUM } from "@/lib/album";
import type { Collection } from "@/lib/store";

export default function CollectionPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(`${window.location.origin}/collection/${id}`);
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setMyId(d?.collectionId ?? null))
      .catch(() => {});
    (async () => {
      try {
        const res = await fetch(`/api/collections/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Diese Sammlung gibt es nicht.");
        setCollection(data.collection);
      } catch (e: any) {
        setError(e?.message || "Diese Sammlung gibt es nicht. Prüf den Link!");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const isMine = myId === id;

  async function share() {
    const text = `Meine Sticker-Sammlung! Tipp auf den Link. Dann siehst du, was wir tauschen können:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FritzSwap", text, url: shareUrl });
        return;
      } catch {
        /* Nutzer hat abgebrochen – Fallback unten */
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`,
      "_blank"
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  if (loading) {
    return (
      <div className="stack" style={{ marginTop: 24 }}>
        <FactLoader title="Ich hole die Sammlung …" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="stack" style={{ marginTop: 40 }}>
        <div className="toast err">{error || "Diese Sammlung gibt es nicht."}</div>
        <Link href="/" className="btn">
          Zur Startseite
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/swap" className="back-link">
          ← Zurück
        </Link>
        <span className="pill">{isMine ? "Meine Sammlung" : "Sammlung"}</span>
      </header>

      {isMine && <Steps current={3} />}

      <div className="center">
        <h2 style={{ margin: 0 }}>
          {collection.owner ? collection.owner : "Sammler"}
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          {ALBUM.name}
        </p>
      </div>

      <div className="card">
        <div className="stats-row">
          <div className="stat">
            <b style={{ color: "var(--accent-2)" }}>{collection.doubles.length}</b>
            <span>Doppelt</span>
          </div>
          <div className="stat">
            <b style={{ color: "var(--need)" }}>{collection.missing.length}</b>
            <span>Fehlen</span>
          </div>
          <div className="stat">
            <b>
              {ALBUM.totalStickers - collection.missing.length}/
              {ALBUM.totalStickers}
            </b>
            <span>Im Album</span>
          </div>
        </div>
      </div>

      {isMine ? (
        <div className="card stack">
          <h3 style={{ margin: 0 }}>Schick den Link deinen Freunden! 📤</h3>
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>
            Dein Freund tippt drauf. Dann seht ihr, was ihr tauschen könnt.
          </p>
          <button className="btn btn-primary" onClick={share}>
            📤 Link schicken
          </button>
          <button className="btn" onClick={copy}>
            {copied ? "✓ Kopiert!" : "🔗 Link kopieren"}
          </button>
          <Link href="/trade" className="btn btn-ghost">
            Ich habe einen Link bekommen 📬
          </Link>
        </div>
      ) : (
        <div className="card stack">
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>
            Das ist die Sammlung von {collection.owner || "deinem Freund"}.
          </p>
          <Link
            href={`/trade?theirs=${collection.id}`}
            className="btn btn-primary"
          >
            🔁 Was können wir tauschen?
          </Link>
          {!myId && (
            <Link href="/capture" className="btn btn-ghost">
              📷 Erst mein Album fotografieren
            </Link>
          )}
        </div>
      )}

      <details className="card">
        <summary>Meine Doppelten ({collection.doubles.length})</summary>
        <div style={{ marginTop: 12 }}>
          <ChipList codes={collection.doubles} variant="give" />
        </div>
      </details>

      <details className="card">
        <summary>Die fehlen mir ({collection.missing.length})</summary>
        <div style={{ marginTop: 12 }}>
          <ChipList codes={collection.missing} variant="get" />
        </div>
      </details>
    </div>
  );
}
