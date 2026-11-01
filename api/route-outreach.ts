import { createClient } from "@supabase/supabase-js";
import { env } from "./_lib/env.js";
import { postRouteOutreach } from "./_lib/routeCampaign.js";

type Stop = {
  label?: string;
  lat?: number;
  lng?: number;
};

type Body = {
  here?: Stop;
  ahead?: Stop[];
  simulate?: boolean;
  run_id?: string;
  action?: string;
};

function asStop(raw: Stop | undefined) {
  const label = raw?.label?.trim() ?? "";
  const lat = Number(raw?.lat);
  const lng = Number(raw?.lng);
  if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { label, lat, lng };
}

async function requireAdmin(request: Request) {
  const supabaseUrl = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return Response.json({ error: "Forbidden." }, { status: 403 });
  return null;
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    if (body.action && body.run_id) {
      const payload = await postRouteOutreach("/actions/route-outreach/decide", {
        run_id: body.run_id,
        action: body.action,
      });
      return Response.json(payload);
    }

    const here = asStop(body.here);
    if (!here) {
      return Response.json({ error: "here label, lat, and lng are required." }, { status: 400 });
    }
    const ahead = (body.ahead ?? [])
      .map(asStop)
      .filter((stop): stop is { label: string; lat: number; lng: number } => Boolean(stop))
      .slice(0, 2);
    const payload = await postRouteOutreach("/actions/route-outreach", {
      here,
      ahead,
      simulate: body.simulate === true,
    });
    return Response.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Route email failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
