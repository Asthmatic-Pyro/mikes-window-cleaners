import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { shrinkPhoto } from "@/content/interested/photo";
import {
  EMPTY_ANSWERS,
  MEETS,
  SLIDES,
  TONES,
  applicationScore,
  contactKind,
  easternDateString,
  meetLabel,
  toneLabel,
  yearsOld,
  type Answers,
} from "@/content/interested/profile";

type Phase =
  | { name: "intro" }
  | { name: "slide"; index: number }
  | { name: "ask"; index: number }
  | { name: "fit" }
  | { name: "young" }
  | { name: "done"; reference: string; photoAttached: boolean };

const ASK_COUNT = 6;

function dots(count: number, active: number) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-primary" : "w-1.5 bg-primary/25"}`}
        />
      ))}
    </div>
  );
}

export default function InterestedPage() {
  const [phase, setPhase] = useState<Phase>({ name: "intro" });
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sending = useRef(false);

  const phaseKey =
    phase.name === "slide" || phase.name === "ask"
      ? `${phase.name}-${phase.index}`
      : phase.name === "done"
        ? "done"
        : phase.name;

  useEffect(() => {
    headingRef.current?.focus();
  }, [phaseKey]);

  useEffect(() => {
    const previous = document.title;
    document.title = "Apply to meet Mike";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    return () => {
      document.title = previous;
      robots.remove();
    };
  }, []);

  const patch = (partial: Partial<Answers>) => {
    setAnswers((prev) => ({ ...prev, ...partial }));
    setError(null);
  };

  const goAsk = (index: number) => {
    setError(null);
    setPhase({ name: "ask", index });
  };

  const afterBirthday = () => {
    const age = yearsOld(answers.dob);
    if (!answers.name.trim()) {
      setError("Add your first name.");
      return;
    }
    if (age === null) {
      setError("Add your birthday.");
      return;
    }
    if (age < 21) {
      setError(null);
      setPhase({ name: "young" });
      return;
    }
    if (age > 110) {
      setError("Check that birthday.");
      return;
    }
    goAsk(1);
  };

  const afterCity = () => {
    if (answers.city.trim().length < 2) {
      setError("Add the city you are in.");
      return;
    }
    goAsk(2);
  };

  const afterJob = () => {
    if (answers.job.trim().length < 2) {
      setError("Add what you do.");
      return;
    }
    goAsk(3);
  };

  const afterMeet = () => {
    if (!answers.tone) {
      setError("Pick platonic or romantic.");
      return;
    }
    if (!answers.meet) {
      setError("Pick a meetup or a date.");
      return;
    }
    goAsk(4);
  };

  const afterWhy = () => {
    if (answers.why.trim().length < 20) {
      setError("Write a little more. A few honest sentences is enough.");
      return;
    }
    goAsk(5);
  };

  const afterContact = () => {
    if (!contactKind(answers.contact)) {
      setError("Use a phone number, an email, or a Telegram @name.");
      return;
    }
    setError(null);
    setPhase({ name: "fit" });
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a photo.");
      return;
    }
    try {
      const dataUrl = await shrinkPhoto(file);
      if (dataUrl.length > 1_400_000) {
        setError("That photo is still too big. Try another.");
        return;
      }
      patch({ photo: dataUrl });
    } catch {
      setError("That photo could not be read. Try another.");
    }
  };

  const send = async () => {
    if (sending.current) return;
    if (!answers.consent) {
      setError("Check the box so I know you want me to read this.");
      return;
    }
    sending.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/quote?form=interested", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const body = (await res.json().catch(() => ({}))) as {
        reference?: string;
        error?: string;
        photoAttached?: boolean;
      };
      if (res.status === 413) {
        setError("That photo is too big. Remove it, or try a smaller one.");
        return;
      }
      if (!res.ok || !body.reference) {
        setError(body.error || "That could not be sent. Try once more.");
        return;
      }
      setPhase({
        name: "done",
        reference: body.reference,
        photoAttached: body.photoAttached !== false,
      });
    } catch {
      setError("That could not be sent. Try once more.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  const retryPhoto = async () => {
    if (sending.current || phase.name !== "done" || !answers.photo) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/quote?form=interested", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retryPhoto: true, reference: phase.reference, photo: answers.photo }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; photoAttached?: boolean };
      if (!res.ok || !body.photoAttached) {
        setError(body.error || "The photo still did not go through. Try once more.");
        return;
      }
      setPhase({ name: "done", reference: phase.reference, photoAttached: true });
    } catch {
      setError("The photo still did not go through. Try once more.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  const back = () => {
    setError(null);
    if (phase.name === "slide") {
      setPhase(phase.index === 0 ? { name: "intro" } : { name: "slide", index: phase.index - 1 });
      return;
    }
    if (phase.name === "ask") {
      if (phase.index === 0) setPhase({ name: "slide", index: SLIDES.length - 1 });
      else setPhase({ name: "ask", index: phase.index - 1 });
      return;
    }
    if (phase.name === "fit" || phase.name === "young") setPhase({ name: "ask", index: phase.name === "young" ? 0 : 5 });
  };

  const score = applicationScore(answers);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(300_48%_78%/0.55),transparent_52%),radial-gradient(ellipse_at_bottom,hsl(286_42%_72%/0.28),transparent_48%)]" />
      <header className="relative z-10 mx-auto flex max-w-lg items-center justify-between px-5 pt-6">
        <Link to="/" className="font-display text-lg font-bold tracking-tight text-foreground">
          Mike&apos;s
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">About 3 minutes</p>
      </header>

      <main className="relative z-10 mx-auto flex max-w-lg flex-col px-4 pb-16 pt-6">
        <article
          key={phaseKey}
          className="interested-step rounded-[1.75rem] border border-white/80 bg-white/80 px-6 py-8 shadow-[0_30px_80px_-36px_rgba(70,20,110,0.55)] backdrop-blur-xl sm:px-8"
        >
          {phase.name === "intro" && (
            <div className="space-y-6">
              <img
                src="/images/mike-galioto.png"
                alt="Mike Galioto"
                className="h-24 w-24 rounded-full border-[3px] border-white object-cover shadow-lg shadow-primary/30"
              />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Interested in Mike??</p>
                <h1 ref={headingRef} tabIndex={-1} className="mt-2 font-display text-4xl font-extrabold tracking-tight text-foreground">
                  Apply to meet me.
                </h1>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  I&apos;m Mike. I&apos;m lonely, and I&apos;m starting a window cleaning company from an idea. Read what
                  that life is. If you still want in, apply. It comes to my phone, and I write you within 3 days if I
                  want to meet.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li>Only I read it. It is not saved in the business admin.</li>
                <li>This is for women 21 or older.</li>
                <li>If you want it deleted, tell me and I delete the message.</li>
              </ul>
              <button type="button" className="btn-primary w-full" onClick={() => setPhase({ name: "slide", index: 0 })}>
                Read me first
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {phase.name === "slide" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                {dots(SLIDES.length, phase.index)}
                <p className="text-xs font-medium text-muted-foreground">
                  {phase.index + 1} of {SLIDES.length}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{SLIDES[phase.index].kicker}</p>
                <h1 ref={headingRef} tabIndex={-1} className="mt-2 font-display text-3xl font-extrabold tracking-tight">
                  {SLIDES[phase.index].title}
                </h1>
                <p className="mt-4 text-base leading-relaxed text-foreground/85">{SLIDES[phase.index].body}</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="btn-secondary px-4" onClick={back} aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1"
                  onClick={() =>
                    phase.index === SLIDES.length - 1
                      ? goAsk(0)
                      : setPhase({ name: "slide", index: phase.index + 1 })
                  }
                >
                  {phase.index === SLIDES.length - 1 ? "I'll apply" : "Next"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {phase.name === "ask" && (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (phase.index === 0) afterBirthday();
                if (phase.index === 1) afterCity();
                if (phase.index === 2) afterJob();
                if (phase.index === 3) afterMeet();
                if (phase.index === 4) afterWhy();
                if (phase.index === 5) afterContact();
              }}
            >
              <div className="flex items-center justify-between">
                {dots(ASK_COUNT, phase.index)}
                <p className="text-xs font-medium text-muted-foreground">
                  {phase.index + 1} of {ASK_COUNT}
                </p>
              </div>

              {phase.index === 0 && (
                <div className="space-y-4">
                  <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-extrabold tracking-tight">
                    What should I call you?
                  </h1>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">First name</span>
                    <input
                      className="field-input"
                      autoComplete="given-name"
                      maxLength={80}
                      value={answers.name}
                      onChange={(event) => patch({ name: event.target.value })}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">Birthday</span>
                    <input
                      className="field-input"
                      type="date"
                      autoComplete="bday"
                      value={answers.dob}
                      max={easternDateString()}
                      onChange={(event) => patch({ dob: event.target.value })}
                    />
                  </label>
                </div>
              )}

              {phase.index === 1 && (
                <div className="space-y-4">
                  <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-extrabold tracking-tight">
                    Where are you?
                  </h1>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">City</span>
                    <input
                      className="field-input"
                      autoComplete="address-level2"
                      maxLength={80}
                      value={answers.city}
                      onChange={(event) => patch({ city: event.target.value })}
                    />
                  </label>
                </div>
              )}

              {phase.index === 2 && (
                <div className="space-y-4">
                  <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-extrabold tracking-tight">
                    What do you do?
                  </h1>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">Work, school, or the thing you spend your days on</span>
                    <input
                      className="field-input"
                      autoComplete="organization-title"
                      value={answers.job}
                      maxLength={120}
                      onChange={(event) => patch({ job: event.target.value })}
                    />
                  </label>
                </div>
              )}

              {phase.index === 3 && (
                <div className="space-y-5">
                  <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-extrabold tracking-tight">
                    How should we meet?
                  </h1>
                  <div className="space-y-2" role="group" aria-label="Platonic or romantic">
                    {TONES.map((item) => (
                      <Choice
                        key={item.id}
                        label={item.label}
                        selected={answers.tone === item.id}
                        onClick={() => patch({ tone: item.id })}
                      />
                    ))}
                  </div>
                  <div className="space-y-2" role="group" aria-label="A meetup or a date">
                    {MEETS.map((item) => (
                      <Choice
                        key={item.id}
                        label={item.label}
                        selected={answers.meet === item.id}
                        onClick={() => patch({ meet: item.id })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {phase.index === 4 && (
                <div className="space-y-4">
                  <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-extrabold tracking-tight">
                    Why me?
                  </h1>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">A few honest sentences</span>
                    <textarea
                      className="field-input min-h-28 resize-y"
                      value={answers.why}
                      maxLength={800}
                      onChange={(event) => patch({ why: event.target.value })}
                    />
                  </label>
                </div>
              )}

              {phase.index === 5 && (
                <div className="space-y-4">
                  <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-extrabold tracking-tight">
                    How do I reach you?
                  </h1>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">Phone, Telegram, or email</span>
                    <input
                      className="field-input"
                      autoComplete="tel"
                      value={answers.contact}
                      maxLength={120}
                      onChange={(event) => patch({ contact: event.target.value })}
                    />
                  </label>
                  <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
                    Use a phone number, an email, or a Telegram @name. One wrong character and I cannot reach you.
                  </p>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">A photo, if you want</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm"
                      onChange={(event) => void onPhoto(event.target.files?.[0])}
                    />
                  </label>
                  {answers.photo && (
                    <div className="flex items-center gap-3">
                      <img src={answers.photo} alt="Your photo" className="h-20 w-20 rounded-2xl object-cover" />
                      <button type="button" className="text-sm font-semibold text-primary" onClick={() => patch({ photo: "" })}>
                        Remove photo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              <div className="flex items-center gap-3">
                <button type="button" className="btn-secondary px-4" onClick={back} aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {phase.name === "young" && (
            <div className="space-y-6">
              <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-extrabold tracking-tight">
                This is for women 21 or older.
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground">
                If the birthday was a typo, go back and fix it.
              </p>
              <button type="button" className="btn-secondary" onClick={back}>
                <ArrowLeft className="h-4 w-4" />
                Fix the birthday
              </button>
            </div>
          )}

          {phase.name === "fit" && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  Score {score.points} of {score.of}
                </p>
                <h1 ref={headingRef} tabIndex={-1} className="mt-2 font-display text-3xl font-extrabold tracking-tight">
                  Your application
                </h1>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {score.points === score.of
                    ? "This is a full application. It comes to my phone."
                    : "You can send this. A longer note and a photo make it a full application."}
                </p>
              </div>
              <ul className="space-y-2">
                {score.parts.map((part) => (
                  <li key={part.label} className="rounded-2xl bg-primary/5 px-4 py-3 text-sm text-foreground/85">
                    {part.hit ? "Yes" : "Not yet"} · {part.label}
                  </li>
                ))}
              </ul>
              <dl className="space-y-2 rounded-2xl border border-primary/10 bg-white/70 px-4 py-3 text-sm">
                <Row label="Name" value={answers.name.trim()} />
                <Row label="Age" value={String(yearsOld(answers.dob) ?? "")} />
                <Row label="City" value={answers.city.trim()} />
                <Row label="Work" value={answers.job.trim()} />
                <Row label="How" value={`${toneLabel(answers.tone)} · ${meetLabel(answers.meet)}`} />
                <Row label="Reach" value={answers.contact.trim()} />
              </dl>
              {answers.photo && (
                <img src={answers.photo} alt="Your photo" className="h-28 w-28 rounded-2xl object-cover" />
              )}
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
                Read your contact once more: <span className="break-all font-semibold">{answers.contact.trim()}</span>.
                A misspelling means I cannot reach you.
              </p>
              <label className="flex items-start gap-3 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[hsl(286,44%,38%)]"
                  checked={answers.consent}
                  onChange={(event) => patch({ consent: event.target.checked })}
                />
                <span>I am 21 or older. I want Mike to read this, and he may contact me.</span>
              </label>
              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              <div className="flex items-center gap-3">
                <button type="button" className="btn-secondary px-4" onClick={back} aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button type="button" className="btn-primary flex-1" disabled={busy} onClick={() => void send()}>
                  {busy ? "Sending…" : "Send my application"}
                  {!busy && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {phase.name === "done" && (
            <div className="space-y-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
                <Check className="h-7 w-7" />
              </span>
              <div>
                <h1 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-extrabold tracking-tight">
                  It&apos;s on my phone.
                </h1>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {phase.photoAttached
                    ? "If I want to meet, I'll write you within 3 days. If you don't hear from me, that is the no."
                    : "Your answers are on my phone. The photo did not go through. If I want to meet, I'll write you within 3 days."}
                </p>
              </div>
              <p className="rounded-2xl bg-primary/5 px-4 py-5">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-primary">Reference</span>
                <span className="mt-1 block font-display text-3xl font-extrabold tracking-[0.14em]">{phase.reference}</span>
              </p>
              {!phase.photoAttached && answers.photo && (
                <div className="space-y-3">
                  {error && <p className="text-sm font-medium text-red-600">{error}</p>}
                  <button type="button" className="btn-secondary w-full" disabled={busy} onClick={() => void retryPhoto()}>
                    {busy ? "Sending the photo…" : "Try the photo again"}
                  </button>
                </div>
              )}
              <Link to="/" className="btn-secondary w-full">
                Back to the site
              </Link>
            </div>
          )}
        </article>
      </main>
    </div>
  );
}

function Choice({ label, selected, onClick }: { label: string; selected?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`w-full rounded-2xl border px-4 py-4 text-left text-base font-semibold transition ${
        selected
          ? "border-primary bg-primary text-white"
          : "border-primary/15 bg-white hover:border-primary/45 hover:bg-primary/5"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
