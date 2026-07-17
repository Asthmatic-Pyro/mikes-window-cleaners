import { Building2, Home, Shield, SprayCan } from "lucide-react";

const services = [
  {
    icon: Home,
    title: "Residential windows",
    description: "Interior and exterior washing for houses, townhomes, and apartments — screens included when needed.",
  },
  {
    icon: Building2,
    title: "Commercial glass",
    description: "Storefronts, offices, and multi-pane buildings that need a sharp, professional look every week or month.",
  },
  {
    icon: SprayCan,
    title: "Screens & tracks",
    description: "We clean the parts most washers skip: screens, sills, and tracks that trap grit and pollen.",
  },
  {
    icon: Shield,
    title: "Hard-water & post-build",
    description: "Spot removal, construction dust cleanup, and special care for stubborn mineral deposits.",
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="section-pad relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, hsl(192 70% 80% / 0.35), transparent 50%), radial-gradient(ellipse at 10% 80%, hsl(174 50% 75% / 0.25), transparent 45%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-14 max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            How we keep the glass{" "}
            <span className="text-wash">spotless</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One focused service lineup — done carefully, priced fairly, scheduled around your life.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <article
              key={service.title}
              className="border-t-2 border-primary/30 pt-6 transition-transform duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <service.icon className="mb-4 h-8 w-8 text-primary" strokeWidth={1.6} />
              <h3 className="font-display text-lg font-semibold text-foreground">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 border-l-4 border-accent pl-6 md:pl-8">
          <h3 className="font-display text-2xl font-semibold text-foreground">Why it matters to Mike</h3>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Clear windows aren&apos;t just cosmetic — they change how a space feels. Mike&apos;s Window Cleaners exists to make that
            feel effortless for homeowners and local businesses who want reliable, careful work without the hard sell.
          </p>
        </div>
      </div>
    </section>
  );
}
