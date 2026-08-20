import { createClient } from "@supabase/supabase-js";
import { env } from "./_lib/env.js";
import { alertMike } from "./_lib/telegram.js";

/** Keep free-tier Supabase awake + promote location to public after 24h delay. */
export async function GET() {
  const url = (env("VITE_SUPABASE_URL") || env("SUPABASE_URL")).replace(/\/$/, "");
  const anon = env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") || env("SERVICE_ROLE");

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

  let promoted = false;
  if (serviceKey) {
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.rpc("promote_public_location");
    if (error) {
      console.error("promote_public_location:", error.message);
    } else {
      promoted = Boolean(data);
      if (promoted) {
        void alertMike("location", "Public map pin promoted (24-hour delay elapsed).");
      }
    }
  }

  return Response.json({ ok: true, at: new Date().toISOString(), promoted });
}
