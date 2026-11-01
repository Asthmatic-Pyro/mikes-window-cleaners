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
import {
  VEHICLE_TOPICS,
  choicesForVehicleTopic,
  defaultStopNote,
  stopLaw,
  vehicleLawsForState,
  type VehicleTopic,
} from "@/data/vehicleLaws";

type LawPanelProps = {
  state: string;
  placeLabel?: string;
  onClose: () => void;
  onStamp?: (states: string[]) => void;
};

type PanelTopic = LawTopic | VehicleTopic;

const PANEL_TOPICS: { id: PanelTopic; label: string }[] = [...LAW_TOPICS, ...VEHICLE_TOPICS];

export default function LawPanel({ state, placeLabel, onClose, onStamp }: LawPanelProps) {
  const rows = [...lawsForState(state), ...vehicleLawsForState(state)];
  const place = stopLaw(placeLabel);
  const [topic, setTopic] = useState<PanelTopic | null>(null);
  const [passed, setPassed] = useState<PanelTopic[]>([]);
  const [picked, setPicked] = useState<LawFact | string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [stamps, setStamps] = useState<string[]>(() => getLawStamps());

  const selected = rows.find((r) => r.topic === topic);
  const choices = useMemo(() => {
    if (!topic) return [];
    if (topic === "vehicle" || topic === "camping" || topic === "fine") return choicesForVehicleTopic(topic);
    return choicesForTopic(topic);
  }, [topic]);

  useEffect(() => {
    setTopic(null);
    setPassed([]);
    setPicked(null);
    setFeedback(null);
  }, [state]);

  const checkAnswer = (choice: LawFact | string) => {
    if (!selected || !topic) return;
    setPicked(choice);
    if (choice === selected.fact) {
      const next = passed.includes(topic) ? passed : [...passed, topic];
      setPassed(next);
      setFeedback("Correct — statute matched.");
      if (next.length === PANEL_TOPICS.length) {
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
          {place ? (
            <div className="mt-3 space-y-2 rounded-md bg-secondary/80 p-3 text-sm">
              <p className="font-semibold">This stop</p>
              <p>
                <span className="font-medium">Sleeping in a car. </span>
                {place.vehicle}
              </p>
              <p>
                <span className="font-medium">Public camping. </span>
                {place.camping}
              </p>
              <p>
                <span className="font-medium">Fine. </span>
                {place.fine}
              </p>
              <a
                href={place.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {place.citation}
              </a>
            </div>
          ) : placeLabel ? (
            <p className="mt-3 rounded-md bg-secondary/80 px-3 py-2 text-sm">{defaultStopNote(placeLabel, state)}</p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">
            Read each cited blurb, then answer the quiz. {PANEL_TOPICS.length} correct topics stamps this state.
            The U.S. Supreme Court in Grants Pass v. Johnson, 603 U.S. 520 (2024), held that the Eighth Amendment
            does not bar a city from enforcing a generally applicable camping rule against a person who is homeless.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PANEL_TOPICS.map((t) => (
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
          {passed.length === PANEL_TOPICS.length && (
            <p className="mt-3 text-sm font-semibold text-primary">
              Stamp earned: researched all {PANEL_TOPICS.length} topics for {state}.
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
