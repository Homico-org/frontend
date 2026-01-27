'use client';

import { useState } from 'react';
import { useLanguage, Locale } from '@/contexts/LanguageContext';
import { useClickOutside } from '@/hooks/useClickOutside';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'icon';
}

const LANGUAGES = [
  { code: 'ka' as Locale, short: 'ქართ', name: 'ქართული' },
  { code: 'en' as Locale, short: 'Eng', name: 'English' },
  { code: 'ru' as Locale, short: 'Рус', name: 'Русский' },
];

export default function LanguageSelector({ variant = 'default' }: LanguageSelectorProps) {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];

  const handleSelect = (langCode: Locale) => {
    setLocale(langCode);
    setIsOpen(false);
  };

  // Icon only variant (matches main header)
  if (variant === 'icon') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center h-9 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
          title={locale === 'ka' ? 'ენის შეცვლა' : 'Change language'}
        >
          <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-200">{currentLang.short}</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-36 rounded-xl overflow-hidden z-[70] animate-scale-in bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-700">
            <div className="py-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    locale === lang.code
                      ? 'bg-[#C4735B]/10 text-[#C4735B] font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>{lang.name}</span>
                  <span className="text-xs font-medium opacity-60">{lang.short}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm"
        >
          <span className="text-neutral-700 dark:text-neutral-200 font-semibold">{currentLang.short}</span>
          <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg overflow-hidden z-50 animate-scale-in">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  locale === lang.code
                    ? 'bg-[#C4735B]/10 text-[#C4735B] font-semibold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <span>{lang.name}</span>
                <span className="text-xs font-medium opacity-60">{lang.short}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900 transition-all text-sm"
      >
        <span className="text-neutral-700 dark:text-neutral-200 font-semibold">{currentLang.short}</span>
        <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-40 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg overflow-hidden z-50 animate-scale-in">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                locale === lang.code
                  ? 'bg-[#C4735B]/10 text-[#C4735B] font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <span className="font-medium">{lang.name}</span>
              {locale === lang.code && (
                <svg className="w-4 h-4 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
