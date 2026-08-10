import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      // Supports both PKCE (?code=) and hash tokens from email links
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) setError(exchangeError.message);
          return;
        }
      } else {
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (!cancelled) setError(sessionError.message);
          return;
        }
      }

      if (!cancelled) navigate("/Follow", { replace: true });
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Sign-in failed</h1>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Link to="/Follow/login" className="btn-primary mt-6 inline-flex text-sm">
          Try again
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-muted-foreground">Signing you in…</p>
    </main>
  );
}
