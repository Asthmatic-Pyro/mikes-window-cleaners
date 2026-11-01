import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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
  claimId?: string;
  displayName?: string;
  amount?: number | string;
  payMethod?: string;
  place?: string;
};

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

async function postNameAlert(request: Request) {
  let body: NameAlertBody;
  try {
    body = (await request.json()) as NameAlertBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
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
  const row = {
    user_id: user.id,
    display_name: displayName,
    amount: payload.amount,
    tier,
    payment_note: paymentNote,
    status: "approved" as const,
    reviewed_at: new Date().toISOString(),
  };
  let created = await admin
    .from("name_claims")
    .insert(imageUrl ? { ...row, image_url: imageUrl } : row)
    .select()
    .single();
  if (created.error && imageUrl && /image_url/i.test(created.error.message)) {
    created = await admin.from("name_claims").insert(row).select().single();
  }

  if (created.error) return Response.json({ error: created.error.message }, { status: 500 });
  if (created.data?.id) {
    const fixed = await admin.from("name_claims").update({ tier }).eq("id", created.data.id).select().single();
    if (!fixed.error && fixed.data) return Response.json(fixed.data);
  }
  return Response.json(created.data);
}
