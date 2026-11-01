import { createClient } from "@supabase/supabase-js";
import { env } from "./_lib/env.js";

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
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
      .select("email")
      .maybeSingle();

    if (error || !data) {
      return page("Link not found", "<p>That unsubscribe link is invalid or already used.</p>");
    }
    return page(
      "You are unsubscribed",
      "<p>You will not get where-I-am or when-I-move emails from Mike anymore.</p>",
    );
  }

  if (!token) {
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
    .eq("confirm_token", token)
    .select("email, display_name")
    .maybeSingle();

  if (error || !data) {
    return page("Link not found", "<p>That confirmation link is invalid or expired.</p>");
  }

  return page(
    "You are on the list",
    "<p>Thanks. You will get an email when Mike moves, with weather, a short look at the stop, and nearby nature.</p>",
  );
}
