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
              "linear-gradient(105deg, hsl(210 45% 6% / 0.78) 0%, hsl(210 40% 10% / 0.55) 42%, hsl(210 35% 14% / 0.28) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-20 md:py-28">
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          The person behind the <span className="text-wash">squeegee</span>
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-white/75">
          Mike Galioto is a traveling window cleaner — tools packed in a Geo Metro, one job at a time. No franchise, no
          crew van fleet. When he rolls up, you get careful work, clear communication, and windows that look finished
          when the job is done.
        </p>
        <p className="mt-4 font-display text-xl font-semibold text-white">Mike Galioto</p>
        <ul className="mt-8 space-y-4 text-white">
          {[
            "Traveling one-time cleans — wherever the Metro can park",
            "Storefront & commercial glass — no ladders, reach-pole work",
            "Fair quotes with no surprise add-ons",
            "No contracts or recurring plans — just clear glass",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-white" />
              <span className="text-base md:text-lg text-white/90">{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onLearnMore}
            className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20"
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
