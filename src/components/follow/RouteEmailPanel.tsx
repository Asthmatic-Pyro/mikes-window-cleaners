import type { RouteEmailAction, RouteEmailRun } from "@/lib/follow/api";

type Props = {
  run: RouteEmailRun;
  busy: boolean;
  onDecide: (action: RouteEmailAction) => void;
};

function openExample(html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function RouteEmailPanel({ run, busy, onDecide }: Props) {
  const clients = run.clients ?? [];
  const waitingExample = run.status === "awaiting_example" && Boolean(run.run_id);
  const waitingSend = run.status === "awaiting_send" && Boolean(run.run_id);
  const where = (kind: string) => (kind === "ahead" ? "next town" : "in town");

  return (
    <section className="space-y-3 rounded-md border border-white/60 bg-white/55 p-4">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-bold">
          {run.simulate ? "Route email simulation" : "Route email"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {run.note || "Approve the example, then the shop list. Nothing sends before both."}
          {run.telegram_sent ? " The same steps are on Telegram." : ""}
        </p>
      </div>

      {clients.length > 0 && (
        <ul className="space-y-1 text-sm">
          {clients.map((client) => (
            <li key={`${client.email}-${client.kind}-${client.label}`}>
              <span className="font-medium">{client.business_name}</span>
              {" — "}
              {client.email}
              <span className="text-muted-foreground">
                {" "}
                ({where(client.kind)}
                {client.label ? `, ${client.label}` : ""})
              </span>
            </li>
          ))}
        </ul>
      )}

      {run.example_subject && <p className="text-sm">Subject: {run.example_subject}</p>}

      {run.example_html && (
        <div className="space-y-2">
          <iframe
            title="Example Gmail"
            sandbox=""
            srcDoc={run.example_html}
            className="h-80 w-full rounded-md border border-black/10 bg-white"
          />
          <button type="button" className="btn-secondary text-sm" onClick={() => openExample(run.example_html || "")}>
            Open example Gmail
          </button>
        </div>
      )}

      {(waitingExample || waitingSend) && (
        <div className="flex flex-wrap gap-2">
          {waitingExample && (
            <button type="button" className="btn-primary text-sm" disabled={busy} onClick={() => onDecide("approve_example")}>
              Approve example
            </button>
          )}
          {waitingSend && (
            <button type="button" className="btn-primary text-sm" disabled={busy} onClick={() => onDecide("approve_send")}>
              {run.simulate ? "Finish simulation" : "Send to these shops"}
            </button>
          )}
          <button type="button" className="btn-secondary text-sm" disabled={busy} onClick={() => onDecide("cancel")}>
            Cancel
          </button>
        </div>
      )}
    </section>
  );
}
