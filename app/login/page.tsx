"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";

function LoginInner() {
  const params = useSearchParams();
  const router = useRouter();
  const callbackUrl = params.get("callbackUrl") || "/";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.toUpperCase().replace(/[^A-Z]/g, "");
    if (clean.length !== 6) {
      setError("Der Code besteht aus 6 Buchstaben.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      code: clean,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Code ungültig. Bitte prüfe die Eingabe.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/swap" className="back-link">← Start</Link>
        <span className="pill">Anmelden</span>
      </header>

      <div className="center stack" style={{ gap: 6, marginTop: 12 }}>
        <div className="brand">
          Fritz<span className="swap">Swap</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Gib deinen 6-stelligen Zugangscode ein.
        </p>
      </div>

      <form className="card stack" onSubmit={submit}>
        <input
          className="textarea code-input"
          style={{ minHeight: 0, height: 64 }}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="ABCDEF"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))
          }
          required
        />
        {error && <div className="toast err">{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Prüfe …" : "Anmelden"}
        </button>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>
          Noch keinen Code? Den bekommst du von Fritz.
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="card center" style={{ marginTop: 40 }}>
          <div className="spinner" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
