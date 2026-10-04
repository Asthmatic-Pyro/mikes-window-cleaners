import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import FollowHeader from "@/components/follow/FollowHeader";
import { useAuth } from "@/contexts/AuthContext";

export default function FollowLogin() {
  const { signInWithMagicLink, user, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [notifyOptIn, setNotifyOptIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const { error: err } = await signInWithMagicLink(email, displayName, notifyOptIn);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen">
      <FollowHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          There is no password to create or remember. Enter your email and we send a one-time link.
          Open that email and tap the link. That signs you in.
        </p>

        {!configured && (
          <p className="mt-4 text-sm text-red-600">Supabase env vars are missing. Account signup is unavailable.</p>
        )}

        {user ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm">You&apos;re signed in.</p>
            <Link to="/Follow" className="btn-primary inline-flex text-sm">
              Go to Follow
            </Link>
          </div>
        ) : sent ? (
          <div className="mt-6 rounded-md border border-primary/25 bg-primary/5 px-4 py-4 text-sm">
            Check your inbox for an email titled <strong>Your Follow Mike sign-in link</strong>. Open it and
            tap the link. That signs you in and brings you back to Follow. If you don&apos;t see it, check spam.
          </div>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-3">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Display name</span>
              <input
                className="field-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you want to appear"
                maxLength={40}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Email</span>
              <input
                className="field-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notifyOptIn} onChange={(e) => setNotifyOptIn(e.target.checked)} />
              Email me when Mike posts or moves
            </label>

            <button type="submit" className="btn-primary w-full" disabled={busy || !configured}>
              {busy ? "Working…" : "Email me a sign-in link"}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          <Link to="/Follow" className="text-primary hover:underline">
            Back to Follow
          </Link>
        </p>
      </main>
    </div>
  );
}
