import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { submitNameClaim } from "@/lib/follow/api";
import type { NameClaim } from "@/lib/follow/types";

type NameOnCarProps = {
  names: NameClaim[];
  onSubmitted: () => void;
};

export default function NameOnCar({ names, onSubmitted }: NameOnCarProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const windshield = names.filter((n) => n.tier === "windshield");
  const car = names.filter((n) => n.tier === "car");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid donation amount.");
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await submitNameClaim({
        user_id: user.id,
        display_name: displayName,
        amount: parsed,
        payment_note: paymentNote,
      });
      setDisplayName("");
      setAmount("");
      setPaymentNote("");
      setOk("Claim submitted — Mike will approve it after confirming your donation.");
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit claim.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">Names on the car</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          After you tip: any amount → name on the car. $100+ → windshield.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-primary/25 bg-primary/5 px-4 py-3">
          <h3 className="font-display text-lg font-bold text-primary">Windshield ($100+)</h3>
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
        </div>
        <div className="rounded-md border border-white/60 bg-white/55 px-4 py-3">
          <h3 className="font-display text-lg font-bold">On the car</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {car.length === 0 && <li className="text-sm text-muted-foreground">Be the first to ride along.</li>}
            {car.map((n) => (
              <li key={n.id} className="rounded-md bg-secondary/80 px-2.5 py-1 text-sm font-medium">
                {n.display_name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-md border border-white/60 bg-white/55 px-4 py-4">
        <h3 className="font-display text-lg font-bold">Claim your name</h3>
        {user ? (
          <form onSubmit={(e) => void onSubmit(e)} className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-sm font-medium">Name to put on the car</span>
              <input
                className="field-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={40}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Amount donated ($)</span>
              <input
                className="field-input"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Payment note (optional)</span>
              <input
                className="field-input"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="BMC / Cash App handle or memo"
                maxLength={120}
              />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary text-sm" disabled={busy}>
                {busy ? "Submitting…" : "Submit claim"}
              </button>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              {ok && <p className="mt-2 text-sm text-primary">{ok}</p>}
            </div>
          </form>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            <Link to="/Follow/login" className="font-semibold text-primary hover:underline">
              Create a free account
            </Link>{" "}
            to claim your name after you donate.
          </p>
        )}
      </div>
    </section>
  );
}
