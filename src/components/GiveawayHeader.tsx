import { useEffect, useMemo, useState } from "react";
import { Gift, MapPin } from "lucide-react";
import Reveal from "@/components/Reveal";
import TripUpdatesForm from "@/components/TripUpdatesForm";
import { getApprovedNames, getSettings } from "@/lib/follow/api";
import type { NameClaim, SiteSettings } from "@/lib/follow/types";

function formatEndDate(raw: string | null | undefined) {
  if (!raw) return "December 31, 2026";
  const d = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function GiveawayHeader() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [photos, setPhotos] = useState<NameClaim[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getSettings(), getApprovedNames()])
      .then(([s, claims]) => {
        if (cancelled) return;
        setSettings(s);
        setPhotos(claims.filter((c) => Boolean(c.image_url)).slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) {
          setSettings(null);
          setPhotos([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ends = useMemo(() => formatEndDate(settings?.giveaway_ends_at), [settings?.giveaway_ends_at]);
  const drawn = Boolean(settings?.giveaway_drawn_at || settings?.giveaway_winner_name);

  return (
    <section id="top" className="relative overflow-hidden border-b border-primary/15">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/18 via-background to-secondary/80" />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-28 md:grid-cols-[1.15fr_0.85fr] md:items-center md:pb-16 md:pt-32">
        <Reveal>
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            <Gift className="h-4 w-4" />
            Name on the Metro giveaway
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Win your name on the Metro — and a shirt
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            One winner gets their real name on the hatch window plus a shirt with that name on the windshield graphic.
            Enter by confirming trip updates below, or tip any amount for a name-on-car claim on Follow. Drawing closes{" "}
            {ends}. One entry per email.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-foreground/85">
            <li className="flex gap-2">
              <Gift className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Prize: name on the hatch + shirt with the windshield name art.
            </li>
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Confirm your email for where-I-am and when-I-move place emails.
            </li>
            <li className="flex gap-2">
              <Gift className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Or tip on Follow — an approved name claim also counts as one entry.
            </li>
          </ul>
          {drawn && settings?.giveaway_winner_name && (
            <p className="mt-4 rounded-md border border-primary/25 bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
              Winner drawn: {settings.giveaway_winner_name}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <img
              src="/images/mike-galioto.png"
              alt="Mike Galioto"
              className="h-20 w-20 rounded-full border-2 border-white object-cover shadow-md shadow-primary/25"
            />
            {photos.map((claim) => (
              <img
                key={claim.id}
                src={claim.image_url || ""}
                alt={`${claim.display_name} on the Metro`}
                className="h-20 w-20 rounded-md border border-white/80 object-cover shadow-sm"
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Ends {ends} · Photos from Mike and approved name claims</p>
        </Reveal>

        <Reveal>
          <div className="glass-panel rounded-xl border border-white/70 p-5 shadow-lg shadow-primary/10 sm:p-6">
            <h2 className="font-display text-xl font-bold text-foreground">Sign up for trip updates</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Where Mike is, when he moves, and a look at each stop. Confirms your giveaway entry.
            </p>
            <div className="mt-4">
              <TripUpdatesForm idPrefix="giveaway-trip" compact />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
