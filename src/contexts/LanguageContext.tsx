'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/locales/en.json';
import ka from '@/locales/ka.json';

type Locale = 'en' | 'ka';

interface Translations {
  [key: string]: any;
}

const translations: Record<Locale, Translations> = { en, ka };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  country: string;
  setCountry: (country: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Country data with phone prefixes and cities
export const countries = {
  GE: {
    name: 'Georgia',
    nameLocal: 'საქართველო',
    locale: 'ka' as Locale,
    phonePrefix: '+995',
    flag: '🇬🇪',
    cities: [
      'Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi', 'Zugdidi', 'Gori', 'Poti', 'Kobuleti', 'Khashuri', 'Samtredia',
      'Senaki', 'Zestafoni', 'Marneuli', 'Telavi', 'Akhaltsikhe', 'Ozurgeti', 'Kaspi', 'Chiatura', 'Tsqaltubo', 'Sagarejo'
    ],
    citiesLocal: [
      'თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი', 'ზუგდიდი', 'გორი', 'ფოთი', 'ქობულეთი', 'ხაშური', 'სამტრედია',
      'სენაკი', 'ზესტაფონი', 'მარნეული', 'თელავი', 'ახალციხე', 'ოზურგეთი', 'კასპი', 'ჭიათურა', 'წყალტუბო', 'საგარეჯო'
    ]
  },
  US: {
    name: 'United States',
    nameLocal: 'United States',
    locale: 'en' as Locale,
    phonePrefix: '+1',
    flag: '🇺🇸',
    cities: [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego',
      'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'Seattle', 'Denver',
      'Boston', 'Portland', 'Las Vegas'
    ],
    citiesLocal: [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego',
      'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'Seattle', 'Denver',
      'Boston', 'Portland', 'Las Vegas'
    ]
  }
};

export type CountryCode = keyof typeof countries;

function detectCountry(): CountryCode {
  if (typeof window === 'undefined') return 'US';

  // Check timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone.includes('Tbilisi') || timezone.includes('Georgia')) {
    return 'GE';
  }

  // Check browser language
  const lang = navigator.language || (navigator as any).userLanguage;
  if (lang?.startsWith('ka')) {
    return 'GE';
  }

  return 'US';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default to Georgian (GE) and ka locale
  const [country, setCountry] = useState<CountryCode>('GE');
  const [locale, setLocale] = useState<Locale>('ka');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Always use Georgian for now
    setCountry('GE');
    setLocale('ka');
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('locale', locale);
      localStorage.setItem('country', country);

      // Update document lang attribute
      document.documentElement.lang = locale;
    }
  }, [locale, country, isInitialized]);

  const handleSetCountry = (newCountry: string) => {
    const countryCode = newCountry as CountryCode;
    if (countries[countryCode]) {
      setCountry(countryCode);
      setLocale(countries[countryCode].locale);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') return key;

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(`{${param}}`, String(val));
      });
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, country, setCountry: handleSetCountry }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useCountryData() {
  const { country } = useLanguage();
  return countries[country as CountryCode] || countries.US;
}
