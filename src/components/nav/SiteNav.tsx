"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import Image from "next/image";
import clsx from "clsx";
import { useTranslations } from "@/i18n/LocaleProvider";
import LocaleSwitcher from "./LocaleSwitcher";

/** Link targets are locale-independent (they are same-page anchors); only
 *  the visible label is translated, keyed by `key` into nav.links. */
const LINKS = [
  { href: "#services", key: "services" },
  { href: "#pricing", key: "pricing" },
  { href: "#work", key: "work" },
  { href: "#process", key: "process" },
  { href: "#faq", key: "faq" },
] as const;

export default function SiteNav() {
  const t = useTranslations();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

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
              This is the master artwork (dark navy wordmark, violet "AI"
              and swoosh), not the all-violet BRAND recolour the footer
              still uses: the nav lockup now sits on a white plate, where
              the master's own dark-on-light contrast is what it was drawn
              for. The footer stays on BRAND because it sits on a dark
              ground, where a navy wordmark would disappear. */}
          <Image
            className="brand-logo"
            src="/LEVEL_UP_AI.png"
            alt=""
            width={1150}
            height={365}
            priority
          />
        </a>

        <div className="nav-links nav-links-desktop">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {t.nav.links[link.key]}
            </a>
          ))}
          <a className="nav-cta" href="#contact">
            {t.nav.cta}
          </a>
        </div>

        <div className="nav-tools">
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
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.35 }}
              >
                {t.nav.links[link.key]}
              </motion.a>
            ))}
            <motion.a
              className="nav-cta"
              href="#contact"
              onClick={() => setOpen(false)}
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
