import { env } from "./_lib/env.js";
import { adminClient, answerTelegramCallback } from "./_lib/telegram.js";

type TelegramUpdate = {
  callback_query?: {
    id: string;
    data?: string;
    from?: { username?: string };
  };
};

export async function POST(request: Request) {
  const secret = env("TELEGRAM_WEBHOOK_SECRET");
  const header = request.headers.get("x-telegram-bot-api-secret-token") || "";
  if (!secret || header !== secret) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return Response.json({ ok: true });
  }

  const query = update.callback_query;
  if (!query?.data || !query.id) return Response.json({ ok: true });

  const match = query.data.match(/^r:([ax]):([0-9a-f-]{36})$/i);
  if (!match) {
    await answerTelegramCallback(query.id, "Unknown button.");
    return Response.json({ ok: true });
  }

  const status = match[1] === "a" ? "published" : "rejected";
  const admin = adminClient();
  if (!admin) {
    await answerTelegramCallback(query.id, "Server missing database key.");
    return Response.json({ ok: true });
  }

  const { error } = await admin
    .from("testimonials")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", match[2])
    .eq("status", "pending_hitl");

  if (error) {
    await answerTelegramCallback(query.id, "Could not update that review.");
    return Response.json({ ok: true });
  }

  await answerTelegramCallback(query.id, status === "published" ? "Published on the site." : "Rejected.");
  return Response.json({ ok: true });
}
