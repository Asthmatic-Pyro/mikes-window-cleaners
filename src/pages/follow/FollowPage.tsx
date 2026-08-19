import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FollowHeader from "@/components/follow/FollowHeader";
import JourneyMap from "@/components/follow/JourneyMap";
import DestinationsList from "@/components/follow/DestinationsList";
import UpdatesFeed from "@/components/follow/UpdatesFeed";
import CommunityWall from "@/components/follow/CommunityWall";
import SupportSection from "@/components/follow/SupportSection";
import NameOnCar from "@/components/follow/NameOnCar";
import { useAuth } from "@/contexts/AuthContext";
import { useWeather } from "@/contexts/WeatherContext";
import {
  getApprovedNames,
  getDestinations,
  getPublicLocation,
  getPosts,
  getSettings,
  getWallPosts,
} from "@/lib/follow/api";
import type {
  Destination,
  LocationPublic,
  NameClaim,
  Post,
  SiteSettings,
  WallPost,
} from "@/lib/follow/types";

export default function FollowPage() {
  const { configured, user, updateProfile, profile } = useAuth();
  const { weather } = useWeather();
  const [location, setLocation] = useState<LocationPublic | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [wall, setWall] = useState<WallPost[]>([]);
  const [names, setNames] = useState<NameClaim[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    try {
      const [loc, dest, feed, wallPosts, approved, site] = await Promise.all([
        getPublicLocation(),
        getDestinations(),
        getPosts(),
        getWallPosts(),
        getApprovedNames(),
        getSettings(),
      ]);
      setLocation(loc);
      setDestinations(dest);
      setPosts(feed);
      setWall(wallPosts);
      setNames(approved);
      setSettings(site);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Follow.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    void refreshAll();
  }, [configured, refreshAll]);

  useEffect(() => {
    if (!user || !profile) return;
    const flag = user.user_metadata?.notify_opt_in;
    if (flag === "true" && !profile.notify_opt_in) {
      void updateProfile({ notify_opt_in: true });
    }
  }, [user, profile, updateProfile]);

  if (!configured) {
    return (
      <div className="min-h-screen">
        <FollowHeader />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-bold">Follow Mike</h1>
          <p className="mt-3 text-muted-foreground">
            Supabase is not configured yet. Add <code className="text-sm">VITE_SUPABASE_URL</code> and{" "}
            <code className="text-sm">VITE_SUPABASE_ANON_KEY</code>, then run{" "}
            <code className="text-sm">supabase/schema.sql</code>.
          </p>
          <Link to="/" className="btn-secondary mt-6 inline-flex">
            Back home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <FollowHeader />
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-6 md:py-8">
        {/* Primary: journey */}
        <section className="space-y-4">
          <div className="reveal">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Travel map</p>
            <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              Follow Mike
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Cincinnati to Seattle the long way — Great Lakes, Atlantic, Gulf, Southwest, then the Pacific.
            </p>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading journey…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {location && (
            <div className="overflow-hidden rounded-md border border-white/60 bg-white/50 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-white/60 px-4 py-3">
                <div>
                  <p className="text-sm text-muted-foreground">Currently in (shown with a 24-hour delay)</p>
                  <p className="font-display text-2xl font-bold md:text-3xl">{location.city_label}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" /> Here
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#16a34a]" /> Visited
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Upcoming
                  </span>
                </div>
              </div>
              <JourneyMap
                location={location}
                destinations={destinations}
                weather={weather}
                className="h-[min(62vh,480px)] min-h-[300px]"
              />
            </div>
          )}
        </section>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
          <DestinationsList destinations={destinations} />
          <UpdatesFeed posts={posts} />
        </div>

        {/* Secondary: light support + social */}
        <div className="space-y-10 border-t border-border/50 pt-10">
          <SupportSection settings={settings} />
          <NameOnCar names={names} settings={settings} onSubmitted={() => void refreshAll()} />
          <CommunityWall posts={wall} onRefresh={() => void refreshAll()} />

          {user && profile && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={profile.notify_opt_in}
                onChange={(e) => void updateProfile({ notify_opt_in: e.target.checked })}
              />
              Email me when the map moves or there&apos;s a road note
            </label>
          )}
        </div>
      </main>
    </div>
  );
}
