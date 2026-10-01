"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import Image from "next/image";
import clsx from "clsx";
import { useTranslations } from "@/i18n/LocaleProvider";
import LocaleSwitcher from "./LocaleSwitcher";
import CartMenu from "./CartMenu";
import { useActiveSection, type SectionRange } from "@/hooks/useActiveSection";
import { useDockMagnify } from "@/hooks/useDockMagnify";

/** Link targets are locale-independent (they are same-page anchors); only
 *  the visible label is translated, keyed by `key` into nav.links. */
const LINKS = [
  { href: "#services", key: "services" },
  // "Tarifs" goes to the four packs (#packs); "Services" to the Services
  // section (#services). Both used to land in the Services section.
  { href: "#packs", key: "pricing" },
  { href: "#work", key: "work" },
  { href: "#about", key: "about" },
  { href: "#faq", key: "faq" },
] as const;

/** The page area each nav item stands for, used to light up the item for
 *  the section on screen. "Nos références" covers its own section plus the
 *  carousel and the AI ads that follow it (one block since 2026-09-25). */
const SECTIONS: readonly SectionRange[] = [
  { href: "#services", from: "pricing" },
  { href: "#packs", from: "packs" },
  { href: "#work", from: "work", to: "ai-commercials" },
  { href: "#about", from: "about" },
  { href: "#faq", from: "faq" },
  { href: "#contact", from: "contact" },
];

export default function SiteNav() {
  const t = useTranslations();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  // Only a click selects a menu item (Sarra, 2026-09-26); it stays on the
  // last item clicked. The section ranges are kept so scroll tracking can
  // be switched back on with followScroll.
  const [active, select] = useActiveSection(SECTIONS, { followScroll: false });
  // Dock-style pop (Sarra, 2026-09-26): a clicked item jumps forward like an
  // icon in the macOS Dock, overshoots a touch, then settles back to its
  // normal size while staying selected (white rim + glow in CSS). Web
  // Animations API, transform only, so nothing around it moves; it runs over
  // framer-motion's inline transform on the phone panel without a fight.
  // Skipped under reduced motion.
  const reduceMotion = useReducedMotion();
  const pop = (el: HTMLElement) => {
    if (reduceMotion || typeof el.animate !== "function") return;
    const DURATION = 480;
    el.style.zIndex = "2";
    // One easing per step (the timeline itself is linear): a quick rise to
    // the peak (~180ms), a smooth dip just under normal size, a soft settle.
    el.animate(
      [
        { transform: "translateY(0) scale(1)", easing: "cubic-bezier(.2, .8, .3, 1)" },
        { transform: "translateY(-5px) scale(1.24)", offset: 0.38, easing: "cubic-bezier(.45, 0, .55, 1)" },
        { transform: "translateY(0) scale(0.97)", offset: 0.72, easing: "cubic-bezier(.3, 0, .3, 1)" },
        { transform: "translateY(0) scale(1)" },
      ],
      { duration: DURATION, easing: "linear" }
    );
    // Back to its normal layer once the pop is over.
    window.setTimeout(() => {
      el.style.zIndex = "";
    }, DURATION + 40);
  };
  // Desktop row: Dock-style magnification on hover/focus plus a click
  // bounce (useDockMagnify). The phone panel keeps `pop` above.
  const dockRow = useRef<HTMLDivElement>(null);
  const dockPop = useDockMagnify(dockRow, !reduceMotion);
  const activeProps = (href: string) => ({
    "aria-current": active === href ? ("location" as const) : undefined,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      select(href);
      dockPop(event.currentTarget);
    },
  });
  // Phone panel: the panel closes on tap, so the pop plays first and the
  // panel closes and scrolls to the section a beat later. Same destination
  // and the same #hash in the address bar as a plain link.
  const PANEL_DELAY = 240;
  const panelClick = (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    select(href);
    if (reduceMotion) {
      setOpen(false);
      return;
    }
    event.preventDefault();
    pop(event.currentTarget);
    window.setTimeout(() => {
      setOpen(false);
      history.replaceState(null, "", href);
      // After React has closed the panel (and released the body scroll lock).
      window.setTimeout(() => document.querySelector(href)?.scrollIntoView({ behavior: "smooth" }), 0);
    }, PANEL_DELAY);
  };

  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > 24);
  });

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <nav className={clsx("nav", scrolled && "nav-scrolled")} aria-label={t.nav.ariaLabel}>
      <div className="wrap nav-inner">
        <a className="brand" href="#top" aria-label={t.nav.brandHome}>
          {/* Full lockup — it already contains the wordmark and tagline, so
              it replaces both the old icon and the "LevelUp AI" text. The
              anchor carries the accessible name.
              Sarra's new lockup (2026-09-29): "LEVEL UP | AI", navy
              wordmark with violet bars and "AI", tagline underneath. Drawn
              dark-on-white, so it sits on the nav's white plate. Cropped
              copy of `level up ai/logo LevelupAI/logo level up AI.png`;
              the previous logo is still in public/LEVEL_UP_AI.png. */}
          <Image
            className="brand-logo"
            src="/LEVEL_UP_AI_2026-09-29.png"
            alt=""
            width={1999}
            height={377}
            priority
          />
        </a>

        <div className="nav-links nav-links-desktop nav-dock" ref={dockRow}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className={clsx(active === link.href && "is-active")} {...activeProps(link.href)}>
              {t.nav.links[link.key]}
            </a>
          ))}
          <a className={clsx("nav-cta", active === "#contact" && "is-active")} href="#contact" {...activeProps("#contact")}>
            {t.nav.cta}
          </a>
        </div>

        <div className="nav-tools">
          {/* First in .nav-tools: on desktop it sits between the CTA and the
              language switch, and on phones it stays visible next to it. */}
          <CartMenu />
          <LocaleSwitcher />
          <button
            className="menu-button"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="nav-links-mobile glass"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {LINKS.map((link, index) => (
              <motion.a
                key={link.href}
                href={link.href}
                className={clsx(active === link.href && "is-active")}
                aria-current={active === link.href ? "location" : undefined}
                onClick={panelClick(link.href)}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.35 }}
              >
                {t.nav.links[link.key]}
              </motion.a>
            ))}
            <motion.a
              className={clsx("nav-cta", active === "#contact" && "is-active")}
              href="#contact"
              aria-current={active === "#contact" ? "location" : undefined}
              onClick={panelClick("#contact")}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * LINKS.length, duration: 0.35 }}
            >
              {t.nav.cta}
            </motion.a>
            <motion.div
              className="nav-mobile-locale"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * (LINKS.length + 1), duration: 0.35 }}
            >
              <LocaleSwitcher onSwitch={() => setOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
