"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ALBUM } from "@/lib/album";

export default function Home() {
  const { status } = useSession();
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setCollectionId(d?.collectionId ?? null);
        setEmail(d?.email ?? null);
      })
      .catch(() => {});
  }, [status]);

  const authed = status === "authenticated";

  return (
    <div className="stack">
      <div className="center stack" style={{ gap: 8, marginTop: 24 }}>
        <div className="brand">
          Fritz<span className="swap">Swap</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Fehlende &amp; doppelte Sticker automatisch erkennen · per Link tauschen.
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
            📷 Sticker erfassen
          </Link>
          {collectionId && (
            <Link href={`/collection/${collectionId}`} className="btn">
              📗 Meine Sammlung
            </Link>
          )}
          <Link href="/trade" className="btn btn-ghost">
            🔁 Mit jemandem tauschen
          </Link>
        </div>
      ) : (
        <div className="stack">
          <Link href="/login" className="btn btn-primary">
            Anmelden / Registrieren
          </Link>
          <p className="muted center" style={{ margin: 0, fontSize: 13 }}>
            Mit Konto wird deine Sammlung gespeichert und ist mit anderen
            vergleichbar.
          </p>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>So funktioniert&apos;s</h3>
        <ol
          className="muted"
          style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}
        >
          <li>Nur die Seiten fotografieren, auf denen dir Sticker fehlen.</li>
          <li>Doppelte Sticker ausgelegt abfotografieren.</li>
          <li>Du bekommst einen Link – teile ihn per WhatsApp.</li>
          <li>Öffne den Link eines anderen: die App zeigt, was ihr tauschen könnt.</li>
        </ol>
      </div>

      {authed && (
        <button
          className="btn btn-ghost"
          onClick={() => signOut({ redirectTo: "/" })}
        >
          {email ? `Abmelden (${email})` : "Abmelden"}
        </button>
      )}
    </div>
  );
}
