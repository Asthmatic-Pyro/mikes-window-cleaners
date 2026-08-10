type AboutSectionProps = {
  onLearnMore: () => void;
  onGetQuote: () => void;
};

export default function AboutSection({ onLearnMore, onGetQuote }: AboutSectionProps) {
  return (
    <section id="about" className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/mike-galioto.png"
          alt="Mike Galioto with window cleaning gear"
          className="h-full w-full object-cover object-[center_18%] md:object-[42%_18%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, hsl(210 45% 5% / 0.82) 0%, hsl(210 40% 8% / 0.58) 42%, hsl(210 35% 12% / 0.3) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-[5.5rem] md:py-28">
        <p className="reveal text-sm font-semibold uppercase tracking-[0.18em] text-white/55">About</p>
        <h2 className="reveal reveal-delay-1 mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          The person behind the <span className="text-wash">squeegee</span>
        </h2>
        <p className="reveal reveal-delay-2 mt-5 text-lg leading-relaxed text-white/75">
          Mike Galioto is a traveling window cleaner — tools packed in a Geo Metro, one job at a time. When he rolls up,
          you get careful work, clear communication, and windows that look finished when the job is done.
        </p>
        <p className="reveal reveal-delay-2 mt-5 font-display text-xl font-semibold text-white">Mike Galioto</p>
        <ul className="reveal reveal-delay-3 mt-8 space-y-3.5 text-white">
          {[
            "Traveling one-time cleans — wherever the Metro can park",
            "Storefront & commercial glass — no ladders, reach-pole work",
            "Fair quotes with no surprise add-ons",
            "No contracts — just clear glass",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
              <span className="text-base text-white/88 md:text-lg">{item}</span>
            </li>
          ))}
        </ul>
        <div className="reveal reveal-delay-3 mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onLearnMore}
            className="btn-secondary border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/18"
          >
            More about Mike
          </button>
          <button type="button" onClick={onGetQuote} className="btn-primary bg-white text-primary hover:bg-white">
            Book with Mike
          </button>
        </div>
      </div>
    </section>
  );
}
