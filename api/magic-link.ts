import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { env } from "./_lib/env";
import { alertMike } from "./_lib/telegram";

type Body = {
  email?: string;
  displayName?: string;
  notifyOptIn?: boolean;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(request: Request) {
  const supabaseUrl = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") || env("SERVICE_ROLE");
  const resendKey = env("RESEND_API_KEY");
  const from = env("EMAIL_FROM");
  const siteUrl = env("SITE_URL") || "https://mikeswindowcleaners.com";

  if (!supabaseUrl) {
    return Response.json({ error: "Magic link email is not configured (missing Supabase URL)." }, { status: 500 });
  }
  if (!serviceKey) {
    return Response.json(
      { error: "Magic link email is not configured (missing Supabase service role)." },
      { status: 500 },
    );
  }
  if (!resendKey || !from) {
    return Response.json({ error: "Email is not configured (Resend)." }, { status: 500 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }

  const redirectTo = `${siteUrl.replace(/\/$/, "")}/Follow/auth/callback`;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo,
      data: {
        display_name: body.displayName?.trim() || undefined,
        notify_opt_in: body.notifyOptIn ? "true" : "false",
      },
    },
  });

  if (error) {
    console.error("generateLink error:", error);
    return Response.json({ error: error.message || "Could not create magic link." }, { status: 500 });
  }

  const actionLink = data.properties?.action_link;
  if (!actionLink) {
    return Response.json({ error: "Could not create magic link." }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const { error: sendError } = await resend.emails.send({
    from,
    to: [email],
    subject: "Your Follow Mike sign-in link",
    html: `
      <h2>Sign in to Follow Mike</h2>
      <p>Click the button below to sign in. This link expires soon.</p>
      <p><a href="${escapeHtml(actionLink)}" style="display:inline-block;padding:12px 18px;background:#1380ec;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Sign in</a></p>
      <p style="color:#666;font-size:13px">If the button doesn’t work, paste this URL into your browser:<br />${escapeHtml(actionLink)}</p>
    `,
  });

  if (sendError) {
    console.error("Resend magic link error:", sendError);
    return Response.json(
      { error: sendError.message || "Could not send magic link email." },
      { status: 500 },
    );
  }

  const createdAt = data.user?.created_at ? new Date(data.user.created_at).getTime() : 0;
  const isNew = createdAt > 0 && Date.now() - createdAt < 120_000;
  void alertMike(
    "signin",
    isNew
      ? `New user + sign-in link: ${email}${body.displayName?.trim() ? `\nName: ${body.displayName.trim()}` : ""}`
      : `Sign-in link requested: ${email}`,
    { email, displayName: body.displayName?.trim() || null, isNew },
  );

  return Response.json({ ok: true });
}
