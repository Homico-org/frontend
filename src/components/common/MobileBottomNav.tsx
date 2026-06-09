'use client';

import MobileNavDrawer from '@/components/common/MobileNavDrawer';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountryLink } from '@/hooks/useCountry';
import { stripCountryPrefix } from '@/utils/countryLink';
import { Briefcase, Menu, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MouseEvent, ReactNode, useState } from 'react';

type Slot = {
  key: string;
  href: string;
  labelKey: string;
  icon: typeof Briefcase;
  isActive: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

interface MobileBottomNavProps {
  extraAction?: ReactNode;
}

export default function MobileBottomNav({ extraAction: _extraAction }: MobileBottomNavProps) {
  const pathname = usePathname();
  // Active-tab matching compares against bare route literals (`/jobs`,
  // `/post-job`), but the real pathname is country-prefixed (`/ge/jobs`).
  // Strip the prefix once so the checks below work on both forms.
  const localPath = stripCountryPrefix(pathname);
  const cl = useCountryLink();
  const { t } = useLanguage();
  const { isLoading } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isLoading) {
    return (
      <>
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom bg-[var(--hm-bg-elevated)] border-t border-[var(--hm-border)]">
          <div className="grid grid-cols-3 h-[58px] px-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-1">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="w-10 h-2 rounded" />
              </div>
            ))}
          </div>
        </nav>
        <div className="lg:hidden h-[calc(58px+env(safe-area-inset-bottom))]" />
      </>
    );
  }

  const isActive = (prefixes: string[]) => prefixes.some((p) => localPath.startsWith(p));

  // Smooth-scroll the page to top. Used when the user taps the
  // already-active tab - standard iOS pattern. We scroll both the
  // window (mobile, no shell wrapper) and any `<main>` scroller
  // (desktop shell layout) so the gesture works in both contexts.
  const scrollToTop = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = document.querySelector('main');
    if (mainEl && mainEl.scrollTop > 0) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // If a user taps the tab they're already on (or any tab whose
  // active prefix matches the current page), prevent the navigation
  // and scroll the page to top. Mirrors iOS/Android native apps.
  const handleActiveTap = (slotActive: boolean) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!slotActive) return;
    e.preventDefault();
    scrollToTop();
  };

  const jobsSlot: Slot = {
    key: 'jobs',
    href: cl('/jobs'),
    labelKey: 'nav.jobs',
    icon: Briefcase,
    // /my-jobs and /my-work are conceptually under the Jobs tab.
    // Highlighting on detail/sub-routes keeps users oriented when
    // they drill into a specific job from any entry point.
    isActive: isActive(['/jobs', '/my-jobs', '/my-work', '/my-proposals']),
  };
  const prosSlot: Slot = {
    key: 'pros',
    href: cl('/professionals'),
    labelKey: 'browse.professionals',
    icon: Users,
    isActive: isActive(['/professionals', '/portfolio']),
  };

  // 3-slot layout: Jobs · Menu · Pros. The center slot is the primary
  // CTA - opens the full navigation drawer. Post-job and other actions
  // live inside the drawer for both authed and unauthed users.
  const sideSlots: Slot[] = [jobsSlot, prosSlot];

  return (
    <>
      {/* Shadow is `0 -8px 24px ...` (negative Y) so it casts upward
          out of the nav, lifting it visually from the content above. */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom bg-[var(--hm-bg-elevated)] border-t border-[var(--hm-border)] shadow-[0_-8px_24px_-12px_rgba(20,18,14,0.16)]">
        <div className="grid grid-cols-3 items-stretch px-0 pt-2 pb-2.5">
          {/* Left side - Jobs */}
          {(() => {
            const slot = sideSlots[0];
            const Icon = slot.icon;
            return (
              <Link
                key={slot.key}
                href={slot.href}
                onClick={slot.onClick ?? handleActiveTap(slot.isActive)}
                aria-current={slot.isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-1 min-w-0 px-1 pt-2 pb-0.5 min-h-[44px] transition-colors ${
                  slot.isActive
                    ? "text-[var(--hm-fg-primary)] font-semibold"
                    : "text-[var(--hm-fg-muted)] font-medium"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute left-1/2 -translate-x-1/2 -top-[9px] w-7 h-0.5 ${
                    slot.isActive ? "bg-[var(--hm-brand-500)]" : "bg-transparent"
                  }`}
                />
                <Icon className="w-5 h-5" strokeWidth={slot.isActive ? 2 : 1.75} />
                <span className="text-[10px] tracking-[0.02em] truncate max-w-full">
                  {t(slot.labelKey)}
                </span>
              </Link>
            );
          })()}

          {/* Center - Menu trigger (was + post-job slot). Opens the
              full navigation drawer with auth-aware sections. */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('nav.home')}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            className="relative flex flex-col items-center justify-center gap-1 min-w-0 px-1 min-h-[44px] transition-transform active:scale-95"
          >
            <span className="flex items-center justify-center w-11 h-11 rounded-full text-white shadow-md shadow-[var(--hm-brand-500)]/30 bg-[var(--hm-brand-500)]">
              <Menu className="w-5 h-5" strokeWidth={2.5} />
            </span>
          </button>

          {/* Right side - Pros */}
          {(() => {
            const slot = sideSlots[1];
            const Icon = slot.icon;
            return (
              <Link
                key={slot.key}
                href={slot.href}
                onClick={slot.onClick ?? handleActiveTap(slot.isActive)}
                aria-current={slot.isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-1 min-w-0 px-1 pt-2 pb-0.5 min-h-[44px] transition-colors ${
                  slot.isActive
                    ? "text-[var(--hm-fg-primary)] font-semibold"
                    : "text-[var(--hm-fg-muted)] font-medium"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute left-1/2 -translate-x-1/2 -top-[9px] w-7 h-0.5 ${
                    slot.isActive ? "bg-[var(--hm-brand-500)]" : "bg-transparent"
                  }`}
                />
                <Icon className="w-5 h-5" strokeWidth={slot.isActive ? 2 : 1.75} />
                <span className="text-[10px] tracking-[0.02em] truncate max-w-full">
                  {t(slot.labelKey)}
                </span>
              </Link>
            );
          })()}
        </div>
      </nav>
      <div className="lg:hidden h-[calc(58px+env(safe-area-inset-bottom))]" />

      <MobileNavDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
