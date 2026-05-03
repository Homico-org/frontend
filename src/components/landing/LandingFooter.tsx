"use client";

import HomicoLogo from "@/components/common/HomicoLogo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail } from "lucide-react";
import Link from "next/link";

interface LandingFooterProps {
  /** Used by the "Request a quote" button in the Product column. */
  onIntakeOpen: () => void;
}

export default function LandingFooter({ onIntakeOpen }: LandingFooterProps) {
  const { t } = useLanguage();

  return (
    <footer className="bg-[var(--hm-n-900)] border-t border-[var(--hm-n-800)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10">
          {/* Brand + tagline */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2">
              <HomicoLogo variant="reverse" size={28} className="h-7 w-7" />
              <span className="font-serif text-lg font-medium text-white">
                Homico
              </span>
            </Link>
            <p className="mt-3 text-[13px] text-[var(--hm-fg-muted)] leading-relaxed max-w-sm">
              {t("landing.footerTagline")}
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="mailto:info@homico.ge"
                className="inline-flex items-center gap-2 text-[13px] text-white/80 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" strokeWidth={1.75} />
                info@homico.ge
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="md:col-span-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hm-fg-muted)] mb-3">
              {t("landing.footerProduct")}
            </p>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={onIntakeOpen}
                  className="text-[13px] text-white/70 hover:text-white transition-colors"
                >
                  {t("concierge.requestQuote")}
                </button>
              </li>
              <li>
                <Link
                  href="/professionals"
                  className="text-[13px] text-white/70 hover:text-white transition-colors"
                >
                  {t("landing.browsePros")}
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-[13px] text-white/70 hover:text-white transition-colors"
                >
                  {t("about.howItWorks")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hm-fg-muted)] mb-3">
              {t("landing.footerCompany")}
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-[13px] text-white/70 hover:text-white transition-colors"
                >
                  {t("footer.aboutUs")}
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-[13px] text-white/70 hover:text-white transition-colors"
                >
                  {t("footer.helpCenter")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hm-fg-muted)] mb-3">
              {t("landing.footerLegal")}
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-[13px] text-white/70 hover:text-white transition-colors"
                >
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-[13px] text-white/70 hover:text-white transition-colors"
                >
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[var(--hm-n-800)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--hm-fg-muted)]">
            © {new Date().getFullYear()} {t("landing.footerCopyright")}.{" "}
            {t("landing.footerAllRights")}
          </p>
          <p className="text-[11px] text-[var(--hm-fg-muted)]">
            {t("about.tbilisiGeorgia")}
          </p>
        </div>
      </div>
    </footer>
  );
}
