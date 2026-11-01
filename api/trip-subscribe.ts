import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { checkSubscriberEmail } from "./_lib/emailCheck.js";
import { env } from "./_lib/env.js";

type Body = {
  email?: string;
  displayName?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function token() {
  return randomBytes(24).toString("hex");
}

export async function POST(request: Request) {
  const supabaseUrl = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") || env("SERVICE_ROLE");
  const resendKey = env("RESEND_API_KEY");
  const from = env("EMAIL_FROM");
  const siteUrl = (env("SITE_URL") || "https://mikeswindowcleaners.com").replace(/\/$/, "");

  if (!supabaseUrl || !serviceKey) {
    return Response.json({ error: "Signup is not configured." }, { status: 500 });
  }
  if (!resendKey || !from) {
    return Response.json({ error: "Email is not configured." }, { status: 500 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const checked = await checkSubscriberEmail(body.email ?? "");
  if (!checked.ok) {
    return Response.json({ error: checked.reason }, { status: 400 });
  }

  const displayName = (body.displayName ?? "").trim().slice(0, 40);
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await admin
    .from("trip_subscribers")
    .select("id, status, confirm_token, unsubscribe_token")
    .ilike("email", checked.email)
    .maybeSingle();

  let confirmToken = token();
  let unsubscribeToken = token();

  if (existing?.status === "confirmed") {
    return Response.json({
      ok: true,
      already: true,
      message: "You are already signed up for trip updates.",
    });
  }

  if (existing?.status === "unsubscribed") {
    confirmToken = existing.confirm_token || confirmToken;
    unsubscribeToken = existing.unsubscribe_token || unsubscribeToken;
    const { error } = await admin
      .from("trip_subscribers")
      .update({
        display_name: displayName || undefined,
        status: "pending",
        confirm_token: confirmToken,
        unsubscribe_token: unsubscribeToken,
        confirmed_at: null,
        unsubscribed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  } else if (existing) {
    confirmToken = existing.confirm_token || confirmToken;
    unsubscribeToken = existing.unsubscribe_token || unsubscribeToken;
    const { error } = await admin
      .from("trip_subscribers")
      .update({
        display_name: displayName || undefined,
        confirm_token: confirmToken,
        unsubscribe_token: unsubscribeToken,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await admin.from("trip_subscribers").insert({
      email: checked.email,
      display_name: displayName,
      status: "pending",
      confirm_token: confirmToken,
      unsubscribe_token: unsubscribeToken,
    });
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  const confirmUrl = `${siteUrl}/api/trip-confirm?token=${encodeURIComponent(confirmToken)}`;
  const resend = new Resend(resendKey);
  const { error: sendError } = await resend.emails.send({
    from,
    to: [checked.email],
    subject: "Confirm trip updates from Mike",
    text: `Confirm you want emails when Mike moves and where he is.\n\nOpen this link:\n${confirmUrl}\n`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#1a1224;max-width:560px">
        <p>Confirm you want emails when Mike moves and where he is on the Cincinnati → Seattle trip.</p>
        <p><a href="${escapeHtml(confirmUrl)}" style="display:inline-block;padding:12px 18px;background:#5b2d8e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Confirm my email</a></p>
        <p style="color:#666;font-size:13px">If the button does not work, paste this URL into your browser:<br />${escapeHtml(confirmUrl)}</p>
      </div>
    `,
  });

  if (sendError) {
    console.error("trip-subscribe Resend error:", sendError);
    return Response.json(
      { error: sendError.message || "Could not send the confirmation email." },
      { status: 500 },
    );
  }

  return Response.json({
    ok: true,
    message: "Check your inbox and tap the confirmation link.",
  });
}
