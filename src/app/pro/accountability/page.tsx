"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import Link from "next/link";

/**
 * Pro accountability handbook page (`/pro/accountability`).
 *
 * Editorial / magazine-spread treatment - intentionally NOT a generic
 * SaaS dashboard. The page is the marketing surface that justifies
 * the SLA system to two audiences: (1) prospective pros considering
 * joining, who need to see that the marketplace takes reliability
 * seriously; (2) existing pros who just got a warning notification
 * and want to understand what's happening.
 *
 * Aesthetic decisions:
 *
 *   - Display: Fraunces. Optical-size-aware serif with strong character
 *     without being baroque. Picked over Cormorant / Playfair because
 *     it stays readable at body weights and reads "Tbilisi atelier"
 *     not "Brooklyn coffee shop".
 *   - Body: Manrope. Geometric grotesque with warm shoulders, pairs
 *     cleanly with Fraunces, less overused than Inter/Söhne.
 *   - Mono: IBM Plex Mono. Refined slab-mono for numerals and labels.
 *
 *   - Cream + ink + terracotta. Warm cream paper (#FAF5EC) replaces
 *     the default white so the page feels printed, not screened. Body
 *     text is a warm near-black (#15110C) rather than pure black.
 *     Single accent: existing brand terracotta (#EF4E24). No purple
 *     gradients. No dashboard-blue.
 *
 *   - Asymmetric layout. The four standards spread across an offset
 *     grid; the ladder is a horizontal three-card progression with
 *     decreasing warmth; the away section is a wide pull-quote panel;
 *     the exemptions are a two-column block; recovery is a single
 *     centered statement; the CTAs are three understated mono links.
 *
 *   - Motion. Hero copy fades + rises on mount, staggered. Hover on
 *     CTAs reveals a small arrow. No scroll-triggered choreography -
 *     editorial pages reward stillness.
 *
 *   - Locale-aware display swap. Georgian copy uses the same Fraunces
 *     fallback chain (the font ships with Cyrillic/Latin only), so
 *     Georgian script falls through to the system's BPG/Sylfaen via
 *     the `font-feature-settings` chain. Roman numeral section dividers
 *     stay in Fraunces regardless of locale.
 */

const NUMERIC_FORMAT = "01";

export default function ProAccountabilityPage() {
  const { t } = useLanguage();

  return (
    <>
      <main className="hm-acct">
        {/* Top thin nav. Single back link in mono; no header bar at
            all so the hero composition isn't cropped from above. */}
        <nav className="hm-acct__nav">
          <Link href="/my-space" className="hm-acct__back">
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{t("proAccountability.back")}</span>
          </Link>
          <span className="hm-acct__nav-folio">Homico / Pro Handbook</span>
        </nav>

        {/* ────── Hero ────── */}
        <section className="hm-acct__hero">
          <div className="hm-acct__hero-folio" aria-hidden="true">
            01
          </div>
          <p className="hm-acct__eyebrow">{t("proAccountability.heroEyebrow")}</p>
          <h1 className="hm-acct__title hm-acct__title--lead">
            {t("proAccountability.heroTitle")}
          </h1>
          <p className="hm-acct__standfirst">
            {t("proAccountability.heroStandfirst")}
          </p>

          {/* Hairline rule with the publication date - editorial flourish */}
          <div className="hm-acct__hero-rule">
            <span className="hm-acct__mono-tag">EDITION 2026.05</span>
            <span className="hm-acct__hairline" />
            <span className="hm-acct__mono-tag">EST. TBILISI</span>
          </div>
        </section>

        {/* ────── Section 01 - Standards ────── */}
        <section className="hm-acct__section hm-acct__section--standards">
          <header className="hm-acct__section-head">
            <span className="hm-acct__chapter">§ 01</span>
            <p className="hm-acct__eyebrow">{t("proAccountability.standardsEyebrow")}</p>
            <h2 className="hm-acct__title">{t("proAccountability.standardsTitle")}</h2>
          </header>

          <div className="hm-acct__standards">
            <Standard
              n="i"
              label={t("proAccountability.bookingAcceptLabel")}
              window={t("proAccountability.bookingAcceptWindow")}
              body={t("proAccountability.bookingAcceptBody")}
              offset="up"
            />
            <Standard
              n="ii"
              label={t("proAccountability.chatReplyLabel")}
              window={t("proAccountability.chatReplyWindow")}
              body={t("proAccountability.chatReplyBody")}
              offset="down"
            />
            <Standard
              n="iii"
              label={t("proAccountability.directInviteLabel")}
              window={t("proAccountability.directInviteWindow")}
              body={t("proAccountability.directInviteBody")}
              offset="up"
            />
            <Standard
              n="iv"
              label={t("proAccountability.profileLabel")}
              window={t("proAccountability.profileWindow")}
              body={t("proAccountability.profileBody")}
              offset="down"
            />
          </div>
        </section>

        {/* ────── Section 02 - The ladder ────── */}
        <section className="hm-acct__section hm-acct__section--ladder">
          <header className="hm-acct__section-head">
            <span className="hm-acct__chapter">§ 02</span>
            <p className="hm-acct__eyebrow">{t("proAccountability.ladderEyebrow")}</p>
            <h2 className="hm-acct__title">{t("proAccountability.ladderTitle")}</h2>
            <p className="hm-acct__lede">{t("proAccountability.ladderLede")}</p>
          </header>

          <ol className="hm-acct__ladder">
            <Step
              n="1"
              tone="warning"
              label={t("proAccountability.step1Label")}
              title={t("proAccountability.step1Title")}
              body={t("proAccountability.step1Body")}
            />
            <Step
              n="2"
              tone="demoted"
              label={t("proAccountability.step2Label")}
              title={t("proAccountability.step2Title")}
              body={t("proAccountability.step2Body")}
            />
            <Step
              n="3"
              tone="paused"
              label={t("proAccountability.step3Label")}
              title={t("proAccountability.step3Title")}
              body={t("proAccountability.step3Body")}
            />
          </ol>
        </section>

        {/* ────── Section 03 - Away ────── */}
        <section className="hm-acct__section hm-acct__section--away">
          <div className="hm-acct__away-card">
            <span className="hm-acct__chapter hm-acct__chapter--away">§ 03</span>
            <blockquote className="hm-acct__pull">
              {t("proAccountability.awayPull")}
            </blockquote>
            <p className="hm-acct__away-body">{t("proAccountability.awayBody")}</p>
          </div>
          <span className="hm-acct__away-glyph" aria-hidden="true">
            ◐
          </span>
        </section>

        {/* ────── Section 04 - Exempt ────── */}
        <section className="hm-acct__section hm-acct__section--exempt">
          <header className="hm-acct__exempt-head">
            <span className="hm-acct__chapter">§ 04</span>
            <p className="hm-acct__eyebrow">{t("proAccountability.exemptEyebrow")}</p>
            <h2 className="hm-acct__title hm-acct__title--exempt">
              {t("proAccountability.exemptTitle")}
            </h2>
          </header>

          <ul className="hm-acct__exempt-list">
            <li className="hm-acct__exempt-item">
              <span className="hm-acct__exempt-bullet" aria-hidden="true">
                01
              </span>
              <span>{t("proAccountability.exemptItem1")}</span>
            </li>
            <li className="hm-acct__exempt-item">
              <span className="hm-acct__exempt-bullet" aria-hidden="true">
                02
              </span>
              <span>{t("proAccountability.exemptItem2")}</span>
            </li>
            <li className="hm-acct__exempt-item">
              <span className="hm-acct__exempt-bullet" aria-hidden="true">
                03
              </span>
              <span>{t("proAccountability.exemptItem3")}</span>
            </li>
            <li className="hm-acct__exempt-item">
              <span className="hm-acct__exempt-bullet" aria-hidden="true">
                04
              </span>
              <span>{t("proAccountability.exemptItem4")}</span>
            </li>
          </ul>
        </section>

        {/* ────── Section 05 - Recovery ────── */}
        <section className="hm-acct__section hm-acct__section--recovery">
          <span className="hm-acct__chapter">§ 05</span>
          <p className="hm-acct__eyebrow">{t("proAccountability.recoveryEyebrow")}</p>
          <h2 className="hm-acct__title hm-acct__title--center">
            {t("proAccountability.recoveryTitle")}
          </h2>
          <p className="hm-acct__recovery-body">
            {t("proAccountability.recoveryBody")}
          </p>

          {/* Fourteen-dot calendar: one terracotta tick (the original
              miss), thirteen hollow circles (the clean stretch back). */}
          <div className="hm-acct__recovery-dots" aria-hidden="true">
            <span className="hm-acct__dot hm-acct__dot--miss" />
            {Array.from({ length: 13 }).map((_, i) => (
              <span key={i} className="hm-acct__dot" />
            ))}
          </div>
        </section>

        {/* ────── Footer CTA ────── */}
        <section className="hm-acct__section hm-acct__section--cta">
          <p className="hm-acct__eyebrow">{t("proAccountability.ctaEyebrow")}</p>
          <div className="hm-acct__cta-row">
            <CtaLink href="/settings">{t("proAccountability.ctaSchedule")}</CtaLink>
            <CtaLink href="/settings">{t("proAccountability.ctaAway")}</CtaLink>
            <CtaLink href="/help">{t("proAccountability.ctaSupport")}</CtaLink>
          </div>
          <div className="hm-acct__colophon">
            <span>HOMICO</span>
            <span className="hm-acct__hairline" />
            <span>{NUMERIC_FORMAT} / 05</span>
          </div>
        </section>
      </main>

      <style jsx>{`
        /* ─────────── Page-scoped editorial design system ─────────── */

        :global(:root) {
          --acct-paper: #faf5ec;
          --acct-paper-deep: #f1ead8;
          --acct-ink: #15110c;
          --acct-ink-soft: #4a4138;
          --acct-ink-mute: #8a7c6a;
          --acct-rule: #d6c9ad;
          --acct-accent: #ef4e24;
          --acct-accent-deep: #a92b08;
          --acct-warn: #d97706;
          --acct-paused: #b91c1c;
        }

        .hm-acct {
          background-color: var(--acct-paper);
          color: var(--acct-ink);
          min-height: 100vh;
          /* Soft warm vignettes over the paper ground. (A raw inline-SVG
             noise data-URI used to live here as a third layer, but its
             unescaped <svg>/quote characters broke the styled-jsx CSS
             parser - silently killing this rule and every rule after it,
             which collapsed the whole page to unstyled defaults.) */
          background-image:
            radial-gradient(
              ellipse at top left,
              rgba(239, 78, 36, 0.04),
              transparent 50%
            ),
            radial-gradient(
              ellipse at bottom right,
              rgba(169, 43, 8, 0.03),
              transparent 50%
            );
          font-family: var(--acct-body), -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 400;
          font-size: 17px;
          line-height: 1.6;
          letter-spacing: -0.005em;
        }

        /* ── Top nav ── */
        .hm-acct__nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px clamp(24px, 6vw, 72px);
          border-bottom: 1px solid var(--acct-rule);
        }

        .hm-acct__back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--acct-ink-soft);
          font-family: var(--acct-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.25s ease;
        }
        .hm-acct__back:hover {
          color: var(--acct-accent);
        }

        .hm-acct__nav-folio {
          font-family: var(--acct-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--acct-ink-mute);
        }

        /* ── Typography primitives ── */
        .hm-acct__eyebrow {
          font-family: var(--acct-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--acct-ink-mute);
          margin: 0 0 24px;
        }

        .hm-acct__title {
          font-family: var(--acct-display), "Sylfaen", Georgia, serif;
          font-weight: 500;
          font-style: normal;
          font-size: clamp(2.4rem, 5.5vw, 4.5rem);
          line-height: 0.98;
          letter-spacing: -0.03em;
          margin: 0;
          color: var(--acct-ink);
          /* Fraunces variable-optical-size axis - tighter at display */
          font-variation-settings: "opsz" 144, "SOFT" 0;
        }

        .hm-acct__title--lead {
          font-size: clamp(3rem, 7vw, 6rem);
          font-weight: 400;
          max-width: 18ch;
        }

        .hm-acct__title--center {
          text-align: center;
          max-width: 14ch;
          margin-inline: auto;
        }

        .hm-acct__title--exempt {
          max-width: 12ch;
        }

        .hm-acct__chapter {
          display: inline-block;
          font-family: var(--acct-display), "Sylfaen", Georgia, serif;
          font-style: italic;
          font-weight: 400;
          font-size: 14px;
          color: var(--acct-accent);
          letter-spacing: 0;
          margin-bottom: 18px;
          font-variation-settings: "opsz" 9, "SOFT" 100;
        }

        .hm-acct__chapter--away {
          color: rgba(255, 255, 255, 0.7);
        }

        .hm-acct__mono-tag {
          font-family: var(--acct-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--acct-ink-mute);
          white-space: nowrap;
        }

        .hm-acct__hairline {
          flex: 1;
          height: 1px;
          background-color: var(--acct-rule);
        }

        /* ── Hero ── */
        .hm-acct__hero {
          position: relative;
          padding: clamp(80px, 12vw, 160px) clamp(24px, 6vw, 72px)
            clamp(60px, 10vw, 120px);
          max-width: 1240px;
          margin: 0 auto;
          overflow: hidden;
          animation: hm-rise 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .hm-acct__hero-folio {
          position: absolute;
          top: clamp(-40px, -3vw, -20px);
          right: clamp(-30px, -2vw, -10px);
          font-family: var(--acct-display), "Sylfaen", Georgia, serif;
          font-weight: 900;
          font-size: clamp(20rem, 40vw, 36rem);
          line-height: 0.8;
          color: var(--acct-ink);
          opacity: 0.04;
          pointer-events: none;
          user-select: none;
          font-variation-settings: "opsz" 144;
        }

        .hm-acct__standfirst {
          margin: 32px 0 0;
          max-width: 38ch;
          font-size: clamp(17px, 1.6vw, 21px);
          line-height: 1.55;
          color: var(--acct-ink-soft);
          font-weight: 300;
        }

        .hm-acct__hero-rule {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: clamp(48px, 6vw, 72px);
          max-width: 720px;
        }

        /* ── Section frame ── */
        .hm-acct__section {
          max-width: 1240px;
          margin: 0 auto;
          padding: clamp(80px, 10vw, 140px) clamp(24px, 6vw, 72px);
          border-top: 1px solid var(--acct-rule);
        }

        .hm-acct__section-head {
          max-width: 720px;
          margin-bottom: clamp(60px, 8vw, 100px);
        }

        .hm-acct__lede {
          margin: 32px 0 0;
          max-width: 38ch;
          font-size: 19px;
          line-height: 1.55;
          color: var(--acct-ink-soft);
          font-weight: 300;
        }

        /* ── Section 01: standards (asymmetric offset grid) ── */
        .hm-acct__standards {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(32px, 4vw, 64px) clamp(48px, 6vw, 96px);
        }

        @media (max-width: 640px) {
          .hm-acct__standards {
            grid-template-columns: 1fr;
          }
        }

        /* ── Section 02: ladder ── */
        .hm-acct__ladder {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(20px, 3vw, 40px);
          list-style: none;
          padding: 0;
          margin: 0;
          position: relative;
        }

        .hm-acct__ladder::before {
          content: "";
          position: absolute;
          top: 64px;
          left: 8%;
          right: 8%;
          height: 1px;
          background: repeating-linear-gradient(
            90deg,
            var(--acct-rule) 0 6px,
            transparent 6px 12px
          );
          z-index: 0;
        }

        @media (max-width: 720px) {
          .hm-acct__ladder {
            grid-template-columns: 1fr;
          }
          .hm-acct__ladder::before {
            display: none;
          }
        }

        /* ── Section 03: away ── */
        .hm-acct__section--away {
          padding-top: clamp(60px, 8vw, 100px);
          padding-bottom: clamp(60px, 8vw, 100px);
          position: relative;
        }

        .hm-acct__away-card {
          background-color: var(--acct-ink);
          color: var(--acct-paper);
          padding: clamp(48px, 8vw, 96px) clamp(32px, 6vw, 80px);
          border-radius: 4px;
          position: relative;
          overflow: hidden;
        }

        .hm-acct__pull {
          font-family: var(--acct-display), "Sylfaen", Georgia, serif;
          font-style: italic;
          font-weight: 400;
          font-size: clamp(1.8rem, 3.6vw, 3.2rem);
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin: 0 0 32px;
          max-width: 22ch;
          color: var(--acct-paper);
          font-variation-settings: "opsz" 144, "SOFT" 100;
        }

        .hm-acct__away-body {
          max-width: 56ch;
          font-size: 17px;
          line-height: 1.6;
          color: rgba(250, 245, 236, 0.78);
          font-weight: 300;
          margin: 0;
        }

        .hm-acct__away-glyph {
          position: absolute;
          top: 50%;
          right: clamp(40px, 8vw, 120px);
          transform: translateY(-50%);
          font-size: clamp(180px, 26vw, 320px);
          line-height: 1;
          color: var(--acct-accent);
          opacity: 0.12;
          pointer-events: none;
          user-select: none;
        }

        /* ── Section 04: exempt ── */
        .hm-acct__section--exempt {
          display: grid;
          grid-template-columns: minmax(260px, 1fr) 2fr;
          gap: clamp(48px, 6vw, 120px);
          align-items: start;
        }

        @media (max-width: 720px) {
          .hm-acct__section--exempt {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }

        .hm-acct__exempt-head {
          position: sticky;
          top: 32px;
        }

        .hm-acct__exempt-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 8px;
        }

        .hm-acct__exempt-item {
          display: grid;
          grid-template-columns: 64px 1fr;
          align-items: baseline;
          gap: 12px;
          padding: 24px 0;
          border-bottom: 1px solid var(--acct-rule);
          font-size: 19px;
          line-height: 1.45;
          color: var(--acct-ink);
        }

        .hm-acct__exempt-item:last-child {
          border-bottom: none;
        }

        .hm-acct__exempt-bullet {
          font-family: var(--acct-mono), monospace;
          font-size: 12px;
          letter-spacing: 0.12em;
          color: var(--acct-accent);
        }

        /* ── Section 05: recovery ── */
        .hm-acct__section--recovery {
          text-align: center;
          padding-top: clamp(80px, 10vw, 140px);
          padding-bottom: clamp(80px, 10vw, 140px);
        }

        .hm-acct__section--recovery .hm-acct__eyebrow {
          margin-bottom: 16px;
        }

        .hm-acct__section--recovery .hm-acct__chapter {
          display: block;
        }

        .hm-acct__recovery-body {
          margin: 24px auto 56px;
          max-width: 48ch;
          font-size: 18px;
          line-height: 1.6;
          color: var(--acct-ink-soft);
          font-weight: 300;
        }

        .hm-acct__recovery-dots {
          display: flex;
          gap: 14px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          max-width: 480px;
          margin: 0 auto;
        }

        .hm-acct__dot {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 1px solid var(--acct-rule);
          background-color: transparent;
        }

        .hm-acct__dot--miss {
          background-color: var(--acct-accent);
          border-color: var(--acct-accent);
          box-shadow: 0 0 0 4px rgba(239, 78, 36, 0.12);
        }

        /* ── Footer CTA ── */
        .hm-acct__section--cta {
          text-align: center;
          padding-bottom: clamp(80px, 10vw, 140px);
        }

        .hm-acct__cta-row {
          display: flex;
          justify-content: center;
          gap: clamp(24px, 4vw, 56px);
          flex-wrap: wrap;
          margin-top: 32px;
        }

        .hm-acct__colophon {
          display: flex;
          align-items: center;
          gap: 16px;
          justify-content: center;
          margin-top: clamp(64px, 8vw, 96px);
          font-family: var(--acct-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--acct-ink-mute);
          max-width: 320px;
          margin-inline: auto;
        }

        /* ── Motion ── */
        @keyframes hm-rise {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hm-acct__hero {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

/* ─────────── Sub-components ─────────── */

interface StandardProps {
  n: string;
  label: string;
  window: string;
  body: string;
  /** "up" lifts the card -32px to break the grid into staggered rhythm. */
  offset: "up" | "down";
}

function Standard({ n, label, window: w, body, offset }: StandardProps) {
  return (
    <article
      className={`hm-std hm-std--${offset}`}
      style={{ transform: offset === "up" ? "translateY(-32px)" : undefined }}
    >
      <span className="hm-std__numeral">{n}</span>
      <p className="hm-std__label">{label}</p>
      <p className="hm-std__window">{w}</p>
      <p className="hm-std__body">{body}</p>

      <style jsx>{`
        .hm-std {
          padding: 28px 0 0;
          border-top: 1px solid var(--acct-rule);
          display: grid;
          grid-template-rows: auto auto auto auto;
          gap: 10px;
        }

        .hm-std__numeral {
          font-family: var(--acct-display), "Sylfaen", Georgia, serif;
          font-style: italic;
          font-weight: 400;
          font-size: 13px;
          letter-spacing: 0;
          color: var(--acct-accent);
          font-variation-settings: "opsz" 9, "SOFT" 100;
        }

        .hm-std__label {
          font-family: var(--acct-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--acct-ink-mute);
          margin: 0;
        }

        .hm-std__window {
          font-family: var(--acct-display), "Sylfaen", Georgia, serif;
          font-weight: 400;
          font-size: clamp(2.4rem, 4.5vw, 3.4rem);
          line-height: 1;
          letter-spacing: -0.02em;
          color: var(--acct-ink);
          margin: 4px 0 12px;
          font-variation-settings: "opsz" 144;
        }

        .hm-std__body {
          font-size: 16px;
          line-height: 1.55;
          color: var(--acct-ink-soft);
          font-weight: 300;
          max-width: 38ch;
          margin: 0;
        }

        @media (max-width: 640px) {
          .hm-std {
            transform: none !important;
          }
        }
      `}</style>
    </article>
  );
}

interface StepProps {
  n: string;
  tone: "warning" | "demoted" | "paused";
  label: string;
  title: string;
  body: string;
}

function Step({ n, tone, label, title, body }: StepProps) {
  return (
    <li className={`hm-step hm-step--${tone}`}>
      <div className="hm-step__bullet">
        <span className="hm-step__bullet-n">{n}</span>
      </div>
      <p className="hm-step__label">{label}</p>
      <h3 className="hm-step__title">{title}</h3>
      <p className="hm-step__body">{body}</p>

      <style jsx>{`
        .hm-step {
          background-color: var(--acct-paper);
          border: 1px solid var(--acct-rule);
          padding: 28px clamp(20px, 2.5vw, 32px) 32px;
          position: relative;
          z-index: 1;
          display: grid;
          gap: 10px;
        }

        .hm-step--warning {
          background-color: var(--acct-paper);
        }

        .hm-step--demoted {
          background-color: var(--acct-paper-deep);
          border-color: rgba(239, 78, 36, 0.25);
        }

        .hm-step--paused {
          background-color: rgba(239, 78, 36, 0.08);
          border-color: rgba(239, 78, 36, 0.4);
        }

        .hm-step__bullet {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          background-color: var(--acct-paper);
          border: 1.5px solid var(--acct-ink);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .hm-step--demoted .hm-step__bullet {
          border-color: var(--acct-accent);
          color: var(--acct-accent);
        }

        .hm-step--paused .hm-step__bullet {
          background-color: var(--acct-accent);
          border-color: var(--acct-accent);
          color: var(--acct-paper);
        }

        .hm-step__bullet-n {
          font-family: var(--acct-display), "Sylfaen", Georgia, serif;
          font-style: italic;
          font-weight: 500;
          font-size: 16px;
          line-height: 1;
        }

        .hm-step__label {
          font-family: var(--acct-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--acct-ink-mute);
          margin: 0;
        }

        .hm-step__title {
          font-family: var(--acct-display), "Sylfaen", Georgia, serif;
          font-weight: 500;
          font-size: clamp(1.6rem, 2.5vw, 2.1rem);
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: var(--acct-ink);
          margin: 4px 0 8px;
          font-variation-settings: "opsz" 144;
        }

        .hm-step__body {
          font-size: 15px;
          line-height: 1.55;
          color: var(--acct-ink-soft);
          font-weight: 300;
          margin: 0;
        }
      `}</style>
    </li>
  );
}

function CtaLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="hm-cta">
      <span>{children}</span>
      <ArrowUpRight className="hm-cta__arrow" />

      <style jsx>{`
        .hm-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 0;
          font-family: var(--acct-mono), monospace;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--acct-ink);
          text-decoration: none;
          border-bottom: 1px solid var(--acct-ink);
          transition:
            color 0.3s ease,
            border-color 0.3s ease;
        }
        .hm-cta:hover {
          color: var(--acct-accent);
          border-color: var(--acct-accent);
        }
        .hm-cta__arrow {
          width: 14px;
          height: 14px;
          transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .hm-cta:hover .hm-cta__arrow {
          transform: translate(2px, -2px);
        }
      `}</style>
    </Link>
  );
}
