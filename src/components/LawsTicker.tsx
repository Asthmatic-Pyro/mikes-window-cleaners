import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LAW_TOPICS, STATE_LAWS, type LawTopic } from "@/data/stateLaws";

const SEED_KEY = "mwc_law_ticker_seed";

function sessionSeed() {
  try {
    const existing = sessionStorage.getItem(SEED_KEY);
    if (existing) return Number(existing);
    const seed = Math.floor(Math.random() * 1_000_000);
    sessionStorage.setItem(SEED_KEY, String(seed));
    return seed;
  } catch {
    return 7;
  }
}

function mulberry32(a: number) {
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function LawsTicker() {
  const order = useMemo(() => {
    const rand = mulberry32(sessionSeed());
    return [...STATE_LAWS].sort(() => rand() - 0.5);
  }, []);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (order.length === 0) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % order.length), 12000);
    return () => window.clearInterval(id);
  }, [order.length]);

  const row = order[index];
  if (!row) return null;
  const topic = LAW_TOPICS.find((t) => t.id === (row.topic as LawTopic))?.label ?? row.topic;

  return (
    <section className="border-y border-border/50 bg-white/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-foreground/85">
          <span className="font-semibold">{row.state} · {topic}:</span> {row.blurb}{" "}
          <a href={row.sourceUrl} className="font-medium text-primary underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
            [{row.citation}]
          </a>
        </p>
        <Link to="/Follow" className="shrink-0 text-sm font-semibold text-primary hover:underline">
          Read on the map
        </Link>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-3 text-[11px] text-muted-foreground">
        Not legal advice. Laws change. Verify the linked statute.
      </p>
    </section>
  );
}
