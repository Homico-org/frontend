'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { features } from '@/config/features';
import { Briefcase, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MouseEvent, ReactNode } from 'react';

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
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const { openLoginModal } = useAuthModal();

  const isAuthenticated = !!user;

  if (isLoading) {
    return (
      <>
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t safe-area-bottom"
          style={{ backgroundColor: 'var(--hm-bg-elevated)', borderColor: 'var(--hm-border)' }}
        >
          <div className="grid grid-cols-5 h-[58px] px-0">
            {Array.from({ length: 5 }).map((_, i) => (
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

  const isActive = (prefixes: string[]) => prefixes.some((p) => pathname.startsWith(p));

  const jobsSlot: Slot = {
    key: 'jobs',
    href: '/jobs',
    labelKey: 'nav.jobs',
    icon: Briefcase,
    isActive: isActive(['/jobs']),
  };
  const prosSlot: Slot = {
    key: 'pros',
    href: '/professionals',
    labelKey: 'browse.professionals',
    icon: Users,
    isActive: isActive(['/professionals', '/portfolio']),
  };
  const postSlot: Slot = isAuthenticated
    ? {
        key: 'post',
        href: '/post-job',
        labelKey: 'common.post',
        icon: Plus,
        isActive: pathname === '/post-job',
      }
    : {
        key: 'post',
        href: '/post-job',
        labelKey: 'common.post',
        icon: Plus,
        isActive: pathname === '/post-job',
        onClick: (e) => { e.preventDefault(); openLoginModal(); },
      };
  // 3-slot layout: Jobs · `+` · Pros. + is dead-center as the primary CTA.
  // Home, My Space, and Bookings live in the avatar dropdown / shell sidebar
  // so the mobile bottom rail stays uncluttered.

  const slots: Slot[] = [jobsSlot, postSlot, prosSlot];

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
        style={{
          backgroundColor: 'var(--hm-bg-elevated)',
          borderTop: '1px solid var(--hm-border)',
          boxShadow: 'var(--hm-shadow-md)',
        }}
      >
        <div className="grid grid-cols-3 items-stretch px-0 pt-2 pb-2.5">
          {slots.map((slot) => {
            const Icon = slot.icon;
            const isPostSlot = slot.key === 'post';

            // The post-job slot is the primary CTA — elevated vermillion pill
            // with a white plus, distinct from the other tab links.
            if (isPostSlot) {
              return (
                <Link
                  key={slot.key}
                  href={slot.href}
                  onClick={slot.onClick}
                  className="relative flex flex-col items-center justify-center gap-1 min-w-0 px-1 transition-transform active:scale-95"
                  aria-label={t(slot.labelKey)}
                >
                  <span
                    className="flex items-center justify-center w-11 h-11 rounded-full text-white shadow-md shadow-[var(--hm-brand-500)]/30"
                    style={{ backgroundColor: 'var(--hm-brand-500)' }}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                  </span>
                  <span
                    className="text-[10px] font-medium tracking-[0.02em] truncate max-w-full"
                    style={{ color: 'var(--hm-fg-muted)' }}
                  >
                    {t(slot.labelKey)}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={slot.key}
                href={slot.href}
                onClick={slot.onClick}
                className="relative flex flex-col items-center gap-1 min-w-0 px-1 pt-2 pb-0.5 transition-colors"
                style={{ color: slot.isActive ? 'var(--hm-fg-primary)' : 'var(--hm-fg-muted)' }}
              >
                <span
                  aria-hidden
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    top: '-9px',
                    width: '28px',
                    height: '2px',
                    backgroundColor: slot.isActive ? 'var(--hm-brand-500)' : 'transparent',
                  }}
                />
                <Icon className="w-5 h-5" strokeWidth={slot.isActive ? 2 : 1.75} />
                <span
                  className="text-[10px] tracking-[0.02em] truncate max-w-full"
                  style={{ fontWeight: slot.isActive ? 600 : 500 }}
                >
                  {t(slot.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="lg:hidden h-[calc(58px+env(safe-area-inset-bottom))]" />
    </>
  );
}
