'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { Briefcase, Calendar, LayoutDashboard, Plus, Users } from 'lucide-react';
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

  const slots: Slot[] = isPro
    ? [
        { key: 'my-space', href: '/my-space', labelKey: myKey, icon: LayoutDashboard, isActive: isActive(['/my-space', '/my-work', '/my-proposals']) },
        { key: 'jobs', href: '/jobs', labelKey: 'nav.jobs', icon: Briefcase, isActive: isActive(['/jobs']) },
        { key: 'post', href: '/post-job', labelKey: 'common.post', icon: Plus, isActive: pathname === '/post-job' },
        { key: 'bookings', href: '/bookings', labelKey: 'nav.bookings', icon: Calendar, isActive: isActive(['/bookings']) },
        { key: 'pros', href: '/professionals', labelKey: 'browse.professionals', icon: Users, isActive: isActive(['/professionals', '/portfolio']) },
      ]
    : isAuthenticated
      ? [
          { key: 'pros', href: '/professionals', labelKey: 'browse.professionals', icon: Users, isActive: isActive(['/professionals', '/portfolio']) },
          { key: 'jobs', href: '/jobs', labelKey: 'nav.jobs', icon: Briefcase, isActive: isActive(['/jobs']) },
          { key: 'post', href: '/post-job', labelKey: 'common.post', icon: Plus, isActive: pathname === '/post-job' },
          { key: 'bookings', href: '/bookings', labelKey: 'nav.bookings', icon: Calendar, isActive: isActive(['/bookings']) },
          { key: 'my-space', href: '/my-space', labelKey: 'mySpace.mySpace', icon: LayoutDashboard, isActive: isActive(['/my-space', '/my-jobs']) },
        ]
      : [
          { key: 'pros', href: '/professionals', labelKey: 'browse.professionals', icon: Users, isActive: isActive(['/professionals', '/portfolio']) },
          { key: 'jobs', href: '/jobs', labelKey: 'nav.jobs', icon: Briefcase, isActive: isActive(['/jobs']) },
          {
            key: 'post',
            href: '/post-job',
            labelKey: 'common.post',
            icon: Plus,
            isActive: pathname === '/post-job',
            onClick: (e) => { e.preventDefault(); openLoginModal(); },
          },
          { key: 'bookings', href: '/bookings', labelKey: 'nav.bookings', icon: Calendar, isActive: isActive(['/bookings']) },
          { key: 'my-space', href: '/my-space', labelKey: 'mySpace.mySpace', icon: LayoutDashboard, isActive: isActive(['/my-space']) },
        ];

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
        <div className="flex items-stretch justify-around px-0 pt-2 pb-2.5">
          {slots.map((slot) => {
            const Icon = slot.icon;
            return (
              <Link
                key={slot.key}
                href={slot.href}
                onClick={slot.onClick}
                className="relative flex-1 flex flex-col items-center gap-1 px-1 pt-2 pb-0.5 transition-colors"
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
