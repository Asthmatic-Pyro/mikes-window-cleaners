import { useState } from "react";
import { ChevronRight, Route } from "lucide-react";
import Modal from "@/components/Modal";
import type { Destination } from "@/lib/follow/types";

type DestinationsListProps = {
  destinations: Destination[];
};

const statusLabel: Record<Destination["status"], string> = {
  done: "Visited",
  current: "Here now",
  upcoming: "Up next",
};

function RouteStops({ destinations }: { destinations: Destination[] }) {
  return (
    <ol className="space-y-0">
      {destinations.length === 0 && (
        <li className="text-sm text-muted-foreground">Destination stops will show up here.</li>
      )}
      {destinations.map((d, i) => (
        <li key={d.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < destinations.length - 1 && (
            <span className="absolute bottom-0 left-[7px] top-4 w-px bg-border" aria-hidden />
          )}
          <span
            className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white shadow-sm ${
              d.status === "current"
                ? "bg-[#0891b2]"
                : d.status === "done"
                  ? "bg-[#16a34a]"
                  : "bg-[#f59e0b]"
            }`}
            aria-hidden
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-baseline justify-between gap-3">
              <span
                className={`font-medium ${d.status === "done" ? "text-muted-foreground" : "text-foreground"}`}
              >
                {d.name}
              </span>
              <span
                className={`shrink-0 text-xs font-semibold uppercase tracking-wide ${
                  d.status === "current" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {statusLabel[d.status]}
              </span>
            </div>
            {d.city_label && d.city_label !== d.name && (
              <p className="text-xs text-muted-foreground">{d.city_label}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function DestinationsList({ destinations }: DestinationsListProps) {
  const [open, setOpen] = useState(false);
  const total = destinations.length;
  const done = destinations.filter((d) => d.status === "done").length;
  const current = destinations.find((d) => d.status === "current");
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const summary = current
    ? `Now: ${current.name}`
    : total
      ? `${done} of ${total} stops visited`
      : "Stops coming soon";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-md border border-white/60 bg-white/50 px-4 py-3 text-left shadow-sm transition-colors hover:bg-white/70"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-wash text-white">
          <Route className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="font-display text-lg font-bold tracking-tight">The route</span>
            {total > 0 && <span className="text-sm font-semibold text-primary">{progress}%</span>}
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted-foreground">{summary}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </button>

      <Modal open={open} title="The route" onClose={() => setOpen(false)}>
        <p className="text-sm text-muted-foreground">{summary}</p>
        {total > 0 && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-wash transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}
        <div className="mt-5">
          <RouteStops destinations={destinations} />
        </div>
      </Modal>
    </>
  );
}
