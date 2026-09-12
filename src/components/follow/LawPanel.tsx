import { useEffect, useMemo, useState } from "react";
import {
  LAW_TOPICS,
  addLawStamp,
  choicesForTopic,
  getLawStamps,
  lawsForState,
  type LawFact,
  type LawTopic,
} from "@/data/stateLaws";

type LawPanelProps = {
  state: string;
  placeLabel?: string;
  onClose: () => void;
  onStamp?: (states: string[]) => void;
};

export default function LawPanel({ state, placeLabel, onClose, onStamp }: LawPanelProps) {
  const rows = lawsForState(state);
  const [topic, setTopic] = useState<LawTopic | null>(null);
  const [passed, setPassed] = useState<LawTopic[]>([]);
  const [picked, setPicked] = useState<LawFact | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [stamps, setStamps] = useState<string[]>(() => getLawStamps());

  const selected = rows.find((r) => r.topic === topic);
  const choices = useMemo(() => (topic ? choicesForTopic(topic) : []), [topic]);

  useEffect(() => {
    setTopic(null);
    setPassed([]);
    setPicked(null);
    setFeedback(null);
  }, [state]);

  const checkAnswer = (choice: LawFact) => {
    if (!selected || !topic) return;
    setPicked(choice);
    if (choice === selected.fact) {
      const next = passed.includes(topic) ? passed : [...passed, topic];
      setPassed(next);
      setFeedback("Correct — statute matched.");
      if (next.length === 3) {
        const stamped = addLawStamp(state);
        setStamps(stamped);
        onStamp?.(stamped);
      }
    } else {
      setFeedback("Not quite — re-read the blurb and citation, then try again.");
    }
  };

  return (
    <div className="rounded-md border border-white/60 bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Research &amp; quiz</p>
          <h3 className="font-display text-lg font-bold">
            {state}
            {placeLabel ? ` · ${placeLabel}` : ""}
          </h3>
        </div>
        <button type="button" className="btn-secondary py-1.5 text-xs" onClick={onClose}>
          Close
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No curated statute yet for this state.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Read each cited blurb, then answer the quiz. Three correct topics stamps this state.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LAW_TOPICS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  topic === t.id ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
                onClick={() => {
                  setTopic(t.id);
                  setPicked(null);
                  setFeedback(null);
                }}
              >
                {t.label}
                {passed.includes(t.id) ? " ✓" : ""}
              </button>
            ))}
          </div>
          {selected && (
            <div className="mt-3 space-y-3 text-sm">
              <p>{selected.blurb}</p>
              <a
                href={selected.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {selected.citation}
              </a>
              <p className="text-xs text-muted-foreground">
                Not legal advice. As of {selected.asOf}. Verify the linked statute.
              </p>

              {selected.state === "TX" && selected.topic === "cannabis" && (
                <p className="rounded-md bg-secondary/80 px-3 py-2 text-xs">
                  Myth check: possessing 7 grams is <strong>not</strong> a 7-year felony in Texas. The cited statute
                  classifies two ounces or less as a Class B misdemeanor.
                </p>
              )}

              {!passed.includes(selected.topic) ? (
                <div className="space-y-2">
                  <p className="font-semibold">Quiz — pick the match:</p>
                  <div className="flex flex-col gap-2">
                    {choices.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`rounded-md border px-3 py-2 text-left text-sm ${
                          picked === c.id ? "border-primary bg-primary/10" : "border-border/70 bg-white/60"
                        }`}
                        onClick={() => checkAnswer(c.id)}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  {feedback && <p className="text-xs font-medium text-primary">{feedback}</p>}
                </div>
              ) : (
                <p className="text-xs font-semibold text-primary">Topic stamped for {state}.</p>
              )}
            </div>
          )}
          {passed.length === 3 && (
            <p className="mt-3 text-sm font-semibold text-primary">
              Stamp earned: researched all three topics for {state}.
            </p>
          )}
          {stamps.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">Your stamps: {stamps.join(" · ")}</p>
          )}
        </>
      )}
    </div>
  );
}
