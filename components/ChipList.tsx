"use client";

// Sticker-Nummern als Mini-Sticker-Chips. Mit onRemove sind sie antippbar:
// ein Tipp entfernt sofort (der Parent zeigt dann einen Undo-Toast).
export default function ChipList({
  codes,
  variant,
  onRemove,
}: {
  codes: string[];
  variant: "give" | "get";
  onRemove?: (code: string) => void;
}) {
  if (codes.length === 0) return null;
  return (
    <div className="grid-numbers">
      {codes.map((c) =>
        onRemove ? (
          <button
            key={c}
            type="button"
            className={`chip ${variant} removable`}
            onClick={() => onRemove(c)}
            aria-label={`${c} entfernen`}
          >
            {c}
            <span className="chip-x">✕</span>
          </button>
        ) : (
          <span key={c} className={`chip ${variant}`}>
            {c}
          </span>
        )
      )}
    </div>
  );
}
