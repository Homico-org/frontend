'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { features } from '@/config/features';
import { Briefcase, Calendar, Home, LayoutDashboard, Plus, Users } from 'lucide-react';
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

  const isPro = user?.role === 'pro' || user?.role === 'admin';
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

  const myKey = isPro ? 'mySpace.mySpace' : 'mySpace.mySpace';

  // 5-slot layout with + always in the middle (position 3 of 5).
  // Unified order: Home · Jobs · +Post · Pros · MySpace.
  const homeSlot: Slot = {
    key: 'home',
    href: '/',
    labelKey: 'nav.home',
    icon: Home,
    isActive: pathname === '/',
  };
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
  const mySpaceSlot: Slot = {
    key: 'my-space',
    href: '/my-space',
    labelKey: myKey,
    icon: LayoutDashboard,
    isActive: isActive(isPro ? ['/my-space', '/my-work', '/my-proposals'] : ['/my-space', '/my-jobs']),
  };

  let slots: Slot[] = [homeSlot, jobsSlot, postSlot, prosSlot, mySpaceSlot];

  // If the bookings feature flag is on, prefer Bookings over Home so the 5 slots
  // still make sense. (Keeps + centered either way.)
  if (features.bookings) {
    const bookingsSlot: Slot = {
      key: 'bookings',
      href: '/bookings',
      labelKey: 'nav.bookings',
      icon: Calendar,
      isActive: isActive(['/bookings']),
    };
    slots = [jobsSlot, bookingsSlot, postSlot, prosSlot, mySpaceSlot];
  }

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
        <div className="grid grid-cols-5 items-stretch px-0 pt-2 pb-2.5">
          {slots.map((slot) => {
            const Icon = slot.icon;
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
