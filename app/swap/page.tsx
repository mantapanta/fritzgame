"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ALBUM } from "@/lib/album";

export default function SwapHome() {
  const { status } = useSession();
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setCollectionId(d?.collectionId ?? null);
        setName(d?.name ?? null);
      })
      .catch(() => {});
  }, [status]);

  const authed = status === "authenticated";

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/" className="back-link">
          ← Zurück
        </Link>
        <span className="pill">FritzSwap</span>
      </header>

      <div className="center stack" style={{ gap: 8, marginTop: 8 }}>
        <div className="brand">
          Fritz<span className="swap">Swap</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Tausche Sticker mit deinen Freunden!
        </p>
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 18 }}>{ALBUM.name}</div>
        <div className="muted" style={{ fontSize: 14 }}>
          {ALBUM.totalStickers} Sticker · {ALBUM.teamCount} Teams
        </div>
      </div>

      {status === "loading" ? (
        <div className="card center">
          <div className="spinner" />
        </div>
      ) : authed ? (
        <div className="stack">
          <Link href="/capture" className="btn btn-primary">
            📷 Album fotografieren
          </Link>
          {collectionId && (
            <Link href={`/collection/${collectionId}`} className="btn">
              📗 Meine Sammlung
            </Link>
          )}
          <Link href="/trade" className="btn btn-ghost">
            🔁 Tauschen
          </Link>
        </div>
      ) : (
        <div className="stack">
          <Link href="/login" className="btn btn-primary">
            🔑 Anmelden
          </Link>
          <p className="muted center" style={{ margin: 0, fontSize: 15 }}>
            Deinen Code bekommst du von Fritz.
          </p>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>So geht&apos;s:</h3>
        <ol
          style={{ margin: 0, paddingLeft: 18, lineHeight: 2, fontSize: 16 }}
        >
          <li>📷 Fotografiere die Seiten mit Lücken.</li>
          <li>🔁 Fotografiere deine doppelten Sticker.</li>
          <li>🔗 Du bekommst einen Link.</li>
          <li>🤝 Schick ihn einem Freund. Fertig!</li>
        </ol>
      </div>

      {authed && (
        <button
          className="btn btn-ghost"
          onClick={() => signOut({ redirectTo: "/swap" })}
        >
          {name ? `🚪 Abmelden (${name})` : "🚪 Abmelden"}
        </button>
      )}
    </div>
  );
}
