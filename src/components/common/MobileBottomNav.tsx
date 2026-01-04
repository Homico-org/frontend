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
  showFor: 'all' | 'pro' | 'client';
};

const NAV_ITEMS: NavItem[] = [
  {
    key: 'browse',
    href: '/browse/portfolio',
    label: 'Browse',
    labelKa: 'დათვალიერება',
    icon: Search,
    showFor: 'all',
  },
  {
    key: 'jobs',
    href: '/browse/jobs',
    label: 'Jobs',
    labelKa: 'სამუშაო',
    icon: Briefcase,
    showFor: 'pro',
  },
  {
    key: 'proposals',
    href: '/my-proposals',
    label: 'Proposals',
    labelKa: 'შეთავაზებები',
    icon: FileText,
    showFor: 'pro',
  },
  {
    key: 'my-jobs',
    href: '/my-jobs',
    label: 'My Jobs',
    labelKa: 'ჩემი პროექტები',
    icon: Images,
    showFor: 'all',
  },
  {
    key: 'professionals',
    href: '/browse/professionals',
    label: 'Pros',
    labelKa: 'სპეცები',
    icon: Users,
    showFor: 'client',
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

  // Filter items based on user role
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.showFor === 'all') return true;
    if (item.showFor === 'pro' && isPro) return true;
    if (item.showFor === 'client' && !isPro) return true;
    return false;
  });

  // Determine active tab
  const getActiveKey = () => {
    if (pathname.includes('/my-proposals')) return 'proposals';
    if (pathname.includes('/my-jobs')) return 'my-jobs';
    if (pathname.includes('/browse/jobs')) return 'jobs';
    if (pathname.includes('/browse/professionals')) return 'professionals';
    if (pathname.includes('/browse')) return 'browse';
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
