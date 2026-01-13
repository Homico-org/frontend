'use client';

import { useState } from 'react';
import { useLanguage, Locale } from '@/contexts/LanguageContext';
import { useClickOutside } from '@/hooks/useClickOutside';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'icon';
}

const LANGUAGES = [
  { code: 'ka' as Locale, flag: '🇬🇪', name: 'ქართული' },
  { code: 'en' as Locale, flag: '🇺🇸', name: 'English' },
  { code: 'ru' as Locale, flag: '🇷🇺', name: 'Русский' },
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
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-all"
          title={locale === 'ka' ? 'ენის შეცვლა' : 'Change language'}
        >
          <span className="text-base">{currentLang.flag}</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-40 rounded-xl overflow-hidden z-[70] animate-scale-in bg-white shadow-xl border border-neutral-200">
            <div className="py-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    locale === lang.code
                      ? 'bg-neutral-100 text-neutral-900 font-medium'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
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
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-sm"
        >
          <span className="text-lg">{currentLang.flag}</span>
          <span className="text-neutral-600 font-medium">{locale.toUpperCase()}</span>
          <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden z-50 animate-scale-in">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  locale === lang.code
                    ? 'bg-neutral-100 text-neutral-900 font-medium'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
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
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white transition-all text-sm"
      >
        <span className="text-xl">{currentLang.flag}</span>
        <span className="text-neutral-700 font-medium">{currentLang.name}</span>
        <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-44 bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden z-50 animate-scale-in">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                locale === lang.code
                  ? 'bg-neutral-100 text-neutral-900 font-medium'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
              {locale === lang.code && (
                <svg className="w-4 h-4 text-[#C4735B] ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
