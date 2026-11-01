import { Resend } from "resend";
import { env } from "./env.js";
import { adminClient, alertMike, ensureTelegramWebhook } from "./telegram.js";

const PAY_METHODS = new Set(["StreamElements", "Cash App", "Venmo", "Buy Me a Coffee"]);

export type WindowTier = "car" | "windshield";

export function tierFromPlace(place: unknown, amount: number): WindowTier {
  const text = oneLine(String(place ?? ""), 20).toLowerCase();
  if (text === "windshield") return "windshield";
  if (text === "hatch" || text === "car") return "car";
  return amount >= 100 ? "windshield" : "car";
}

export function placeLabel(tier: string) {
  return tier === "windshield" ? "windshield" : "hatch window";
}

export type NameAlertInput = {
  claimId?: string | null;
  displayName: string;
  amount: number;
  tier: WindowTier;
  payMethod?: string | null;
  accountEmail?: string | null;
  signedIn: boolean;
  note?: string | null;
};

type ClaimRow = {
  display_name: string;
  amount: number | string;
  tier: string | null;
  payment_note: string | null;
  user_id: string | null;
};

function oneLine(value: string, max: number) {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function cleanPayMethod(value: unknown) {
  const text = oneLine(String(value ?? ""), 40);
  return PAY_METHODS.has(text) ? text : "";
}

function formatUsd(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function adminUrl() {
  const site = (env("SITE_URL") || "https://mikeswindowcleaners.com").replace(/\/$/, "");
  return `${site}/Follow/admin`;
}

export function nameAlertCopy(input: NameAlertInput) {
  const place = placeLabel(input.tier);
  const money = formatUsd(input.amount);
  const account = input.signedIn ? oneLine(input.accountEmail || "signed in", 120) : "not signed in";
  const payMethod = cleanPayMethod(input.payMethod);
  const note = input.note ? oneLine(input.note, 400) : "";
  const lines = [
    `Name on the ${place}: "${oneLine(input.displayName, 40)}"`,
    money,
    payMethod ? `Pay with: ${payMethod}` : null,
    `Account: ${account}`,
    note || null,
    input.claimId ? "Approve or decline with the buttons." : "No request was saved, so there are no buttons.",
    input.claimId ? `Request id: ${input.claimId}` : null,
    adminUrl(),
  ].filter((line): line is string => Boolean(line));

  return {
    subject: `Name on the ${place}: ${oneLine(input.displayName, 40)} (${money})`,
    text: lines.join("\n"),
    html: `
      <h2>Name on the ${escapeHtml(place)}</h2>
      <p><strong>Name:</strong> ${escapeHtml(oneLine(input.displayName, 40))}</p>
      <p><strong>Amount:</strong> ${escapeHtml(money)}</p>
      <p><strong>Window:</strong> ${escapeHtml(place)}</p>
      ${payMethod ? `<p><strong>Pay with:</strong> ${escapeHtml(payMethod)}</p>` : ""}
      <p><strong>Account:</strong> ${escapeHtml(account)}</p>
      ${note ? `<p><strong>Note:</strong> ${escapeHtml(note)}</p>` : ""}
      ${input.claimId ? "<p>Approve or decline from the Telegram buttons.</p>" : "<p>No request was saved, so there are no buttons.</p>"}
      <p><a href="${escapeHtml(adminUrl())}">Open Follow admin</a></p>
    `,
  };
}

async function claimSlot(eventKey: string) {
  const admin = adminClient();
  if (!admin) return true;
  const { error } = await admin.from("notification_log").insert({
    event_type: "name-alert",
    event_key: eventKey,
  });
  if (!error) return true;
  if (error.code === "23505") return false;
  console.error("name alert dedupe:", error.message);
  return true;
}

async function releaseSlot(eventKey: string) {
  const admin = adminClient();
  if (!admin) return;
  const { error } = await admin.from("notification_log").delete().eq("event_type", "name-alert").eq("event_key", eventKey);
  if (error) console.error("name alert release:", error.message);
}

async function emailMike(subject: string, html: string, text: string) {
  const key = env("RESEND_API_KEY");
  const to = env("CONTACT_TO_EMAIL");
  const from = env("EMAIL_FROM");
  if (!key || !to || !from) {
    console.warn("Name alert email is not configured.");
    return false;
  }
  const { error } = await new Resend(key).emails.send({
    from,
    to: [to],
    subject,
    html,
    text,
  });
  if (error) {
    console.error("Name alert email:", error);
    return false;
  }
  return true;
}

async function attemptNameAlert(input: NameAlertInput, eventKey: string) {
  const claimed = await claimSlot(eventKey);
  if (!claimed) return { telegram: false, email: false, duplicate: true, failed: false };

  const copy = nameAlertCopy(input);
  const buttons = input.claimId
    ? [[
        { text: "Approve", callback_data: `n:a:${input.claimId}` },
        { text: "Decline", callback_data: `n:x:${input.claimId}` },
      ]]
    : undefined;
  if (buttons) await ensureTelegramWebhook();
  const [telegram, email] = await Promise.all([
    alertMike(
      "name",
      copy.text,
      {
        id: input.claimId ?? null,
        display_name: input.displayName,
        amount: input.amount,
        tier: input.tier,
        pay_method: cleanPayMethod(input.payMethod) || null,
        account_email: input.accountEmail ?? null,
        signed_in: input.signedIn,
      },
      buttons,
    ),
    emailMike(copy.subject, copy.html, copy.text),
  ]);

  if (!telegram && !email) {
    await releaseSlot(eventKey);
    return { telegram, email, duplicate: false, failed: true };
  }
  return { telegram, email, duplicate: false, failed: false };
}

export async function deliverNameAlert(input: NameAlertInput) {
  const eventKey = input.claimId ? `claim:${input.claimId}` : `guest:${crypto.randomUUID()}`;
  const first = await attemptNameAlert(input, eventKey);
  if (first.duplicate || !first.failed) return first;
  const retryKey = input.claimId ? eventKey : `guest:${crypto.randomUUID()}`;
  return attemptNameAlert(input, retryKey);
}

export async function nameAlertFromClaimId(claimId: string, payMethod?: string | null) {
  const admin = adminClient();
  if (!admin) return { kind: "missing" as const };

  const { data, error } = await admin
    .from("name_claims")
    .select("display_name, amount, tier, payment_note, user_id")
    .eq("id", claimId)
    .maybeSingle();
  if (error || !data) return { kind: "missing" as const };

  const row = data as ClaimRow;
  if ((row.payment_note || "").trimStart().startsWith("Added in admin")) {
    return { kind: "admin" as const };
  }

  let accountEmail: string | null = null;
  if (row.user_id) {
    const { data: profile } = await admin.from("profiles").select("email").eq("id", row.user_id).maybeSingle();
    accountEmail = typeof profile?.email === "string" ? profile.email : null;
  }

  const amount = Number(row.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { kind: "missing" as const };
  const marked = row.payment_note?.match(/^window:(windshield|hatch)/)?.[1];
  const tier: WindowTier = marked === "windshield" || (!marked && row.tier === "windshield") ? "windshield" : "car";
  const note = (row.payment_note || "").replace(/^window:(windshield|hatch)\n?/, "").trim();

  const input: NameAlertInput = {
    claimId,
    displayName: oneLine(row.display_name || "unnamed", 40),
    amount,
    tier,
    payMethod: cleanPayMethod(payMethod),
    accountEmail,
    signedIn: Boolean(row.user_id),
    note: note || null,
  };
  return { kind: "ready" as const, input };
}

export async function setClaimWindow(claimId: string, tier: WindowTier) {
  const admin = adminClient();
  if (!admin) return;
  const { error } = await admin.from("name_claims").update({ tier }).eq("id", claimId).eq("status", "pending");
  if (error) console.error("name window:", error.message);
}

export async function createGuestNameClaim(input: {
  userId?: string | null;
  displayName: string;
  amount: number;
  tier: WindowTier;
  note: string;
}) {
  const admin = adminClient();
  if (!admin) return null;
  const windowMark = input.tier === "windshield" ? "windshield" : "hatch";
  const inserted = await admin
    .from("name_claims")
    .insert({
      user_id: input.userId ?? null,
      display_name: input.displayName,
      amount: input.amount,
      tier: input.tier,
      payment_note: `window:${windowMark}\n${input.note}`,
      status: "pending",
    })
    .select("id")
    .single();
  if (inserted.error || !inserted.data?.id) {
    console.error("guest name claim:", inserted.error?.message);
    return null;
  }
  const id = String(inserted.data.id);
  await setClaimWindow(id, input.tier);
  return id;
}

export async function guestNameAlertsBursting() {
  const admin = adminClient();
  if (!admin) return false;
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("notification_log")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "name-alert")
    .like("event_key", "guest:%")
    .gte("sent_at", since);
  if (error) {
    console.error("name alert rate limit:", error.message);
    return false;
  }
  return (count ?? 0) >= 8;
}
