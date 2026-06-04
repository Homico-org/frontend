/**
 * Cities served by the France (FR) marketplace.
 * Source data from `LanguageContext.countries.FR`.
 */

export const FRENCH_CITIES_EN = [
  'Paris',
  'Marseille',
  'Lyon',
  'Toulouse',
  'Nice',
  'Nantes',
  'Strasbourg',
  'Montpellier',
  'Bordeaux',
  'Lille',
  'Rennes',
  'Reims',
  'Le Havre',
  'Saint-Étienne',
  'Toulon',
  'Grenoble',
  'Dijon',
  'Angers',
  'Nîmes',
  'Villeurbanne',
] as const;

// French city names are mostly identical across locales (no script
// difference) so we export one list and the lookup re-uses it.
export const FRENCH_CITIES_FR = FRENCH_CITIES_EN;

export const FRENCH_CITIES_RU = [
  'Париж',
  'Марсель',
  'Лион',
  'Тулуза',
  'Ницца',
  'Нант',
  'Страсбург',
  'Монпелье',
  'Бордо',
  'Лилль',
  'Ренн',
  'Реймс',
  'Гавр',
  'Сент-Этьен',
  'Тулон',
  'Гренобль',
  'Дижон',
  'Анже',
  'Ним',
  'Вильёрбан',
] as const;
