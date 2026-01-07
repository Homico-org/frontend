'use client';

import { useState } from 'react';
import { useLanguage, countries, CountryCode } from '@/contexts/LanguageContext';
import { useClickOutside } from '@/hooks/useClickOutside';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
}

export default function LanguageSelector({ variant = 'default' }: LanguageSelectorProps) {
  const { country, setCountry, locale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  const currentCountry = countries[country as CountryCode] || countries.US;

  const handleSelect = (countryCode: CountryCode) => {
    setCountry(countryCode);
    setIsOpen(false);
  };

  if (variant === 'compact') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-sm"
        >
          <span className="text-lg">{currentCountry.flag}</span>
          <span className="text-neutral-600 font-medium">{locale.toUpperCase()}</span>
          <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden z-50 animate-scale-in">
            {Object.entries(countries).map(([code, data]) => (
              <button
                key={code}
                onClick={() => handleSelect(code as CountryCode)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                  country === code
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span className="text-lg">{data.flag}</span>
                <span className="font-medium">{data.nameLocal}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-white transition-all text-sm"
      >
        <span className="text-xl">{currentCountry.flag}</span>
        <span className="text-neutral-700 font-medium">{currentCountry.nameLocal}</span>
        <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-48 bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden z-50 animate-scale-in">
          {Object.entries(countries).map(([code, data]) => (
            <button
              key={code}
              onClick={() => handleSelect(code as CountryCode)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                country === code
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span className="text-xl">{data.flag}</span>
              <div className="text-left">
                <p className="font-medium">{data.nameLocal}</p>
                {data.name !== data.nameLocal && (
                  <p className="text-xs text-neutral-500">{data.name}</p>
                )}
              </div>
              {country === code && (
                <svg className="w-4 h-4 text-blue-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
