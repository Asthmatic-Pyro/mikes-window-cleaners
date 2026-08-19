import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import { LINKTREE_URL } from "@/lib/links";

export default function FollowShoutSection() {
  return (
    <section className="relative overflow-hidden bg-wash text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 90% -10%, hsl(0 0% 100% / 0.55), transparent 55%)",
        }}
      />
      <div className="section-pad relative mx-auto max-w-6xl">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Follow Mike</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Get your real name on the Geo Metro
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/88">
            Mike&apos;s rolling Cincinnati to Seattle the long way in the little car — live map, weather, road notes.
            Tip any amount and your actual name goes on the Metro. Not a username. Your name. On the car. $100+ takes
            the windshield.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/Follow" className="btn-primary bg-white text-primary hover:bg-white">
              Follow the trip
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href={LINKTREE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline"
            >
              Linktree
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
