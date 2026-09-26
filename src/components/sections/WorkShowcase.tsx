import VideoSlot from "@/components/media/VideoSlot";
import GlassCard from "@/components/ui/GlassCard";
import Reveal from "@/components/ui/Reveal";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";

export default async function WorkShowcase({ lang }: { lang: string }) {
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);

  return (
    <section className="section section-vivid section-vivid-work" id="work" style={{ paddingTop: 10 }}>
      <div className="wrap">
        <Reveal className="section-head">
          <div>
            <span className="section-kicker">{t.work.kicker}</span>
            <h2>{t.work.title}</h2>
          </div>
          <p className="section-lead">{t.work.lead}</p>
        </Reveal>

        <div className="work-grid">
          <Reveal as="article">
            <GlassCard className="work-card" tilt={false}>
              <span className="work-tag">{t.work.websiteTag}</span>
              <div className="website-showcase">
                <div className="website-window">
                  <div className="website-window-top"></div>
                  <div className="website-window-body">
                    <strong>{t.work.mockupEyebrow}</strong>
                    <h4>{t.work.mockupTitle}</h4>
                    <div className="website-lines"><span></span><span></span><span></span></div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal as="article" delay={0.1}>
            <GlassCard className="work-card" tilt={false}>
              <span className="work-tag">{t.work.commercialTag}</span>
              <VideoSlot
                className="video-showcase"
                src="/videos/product-commercial.mp4"
                fallback={
                  <div className="video-product">
                    {t.work.productFallback[0]}<br />{t.work.productFallback[1]}
                  </div>
                }
              />
            </GlassCard>
          </Reveal>

          <Reveal as="article" delay={0.18}>
            <GlassCard className="work-card" tilt={false}>
              <VideoSlot
                className="work-video-showcase"
                src="/videos/new/14.mp4"
                fallback={<div className="work-video-fallback" />}
              />
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
