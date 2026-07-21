// Street Striker – Online-Relay als Cloudflare Worker (Durable Object).
// Ersetzt PartyKit (deren Gratis-Cloud nimmt keine neuen Deploys mehr an).
// Gleiche Aufgabe: 2 Spieler pro Raum, Host/Guest nach Beitritts-Reihenfolge,
// alle Nachrichten werden 1:1 an den anderen Spieler weitergereicht.
// Der Pfad ist mit dem Client kompatibel: /parties/main/<ROOMCODE>

export class Room {
  constructor(state, env) {
    this.sessions = [];
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('expected websocket', { status: 426 });
    }
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    server.accept();

    if (this.sessions.length >= 2) {
      server.send(JSON.stringify({ t: 'role', full: true }));
      server.close();
      return new Response(null, { status: 101, webSocket: client });
    }

    const isHost = this.sessions.length === 0;
    this.sessions.push(server);
    server.send(JSON.stringify({ t: 'role', isHost }));

    server.addEventListener('message', (ev) => {
      for (const s of this.sessions) {
        if (s !== server) { try { s.send(ev.data); } catch (e) {} }
      }
    });
    const drop = () => {
      if (!this.sessions.includes(server)) return;
      this.sessions = this.sessions.filter((s) => s !== server);
      for (const s of this.sessions) { try { s.send(JSON.stringify({ t: 'bye' })); } catch (e) {} }
    };
    server.addEventListener('close', drop);
    server.addEventListener('error', drop);

    return new Response(null, { status: 101, webSocket: client });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/parties\/main\/([A-Za-z0-9-]{1,32})$/);
    if (!m) return new Response('Street Striker Relay OK', { status: 200 });
    const id = env.ROOM.idFromName(m[1].toUpperCase());
    return env.ROOM.get(id).fetch(request);
  }
};
