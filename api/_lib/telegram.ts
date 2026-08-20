import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export type SiteEventType =
  | "user"
  | "signin"
  | "quote"
  | "name"
  | "wall"
  | "post"
  | "location"
  | "system";

function adminClient() {
  const url = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY") || env("SERVICE_ROLE");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function logSiteEvent(eventType: SiteEventType, summary: string, payload?: Record<string, unknown>) {
  const admin = adminClient();
  if (!admin) return;
  const { error } = await admin.from("event_log").insert({
    event_type: eventType,
    summary,
    payload: payload ?? null,
  });
  if (error) console.error("event_log insert:", error.message);
}

export async function notifyTelegram(summary: string) {
  const token = env("TELEGRAM_BOT_TOKEN");
  const chatId = env("TELEGRAM_CHAT_ID");
  if (!token || !chatId) {
    console.warn("Telegram is not configured.");
    return false;
  }

  const text = `Follow Mike\n${summary}`.slice(0, 3500);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Telegram send failed:", res.status, body.slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error("Telegram send error:", err);
    return false;
  }
}

export async function alertMike(eventType: SiteEventType, summary: string, payload?: Record<string, unknown>) {
  await logSiteEvent(eventType, summary, payload);
  await notifyTelegram(summary);
}
