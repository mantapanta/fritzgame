# FritzSwap – Panini-Tausch-Plattform

Mobile-first Web-App: Sammelalbum **Seite für Seite abfotografieren**, fehlende &
doppelte Sticker **automatisch per Gemini-Vision erkennen**, Sammlung als **Link**
teilen (WhatsApp & Co.) und mit anderen **tauschen**.

> Die ältere Datei `index.html` (Fußballspiel „Street Striker") bleibt unangetastet
> und ist unabhängig von dieser App.

## Ablauf

1. **Album erfassen** – geführte Aufnahme Seite für Seite (Fortschritt, Qualitäts-Check,
   „Passt / Neu aufnehmen"). Pro Seite wird gegen das bekannte Layout erkannt, welche
   Klebeplätze leer sind → fehlende Nummern.
2. **Doppelte erfassen** – ausgelegte Doppel-Sticker fotografieren (mehrere Fotos
   möglich); Gemini liest die Nummern.
3. **Link erstellen** – Sammlung wird gespeichert, du bekommst einen Share-Link.
4. **Tauschen** – Link des Gegenübers einfügen → App zeigt „Du gibst ab" (deine
   Doppelten, die dem anderen fehlen) und „Du bekommst" (dessen Doppelte, die dir fehlen).

## Tech

- **Next.js 14 (App Router)**, deploybar auf **Vercel**
- **Google Gemini** für die Bilderkennung (`lib/gemini.ts`)
- **Upstash Redis** als Speicher; lokal ohne Redis automatischer In-Memory-Fallback
- Album fest verdrahtet in `lib/album.ts` (leicht durch ein echtes Set ersetzbar)

## Lokal starten

```bash
npm install
cp .env.example .env.local   # GEMINI_API_KEY eintragen
npm run dev                  # http://localhost:3000
```

Ohne `GEMINI_API_KEY` funktionieren Sammlung/Teilen/Tausch-Abgleich, aber die
Foto-Erkennung liefert eine Fehlermeldung.

## Umgebungsvariablen

| Variable                          | Zweck                                                       |
| --------------------------------- | ----------------------------------------------------------- |
| `GEMINI_API_KEY`                  | Pflicht für die Erkennung (Google AI Studio)                |
| `GEMINI_MODEL`                    | optional, Default `gemini-2.0-flash`                        |
| `KV_REST_API_URL` / `..._TOKEN`   | Upstash Redis (Vercel-Integration); alternativ `UPSTASH_*`  |
| `UPSTASH_REDIS_REST_URL`/`_TOKEN` | Upstash Redis (native Namen); alternativ zu `KV_*`          |
| `NEXT_PUBLIC_BASE_URL`            | optional, Basis-URL für Share-Links                         |

## Deploy auf Vercel

1. Projekt aus diesem Repo importieren (Framework: Next.js – wird erkannt).
2. Im **Marketplace einen Upstash-Redis-Store** anlegen und mit dem Projekt verbinden (setzt die Redis-Variablen).
3. `GEMINI_API_KEY` als Environment Variable hinterlegen.
4. Deployen.

## Grenzen des ersten Wurfs

- Ein festes Album, keine Accounts (Sammlung = geheime Link-ID).
- Erkennung ist voll-automatisch (kein manuelles Nachtippen); als Schutz gibt es pro
  Foto einen Qualitäts-Check und eine „Neu aufnehmen"-Option.
- Fotos werden nicht dauerhaft gespeichert (nur die Ergebnis-Daten).
