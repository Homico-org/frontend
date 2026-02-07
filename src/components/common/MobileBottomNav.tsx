'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { Briefcase, Calculator, FileText, Images, Plus, Search, Users } from 'lucide-react';
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
  // Guest navigation (not logged in)
  {
    key: 'portfolios',
    href: '/portfolio',
    labelKey: 'nav.portfolios',
    icon: Images,
    showFor: 'guest',
  },
  {
    key: 'professionals-guest',
    href: '/professionals',
    labelKey: 'browse.professionals',
    icon: Users,
    showFor: 'guest',
  },
  // Client navigation (authenticated, not pro)
  {
    key: 'browse',
    href: '/portfolio',
    labelKey: 'header.browse',
    icon: Search,
    showFor: 'client',
  },
  {
    key: 'my-jobs-client',
    href: '/my-jobs',
    labelKey: 'header.myJobs',
    icon: Briefcase,
    showFor: 'client',
  },
  // Pro navigation (4 items: 2 left + plus + 2 right)
  {
    key: 'find-jobs',
    href: '/jobs',
    labelKey: 'nav.jobs',
    icon: Briefcase,
    showFor: 'pro',
  },
  {
    key: 'my-work',
    href: '/my-work',
    labelKey: 'header.myWork',
    icon: Images,
    showFor: 'pro',
  },
  {
    key: 'my-jobs',
    href: '/my-jobs',
    labelKey: 'header.myJobs',
    icon: FileText,
    showFor: 'pro',
  },
  {
    key: 'tools-pro',
    href: '/tools',
    labelKey: 'nav.tools',
    icon: Calculator,
    showFor: 'pro',
  },
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
    if (pathname.includes('/tools')) return isPro ? 'tools-pro' : '';
    if (pathname.includes('/my-work')) return 'my-work';
    if (pathname.includes('/my-proposals')) return 'my-jobs';
    if (pathname.includes('/my-jobs')) return isPro ? 'my-jobs' : 'my-jobs-client';
    if (pathname.includes('/jobs')) return 'find-jobs';
    if (pathname.includes('/professionals')) return isPro ? '' : (isAuthenticated ? 'browse' : 'professionals-guest');
    if (pathname.includes('/portfolio')) return isPro ? '' : (isAuthenticated ? 'browse' : 'portfolios');
    return '';
  };

  const activeKey = getActiveKey();

  // Split items for left and right of center button
  const halfIndex = Math.ceil(visibleItems.length / 2);
  const leftItems = visibleItems.slice(0, halfIndex);
  const rightItems = visibleItems.slice(halfIndex);

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

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0a0a0a] border-t border-neutral-200 dark:border-neutral-800 safe-area-bottom">
        <div className="flex items-end justify-around h-16 px-2 pb-2">
          {/* Left side items */}
          {leftItems.map(renderNavItem)}

          {/* Center Post Job - icon protrudes above the bar */}
          {isAuthenticated ? (
            <Link
              href="/post-job"
              className="flex flex-col items-center flex-1 min-w-0 -mt-5"
            >
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
            <button
              onClick={() => openLoginModal()}
              className="flex flex-col items-center flex-1 min-w-0 -mt-5"
            >
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
          )}

          {/* Right side items */}
          {rightItems.map(renderNavItem)}
          {extraAction}
        </div>
      </nav>
      {/* Spacer for bottom nav */}
      <div className="lg:hidden h-[calc(4rem+env(safe-area-inset-bottom))]" />
    </>
  );
}
