import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { env } from "./_lib/env.js";

type Entry = { email: string; name: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const { adminClient } = auth;

  const entries = await collectEntries(adminClient);
  const { data: settings } = await adminClient
    .from("site_settings")
    .select("giveaway_ends_at, giveaway_winner_email, giveaway_winner_name, giveaway_drawn_at")
    .eq("id", 1)
    .maybeSingle();

  return Response.json({
    entries: entries.map((e) => ({ email: e.email, name: e.name })),
    count: entries.length,
    settings,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const { adminClient } = auth;

  const resendKey = env("RESEND_API_KEY");
  const from = env("EMAIL_FROM");
  const siteUrl = (env("SITE_URL") || "https://mikeswindowcleaners.com").replace(/\/$/, "");

  if (!resendKey || !from) {
    return Response.json({ error: "Email is not configured." }, { status: 500 });
  }

  const { data: settings } = await adminClient
    .from("site_settings")
    .select("giveaway_winner_email, giveaway_winner_name, giveaway_drawn_at")
    .eq("id", 1)
    .maybeSingle();

  if (settings?.giveaway_winner_email) {
    return Response.json(
      {
        error: "A winner was already drawn.",
        winner: {
          email: settings.giveaway_winner_email,
          name: settings.giveaway_winner_name,
          drawn_at: settings.giveaway_drawn_at,
        },
      },
      { status: 409 },
    );
  }

  const entries = await collectEntries(adminClient);
  if (entries.length === 0) {
    return Response.json({ error: "No entries yet." }, { status: 400 });
  }

  const winner = entries[Math.floor(Math.random() * entries.length)];
  const drawnAt = new Date().toISOString();

  const { error: saveError } = await adminClient
    .from("site_settings")
    .update({
      giveaway_winner_email: winner.email,
      giveaway_winner_name: winner.name || winner.email,
      giveaway_drawn_at: drawnAt,
      updated_at: drawnAt,
    })
    .eq("id", 1);

  if (saveError) {
    return Response.json({ error: saveError.message }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const { error: sendError } = await resend.emails.send({
    from,
    to: [winner.email],
    subject: "You won — your name on Mike's Geo Metro",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#1a1224;max-width:560px">
        <h2 style="color:#5b2d8e">You won the name-on-the-Metro giveaway</h2>
        <p>Hi ${escapeHtml(winner.name || "there")},</p>
        <p>Your name is going on Mike&apos;s Geo Metro hatch window. Reply to this email or open Follow and claim the exact spelling you want.</p>
        <p><a href="${escapeHtml(siteUrl)}/Follow" style="display:inline-block;padding:12px 18px;background:#5b2d8e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Open Follow</a></p>
      </div>
    `,
  });

  if (sendError) {
    console.error("giveaway draw email error:", sendError);
    return Response.json(
      {
        ok: true,
        winner,
        emailError: sendError.message || "Winner saved, but the email failed.",
      },
      { status: 200 },
    );
  }

  return Response.json({ ok: true, winner, drawn_at: drawnAt });
}

async function requireAdmin(request: Request) {
  const supabaseUrl = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") || env("SERVICE_ROLE");
  const anonKey = env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  return { adminClient, user };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function collectEntries(adminClient: any): Promise<Entry[]> {
  const byEmail = new Map<string, Entry>();

  const { data: subs } = await adminClient
    .from("trip_subscribers")
    .select("email, display_name")
    .eq("status", "confirmed");

  for (const row of (subs ?? []) as Array<{ email?: string; display_name?: string }>) {
    const email = (row.email || "").trim().toLowerCase();
    if (!email.includes("@")) continue;
    byEmail.set(email, { email, name: (row.display_name || "").trim() });
  }

  const { data: claims } = await adminClient
    .from("name_claims")
    .select("display_name, user_id, profiles(email, display_name)")
    .eq("status", "approved");

  for (const row of (claims ?? []) as Array<{
    display_name?: string;
    profiles?: { email?: string; display_name?: string } | Array<{ email?: string; display_name?: string }>;
  }>) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const email = (profile?.email || "").trim().toLowerCase();
    if (!email.includes("@")) continue;
    const name = (row.display_name || "").trim() || (profile?.display_name || "").trim();
    if (!byEmail.has(email)) {
      byEmail.set(email, { email, name });
    } else if (name && !byEmail.get(email)?.name) {
      byEmail.set(email, { email, name });
    }
  }

  return [...byEmail.values()];
}
