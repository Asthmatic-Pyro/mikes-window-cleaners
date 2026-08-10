import QuoteForm from "@/components/QuoteForm";
import Reveal from "@/components/Reveal";

export default function QuoteSection() {
  return (
    <section id="quote" className="section-pad relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, hsl(210 80% 70% / 0.22), transparent 45%), radial-gradient(ellipse at 90% 80%, hsl(205 70% 65% / 0.18), transparent 40%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <Reveal>
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Ready for a{" "}
                <span className="text-wash">clearer view?</span>
              </h2>
              <p className="mt-4 max-w-md text-lg text-muted-foreground">
                Tell Mike where you are and what needs washing. Straightforward one-time quotes — usually the same day.
              </p>
              <a
                href="tel:+15136284128"
                className="mt-8 inline-flex text-lg font-semibold text-primary transition-colors hover:underline"
              >
                Or call (513) 628-4128
              </a>
            </div>
          </Reveal>

          <Reveal delayMs={80}>
            <div className="rounded-xl border border-white/70 bg-white/70 p-6 shadow-[0_24px_60px_-28px_hsl(210_60%_40%/0.35)] backdrop-blur-md sm:p-8">
              <QuoteForm idPrefix="page-quote" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
