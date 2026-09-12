import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import JourneyMap from "@/components/follow/JourneyMap";
import { LINKTREE_URL } from "@/lib/links";
import { getDestinations, getPosts, getPublicLocation } from "@/lib/follow/api";
import { routeProgress } from "@/lib/follow/matchStop";
import type { Destination, LocationPublic, Post } from "@/lib/follow/types";

function StaticShout() {
  return (
    <Reveal>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Follow Mike</p>
      <h2 className="mt-3 max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
        Get your real name on the Geo Metro
      </h2>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/88">
        Mike&apos;s rolling Cincinnati to Seattle the long way in the little car — live map, weather, road notes.
        Tip any amount and your actual name goes on the Metro. Not a username. Your name. On the car. $100+ takes
        the windshield.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link to="/Follow" className="btn-primary bg-white text-primary hover:bg-white">
          Follow the trip
          <ArrowRight className="h-5 w-5" />
        </Link>
        <a
          href={LINKTREE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline"
        >
          Linktree
        </a>
      </div>
    </Reveal>
  );
}

export default function FollowShoutSection() {
  const [location, setLocation] = useState<LocationPublic | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getPublicLocation(), getDestinations(), getPosts()])
      .then(([loc, dest, feed]) => {
        if (cancelled) return;
        setLocation(loc);
        setDestinations(dest);
        setPosts(feed.slice(0, 2));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const progress = useMemo(() => routeProgress(destinations), [destinations]);
  const showPreview = Boolean(location) && !failed;

  return (
    <section className="relative overflow-hidden bg-wash text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 90% -10%, hsl(0 0% 100% / 0.55), transparent 55%)",
        }}
      />
      <div className="section-pad relative mx-auto max-w-6xl">
        {showPreview && location ? (
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Follow Mike</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <h2 className="max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Right now: {location.city_label}
                </h2>
                <p className="mt-3 text-white/80">
                  {progress.percent}% of the Cincinnati → Seattle loop
                  {progress.current ? ` · now ${progress.current.name}` : ""}
                </p>
                {posts.length > 0 && (
                  <ul className="mt-4 space-y-1 text-sm text-white/75">
                    {posts.map((p) => (
                      <li key={p.id}>Road note: {p.title}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-white/60">
                  Map updated {new Date(location.published_at).toLocaleString()}
                </p>
                <Link to="/Follow" className="btn-primary mt-6 bg-white text-primary hover:bg-white">
                  Open Follow
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
              <div className="overflow-hidden rounded-md border border-white/25 bg-white/10">
                <JourneyMap location={location} destinations={destinations} radar={false} className="h-56 min-h-[200px]" />
              </div>
            </div>
          </Reveal>
        ) : (
          <StaticShout />
        )}
      </div>
    </section>
  );
}
