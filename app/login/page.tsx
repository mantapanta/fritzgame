"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";

function LoginInner() {
  const params = useSearchParams();
  const sent = params.get("sent") === "1";
  const callbackUrl = params.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(sent);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await signIn("resend", { email: email.trim(), redirectTo: callbackUrl });
      setDone(true);
    } catch (err: any) {
      setError("Konnte keinen Login-Link senden. Bitte später erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/" className="back-link">
          ← Start
        </Link>
        <span className="pill">Anmelden</span>
      </header>

      <div className="center stack" style={{ gap: 6, marginTop: 12 }}>
        <div className="brand">
          Fritz<span className="swap">Swap</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Melde dich mit deiner E-Mail an – wir schicken dir einen Login-Link.
        </p>
      </div>

      {done ? (
        <div className="card stack center">
          <div style={{ fontSize: 40 }}>📬</div>
          <h3 style={{ margin: 0 }}>Check deine E-Mails</h3>
          <p className="muted" style={{ margin: 0 }}>
            Wir haben dir einen Login-Link geschickt. Öffne ihn auf diesem Gerät,
            um dich anzumelden. (Auch im Spam-Ordner schauen.)
          </p>
          <button className="btn btn-ghost" onClick={() => setDone(false)}>
            Andere E-Mail verwenden
          </button>
        </div>
      ) : (
        <form className="card stack" onSubmit={submit}>
          <input
            className="textarea"
            style={{ minHeight: 0, height: 50 }}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="deine@email.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <div className="toast err">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Sende Link …" : "Login-Link senden"}
          </button>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            Ein Konto ist nötig, damit deine Sammlung geräteübergreifend
            gespeichert wird und du sie mit anderen vergleichen kannst.
          </p>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card center" style={{ marginTop: 40 }}><div className="spinner" /></div>}>
      <LoginInner />
    </Suspense>
  );
}
