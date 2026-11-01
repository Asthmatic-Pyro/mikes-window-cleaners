import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { env } from "./_lib/env.js";
import {
  cleanPayMethod,
  createGuestNameClaim,
  deliverNameAlert,
  guestNameAlertsBursting,
  nameAlertFromClaimId,
  setClaimWindow,
  tierFromPlace,
} from "./_lib/nameAlert.js";
import { alertMike } from "./_lib/telegram.js";

type GiveawayEntry = { email: string; name: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function collectGiveawayEntries(admin: any): Promise<GiveawayEntry[]> {
  const byEmail = new Map<string, GiveawayEntry>();
  const { data: subs } = await admin
    .from("trip_subscribers")
    .select("email, display_name")
    .eq("status", "confirmed");
  for (const row of (subs ?? []) as Array<{ email?: string; display_name?: string }>) {
    const email = (row.email || "").trim().toLowerCase();
    if (!email.includes("@")) continue;
    byEmail.set(email, { email, name: (row.display_name || "").trim() });
  }
  const { data: claims } = await admin
    .from("name_claims")
    .select("display_name, profiles(email, display_name)")
    .eq("status", "approved");
  for (const row of (claims ?? []) as Array<{
    display_name?: string;
    profiles?: { email?: string; display_name?: string } | Array<{ email?: string; display_name?: string }>;
  }>) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const email = (profile?.email || "").trim().toLowerCase();
    if (!email.includes("@")) continue;
    const name = (row.display_name || "").trim() || (profile?.display_name || "").trim();
    if (!byEmail.has(email)) byEmail.set(email, { email, name });
    else if (name && !byEmail.get(email)?.name) byEmail.set(email, { email, name });
  }
  return [...byEmail.values()];
}

async function requireAdminClient(request: Request) {
  const supabaseUrl = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") || env("SERVICE_ROLE");
  const anonKey = env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return { error: Response.json({ error: "Supabase is not configured." }, { status: 500 }) };
  }
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return { error: Response.json({ error: "Unauthorized." }, { status: 401 }) };
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return { error: Response.json({ error: "Unauthorized." }, { status: 401 }) };
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { error: Response.json({ error: "Forbidden." }, { status: 403 }) };
  return { admin, user };
}

const MAX_IMAGE_BYTES = 4.2 * 1024 * 1024;

type Payload = {
  id?: string;
  display_name: string;
  amount: number | null;
  tier?: "car" | "windshield";
  image?: File | null;
};

async function readPayload(request: Request): Promise<Payload> {
  const form = await request.formData();
  const image = form.get("image");
  const amountRaw = String(form.get("amount") || "").trim();
  const amount = amountRaw ? Number(amountRaw) : null;
  const tierRaw = String(form.get("tier") || "").trim();
  return {
    id: String(form.get("id") || "").trim() || undefined,
    display_name: String(form.get("display_name") || ""),
    amount: amount != null && Number.isFinite(amount) ? amount : null,
    tier: tierRaw === "windshield" || tierRaw === "car" ? tierRaw : undefined,
    image: image instanceof File && image.size > 0 ? image : null,
  };
}

function noteWithImage(note: string | null | undefined, imageUrl: string) {
  const text = (note || "")
    .replace(/(?:^|\n)image:https?:\/\/\S+/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
  return `${text || "Added in admin"}\nimage:${imageUrl}`;
}

async function uploadImage(admin: SupabaseClient, userId: string, file: File) {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Photo is too large. Try a smaller JPEG or PNG.");
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/names/${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from("post-images").upload(path, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return admin.storage.from("post-images").getPublicUrl(path).data.publicUrl;
}

type NameAlertBody = {
  action?: string;
  claimId?: string;
  displayName?: string;
  amount?: number | string;
  payMethod?: string;
  place?: string;
};

type GiveawayAction = {
  kind: "confirm_email" | "approve_claim";
  name: string;
  email: string;
  detail: string;
  created_at: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function collectGiveawayMetrics(admin: any) {
  const [{ data: subs }, { data: pendingClaims }, { count: approvedClaimCount }] = await Promise.all([
    admin
      .from("trip_subscribers")
      .select("email, display_name, status, created_at, confirmed_at")
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("name_claims")
      .select("id, display_name, status, created_at, profiles(email, display_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("name_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
  ]);

  const rows = (subs ?? []) as Array<{
    email?: string;
    display_name?: string;
    status?: string;
    created_at?: string;
    confirmed_at?: string | null;
  }>;

  let pendingConfirm = 0;
  let confirmed = 0;
  let unsubscribed = 0;
  const needsAction: GiveawayAction[] = [];

  for (const row of rows) {
    const status = row.status || "";
    if (status === "pending") {
      pendingConfirm += 1;
      needsAction.push({
        kind: "confirm_email",
        name: (row.display_name || "").trim() || "—",
        email: (row.email || "").trim().toLowerCase(),
        detail: "Opened signup — still needs the email confirm link",
        created_at: row.created_at ?? null,
      });
    } else if (status === "confirmed") {
      confirmed += 1;
    } else if (status === "unsubscribed") {
      unsubscribed += 1;
    }
  }

  for (const row of (pendingClaims ?? []) as Array<{
    display_name?: string;
    created_at?: string;
    profiles?: { email?: string; display_name?: string } | Array<{ email?: string; display_name?: string }>;
  }>) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    needsAction.push({
      kind: "approve_claim",
      name: (row.display_name || "").trim() || (profile?.display_name || "").trim() || "—",
      email: (profile?.email || "").trim().toLowerCase(),
      detail: "Name-on-car tip waiting for approval (counts as an entry once approved)",
      created_at: row.created_at ?? null,
    });
  }

  needsAction.sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0;
    const tb = b.created_at ? Date.parse(b.created_at) : 0;
    return tb - ta;
  });

  return {
    metrics: {
      attempted: pendingConfirm + confirmed + unsubscribed,
      pending_confirm: pendingConfirm,
      confirmed_trip: confirmed,
      unsubscribed,
      approved_claims: approvedClaimCount ?? 0,
      needs_action: needsAction.length,
    },
    needs_action: needsAction.slice(0, 80),
  };
}

/** Giveaway entries + status (admin). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("giveaway") !== "1") {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  const auth = await requireAdminClient(request);
  if ("error" in auth && auth.error) return auth.error;
  const admin = auth.admin!;
  const [entries, bundle] = await Promise.all([
    collectGiveawayEntries(admin),
    collectGiveawayMetrics(admin),
  ]);
  const { data: settings } = await admin
    .from("site_settings")
    .select("giveaway_ends_at, giveaway_winner_email, giveaway_winner_name, giveaway_drawn_at")
    .eq("id", 1)
    .maybeSingle();
  return Response.json({
    entries: entries.map((e) => ({ email: e.email, name: e.name })),
    count: entries.length,
    settings,
    metrics: bundle.metrics,
    needs_action: bundle.needs_action,
  });
}

function oneLine(value: string, max: number) {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

async function signedInUserId(request: Request) {
  const supabaseUrl = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
  const anonKey = env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !supabaseUrl || !anonKey) return null;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data } = await userClient.auth.getUser();
  return data.user?.id ?? null;
}

async function postDrawGiveaway(request: Request) {
  const auth = await requireAdminClient(request);
  if ("error" in auth && auth.error) return auth.error;
  const admin = auth.admin!;
  const resendKey = env("RESEND_API_KEY");
  const from = env("EMAIL_FROM");
  const siteUrl = (env("SITE_URL") || "https://mikeswindowcleaners.com").replace(/\/$/, "");
  if (!resendKey || !from) {
    return Response.json({ error: "Email is not configured." }, { status: 500 });
  }

  const { data: settings } = await admin
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

  const entries = await collectGiveawayEntries(admin);
  if (entries.length === 0) {
    return Response.json({ error: "No entries yet." }, { status: 400 });
  }

  const winner = entries[Math.floor(Math.random() * entries.length)];
  const drawnAt = new Date().toISOString();
  const { error: saveError } = await admin
    .from("site_settings")
    .update({
      giveaway_winner_email: winner.email,
      giveaway_winner_name: winner.name || winner.email,
      giveaway_drawn_at: drawnAt,
      updated_at: drawnAt,
    })
    .eq("id", 1);
  if (saveError) return Response.json({ error: saveError.message }, { status: 500 });

  const resend = new Resend(resendKey);
  const { error: sendError } = await resend.emails.send({
    from,
    to: [winner.email],
    subject: "You won — name on the Metro + shirt",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#1a1224;max-width:560px">
        <h2 style="color:#5b2d8e">You won the name-on-the-Metro giveaway</h2>
        <p>Hi ${escapeHtml(winner.name || "there")},</p>
        <p>Your name is going on Mike&apos;s Geo Metro hatch window, and you also get a shirt with that name on the windshield graphic. Reply to this email or open Follow and claim the exact spelling you want.</p>
        <p><a href="${escapeHtml(siteUrl)}/Follow" style="display:inline-block;padding:12px 18px;background:#5b2d8e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Open Follow</a></p>
      </div>
    `,
  });

  void alertMike(
    "trip",
    `Giveaway winner drawn: ${winner.name || winner.email}\n${winner.email}\nPrize: hatch name + windshield shirt`,
    { email: winner.email, name: winner.name, status: "drawn" },
  );

  if (sendError) {
    return Response.json({
      ok: true,
      winner,
      emailError: sendError.message || "Winner saved, but the email failed.",
    });
  }
  return Response.json({ ok: true, winner, drawn_at: drawnAt });
}

async function postNameAlert(request: Request) {
  let body: NameAlertBody;
  try {
    body = (await request.json()) as NameAlertBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.action === "draw_giveaway") {
    return postDrawGiveaway(request);
  }

  const claimId = oneLine(body.claimId ?? "", 80);
  const payMethod = cleanPayMethod(body.payMethod);
  const amount = Number(body.amount);
  const tier = tierFromPlace(body.place, Number.isFinite(amount) ? amount : 0);

  if (tier === "windshield" && Number.isFinite(amount) && amount > 0 && amount < 100) {
    return Response.json({ error: "Windshield starts at $100." }, { status: 400 });
  }

  if (claimId) {
    if (body.place) await setClaimWindow(claimId, tier);
    const loaded = await nameAlertFromClaimId(claimId, payMethod);
    if (loaded.kind === "missing") {
      return Response.json({ error: "That name request was not found." }, { status: 404 });
    }
    if (loaded.kind === "admin") {
      return Response.json({ ok: true, skipped: true });
    }
    const result = await deliverNameAlert(loaded.input);
    return Response.json({ ok: true, ...result });
  }

  const displayName = oneLine(body.displayName ?? "", 40);
  if (!displayName || !Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return Response.json({ error: "Name and amount are required." }, { status: 400 });
  }
  if (!body.place) {
    return Response.json({ error: "Choose the windshield or the hatch window." }, { status: 400 });
  }
  if (await guestNameAlertsBursting()) {
    return Response.json({ error: "Too many name alerts. Try again in a few minutes." }, { status: 429 });
  }

  const note = payMethod
    ? `${payMethod} · put "${displayName}" in the tip message`
    : `Put "${displayName}" in the tip message`;
  const userId = await signedInUserId(request);
  const guestId = await createGuestNameClaim({ userId, displayName, amount, tier, note });
  const result = await deliverNameAlert({
    claimId: guestId,
    displayName,
    amount,
    tier,
    payMethod,
    signedIn: false,
    note,
  });
  return Response.json({ ok: true, ...result, claimId: guestId });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return postNameAlert(request);

  const supabaseUrl = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = await readPayload(request);
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
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

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  let imageUrl: string | undefined;
  if (payload.image) {
    try {
      imageUrl = await uploadImage(admin, user.id, payload.image);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not upload the photo.";
      return Response.json({ error: message }, { status: 500 });
    }
  }

  if (payload.id) {
    if (!imageUrl) {
      return Response.json({ error: "Choose a photo to attach." }, { status: 400 });
    }
    const { data: existing, error: readError } = await admin
      .from("name_claims")
      .select("payment_note")
      .eq("id", payload.id)
      .maybeSingle();
    if (readError) return Response.json({ error: readError.message }, { status: 500 });
    if (!existing) return Response.json({ error: "That name was not found." }, { status: 404 });

    const paymentNote = noteWithImage(existing.payment_note, imageUrl);
    let updated = await admin
      .from("name_claims")
      .update({ image_url: imageUrl, payment_note: paymentNote })
      .eq("id", payload.id)
      .select()
      .single();
    if (updated.error && /image_url/i.test(updated.error.message)) {
      updated = await admin.from("name_claims").update({ payment_note: paymentNote }).eq("id", payload.id).select().single();
    }
    if (updated.error) return Response.json({ error: updated.error.message }, { status: 500 });
    return Response.json(updated.data);
  }

  const displayName = payload.display_name.trim();
  if (!displayName || displayName.length > 40) {
    return Response.json({ error: "Enter a name up to 40 characters." }, { status: 400 });
  }
  if (payload.amount == null || payload.amount <= 0 || payload.amount > 100000) {
    return Response.json({ error: "Enter a valid amount." }, { status: 400 });
  }

  const paymentNote = imageUrl ? noteWithImage("Added in admin", imageUrl) : "Added in admin";
  const tier = payload.tier ?? (payload.amount >= 100 ? "windshield" : "car");
  const row: Record<string, unknown> = {
    user_id: user.id,
    display_name: displayName,
    amount: payload.amount,
    tier,
    payment_note: paymentNote,
    status: "approved",
    reviewed_at: new Date().toISOString(),
  };
  if (imageUrl) row.image_url = imageUrl;
  let created = await admin.from("name_claims").insert(row).select().single();
  if (created.error && imageUrl && /image_url/i.test(created.error.message)) {
    delete row.image_url;
    created = await admin.from("name_claims").insert(row).select().single();
  }

  if (created.error) return Response.json({ error: created.error.message }, { status: 500 });
  if (created.data?.id) {
    const fixed = await admin.from("name_claims").update({ tier }).eq("id", created.data.id).select().single();
    if (!fixed.error && fixed.data) return Response.json(fixed.data);
  }
  return Response.json(created.data);
}
