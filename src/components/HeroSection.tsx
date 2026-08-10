import { Link } from "react-router-dom";
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
          className="h-full w-full scale-[1.02] object-cover object-center"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, hsl(210 42% 5% / 0.78) 0%, hsl(210 35% 8% / 0.52) 48%, hsl(210 30% 12% / 0.28) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-35 animate-shimmer"
          style={{
            backgroundImage:
              "linear-gradient(105deg, transparent 28%, hsl(0 0% 100% / 0.12) 50%, transparent 72%)",
            backgroundSize: "220% 100%",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 md:justify-center md:pb-24 md:pt-20">
        <div className="max-w-2xl text-white">
          <p className="reveal font-display text-[2.65rem] font-extrabold leading-[1.02] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Mike&apos;s Window Cleaners
          </p>
          <h1 className="reveal reveal-delay-1 mt-5 max-w-xl text-xl font-medium leading-snug text-white/92 sm:text-2xl md:text-[1.7rem]">
            One-time storefront cleans — careful work, honest pricing.
          </h1>
          <p className="reveal reveal-delay-2 mt-4 max-w-md text-base text-white/68 sm:text-lg">
            Mike Galioto travels light in a Geo Metro. No ladders. No contracts. Just clear glass.
          </p>
          <div className="reveal reveal-delay-3 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onGetQuote}
              className="btn-primary bg-white text-primary shadow-[0_16px_40px_-12px_rgba(255,255,255,0.45)] hover:bg-white"
            >
              Get a Free Quote
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onSeeServices}
              className="btn-secondary border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/18"
            >
              See Services
            </button>
            <Link
              to="/Follow"
              className="text-sm font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline sm:ml-1"
            >
              Follow the journey
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
