'use client';

import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Visually-hidden link that becomes visible on keyboard focus and
 * jumps the user past the global header / nav to the page's main
 * content. WCAG 2.4.1 Bypass Blocks requirement.
 *
 * The target id `main-content` lives on `AppLayout`'s `<main>`. Pages
 * that opt out of `AppLayout` (custom-layout routes) should add the
 * same id to their own main landmark.
 */
export default function SkipToMainLink() {
  const { t } = useLanguage();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[var(--hm-brand-500)] focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--hm-brand-500)]/40"
    >
      {t('common.skipToMainContent')}
    </a>
  );
}
