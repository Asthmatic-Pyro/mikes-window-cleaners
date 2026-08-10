import { supabase } from "@/lib/supabase";
import type {
  Destination,
  LocationCurrent,
  NameClaim,
  Post,
  Reaction,
  ReactionTarget,
  ReactionType,
  SiteSettings,
  WallPost,
} from "@/lib/follow/types";

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

export async function createPost(input: {
  title: string;
  body: string;
  image_url?: string | null;
  author_id: string;
}) {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: input.title,
      body: input.body,
      image_url: input.image_url ?? null,
      author_id: input.author_id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePost(id: string, patch: Partial<Pick<Post, "title" | "body" | "image_url">>) {
  const { data, error } = await supabase.from("posts").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadPostImage(file: File, userId: string) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("post-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  return data.publicUrl;
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

export async function createWallPost(authorId: string, body: string) {
  const { data, error } = await supabase
    .from("wall_posts")
    .insert({ author_id: authorId, body: body.trim() })
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
export async function notifyFollowers(eventType: "post" | "location", eventKey: string, summary: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in.");

  const res = await fetch("/api/notify-followers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ eventType, eventKey, summary }),
  });

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
}
