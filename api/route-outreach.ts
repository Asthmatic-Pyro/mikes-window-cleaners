import { createClient } from "@supabase/supabase-js";
import { env } from "./_lib/env.js";

type Stop = {
  label?: string;
  lat?: number;
  lng?: number;
};

type Body = {
  here?: Stop;
  ahead?: Stop[];
};

function asStop(raw: Stop | undefined) {
  const label = raw?.label?.trim() ?? "";
  const lat = Number(raw?.lat);
  const lng = Number(raw?.lng);
  if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { label, lat, lng };
}

export async function POST(request: Request) {
  const supabaseUrl = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");
  const leadUrl = (env("LEAD_MAGNET_URL") || "").replace(/\/$/, "");
  const leadKey = env("LEAD_MAGNET_API_KEY");

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const here = asStop(body.here);
  if (!here) {
    return Response.json({ error: "here label, lat, and lng are required." }, { status: 400 });
  }
  const ahead = (body.ahead ?? []).map(asStop).filter((stop): stop is { label: string; lat: number; lng: number } => Boolean(stop)).slice(0, 2);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!leadUrl || !leadKey) {
    return Response.json({ ok: true, skipped: true, reason: "Route email is not configured." });
  }

  const res = await fetch(`${leadUrl}/actions/route-outreach`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": leadKey,
    },
    body: JSON.stringify({ here, ahead }),
  });
  const payload = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
  if (!res.ok) {
    const detail = typeof payload.detail === "string" ? payload.detail : payload.error;
    return Response.json({ error: detail || "Route email failed." }, { status: res.status });
  }
  return Response.json(payload);
}
