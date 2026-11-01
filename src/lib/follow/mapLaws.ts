import {
  lawsForState,
  type CannabisFact,
  type FirearmsFact,
  type LawTopic,
  type RecordingFact,
} from "@/data/stateLaws";
import {
  stopLaw,
  vehicleLawsForState,
  type CampingFact,
  type VehicleFact,
} from "@/data/vehicleLaws";
import { stateFromLabel } from "@/lib/follow/matchStop";
import type { Destination } from "@/lib/follow/types";

export const STATE_NAME_BY_CODE: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

export const CODE_BY_STATE_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAME_BY_CODE).map(([code, name]) => [name, code]),
);

/** Land neighbors. Used so bordering states do not get the same hue. */
const STATE_NEIGHBORS: Record<string, string[]> = {
  AL: ["FL", "GA", "MS", "TN"],
  AK: [],
  AZ: ["CA", "CO", "NM", "NV", "UT"],
  AR: ["LA", "MO", "MS", "OK", "TN", "TX"],
  CA: ["AZ", "NV", "OR"],
  CO: ["AZ", "KS", "NE", "NM", "OK", "UT", "WY"],
  CT: ["MA", "NY", "RI"],
  DE: ["MD", "NJ", "PA"],
  DC: ["MD", "VA"],
  FL: ["AL", "GA"],
  GA: ["AL", "FL", "NC", "SC", "TN"],
  HI: [],
  ID: ["MT", "NV", "OR", "UT", "WA", "WY"],
  IL: ["IN", "IA", "KY", "MO", "WI"],
  IN: ["IL", "KY", "MI", "OH"],
  IA: ["IL", "MN", "MO", "NE", "SD", "WI"],
  KS: ["CO", "MO", "NE", "OK"],
  KY: ["IL", "IN", "MO", "OH", "TN", "VA", "WV"],
  LA: ["AR", "MS", "TX"],
  ME: ["NH"],
  MD: ["DE", "PA", "VA", "WV", "DC"],
  MA: ["CT", "NH", "NY", "RI", "VT"],
  MI: ["IN", "OH", "WI"],
  MN: ["IA", "ND", "SD", "WI"],
  MS: ["AL", "AR", "LA", "TN"],
  MO: ["AR", "IL", "IA", "KS", "KY", "NE", "OK", "TN"],
  MT: ["ID", "ND", "SD", "WY"],
  NE: ["CO", "IA", "KS", "MO", "SD", "WY"],
  NV: ["AZ", "CA", "ID", "OR", "UT"],
  NH: ["ME", "MA", "VT"],
  NJ: ["DE", "NY", "PA"],
  NM: ["AZ", "CO", "OK", "TX", "UT"],
  NY: ["CT", "MA", "NJ", "PA", "VT"],
  NC: ["GA", "SC", "TN", "VA"],
  ND: ["MN", "MT", "SD"],
  OH: ["IN", "KY", "MI", "PA", "WV"],
  OK: ["AR", "CO", "KS", "MO", "NM", "TX"],
  OR: ["CA", "ID", "NV", "WA"],
  PA: ["DE", "MD", "NJ", "NY", "OH", "WV"],
  RI: ["CT", "MA"],
  SC: ["GA", "NC"],
  SD: ["IA", "MN", "MT", "NE", "ND", "WY"],
  TN: ["AL", "AR", "GA", "KY", "MO", "MS", "NC", "VA"],
  TX: ["AR", "LA", "NM", "OK"],
  UT: ["AZ", "CO", "ID", "NM", "NV", "WY"],
  VT: ["MA", "NH", "NY"],
  VA: ["KY", "MD", "NC", "TN", "WV", "DC"],
  WA: ["ID", "OR"],
  WV: ["KY", "MD", "OH", "PA", "VA"],
  WI: ["IL", "IA", "MI", "MN"],
  WY: ["CO", "ID", "MT", "NE", "SD", "UT"],
};

function hslToHex(h: number, s: number, l: number) {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

function hexDistance(a: string, b: string) {
  const parts = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  const [ar, ag, ab] = parts(a);
  const [br, bg, bb] = parts(b);
  return Math.hypot(ar - br, ag - bg, ab - bb);
}

function assignStateColors() {
  const codes = Object.keys(STATE_NAME_BY_CODE).sort();
  const palette = codes.map((_, i) => hslToHex((i * 137.508) % 360, 58 + (i % 4) * 9, 38 + (i % 3) * 8));
  const assigned: Record<string, string> = {};
  const used = new Set<string>();
  for (const code of codes) {
    const neighborColors = (STATE_NEIGHBORS[code] ?? []).map((n) => assigned[n]).filter(Boolean);
    let best = palette[0];
    let bestScore = -1;
    for (const color of palette) {
      if (used.has(color)) continue;
      const score =
        neighborColors.length === 0 ? 1000 + hexDistance(color, "#ffffff") : Math.min(...neighborColors.map((n) => hexDistance(color, n)));
      if (score > bestScore) {
        bestScore = score;
        best = color;
      }
    }
    assigned[code] = best;
    used.add(best);
  }
  return assigned;
}

/** One hue per state. Neighbors are pushed apart so the borders stay readable. */
export const STATE_COLORS: Record<string, string> = assignStateColors();

export const AUDIO_COLORS: Record<RecordingFact, string> = {
  "one-party": "#0f766e",
  "all-party": "#be123c",
};

const CAR_COLORS: Record<VehicleFact, string> = {
  "no-ban": "#15803d",
  "rest-limit": "#d97706",
  "carved-out": "#0284c7",
};

const CAMP_COLORS: Record<CampingFact, string> = {
  local: "#64748b",
  highway: "#b45309",
  "must-prohibit": "#be123c",
  reasonable: "#0f766e",
};

const WEED_COLORS: Record<CannabisFact, string> = {
  "adult-use": "#15803d",
  "medical-only": "#d97706",
  illegal: "#475569",
};

const GUN_COLORS: Record<FirearmsFact, string> = {
  permitless: "#1d4ed8",
  permit: "#c2410c",
  restricted: "#7f1d1d",
};

export type MapCategory = LawTopic | "stay";

export const MAP_CATEGORIES: { id: MapCategory; label: string }[] = [
  { id: "recording", label: "Audio" },
  { id: "cannabis", label: "Cannabis" },
  { id: "firearms", label: "Firearms" },
  { id: "stay", label: "Camp / car" },
];

export const CATEGORY_SCALE: Record<MapCategory, { id: string; label: string; color: string }[]> = {
  recording: [
    { id: "one-party", label: "One-party consent", color: AUDIO_COLORS["one-party"] },
    { id: "all-party", label: "All-party consent", color: AUDIO_COLORS["all-party"] },
  ],
  cannabis: [
    { id: "adult-use", label: "Adult-use legal", color: WEED_COLORS["adult-use"] },
    { id: "medical-only", label: "Medical only", color: WEED_COLORS["medical-only"] },
    { id: "illegal", label: "No adult-use program", color: WEED_COLORS.illegal },
  ],
  firearms: [
    { id: "permitless", label: "No permit to carry", color: GUN_COLORS.permitless },
    { id: "permit", label: "Permit required", color: GUN_COLORS.permit },
  ],
  stay: [
    { id: "open", label: "No statewide car-sleep ban", color: CAR_COLORS["no-ban"] },
    { id: "rest", label: "Rest-area stay limited", color: CAR_COLORS["rest-limit"] },
    { id: "limit", label: "Statewide camping limit", color: "#be123c" },
  ],
};

/** Display bucket for the Camp / car button. The hover still quotes each statute. */
function stayBucket(state: string): "open" | "rest" | "limit" | null {
  const rows = vehicleLawsForState(state);
  const car = rows.find((row) => row.topic === "vehicle");
  const camp = rows.find((row) => row.topic === "camping");
  if (!car && !camp) return null;
  if (camp?.fact === "highway" || camp?.fact === "must-prohibit") return "limit";
  if (car?.fact === "rest-limit") return "rest";
  return "open";
}

export function colorForLaw(state: string | null | undefined, topic: MapCategory) {
  if (topic === "stay") {
    const bucket = state ? stayBucket(state) : null;
    return CATEGORY_SCALE.stay.find((item) => item.id === bucket)?.color ?? "#cbd5e1";
  }
  const fact = state ? lawsForState(state).find((row) => row.topic === topic)?.fact : undefined;
  return CATEGORY_SCALE[topic].find((item) => item.id === fact)?.color ?? "#cbd5e1";
}

export function colorForState(state: string | null | undefined) {
  if (!state) return "#64748b";
  return STATE_COLORS[state.toUpperCase()] ?? "#64748b";
}

const SHORT_CAR: Record<VehicleFact, string> = {
  "no-ban": "No statewide car-sleep ban",
  "rest-limit": "Rest-area stay is limited",
  "carved-out": "A parked vehicle is carved out",
};

const SHORT_CAMP: Record<CampingFact, string> = {
  local: "Cities write their own camping rules",
  highway: "Highway camping is a misdemeanor",
  "must-prohibit": "Cities must bar public camping",
  reasonable: "Local rules must be reasonable",
};

const SHORT_WEED: Record<CannabisFact, string> = {
  "adult-use": "Adult-use legal",
  "medical-only": "Medical only",
  illegal: "Recreational illegal",
};

const SHORT_GUN: Record<FirearmsFact, string> = {
  permitless: "Permitless carry",
  permit: "Permit required",
  restricted: "Heavily restricted",
};

const SHORT_AUDIO: Record<RecordingFact, string> = {
  "one-party": "One-party consent",
  "all-party": "All-party consent",
};

function esc(value: string) {
  return value.replace(/[&<>"']/g, (ch) => {
    if (ch === "&") return "&amp;";
    if (ch === "<") return "&lt;";
    if (ch === ">") return "&gt;";
    if (ch === '"') return "&quot;";
    return "&#39;";
  });
}

function clip(value: string, max = 150) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function rulesFor(state: string | null) {
  const rows = state ? lawsForState(state) : [];
  const vehicle = state ? vehicleLawsForState(state) : [];
  const audio = rows.find((r) => r.topic === "recording");
  const audioFact = (audio?.fact ?? null) as RecordingFact | null;
  const audioColor = audioFact ? AUDIO_COLORS[audioFact] : null;
  const car = vehicle.find((r) => r.topic === "vehicle");
  const camp = vehicle.find((r) => r.topic === "camping");
  const weed = rows.find((r) => r.topic === "cannabis");
  const gun = rows.find((r) => r.topic === "firearms");
  const fineRow = vehicle.find((r) => r.topic === "fine");

  const lines: { color: string; label: string; value: string }[] = [];
  if (audioFact) lines.push({ color: audioColor!, label: "Audio", value: SHORT_AUDIO[audioFact] });
  if (car) {
    lines.push({
      color: CAR_COLORS[car.fact as VehicleFact] ?? "#64748b",
      label: "Car",
      value: SHORT_CAR[car.fact as VehicleFact] ?? "See the quiz",
    });
  }
  if (camp) {
    lines.push({
      color: CAMP_COLORS[camp.fact as CampingFact] ?? "#64748b",
      label: "Camping",
      value: SHORT_CAMP[camp.fact as CampingFact] ?? "See the quiz",
    });
  }
  if (weed) {
    lines.push({
      color: WEED_COLORS[weed.fact as CannabisFact] ?? "#64748b",
      label: "Cannabis",
      value: SHORT_WEED[weed.fact as CannabisFact] ?? "See the quiz",
    });
  }
  if (gun) {
    lines.push({
      color: GUN_COLORS[gun.fact as FirearmsFact] ?? "#64748b",
      label: "Firearms",
      value: SHORT_GUN[gun.fact as FirearmsFact] ?? "See the quiz",
    });
  }

  const items = lines
    .map(
      (line) =>
        `<li><i style="background:${line.color}"></i><b>${esc(line.label)}</b><span>${esc(line.value)}</span></li>`,
    )
    .join("");

  return { items, sentence: fineRow?.blurb ?? "", audioColor, hasLaws: rows.length > 0 };
}

export function lawBubble(destination: Destination) {
  const state = stateFromLabel(destination.city_label) || stateFromLabel(destination.name);
  const rules = rulesFor(state);
  const place = stopLaw(destination.name);
  const sentence = place?.fine || rules.sentence;
  const status =
    destination.status === "done" ? "Visited" : destination.status === "current" ? "Current stop" : "Upcoming";
  const swatch = colorForState(state);

  const html = `<div class="law-bubble-card">
    <div class="law-bubble-title"><i style="background:${swatch}"></i><strong>${esc(destination.name)}</strong><em>${esc(state ?? "")}</em></div>
    <p class="law-bubble-status">${esc(status)}${destination.city_label ? ` · ${esc(destination.city_label)}` : ""}</p>
    ${rules.items ? `<ul>${rules.items}</ul>` : ""}
    ${sentence ? `<p class="law-bubble-fine">${esc(clip(sentence))}</p>` : ""}
    <p class="law-bubble-more">Tap for the full statute and quiz</p>
  </div>`;

  return { html, state, audioColor: rules.audioColor, stateColor: swatch };
}

function stayHoverBody(code: string) {
  const rows = vehicleLawsForState(code);
  const car = rows.find((row) => row.topic === "vehicle");
  const camp = rows.find((row) => row.topic === "camping");
  if (!car && !camp) return `<p class="law-bubble-fine">No curated statute for this category yet.</p>`;
  const block = (title: string, blurb: string, citation: string) =>
    `<p class="law-bubble-status">${esc(title)}</p><p class="law-bubble-fine">${esc(clip(blurb, 220))}</p><p class="law-bubble-status">${esc(citation)}</p>`;
  return `${car ? block("Sleeping in a car", car.blurb, car.citation) : ""}${camp ? block("Public camping", camp.blurb, camp.citation) : ""}`;
}

export function stateHover(code: string, name: string, topic: MapCategory | null, inset = false) {
  const extra = inset ? `<p class="law-bubble-status">Shown inset with the lower 48.</p>` : "";
  if (!topic) {
    return `<div class="law-bubble-card">
      <div class="law-bubble-title"><strong>${esc(name)}</strong><em>${esc(code)}</em></div>
      ${extra}
      <p class="law-bubble-more">Pick a category to color the map. Tap the state for the quiz.</p>
    </div>`;
  }
  const swatch = colorForLaw(code, topic);
  const topicLabel = MAP_CATEGORIES.find((item) => item.id === topic)?.label ?? "Rule";
  if (topic === "stay") {
    const bucket = stayBucket(code);
    const label = CATEGORY_SCALE.stay.find((item) => item.id === bucket)?.label ?? "Not listed";
    return `<div class="law-bubble-card">
      <div class="law-bubble-title"><i style="background:${swatch}"></i><strong>${esc(name)}</strong><em>${esc(code)}</em></div>
      <p class="law-bubble-status">${esc(topicLabel)} · ${esc(label)}</p>
      ${extra}
      ${stayHoverBody(code)}
      <p class="law-bubble-more">Tap the state for the full statute and quiz</p>
    </div>`;
  }
  const row = lawsForState(code).find((item) => item.topic === topic);
  const label = CATEGORY_SCALE[topic].find((item) => item.id === row?.fact)?.label ?? "Not listed";
  const body = row
    ? `<p class="law-bubble-fine">${esc(clip(row.blurb, 280))}</p><p class="law-bubble-status">${esc(row.citation)}</p>`
    : `<p class="law-bubble-fine">No curated statute for this category yet.</p>`;

  return `<div class="law-bubble-card">
    <div class="law-bubble-title"><i style="background:${swatch}"></i><strong>${esc(name)}</strong><em>${esc(code)}</em></div>
    <p class="law-bubble-status">${esc(topicLabel)} · ${esc(label)}</p>
    ${extra}
    ${body}
    <p class="law-bubble-more">Tap the state for the full statute and quiz</p>
  </div>`;
}
