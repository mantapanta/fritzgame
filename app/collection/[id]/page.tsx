"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
        if (!res.ok) throw new Error(data?.error || "Nicht gefunden.");
        setCollection(data.collection);
      } catch (e: any) {
        setError(e?.message || "Sammlung konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const isMine = myId === id;

  async function share() {
    const text = `Meine Sticker-Sammlung (${ALBUM.name}). Öffne den Link, um zu sehen, was wir tauschen können:`;
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
      <div className="card center stack" style={{ alignItems: "center", marginTop: 40 }}>
        <div className="spinner" />
        <div className="muted">Sammlung wird geladen …</div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="stack" style={{ marginTop: 40 }}>
        <div className="toast err">{error || "Sammlung nicht gefunden."}</div>
        <Link href="/" className="btn">
          Zur Startseite
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
        <span className="pill">{isMine ? "Meine Sammlung" : "Sammlung"}</span>
      </header>

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
            <span>Doppelte</span>
          </div>
          <div className="stat">
            <b style={{ color: "var(--need)" }}>{collection.missing.length}</b>
            <span>Fehlend</span>
          </div>
          <div className="stat">
            <b>
              {ALBUM.totalStickers - collection.missing.length}/
              {ALBUM.totalStickers}
            </b>
            <span>Komplett</span>
          </div>
        </div>
      </div>

      {isMine ? (
        <div className="card stack">
          <h3 style={{ margin: 0 }}>Teilen &amp; tauschen</h3>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Schick diesen Link an Freunde. Wer ihn öffnet, sieht sofort, welche
            Sticker ihr tauschen könnt.
          </p>
          <button className="btn btn-primary" onClick={share}>
            📤 Link teilen
          </button>
          <button className="btn" onClick={copy}>
            {copied ? "✓ Kopiert" : "🔗 Link kopieren"}
          </button>
          <Link href="/trade" className="btn btn-ghost">
            Link von jemand anderem prüfen
          </Link>
        </div>
      ) : (
        <div className="card stack">
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Vergleiche diese Sammlung mit deiner eigenen.
          </p>
          <Link
            href={`/trade?theirs=${collection.id}`}
            className="btn btn-primary"
          >
            🔁 Was können wir tauschen?
          </Link>
          {!myId && (
            <Link href="/capture" className="btn btn-ghost">
              Zuerst eigenes Album erfassen
            </Link>
          )}
        </div>
      )}

      <details className="card">
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          Doppelte anzeigen ({collection.doubles.length})
        </summary>
        <div className="grid-numbers" style={{ marginTop: 12 }}>
          {collection.doubles.map((n) => (
            <span key={n} className="chip give">
              {n}
            </span>
          ))}
        </div>
      </details>

      <details className="card">
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          Fehlende anzeigen ({collection.missing.length})
        </summary>
        <div className="grid-numbers" style={{ marginTop: 12 }}>
          {collection.missing.map((n) => (
            <span key={n} className="chip get">
              {n}
            </span>
          ))}
        </div>
      </details>
    </div>
  );
}
