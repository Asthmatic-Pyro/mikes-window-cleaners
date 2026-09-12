import { env } from "./_lib/env.js";

/** Keep free-tier Supabase awake. Location is published immediately by admin now. */
export async function GET() {
  const url = (env("VITE_SUPABASE_URL") || env("SUPABASE_URL")).replace(/\/$/, "");
  const anon = env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");

  if (!url || !anon) {
    return Response.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  const ping = await fetch(`${url}/rest/v1/location_public?select=id&limit=1`, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
  });

  if (!ping.ok) {
    const text = await ping.text();
    return Response.json({ ok: false, status: ping.status, error: text.slice(0, 200) }, { status: 502 });
  }

  return Response.json({ ok: true, at: new Date().toISOString(), promoted: false });
}
