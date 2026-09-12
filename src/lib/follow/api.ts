import { supabase } from "@/lib/supabase";
import type {
  Destination,
  LocationCurrent,
  LocationPublic,
  NameClaim,
  Post,
  Reaction,
  ReactionTarget,
  ReactionType,
  SiteSettings,
  EventLog,
  Testimonial,
  TestimonialStatus,
  WallPost,
} from "@/lib/follow/types";

/** Public map pin — updates immediately on manual admin save. */
export async function getPublicLocation(): Promise<LocationPublic | null> {
  const { data, error } = await supabase.from("location_public").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data;
}

/** Admin live pin. */
export async function getLocation(): Promise<LocationCurrent | null> {
  const { data, error } = await supabase.from("location_current").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateLocation(patch: Pick<LocationCurrent, "city_label" | "lat" | "lng">) {
  const { data, error } = await supabase
    .from("location_current")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Copy the live pin to the public map right now. */
export async function publishPublicLocation() {
  const { data, error } = await supabase.rpc("promote_public_location_now");
  if (!error && data) return data as LocationPublic;

  const current = await getLocation();
  if (!current) throw error ?? new Error("No current location to publish.");
  const { data: published, error: writeError } = await supabase
    .from("location_public")
    .upsert({
      id: 1,
      city_label: current.city_label,
      lat: current.lat,
      lng: current.lng,
      published_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (writeError) throw writeError;
  return published;
}

export async function getDestinations(): Promise<Destination[]> {
  const { data, error } = await supabase.from("destinations").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertDestination(
  row: Partial<Destination> & { name: string; status: Destination["status"]; sort_order: number },
) {
  const payload = {
    id: row.id,
    name: row.name,
    status: row.status,
    sort_order: row.sort_order,
    city_label: row.city_label ?? null,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
  };
  const { data, error } = await supabase.from("destinations").upsert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDestination(id: string) {
  const { error } = await supabase.from("destinations").delete().eq("id", id);
  if (error) throw error;
}

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function isNetworkError(err: unknown) {
  const message = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("load failed") ||
    message.includes("networkerror")
  );
}

export function describeFollowError(err: unknown, fallback: string) {
  if (isNetworkError(err)) return fallback;
  return err instanceof Error && err.message ? err.message : fallback;
}

async function adminSessionToken() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in.");
  return token;
}

async function savePostViaApi(payload: {
  id?: string;
  title: string;
  body: string;
  image?: File | null;
}) {
  const token = await adminSessionToken();
  const form = new FormData();
  form.append("title", payload.title);
  form.append("body", payload.body);
  if (payload.id) form.append("id", payload.id);
  if (payload.image) form.append("image", payload.image);

  let res: Response;
  try {
    res = await fetch("/api/admin-post", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  } catch (err) {
    throw new Error(describeFollowError(err, "Could not reach the server to save the post. Try again."));
  }

  const body = (await res.json().catch(() => ({}))) as Post & { error?: string };
  if (!res.ok) {
    throw new Error(body.error || "Failed to save post.");
  }
  return body;
}

export async function createPost(input: {
  title: string;
  body: string;
  image?: File | null;
  author_id: string;
}) {
  void input.author_id;
  return savePostViaApi({
    title: input.title,
    body: input.body,
    image: input.image ? await preparePostImage(input.image) : null,
  });
}

export async function updatePost(
  id: string,
  patch: { title: string; body: string; image?: File | null },
) {
  return savePostViaApi({
    id,
    title: patch.title,
    body: patch.body,
    image: patch.image ? await preparePostImage(patch.image) : null,
  });
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;

function jpegFileName(name: string) {
  return `${name.replace(/\.[^.]+$/, "") || "photo"}.jpg`;
}

async function canvasToJpeg(source: CanvasImageSource, width: number, height: number, quality: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  return blob;
}

function scaledSize(width: number, height: number, maxEdge: number) {
  if (width <= maxEdge && height <= maxEdge) return { width, height };
  const scale = Math.min(maxEdge / width, maxEdge / height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

async function compressWithBitmap(file: File, maxEdge: number, quality: number) {
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = scaledSize(bitmap.width, bitmap.height, maxEdge);
    return await canvasToJpeg(bitmap, width, height, quality);
  } finally {
    bitmap.close();
  }
}

async function compressWithImageElement(file: File, maxEdge: number, quality: number) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode"));
      img.src = objectUrl;
    });
    const { width, height } = scaledSize(image.naturalWidth || image.width, image.naturalHeight || image.height, maxEdge);
    return await canvasToJpeg(image, width, height, quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function preparePostImage(file: File): Promise<File> {
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("That photo is too large. Please use one under 25 MB.");
  }

  const attempts = [
    { max: 1920, quality: 0.82 },
    { max: 1600, quality: 0.74 },
    { max: 1280, quality: 0.68 },
    { max: 1024, quality: 0.6 },
  ];

  let last: File | null = null;
  for (const { max, quality } of attempts) {
    let blob: Blob | null = null;
    try {
      blob = await compressWithBitmap(file, max, quality);
    } catch {
      try {
        blob = await compressWithImageElement(file, max, quality);
      } catch {
        blob = null;
      }
    }
    if (!blob) continue;
    last = new File([blob], jpegFileName(file.name), { type: "image/jpeg" });
    if (last.size <= MAX_UPLOAD_BYTES) return last;
  }

  if (last && last.size <= 4.2 * 1024 * 1024) return last;
  throw new Error("Couldn’t shrink that photo enough. Try a JPEG or PNG.");
}

export async function getWallPosts(): Promise<WallPost[]> {
  const { data, error } = await supabase
    .from("wall_posts")
    .select("*, profiles(display_name)")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as WallPost[]) ?? [];
}

export async function getAllWallPostsAdmin(): Promise<WallPost[]> {
  const { data, error } = await supabase
    .from("wall_posts")
    .select("*, profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data as WallPost[]) ?? [];
}

export async function createWallPost(authorId: string, body: string, parentId?: string | null) {
  const { data, error } = await supabase
    .from("wall_posts")
    .insert({ author_id: authorId, body: body.trim(), parent_id: parentId ?? null })
    .select("*, profiles(display_name)")
    .single();
  if (error) throw error;
  return data as WallPost;
}

export async function hideWallPost(id: string, hidden = true) {
  const { error } = await supabase.from("wall_posts").update({ hidden }).eq("id", id);
  if (error) throw error;
}

export async function deleteWallPost(id: string) {
  const { error } = await supabase.from("wall_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function getReactions(targetType: ReactionTarget, targetIds: string[]): Promise<Reaction[]> {
  if (targetIds.length === 0) return [];
  const { data, error } = await supabase
    .from("reactions")
    .select("*")
    .eq("target_type", targetType)
    .in("target_id", targetIds);
  if (error) throw error;
  return data ?? [];
}

export async function toggleReaction(
  userId: string,
  targetType: ReactionTarget,
  targetId: string,
  reactionType: ReactionType,
) {
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("reaction_type", reactionType)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
    if (error) throw error;
    return { active: false };
  }

  const { error } = await supabase.from("reactions").insert({
    user_id: userId,
    target_type: targetType,
    target_id: targetId,
    reaction_type: reactionType,
  });
  if (error) throw error;
  return { active: true };
}

export async function getApprovedNames(): Promise<NameClaim[]> {
  const { data, error } = await supabase
    .from("name_claims")
    .select("*")
    .eq("status", "approved")
    .order("amount", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getNameClaimsAdmin(): Promise<NameClaim[]> {
  const { data, error } = await supabase
    .from("name_claims")
    .select("*, profiles(display_name, email)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as NameClaim[]) ?? [];
}

export async function submitNameClaim(input: {
  user_id: string;
  display_name: string;
  amount: number;
  payment_note?: string;
}) {
  const tier = input.amount >= 100 ? "windshield" : "car";
  const { data, error } = await supabase
    .from("name_claims")
    .insert({
      user_id: input.user_id,
      display_name: input.display_name.trim(),
      amount: input.amount,
      tier,
      payment_note: input.payment_note?.trim() || null,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function reviewNameClaim(id: string, status: "approved" | "rejected") {
  const { data, error } = await supabase
    .from("name_claims")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMyNameClaims(userId: string): Promise<NameClaim[]> {
  const { data, error } = await supabase
    .from("name_claims")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteNameClaim(id: string) {
  const { error } = await supabase.from("name_claims").delete().eq("id", id);
  if (error) throw error;
}

export async function getEventLogs(): Promise<EventLog[]> {
  const { data, error } = await supabase
    .from("event_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) throw error;
  return (data as EventLog[]) ?? [];
}

export async function getSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSettings(patch: Partial<SiteSettings>) {
  const { data, error } = await supabase
    .from("site_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Ask the server to email opted-in followers (admin session required). */
export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(24);
  if (error) throw error;
  return (data as Testimonial[]) ?? [];
}

export async function getAllTestimonialsAdmin(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);
  if (error) throw error;
  return (data as Testimonial[]) ?? [];
}

export async function reviewTestimonial(id: string, status: Extract<TestimonialStatus, "published" | "rejected">) {
  const { data, error } = await supabase
    .from("testimonials")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Testimonial;
}

export async function deleteTestimonial(id: string) {
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw error;
}

export async function notifyFollowers(eventType: "post" | "location", eventKey: string, summary: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in.");

  let res: Response;
  try {
    res = await fetch("/api/notify-followers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ eventType, eventKey, summary }),
    });
  } catch (err) {
    throw new Error(describeFollowError(err, "Could not notify followers."));
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Failed to notify followers.");
  }

  return res.json();
}

/** Geocode a city/area label to coordinates via OpenStreetMap Nominatim (city-level). */
export async function geocodeCity(query: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        result?: { lat: number; lng: number; label: string } | null;
      };
      if (body.result) return body.result;
      if (body.result === null) return null;
    }
  } catch {
    // Fall through to a direct lookup if the API route isn't deployed yet.
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const hit = rows[0];
    if (!hit) return null;
    return {
      lat: Number(hit.lat),
      lng: Number(hit.lon),
      label: hit.display_name.split(",").slice(0, 2).join(",").trim() || q,
    };
  } catch (err) {
    throw new Error(describeFollowError(err, "Could not look up that city. Try again in a moment."));
  }
}
