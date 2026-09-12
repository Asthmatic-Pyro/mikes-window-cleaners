import { useState } from "react";
import { LAW_TOPICS, lawsForState, type LawTopic } from "@/data/stateLaws";

type LawPanelProps = {
  state: string;
  placeLabel?: string;
  onClose: () => void;
};

export default function LawPanel({ state, placeLabel, onClose }: LawPanelProps) {
  const rows = lawsForState(state);
  const [topic, setTopic] = useState<LawTopic | null>(null);
  const [opened, setOpened] = useState<LawTopic[]>([]);
  const selected = rows.find((r) => r.topic === topic);

  return (
    <div className="rounded-md border border-white/60 bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">What&apos;s the rule here?</p>
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
                  setOpened((prev: LawTopic[]) => (prev.includes(t.id) ? prev : [...prev, t.id]));
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {selected && (
            <div className="mt-3 space-y-2 text-sm">
              <p>{selected.blurb}</p>
              <a
                href={selected.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={() => {
                  try {
                    const key = `mwc_law_${state}`;
                    const prev = JSON.parse(localStorage.getItem(key) || "[]") as string[];
                    localStorage.setItem(key, JSON.stringify([...new Set([...prev, selected.topic])]));
                  } catch {
                    /* ignore */
                  }
                }}
              >
                {selected.citation}
              </a>
              <p className="text-xs text-muted-foreground">Not legal advice. As of {selected.asOf}. Verify the linked statute.</p>
            </div>
          )}
          {opened.length === 3 && (
            <p className="mt-3 text-xs font-semibold text-primary">Researched all three topics for {state}.</p>
          )}
        </>
      )}
    </div>
  );
}
