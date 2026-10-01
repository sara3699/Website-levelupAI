import SiteNav from "@/components/nav/SiteNav";
import CustomCursor from "@/components/ui/CustomCursor";
import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import Services from "@/components/sections/Services";
import Pricing from "@/components/sections/Pricing";
import WorkShowcase from "@/components/sections/WorkShowcase";
import VideoCarousel from "@/components/sections/VideoCarousel";
import AICommercials from "@/components/sections/AICommercials";
import QuoteBox from "@/components/sections/QuoteBox";
import Faq from "@/components/sections/Faq";
import Contact from "@/components/sections/Contact";
import ClosingArea from "@/components/sections/ClosingArea";
import Footer from "@/components/sections/Footer";
import ChatWidget from "@/components/chat/ChatWidget";

/** Server sections take `lang` and load the dictionary directly; client
 *  sections read it from LocaleProvider (set in the layout) instead. */
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <>
      <div className="grain-overlay" aria-hidden="true"></div>
      <CustomCursor />
      <SiteNav />
      <main id="top">
        <Hero />
        <Marquee lang={lang} />
        <Services lang={lang} />
        <Pricing lang={lang} />
        <WorkShowcase lang={lang} />
        <VideoCarousel />
        <AICommercials />
        {/* ProcessTimeline ("Notre méthode") removed from the page on
            2026-09-25 at Sarra's request; the component and its texts are
            kept, and the chat assistant still describes the four steps. */}
        <QuoteBox />
        <ClosingArea>
          <Faq />
          <Contact lang={lang} />
        </ClosingArea>
      </main>
      <Footer lang={lang} />
      <ChatWidget />
    </>
  );
}
