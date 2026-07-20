# FritzSwap – Panini FIFA World Cup 2026 Tausch-Plattform

Mobile-first Web-App für das **Panini FIFA World Cup 2026** Sammelalbum (980 Sticker,
48 Teams): Album **abfotografieren**, fehlende & doppelte Sticker **automatisch per
Gemini-Vision erkennen**, Sammlung als **Link** teilen (WhatsApp & Co.) und mit
anderen **tauschen**.

> Die ältere Datei `index.html` (Fußballspiel „Street Striker") bleibt unangetastet
> und ist unabhängig von dieser App.

## Sticker-Codes

Sticker werden über Codes identifiziert: `00` (Panini-Logo), `FWC1`–`FWC19`
(Turnier-Specials & FIFA-Museum), und Team-Sticker `<Länderkürzel><1-20>` (z.B.
`CZE7`). Definiert in `lib/album.ts`.

## Ablauf

1. **Album scannen** – Seiten in beliebiger Reihenfolge fotografieren (Qualitäts-Check).
   Pro Foto erkennt Gemini das gezeigte **Land** und die **leeren Platz-Nummern** →
   fehlende Codes. Fortschritt: „Teams gescannt N/48".
2. **Doppelte erfassen** – ausgelegte Doppel-Sticker fotografieren (mehrere Fotos
   möglich); Gemini liest Land + Nummer → doppelte Codes.
3. **Link erstellen** – Sammlung wird gespeichert, du bekommst einen Share-Link.
4. **Tauschen** – Link des Gegenübers einfügen → App zeigt „Du gibst ab" (deine
   Doppelten, die dem anderen fehlen) und „Du bekommst" (dessen Doppelte, die dir fehlen).

Robustheit: Codes werden per Muster validiert (`00` / `FWC1-19` / Länderkürzel+1-20),
sodass der Tausch-Abgleich auch bei kleinen Abweichungen der hinterlegten Team-Liste
korrekt über die real vom Album gelesenen Codes läuft.

## Tech

- **Next.js 14 (App Router)**, deploybar auf **Vercel**
- **Google Gemini** für die Bilderkennung (`lib/gemini.ts`)
- **Upstash Redis** als Speicher; lokal ohne Redis automatischer In-Memory-Fallback
- **Login** via Auth.js (NextAuth v5, Credentials/JWT): 6-stelliger Zugangscode.
  Admin (`/admin`, per `ADMIN_SECRET`) legt Personen an und vergibt Codes. Sammlung
  ans Konto (Code) gebunden – geräteübergreifend, aktualisierbar.
- Album (WC 2026) fest verdrahtet in `lib/album.ts` (Specials + 48 Teams mit FIFA-Codes)

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
| `AUTH_SECRET`                     | Pflicht für Login (z.B. `openssl rand -base64 32`)          |
| `ADMIN_SECRET`                    | Admin-Passwort für `/admin` (Codes vergeben)                |
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
