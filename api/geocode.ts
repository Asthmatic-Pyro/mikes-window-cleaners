type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
};

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return Response.json({ error: "Missing q." }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "MikesWindowCleaners/1.0 (https://mikeswindowcleaners.com)",
      },
    });
    if (!res.ok) {
      return Response.json({ error: "City lookup failed." }, { status: 502 });
    }
    const rows = (await res.json()) as NominatimHit[];
    const hit = rows[0];
    if (!hit) {
      return Response.json({ result: null });
    }
    return Response.json({
      result: {
        lat: Number(hit.lat),
        lng: Number(hit.lon),
        label: hit.display_name.split(",").slice(0, 2).join(",").trim() || q,
      },
    });
  } catch {
    return Response.json({ error: "City lookup is unavailable right now." }, { status: 502 });
  }
}
