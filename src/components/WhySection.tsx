import { Droplets, Eye, Sparkles, Store } from "lucide-react";

const points = [
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

type WhySectionProps = {
  onLearnMore: () => void;
  onGetQuote: () => void;
};

export default function WhySection({ onLearnMore, onGetQuote }: WhySectionProps) {
  return (
    <section id="why" className="section-pad">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Let&apos;s talk about{" "}
            <span className="text-wash">your windows</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Most people put off window washing until everything looks cloudy. If that sounds like you, book a one-time
            clean when Mike&apos;s in your area.
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          {points.map((point) => (
            <button
              key={point.title}
              type="button"
              onClick={onLearnMore}
              className="group flex gap-4 rounded-lg text-left transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-wash text-white transition-transform duration-300 group-hover:scale-105">
                <point.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary">
                  {point.title}
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{point.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <button type="button" onClick={onLearnMore} className="btn-secondary">
            Learn more
          </button>
          <button type="button" onClick={onGetQuote} className="btn-primary">
            Get a Free Quote
          </button>
        </div>
      </div>
    </section>
  );
}
