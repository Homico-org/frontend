'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { Briefcase, Calendar, LayoutDashboard, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { ACCENT_COLOR } from '@/constants/theme';

type NavItem = {
  key: string;
  href: string;
  labelKey: string;
  icon: typeof Briefcase;
  showFor: 'all' | 'pro' | 'client' | 'authenticated' | 'guest';
};

const NAV_ITEMS: NavItem[] = [
  // Guest: 2 left + 2 right
  { key: 'professionals-guest', href: '/professionals', labelKey: 'browse.professionals', icon: Users, showFor: 'guest' },
  { key: 'jobs-guest', href: '/jobs', labelKey: 'nav.jobs', icon: Briefcase, showFor: 'guest' },
  { key: 'bookings-guest', href: '/bookings', labelKey: 'nav.bookings', icon: Calendar, showFor: 'guest' },
  { key: 'my-space-guest', href: '/my-space', labelKey: 'mySpace.mySpace', icon: LayoutDashboard, showFor: 'guest' },
  // Client: 2 left + 2 right
  { key: 'professionals-client', href: '/professionals', labelKey: 'browse.professionals', icon: Users, showFor: 'client' },
  { key: 'jobs-client', href: '/jobs', labelKey: 'nav.jobs', icon: Briefcase, showFor: 'client' },
  { key: 'bookings-client', href: '/bookings', labelKey: 'nav.bookings', icon: Calendar, showFor: 'client' },
  { key: 'my-space-client', href: '/my-space', labelKey: 'mySpace.mySpace', icon: LayoutDashboard, showFor: 'client' },
  // Pro: 2 left + 2 right
  { key: 'my-space', href: '/my-space', labelKey: 'mySpace.mySpace', icon: LayoutDashboard, showFor: 'pro' },
  { key: 'jobs-pro', href: '/jobs', labelKey: 'nav.jobs', icon: Briefcase, showFor: 'pro' },
  { key: 'bookings-pro', href: '/bookings', labelKey: 'nav.bookings', icon: Calendar, showFor: 'pro' },
  { key: 'professionals-pro', href: '/professionals', labelKey: 'browse.professionals', icon: Users, showFor: 'pro' },
];

interface MobileBottomNavProps {
  extraAction?: ReactNode;
}

export default function MobileBottomNav({ extraAction }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const { openLoginModal } = useAuthModal();

  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const isAuthenticated = !!user;

  // Don't render until auth state is determined to prevent flash
  if (isLoading) {
    return (
      <>
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0a0a0a] border-t border-neutral-200 dark:border-neutral-800 safe-area-bottom">
          <div className="flex items-end justify-around h-16 px-2 pb-2">
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="w-10 h-2 rounded" />
            </div>
            <div className="flex flex-col items-center -mt-5">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="w-8 h-2 rounded mt-1" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="w-10 h-2 rounded" />
            </div>
          </div>
        </nav>
        <div className="lg:hidden h-[calc(4rem+env(safe-area-inset-bottom))]" />
      </>
    );
  }

  // Filter items based on user role
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.showFor === 'all') return true;
    if (item.showFor === 'guest' && !isAuthenticated) return true;
    if (item.showFor === 'authenticated' && isAuthenticated) return true;
    if (item.showFor === 'pro' && isPro) return true;
    if (item.showFor === 'client' && !isPro && isAuthenticated) return true;
    return false;
  });

  // Determine active tab
  const getActiveKey = () => {
    if (pathname.includes('/my-space') || pathname.includes('/my-work') || pathname.includes('/my-proposals') || pathname.includes('/my-jobs')) {
      return isPro ? 'my-space' : (isAuthenticated ? 'my-space-client' : 'my-space-guest');
    }
    if (pathname.includes('/bookings')) {
      return isPro ? 'bookings-pro' : (isAuthenticated ? 'bookings-client' : 'bookings-guest');
    }
    if (pathname.includes('/jobs')) {
      return isPro ? 'jobs-pro' : (isAuthenticated ? 'jobs-client' : 'jobs-guest');
    }
    if (pathname.includes('/professionals') || pathname.includes('/portfolio')) {
      return isPro ? 'professionals-pro' : (isAuthenticated ? 'professionals-client' : 'professionals-guest');
    }
    return '';
  };

  const activeKey = getActiveKey();

  const isPostJobActive = pathname === '/post-job';

  const renderNavItem = (item: NavItem) => {
    const isActive = activeKey === item.key;
    const Icon = item.icon;
    return (
      <Link
        key={item.key}
        href={item.href}
        className={`flex flex-col items-center justify-end gap-0.5 flex-1 min-w-0 transition-colors ${
          isActive ? '' : 'text-neutral-400 dark:text-neutral-500'
        }`}
        style={isActive ? { color: ACCENT_COLOR } : {}}
      >
        <Icon className="w-5 h-5" />
        <span className="text-[10px] font-medium truncate max-w-full px-0.5">
          {t(item.labelKey)}
        </span>
      </Link>
    );
  };

  // Ensure exactly 4 slots: 2 left + center + 2 right
  // Pad with empty slots if fewer than 2 items per side
  const left = visibleItems.slice(0, 2);
  const right = visibleItems.slice(2, 4);

  const PostButton = isAuthenticated ? (
    <Link href="/post-job" className="flex flex-col items-center flex-1 min-w-0 -mt-5">
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform active:scale-90 ${
          isPostJobActive ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0a0a0a]' : ''
        }`}
        style={{
          background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #B86349 100%)`,
          boxShadow: `0 4px 16px ${ACCENT_COLOR}50`,
          ...(isPostJobActive ? { '--tw-ring-color': ACCENT_COLOR } as React.CSSProperties : {}),
        }}
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </div>
      <span
        className={`text-[10px] font-medium mt-0.5 ${isPostJobActive ? '' : 'text-neutral-400 dark:text-neutral-500'}`}
        style={isPostJobActive ? { color: ACCENT_COLOR } : {}}
      >
        {t('common.post')}
      </span>
    </Link>
  ) : (
    <button onClick={() => openLoginModal()} className="flex flex-col items-center flex-1 min-w-0 -mt-5">
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform active:scale-90"
        style={{
          background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #B86349 100%)`,
          boxShadow: `0 4px 16px ${ACCENT_COLOR}50`,
        }}
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </div>
      <span className="text-[10px] font-medium mt-0.5 text-neutral-400 dark:text-neutral-500">
        {t('common.post')}
      </span>
    </button>
  );

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0a0a0a] border-t border-neutral-200 dark:border-neutral-800 safe-area-bottom">
        <div className="grid grid-cols-5 items-end h-16 px-1 pb-2">
          {/* Left 2 slots */}
          {left[0] ? renderNavItem(left[0]) : <div />}
          {left[1] ? renderNavItem(left[1]) : <div />}

          {/* Center: Post button */}
          {PostButton}

          {/* Right 2 slots */}
          {right[0] ? renderNavItem(right[0]) : <div />}
          {right[1] ? renderNavItem(right[1]) : <div />}
        </div>
      </nav>
      <div className="lg:hidden h-[calc(4rem+env(safe-area-inset-bottom))]" />
    </>
  );
}
