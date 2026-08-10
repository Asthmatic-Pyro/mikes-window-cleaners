import { Droplets, Eye, Sparkles, Store } from "lucide-react";
import Reveal from "@/components/Reveal";

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
    description: "Amateur washes leave more mess than they remove. Mike finishes with streak-free clarity.",
  },
  {
    icon: Sparkles,
    title: "Need ground-level work done right?",
    description: "No ladders — reach poles from the Metro. Careful on every pane, no shortcuts.",
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
        <Reveal>
          <div className="mb-14 max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Let&apos;s talk about{" "}
              <span className="text-wash">your windows</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Most people wait until the glass looks cloudy. Book a one-time clean when Mike&apos;s in your area —
              Greater Cincinnati and wherever the Metro can park.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {points.map((point, i) => (
            <Reveal key={point.title} delayMs={i * 70}>
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wash text-white shadow-sm shadow-primary/25">
                  <point.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">{point.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{point.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delayMs={120}>
          <div className="mt-14 flex flex-wrap gap-3">
            <button type="button" onClick={onLearnMore} className="btn-secondary">
              Why it matters
            </button>
            <button type="button" onClick={onGetQuote} className="btn-primary">
              Get a Free Quote
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
