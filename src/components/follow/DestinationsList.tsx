import type { Destination } from "@/lib/follow/types";

type DestinationsListProps = {
  destinations: Destination[];
};

const statusLabel: Record<Destination["status"], string> = {
  done: "Visited",
  current: "Here now",
  upcoming: "Up next",
};

export default function DestinationsList({ destinations }: DestinationsListProps) {
  const total = destinations.length;
  const done = destinations.filter((d) => d.status === "done").length;
  const current = destinations.find((d) => d.status === "current");
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">The route</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {current ? `Now: ${current.name}` : total ? `${done} of ${total} stops visited` : "Stops coming soon"}
          </p>
        </div>
        {total > 0 && <span className="text-sm font-semibold text-primary">{progress}%</span>}
      </div>

      {total > 0 && (
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-wash transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}

      <ol className="space-y-0">
        {destinations.length === 0 && (
          <li className="text-sm text-muted-foreground">Destination stops will show up here.</li>
        )}
        {destinations.map((d, i) => (
          <li key={d.id} className="relative flex gap-3 pb-4 last:pb-0">
            {i < destinations.length - 1 && (
              <span
                className="absolute left-[7px] top-4 bottom-0 w-px bg-border"
                aria-hidden
              />
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
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
