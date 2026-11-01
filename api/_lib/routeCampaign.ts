import { env } from "./env.js";

export function leadMagnetHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  };
  const token = env("TELEGRAM_BOT_TOKEN");
  const chat = env("TELEGRAM_CHAT_ID");
  if (token) headers["X-Telegram-Token"] = token;
  if (chat) headers["X-Telegram-Chat"] = chat;
  return headers;
}

export async function postRouteOutreach(path: string, body: unknown): Promise<Record<string, unknown>> {
  const leadUrl = (env("LEAD_MAGNET_URL") || "").replace(/\/$/, "");
  const leadKey = env("LEAD_MAGNET_API_KEY");
  if (!leadUrl || !leadKey) {
    return { ok: true, skipped: true, reason: "Route email is not configured." };
  }

  const res = await fetch(`${leadUrl}${path}`, {
    method: "POST",
    headers: leadMagnetHeaders(leadKey),
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
  if (!res.ok) {
    const detail = typeof payload.detail === "string" ? payload.detail : payload.error;
    throw new Error(detail || "Route email failed.");
  }
  return payload as Record<string, unknown>;
}
