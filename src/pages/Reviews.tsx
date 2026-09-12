import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SitePopups, { type PopupId } from "@/components/SitePopups";
import StarRating from "@/components/StarRating";
import { getPublishedTestimonials } from "@/lib/follow/api";
import { testimonialRating } from "@/lib/follow/rating";
import type { Testimonial } from "@/lib/follow/types";

const GOOGLE_REVIEW_URL = import.meta.env.VITE_GOOGLE_REVIEW_URL as string | undefined;
const MIN_REVIEW_LENGTH = 20;

export default function ReviewsPage() {
  const [popup, setPopup] = useState<PopupId | null>(null);
  const [published, setPublished] = useState<Testimonial[]>([]);
  const [sent, setSent] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getPublishedTestimonials().then(setPublished).catch(() => setPublished([]));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("Pick a star rating.");
      return;
    }
    if (review.trim().length < MIN_REVIEW_LENGTH) {
      setError(`Write a little more — at least ${MIN_REVIEW_LENGTH} characters.`);
      return;
    }
    if (!consent) {
      setError("Check the box so Mike knows you want this on the site after he reads it.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/review-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          city,
          rating,
          finalText: review,
          consent: true,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Could not send that review.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that review.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <Header onOpen={setPopup} onGetQuote={() => setPopup("quote")} />
      <main className="mx-auto max-w-3xl space-y-10 px-4 pb-16 pt-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Review me</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Testimonials</h1>
          <p className="mt-2 text-muted-foreground">
            Stars and a few honest words about a storefront clean. Mike reads it before it appears here.
          </p>
        </div>

        {sent ? (
          <section className="space-y-3 rounded-md border border-white/60 bg-white/55 p-5">
            <CheckCircle2 className="h-11 w-11 text-primary" />
            <p className="font-medium">Thanks. Mike will approve it before it appears here.</p>
            {GOOGLE_REVIEW_URL && (
              <p className="text-sm text-muted-foreground">
                Want this on Google too?{" "}
                <a href={GOOGLE_REVIEW_URL} className="font-semibold text-primary underline" target="_blank" rel="noreferrer">
                  Copy your words there
                </a>
                .
              </p>
            )}
            <Link to="/" className="btn-secondary inline-flex text-sm">
              Home
            </Link>
          </section>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="space-y-4 rounded-md border border-white/60 bg-white/55 p-5">
            <div>
              <label htmlFor="review-name" className="mb-1.5 block text-sm font-medium">
                First name
              </label>
              <input
                id="review-name"
                className="field-input"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="given-name"
                required
              />
            </div>
            <div>
              <label htmlFor="review-city" className="mb-1.5 block text-sm font-medium">
                City <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="review-city"
                className="field-input"
                placeholder="Cincinnati"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
              />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">Rating</p>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <label htmlFor="review-text" className="mb-1.5 block text-sm font-medium">
                Your review
              </label>
              <textarea
                id="review-text"
                className="field-input min-h-[160px] resize-y"
                placeholder="How did the glass look? Would you book him again?"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                required
                minLength={MIN_REVIEW_LENGTH}
              />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I understand this will not show on the site until Mike approves it.
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary text-sm disabled:opacity-60" disabled={busy}>
              {busy ? "Sending…" : "Send review"}
            </button>
          </form>
        )}

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold">Published</h2>
          {published.length === 0 && <p className="text-sm text-muted-foreground">None yet. Be the first.</p>}
          <ul className="space-y-3">
            {published.map((row) => {
              const stars = testimonialRating(row.answers);
              return (
                <li key={row.id} className="rounded-md border border-white/60 bg-white/55 p-4">
                  {stars ? <StarRating value={stars} readOnly size="sm" /> : null}
                  <p className={`text-sm leading-relaxed ${stars ? "mt-2" : ""}`}>&ldquo;{row.final_text}&rdquo;</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {row.display_name}
                    {row.city ? ` · ${row.city}` : ""} ·{" "}
                    {new Date(row.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <Footer onOpen={setPopup} onGetQuote={() => setPopup("quote")} />
      <SitePopups active={popup} onClose={() => setPopup(null)} onOpenQuote={() => setPopup("quote")} />
    </div>
  );
}
