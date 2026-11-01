import { env } from "./_lib/env.js";
import { postRouteOutreach } from "./_lib/routeCampaign.js";
import { adminClient, answerTelegramCallback, notifyTelegram } from "./_lib/telegram.js";

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

  const route = query.data.match(/^c:([esn]):([0-9a-f-]{36})$/i);
  if (route) {
    const action = route[1] === "e" ? "approve_example" : route[1] === "s" ? "approve_send" : "cancel";
    await answerTelegramCallback(query.id, "Got it.");
    try {
      const result = await postRouteOutreach("/actions/route-outreach/decide", {
        run_id: route[2],
        action,
      });
      if (!result.telegram_sent) {
        const note = typeof result.note === "string" ? result.note : "Route email updated.";
        await notifyTelegram(note, undefined, "Route email");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update that approval.";
      await notifyTelegram(message, undefined, "Route email");
    }
    return Response.json({ ok: true });
  }

  const nameMatch = query.data.match(/^n:([ax]):([0-9a-f-]{36})$/i);
  if (nameMatch) {
    const status = nameMatch[1] === "a" ? "approved" : "rejected";
    const admin = adminClient();
    if (!admin) {
      await answerTelegramCallback(query.id, "Server missing database key.");
      return Response.json({ ok: true });
    }

    const { data, error } = await admin
      .from("name_claims")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", nameMatch[2])
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (error) {
      await answerTelegramCallback(query.id, "Could not update that name.");
      return Response.json({ ok: true });
    }
    if (!data) {
      await answerTelegramCallback(query.id, "Already reviewed.");
      return Response.json({ ok: true });
    }

    await answerTelegramCallback(query.id, status === "approved" ? "Approved. It will show on the car." : "Declined.");
    return Response.json({ ok: true });
  }

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
