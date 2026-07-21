const STEPS = [
  { emoji: "📷", label: "Fotos" },
  { emoji: "🔁", label: "Doppelte" },
  { emoji: "🔗", label: "Link" },
];

export default function Steps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="steps" aria-label={`Schritt ${current} von 3`}>
      {STEPS.map((s, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "active" : "";
        return (
          <span key={s.label} style={{ display: "contents" }}>
            {i > 0 && <span className="step-line" />}
            <span className={`step ${state}`}>
              <span className="step-dot">{n < current ? "✓" : s.emoji}</span>
              <span className="step-label">{s.label}</span>
            </span>
          </span>
        );
      })}
    </div>
  );
}
