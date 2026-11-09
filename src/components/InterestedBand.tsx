import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function InterestedBand({ embedded = false }: { embedded?: boolean }) {
  const card = (
    <div className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-primary/15 bg-white/75 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <img
          src="/images/mike-galioto.png"
          alt="Mike Galioto"
          className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-md shadow-primary/20"
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Interested in Mike??</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-foreground">
            I&apos;m only an idea right now. Build the company with me.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Two seasons, two houses, kids, and a mom. It will not be easy. About 3 minutes. It comes to my phone.
          </p>
        </div>
      </div>
      <Link to="/interested" className="btn-primary w-full sm:w-auto">
        Apply
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );

  if (embedded) return card;

  return (
    <section id="top" className="border-b border-primary/10 px-4 pb-8 pt-28">
      <div className="mx-auto max-w-6xl">{card}</div>
    </section>
  );
}
