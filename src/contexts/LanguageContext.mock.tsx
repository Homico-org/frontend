'use client';

import React, { createContext, useContext, ReactNode } from 'react';

type Locale = 'en' | 'ka' | 'ru';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  country: string;
  setCountry: (country: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Country data - simplified for Storybook
export const countries = {
  GE: {
    name: 'Georgia',
    nameLocal: 'საქართველო',
    locale: 'ka' as Locale,
    phonePrefix: '+995',
    flag: '🇬🇪',
    placeholder: '5XX XXX XXX',
    cities: ['Tbilisi', 'Batumi', 'Kutaisi'],
    citiesLocal: ['თბილისი', 'ბათუმი', 'ქუთაისი']
  },
  US: {
    name: 'United States',
    nameLocal: 'United States',
    locale: 'en' as Locale,
    phonePrefix: '+1',
    flag: '🇺🇸',
    placeholder: '(XXX) XXX-XXXX',
    cities: ['New York', 'Los Angeles', 'Chicago'],
    citiesLocal: ['New York', 'Los Angeles', 'Chicago']
  }
};

export type CountryCode = keyof typeof countries;

export function LanguageProvider({
  children,
  defaultLocale = 'en'
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const mockContext: LanguageContextType = {
    locale: defaultLocale,
    setLocale: () => {},
    t: (key: string, params?: Record<string, string | number>) => {
      // Return a readable version of the key for Storybook
      const parts = key.spli".";
      let result = parts[parts.length - 1]
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim();

      // Handle parameter replacement
      if (params) {
        Object.entries(params).forEach(([param, val]) => {
          result = result.replace(`{${param}}`, String(val));
        });
      }

      return result;
    },
    country: 'US',
    setCountry: () => {},
  };

  return (
    <LanguageContext.Provider value={mockContext}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Return default for Storybook without provider
    return {
      locale: 'en',
      setLocale: () => {},
      t: (key: string) => key.spli".".pop()?.replace(/_/g, ' ') || key,
      country: 'US',
      setCountry: () => {},
    };
  }
  return context;
}

export function useCountryData() {
  const { country } = useLanguage();
  return countries[country as CountryCode] || countries.US;
}
