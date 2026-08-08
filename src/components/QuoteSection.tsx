type QuoteSectionProps = {
  onGetQuote: () => void;
};

export default function QuoteSection({ onGetQuote }: QuoteSectionProps) {
  return (
    <section id="quote" className="section-pad">
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel rounded-xl p-8 text-center shadow-lg shadow-primary/5 md:p-12">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Ready for a{" "}
            <span className="text-wash">clearer view?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Tell Mike where you are and what needs washing. You&apos;ll get a straightforward one-time quote — usually the same day.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button type="button" onClick={onGetQuote} className="btn-primary">
              Request a Quote
            </button>
            <a href="tel:+15136284128" className="font-semibold text-primary hover:underline">
              Or call (513) 628-4128
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
