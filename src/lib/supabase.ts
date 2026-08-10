import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/follow/types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient<Database> = createClient<Database>(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);
