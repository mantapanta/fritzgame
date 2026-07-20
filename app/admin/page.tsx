"use client";

import Link from "next/link";
import { useState } from "react";

type User = { code: string; name: string; createdAt: number };

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function load(sec: string) {
    setError(null);
    const res = await fetch("/api/admin/users", {
      headers: { "x-admin-secret": sec },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Zugriff verweigert.");
    setUsers(data.users || []);
  }

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await load(secret);
      setUnlocked(true);
    } catch (err: any) {
      setError(err?.message || "Zugriff verweigert.");
    } finally {
      setBusy(false);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Anlegen fehlgeschlagen.");
      setName("");
      await load(secret);
    } catch (err: any) {
      setError(err?.message || "Anlegen fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  return (
    <div className="stack">
      <header className="topbar">
        <Link href="/" className="back-link">← Start</Link>
        <span className="pill">Admin</span>
      </header>

      <div className="center">
        <h2 style={{ margin: 0 }}>Zugangscodes verwalten</h2>
        <p className="muted" style={{ margin: 0 }}>
          Lege Personen an und gib ihnen ihren 6-stelligen Login-Code.
        </p>
      </div>

      {error && <div className="toast err">{error}</div>}

      {!unlocked ? (
        <form className="card stack" onSubmit={unlock}>
          <input
            className="textarea"
            style={{ minHeight: 0, height: 50 }}
            type="password"
            placeholder="Admin-Passwort"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            required
          />
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Prüfe …" : "Entsperren"}
          </button>
        </form>
      ) : (
        <>
          <form className="card stack" onSubmit={create}>
            <div style={{ fontWeight: 700 }}>Neue Person anlegen</div>
            <input
              className="textarea"
              style={{ minHeight: 0, height: 50 }}
              placeholder="Name (z.B. Max Mustermann)"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="btn btn-success" type="submit" disabled={busy}>
              Code erzeugen
            </button>
          </form>

          <div className="card stack">
            <div style={{ fontWeight: 700 }}>
              Angelegte Personen ({users.length})
            </div>
            {users.length === 0 && (
              <p className="muted" style={{ margin: 0 }}>Noch niemand angelegt.</p>
            )}
            {users.map((u) => (
              <div key={u.code} className="userrow">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div className="code-mono">{u.code}</div>
                </div>
                <button className="shot-action" onClick={() => copy(u.code)}>
                  {copied === u.code ? "✓ kopiert" : "Code kopieren"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
