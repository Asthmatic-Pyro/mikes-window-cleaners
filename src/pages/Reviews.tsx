import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SitePopups, { type PopupId } from "@/components/SitePopups";
import { getPublishedTestimonials } from "@/lib/follow/api";
import type { Testimonial } from "@/lib/follow/types";

const GOOGLE_REVIEW_URL = import.meta.env.VITE_GOOGLE_REVIEW_URL as string | undefined;

type Step = "consent" | "questions" | "draft" | "sent";

export default function ReviewsPage() {
  const [popup, setPopup] = useState<PopupId | null>(null);
  const [published, setPublished] = useState<Testimonial[]>([]);
  const [step, setStep] = useState<Step>("consent");
  const [consent, setConsent] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [cleaned, setCleaned] = useState("");
  const [after, setAfter] = useState("");
  const [again, setAgain] = useState("");
  const [comments, setComments] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getPublishedTestimonials().then(setPublished).catch(() => setPublished([]));
  }, []);

  const draftReview = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/review-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cleaned, after, again, comments }),
      });
      const body = (await res.json()) as { draft?: string; error?: string };
      if (!res.ok || !body.draft) throw new Error(body.error || "Llama could not draft that review.");
      setDraft(body.draft);
      setStep("draft");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Llama drafting failed.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/review-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          city,
          answers: { cleaned, after, again, comments },
          draftText: draft,
          finalText: draft,
          consent: true,
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Could not send that review.");
      setStep("sent");
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
            Honest notes about a storefront clean. Llama can draft from your answers; you edit; Mike approves before it
            goes live.
          </p>
        </div>

        {step === "consent" && (
          <section className="space-y-4 rounded-md border border-white/60 bg-white/55 p-5">
            <p className="text-sm leading-relaxed">
              A Llama language model will turn your answers into a draft review. You can edit or throw it away. Nothing
              posts until you approve, and then Mike approves it too. This is not a fake Google review generator.
            </p>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              I understand a Llama model will draft from my answers, and Mike still has to approve it.
            </label>
            <button type="button" className="btn-primary text-sm" disabled={!consent} onClick={() => setStep("questions")}>
              Continue
            </button>
          </section>
        )}

        {step === "questions" && (
          <form onSubmit={(e) => void draftReview(e)} className="space-y-3 rounded-md border border-white/60 bg-white/55 p-5">
            <input className="field-input" placeholder="First name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <input className="field-input" placeholder="City (optional)" value={city} onChange={(e) => setCity(e.target.value)} />
            <input className="field-input" placeholder="What did Mike clean?" value={cleaned} onChange={(e) => setCleaned(e.target.value)} />
            <input className="field-input" placeholder="How did the glass look after?" value={after} onChange={(e) => setAfter(e.target.value)} />
            <input className="field-input" placeholder="Would you book him again?" value={again} onChange={(e) => setAgain(e.target.value)} />
            <textarea
              className="field-input min-h-[140px]"
              placeholder="Open comments — most important"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="btn-primary text-sm" disabled={busy}>
              {busy ? "Drafting…" : "Draft with Llama"}
            </button>
          </form>
        )}

        {step === "draft" && (
          <form onSubmit={(e) => void submit(e)} className="space-y-3 rounded-md border border-white/60 bg-white/55 p-5">
            <p className="text-sm text-muted-foreground">
              Edit the attitude until it sounds like you. Then send it to Mike.
            </p>
            <textarea className="field-input min-h-[160px]" value={draft} onChange={(e) => setDraft(e.target.value)} required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary text-sm" disabled={busy}>
                {busy ? "Sending…" : "Looks right — send to Mike"}
              </button>
              <button type="button" className="btn-secondary text-sm" onClick={() => setStep("questions")}>
                Back
              </button>
            </div>
          </form>
        )}

        {step === "sent" && (
          <section className="space-y-3 rounded-md border border-white/60 bg-white/55 p-5">
            <p className="font-medium">Thanks. Mike will approve it on Telegram before it appears here.</p>
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
        )}

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold">Published</h2>
          {published.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
          <ul className="space-y-3">
            {published.map((row) => (
              <li key={row.id} className="rounded-md border border-white/60 bg-white/55 p-4">
                <p className="text-sm leading-relaxed">&ldquo;{row.final_text}&rdquo;</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {row.display_name}
                  {row.city ? ` · ${row.city}` : ""} ·{" "}
                  {new Date(row.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer onOpen={setPopup} onGetQuote={() => setPopup("quote")} />
      <SitePopups active={popup} onClose={() => setPopup(null)} onOpenQuote={() => setPopup("quote")} />
    </div>
  );
}
