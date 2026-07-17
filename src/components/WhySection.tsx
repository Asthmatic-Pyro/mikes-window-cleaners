import { Droplets, Eye, Home, Sparkles } from "lucide-react";

const points = [
  {
    icon: Eye,
    title: "Tired of looking through haze?",
    description: "Pollen, hard water, and fingerprints pile up fast — and make every room feel duller.",
  },
  {
    icon: Home,
    title: "Want your place to feel fresher?",
    description: "Clean windows lift the whole home. Light comes in cleaner. Curb appeal jumps overnight.",
  },
  {
    icon: Droplets,
    title: "Worried about streaks and water spots?",
    description: "Amateur washes leave more mess than they remove. We finish with streak-free clarity.",
  },
  {
    icon: Sparkles,
    title: "Need someone you can trust on ladders?",
    description: "Mike treats every pane carefully — no shortcuts, no rushed corners, no surprises.",
  },
];

export default function WhySection() {
  return (
    <section id="why" className="section-pad">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Let&apos;s talk about{" "}
            <span className="text-wash">your windows</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Most people put off window washing until everything looks cloudy. If any of this sounds familiar, we can help.
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          {points.map((point) => (
            <div key={point.title} className="group flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-wash text-white transition-transform duration-300 group-hover:scale-105">
                <point.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">{point.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
