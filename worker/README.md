# Street Striker – Online-Relay (Cloudflare Worker)

WebSocket-Relay für den Online-1v1-Modus, deployt auf **deinem eigenen,
kostenlosen Cloudflare-Account**. (Ersetzt den PartyKit-Ansatz in `../party/` —
deren Gratis-Cloud nimmt keine neuen Deployments mehr an.)

## Deployen (einmalig, ~3 Min)

```bash
cd worker
npm install
npx wrangler login     # öffnet Browser: kostenlosen Cloudflare-Account anlegen/einloggen
npx wrangler deploy
```

Am Ende zeigt wrangler die URL an, z. B.:

```
https://fritzgame-relay.DEIN-SUBDOMAIN.workers.dev
```

Diesen Host (ohne `https://`) in `../public/game.html` bei `PARTY_HOST` eintragen:

```js
const PARTY_HOST = 'fritzgame-relay.DEIN-SUBDOMAIN.workers.dev';
```

Committen & pushen → Vercel deployt die Seite neu → Online-Modus läuft
zuverlässig über alle Netze (Mobilfunk, verschiedene WLANs, …).

## Test

`https://fritzgame-relay.DEIN-SUBDOMAIN.workers.dev` im Browser öffnen →
es sollte `Street Striker Relay OK` erscheinen.
