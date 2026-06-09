import { Fraunces, IBM_Plex_Mono, Manrope } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Route-level layout for the editorial accountability page. The
 * page itself is `'use client'` (uses useLanguage), so font loading
 * has to happen here in the server-component layout - that's the
 * pattern `next/font/google` requires.
 *
 * Why this matters over the previous `<Head>` + Google Fonts `<link>`:
 *   - Self-hosts the font files (no third-party DNS lookup per visitor)
 *   - Pre-applies `size-adjust` to the fallback metrics, killing CLS
 *     during font swap (the headline previously jumped on every load)
 *   - Subset to Latin + Cyrillic (Manrope only; Fraunces and Plex Mono
 *     ship Latin only - Georgian script falls through to the system
 *     Sylfaen/BPG stack via the CSS font-family chain in the page)
 *   - Trimmed weight list to what the page actually renders. The old
 *     URL asked for Fraunces 300/400/500/600/900 + Manrope 300-700 +
 *     Plex Mono 400/500. Audit shows only 400/500/900 (Fraunces),
 *     300/400/500 (Manrope), 400/500 (Plex Mono) are used.
 */

// Fraunces variable font - single file, all weights interpolated via
// the wght axis, plus opsz + SOFT axes used in the page CSS. Omitting
// `weight` opts into the variable font (axes can only be set on
// variable fonts per next/font, build will fail with both set).
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--acct-display",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--acct-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--acct-mono",
});

export const metadata: Metadata = {
  title: "How Homico holds pros accountable",
  description:
    "Response standards, gentle ramp, and Away mode. The four windows that make Homico's reliability promise real.",
  // Robots open - prospective pros googling 'is Homico worth joining'
  // should land here. The page is a public marketing surface.
  robots: { index: true, follow: true },
};

export default function ProAccountabilityLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`${fraunces.variable} ${manrope.variable} ${plexMono.variable}`}>
      {children}
    </div>
  );
}
