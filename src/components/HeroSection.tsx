import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onGetQuote: () => void;
  onSeeServices: () => void;
}

export default function HeroSection({ onGetQuote, onSeeServices }: HeroSectionProps) {
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/dirty-storefront.jpg"
          alt="Dirty, streaked storefront glass that needs a professional clean"
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, hsl(210 40% 6% / 0.72) 0%, hsl(210 35% 10% / 0.45) 50%, hsl(210 30% 12% / 0.25) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-40 animate-shimmer"
          style={{
            backgroundImage:
              "linear-gradient(105deg, transparent 30%, hsl(0 0% 100% / 0.14) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 md:justify-center md:pb-24 md:pt-20">
        <div className="max-w-2xl text-white">
          <p className="reveal font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Mike&apos;s Window Cleaners
          </p>
          <h1 className="reveal reveal-delay-1 mt-5 max-w-xl text-xl font-medium leading-snug text-white/90 sm:text-2xl md:text-3xl">
            Traveling window cleaner — one-time cleans, careful work, honest pricing.
          </h1>
          <p className="reveal reveal-delay-2 mt-4 max-w-lg text-base text-white/70 sm:text-lg">
            Mike Galioto rolls up in a Geo Metro with the gear packed. Storefronts and commercial glass — no ladders, no
            contracts, just clear glass.
          </p>
          <div className="reveal reveal-delay-3 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={onGetQuote} className="btn-primary bg-white text-primary hover:bg-white">
              Get a Free Quote
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onSeeServices}
              className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              See Services
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
