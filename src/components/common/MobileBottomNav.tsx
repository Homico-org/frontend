'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Briefcase, FileText, Images, Search, Users } from 'lucide-react';
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
    labelKa: 'პორტფოლიო',
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
    labelKa: 'დათვალიერება',
    icon: Search,
    showFor: 'authenticated',
  },
  {
    key: 'find-jobs',
    href: '/browse/jobs',
    label: 'Find Jobs',
    labelKa: 'სამუშაოები',
    icon: Briefcase,
    showFor: 'pro',
  },
  {
    key: 'my-work',
    href: '/my-work',
    label: 'My Work',
    labelKa: 'ჩემი სამუშაო',
    icon: FileText,
    showFor: 'pro',
  },
  {
    key: 'my-jobs',
    href: '/my-jobs',
    label: 'My Jobs',
    labelKa: 'ჩემი პროექტები',
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
  const { user } = useAuth();

  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const isAuthenticated = !!user;

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

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0a0a0a] border-t border-neutral-200 dark:border-neutral-800 safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {visibleItems.map((item) => {
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
