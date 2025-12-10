'use client';

import ButtonGroup from '@/components/ui/ButtonGroup';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePathname } from 'next/navigation';

export type ContentType = 'jobs' | 'portfolio' | 'professionals';

interface ContentTypeSwitcherProps {
  isPro?: boolean;
}

export default function ContentTypeSwitcher({
  isPro = false,
}: ContentTypeSwitcherProps) {
  const { locale } = useLanguage();
  const pathname = usePathname();

  // Determine active tab from pathname
  const getActiveTab = (): ContentType => {
    if (pathname.includes('/browse/jobs')) return 'jobs';
    if (pathname.includes('/browse/portfolio')) return 'portfolio';
    return 'professionals';
  };

  const activeTab = getActiveTab();

  const tabs: { key: ContentType; route: string; label: string; labelKa: string; icon: React.ReactNode; showFor: 'all' | 'pro' }[] = [
    {
      key: 'jobs',
      route: '/browse/jobs',
      label: 'Opportunities',
      labelKa: 'შესაძლებლობები',
      showFor: 'pro',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeLinecap="round" />
          <path d="M12 11v6M12 11l2.5 2.5M12 11l-2.5 2.5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'portfolio',
      route: '/browse/portfolio',
      label: 'Portfolio',
      labelKa: 'ნამუშევრები',
      showFor: 'all',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      key: 'professionals',
      route: '/browse/professionals',
      label: 'Professionals',
      labelKa: 'პროფესიონალები',
      showFor: 'all',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
  ];

  const visibleTabs = tabs.filter(tab => tab.showFor === 'all' || (tab.showFor === 'pro' && isPro));

  const buttonGroupItems = visibleTabs.map(tab => ({
    key: tab.key,
    label: locale === 'ka' ? tab.labelKa : tab.label,
    icon: tab.icon,
    href: tab.route,
  }));

  return (
    <ButtonGroup
      items={buttonGroupItems}
      activeKey={activeTab}
      size="md"
      variant="default"
      fullWidth
    />
  );
}
