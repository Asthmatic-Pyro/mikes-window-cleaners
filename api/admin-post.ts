import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./_lib/env.js";

const MAX_IMAGE_BYTES = 4.2 * 1024 * 1024;

type Payload = {
  id?: string;
  title: string;
  body: string;
  image_url?: string | null;
  image?: File | null;
};

async function readPayload(request: Request): Promise<Payload> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const image = form.get("image");
    const imageUrl = form.get("image_url");
    return {
      id: String(form.get("id") || "").trim() || undefined,
      title: String(form.get("title") || ""),
      body: String(form.get("body") || ""),
      image_url: typeof imageUrl === "string" && imageUrl ? imageUrl : undefined,
      image: image instanceof File && image.size > 0 ? image : null,
    };
  }

  const json = (await request.json()) as {
    id?: string;
    title?: string;
    body?: string;
    image_url?: string | null;
  };
  return {
    id: json.id?.trim() || undefined,
    title: json.title ?? "",
    body: json.body ?? "",
    image_url: json.image_url,
    image: null,
  };
}

async function uploadImage(admin: SupabaseClient, userId: string, file: File) {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Photo is too large. Try a smaller JPEG or PNG.");
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from("post-images").upload(path, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return admin.storage.from("post-images").getPublicUrl(path).data.publicUrl;
}

export async function POST(request: Request) {
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

  const title = payload.title.trim();
  const text = payload.body.trim();
  if (!title || !text) {
    return Response.json({ error: "Title and body are required." }, { status: 400 });
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

  let imageUrl = payload.image_url;
  if (payload.image) {
    try {
      imageUrl = await uploadImage(admin, user.id, payload.image);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not upload the photo.";
      return Response.json({ error: message }, { status: 500 });
    }
  }

  if (payload.id) {
    const patch: { title: string; body: string; image_url?: string | null; updated_at: string } = {
      title,
      body: text,
      updated_at: new Date().toISOString(),
    };
    if (imageUrl !== undefined) patch.image_url = imageUrl;

    const { data, error } = await admin.from("posts").update(patch).eq("id", payload.id).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data);
  }

  const { data, error } = await admin
    .from("posts")
    .insert({
      title,
      body: text,
      image_url: imageUrl ?? null,
      author_id: user.id,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
