import { useCallback, useState } from "react";
import Header from "@/components/Header";
import GiveawayHeader from "@/components/GiveawayHeader";
import HeroSection from "@/components/HeroSection";
import WhySection from "@/components/WhySection";
import ServicesSection from "@/components/ServicesSection";
import ImageStrip from "@/components/ImageStrip";
import AboutSection from "@/components/AboutSection";
import FollowShoutSection from "@/components/FollowShoutSection";
import TestimonialsStrip from "@/components/TestimonialsStrip";
import LawsTicker from "@/components/LawsTicker";
import QuoteSection from "@/components/QuoteSection";
import Footer from "@/components/Footer";
import SitePopups, { type PopupId } from "@/components/SitePopups";
import TripUpdatesPopup from "@/components/TripUpdatesPopup";

export default function Index() {
  const [popup, setPopup] = useState<PopupId | null>(null);

  const openPopup = useCallback((id: PopupId) => setPopup(id), []);
  const closePopup = useCallback(() => setPopup(null), []);
  const openQuote = useCallback(() => setPopup("quote"), []);

  return (
    <div className="relative min-h-screen">
      <Header onOpen={openPopup} onGetQuote={openQuote} />
      <main>
        <GiveawayHeader />
        <FollowShoutSection />
        <HeroSection onGetQuote={openQuote} onSeeServices={() => openPopup("services")} />
        <WhySection onLearnMore={() => openPopup("why")} onGetQuote={openQuote} />
        <ServicesSection onLearnMore={() => openPopup("services")} onGetQuote={openQuote} />
        <ImageStrip />
        <AboutSection onLearnMore={() => openPopup("about")} onGetQuote={openQuote} />
        <TestimonialsStrip />
        <LawsTicker />
        <QuoteSection />
      </main>
      <Footer onOpen={openPopup} onGetQuote={openQuote} />
      <SitePopups active={popup} onClose={closePopup} onOpenQuote={openQuote} />
      <TripUpdatesPopup />
    </div>
  );
}
