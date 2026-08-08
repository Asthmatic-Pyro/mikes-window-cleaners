import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { PopupId } from "@/components/SitePopups";

interface HeaderProps {
  onGetQuote: () => void;
  onOpen: (id: PopupId) => void;
}

const navItems: { id: PopupId; label: string }[] = [
  { id: "why", label: "Why Clean" },
  { id: "services", label: "Services" },
  { id: "about", label: "About Mike" },
  { id: "quote", label: "Get a Quote" },
];

export default function Header({ onGetQuote, onOpen }: HeaderProps) {
  const [open, setOpen] = useState(false);

  const handleNav = (id: PopupId) => {
    setOpen(false);
    onOpen(id);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/40 bg-white/55 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#top" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-wash text-white shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <rect x="4" y="5" width="12" height="14" stroke="currentColor" strokeWidth="1.8" />
              <path d="M10 5v14M4 12h12" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16 4l3 2.5-1.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">
            Mike&apos;s Window Cleaners
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </button>
          ))}
          <a
            href="tel:+15136284128"
            className="text-sm font-semibold text-primary transition-colors hover:underline"
          >
            (513) 628-4128
          </a>
          <button type="button" onClick={onGetQuote} className="btn-primary py-2.5 text-sm">
            Book Now
          </button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <a
            href="tel:+15136284128"
            className="rounded-md border border-border bg-white/70 px-2.5 py-2 text-xs font-semibold text-primary"
            aria-label="Call (513) 628-4128"
          >
            Call
          </a>
          <button type="button" onClick={onGetQuote} className="btn-primary py-2 text-sm">
            Book
          </button>
          <button
            type="button"
            className="rounded-md border border-border bg-white/70 p-2"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/50 bg-white/90 backdrop-blur-md md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-primary"
                onClick={() => handleNav(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
