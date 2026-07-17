import { useCallback } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WhySection from "@/components/WhySection";
import ServicesSection from "@/components/ServicesSection";
import AboutSection from "@/components/AboutSection";
import QuoteSection from "@/components/QuoteSection";
import Footer from "@/components/Footer";

export default function Index() {
  const scrollToQuote = useCallback(() => {
    document.getElementById("quote")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="relative min-h-screen">
      <Header onGetQuote={scrollToQuote} />
      <main>
        <HeroSection onGetQuote={scrollToQuote} />
        <WhySection />
        <ServicesSection />
        <AboutSection />
        <QuoteSection />
      </main>
      <Footer />
    </div>
  );
}
