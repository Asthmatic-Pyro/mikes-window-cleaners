import { promises as dns } from "node:dns";
import emailAddresses from "email-addresses";

const RESERVED_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "example.edu",
  "test.com",
]);

const RESERVED_SUFFIXES = [".example", ".test", ".invalid", ".localhost"];

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "sharklasers.com",
  "grr.la",
  "tempmail.com",
  "temp-mail.org",
  "throwaway.email",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "maildrop.cc",
  "dispostable.com",
  "10minutemail.com",
  "fakeinbox.com",
  "mintemail.com",
  "spam4.me",
  "mailnesia.com",
  "mytemp.email",
  "emailondeck.com",
]);

export type EmailCheckResult =
  | { ok: true; email: string }
  | { ok: false; reason: string };

function isReservedDomain(domain: string): boolean {
  if (RESERVED_DOMAINS.has(domain)) return true;
  return RESERVED_SUFFIXES.some((suffix) => domain === suffix.slice(1) || domain.endsWith(suffix));
}

async function hasMx(domain: string): Promise<boolean> {
  try {
    const records = await dns.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;
  }
}

/** Library parse + reserved/disposable block + MX. No hand-rolled regex. */
export async function checkSubscriberEmail(raw: string): Promise<EmailCheckResult> {
  const parsed = emailAddresses.parseOneAddress(raw.trim());
  if (!parsed || parsed.type !== "mailbox") {
    return { ok: false, reason: "That does not look like an email address." };
  }

  const email = parsed.address.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1) return { ok: false, reason: "That does not look like an email address." };

  const domain = email.slice(at + 1);
  if (!domain.includes(".")) {
    return { ok: false, reason: "That email domain is not valid." };
  }

  if (isReservedDomain(domain)) {
    return { ok: false, reason: "Please use a real email address." };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, reason: "Temporary email addresses are not accepted." };
  }

  if (!(await hasMx(domain))) {
    return { ok: false, reason: "That email domain cannot receive mail." };
  }

  return { ok: true, email };
}
