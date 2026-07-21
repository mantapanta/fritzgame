import Link from "next/link";

export default function Hub() {
  return (
    <div className="stack">
      <div className="center stack" style={{ gap: 6, marginTop: 28 }}>
        <div className="brand">Fritz-Liga</div>
        <p className="muted" style={{ margin: 0 }}>
          Was willst du machen?
        </p>
      </div>

      <div className="stack" style={{ marginTop: 8 }}>
        <a href="/game.html" className="hub-tile hub-game">
          <span className="hub-emoji">⚽</span>
          <span className="hub-text">
            <b>Street Striker</b>
            <span>Spiel Fußball! ⚽</span>
          </span>
        </a>

        <Link href="/swap" className="hub-tile hub-swap">
          <span className="hub-emoji">🔁</span>
          <span className="hub-text">
            <b>FritzSwap</b>
            <span>Tausche deine Sticker!</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
