import process from "node:process";

/** Lightweight ping so free-tier Supabase projects stay active. */
export async function GET() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

  if (!url || !anon) {
    return Response.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  const res = await fetch(`${url}/rest/v1/location_current?select=id&limit=1`, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json({ ok: false, status: res.status, error: text.slice(0, 200) }, { status: 502 });
  }

  return Response.json({ ok: true, at: new Date().toISOString() });
}
