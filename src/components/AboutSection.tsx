export default function AboutSection() {
  return (
    <section id="about" className="section-pad">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-sm">
          <img
            src="https://images.unsplash.com/photo-1563453397535-ec2328dde213?auto=format&fit=crop&w=1400&q=80"
            alt="Clean exterior windows reflecting bright daylight"
            className="aspect-[4/5] w-full object-cover md:aspect-[5/4] lg:aspect-[4/5]"
            loading="lazy"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, hsl(200 40% 10% / 0.35), transparent 45%)",
            }}
          />
          <p className="absolute bottom-5 left-5 font-display text-2xl font-bold text-white drop-shadow">
            Mike Galioto
          </p>
        </div>

        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            The person behind the{" "}
            <span className="text-wash">squeegee</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Mike&apos;s Window Cleaners is a hands-on local service — not a faceless franchise. When you book, you get careful
            work, clear communication, and windows that look finished when the job is done.
          </p>
          <ul className="mt-8 space-y-4 text-foreground">
            {[
              "Punctual arrival and tidy work areas",
              "Interior & exterior washing in one visit",
              "Fair quotes with no surprise add-ons",
              "Recurring plans for homes and storefronts",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span className="text-base md:text-lg">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
