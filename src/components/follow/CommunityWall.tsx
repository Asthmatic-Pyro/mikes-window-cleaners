import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createWallPost, getReactions, toggleReaction } from "@/lib/follow/api";
import type { Reaction, ReactionType, WallPost } from "@/lib/follow/types";

type CommunityWallProps = {
  posts: WallPost[];
  onRefresh: () => void;
};

const MAX = 140;
const MAX_INDENT = 4;
const EMOJIS: { type: ReactionType; glyph: string }[] = [
  { type: "like", glyph: "👍" },
  { type: "cheer", glyph: "🎉" },
  { type: "fire", glyph: "🔥" },
  { type: "laugh", glyph: "😂" },
  { type: "sad", glyph: "😢" },
  { type: "wave", glyph: "👋" },
];

export default function CommunityWall({ posts, onRefresh }: CommunityWallProps) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const roots = useMemo(() => posts.filter((p) => !p.parent_id), [posts]);
  const byParent = useMemo(() => {
    const map = new Map<string, WallPost[]>();
    for (const p of posts) {
      if (!p.parent_id) continue;
      const list = map.get(p.parent_id) ?? [];
      list.push(p);
      map.set(p.parent_id, list);
    }
    return map;
  }, [posts]);

  useEffect(() => {
    const ids = posts.map((p) => p.id);
    if (ids.length === 0) {
      setReactions([]);
      return;
    }
    void getReactions("wall", ids).then(setReactions).catch(() => setReactions([]));
  }, [posts]);

  const counts = useMemo(() => {
    const map = new Map<string, Record<ReactionType, number>>();
    for (const r of reactions) {
      const row = map.get(r.target_id) ?? { like: 0, cheer: 0, fire: 0, laugh: 0, sad: 0, wave: 0 };
      row[r.reaction_type] += 1;
      map.set(r.target_id, row);
    }
    return map;
  }, [reactions]);

  const mine = useMemo(() => {
    const set = new Set<string>();
    if (!user) return set;
    for (const r of reactions) {
      if (r.user_id === user.id) set.add(`${r.target_id}:${r.reaction_type}`);
    }
    return set;
  }, [reactions, user]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await createWallPost(user.id, body, replyTo);
      setBody("");
      setReplyTo(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post. Wait a minute and try again.");
    } finally {
      setBusy(false);
    }
  };

  const react = async (postId: string, type: ReactionType) => {
    if (!user) return;
    try {
      await toggleReaction(user.id, "wall", postId, type);
      const next = await getReactions("wall", posts.map((p) => p.id));
      setReactions(next);
    } catch {
      setError("Could not save that reaction.");
    }
  };

  const renderThread = (post: WallPost, depth: number): ReactElement => {
    const children = byParent.get(post.id) ?? [];
    const indent = Math.min(depth, MAX_INDENT);
    return (
      <li
        key={post.id}
        className={
          depth === 0
            ? "rounded-md border border-white/60 bg-white/50 px-3 py-2.5"
            : "text-sm"
        }
        style={depth > 0 ? { marginLeft: `${Math.min(indent, 3) * 0.75}rem` } : undefined}
      >
        <p className="text-sm">
          <span className="font-semibold">{post.profiles?.display_name || "Friend"}</span>
          <span className="text-muted-foreground"> — {post.body}</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {EMOJIS.map((emoji) => {
            const count = counts.get(post.id)?.[emoji.type] ?? 0;
            const active = mine.has(`${post.id}:${emoji.type}`);
            return (
              <button
                key={emoji.type}
                type="button"
                className={`rounded-md px-1.5 py-0.5 text-sm ${active ? "bg-secondary" : "bg-white/40"}`}
                onClick={() => void react(post.id, emoji.type)}
                disabled={!user}
              >
                {emoji.glyph}
                {count > 0 ? ` ${count}` : ""}
              </button>
            );
          })}
          {user && (
            <button type="button" className="text-xs font-semibold text-primary" onClick={() => setReplyTo(post.id)}>
              Reply
            </button>
          )}
        </div>
        {children.length > 0 && (
          <ul className="mt-2 space-y-2 border-l border-border/70 pl-3">
            {children.map((child) => renderThread(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">Guestbook</h2>
        <p className="mt-1 text-sm text-muted-foreground">Leave a note, reply, or tap an emoji. Local only.</p>
      </div>

      {user ? (
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-2">
          {replyTo && (
            <p className="text-xs text-muted-foreground">
              Replying to a note.{" "}
              <button type="button" className="font-semibold text-primary" onClick={() => setReplyTo(null)}>
                Cancel
              </button>
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="block min-w-0 flex-1 space-y-1">
              <span className="sr-only">Message</span>
              <input
                className="field-input"
                maxLength={MAX}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={replyTo ? "Write a reply…" : "Safe travels…"}
                required
              />
            </label>
            <button type="submit" className="btn-secondary py-3 text-sm" disabled={busy || !body.trim()}>
              {busy ? "…" : replyTo ? "Reply" : "Sign"}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link to="/Follow/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>{" "}
          to leave a note.
        </p>
      )}

      {roots.length > 0 && (
        <ul className="space-y-3">{roots.slice(0, 16).map((post) => renderThread(post, 0))}</ul>
      )}
    </section>
  );
}
