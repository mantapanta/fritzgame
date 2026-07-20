// PartyKit relay server for Street Striker online 1v1 penalty shootout.
// It does almost nothing: assign host/guest by join order (max 2 players),
// then relay every message to the other player. All game logic lives in the
// client (index.html); this is just a reliable WebSocket bridge.
export default class Server {
  constructor(room) {
    this.room = room;
  }

  onConnect(conn) {
    const others = [...this.room.getConnections()].filter((c) => c.id !== conn.id);
    if (others.length >= 2) {
      // Room already has two players.
      conn.send(JSON.stringify({ t: "role", full: true }));
      conn.close();
      return;
    }
    const isHost = others.length === 0;
    conn.send(JSON.stringify({ t: "role", isHost }));
  }

  onMessage(message, sender) {
    // Relay the raw message to the other player(s) in the room.
    this.room.broadcast(message, [sender.id]);
  }

  onClose(conn) {
    // Tell the remaining player the opponent left.
    this.room.broadcast(JSON.stringify({ t: "bye" }), [conn.id]);
  }
}
