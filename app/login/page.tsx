"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useEffect, useRef, useState } from "react";

const CODE_LEN = 6;

function LoginInner() {
  const params = useSearchParams();
  const router = useRouter();
  const callbackUrl = params.get("callbackUrl") || "/";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittingRef = useRef(false);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toUpperCase();
    const clean = raw.replace(/[^A-Z]/g, "").slice(0, CODE_LEN);
    if (raw.replace(/\s/g, "").length > clean.length) {
      // Kind hat Ziffern/Zeichen getippt – kurz erklären statt still schlucken
      setHint(true);
      if (hintTimer.current) clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHint(false), 1500);
    }
    setCode(clean);
    setError(null);
  }

  async function doSubmit(clean: string) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { code: clean, redirect: false });
    setLoading(false);
    submittingRef.current = false;
    if (res?.error) {
      setError("Das war nicht richtig. Frag Fritz! 🙈");
      setShaking(true);
      setTimeout(() => setShaking(false), 450);
      setCode("");
      inputRef.current?.focus();
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  // Auto-Abschicken, sobald 6 Buchstaben da sind
  useEffect(() => {
    if (code.length === CODE_LEN && !loading) doSubmit(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== CODE_LEN) {
      setError("Da fehlen noch Buchstaben.");
      return;
    }
    doSubmit(code);
  }

  const activeIdx = Math.min(code.length, CODE_LEN - 1);

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/swap" className="back-link">← Zurück</Link>
        <span className="pill">Anmelden</span>
      </header>

      <div className="center stack" style={{ gap: 6, marginTop: 12 }}>
        <div className="brand">
          Fritz<span className="swap">Swap</span>
        </div>
        <h2 style={{ margin: "6px 0 0" }}>Dein Geheim-Code 🔑</h2>
        <p className="muted" style={{ margin: 0, fontSize: 16 }}>
          6 Buchstaben. Den Code hat dir Fritz gegeben.
        </p>
      </div>

      <form className="card stack" onSubmit={submit}>
        <div
          style={{ position: "relative" }}
          onClick={() => inputRef.current?.focus()}
        >
          <div className={`code-boxes${shaking ? " shake" : ""}`}>
            {Array.from({ length: CODE_LEN }).map((_, i) => (
              <div
                key={i}
                className={
                  "code-box" +
                  (code[i] ? " filled" : "") +
                  (i === activeIdx && code.length < CODE_LEN ? " active" : "")
                }
              >
                {code[i] ?? ""}
              </div>
            ))}
          </div>
          <input
            ref={inputRef}
            aria-label="Geheim-Code"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              border: "none",
              fontSize: 30,
            }}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="one-time-code"
            maxLength={CODE_LEN}
            value={code}
            onChange={onChange}
            required
          />
        </div>
        {hint && <div className="toast warn">Nur Buchstaben! 🔤</div>}
        {error && <div className="toast err">{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Moment …" : "Los geht's!"}
        </button>
        <p className="muted center" style={{ margin: 0, fontSize: 14 }}>
          Kein Code? Frag Fritz!
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
