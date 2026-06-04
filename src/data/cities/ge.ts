/**
 * Cities served by the Georgia (GE) marketplace.
 *
 * Three parallel arrays so we can render the localized name without a
 * second lookup. Pairs by index: GEORGIAN_CITIES_EN[i] is the English
 * spelling of GEORGIAN_CITIES_KA[i] and GEORGIAN_CITIES_RU[i].
 *
 * Source of truth lives here (not in LanguageContext) so the post-job
 * address picker, settings city field, register flow and admin filters
 * all read the same list without circular imports through the locale
 * context.
 */

export const GEORGIAN_CITIES_EN = [
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
] as const;

export const GEORGIAN_CITIES_KA = [
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
] as const;

export const GEORGIAN_CITIES_RU = [
  "Тбилиси",
  "Батуми",
  "Кутаиси",
  "Рустави",
  "Зугдиди",
  "Гори",
  "Поти",
  "Кобулети",
  "Хашури",
  "Самтредиа",
  "Сенаки",
  "Зестафони",
  "Марнеули",
  "Телави",
  "Ахалцихе",
  "Озургети",
  "Каспи",
  "Чиатура",
  "Цкалтубо",
  "Сагареджо",
] as const;
