# Street Striker – Online-Relay (PartyKit)

Winziger WebSocket-Relay-Server für den Online-1v1-Modus. Das Spiel selbst
läuft komplett im Browser (`../index.html`); dieser Server leitet nur die
Nachrichten zwischen den zwei Spielern weiter (zuverlässig über jedes Netz,
kein TURN/NAT-Problem).

## Deployen (einmalig, ~5 Min)

Voraussetzung: Node.js installiert.

```bash
cd party
npm install
npx partykit login     # öffnet GitHub-Login (kostenloser Account)
npx partykit deploy    # deployt und zeigt die URL an
```

Am Ende erscheint eine URL wie:

```
  Deployed to https://fritzgame-relay.DEINNUTZER.partykit.dev
```

Trage den Host-Teil (ohne `https://`) in `../index.html` bei `PARTY_HOST` ein:

```js
const PARTY_HOST = 'fritzgame-relay.DEINNUTZER.partykit.dev';
```

Danach committen/pushen – Vercel deployt die Seite neu, und der Online-Modus
nutzt automatisch den Server-Relay (funktioniert dann über alle Netze).

## Lokal testen

```bash
npx partykit dev        # startet http://127.0.0.1:1999
```

Zum lokalen Testen `PARTY_HOST = '127.0.0.1:1999'` setzen und in `connectParty`
`wss://` auf `ws://` ändern (nur für localhost).
