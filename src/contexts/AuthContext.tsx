import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/follow/types";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signInWithMagicLink: (email: string, displayName?: string, notifyOptIn?: boolean) => Promise<{ error: string | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, "display_name" | "notify_opt_in">>) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    console.error("Failed to load profile:", error.message);
    return null;
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    const next = await fetchProfile(session.user.id);
    setProfile(next);
  }, [session?.user]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    void fetchProfile(session.user.id).then(setProfile);
  }, [session?.user]);

  const signInWithMagicLink = useCallback(
    async (email: string, displayName?: string, notifyOptIn?: boolean) => {
      if (!isSupabaseConfigured) {
        return { error: "Follow is not configured yet. Add Supabase env vars." };
      }

      try {
        const res = await fetch("/api/magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            displayName: displayName?.trim() || undefined,
            notifyOptIn: Boolean(notifyOptIn),
          }),
        });
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          return { error: body.error || "Could not send magic link." };
        }
        return { error: null };
      } catch {
        return { error: "Could not send magic link. Try again." };
      }
    },
    [],
  );

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Follow is not configured yet." };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<Profile, "display_name" | "notify_opt_in">>) => {
      if (!session?.user) return { error: "Not signed in." };
      const { error } = await supabase.from("profiles").update(patch).eq("id", session.user.id);
      if (!error) await refreshProfile();
      return { error: error?.message ?? null };
    },
    [refreshProfile, session?.user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      configured: isSupabaseConfigured,
      isAdmin: profile?.role === "admin",
      refreshProfile,
      signInWithMagicLink,
      signInWithPassword,
      signOut,
      updateProfile,
    }),
    [session, profile, loading, refreshProfile, signInWithMagicLink, signInWithPassword, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
