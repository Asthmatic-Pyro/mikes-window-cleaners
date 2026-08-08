import { Building2, Shield, SprayCan, Store } from "lucide-react";

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

type ServicesSectionProps = {
  onLearnMore: () => void;
  onGetQuote: () => void;
};

export default function ServicesSection({ onLearnMore, onGetQuote }: ServicesSectionProps) {
  return (
    <section id="services" className="section-pad relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, hsl(210 70% 80% / 0.35), transparent 50%), radial-gradient(ellipse at 10% 80%, hsl(210 55% 75% / 0.25), transparent 45%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-14 max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            How we keep the glass{" "}
            <span className="text-wash">spotless</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One-time cleans, done carefully and priced fairly — wherever Mike can roll up in the Metro.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <button
              key={service.title}
              type="button"
              onClick={onLearnMore}
              className="border-t-2 border-primary/30 pt-6 text-left transition-transform duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <service.icon className="mb-4 h-8 w-8 text-primary" strokeWidth={1.6} />
              <h3 className="font-display text-lg font-semibold text-foreground">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-16 border-l-4 border-primary pl-6 md:pl-8">
          <h3 className="font-display text-2xl font-semibold text-foreground">Why it matters to Mike</h3>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Clear windows aren&apos;t just cosmetic — they change how a space feels. Mike travels light and works one job at a
            time so businesses get careful storefront and commercial glass work without contracts, upsells, or the hard sell.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={onLearnMore} className="btn-secondary">
              See all services
            </button>
            <button type="button" onClick={onGetQuote} className="btn-primary">
              Request a Quote
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
