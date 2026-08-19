import type { SiteSettings } from "./types";

export const STREAM_ELEMENTS_DEFAULT = "https://streamelements.com/AzmaticPyro/tip";

export type PayMethod = "streamelements" | "cashapp" | "bmc";

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

export function availablePayMethods(settings: SiteSettings | null): PayMethod[] {
  const methods: PayMethod[] = [];
  if (withHttps(settings?.streamelements_url || STREAM_ELEMENTS_DEFAULT)) methods.push("streamelements");
  if (settings?.cash_app_tag || settings?.cash_app_url) methods.push("cashapp");
  if (settings?.buy_me_a_coffee_url) methods.push("bmc");
  return methods;
}

export function checkoutUrl(method: PayMethod, settings: SiteSettings | null, amount: number): string {
  if (method === "streamelements") {
    return withHttps(settings?.streamelements_url || STREAM_ELEMENTS_DEFAULT);
  }
  if (method === "cashapp") {
    return cashAppPayUrl(settings?.cash_app_tag ?? "", settings?.cash_app_url ?? "", amount);
  }
  return withHttps(settings?.buy_me_a_coffee_url ?? "");
}

export function payMethodLabel(method: PayMethod): string {
  if (method === "streamelements") return "StreamElements";
  if (method === "cashapp") return "Cash App";
  return "Buy Me a Coffee";
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
