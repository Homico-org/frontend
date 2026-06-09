/**
 * Country -> city list lookup.
 *
 * Today only GE is populated. New marketplaces add an entry here when
 * they go live; consumers (city pickers, address validators, settings
 * forms) call `citiesFor(country)` and get the right list without
 * changing their own code.
 */

import type { CountryCode } from "@/data/countries";
import {
  GEORGIAN_CITIES_EN,
  GEORGIAN_CITIES_KA,
  GEORGIAN_CITIES_RU,
} from "./ge";
import { ISRAELI_CITIES_EN, ISRAELI_CITIES_HE, ISRAELI_CITIES_RU } from "./il";
import { FRENCH_CITIES_EN, FRENCH_CITIES_FR, FRENCH_CITIES_RU } from "./fr";
import { US_CITIES_EN, US_CITIES_RU } from "./us";
import { GERMAN_CITIES_EN, GERMAN_CITIES_DE, GERMAN_CITIES_RU } from "./de";
import { UK_CITIES_EN, UK_CITIES_RU } from "./uk";

type Locale = "en" | "ka" | "ru";

// Per-country city lists. The locale key (`en`/`ka`/`ru`) matches the
// project's locale union; native-script lists (he/fr/de) live in their
// own per-country exports and slot in here when we add those locales.
//
// For markets without a dedicated `ka` translation, English serves as
// the Georgian fallback - a Georgian user browsing /us/settings sees
// English city names, which is the correct convention (cities not
// commonly transliterated into Georgian script).
const CITIES: Record<CountryCode, Record<Locale, readonly string[]>> = {
  GE: {
    en: GEORGIAN_CITIES_EN,
    ka: GEORGIAN_CITIES_KA,
    ru: GEORGIAN_CITIES_RU,
  },
  IL: {
    en: ISRAELI_CITIES_EN,
    ka: ISRAELI_CITIES_HE, // No Georgian transliteration ships yet
    ru: ISRAELI_CITIES_RU,
  },
  FR: {
    en: FRENCH_CITIES_EN,
    ka: FRENCH_CITIES_FR, // French names same in any Latin-script locale
    ru: FRENCH_CITIES_RU,
  },
  US: {
    en: US_CITIES_EN,
    ka: US_CITIES_EN,
    ru: US_CITIES_RU,
  },
  DE: {
    en: GERMAN_CITIES_EN,
    ka: GERMAN_CITIES_DE,
    ru: GERMAN_CITIES_RU,
  },
  UK: {
    en: UK_CITIES_EN,
    ka: UK_CITIES_EN,
    ru: UK_CITIES_RU,
  },
};

/**
 * Localized city list for a marketplace + locale. Falls back to GE
 * when an unsupported country code is requested so callers never get
 * back `undefined` mid-render.
 */
export function citiesFor(country: CountryCode | string, locale: Locale = "en"): readonly string[] {
  const entry = (CITIES as Record<string, Record<Locale, readonly string[]>>)[country] ?? CITIES.GE;
  return entry[locale] ?? entry.en;
}

/**
 * Composite pair lookup. Returns `{ en, ka, ru }` for a given index,
 * useful where we need to validate an English city name against
 * its localized variants.
 */
export function cityTriplet(
  country: CountryCode | string,
  index: number,
): { en: string; ka: string; ru: string } | null {
  const entry = (CITIES as Record<string, Record<Locale, readonly string[]>>)[country] ?? CITIES.GE;
  const en = entry.en?.[index];
  const ka = entry.ka?.[index];
  const ru = entry.ru?.[index];
  if (!en || !ka || !ru) return null;
  return { en, ka, ru };
}

/**
 * Per-city localized record list used by filter dropdowns. Each entry
 * pairs a stable `value` (lowercase English name, used for URL/query
 * state and as the substring the backend regex-matches against the
 * stored location field) with the en/ka/ru labels needed by the
 * locale picker. Falls back to GE so a malformed country code never
 * crashes the dropdown.
 *
 * Keeping spaces in the value (e.g. "new york", "tel aviv") means the
 * case-insensitive regex match on the backend's free-text `location`
 * field still hits multi-word city names.
 */
export function cityRecordsFor(country: CountryCode | string): Array<{
  value: string;
  labelEn: string;
  labelKa: string;
  labelRu: string;
}> {
  const entry = (CITIES as Record<string, Record<Locale, readonly string[]>>)[country] ?? CITIES.GE;
  const en = entry.en ?? [];
  const ka = entry.ka ?? en;
  const ru = entry.ru ?? en;
  return en.map((labelEn, i) => ({
    value: labelEn.toLowerCase(),
    labelEn,
    labelKa: ka[i] ?? labelEn,
    labelRu: ru[i] ?? labelEn,
  }));
}

/**
 * Translate a stored city name to the target locale across any
 * supported marketplace. Searches every country's lists for a match
 * (en, ka, or ru), then returns the same row's label in `locale`.
 *
 * Used by pro detail pages, browse cards, and anywhere we render a
 * stored serviceArea / city back to the visitor. Falls back to the
 * input unchanged when nothing matches (preserving custom user input
 * like "South Brooklyn" instead of mangling it).
 */
export function translateCity(value: string, locale: Locale): string {
  if (!value) return value;
  const lower = value.toLowerCase().trim();
  // Try every country's city list. We search across markets because a
  // pro browsing /us can have a stored Georgian city on their profile
  // if they migrated marketplaces, and we still want it readable.
  for (const country of Object.keys(CITIES) as CountryCode[]) {
    const entry = CITIES[country];
    for (const loc of ["en", "ka", "ru"] as Locale[]) {
      const list = entry[loc] ?? [];
      for (let i = 0; i < list.length; i++) {
        if (list[i].toLowerCase() === lower) {
          return entry[locale]?.[i] ?? list[i];
        }
      }
    }
  }
  return value;
}

/**
 * The "popular" prefix for a marketplace - the first N entries in the
 * city list. We curate the per-country files so the most-important
 * cities come first, which means "popular" is just `slice(0, n)`.
 */
export function popularCityValuesFor(
  country: CountryCode | string,
  count: number = 4,
): string[] {
  return cityRecordsFor(country).slice(0, count).map((c) => c.value);
}

export { GEORGIAN_CITIES_EN, GEORGIAN_CITIES_KA, GEORGIAN_CITIES_RU };
