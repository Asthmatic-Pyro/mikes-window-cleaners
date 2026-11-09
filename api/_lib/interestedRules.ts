export type ContactKind = "phone" | "email" | "telegram";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEGRAM = /^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
const TELEGRAM_LINK = /^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/[a-zA-Z][a-zA-Z0-9_]{4,31}\/?$/i;
const PHONE = /^[+\d\s().-]+$/;

export function easternDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

export function easternDateString(now = new Date()) {
  const today = easternDate(now);
  const month = String(today.month).padStart(2, "0");
  const day = String(today.day).padStart(2, "0");
  return `${today.year}-${month}-${day}`;
}

export function yearsOld(dob: string, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const born = new Date(Date.UTC(y, m - 1, d));
  if (born.getUTCFullYear() !== y || born.getUTCMonth() !== m - 1 || born.getUTCDate() !== d) return null;
  const today = easternDate(now);
  let age = today.year - y;
  if (today.month < m || (today.month === m && today.day < d)) age -= 1;
  return age;
}

export function contactKind(value: string): ContactKind | null {
  const text = value.trim();
  if (text.length < 5 || text.length > 120) return null;
  if (EMAIL.test(text)) return "email";
  if (TELEGRAM.test(text) || TELEGRAM_LINK.test(text)) return "telegram";
  const digits = text.replace(/\D/g, "");
  if (PHONE.test(text) && digits.length >= 10 && digits.length <= 15) return "phone";
  return null;
}

export function applicationScore(input: { why: string; photo: string }) {
  const parts = [
    { label: "Why me", hit: input.why.trim().length >= 40 },
    { label: "A photo", hit: input.photo.trim().length > 0 },
  ];
  return { points: parts.filter((part) => part.hit).length, of: parts.length, parts };
}
