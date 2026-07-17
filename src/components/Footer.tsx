export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-foreground text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-12 text-center">
        <p className="font-display text-2xl font-bold">Mike&apos;s Window Cleaners</p>
        <p className="max-w-md text-sm text-white/65">
          Professional window washing by Mike Galioto — residential, commercial, and everything in between.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
          <a href="#why" className="hover:text-white">
            Why Clean
          </a>
          <a href="#services" className="hover:text-white">
            Services
          </a>
          <a href="#about" className="hover:text-white">
            About Mike
          </a>
          <a href="#quote" className="hover:text-white">
            Get a Quote
          </a>
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
