"use client";

import en from "@/locales/en.json";
import ka from "@/locales/ka.json";
import ru from "@/locales/ru.json";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "en" | "ka" | "ru";

// Translation types for JSON locale files
type TranslationValue = any;
type Translations = Record<string, TranslationValue>;

const translations: Record<Locale, Translations> = { en, ka, ru };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  /**
   * Pick a localized string from a per-locale map (useful for backend-provided
   * fields like `name` / `nameKa` that aren't in the translation JSON).
   */
  pick: (
    values: Partial<Record<Locale, string | undefined>>,
    fallback?: string,
  ) => string;
  country: string;
  setCountry: (country: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

// Country data with phone prefixes and cities
export const countries = {
  GE: {
    name: "Georgia",
    nameLocal: "საქართველო",
    locale: "ka" as Locale,
    phonePrefix: "+995",
    flag: "🇬🇪",
    placeholder: "5XX XXX XXX",
    cities: [
      "Tbilisi",
      "Batumi",
      "Kutaisi",
      "Rustavi",
      "Zugdidi",
      "Gori",
      "Poti",
      "Kobuleti",
      "Khashuri",
      "Samtredia",
      "Senaki",
      "Zestafoni",
      "Marneuli",
      "Telavi",
      "Akhaltsikhe",
      "Ozurgeti",
      "Kaspi",
      "Chiatura",
      "Tsqaltubo",
      "Sagarejo",
    ],
    citiesLocal: [
      "თბილისი",
      "ბათუმი",
      "ქუთაისი",
      "რუსთავი",
      "ზუგდიდი",
      "გორი",
      "ფოთი",
      "ქობულეთი",
      "ხაშური",
      "სამტრედია",
      "სენაკი",
      "ზესტაფონი",
      "მარნეული",
      "თელავი",
      "ახალციხე",
      "ოზურგეთი",
      "კასპი",
      "ჭიათურა",
      "წყალტუბო",
      "საგარეჯო",
    ],
  },
  IL: {
    name: "Israel",
    nameLocal: "ישראל",
    locale: "en" as Locale,
    phonePrefix: "+972",
    flag: "🇮🇱",
    placeholder: "5X XXX XXXX",
    cities: [
      "Tel Aviv",
      "Jerusalem",
      "Haifa",
      "Rishon LeZion",
      "Petah Tikva",
      "Ashdod",
      "Netanya",
      "Beer Sheva",
      "Holon",
      "Bnei Brak",
      "Ramat Gan",
      "Ashkelon",
      "Rehovot",
      "Bat Yam",
      "Herzliya",
      "Kfar Saba",
      "Hadera",
      "Modi'in",
      "Nazareth",
      "Lod",
    ],
    citiesLocal: [
      "תל אביב",
      "ירושלים",
      "חיפה",
      "ראשון לציון",
      "פתח תקווה",
      "אשדוד",
      "נתניה",
      "באר שבע",
      "חולון",
      "בני ברק",
      "רמת גן",
      "אשקלון",
      "רחובות",
      "בת ים",
      "הרצליה",
      "כפר סבא",
      "חדרה",
      "מודיעין",
      "נצרת",
      "לוד",
    ],
  },
  FR: {
    name: "France",
    nameLocal: "France",
    locale: "en" as Locale,
    phonePrefix: "+33",
    flag: "🇫🇷",
    placeholder: "X XX XX XX XX",
    cities: [
      "Paris",
      "Marseille",
      "Lyon",
      "Toulouse",
      "Nice",
      "Nantes",
      "Strasbourg",
      "Montpellier",
      "Bordeaux",
      "Lille",
      "Rennes",
      "Reims",
      "Le Havre",
      "Saint-Étienne",
      "Toulon",
      "Grenoble",
      "Dijon",
      "Angers",
      "Nîmes",
      "Villeurbanne",
    ],
    citiesLocal: [
      "Paris",
      "Marseille",
      "Lyon",
      "Toulouse",
      "Nice",
      "Nantes",
      "Strasbourg",
      "Montpellier",
      "Bordeaux",
      "Lille",
      "Rennes",
      "Reims",
      "Le Havre",
      "Saint-Étienne",
      "Toulon",
      "Grenoble",
      "Dijon",
      "Angers",
      "Nîmes",
      "Villeurbanne",
    ],
  },
  US: {
    name: "United States",
    nameLocal: "United States",
    locale: "en" as Locale,
    phonePrefix: "+1",
    flag: "🇺🇸",
    placeholder: "(XXX) XXX-XXXX",
    cities: [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia",
      "San Antonio",
      "San Diego",
      "Dallas",
      "San Jose",
      "Austin",
      "Jacksonville",
      "Fort Worth",
      "Columbus",
      "Charlotte",
      "Seattle",
      "Denver",
      "Boston",
      "Portland",
      "Las Vegas",
    ],
    citiesLocal: [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia",
      "San Antonio",
      "San Diego",
      "Dallas",
      "San Jose",
      "Austin",
      "Jacksonville",
      "Fort Worth",
      "Columbus",
      "Charlotte",
      "Seattle",
      "Denver",
      "Boston",
      "Portland",
      "Las Vegas",
    ],
  },
  DE: {
    name: "Germany",
    nameLocal: "Deutschland",
    locale: "en" as Locale,
    phonePrefix: "+49",
    flag: "🇩🇪",
    placeholder: "XXX XXXXXXXX",
    cities: [
      "Berlin",
      "Hamburg",
      "Munich",
      "Cologne",
      "Frankfurt",
      "Stuttgart",
      "Düsseldorf",
      "Leipzig",
      "Dortmund",
      "Essen",
      "Bremen",
      "Dresden",
      "Hanover",
      "Nuremberg",
      "Duisburg",
      "Bochum",
      "Wuppertal",
      "Bielefeld",
      "Bonn",
      "Münster",
    ],
    citiesLocal: [
      "Berlin",
      "Hamburg",
      "München",
      "Köln",
      "Frankfurt",
      "Stuttgart",
      "Düsseldorf",
      "Leipzig",
      "Dortmund",
      "Essen",
      "Bremen",
      "Dresden",
      "Hannover",
      "Nürnberg",
      "Duisburg",
      "Bochum",
      "Wuppertal",
      "Bielefeld",
      "Bonn",
      "Münster",
    ],
  },
  UK: {
    name: "United Kingdom",
    nameLocal: "United Kingdom",
    locale: "en" as Locale,
    phonePrefix: "+44",
    flag: "🇬🇧",
    placeholder: "XXXX XXXXXX",
    cities: [
      "London",
      "Birmingham",
      "Manchester",
      "Glasgow",
      "Liverpool",
      "Leeds",
      "Sheffield",
      "Edinburgh",
      "Bristol",
      "Leicester",
      "Coventry",
      "Bradford",
      "Cardiff",
      "Belfast",
      "Nottingham",
      "Newcastle",
      "Southampton",
      "Brighton",
      "Plymouth",
      "Reading",
    ],
    citiesLocal: [
      "London",
      "Birmingham",
      "Manchester",
      "Glasgow",
      "Liverpool",
      "Leeds",
      "Sheffield",
      "Edinburgh",
      "Bristol",
      "Leicester",
      "Coventry",
      "Bradford",
      "Cardiff",
      "Belfast",
      "Nottingham",
      "Newcastle",
      "Southampton",
      "Brighton",
      "Plymouth",
      "Reading",
    ],
  },
};

export type CountryCode = keyof typeof countries;

function detectCountry(): CountryCode {
  if (typeof window === "undefined") return "US";

  // Check timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone.includes("Tbilisi") || timezone.includes("Georgia")) {
    return "GE";
  }

  // Check browser language
  const lang =
    navigator.language ||
    (navigator as Navigator & { userLanguage?: string }).userLanguage;
  if (lang?.startsWith("ka")) {
    return "GE";
  }

  return "US";
}

interface LanguageProviderProps {
  children: ReactNode;
  /**
   * Locale to render the very first paint with. The server layout reads
   * the `homico-locale` cookie via `next/headers` and passes it here so
   * SSR + first client paint match the user's saved language. Without
   * this, every refresh showed a Georgian flash before localStorage
   * could swap to English/Russian. Falls back to "ka" when missing.
   */
  initialLocale?: Locale;
  /**
   * Phone-input country saved on the previous visit. Same SSR-flash
   * argument as `initialLocale`. Falls back to "GE".
   */
  initialCountry?: CountryCode;
}

// Helper to write the locale cookie. 1-year TTL, root path, lax samesite
// so it's sent on top-level navigations. Not HttpOnly because the
// client also writes it.
function writeLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `homico-locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

function writeCountryCookie(country: CountryCode) {
  if (typeof document === "undefined") return;
  document.cookie = `homico-country=${country}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function LanguageProvider({
  children,
  initialLocale,
  initialCountry,
}: LanguageProviderProps) {
  // Seed state from the server-provided cookie value so SSR and first
  // client paint already render in the right language. localStorage is
  // still consulted in the effect below as a fallback for users whose
  // cookie hasn't been set yet (pre-cookie-fix returning visitors).
  const [country, setCountry] = useState<CountryCode>(initialCountry ?? "GE");
  const [locale, setLocale] = useState<Locale>(initialLocale ?? "ka");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // One-time migration: if the cookie wasn't set yet but localStorage
    // has a value from before this fix, mirror it into the cookie so
    // the next refresh renders correctly. Existing cookie wins.
    try {
      const savedLocale = localStorage.getItem("locale") as Locale | null;
      const savedCountry = localStorage.getItem(
        "country",
      ) as CountryCode | null;

      if (
        !initialLocale &&
        savedLocale &&
        ["en", "ka", "ru"].includes(savedLocale)
      ) {
        setLocale(savedLocale);
      }

      if (!initialCountry && savedCountry && countries[savedCountry]) {
        setCountry(savedCountry);
      }
    } catch {
      // localStorage not available, use defaults
    }

    setIsInitialized(true);
  }, [initialLocale, initialCountry]);

  useEffect(() => {
    if (isInitialized) {
      // Mirror to localStorage (legacy clients) AND cookie (for SSR).
      try {
        localStorage.setItem("locale", locale);
        localStorage.setItem("country", country);
      } catch {
        // ignore
      }
      writeLocaleCookie(locale);
      writeCountryCookie(country);

      // Update document lang attribute so screen readers + Google see
      // the active locale.
      document.documentElement.lang = locale;
    }
  }, [locale, country, isInitialized]);

  const handleSetCountry = useCallback((newCountry: string) => {
    const countryCode = newCountry as CountryCode;
    if (countries[countryCode]) {
      setCountry(countryCode);
      setLocale(countries[countryCode].locale);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split(".");
      let value: TranslationValue = translations[locale];

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          // Fallback to English
          value = translations.en;
          for (const fallbackKey of keys) {
            if (value && typeof value === "object" && fallbackKey in value) {
              value = value[fallbackKey];
            } else {
              return key; // Return key if not found
            }
          }
          break;
        }
      }

      if (typeof value !== "string") return key;

      // Replace parameters
      if (params) {
        Object.entries(params).forEach(([param, val]) => {
          value = value.replace(`{${param}}`, String(val));
        });
      }

      return value;
    },
    [locale],
  );

  const pick = useCallback(
    (
      values: Partial<Record<Locale, string | undefined>>,
      fallback = "",
    ): string => {
      return values[locale] ?? values.en ?? values.ka ?? values.ru ?? fallback;
    },
    [locale],
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      pick,
      country,
      setCountry: handleSetCountry,
    }),
    [locale, setLocale, t, pick, country, handleSetCountry],
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function useCountryData() {
  const { country } = useLanguage();
  return countries[country as CountryCode] || countries.US;
}
