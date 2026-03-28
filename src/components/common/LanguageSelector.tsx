'use client';

import { useState } from 'react';
import { useLanguage, Locale } from '@/contexts/LanguageContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { ChevronDown, Check } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'icon';
}

const LANGUAGES: { code: Locale; short: string; name: string; flag: string }[] = [
  { code: 'ka', short: 'ქართ', name: 'ქართული', flag: '🇬🇪' },
  { code: 'en', short: 'Eng', name: 'English', flag: '🇬🇧' },
  { code: 'ru', short: 'Рус', name: 'Русский', flag: '🇷🇺' },
];

function LanguageDropdown({
  isOpen,
  locale,
  onSelect,
  align = 'right',
}: {
  isOpen: boolean;
  locale: Locale;
  onSelect: (code: Locale) => void;
  align?: 'left' | 'right';
}) {
  if (!isOpen) return null;

  return (
    <div
      className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 w-44 rounded-2xl overflow-hidden z-[70] animate-scale-in bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200/80 dark:border-neutral-700/80 backdrop-blur-sm`}
    >
      <div className="p-1.5">
        {LANGUAGES.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-[#C4735B]/10'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/70'
              }`}
            >
              <span className="text-lg leading-none">{lang.flag}</span>
              <span
                className={`flex-1 text-left transition-colors ${
                  isActive
                    ? 'text-[#C4735B] font-semibold'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {lang.name}
              </span>
              {isActive && (
                <Check className="w-4 h-4 text-[#C4735B]" strokeWidth={2.5} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LanguageSelector({ variant = 'default' }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];

  const handleSelect = (langCode: Locale) => {
    setLocale(langCode);
    setIsOpen(false);
  };

  // Icon variant (header)
  if (variant === 'icon') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 h-9 px-2.5 rounded-xl transition-all ${
            isOpen
              ? 'bg-[#C4735B]/10 ring-2 ring-[#C4735B]/20'
              : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
          title={t('common.changeLanguage')}
        >
          <span className="text-base leading-none">{currentLang.flag}</span>
          <span className={`text-[13px] font-semibold ${isOpen ? 'text-[#C4735B]' : 'text-neutral-700 dark:text-neutral-200'}`}>
            {currentLang.short}
          </span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#C4735B]' : 'text-neutral-400'}`} />
        </button>
        <LanguageDropdown isOpen={isOpen} locale={locale} onSelect={handleSelect} />
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-sm ${
            isOpen
              ? 'bg-[#C4735B]/10'
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <span className="text-base leading-none">{currentLang.flag}</span>
          <span className={`font-semibold ${isOpen ? 'text-[#C4735B]' : 'text-neutral-700 dark:text-neutral-200'}`}>
            {currentLang.short}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#C4735B]' : 'text-neutral-400'}`} />
        </button>
        <LanguageDropdown isOpen={isOpen} locale={locale} onSelect={handleSelect} />
      </div>
    );
  }

  // Default variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm ${
          isOpen
            ? 'border-[#C4735B]/40 bg-[#C4735B]/5 ring-2 ring-[#C4735B]/10'
            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900'
        }`}
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span className={`font-semibold ${isOpen ? 'text-[#C4735B]' : 'text-neutral-700 dark:text-neutral-200'}`}>
          {currentLang.short}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#C4735B]' : 'text-neutral-400'}`} />
      </button>
      <LanguageDropdown isOpen={isOpen} locale={locale} onSelect={handleSelect} align="left" />
    </div>
  );
}
