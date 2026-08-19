import type { SiteSettings } from "./types";

export const STREAM_ELEMENTS_DEFAULT = "https://streamelements.com/AzmaticPyro/tip";
export const VENMO_DEFAULT = "https://venmo.com/code?user_id=2547061744467968068&created=1787179474";
export const VENMO_TAG_DEFAULT = "Michael-Pyro";

export type PayMethod = "streamelements" | "cashapp" | "venmo" | "bmc";

export function withHttps(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function cashAppPayUrl(tag: string, fallbackUrl: string, amount: number): string {
  const fromTag = tag.trim().replace(/^\$/, "");
  const fromUrl = fallbackUrl.match(/cash\.app\/\$?([^/?#]+)/i)?.[1]?.replace(/^\$/, "") ?? "";
  const handle = fromTag || fromUrl;
  if (!handle) return withHttps(fallbackUrl);
  const dollars = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `https://cash.app/$${handle}/${dollars}`;
}

export function venmoPayUrl(tag: string, fallbackUrl: string, amount: number, note?: string): string {
  const handle = tag.trim().replace(/^@/, "") || VENMO_TAG_DEFAULT;
  if (handle) {
    const params = new URLSearchParams({
      txn: "pay",
      audience: "public",
      recipients: handle,
      amount: Number.isInteger(amount) ? String(amount) : amount.toFixed(2),
    });
    if (note?.trim()) params.set("note", note.trim());
    return `https://account.venmo.com/pay?${params.toString()}`;
  }
  return withHttps(fallbackUrl || VENMO_DEFAULT);
}

export function availablePayMethods(settings: SiteSettings | null): PayMethod[] {
  const methods: PayMethod[] = [];
  if (withHttps(settings?.streamelements_url || STREAM_ELEMENTS_DEFAULT)) methods.push("streamelements");
  if (settings?.cash_app_tag || settings?.cash_app_url) methods.push("cashapp");
  if (settings?.venmo_url || settings?.venmo_tag || VENMO_DEFAULT) methods.push("venmo");
  if (settings?.buy_me_a_coffee_url) methods.push("bmc");
  return methods;
}

export function checkoutUrl(
  method: PayMethod,
  settings: SiteSettings | null,
  amount: number,
  note?: string,
): string {
  if (method === "streamelements") {
    return withHttps(settings?.streamelements_url || STREAM_ELEMENTS_DEFAULT);
  }
  if (method === "cashapp") {
    return cashAppPayUrl(settings?.cash_app_tag ?? "", settings?.cash_app_url ?? "", amount);
  }
  if (method === "venmo") {
    return venmoPayUrl(
      settings?.venmo_tag || VENMO_TAG_DEFAULT,
      settings?.venmo_url || VENMO_DEFAULT,
      amount,
      note,
    );
  }
  return withHttps(settings?.buy_me_a_coffee_url ?? "");
}

export function payMethodLabel(method: PayMethod): string {
  if (method === "streamelements") return "StreamElements";
  if (method === "cashapp") return "Cash App";
  if (method === "venmo") return "Venmo";
  return "Buy Me a Coffee";
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
