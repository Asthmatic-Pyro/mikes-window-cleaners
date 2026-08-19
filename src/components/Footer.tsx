import { Link } from "react-router-dom";
import { LINKTREE_URL } from "@/lib/links";
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
    <footer className="border-t border-border/40 bg-[hsl(210_40%_8%)] text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-14 text-center">
        <p className="font-display text-2xl font-bold tracking-tight">Mike&apos;s Window Cleaners</p>
        <p className="max-w-md text-sm leading-relaxed text-white/60">
          Traveling one-time window cleans by Mike Galioto — gear in the Geo Metro, storefronts and commercial glass. No
          ladders. Greater Cincinnati / 513 area.
        </p>
        <a href="tel:+15136284128" className="text-sm font-semibold text-white transition-colors hover:text-white/80">
          (513) 628-4128
        </a>
        <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-white/65">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => (item.id === "quote" ? onGetQuote() : onOpen(item.id))}
              className="transition-colors hover:text-white"
            >
              {item.label}
            </button>
          ))}
          <Link to="/Follow" className="transition-colors hover:text-white">
            Follow Mike
          </Link>
          <a
            href={LINKTREE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            Linktree
          </a>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Mike&apos;s Window Cleaners. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
