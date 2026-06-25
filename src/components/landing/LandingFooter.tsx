"use client";

import HomicoLogo from "@/components/common/HomicoLogo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCountryLink } from "@/hooks/useCountry";
import { Mail } from "lucide-react";
import Link from "next/link";

interface LandingFooterProps {
  /**
   * Used by the "Request a quote" button in the Product column. Optional -
   * on surfaces without an intake modal (e.g. the blog) the row falls back
   * to a link to the assistant on the home page.
   */
  onIntakeOpen?: () => void;
}

export default function LandingFooter({ onIntakeOpen }: LandingFooterProps) {
  const { t } = useLanguage();
  const cl = useCountryLink();

  return (
    <footer className="bg-[var(--hm-n-900)] border-t border-[var(--hm-n-800)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10">
          {/* Brand + tagline */}
          <div className="md:col-span-5">
            <Link href={cl("/")} className="inline-flex items-center gap-2">
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
                {onIntakeOpen ? (
                  <button
                    type="button"
                    onClick={onIntakeOpen}
                    className="text-[13px] text-white/70 hover:text-white transition-colors"
                  >
                    {t("concierge.requestQuote")}
                  </button>
                ) : (
                  <Link
                    href={cl("/")}
                    className="text-[13px] text-white/70 hover:text-white transition-colors"
                  >
                    {t("concierge.requestQuote")}
                  </Link>
                )}
              </li>
              <li>
                <Link
                  href={cl("/professionals")}
                  className="text-[13px] text-white/70 hover:text-white transition-colors"
                >
                  {t("landing.browsePros")}
                </Link>
              </li>
              <li>
                <Link
                  href={cl("/how-it-works")}
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
                  href={cl("/blog")}
                  className="text-[13px] text-white/70 hover:text-white transition-colors"
                >
                  {t("blog.eyebrow")}
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
        <div className="mt-10 pt-6 border-t border-[var(--hm-n-800)]">
          <p className="text-[11px] text-[var(--hm-fg-muted)]">
            © {new Date().getFullYear()} {t("landing.footerCopyright")}.{" "}
            {t("landing.footerAllRights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
