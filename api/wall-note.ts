import { adminClient } from "./_lib/telegram.js";

type Body = {
  displayName?: string;
  body?: string;
  parentId?: string | null;
};

const MAX_BODY = 140;
const MAX_NAME = 40;

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
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
