import type { PopupId } from "@/components/SitePopups";

type FooterProps = {
  onOpen: (id: PopupId) => void;
  onGetQuote: () => void;
};

const navItems: { id: PopupId; label: string }[] = [
  { id: "why", label: "Why Clean" },
  { id: "services", label: "Services" },
  { id: "about", label: "About Mike" },
  { id: "quote", label: "Get a Quote" },
];

export default function Footer({ onOpen, onGetQuote }: FooterProps) {
  return (
    <footer className="border-t border-border/60 bg-foreground text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-12 text-center">
        <p className="font-display text-2xl font-bold">Mike&apos;s Window Cleaners</p>
        <p className="max-w-md text-sm text-white/65">
          Traveling one-time window cleans by Mike Galioto — gear in the Geo Metro, storefronts and commercial glass. No ladders.
        </p>
        <a href="tel:+15136284128" className="text-sm font-semibold text-white hover:underline">
          (513) 628-4128
        </a>
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => (item.id === "quote" ? onGetQuote() : onOpen(item.id))}
              className="hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-white/45">
          © {new Date().getFullYear()} Mike&apos;s Window Cleaners. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
