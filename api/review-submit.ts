import { adminClient, alertMike, ensureTelegramWebhook } from "./_lib/telegram.js";

function starText(rating: number) {
  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
}

type Body = {
  displayName?: string;
  city?: string;
  rating?: number | string;
  finalText?: string;
  draftText?: string;
  consent?: boolean;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.consent) {
    return Response.json({ error: "Consent is required." }, { status: 400 });
  }

  const displayName = (body.displayName ?? "").trim();
  if (!displayName) {
    return Response.json({ error: "A first name is required." }, { status: 400 });
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: "Pick a star rating from 1 to 5." }, { status: 400 });
  }

  const finalText = (body.finalText ?? body.draftText ?? "").trim();
  if (finalText.length < 20) {
    return Response.json({ error: "Write a short review before sending it to Mike." }, { status: 400 });
  }

  const admin = adminClient();
  if (!admin) {
    return Response.json({ error: "Reviews are not configured on the server yet." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("testimonials")
    .insert({
      display_name: displayName,
      city: body.city?.trim() || null,
      answers: { rating: String(rating) },
      draft_text: finalText,
      final_text: finalText,
      status: "pending_hitl",
      consent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return Response.json({ error: error?.message || "Could not save the review." }, { status: 500 });
  }

  const id = data.id as string;
  const city = body.city?.trim();
  await ensureTelegramWebhook();
  await alertMike(
    "review",
    `Review pending approval\nFrom: ${displayName}${city ? ` · ${city}` : ""}\n${starText(rating)} (${rating}/5)\n\n${finalText}\n\nId: ${id}`,
    { id, city: city || null, rating },
    [
      [
        { text: "Approve", callback_data: `r:a:${id}` },
        { text: "Reject", callback_data: `r:x:${id}` },
      ],
    ],
  );

  return Response.json({ ok: true, id });
}
