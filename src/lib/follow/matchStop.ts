import type { Destination } from "@/lib/follow/types";

export function cityKey(label: string) {
  const beforeComma = label.split(",")[0] ?? label;
  const lastSlash = beforeComma.split("/").pop() ?? beforeComma;
  return lastSlash.replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
}

function tokens(label: string) {
  return cityKey(label)
    .split(" ")
    .filter((w) => w.length > 2 && !["the", "and", "national", "park", "beach", "island"].includes(w));
}

/** Pick the route stop that best matches a typed city/area. */
export function matchDestination(destinations: Destination[], cityLabel: string): Destination | null {
  const key = cityKey(cityLabel);
  if (!key) return null;

  const exact = destinations.find((d) => cityKey(d.name) === key || cityKey(d.city_label ?? "") === key);
  if (exact) return exact;

  const needle = tokens(cityLabel);
  if (needle.length === 0) return null;

  let best: Destination | null = null;
  let bestScore = 0;
  for (const d of destinations) {
    const hay = new Set([...tokens(d.name), ...tokens(d.city_label ?? "")]);
    const score = needle.filter((t) => hay.has(t)).length;
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

export function routeProgress(destinations: Destination[]) {
  const total = destinations.length;
  const done = destinations.filter((d) => d.status === "done").length;
  const current = destinations.find((d) => d.status === "current") ?? null;
  const next = destinations.find((d) => d.status === "upcoming") ?? null;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, current, next, percent };
}

const STATE_RE = /,\s*([A-Z]{2})\s*$/i;
const DC_RE = /washington,?\s*d\.?c\.?/i;

export function stateFromLabel(label: string | null | undefined): string | null {
  if (!label) return null;
  if (DC_RE.test(label)) return "DC";
  const match = label.trim().match(STATE_RE);
  return match ? match[1].toUpperCase() : null;
}
