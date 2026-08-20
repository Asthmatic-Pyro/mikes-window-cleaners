import { createClient } from "@supabase/supabase-js";
import { env } from "./_lib/env.js";
import { alertMike, type SiteEventType } from "./_lib/telegram.js";

type Body = {
  eventType?: SiteEventType;
  summary?: string;
  payload?: Record<string, unknown>;
};

const EVENT_TYPES: SiteEventType[] = ["user", "signin", "quote", "name", "wall", "post", "location", "system"];

export async function POST(request: Request) {
  const secret = env("TELEGRAM_WEBHOOK_SECRET");
  const headerSecret = request.headers.get("x-telegram-secret") || "";
  const supabaseUrl = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
  const anonKey = env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");

  let authorized = Boolean(secret && headerSecret && headerSecret === secret);

  if (!authorized) {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (token && supabaseUrl && anonKey) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data } = await userClient.auth.getUser();
      authorized = Boolean(data.user);
    }
  }

  if (!authorized) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const eventType = body.eventType;
  const summary = body.summary?.trim() ?? "";
  if (!eventType || !EVENT_TYPES.includes(eventType) || !summary) {
    return Response.json({ error: "eventType and summary are required." }, { status: 400 });
  }

  await alertMike(eventType, summary, body.payload);
  return Response.json({ ok: true });
}
