/**
 * Cities served by the Germany (DE) marketplace.
 * Source data from `LanguageContext.countries.DE`.
 */

export const GERMAN_CITIES_EN = [
  'Berlin',
  'Hamburg',
  'Munich',
  'Cologne',
  'Frankfurt',
  'Stuttgart',
  'Düsseldorf',
  'Leipzig',
  'Dortmund',
  'Essen',
  'Bremen',
  'Dresden',
  'Hanover',
  'Nuremberg',
  'Duisburg',
  'Bochum',
  'Wuppertal',
  'Bielefeld',
  'Bonn',
  'Münster',
] as const;

// German native spellings - kept on `de` shape so future `de` locale
// addition is one swap. Until then the lookup falls back to en for
// non-en/ka/ru queries.
export const GERMAN_CITIES_DE = [
  'Berlin',
  'Hamburg',
  'München',
  'Köln',
  'Frankfurt',
  'Stuttgart',
  'Düsseldorf',
  'Leipzig',
  'Dortmund',
  'Essen',
  'Bremen',
  'Dresden',
  'Hannover',
  'Nürnberg',
  'Duisburg',
  'Bochum',
  'Wuppertal',
  'Bielefeld',
  'Bonn',
  'Münster',
] as const;

export const GERMAN_CITIES_RU = [
  'Берлин',
  'Гамбург',
  'Мюнхен',
  'Кёльн',
  'Франкфурт',
  'Штутгарт',
  'Дюссельдорф',
  'Лейпциг',
  'Дортмунд',
  'Эссен',
  'Бремен',
  'Дрезден',
  'Ганновер',
  'Нюрнберг',
  'Дуйсбург',
  'Бохум',
  'Вупперталь',
  'Билефельд',
  'Бонн',
  'Мюнстер',
] as const;
