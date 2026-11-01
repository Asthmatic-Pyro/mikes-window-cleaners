import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { env } from "./_lib/env.js";
import { buildPlaceEmail, gatherPlaceContent } from "./_lib/placeEmail.js";

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

type Recipient = {
  email: string;
  unsubscribeUrl?: string | null;
};

export async function POST(request: Request) {
  const supabaseUrl = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");
  const resendKey = env("RESEND_API_KEY");
  const from = env("EMAIL_FROM");
  const siteUrl = (env("SITE_URL") || "https://mikeswindowcleaners.com").replace(/\/$/, "");

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

  const { data: profileRecipients, error: recipientsError } = await adminClient
    .from("profiles")
    .select("email")
    .eq("notify_opt_in", true)
    .not("email", "is", null);

  if (recipientsError) {
    return Response.json({ error: recipientsError.message }, { status: 500 });
  }

  const { data: tripRecipients, error: tripError } = await adminClient
    .from("trip_subscribers")
    .select("email, unsubscribe_token")
    .eq("status", "confirmed");

  if (tripError) {
    return Response.json({ error: tripError.message }, { status: 500 });
  }

  const recipients: Recipient[] = [];
  const seen = new Set<string>();

  for (const row of profileRecipients ?? []) {
    const email = (row.email || "").trim().toLowerCase();
    if (!email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    recipients.push({ email });
  }

  for (const row of tripRecipients ?? []) {
    const email = (row.email || "").trim().toLowerCase();
    if (!email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    recipients.push({
      email,
      unsubscribeUrl: `${siteUrl}/api/trip-confirm?unsub=${encodeURIComponent(row.unsubscribe_token)}`,
    });
  }

  if (recipients.length === 0) {
    return Response.json({ ok: true, sent: 0 });
  }

  const resend = new Resend(resendKey);

  let subject: string;
  let htmlBase: string;
  let textBase: string;

  if (eventType === "location") {
    const { data: location } = await adminClient
      .from("location_public")
      .select("city_label, lat, lng, published_at")
      .eq("id", 1)
      .maybeSingle();

    const { data: destinations } = await adminClient
      .from("destinations")
      .select("name, status, sort_order, city_label, lat, lng")
      .order("sort_order", { ascending: true });

    const lat = location?.lat ?? null;
    const lng = location?.lng ?? null;
    const cityLabelRaw = (location?.city_label || summary || "").trim();
    const publishedAt = location?.published_at || new Date().toISOString();

    const needle = cityLabelRaw.toLowerCase();
    const matchedStop = (destinations ?? []).find((d) => {
      const label = (d.city_label || d.name || "").toLowerCase();
      const nameHit =
        Boolean(label && needle) &&
        (needle.includes(label.split(",")[0] || "") || label.includes(needle.split(",")[0] || ""));
      let near = false;
      if (lat != null && lng != null && d.lat != null && d.lng != null) {
        const dLat = Number(d.lat) - lat;
        const dLng = Number(d.lng) - lng;
        // ~25 miles in degrees, rough; enough to treat a pin as that stop.
        near = dLat * dLat + dLng * dLng < 0.16;
      }
      // Only trust status=current when the published pin also looks like that stop.
      if (d.status === "current" && (nameHit || near || !cityLabelRaw)) return true;
      return nameHit || near;
    });

    const upcoming = (destinations ?? [])
      .filter((d) => d.status === "upcoming")
      .sort((a, b) => a.sort_order - b.sort_order);
    const nextStop = upcoming[0]
      ? { name: upcoming[0].name, city_label: upcoming[0].city_label }
      : null;

    const gathered = await gatherPlaceContent({
      cityLabel: cityLabelRaw,
      stopName: matchedStop?.name ?? null,
      lat,
      lng,
      nextStop,
      onWrittenRoute: Boolean(matchedStop),
    });

    const built = buildPlaceEmail({
      cityLabel: gathered.resolvedLabel,
      stopName: matchedStop?.name ?? null,
      lat: lat ?? 0,
      lng: lng ?? 0,
      publishedAt,
      nextStop,
      weather: gathered.weather,
      wiki: gathered.wiki,
      nature: gathered.nature,
      reverse: gathered.reverse,
      onWrittenRoute: Boolean(matchedStop),
      unsubscribeUrl: null,
    });
    subject = built.subject;
    htmlBase = built.html;
    textBase = built.text;
  } else {
    subject = `New Follow update: ${summary}`;
    htmlBase = `
    <h2>Follow Mike</h2>
    <p>${escapeHtml(summary)}</p>
    <p><a href="${escapeHtml(siteUrl)}/Follow">Open /Follow</a></p>
  `;
    textBase = `Follow Mike\n\n${summary}\n\n${siteUrl}/Follow\n`;
  }

  const results = await Promise.all(
    recipients.map((recipient) => {
      let html = htmlBase;
      let text = textBase;
      if (eventType === "location" && recipient.unsubscribeUrl) {
        const unsubHtml = `<p style="margin:16px 0 0;font-size:12px;color:#7a6b8a"><a href="${escapeHtml(recipient.unsubscribeUrl)}" style="color:#7a6b8a">Unsubscribe</a></p>`;
        html = htmlBase.includes("Mike's Window Cleaners")
          ? htmlBase.replace(
              `<p style="margin:12px 0 8px;font-size:12px;color:#9a8ba8">Mike's Window Cleaners · Cincinnati → Seattle</p>`,
              `${unsubHtml}<p style="margin:12px 0 8px;font-size:12px;color:#9a8ba8">Mike's Window Cleaners · Cincinnati → Seattle</p>`,
            )
          : `${htmlBase}${unsubHtml}`;
        text = `${textBase}\nUnsubscribe: ${recipient.unsubscribeUrl}\n`;
      } else if (eventType === "post" && recipient.unsubscribeUrl) {
        html = `${htmlBase}<p style="font-size:12px"><a href="${escapeHtml(recipient.unsubscribeUrl)}">Unsubscribe</a></p>`;
        text = `${textBase}\nUnsubscribe: ${recipient.unsubscribeUrl}\n`;
      }

      return resend.emails.send({
        from,
        to: [recipient.email],
        subject,
        html,
        text,
      });
    }),
  );

  let sent = 0;
  for (const { error } of results) {
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
