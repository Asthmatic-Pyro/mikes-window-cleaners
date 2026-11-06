import type { Destination } from "@/lib/follow/types";

/** A new stop this far off its saved neighbors gets moved onto the leg it actually sits on. */
const MIN_SAVINGS_KM = 500;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function placed(stop: Destination): stop is Destination & { lat: number; lng: number } {
  return stop.lat != null && stop.lng != null;
}

/** Extra kilometers of putting `point` between the stops around `index`. */
function insertionExtra(route: Destination[], index: number, point: Destination) {
  const here = { lat: point.lat as number, lng: point.lng as number };
  const prev = index > 0 ? route[index - 1] : null;
  const next = index < route.length ? route[index] : null;
  if (prev && next && placed(prev) && placed(next)) {
    return distanceKm(prev, here) + distanceKm(here, next) - distanceKm(prev, next);
  }
  if (prev && placed(prev)) return distanceKm(prev, here);
  if (next && placed(next)) return distanceKm(here, next);
  return 0;
}

function bestInsertion(route: Destination[], point: Destination) {
  let index = route.length;
  let extra = insertionExtra(route, route.length, point);
  for (let i = 0; i < route.length; i++) {
    const cost = insertionExtra(route, i, point);
    if (cost < extra - 1) {
      extra = cost;
      index = i;
    }
  }
  return { index, extra };
}

/**
 * Route line order. Stops added after Seattle keep a high sort_order, which
 * draws a chord from the Pacific Northwest back across the country. A stop
 * that sits on an earlier leg is moved there. Everyone else stays put.
 */
export function orderStopsForRoute(stops: Destination[]): Destination[] {
  const sorted = [...stops].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const route = sorted.filter(placed);
  const unplotted = sorted.filter((stop) => !placed(stop));

  let guard = 0;
  let moved = true;
  while (moved && guard++ < route.length) {
    moved = false;
    let moveFrom = -1;
    let moveTo = -1;
    let bestSavings = MIN_SAVINGS_KM;

    for (let i = 0; i < route.length; i++) {
      const point = route[i];
      const rest = route.filter((_, idx) => idx !== i);
      const current = insertionExtra(rest, Math.min(i, rest.length), point);
      const best = bestInsertion(rest, point);
      const savings = current - best.extra;
      if (best.index !== i && savings > bestSavings) {
        bestSavings = savings;
        moveFrom = i;
        moveTo = best.index;
      }
    }

    if (moveFrom >= 0) {
      const [point] = route.splice(moveFrom, 1);
      route.splice(moveTo, 0, point);
      moved = true;
    }
  }

  const merged: Destination[] = [];
  let plottedIndex = 0;
  let unplottedIndex = 0;
  for (const stop of sorted) {
    merged.push(placed(stop) ? route[plottedIndex++] : unplotted[unplottedIndex++]);
  }
  return merged;
}
