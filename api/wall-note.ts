import { adminClient, alertMike } from "./_lib/telegram.js";

type WallBody = {
  displayName?: string;
  body?: string;
  parentId?: string | null;
};

type FoodBody = {
  displayName?: string;
  placeName?: string;
  note?: string;
  cityLabel?: string;
  lat?: number | null;
  lng?: number | null;
  tipAmount?: number | null;
  payMethod?: string;
};

const MAX_BODY = 140;
const MAX_NAME = 40;
const MAX_PLACE = 80;
const MAX_FOOD_NOTE = 200;
const MAX_CITY = 80;

function isFoodRequest(request: Request) {
  return new URL(request.url).searchParams.get("food") === "1";
}

export async function GET(request: Request) {
  if (!isFoodRequest(request)) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const admin = adminClient();
  if (!admin) {
    return Response.json({ error: "Foodies is not configured yet." }, { status: 503 });
  }

  const url = new URL(request.url);
  const city = (url.searchParams.get("city") ?? "").trim();
  const limit = Math.min(40, Math.max(1, Number(url.searchParams.get("limit") || 24) || 24));

  let query = admin
    .from("food_tips")
    .select("id, display_name, place_name, note, city_label, tip_amount, created_at")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (city) {
    query = query.ilike("city_label", city);
  }

  const { data, error } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ tips: data ?? [] });
}

async function createFoodTip(request: Request) {
  let body: FoodBody;
  try {
    body = (await request.json()) as FoodBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const displayName = (body.displayName ?? "").trim();
  if (!displayName || displayName.length > MAX_NAME) {
    return Response.json({ error: "Add your name (40 characters or fewer)." }, { status: 400 });
  }

  const placeName = (body.placeName ?? "").trim();
  if (!placeName || placeName.length > MAX_PLACE) {
    return Response.json({ error: "Add a place name (80 characters or fewer)." }, { status: 400 });
  }

  const note = (body.note ?? "").trim();
  if (note.length > MAX_FOOD_NOTE) {
    return Response.json({ error: "Keep the note under 200 characters." }, { status: 400 });
  }

  const cityLabel = (body.cityLabel ?? "").trim();
  if (!cityLabel || cityLabel.length > MAX_CITY) {
    return Response.json({ error: "Missing Mike’s current city." }, { status: 400 });
  }

  const tipAmount =
    body.tipAmount == null || Number.isNaN(Number(body.tipAmount)) ? null : Number(body.tipAmount);
  if (tipAmount != null && (!Number.isFinite(tipAmount) || tipAmount < 0 || tipAmount > 5000)) {
    return Response.json({ error: "Enter a valid tip amount." }, { status: 400 });
  }

  const payMethod = (body.payMethod ?? "").trim().slice(0, 40);
  const lat = typeof body.lat === "number" && Number.isFinite(body.lat) ? body.lat : null;
  const lng = typeof body.lng === "number" && Number.isFinite(body.lng) ? body.lng : null;

  const admin = adminClient();
  if (!admin) {
    return Response.json({ error: "Foodies is not configured on the server yet." }, { status: 503 });
  }

  const since = new Date(Date.now() - 60_000).toISOString();
  const { count, error: recentError } = await admin
    .from("food_tips")
    .select("id", { count: "exact", head: true })
    .ilike("display_name", displayName)
    .gt("created_at", since);

  if (recentError) {
    return Response.json({ error: recentError.message }, { status: 500 });
  }
  if ((count ?? 0) > 0) {
    return Response.json({ error: "Wait a minute before sending another tip." }, { status: 429 });
  }

  const { data, error } = await admin
    .from("food_tips")
    .insert({
      display_name: displayName,
      place_name: placeName,
      note,
      city_label: cityLabel,
      lat,
      lng,
      tip_amount: tipAmount,
      pay_method: payMethod,
    })
    .select("id")
    .single();

  if (error || !data) {
    return Response.json({ error: error?.message || "Could not save that food tip." }, { status: 500 });
  }

  const tipLine =
    tipAmount != null && tipAmount > 0
      ? `\nTip: $${Number.isInteger(tipAmount) ? tipAmount : tipAmount.toFixed(2)}${payMethod ? ` via ${payMethod}` : ""}`
      : "";
  void alertMike(
    "food",
    `Foodies tip near ${cityLabel}\n${placeName}\nfrom ${displayName}${note ? `\n“${note}”` : ""}${tipLine}`,
    {
      id: data.id,
      place_name: placeName,
      display_name: displayName,
      city_label: cityLabel,
      tip_amount: tipAmount,
      pay_method: payMethod,
    },
  );

  return Response.json({ ok: true, id: data.id });
}

export async function POST(request: Request) {
  if (isFoodRequest(request)) {
    return createFoodTip(request);
  }

  let body: WallBody;
  try {
    body = (await request.json()) as WallBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const displayName = (body.displayName ?? "").trim();
  if (!displayName || displayName.length > MAX_NAME) {
    return Response.json({ error: "Add a name (40 characters or fewer)." }, { status: 400 });
  }

  const note = (body.body ?? "").trim();
  if (!note || note.length > MAX_BODY) {
    return Response.json({ error: "Write a short note (140 characters or fewer)." }, { status: 400 });
  }

  const parentId = (body.parentId ?? "").trim() || null;
  const admin = adminClient();
  if (!admin) {
    return Response.json({ error: "Guestbook is not configured on the server yet." }, { status: 503 });
  }

  const since = new Date(Date.now() - 60_000).toISOString();
  const { count, error: recentError } = await admin
    .from("wall_posts")
    .select("id", { count: "exact", head: true })
    .is("author_id", null)
    .ilike("display_name", displayName)
    .gt("created_at", since);

  if (recentError) {
    return Response.json({ error: recentError.message }, { status: 500 });
  }
  if ((count ?? 0) > 0) {
    return Response.json({ error: "Wait a minute before posting again." }, { status: 429 });
  }

  if (parentId) {
    const { data: parent, error: parentError } = await admin
      .from("wall_posts")
      .select("id")
      .eq("id", parentId)
      .eq("hidden", false)
      .maybeSingle();
    if (parentError) {
      return Response.json({ error: parentError.message }, { status: 500 });
    }
    if (!parent) {
      return Response.json({ error: "That note is no longer there." }, { status: 400 });
    }
  }

  const { data, error } = await admin
    .from("wall_posts")
    .insert({
      author_id: null,
      display_name: displayName,
      body: note,
      parent_id: parentId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return Response.json({ error: error?.message || "Could not save that note." }, { status: 500 });
  }

  return Response.json({ ok: true, id: data.id });
}
