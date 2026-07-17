import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function QuoteSection() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "Residential windows",
    message: "",
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setSubmitted(true);
  };

  return (
    <section id="quote" className="section-pad">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Ready for a{" "}
              <span className="text-wash">clearer view?</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Tell Mike a little about your windows. You&apos;ll get a straightforward quote — usually the same day.
            </p>
            <div className="mt-10 space-y-3 text-muted-foreground">
              <p>
                Prefer to call?{" "}
                <a href="tel:+15555550123" className="font-semibold text-primary hover:underline">
                  (555) 555-0123
                </a>
              </p>
              <p className="text-sm">Replace this number with Mike&apos;s real phone when you&apos;re ready.</p>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 shadow-lg shadow-primary/5 md:p-8">
            {submitted ? (
              <div className="flex flex-col items-start gap-4 py-8">
                <CheckCircle2 className="h-12 w-12 text-accent" />
                <h3 className="font-display text-2xl font-semibold text-foreground">Thanks — Mike got your request</h3>
                <p className="text-muted-foreground">
                  We&apos;ll follow up soon with a quote for {form.service.toLowerCase()}.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
                    Name
                  </label>
                  <input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-md border border-border bg-white/80 px-3 py-2.5 outline-none ring-primary focus:ring-2"
                    placeholder="Your name"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-foreground">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-md border border-border bg-white/80 px-3 py-2.5 outline-none ring-primary focus:ring-2"
                      placeholder="(555) 555-0123"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-md border border-border bg-white/80 px-3 py-2.5 outline-none ring-primary focus:ring-2"
                      placeholder="you@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="service" className="mb-1.5 block text-sm font-medium text-foreground">
                    Service
                  </label>
                  <select
                    id="service"
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    className="w-full rounded-md border border-border bg-white/80 px-3 py-2.5 outline-none ring-primary focus:ring-2"
                  >
                    <option>Residential windows</option>
                    <option>Commercial glass</option>
                    <option>Screens & tracks</option>
                    <option>Hard-water / post-build</option>
                    <option>Recurring plan</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-foreground">
                    Details
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full resize-y rounded-md border border-border bg-white/80 px-3 py-2.5 outline-none ring-primary focus:ring-2"
                    placeholder="How many windows? Any stories? Preferred day?"
                  />
                </div>
                <button type="submit" className="btn-primary w-full sm:w-auto">
                  Request Quote
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
