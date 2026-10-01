"use client";

import Reveal from "@/components/ui/Reveal";
import { useTranslations } from "@/i18n/LocaleProvider";

/**
 * "Qui sommes-nous" / "About us" (2026-09-30): the two co-founders, Chedlia
 * Belhaj and Sarra Dhaouadi, with the bios Sarra wrote. Its own band just
 * before the FAQ, deepening the quote section's turquoise into dark teal;
 * the starry FAQ fades in below it. No photos (Sarra's choice): each card opens
 * on an initials badge.
 */
export default function About() {
  const t = useTranslations();
  return (
    <section className="section about" id="about">
      <div className="wrap">
        <Reveal className="about-head">
          <span className="section-kicker">{t.about.kicker}</span>
          <h2>{t.about.title}</h2>
        </Reveal>

        <div className="about-grid">
          {t.about.people.map((person, index) => (
            <Reveal key={person.name} delay={index * 0.14} variant="fly">
              <div className="about-card glass">
                <div className="about-top">
                  <span className="about-avatar" aria-hidden="true">
                    {person.initials}
                  </span>
                  <div>
                    <h3 className="about-name">{person.name}</h3>
                    <span className="about-role">{person.role}</span>
                  </div>
                </div>
                <div className="about-bio">
                  {person.bio.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
