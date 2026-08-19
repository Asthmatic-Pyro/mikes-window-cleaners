import { Coffee, CreditCard, Gift, Mail, Send, Wallet } from "lucide-react";
import { STREAM_ELEMENTS_DEFAULT, VENMO_DEFAULT, withHttps } from "@/lib/follow/payments";
import type { SiteSettings } from "@/lib/follow/types";

type SupportSectionProps = {
  settings: SiteSettings | null;
};

export default function SupportSection({ settings }: SupportSectionProps) {
  const links = [
    {
      key: "se",
      label: "StreamElements",
      href: withHttps(settings?.streamelements_url || STREAM_ELEMENTS_DEFAULT),
      icon: CreditCard,
      hint: "Card or PayPal tip",
    },
    {
      key: "bmc",
      label: "Buy Me a Coffee",
      href: withHttps(settings?.buy_me_a_coffee_url ?? ""),
      icon: Coffee,
      hint: "Tip or support the trip",
    },
    {
      key: "cash",
      label: settings?.cash_app_tag ? `Cash App ${settings.cash_app_tag}` : "Cash App",
      href: withHttps(settings?.cash_app_url ?? ""),
      icon: Wallet,
      hint: "Send a tip directly",
    },
    {
      key: "venmo",
      label: settings?.venmo_tag ? `Venmo @${settings.venmo_tag.replace(/^@/, "")}` : "Venmo",
      href: withHttps(settings?.venmo_url || VENMO_DEFAULT),
      icon: Send,
      hint: "Send a Venmo",
    },
    {
      key: "amazon",
      label: "Amazon wishlist",
      href: withHttps(settings?.amazon_wishlist_url ?? ""),
      icon: Gift,
      hint: "Buy something from the list",
    },
  ].filter((l) => l.href);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">Support the trip</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tip, wishlist, or mailbox — optional ways to help along the route.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.length === 0 && (
          <p className="text-sm text-muted-foreground sm:col-span-2">Support links will appear here soon.</p>
        )}
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.key}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-1 rounded-md border border-white/60 bg-white/55 px-3 py-3 transition-colors hover:border-primary/35"
            >
              <span className="inline-flex items-center gap-2 font-semibold text-foreground">
                <Icon className="h-4 w-4 text-primary" />
                {link.label}
              </span>
              <span className="text-xs text-muted-foreground">{link.hint}</span>
            </a>
          );
        })}
      </div>

      {(settings?.mailbox_address || settings?.mailbox_notes) && (
        <div className="rounded-md border border-white/60 bg-white/55 px-4 py-3">
          <h3 className="inline-flex items-center gap-2 font-display text-lg font-bold">
            <Mail className="h-4 w-4 text-primary" />
            Virtual mailbox
          </h3>
          {settings.mailbox_address && (
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
              {settings.mailbox_address}
            </pre>
          )}
          {settings.mailbox_notes && (
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{settings.mailbox_notes}</p>
          )}
        </div>
      )}
    </section>
  );
}
