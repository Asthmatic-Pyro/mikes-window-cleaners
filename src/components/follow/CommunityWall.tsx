import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createWallPost } from "@/lib/follow/api";
import type { WallPost } from "@/lib/follow/types";

type CommunityWallProps = {
  posts: WallPost[];
  onRefresh: () => void;
};

const MAX = 140;

export default function CommunityWall({ posts, onRefresh }: CommunityWallProps) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await createWallPost(user.id, body);
      setBody("");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post. Wait a minute and try again.");
    } finally {
      setBusy(false);
    }
  };

  const visible = posts.slice(0, 12);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">Guestbook</h2>
        <p className="mt-1 text-sm text-muted-foreground">Leave a short note if you want.</p>
      </div>

      {user ? (
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 space-y-1">
            <span className="sr-only">Message</span>
            <input
              className="field-input"
              maxLength={MAX}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Safe travels…"
              required
            />
          </label>
          <button type="submit" className="btn-secondary py-3 text-sm" disabled={busy || !body.trim()}>
            {busy ? "…" : "Sign"}
          </button>
          {error && <p className="text-sm text-red-600 sm:basis-full">{error}</p>}
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link to="/Follow/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>{" "}
          to leave a note.
        </p>
      )}

      {visible.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {visible.map((post) => (
            <li
              key={post.id}
              className="max-w-full rounded-md border border-white/60 bg-white/50 px-2.5 py-1.5 text-sm"
            >
              <span className="font-semibold">{post.profiles?.display_name || "Friend"}</span>
              <span className="text-muted-foreground"> — {post.body}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
