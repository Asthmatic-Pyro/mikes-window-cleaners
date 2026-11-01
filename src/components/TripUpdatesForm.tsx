import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";

type TripUpdatesFormProps = {
  idPrefix?: string;
  compact?: boolean;
  onSuccess?: () => void;
};

export default function TripUpdatesForm({ idPrefix = "trip", compact, onSuccess }: TripUpdatesFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/trip-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName: name }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setError(payload.error || "Could not sign you up.");
        return;
      }
      setMessage(payload.message || "Check your inbox and tap the confirmation link.");
      setEmail("");
      setName("");
      onSuccess?.();
    } catch {
      setError("Could not reach the signup server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          People keep asking where Mike is and when he is moving. Confirm your email and get a place note each time
          the pin moves — weather, a short look at the stop, and nearby nature.
        </p>
      )}
      <label className="block space-y-1" htmlFor={`${idPrefix}-name`}>
        <span className="text-sm font-medium">Name</span>
        <input
          id={`${idPrefix}-name`}
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="How we should greet you"
          maxLength={40}
          autoComplete="name"
        />
      </label>
      <label className="block space-y-1" htmlFor={`${idPrefix}-email`}>
        <span className="text-sm font-medium">Email</span>
        <input
          id={`${idPrefix}-email`}
          className="field-input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@gmail.com"
          autoComplete="email"
        />
      </label>
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
        <Mail className="h-4 w-4" />
        {busy ? "Sending…" : "Email me trip updates"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-primary">{message}</p>}
    </form>
  );
}
