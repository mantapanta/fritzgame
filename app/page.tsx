"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ALBUM } from "@/lib/album";
import { getMyId } from "@/lib/client";

export default function Home() {
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    setMyId(getMyId());
  }, []);

  return (
    <div className="stack">
      <div className="center stack" style={{ gap: 8, marginTop: 24 }}>
        <div className="brand">
          Fritz<span className="swap">Swap</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Album fotografieren · fehlende &amp; doppelte Sticker automatisch
          erkennen · per Link tauschen.
        </p>
      </div>

      <div className="card stack">
        <div className="row" style={{ alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{ALBUM.name}</div>
            <div className="muted" style={{ fontSize: 14 }}>
              {ALBUM.season} · {ALBUM.totalStickers} Sticker ·{" "}
              {ALBUM.pages.length} Seiten
            </div>
          </div>
        </div>
      </div>

      <div className="stack">
        <Link href="/capture" className="btn btn-primary">
          📷 Album erfassen
        </Link>
        {myId && (
          <Link href={`/collection/${myId}`} className="btn">
            📗 Meine Sammlung
          </Link>
        )}
        <Link href="/trade" className="btn btn-ghost">
          🔁 Mit jemandem tauschen
        </Link>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>So funktioniert&apos;s</h3>
        <ol className="muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Album Seite für Seite abfotografieren – du wirst durchgeführt.</li>
          <li>Doppelte Sticker ausgelegt abfotografieren.</li>
          <li>Du bekommst einen Link – teile ihn per WhatsApp.</li>
          <li>
            Öffne den Link eines anderen: die App zeigt, was ihr tauschen könnt.
          </li>
        </ol>
      </div>
    </div>
  );
}
