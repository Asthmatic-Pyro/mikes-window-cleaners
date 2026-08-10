import { Building2, Shield, SprayCan, Store } from "lucide-react";
import Reveal from "@/components/Reveal";

const services = [
  {
    icon: Store,
    title: "Storefront glass",
    description: "One-time exterior cleans for shop fronts and entry glass — reach-pole work, no ladders.",
  },
  {
    icon: Building2,
    title: "Commercial glass",
    description: "Offices and commercial panes that need a sharp one-time clean — no weekly contracts.",
  },
  {
    icon: SprayCan,
    title: "Screens & tracks",
    description: "The parts most washers skip: screens, sills, and tracks that trap grit and pollen.",
  },
  {
    icon: Shield,
    title: "Hard-water & post-build",
    description: "Spot removal, construction dust cleanup, and care for stubborn mineral deposits.",
  },
];

type ServicesSectionProps = {
  onLearnMore: () => void;
  onGetQuote: () => void;
};

export default function ServicesSection({ onLearnMore, onGetQuote }: ServicesSectionProps) {
  return (
    <section id="services" className="section-pad relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 85% 15%, hsl(210 70% 78% / 0.4), transparent 48%), radial-gradient(ellipse at 8% 85%, hsl(205 55% 72% / 0.28), transparent 42%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-14 max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              How we keep the glass{" "}
              <span className="text-wash">spotless</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              One-time cleans, done carefully and priced fairly — wherever Mike can roll up in the Metro.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <Reveal key={service.title} delayMs={i * 60}>
              <div className="border-t-2 border-primary/35 pt-6">
                <service.icon className="mb-4 h-8 w-8 text-primary" strokeWidth={1.55} />
                <h3 className="font-display text-lg font-semibold text-foreground">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delayMs={100}>
          <div className="mt-16 border-l-[3px] border-primary pl-6 md:pl-8">
            <h3 className="font-display text-2xl font-semibold text-foreground">Why it matters to Mike</h3>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              Clear windows aren&apos;t just cosmetic — they change how a space feels. Mike travels light and works one job
              at a time so businesses get careful glass work without contracts, upsells, or the hard sell.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={onLearnMore} className="btn-secondary">
                What&apos;s included
              </button>
              <button type="button" onClick={onGetQuote} className="btn-primary">
                Request a Quote
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
