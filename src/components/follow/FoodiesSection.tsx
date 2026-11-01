import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ExternalLink, MapPin, Sparkles, UtensilsCrossed } from "lucide-react";
import {
  availablePayMethods,
  checkoutUrl,
  formatUsd,
  payMethodLabel,
  type PayMethod,
} from "@/lib/follow/payments";
import { getFoodTips, submitFoodTip } from "@/lib/follow/api";
import type { FoodTip, LocationPublic, SiteSettings } from "@/lib/follow/types";

type FoodiesSectionProps = {
  location: LocationPublic | null;
  settings: SiteSettings | null;
};

const TIP_PRESETS = [5, 12, 25];

export default function FoodiesSection({ location, settings }: FoodiesSectionProps) {
  const methods = useMemo(() => availablePayMethods(settings), [settings]);
  const [tips, setTips] = useState<FoodTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [spotlight, setSpotlight] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("12");
  const [method, setMethod] = useState<PayMethod>(methods[0] ?? "venmo");
  const [withTip, setWithTip] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [payHref, setPayHref] = useState<string | null>(null);

  const city = location?.city_label?.trim() || "";
  const parsed = Number(amount);
  const validAmount = Number.isFinite(parsed) && parsed >= 1;
  const payNote = `Foodies · ${placeName.trim() || "meal tip"} · ${city || "trip"}`;
  const payUrl =
    withTip && validAmount ? checkoutUrl(method, settings, parsed, payNote) : "";

  const refresh = async () => {
    try {
      const rows = await getFoodTips(city || undefined);
      setTips(rows);
      setSpotlight(0);
    } catch {
      setTips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when city changes
  }, [city]);

  useEffect(() => {
    if (tips.length < 2) return;
    const id = window.setInterval(() => {
      setSpotlight((i) => (i + 1) % tips.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [tips.length]);

  useEffect(() => {
    if (methods.length && !methods.includes(method)) {
      setMethod(methods[0]);
    }
  }, [methods, method]);

  const featured = tips[spotlight] ?? tips[0] ?? null;
  const ticker = tips.length ? [...tips, ...tips] : [];

  const openCheckout = (url: string) => {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) setPayHref(url);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!city) {
      setError("Mike’s current stop isn’t on the map yet.");
      return;
    }
    if (withTip && !validAmount) {
      setError("Enter a tip of at least $1, or turn off the tip jar.");
      return;
    }
    if (withTip && !payUrl) {
      setError("That payment option isn’t set up yet.");
      return;
    }

    setBusy(true);
    setError(null);
    setDone(null);
    setPayHref(null);
    try {
      await submitFoodTip({
        displayName: displayName.trim(),
        placeName: placeName.trim(),
        note: note.trim(),
        cityLabel: city,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        tipAmount: withTip && validAmount ? parsed : null,
        payMethod: withTip ? payMethodLabel(method) : "",
      });
      if (withTip && payUrl) openCheckout(payUrl);
      setDone(
        withTip
          ? `Saved “${placeName.trim()}”. Finish ${formatUsd(parsed)} on ${payMethodLabel(method)} so Mike can grab a bite.`
          : `Saved “${placeName.trim()}” for ${city}.`,
      );
      setPlaceName("");
      setNote("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that tip.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="foodies" className="foodies-section relative scroll-mt-24 overflow-hidden rounded-md">
      <div className="foodies-steam pointer-events-none absolute inset-0" aria-hidden />
      <div className="foodies-glow pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full" aria-hidden />
      <div className="foodies-glow foodies-glow-b pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full" aria-hidden />

      <div className="relative z-10 space-y-6 p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              <UtensilsCrossed className="h-4 w-4 foodies-icon-spin" />
              Foodies
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              Feed the route
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Point Mike at a great bite near where he is now
              {city ? (
                <>
                  {" "}
                  — currently <span className="font-semibold text-foreground">{city}</span>
                </>
              ) : null}
              . Leave a place, optionally tip a meal.
            </p>
          </div>

          {city && (
            <div className="foodies-live inline-flex items-center gap-2 rounded-md border border-primary/25 bg-white/70 px-3 py-2 text-sm font-medium shadow-sm">
              <span className="foodies-pulse h-2.5 w-2.5 rounded-full bg-primary" />
              <MapPin className="h-4 w-4 text-primary" />
              Live near {city}
            </div>
          )}
        </div>

        {ticker.length > 0 && (
          <div className="foodies-marquee overflow-hidden rounded-md border border-white/50 bg-white/35 py-2.5">
            <div className="foodies-marquee-track flex w-max gap-8 px-4 text-sm">
              {ticker.map((tip, i) => (
                <span key={`${tip.id}-${i}`} className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap">
                  <Sparkles className="h-3.5 w-3.5 text-primary/80" />
                  <strong className="font-semibold">{tip.place_name}</strong>
                  <span className="text-muted-foreground">· {tip.display_name}</span>
                  {tip.city_label ? <span className="text-muted-foreground/80">· {tip.city_label}</span> : null}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-4">
            {loading && <p className="text-sm text-muted-foreground">Loading nearby picks…</p>}
            {!loading && !featured && (
              <div className="rounded-md border border-dashed border-primary/30 bg-white/45 px-4 py-8 text-center">
                <p className="font-display text-xl font-bold">First plate is yours</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No suggestions for {city || "this stop"} yet. Drop a local favorite.
                </p>
              </div>
            )}

            {featured && (
              <article
                key={featured.id}
                className="foodies-feature relative overflow-hidden rounded-md border border-white/60 bg-white/65 p-5 shadow-sm"
              >
                <div className="foodies-feature-shine pointer-events-none absolute inset-0" aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Passing the plate</p>
                <h3 className="mt-2 font-display text-2xl font-bold md:text-3xl">{featured.place_name}</h3>
                {featured.note ? (
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">“{featured.note}”</p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No note — just a strong local pick.</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{featured.display_name}</span>
                  <span>· {featured.city_label}</span>
                  {featured.tip_amount != null && Number(featured.tip_amount) > 0 && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                      tipped {formatUsd(Number(featured.tip_amount))}
                    </span>
                  )}
                </div>
                {tips.length > 1 && (
                  <div className="mt-4 flex gap-1.5">
                    {tips.slice(0, 8).map((tip, i) => (
                      <button
                        key={tip.id}
                        type="button"
                        aria-label={`Show tip ${i + 1}`}
                        onClick={() => setSpotlight(i)}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i === spotlight ? "bg-primary" : "bg-primary/20"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </article>
            )}

            {tips.length > 1 && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {tips
                  .filter((t) => t.id !== featured?.id)
                  .slice(0, 4)
                  .map((tip, i) => (
                    <li
                      key={tip.id}
                      className="foodies-card rounded-md border border-white/55 bg-white/50 px-3 py-3"
                      style={{ animationDelay: `${0.08 * (i + 1)}s` }}
                    >
                      <p className="font-semibold leading-snug">{tip.place_name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {tip.display_name}
                        {tip.note ? ` · ${tip.note.slice(0, 60)}${tip.note.length > 60 ? "…" : ""}` : ""}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <form
            onSubmit={(e) => void onSubmit(e)}
            className="space-y-3 rounded-md border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-sm"
          >
            <div>
              <h3 className="font-display text-xl font-bold">Suggest a spot</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Saved against {city || "Mike’s current city"} on the map.
              </p>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Your name</span>
              <input
                className="field-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                required
                placeholder="Alex"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Place near {city || "Mike"}</span>
              <input
                className="field-input"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                maxLength={80}
                required
                placeholder="Hattie B’s Hot Chicken"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Why / what to order</span>
              <textarea
                className="field-input min-h-[72px] resize-y"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                placeholder="Get the hot chicken plate. Worth the wait."
              />
            </label>

            <div className="rounded-md border border-primary/15 bg-primary/[0.04] p-3 space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={withTip}
                  onChange={(e) => setWithTip(e.target.checked)}
                />
                Tip a meal for Mike
              </label>

              {withTip && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {TIP_PRESETS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                          Number(amount) === n
                            ? "bg-primary text-primary-foreground"
                            : "bg-white/80 text-foreground hover:bg-white"
                        }`}
                        onClick={() => setAmount(String(n))}
                      >
                        {formatUsd(n)}
                      </button>
                    ))}
                    <input
                      className="field-input w-24 py-1.5"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      aria-label="Custom tip amount"
                    />
                  </div>

                  {methods.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {methods.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                            method === m
                              ? "bg-foreground text-background"
                              : "bg-white/80 text-muted-foreground"
                          }`}
                          onClick={() => setMethod(m)}
                        >
                          {payMethodLabel(m)}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {done && <p className="text-sm text-primary">{done}</p>}
            {payHref && (
              <a
                href={payHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline"
              >
                Open tip checkout <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy || !city}>
              {busy ? "Sending…" : withTip ? "Send tip & suggestion" : "Send suggestion"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
