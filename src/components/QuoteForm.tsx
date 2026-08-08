import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type QuoteFormProps = {
  idPrefix?: string;
};

export default function QuoteForm({ idPrefix = "quote" }: QuoteFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "Storefront glass",
    message: "",
  });

  const id = (name: string) => `${idPrefix}-${name}`;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again or call Mike.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Could not reach the server. Please try again or call Mike.");
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-start gap-4 py-4">
        <CheckCircle2 className="h-12 w-12 text-primary" />
        <h3 className="font-display text-2xl font-semibold text-foreground">Thanks — Mike got your request</h3>
        <p className="text-muted-foreground">
          We&apos;ll follow up soon with a quote for {form.service.toLowerCase()}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor={id("name")} className="mb-1.5 block text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id={id("name")}
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-md border border-border bg-white/80 px-3 py-2.5 outline-none ring-primary focus:ring-2"
          placeholder="Your name"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={id("phone")} className="mb-1.5 block text-sm font-medium text-foreground">
            Phone
          </label>
          <input
            id={id("phone")}
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-md border border-border bg-white/80 px-3 py-2.5 outline-none ring-primary focus:ring-2"
            placeholder="(513) 628-4128"
          />
        </div>
        <div>
          <label htmlFor={id("email")} className="mb-1.5 block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id={id("email")}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-md border border-border bg-white/80 px-3 py-2.5 outline-none ring-primary focus:ring-2"
            placeholder="you@email.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor={id("service")} className="mb-1.5 block text-sm font-medium text-foreground">
          Service
        </label>
        <select
          id={id("service")}
          value={form.service}
          onChange={(e) => setForm({ ...form, service: e.target.value })}
          className="w-full rounded-md border border-border bg-white/80 px-3 py-2.5 outline-none ring-primary focus:ring-2"
        >
          <option>Storefront glass</option>
          <option>Commercial glass</option>
          <option>Screens & tracks</option>
          <option>Hard-water / post-build</option>
          <option>One-time full clean</option>
        </select>
      </div>
      <div>
        <label htmlFor={id("message")} className="mb-1.5 block text-sm font-medium text-foreground">
          Details
        </label>
        <textarea
          id={id("message")}
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full resize-y rounded-md border border-border bg-white/80 px-3 py-2.5 outline-none ring-primary focus:ring-2"
          placeholder="Where are you? Storefront or commercial? How many panes? Preferred day?"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-sm text-muted-foreground">
        Prefer to call?{" "}
        <a href="tel:+15136284128" className="font-semibold text-primary hover:underline">
          (513) 628-4128
        </a>
      </p>
      <button type="submit" disabled={sending} className="btn-primary w-full sm:w-auto disabled:opacity-60">
        {sending ? "Sending…" : "Request Quote"}
        {!sending ? <ArrowRight className="h-5 w-5" /> : null}
      </button>
    </form>
  );
}
