import { env } from "./env.js";

export type PlaceWeather = {
  temperatureF: number;
  feelsLikeF: number;
  windMph: number;
  label: string;
};

export type PlaceWiki = {
  title: string;
  extract: string;
  url: string;
  population: number | null;
};

export type NatureSpot = {
  title: string;
  extract: string;
  url: string;
  onRoute?: boolean;
};

export type ReversePlace = {
  label: string;
  city: string | null;
  county: string | null;
  state: string | null;
  country: string | null;
  displayName: string;
};

export type PlaceEmailInput = {
  cityLabel: string;
  stopName: string | null;
  lat: number;
  lng: number;
  publishedAt: string;
  nextStop: { name: string; city_label: string | null } | null;
  weather: PlaceWeather | null;
  wiki: PlaceWiki | null;
  nature: NatureSpot[];
  reverse: ReversePlace | null;
  onWrittenRoute: boolean;
  unsubscribeUrl?: string | null;
};

const UA = "MikesWindowCleaners/1.0 (https://mikeswindowcleaners.com; trip updates)";

const NATURE_ROUTE_HINTS = [
  "cuyahoga",
  "presque isle",
  "finger lakes",
  "adirondack",
  "assateague",
  "shenandoah",
  "outer banks",
  "space coast",
  "gulf shores",
  "big bend",
  "guadalupe",
  "carlsbad",
  "white sands",
  "grand canyon",
  "zion",
  "arches",
  "olympic",
  "rainier",
  "crater lake",
  "redwood",
  "yosemite",
  "sequoia",
  "death valley",
  "joshua tree",
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function labelFromCode(code: number): string {
  if (code === 0) return "Clear";
  if (code === 1) return "Mostly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code === 85 || code === 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Mixed skies";
}

function formatCoords(lat: number, lng: number) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function osmUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=11/${lat}/${lng}`;
}

function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export async function fetchPlaceWeather(lat: number, lng: number): Promise<PlaceWeather | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      current: ["temperature_2m", "apparent_temperature", "weather_code", "wind_speed_10m"].join(","),
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      timezone: "auto",
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      current?: {
        temperature_2m: number;
        apparent_temperature: number;
        weather_code: number;
        wind_speed_10m: number;
      };
    };
    const current = json.current;
    if (!current) return null;
    return {
      temperatureF: Math.round(current.temperature_2m),
      feelsLikeF: Math.round(current.apparent_temperature),
      windMph: Math.round(current.wind_speed_10m),
      label: labelFromCode(current.weather_code),
    };
  } catch {
    return null;
  }
}

/** Nominatim reverse — works for any pin on Earth, not only route stops. */
export async function fetchReversePlace(lat: number, lng: number): Promise<ReversePlace | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "json");
    url.searchParams.set("zoom", "10");
    url.searchParams.set("addressdetails", "1");
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", "User-Agent": UA },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      display_name?: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        hamlet?: string;
        municipality?: string;
        county?: string;
        state?: string;
        region?: string;
        country?: string;
      };
    };
    const addr = json.address || {};
    const city =
      addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || null;
    const county = addr.county || null;
    const state = addr.state || addr.region || null;
    const country = addr.country || null;
    const parts = [city, state || county, country].filter(Boolean);
    const label =
      parts.length > 0
        ? parts.join(", ")
        : (json.display_name || "").split(",").slice(0, 3).join(",").trim();
    if (!label) return null;
    return {
      label,
      city,
      county,
      state,
      country,
      displayName: json.display_name || label,
    };
  } catch {
    return null;
  }
}

async function wikiSearch(query: string): Promise<{ title: string; pageid: number; snippet: string } | null> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: "1",
    format: "json",
    origin: "*",
  });
  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    query?: { search?: Array<{ title: string; pageid: number; snippet: string }> };
  };
  return json.query?.search?.[0] ?? null;
}

async function wikiSummary(title: string): Promise<{ extract: string; url: string } | null> {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: { "User-Agent": UA } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { extract?: string; content_urls?: { desktop?: { page?: string } } };
  const extract = (json.extract || "").trim();
  if (!extract) return null;
  return {
    extract: extract.slice(0, 520),
    url: json.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  };
}

async function wikiPopulation(title: string): Promise<number | null> {
  try {
    const params = new URLSearchParams({
      action: "query",
      titles: title,
      prop: "pageprops",
      format: "json",
      origin: "*",
    });
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      query?: { pages?: Record<string, { pageprops?: { wikibase_item?: string } }> };
    };
    const pages = json.query?.pages || {};
    const qid = Object.values(pages)[0]?.pageprops?.wikibase_item;
    if (!qid) return null;

    const entityRes = await fetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(qid)}.json`,
      { headers: { "User-Agent": UA } },
    );
    if (!entityRes.ok) return null;
    const entityJson = (await entityRes.json()) as {
      entities?: Record<
        string,
        {
          claims?: {
            P1082?: Array<{ mainsnak?: { datavalue?: { value?: { amount?: string } } } }>;
          };
        }
      >;
    };
    const amount = entityJson.entities?.[qid]?.claims?.P1082?.[0]?.mainsnak?.datavalue?.value?.amount;
    if (!amount) return null;
    const n = Number(amount);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  } catch {
    return null;
  }
}

function wikiQueryCandidates(
  cityLabel: string,
  stopName: string | null,
  reverse: ReversePlace | null,
): string[] {
  const out: string[] = [];
  const push = (q: string | null | undefined) => {
    const t = (q || "").trim();
    if (!t) return;
    if (!out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t);
  };

  push(stopName);
  push(cityLabel);
  // First segment of "Town, ST" often finds the article when the full string does not.
  push(cityLabel.split(",")[0]);
  if (reverse) {
    if (reverse.city && reverse.state) push(`${reverse.city}, ${reverse.state}`);
    push(reverse.city);
    push(reverse.label);
    if (reverse.county && reverse.state) push(`${reverse.county}, ${reverse.state}`);
    push(reverse.state);
  }
  return out;
}

export async function fetchPlaceWiki(
  cityLabel: string,
  stopName: string | null,
  reverse: ReversePlace | null = null,
): Promise<PlaceWiki | null> {
  const queries = wikiQueryCandidates(cityLabel, stopName, reverse);
  for (const query of queries) {
    try {
      const hit = await wikiSearch(query);
      if (!hit) continue;
      const summary = await wikiSummary(hit.title);
      if (!summary) continue;
      const population = await wikiPopulation(hit.title);
      return {
        title: hit.title,
        extract: summary.extract,
        url: summary.url,
        population,
      };
    } catch {
      /* try next */
    }
  }
  return null;
}

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function naturePlaceNames(cityLabel: string, reverse: ReversePlace | null): string[] {
  const names: string[] = [];
  const push = (q: string | null | undefined) => {
    const t = (q || "").trim();
    if (!t) return;
    if (!names.some((x) => x.toLowerCase() === t.toLowerCase())) names.push(t);
  };
  push(cityLabel.split(",")[0]);
  push(cityLabel);
  if (reverse) {
    push(reverse.city);
    push(reverse.state);
    push(reverse.county);
  }
  return names;
}

export async function fetchNearbyNature(
  cityLabel: string,
  nextStop: { name: string; city_label: string | null } | null,
  reverse: ReversePlace | null = null,
): Promise<NatureSpot[]> {
  const spots: NatureSpot[] = [];
  const places = naturePlaceNames(cityLabel, reverse);
  const kinds = ["national park", "state park", "national forest", "wildlife refuge", "nature preserve"];
  const queries: string[] = [];
  for (const place of places) {
    for (const kind of kinds) {
      queries.push(`${place} ${kind}`);
    }
  }

  for (const q of queries) {
    if (spots.length >= 4) break;
    try {
      const hit = await wikiSearch(q);
      if (!hit) continue;
      if (spots.some((s) => s.title === hit.title)) continue;
      const summary = await wikiSummary(hit.title);
      if (!summary) continue;
      const lower = hit.title.toLowerCase();
      const looksNature =
        /park|forest|refuge|seashore|preserve|wilderness|lake|island|valley|canyon|dunes|beach/i.test(
          lower,
        ) || /park|forest|refuge|seashore|preserve|wilderness/i.test(summary.extract);
      if (!looksNature) continue;
      spots.push({
        title: hit.title,
        extract: summary.extract.slice(0, 160),
        url: summary.url,
      });
    } catch {
      /* skip */
    }
  }

  if (nextStop) {
    const label = `${nextStop.name} ${nextStop.city_label || ""}`.toLowerCase();
    if (NATURE_ROUTE_HINTS.some((h) => label.includes(h))) {
      const existing = spots.find((s) => s.title.toLowerCase().includes(nextStop.name.toLowerCase()));
      if (existing) {
        existing.onRoute = true;
      } else {
        try {
          const hit = await wikiSearch(nextStop.city_label || nextStop.name);
          if (hit) {
            const summary = await wikiSummary(hit.title);
            if (summary) {
              spots.unshift({
                title: hit.title,
                extract: summary.extract.slice(0, 160),
                url: summary.url,
                onRoute: true,
              });
            }
          }
        } catch {
          /* skip */
        }
      }
    }
  }

  return spots.slice(0, 4);
}

function formatPopulation(n: number) {
  return n.toLocaleString("en-US");
}

/** Gather weather, reverse place, wiki, and nature for any lat/lng. */
export async function gatherPlaceContent(input: {
  cityLabel: string;
  stopName: string | null;
  lat: number | null;
  lng: number | null;
  nextStop: { name: string; city_label: string | null } | null;
  onWrittenRoute: boolean;
}): Promise<{
  weather: PlaceWeather | null;
  wiki: PlaceWiki | null;
  nature: NatureSpot[];
  reverse: ReversePlace | null;
  resolvedLabel: string;
}> {
  const hasPin = input.lat != null && input.lng != null && Number.isFinite(input.lat) && Number.isFinite(input.lng);
  const reverse = hasPin ? await fetchReversePlace(input.lat as number, input.lng as number) : null;
  const resolvedLabel =
    input.cityLabel.trim() ||
    reverse?.label ||
    input.stopName?.trim() ||
    (hasPin ? formatCoords(input.lat as number, input.lng as number) : "On the road");

  const [weather, wiki, nature] = await Promise.all([
    hasPin ? fetchPlaceWeather(input.lat as number, input.lng as number) : Promise.resolve(null),
    fetchPlaceWiki(resolvedLabel, input.stopName, reverse),
    fetchNearbyNature(resolvedLabel, input.nextStop, reverse),
  ]);

  return { weather, wiki, nature, reverse, resolvedLabel };
}

export function buildPlaceEmail(input: PlaceEmailInput): { subject: string; html: string; text: string } {
  const siteUrl = (env("SITE_URL") || "https://mikeswindowcleaners.com").replace(/\/$/, "");
  const followUrl = `${siteUrl}/Follow`;
  const hasPin = Number.isFinite(input.lat) && Number.isFinite(input.lng) && !(input.lat === 0 && input.lng === 0);
  const published = new Date(input.publishedAt);
  const when = Number.isNaN(published.getTime())
    ? input.publishedAt
    : published.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

  const headline = input.stopName || input.cityLabel;
  const subject = `Mike moved: ${headline}`;
  const regionLine = input.reverse
    ? [input.reverse.city, input.reverse.state || input.reverse.county, input.reverse.country]
        .filter(Boolean)
        .join(", ")
    : "";

  const pinBlock = hasPin
    ? `<tr><td style="padding:14px 0 6px">
        <p style="margin:0 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6b5284;font-weight:700">Where the pin is</p>
        <p style="margin:0;font-size:15px;color:#2a1840"><strong>${escapeHtml(input.cityLabel)}</strong></p>
        ${
          regionLine && regionLine.toLowerCase() !== input.cityLabel.toLowerCase()
            ? `<p style="margin:4px 0 0;font-size:14px;color:#5a4a6a">${escapeHtml(regionLine)}</p>`
            : ""
        }
        <p style="margin:6px 0 0;font-size:13px;color:#5a4a6a">${escapeHtml(formatCoords(input.lat, input.lng))}</p>
        ${
          !input.onWrittenRoute
            ? `<p style="margin:8px 0 0;font-size:13px;color:#6b5284">Off the written perimeter list — still a real stop on the trip.</p>`
            : ""
        }
        <p style="margin:10px 0 0">
          <a href="${escapeHtml(followUrl)}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 14px;background:#5b2d8e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">Open the live map</a>
          <a href="${escapeHtml(osmUrl(input.lat, input.lng))}" style="display:inline-block;margin:0 8px 8px 0;padding:10px 14px;border:1px solid #5b2d8e;color:#5b2d8e;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">OpenStreetMap</a>
          <a href="${escapeHtml(googleMapsUrl(input.lat, input.lng))}" style="display:inline-block;margin:0 0 8px 0;padding:10px 14px;border:1px solid #5b2d8e;color:#5b2d8e;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">Google Maps</a>
        </p>
      </td></tr>`
    : `<tr><td style="padding:14px 0 6px">
        <p style="margin:0 0 8px;font-size:15px;color:#2a1840">Mike published a new place: <strong>${escapeHtml(input.cityLabel)}</strong>.</p>
        <a href="${escapeHtml(followUrl)}" style="display:inline-block;padding:10px 14px;background:#5b2d8e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">Open the live map</a>
      </td></tr>`;

  const weatherBlock = input.weather
    ? `<tr><td style="padding:14px 20px;background:#f7f1fb;border-radius:8px">
        <p style="margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6b5284;font-weight:700">Weather right now</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#2a1840">${input.weather.temperatureF}°F · ${escapeHtml(input.weather.label)}</p>
        <p style="margin:6px 0 0;font-size:14px;color:#5a4a6a">Feels ${input.weather.feelsLikeF}° · Wind ${input.weather.windMph} mph</p>
      </td></tr>`
    : hasPin
      ? `<tr><td style="padding:12px 0 4px"><p style="margin:0;font-size:13px;color:#5a4a6a">Live weather was unavailable for this pin — check the map for the latest.</p></td></tr>`
      : "";

  const wikiBlock = input.wiki
    ? `<tr><td style="padding:18px 0 6px">
        <p style="margin:0 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6b5284;font-weight:700">About this stop</p>
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#2a1840">${escapeHtml(input.wiki.title)}</p>
        <p style="margin:0 0 8px;font-size:16px;line-height:1.55;color:#2a1840">${escapeHtml(input.wiki.extract)}</p>
        ${
          input.wiki.population != null
            ? `<p style="margin:0 0 10px;font-size:14px;color:#5a4a6a"><strong>Population:</strong> ${formatPopulation(input.wiki.population)}</p>`
            : ""
        }
        <a href="${escapeHtml(input.wiki.url)}" style="display:inline-block;padding:10px 14px;background:#5b2d8e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">Learn more on Wikipedia</a>
      </td></tr>`
    : `<tr><td style="padding:18px 0 6px">
        <p style="margin:0 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6b5284;font-weight:700">About this stop</p>
        <p style="margin:0;font-size:15px;line-height:1.55;color:#5a4a6a">No Wikipedia summary turned up for this pin yet. Use the map links above to explore the area, or wait for Mike&apos;s next road note.</p>
      </td></tr>`;

  const natureCards = input.nature
    .map((spot) => {
      const badge = spot.onRoute
        ? `<span style="display:inline-block;margin-left:6px;padding:2px 8px;background:#e8daf5;color:#5b2d8e;border-radius:999px;font-size:11px;font-weight:700">Next on Mike's route</span>`
        : "";
      return `<tr><td style="padding:10px 14px;border:1px solid #e4d7ef;border-radius:8px;margin-bottom:8px">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#2a1840"><a href="${escapeHtml(spot.url)}" style="color:#5b2d8e;text-decoration:none">${escapeHtml(spot.title)}</a>${badge}</p>
        <p style="margin:0;font-size:13px;line-height:1.45;color:#5a4a6a">${escapeHtml(spot.extract)}</p>
      </td></tr><tr><td style="height:8px;font-size:0;line-height:0">&nbsp;</td></tr>`;
    })
    .join("");

  const natureBlock = input.nature.length
    ? `<tr><td style="padding:18px 0 4px">
        <p style="margin:0 0 10px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6b5284;font-weight:700">Nature nearby</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${natureCards}</table>
      </td></tr>`
    : `<tr><td style="padding:14px 0 4px">
        <p style="margin:0;font-size:13px;color:#5a4a6a">No nearby park or refuge article found automatically — explore the map links for local trails and open space.</p>
      </td></tr>`;

  const nextBlock = input.nextStop
    ? `<tr><td style="padding:16px 0 4px">
        <p style="margin:0 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6b5284;font-weight:700">Next on the written route</p>
        <p style="margin:0;font-size:16px;color:#2a1840"><strong>${escapeHtml(input.nextStop.name)}</strong>${
          input.nextStop.city_label ? ` · ${escapeHtml(input.nextStop.city_label)}` : ""
        }</p>
        <p style="margin:8px 0 0"><a href="${escapeHtml(followUrl)}" style="color:#5b2d8e;font-weight:600;text-decoration:underline">See it on the map</a></p>
      </td></tr>`
    : `<tr><td style="padding:16px 0 4px">
        <p style="margin:0;font-size:13px;color:#5a4a6a">No upcoming route stop is marked yet. Mike may be between listed towns or off the perimeter list.</p>
      </td></tr>`;

  const unsub = input.unsubscribeUrl
    ? `<p style="margin:16px 0 0;font-size:12px;color:#7a6b8a"><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#7a6b8a">Unsubscribe</a></p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4eef8">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4eef8;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 18px 40px -24px rgba(60,20,90,.4)">
        <tr><td style="padding:22px 24px;background:linear-gradient(135deg,#4a2175 0%,#6b3a9e 100%);color:#fff">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.85;font-weight:700">Follow Mike</p>
          <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800">Mike moved: ${escapeHtml(headline)}</h1>
          <p style="margin:10px 0 0;font-size:14px;opacity:.9">${escapeHtml(input.cityLabel)} · ${escapeHtml(when)}</p>
        </td></tr>
        <tr><td style="padding:20px 24px 8px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${pinBlock}
            ${weatherBlock}
            ${wikiBlock}
            ${natureBlock}
            ${nextBlock}
          </table>
          ${unsub}
          <p style="margin:12px 0 8px;font-size:12px;color:#9a8ba8">Mike's Window Cleaners · Cincinnati → Seattle</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const textParts = [
    `Mike moved: ${headline}`,
    `${input.cityLabel} · ${when}`,
    "",
  ];
  if (hasPin) {
    textParts.push(`Pin: ${formatCoords(input.lat, input.lng)}`);
    if (regionLine) textParts.push(`Area: ${regionLine}`);
    if (!input.onWrittenRoute) {
      textParts.push("Off the written perimeter list — still a real stop on the trip.");
    }
    textParts.push(`Follow map: ${followUrl}`);
    textParts.push(`OpenStreetMap: ${osmUrl(input.lat, input.lng)}`);
    textParts.push(`Google Maps: ${googleMapsUrl(input.lat, input.lng)}`, "");
  } else {
    textParts.push(`Live map: ${followUrl}`, "");
  }
  if (input.weather) {
    textParts.push(
      `Weather: ${input.weather.temperatureF}°F ${input.weather.label} (feels ${input.weather.feelsLikeF}°, wind ${input.weather.windMph} mph)`,
      "",
    );
  }
  if (input.wiki) {
    textParts.push(input.wiki.title, input.wiki.extract, "");
    if (input.wiki.population != null) {
      textParts.push(`Population: ${formatPopulation(input.wiki.population)}`, "");
    }
    textParts.push(`Learn more: ${input.wiki.url}`, "");
  } else {
    textParts.push("No Wikipedia summary for this pin yet.", "");
  }
  if (input.nature.length) {
    textParts.push("Nature nearby:");
    for (const spot of input.nature) {
      textParts.push(
        `- ${spot.title}${spot.onRoute ? " (next on Mike's route)" : ""}: ${spot.url}`,
        `  ${spot.extract}`,
      );
    }
    textParts.push("");
  }
  if (input.nextStop) {
    textParts.push(
      `Next on the written route: ${input.nextStop.name}${input.nextStop.city_label ? ` · ${input.nextStop.city_label}` : ""}`,
      "",
    );
  }
  if (input.unsubscribeUrl) textParts.push(`Unsubscribe: ${input.unsubscribeUrl}`);

  return { subject, html, text: textParts.join("\n") };
}

export function isNatureRouteName(name: string) {
  const lower = name.toLowerCase();
  return NATURE_ROUTE_HINTS.some((h) => lower.includes(h));
}

export { stripTags };
