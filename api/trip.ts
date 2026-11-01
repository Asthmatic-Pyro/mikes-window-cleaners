import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { checkSubscriberEmail } from "./_lib/emailCheck.js";
import { env } from "./_lib/env.js";
import { alertMike } from "./_lib/telegram.js";

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

function adminClient() {
  const supabaseUrl = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") || env("SERVICE_ROLE");
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function page(title: string, body: string) {
  const siteUrl = (env("SITE_URL") || "https://mikeswindowcleaners.com").replace(/\/$/, "");
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4eef8;color:#1a1224}
  main{max-width:420px;margin:12vh auto;padding:28px 24px;background:#fff;border-radius:12px;box-shadow:0 18px 40px -24px rgba(60,20,90,.45)}
  h1{font-size:1.45rem;margin:0 0 10px}
  p{line-height:1.55;margin:0 0 12px;color:#4a3f58}
  a{color:#5b2d8e;font-weight:600}
</style></head><body><main><h1>${title}</h1>${body}
<p><a href="${siteUrl}/Follow">Open Follow</a> · <a href="${siteUrl}/">Home</a></p>
</main></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/** Confirm or unsubscribe via emailed links. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const confirmToken = url.searchParams.get("token")?.trim() ?? "";
  const unsub = url.searchParams.get("unsub")?.trim() ?? "";

  const admin = adminClient();
  if (!admin) {
    return page("Something went wrong", "<p>Signup is not configured right now.</p>");
  }

  if (unsub) {
    const { data, error } = await admin
      .from("trip_subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("unsubscribe_token", unsub)
      .select("email, display_name")
      .maybeSingle();

    if (error || !data) {
      return page("Link not found", "<p>That unsubscribe link is invalid or already used.</p>");
    }
    const who = (data.display_name || "").trim() || data.email;
    void alertMike("trip", `Trip updates unsubscribed: ${who}\n${data.email}`, {
      email: data.email,
      display_name: data.display_name,
      status: "unsubscribed",
    });
    return page(
      "You are unsubscribed",
      "<p>You will not get where-I-am or when-I-move emails from Mike anymore.</p>",
    );
  }

  if (!confirmToken) {
    return page("Missing link", "<p>Open the confirmation link from your email.</p>");
  }

  const { data, error } = await admin
    .from("trip_subscribers")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      unsubscribed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("confirm_token", confirmToken)
    .select("email, display_name")
    .maybeSingle();

  if (error || !data) {
    return page("Link not found", "<p>That confirmation link is invalid or expired.</p>");
  }

  const who = (data.display_name || "").trim() || data.email;
  void alertMike(
    "trip",
    `Trip entry confirmed: ${who}\n${data.email}\nGiveaway entry counted.`,
    { email: data.email, display_name: data.display_name, status: "confirmed" },
  );

  return page(
    "You are on the list",
    "<p>Thanks. You will get an email when Mike moves, with weather, a short look at the stop, and nearby nature.</p>",
  );
}

/** Start confirm-only trip updates signup. */
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

  const confirmUrl = `${siteUrl}/api/trip?token=${encodeURIComponent(confirmToken)}`;
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
    console.error("trip subscribe Resend error:", sendError);
    return Response.json(
      { error: sendError.message || "Could not send the confirmation email." },
      { status: 500 },
    );
  }

  const who = displayName || checked.email;
  void alertMike(
    "trip",
    `Trip signup (waiting to confirm): ${who}\n${checked.email}`,
    { email: checked.email, display_name: displayName, status: "pending" },
  );

  return Response.json({
    ok: true,
    message: "Check your inbox and tap the confirmation link.",
  });
}
