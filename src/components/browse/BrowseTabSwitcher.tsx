'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface BrowseTabSwitcherProps {
  activeTab: 'professionals' | 'feed';
  onTabChange: (tab: 'professionals' | 'feed') => void;
}

export default function BrowseTabSwitcher({
  activeTab,
  onTabChange,
}: BrowseTabSwitcherProps) {
  const { locale } = useLanguage();

  const tabs = [
    {
      key: 'professionals' as const,
      label: locale === 'ka' ? 'სპეციალისტები' : 'Specialists',
      icon: (
        <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      key: 'feed' as const,
      label: locale === 'ka' ? 'ნამუშევრები' : 'Portfolio',
      icon: (
        <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full flex gap-1.5">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5
              rounded-xl transition-all duration-150 touch-manipulation
              ${isActive
                ? 'bg-emerald-600 text-white font-medium shadow-sm'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
              }
            `}
          >
            <span className={`flex-shrink-0 ${isActive ? 'opacity-90' : 'opacity-60'}`}>
              {tab.icon}
            </span>
            <span className="text-sm">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
