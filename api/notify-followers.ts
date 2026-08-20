import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { env } from "./_lib/env.js";

type Body = {
  eventType?: "post" | "location";
  eventKey?: string;
  summary?: string;
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
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");
  const resendKey = env("RESEND_API_KEY");
  const from = env("EMAIL_FROM");

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }
  if (!resendKey || !from) {
    return Response.json({ error: "Email is not configured." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const eventType = body.eventType;
  const eventKey = body.eventKey?.trim() ?? "";
  const summary = body.summary?.trim() ?? "";

  if (!eventType || !eventKey || !summary) {
    return Response.json({ error: "eventType, eventKey, and summary are required." }, { status: 400 });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error: logError } = await adminClient.from("notification_log").insert({
    event_type: eventType,
    event_key: eventKey,
  });

  if (logError) {
    if (logError.code === "23505") {
      return Response.json({ ok: true, skipped: true, reason: "already_sent" });
    }
    return Response.json({ error: logError.message }, { status: 500 });
  }

  const { data: recipients, error: recipientsError } = await adminClient
    .from("profiles")
    .select("email")
    .eq("notify_opt_in", true)
    .not("email", "is", null);

  if (recipientsError) {
    return Response.json({ error: recipientsError.message }, { status: 500 });
  }

  const emails = (recipients ?? [])
    .map((r) => r.email)
    .filter((e): e is string => Boolean(e && e.includes("@")));

  if (emails.length === 0) {
    return Response.json({ ok: true, sent: 0 });
  }

  const resend = new Resend(resendKey);
  const siteUrl = env("SITE_URL") || "https://mikeswindowcleaners.com";
  const subject =
    eventType === "location"
      ? `Mike moved: ${summary}`
      : `New Follow update: ${summary}`;

  const html = `
    <h2>Follow Mike</h2>
    <p>${escapeHtml(summary)}</p>
    <p><a href="${escapeHtml(siteUrl)}/Follow">Open /Follow</a></p>
  `;

  // One recipient per message so emails stay private
  let sent = 0;
  for (const email of emails) {
    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject,
      html,
    });
    if (error) {
      console.error("Resend notify error:", error);
      return Response.json(
        { error: error.message || "Could not send notifications.", sent },
        { status: 500 },
      );
    }
    sent += 1;
  }

  return Response.json({ ok: true, sent });
}
