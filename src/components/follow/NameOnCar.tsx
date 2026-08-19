import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Coffee, CreditCard, ExternalLink, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { submitNameClaim } from "@/lib/follow/api";
import {
  availablePayMethods,
  checkoutUrl,
  formatUsd,
  payMethodLabel,
  type PayMethod,
} from "@/lib/follow/payments";
import type { NameClaim, NameTier, SiteSettings } from "@/lib/follow/types";

type NameOnCarProps = {
  names: NameClaim[];
  settings: SiteSettings | null;
  onSubmitted: () => void;
};

const PRESETS: Record<NameTier, number[]> = {
  car: [5, 10, 25, 50],
  windshield: [100, 150, 250, 500],
};

export default function NameOnCar({ names, settings, onSubmitted }: NameOnCarProps) {
  const { user } = useAuth();
  const methods = useMemo(() => availablePayMethods(settings), [settings]);
  const [tier, setTier] = useState<NameTier>("car");
  const [displayName, setDisplayName] = useState("");
  const [amount, setAmount] = useState("10");
  const [method, setMethod] = useState<PayMethod>(methods[0] ?? "streamelements");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [payHref, setPayHref] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const windshield = names.filter((n) => n.tier === "windshield");
  const car = names.filter((n) => n.tier === "car");
  const parsed = Number(amount);
  const minAmount = tier === "windshield" ? 100 : 1;
  const validAmount = Number.isFinite(parsed) && parsed >= minAmount;
  const payUrl = validAmount ? checkoutUrl(method, settings, parsed) : "";

  const selectTier = (next: NameTier) => {
    setTier(next);
    const value = Number(amount);
    if (next === "windshield" && (!Number.isFinite(value) || value < 100)) {
      setAmount("100");
    } else if (next === "car" && (!Number.isFinite(value) || value >= 100 || value < 1)) {
      setAmount("10");
    }
  };

  const openCheckout = (url: string) => {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) setPayHref(url);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validAmount) {
      setError(tier === "windshield" ? "Windshield starts at $100." : "Enter a valid amount.");
      return;
    }
    if (!payUrl) {
      setError("That payment option is not set up yet.");
      return;
    }
    const name = displayName.trim();
    setBusy(true);
    setError(null);
    setOk(null);
    setPayHref(null);
    try {
      if (user) {
        await submitNameClaim({
          user_id: user.id,
          display_name: name,
          amount: parsed,
          payment_note: `${payMethodLabel(method)} · put “${name}” in the tip message`,
        });
        openCheckout(payUrl);
        setOk(
          `Claim saved. Finish ${formatUsd(parsed)} on ${payMethodLabel(method)} — put “${name}” in the tip message so Mike can match it.`,
        );
        setDisplayName("");
        onSubmitted();
      } else {
        openCheckout(payUrl);
        setOk(
          `Finish ${formatUsd(parsed)} on ${payMethodLabel(method)}. Put “${name}” in the tip message, then sign in so we can claim the name.`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="name-on-car" className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">Names on the car</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          After you tip: any amount → name on the car. $100+ → windshield.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => selectTier("windshield")}
          className={`rounded-md border px-4 py-3 text-left transition-colors ${
            tier === "windshield"
              ? "border-primary/25 bg-primary/5"
              : "border-white/60 bg-white/55 hover:border-primary/25"
          }`}
        >
          <h3 className={`font-display text-lg font-bold ${tier === "windshield" ? "text-primary" : ""}`}>
            Windshield ($100+)
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {windshield.length === 0 && <li className="text-sm text-muted-foreground">Open for the first name.</li>}
            {windshield.map((n) => (
              <li
                key={n.id}
                className="rounded-md bg-white/80 px-2.5 py-1 text-sm font-semibold text-foreground shadow-sm"
              >
                {n.display_name}
              </li>
            ))}
          </ul>
        </button>
        <button
          type="button"
          onClick={() => selectTier("car")}
          className={`rounded-md border px-4 py-3 text-left transition-colors ${
            tier === "car"
              ? "border-primary/25 bg-primary/5"
              : "border-white/60 bg-white/55 hover:border-primary/25"
          }`}
        >
          <h3 className={`font-display text-lg font-bold ${tier === "car" ? "text-primary" : ""}`}>On the car</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {car.length === 0 && <li className="text-sm text-muted-foreground">Be the first to ride along.</li>}
            {car.map((n) => (
              <li key={n.id} className="rounded-md bg-secondary/80 px-2.5 py-1 text-sm font-medium">
                {n.display_name}
              </li>
            ))}
          </ul>
        </button>
      </div>

      <div className="rounded-md border border-white/60 bg-white/55 px-4 py-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="font-display text-lg font-bold">Checkout</h3>
          <p className="text-sm text-muted-foreground">
            {tier === "windshield" ? "Windshield" : "On the car"}
            {validAmount ? ` · ${formatUsd(parsed)}` : ""}
          </p>
        </div>

          <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Name to put on the car</span>
              <input
                className="field-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={40}
                placeholder="How it should appear"
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm font-medium">Amount</span>
              <div className="flex flex-wrap gap-2">
                {PRESETS[tier].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className={`rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors ${
                      Number(amount) === preset
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/80 bg-white/80 hover:border-primary/40"
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="sr-only">Custom amount</span>
                <div className="relative max-w-[12rem]">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <input
                    className="field-input pl-7"
                    type="number"
                    min={minAmount}
                    step="0.01"
                    value={amount}
                    onChange={(e) => {
                      const next = e.target.value;
                      setAmount(next);
                      const value = Number(next);
                      if (Number.isFinite(value) && value >= 100) setTier("windshield");
                      else if (Number.isFinite(value) && value > 0) setTier("car");
                    }}
                    required
                  />
                </div>
              </label>
              {tier === "windshield" && (
                <p className="text-xs text-muted-foreground">Windshield names start at $100.</p>
              )}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Pay with</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {methods.map((m) => {
                  const Icon = m === "streamelements" ? CreditCard : m === "cashapp" ? Wallet : Coffee;
                  const hint =
                    m === "streamelements"
                      ? "Card or PayPal"
                      : m === "cashapp"
                        ? settings?.cash_app_tag || "Send directly"
                        : "Tip on BMC";
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                        method === m
                          ? "border-primary/25 bg-primary/5"
                          : "border-white/80 bg-white/80 hover:border-primary/25"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">
                        <Icon className="h-4 w-4 text-primary" />
                        {payMethodLabel(m)}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
                    </button>
                  );
                })}
              </div>
              {method === "streamelements" && (
                <p className="text-xs text-muted-foreground">
                  StreamElements opens next. Enter {validAmount ? formatUsd(parsed) : "your amount"} and put the
                  name in the tip message.
                </p>
              )}
              {method === "cashapp" && (
                <p className="text-xs text-muted-foreground">
                  Cash App opens with {validAmount ? formatUsd(parsed) : "your amount"} filled in.
                </p>
              )}
            </fieldset>

            <div>
              <button type="submit" className="btn-primary text-sm" disabled={busy || !payUrl}>
                {busy ? "Opening checkout…" : validAmount ? `Pay ${formatUsd(parsed)}` : "Pay"}
              </button>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              {ok && <p className="mt-2 text-sm text-primary">{ok}</p>}
              {payHref && (
                <a
                  href={payHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  Open checkout <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {!user && (
                <p className="mt-2 text-xs text-muted-foreground">
                  <Link to="/Follow/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>{" "}
                  first if you want the name saved automatically after you pay.
                </p>
              )}
            </div>
          </form>
      </div>
    </section>
  );
}
