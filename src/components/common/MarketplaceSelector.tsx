'use client';

/**
 * Combined country + language selector that lives in the header next
 * to the profile menu.
 *
 * Why combined: country (which marketplace I'm shopping in) and
 * language (what I read in) are two orthogonal axes that users adjust
 * together at first-visit time. Two separate icons in the header eat
 * horizontal space and read as more "noise" than they're worth.
 * Mirrors the Airbnb / Stripe pattern.
 *
 * Trigger pill shows the current marketplace flag + language short
 * code (e.g. "🇬🇪 ქართ"). Opens a popover with two stacked sections:
 *   1. Marketplace - active list of countries we serve. Switching
 *      navigates to the same path under the new country prefix when
 *      we're inside a `/[country]/...` route; otherwise just sets
 *      the sticky-preference cookie for next marketplace visit.
 *   2. Language - three locales (en / ka / ru). Calls setLocale so
 *      the change is immediate.
 */

import { useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useLanguage, type Locale } from '@/contexts/LanguageContext';
import { useCountry } from '@/hooks/useCountry';
import {
  COUNTRY_LABELS,
  SUPPORTED_COUNTRIES,
  type CountryCode,
} from '@/data/countries';
import {
  isCountryAgnostic,
  swapCountryPrefix,
  writeMarketplaceCookie,
} from '@/utils/countryLink';
import { Check, Globe } from 'lucide-react';

const LANGUAGES: { code: Locale; short: string; name: string; flag: string }[] = [
  { code: 'ka', short: 'ქართ', name: 'ქართული', flag: '🇬🇪' },
  { code: 'en', short: 'Eng', name: 'English', flag: '🇬🇧' },
  { code: 'ru', short: 'Рус', name: 'Русский', flag: '🇷🇺' },
];

interface MarketplaceSelectorProps {
  /** "icon" mirrors the LanguageSelector header pill. */
  variant?: 'icon' | 'default';
  /**
   * When true, the country / marketplace section is hidden and the
   * component degrades to a pure language selector. Trigger pill
   * also swaps from "country-flag + lang-short" to "lang-flag +
   * lang-short" so the visible affordance matches the popover.
   * Driven by `features.marketplaceSelector` while the international
   * rollout is still in prep.
   */
  hideCountry?: boolean;
}

export default function MarketplaceSelector({
  variant = 'icon',
  hideCountry = false,
}: MarketplaceSelectorProps) {
  const { locale, setLocale, t } = useLanguage();
  const country = useCountry();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useClickOutside<HTMLDivElement>(
    () => setIsOpen(false),
    isOpen,
  );

  const currentLang = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];
  const currentCountry = COUNTRY_LABELS[country] ?? COUNTRY_LABELS.GE;

  const handleCountrySelect = useCallback(
    (code: CountryCode) => {
      // Always write the sticky preference cookie so future bare-path
      // visits and country-agnostic pages remember the choice.
      writeMarketplaceCookie(code);
      setIsOpen(false);

      if (code === country) return;

      if (isCountryAgnostic(pathname)) {
        // Standing on an admin / settings / auth page - no URL to swap.
        // The cookie change above is the only state needed; next
        // marketplace visit lands in the chosen country.
        return;
      }

      const target = swapCountryPrefix(pathname, code);
      // Carry the query string across the swap so browse filters,
      // search queries, and sort order survive the country change.
      // Without this a user on /ge/professionals?category=plumbing&minRating=4
      // who switched to /il would see an unfiltered list.
      const search = typeof window !== "undefined" ? window.location.search : "";
      router.push(`${target}${search}`);
    },
    [country, pathname, router],
  );

  const handleLocaleSelect = useCallback(
    (code: Locale) => {
      setLocale(code);
      setIsOpen(false);
    },
    [setLocale],
  );

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
          isOpen
            ? 'bg-[var(--hm-brand-500)]/10'
            : 'hover:bg-[var(--hm-bg-tertiary)]'
        }`}
        title={`${currentLang.name} - ${t('common.changeLanguage')}`}
        aria-label={`${currentLang.name} - ${t('common.changeLanguage')}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="text-[17px] leading-none">
          {hideCountry ? currentLang.flag : currentCountry.flag}
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-[70] animate-scale-in bg-[var(--hm-bg-elevated)] shadow-2xl border border-[var(--hm-border-subtle)] backdrop-blur-sm"
          role="menu"
        >
          {/* Marketplace section - suppressed when hideCountry is on
              (international rollout still in prep). The divider goes
              with it so the popover doesn't show an orphan separator
              above the language list. */}
          {!hideCountry && (
            <>
              <div className="p-2">
                <div className="flex items-center gap-2 px-2.5 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--hm-fg-muted)]">
                  <Globe className="w-3 h-3" />
                  {t('header.country')}
                </div>
                <div className="space-y-0.5">
                  {SUPPORTED_COUNTRIES.map((code) => {
                    const meta = COUNTRY_LABELS[code as CountryCode];
                    const isActive = code === country;
                    const label =
                      locale === 'ka'
                        ? meta.ka
                        : locale === 'ru'
                          ? meta.ru
                          : meta.en;
                    return (
                      <button
                        key={code}
                        onClick={() => handleCountrySelect(code as CountryCode)}
                        className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm transition-all ${
                          isActive
                            ? 'bg-[var(--hm-brand-500)]/10'
                            : 'hover:bg-[var(--hm-bg-tertiary)]/70'
                        }`}
                        role="menuitem"
                      >
                        <span className="text-lg leading-none">{meta.flag}</span>
                        <span
                          className={`flex-1 text-left ${
                            isActive
                              ? 'text-[var(--hm-brand-500)] font-semibold'
                              : 'text-[var(--hm-fg-secondary)]'
                          }`}
                        >
                          {label}
                        </span>
                        {isActive && (
                          <Check
                            className="w-4 h-4 text-[var(--hm-brand-500)]"
                            strokeWidth={2.5}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-[var(--hm-border-subtle)] mx-2" />
            </>
          )}

          {/* Language section */}
          <div className="p-2">
            <div className="px-2.5 pt-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--hm-fg-muted)]">
              {t('common.changeLanguage')}
            </div>
            <div className="space-y-0.5">
              {LANGUAGES.map((lang) => {
                const isActive = locale === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLocaleSelect(lang.code)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm transition-all ${
                      isActive
                        ? 'bg-[var(--hm-brand-500)]/10'
                        : 'hover:bg-[var(--hm-bg-tertiary)]/70'
                    }`}
                    role="menuitem"
                  >
                    <span className="text-lg leading-none">{lang.flag}</span>
                    <span
                      className={`flex-1 text-left ${
                        isActive
                          ? 'text-[var(--hm-brand-500)] font-semibold'
                          : 'text-[var(--hm-fg-secondary)]'
                      }`}
                    >
                      {lang.name}
                    </span>
                    {isActive && (
                      <Check
                        className="w-4 h-4 text-[var(--hm-brand-500)]"
                        strokeWidth={2.5}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
