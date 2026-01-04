'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Briefcase, FileText, Images, Plus, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const ACCENT_COLOR = '#C4735B';

type NavItem = {
  key: string;
  href: string;
  label: string;
  labelKa: string;
  icon: typeof Briefcase;
  showFor: 'all' | 'pro' | 'client' | 'authenticated' | 'guest';
};

const NAV_ITEMS: NavItem[] = [
  // Guest navigation (not logged in)
  {
    key: 'portfolios',
    href: '/browse/portfolio',
    label: 'Portfolios',
    labelKa: 'ნამუშევრები',
    icon: Images,
    showFor: 'guest',
  },
  {
    key: 'professionals',
    href: '/browse/professionals',
    label: 'Pros',
    labelKa: 'სპეცები',
    icon: Users,
    showFor: 'guest',
  },
  // Authenticated navigation
  {
    key: 'browse',
    href: '/browse/portfolio',
    label: 'Browse',
    labelKa: 'ძიება',
    icon: Search,
    showFor: 'authenticated',
  },
  {
    key: 'find-jobs',
    href: '/browse/jobs',
    label: 'Jobs',
    labelKa: 'სამუშაო',
    icon: Briefcase,
    showFor: 'pro',
  },
  {
    key: 'my-work',
    href: '/my-work',
    label: 'My Work',
    labelKa: 'სამუშაო',
    icon: FileText,
    showFor: 'pro',
  },
  {
    key: 'my-jobs',
    href: '/my-jobs',
    label: 'My Jobs',
    labelKa: 'პროექტები',
    icon: Briefcase,
    showFor: 'authenticated',
  },
];

interface MobileBottomNavProps {
  extraAction?: ReactNode;
}

export default function MobileBottomNav({ extraAction }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const { user, isLoading } = useAuth();

  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const isAuthenticated = !!user;

  // Don't render until auth state is determined to prevent flash
  if (isLoading) {
    return (
      <>
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0a0a0a] border-t border-neutral-200 dark:border-neutral-800 safe-area-bottom">
          <div className="flex items-center justify-around h-14 px-2">
            {/* Skeleton placeholders */}
            <div className="flex flex-col items-center justify-center gap-1 flex-1 py-1.5">
              <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
              <div className="w-10 h-2 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
            </div>
            <div className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 -mt-3">
              <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse" />
              <div className="w-8 h-2 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mt-0.5" />
            </div>
            <div className="flex flex-col items-center justify-center gap-1 flex-1 py-1.5">
              <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
              <div className="w-10 h-2 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
            </div>
          </div>
        </nav>
        <div className="lg:hidden h-14" />
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
    if (pathname.includes('/my-work')) return 'my-work';
    if (pathname.includes('/my-proposals')) return 'my-work'; // Redirect case
    if (pathname.includes('/my-jobs')) return 'my-jobs';
    if (pathname.includes('/browse/jobs')) return 'find-jobs';
    if (pathname.includes('/browse/professionals')) return isAuthenticated ? 'browse' : 'professionals';
    if (pathname.includes('/browse/portfolio')) return isAuthenticated ? 'browse' : 'portfolios';
    if (pathname.includes('/browse')) return isAuthenticated ? 'browse' : 'portfolios';
    return '';
  };

  const activeKey = getActiveKey();

  // Split items for left and right of center button
  const halfIndex = Math.ceil(visibleItems.length / 2);
  const leftItems = visibleItems.slice(0, halfIndex);
  const rightItems = visibleItems.slice(halfIndex);

  const isPostJobActive = pathname === '/post-job';

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0a0a0a] border-t border-neutral-200 dark:border-neutral-800 safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {/* Left side items */}
          {leftItems.map((item) => {
            const isActive = activeKey === item.key;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors ${
                  isActive ? '' : 'text-neutral-400 dark:text-neutral-500'
                }`}
                style={isActive ? { color: ACCENT_COLOR } : {}}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">
                  {locale === 'ka' ? item.labelKa : item.label}
                </span>
              </Link>
            );
          })}

          {/* Center Post Job button */}
          <Link
            href="/post-job"
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 -mt-3"
          >
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform active:scale-95 ${
                isPostJobActive ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{
                background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #B86349 100%)`,
                boxShadow: `0 4px 14px ${ACCENT_COLOR}50`,
                ...(isPostJobActive ? { '--tw-ring-color': ACCENT_COLOR } as React.CSSProperties : {}),
              }}
            >
              <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span
              className="text-[10px] font-medium mt-0.5"
              style={{ color: ACCENT_COLOR }}
            >
              {locale === 'ka' ? 'დამატება' : 'Post'}
            </span>
          </Link>

          {/* Right side items */}
          {rightItems.map((item) => {
            const isActive = activeKey === item.key;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors ${
                  isActive ? '' : 'text-neutral-400 dark:text-neutral-500'
                }`}
                style={isActive ? { color: ACCENT_COLOR } : {}}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">
                  {locale === 'ka' ? item.labelKa : item.label}
                </span>
              </Link>
            );
          })}
          {extraAction}
        </div>
      </nav>
      {/* Spacer for bottom nav */}
      <div className="lg:hidden h-14" />
    </>
  );
}
