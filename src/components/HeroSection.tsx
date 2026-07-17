import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onGetQuote: () => void;
}

export default function HeroSection({ onGetQuote }: HeroSectionProps) {
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden">
      {/* Full-bleed hero image plane */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2400&q=80"
          alt="Professional cleaning a large window overlooking a bright sky"
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, hsl(200 40% 10% / 0.72) 0%, hsl(192 45% 18% / 0.55) 45%, hsl(174 40% 20% / 0.35) 100%)",
          }}
        />
        {/* Soft light streak motion */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40 animate-shimmer"
          style={{
            backgroundImage:
              "linear-gradient(105deg, transparent 30%, hsl(0 0% 100% / 0.18) 50%, transparent 70%)",
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
            Crystal-clear glass for homes and businesses — careful work, honest pricing, and a view worth seeing.
          </h1>
          <p className="reveal reveal-delay-2 mt-4 max-w-lg text-base text-white/70 sm:text-lg">
            Local window washing done right by Mike Galioto. Inside, outside, screens, and more.
          </p>
          <div className="reveal reveal-delay-3 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={onGetQuote} className="btn-primary bg-white text-primary hover:bg-white">
              Get a Free Quote
              <ArrowRight className="h-5 w-5" />
            </button>
            <a href="#services" className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20">
              See Services
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
