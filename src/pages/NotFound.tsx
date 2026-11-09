import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SitePopups, { type PopupId } from "@/components/SitePopups";

export default function NotFoundPage() {
  const [popup, setPopup] = useState<PopupId | null>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = "This pane is empty — Mike's Window Cleaners";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <Header onOpen={setPopup} onGetQuote={() => setPopup("quote")} />
      <main className="mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center px-4 pb-8 pt-28 text-center">
        <div
          className="relative mb-8 h-56 w-full max-w-sm overflow-hidden rounded-md border-[10px] border-white/80 bg-[linear-gradient(160deg,hsl(286_36%_42%),hsl(286_32%_22%))] shadow-[0_24px_60px_-28px_hsl(286_44%_20%/0.55)]"
          aria-hidden
        >
          <div className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 bg-white/80" />
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-white/80" />
          <p className="absolute inset-0 grid place-items-center font-display text-7xl font-bold tracking-tight text-white/90">
            404
          </p>
          <div className="not-found-wipe absolute inset-y-4 w-[46%] border-r-[6px] border-[#e8a85c] bg-gradient-to-r from-transparent to-white/25">
            <span className="absolute -right-3 top-2 h-7 w-4 rounded-sm bg-[#f2d3a4]" />
          </div>
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Mike&apos;s Window Cleaners</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">This pane is empty</h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">
          Mike checked the glass. This address isn&apos;t on the route — the squeegee came up clean.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="btn-primary">
            Back to the shop
          </Link>
          <button type="button" className="btn-secondary" onClick={() => setPopup("quote")}>
            Get a quote
          </button>
          <Link to="/follow" className="btn-secondary">
            Follow the trip
          </Link>
        </div>
      </main>
      <Footer onOpen={setPopup} onGetQuote={() => setPopup("quote")} />
      <SitePopups active={popup} onClose={() => setPopup(null)} onOpenQuote={() => setPopup("quote")} />
    </div>
  );
}
