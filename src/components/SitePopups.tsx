import { Building2, Droplets, Eye, Shield, Sparkles, SprayCan, Store } from "lucide-react";
import Modal from "@/components/Modal";
import QuoteForm from "@/components/QuoteForm";

export type PopupId = "why" | "services" | "about" | "quote";

type SitePopupsProps = {
  active: PopupId | null;
  onClose: () => void;
  onOpenQuote: () => void;
};

const whyPoints = [
  {
    icon: Eye,
    title: "Tired of looking through haze?",
    description: "Pollen, hard water, and fingerprints pile up fast — and make every storefront feel duller.",
  },
  {
    icon: Store,
    title: "Want your place to look sharper?",
    description: "Clean glass lifts the whole storefront. Light comes in cleaner. First impressions jump overnight.",
  },
  {
    icon: Droplets,
    title: "Worried about streaks and water spots?",
    description: "Amateur washes leave more mess than they remove. We finish with streak-free clarity.",
  },
  {
    icon: Sparkles,
    title: "Need ground-level work done right?",
    description: "No ladders — Mike works with reach poles from the Metro. Careful on every pane, no shortcuts.",
  },
];

const services = [
  {
    icon: Store,
    title: "Storefront glass",
    description: "One-time exterior cleans for shop fronts and entry glass — reach-pole work, no ladders.",
  },
  {
    icon: Building2,
    title: "Commercial glass",
    description: "Offices and commercial panes that need a sharp one-time clean — no weekly contracts, just a clearer look.",
  },
  {
    icon: SprayCan,
    title: "Screens & tracks",
    description: "The parts most washers skip: screens, sills, and tracks that trap grit and pollen.",
  },
  {
    icon: Shield,
    title: "Hard-water & post-build",
    description: "Spot removal, construction dust cleanup, and special care for stubborn mineral deposits.",
  },
];

export default function SitePopups({ active, onClose, onOpenQuote }: SitePopupsProps) {
  return (
    <>
      <Modal open={active === "why"} title="Why clean your windows?" onClose={onClose} wide>
        <p className="mb-6 text-muted-foreground">
          Most people put off window washing until everything looks cloudy. If that sounds like you, book a one-time
          clean when Mike&apos;s in your area.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          {whyPoints.map((point) => (
            <div key={point.title} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wash text-white">
                <point.icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">{point.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={onOpenQuote} className="btn-primary mt-8">
          Get a Free Quote
        </button>
      </Modal>

      <Modal open={active === "services"} title="How we keep glass spotless" onClose={onClose} wide>
        <p className="mb-6 text-muted-foreground">
          One-time cleans, done carefully and priced fairly — wherever Mike can roll up in the Metro.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          {services.map((service) => (
            <article key={service.title} className="border-t-2 border-primary/30 pt-4">
              <service.icon className="mb-3 h-7 w-7 text-primary" strokeWidth={1.6} />
              <h3 className="font-display font-semibold text-foreground">{service.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
            </article>
          ))}
        </div>
        <button type="button" onClick={onOpenQuote} className="btn-primary mt-8">
          Request a Quote
        </button>
      </Modal>

      <Modal open={active === "about"} title="About Mike Galioto" onClose={onClose}>
        <p className="text-muted-foreground leading-relaxed">
          Mike Galioto is a traveling window cleaner — tools packed in a Geo Metro, one job at a time. No franchise, no
          crew van fleet. When he rolls up, you get careful work, clear communication, and windows that look finished
          when the job is done.
        </p>
        <ul className="mt-6 space-y-3 text-foreground">
          {[
            "Traveling one-time cleans — wherever the Metro can park",
            "Storefront & commercial glass — no ladders, reach-pole work",
            "Fair quotes with no surprise add-ons",
            "No contracts or recurring plans — just clear glass",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
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
