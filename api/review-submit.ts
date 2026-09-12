import { adminClient, alertMike, ensureTelegramWebhook } from "./_lib/telegram.js";

type Body = {
  displayName?: string;
  city?: string;
  answers?: Record<string, string>;
  draftText?: string;
  finalText?: string;
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

  const finalText = body.finalText?.trim() || "";
  if (finalText.length < 20) {
    return Response.json({ error: "Write or keep a short review before sending it to Mike." }, { status: 400 });
  }

  const admin = adminClient();
  if (!admin) {
    return Response.json({ error: "Reviews are not configured on the server yet." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("testimonials")
    .insert({
      display_name: (body.displayName ?? "").trim() || "Customer",
      city: body.city?.trim() || null,
      answers: body.answers ?? {},
      draft_text: body.draftText?.trim() || finalText,
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
  await ensureTelegramWebhook();
  await alertMike(
    "review",
    `Review pending approval\nFrom: ${(body.displayName ?? "Customer").trim()}${body.city ? ` · ${body.city}` : ""}\n\n${finalText}\n\nId: ${id}`,
    { id, city: body.city ?? null },
    [
      [
        { text: "Approve", callback_data: `r:a:${id}` },
        { text: "Reject", callback_data: `r:x:${id}` },
      ],
    ],
  );

  return Response.json({ ok: true, id });
}
