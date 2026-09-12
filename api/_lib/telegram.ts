import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export type SiteEventType =
  | "user"
  | "signin"
  | "quote"
  | "name"
  | "wall"
  | "post"
  | "location"
  | "review"
  | "system";

type TelegramButton = { text: string; callback_data: string };

export function adminClient() {
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

export async function notifyTelegram(summary: string, buttons?: TelegramButton[][]) {
  const token = env("TELEGRAM_BOT_TOKEN");
  const chatId = env("TELEGRAM_CHAT_ID");
  if (!token || !chatId) {
    console.warn("Telegram is not configured.");
    return false;
  }

  const text = `Follow Mike\n${summary}`.slice(0, 3500);
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  };
  if (buttons?.length) {
    body.reply_markup = { inline_keyboard: buttons };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error("Telegram send failed:", res.status, errBody.slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error("Telegram send error:", err);
    return false;
  }
}

export async function answerTelegramCallback(id: string, text: string) {
  const token = env("TELEGRAM_BOT_TOKEN");
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: id, text }),
  }).catch(() => undefined);
}

export async function ensureTelegramWebhook() {
  const token = env("TELEGRAM_BOT_TOKEN");
  const secret = env("TELEGRAM_WEBHOOK_SECRET");
  const site = (env("SITE_URL") || "https://mikeswindowcleaners.com").replace(/\/$/, "");
  if (!token || !secret) return;
  await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: `${site}/api/telegram-webhook`,
      secret_token: secret,
      allowed_updates: ["callback_query"],
    }),
  }).catch((err) => console.error("setWebhook failed:", err));
}

export async function alertMike(
  eventType: SiteEventType,
  summary: string,
  payload?: Record<string, unknown>,
  buttons?: TelegramButton[][],
) {
  await logSiteEvent(eventType, summary, payload);
  await notifyTelegram(summary, buttons);
}
