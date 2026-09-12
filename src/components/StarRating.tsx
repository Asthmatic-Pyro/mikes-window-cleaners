import { useState } from "react";
import { Star } from "lucide-react";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
};

export default function StarRating({ value, onChange, readOnly = false, size = "md" }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const icon = size === "sm" ? "h-4 w-4" : "h-8 w-8";

  const starClass = (n: number) =>
    `${icon} ${n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/35"}`;

  if (readOnly) {
    if (value < 1) return null;
    return (
      <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={starClass(n)} />
        ))}
      </span>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Star rating"
      className="flex items-center gap-1"
      onMouseLeave={() => setHover(0)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHover(0);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange?.(Math.min(5, (value || 0) + 1));
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange?.(Math.max(1, (value || 1) - 1));
        }
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onClick={() => onChange?.(n)}
        >
          <Star className={starClass(n)} />
        </button>
      ))}
    </div>
  );
}
