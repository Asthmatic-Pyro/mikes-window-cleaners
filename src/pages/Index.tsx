import { useCallback, useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WhySection from "@/components/WhySection";
import ServicesSection from "@/components/ServicesSection";
import AboutSection from "@/components/AboutSection";
import QuoteSection from "@/components/QuoteSection";
import Footer from "@/components/Footer";
import SitePopups, { type PopupId } from "@/components/SitePopups";

export default function Index() {
  const [popup, setPopup] = useState<PopupId | null>(null);

  const openPopup = useCallback((id: PopupId) => setPopup(id), []);
  const closePopup = useCallback(() => setPopup(null), []);
  const openQuote = useCallback(() => setPopup("quote"), []);

  return (
    <div className="relative min-h-screen">
      <Header onOpen={openPopup} onGetQuote={openQuote} />
      <main>
        <HeroSection onGetQuote={openQuote} onSeeServices={() => openPopup("services")} />
        <WhySection onLearnMore={() => openPopup("why")} onGetQuote={openQuote} />
        <ServicesSection onLearnMore={() => openPopup("services")} onGetQuote={openQuote} />
        <AboutSection onLearnMore={() => openPopup("about")} onGetQuote={openQuote} />
        <QuoteSection onGetQuote={openQuote} />
      </main>
      <Footer onOpen={openPopup} onGetQuote={openQuote} />
      <SitePopups active={popup} onClose={closePopup} onOpenQuote={openQuote} />
    </div>
  );
}
