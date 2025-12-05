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
      label: locale === 'ka' ? 'პროფესიონალები' : 'Professionals',
      description: locale === 'ka' ? 'იპოვე სპეციალისტი' : 'Find specialists',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      key: 'feed' as const,
      label: locale === 'ka' ? 'ფიდი' : 'Feed',
      description: locale === 'ka' ? 'დაათვალიერე ნამუშევრები' : 'Browse portfolio',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full grid grid-cols-2 gap-3 p-1 rounded-2xl" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              relative flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl
              font-medium transition-all duration-300 touch-manipulation
              ${isActive
                ? 'bg-[var(--color-bg-primary)] shadow-sm'
                : 'hover:bg-[var(--color-bg-secondary)]/50'
              }
            `}
          >
            {/* Icon */}
            <span
              className={`transition-colors duration-300 ${
                isActive
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-tertiary)]'
              }`}
            >
              {tab.icon}
            </span>

            {/* Text content */}
            <div className="flex flex-col items-start text-left">
              <span
                className={`text-sm sm:text-base transition-colors duration-300 ${
                  isActive
                    ? 'text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {tab.label}
              </span>
              <span
                className={`hidden sm:block text-xs transition-colors duration-300 ${
                  isActive
                    ? 'text-[var(--color-text-secondary)]'
                    : 'text-[var(--color-text-tertiary)]'
                }`}
              >
                {tab.description}
              </span>
            </div>

            {/* Active indicator bar */}
            {isActive && (
              <div
                className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[var(--color-accent)]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
