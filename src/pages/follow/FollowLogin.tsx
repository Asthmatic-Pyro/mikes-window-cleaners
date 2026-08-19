import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import FollowHeader from "@/components/follow/FollowHeader";
import { useAuth } from "@/contexts/AuthContext";

export default function FollowLogin() {
  const { signInWithMagicLink, signInWithPassword, user, configured } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [notifyOptIn, setNotifyOptIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (mode === "password") {
      const { error: err } = await signInWithPassword(email, password);
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      navigate("/Follow", { replace: true });
      return;
    }

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
          Magic link emailed through our mail provider — or use a password if you have one.
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
            Check your inbox (and spam) for <strong>Your Follow Mike sign-in link</strong>. After you click it,
            you&apos;ll land back on Follow.
          </div>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-3">
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 ${mode === "magic" ? "bg-primary text-white" : "bg-white/70"}`}
                onClick={() => setMode("magic")}
              >
                Magic link
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 ${mode === "password" ? "bg-primary text-white" : "bg-white/70"}`}
                onClick={() => setMode("password")}
              >
                Password
              </button>
            </div>

            {mode === "magic" && (
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
            )}

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

            {mode === "password" ? (
              <label className="block space-y-1">
                <span className="text-sm font-medium">Password</span>
                <input
                  className="field-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            ) : (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notifyOptIn} onChange={(e) => setNotifyOptIn(e.target.checked)} />
                Email me when Mike posts or moves
              </label>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy || !configured}>
              {busy ? "Working…" : mode === "password" ? "Sign in" : "Email me a magic link"}
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
