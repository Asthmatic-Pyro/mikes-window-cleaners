import { Building2, Check, MapPin, Phone, X } from "lucide-react";
import Modal from "@/components/Modal";
import QuoteForm from "@/components/QuoteForm";

export type PopupId = "why" | "services" | "about" | "quote";

type SitePopupsProps = {
  active: PopupId | null;
  onClose: () => void;
  onOpenQuote: () => void;
};

export default function SitePopups({ active, onClose, onOpenQuote }: SitePopupsProps) {
  return (
    <>
      <Modal open={active === "why"} title="When cloudy glass starts costing you" onClose={onClose} wide>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>
            Dirty storefront glass doesn&apos;t just look neglected — it softens first impressions, dulls interior light,
            and makes a sharp business feel tired from the sidewalk. Most owners wait until the haze is obvious. By then,
            everyone walking by has already noticed.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Book when it looks dull",
                body: "Pollen, road film, and fingerprints stack fast in spring and after storms.",
              },
              {
                title: "Book before an open house or event",
                body: "Clear glass makes the whole front read cleaner without a remodel.",
              },
              {
                title: "Book as a one-time reset",
                body: "No contract needed — get clarity now, decide later if you want another visit.",
              },
            ].map((item) => (
              <div key={item.title} className="border-t-2 border-primary/35 pt-4">
                <h3 className="font-display font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="rounded-lg bg-secondary/70 px-4 py-3 text-sm text-foreground">
            Mike works ground-level with reach poles — no ladders — so storefront and commercial panes get a careful
            one-time clean without the hard sell.
          </p>
        </div>
        <button type="button" onClick={onOpenQuote} className="btn-primary mt-8">
          Get a Free Quote
        </button>
      </Modal>

      <Modal open={active === "services"} title="What's included — and what isn't" onClose={onClose} wide>
        <div className="space-y-7">
          <p className="text-muted-foreground leading-relaxed">
            Every job is a one-time clean priced for the work in front of him. Tell Mike where you are, what kind of
            glass, and roughly how many panes — you usually hear back the same day.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <Check className="h-5 w-5 text-primary" />
                Included
              </h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {[
                  "Exterior storefront & commercial glass",
                  "Reach-pole work from the ground — no ladders",
                  "Screens, sills, and tracks when requested",
                  "Hard-water spot attention and post-build dust cleanup",
                  "Straightforward quote with no surprise add-ons",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <X className="h-5 w-5 text-muted-foreground" />
                Not on the menu
              </h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {[
                  "Ladder work or multi-story climbs",
                  "Weekly contracts or recurring plans",
                  "Franchise crews or upsell packages",
                  "Jobs where the Metro can’t safely park and reach",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex gap-3 rounded-lg border border-border/80 bg-secondary/50 px-4 py-3.5">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">How quoting works: </span>
              Share the address area, glass type, and access notes. Mike sizes the job, gives a fair one-time number, and
              schedules when he&apos;s in your area.
            </p>
          </div>
        </div>
        <button type="button" onClick={onOpenQuote} className="btn-primary mt-8">
          Request a Quote
        </button>
      </Modal>

      <Modal open={active === "about"} title="Mike, the Metro, and the work" onClose={onClose}>
        <div className="space-y-5 text-muted-foreground leading-relaxed">
          <p>
            Mike Galioto built this around traveling light. Tools ride in a Geo Metro. One job at a time. No franchise
            script, no crew van fleet — just careful work and clear communication when he rolls up.
          </p>
          <p>
            He focuses on storefront and commercial glass he can reach from the ground. That keeps the work precise, the
            setup honest, and the quote tied to what actually gets cleaned.
          </p>
          <div className="space-y-3 rounded-lg bg-secondary/60 px-4 py-4 text-sm text-foreground">
            <p className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Traveling cleans — wherever the Metro can park and work safely (Greater Cincinnati / 513 area).</span>
            </p>
            <p className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Prefer voice? Call{" "}
                <a href="tel:+15136284128" className="font-semibold text-primary hover:underline">
                  (513) 628-4128
                </a>
              </span>
            </p>
          </div>
        </div>
        <button type="button" onClick={onOpenQuote} className="btn-primary mt-8">
          Book with Mike
        </button>
      </Modal>

      <Modal open={active === "quote"} title="Request a free quote" onClose={onClose}>
        <p className="mb-5 text-muted-foreground">
          Tell Mike where you are and what needs washing. You&apos;ll get a straightforward one-time quote — usually the
          same day.
        </p>
        <QuoteForm idPrefix="popup-quote" />
      </Modal>
    </>
  );
}
