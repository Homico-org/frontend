/**
 * Cities served by the Israel (IL) marketplace.
 *
 * Pair-indexed with the locale arrays. Source data came from
 * `LanguageContext.countries.IL` originally - moved here in 2026-05
 * so the post-job address picker, settings, register flow and admin
 * filters all read from one place.
 */

export const ISRAELI_CITIES_EN = [
  'Tel Aviv',
  'Jerusalem',
  'Haifa',
  'Rishon LeZion',
  'Petah Tikva',
  'Ashdod',
  'Netanya',
  'Beer Sheva',
  'Holon',
  'Bnei Brak',
  'Ramat Gan',
  'Ashkelon',
  'Rehovot',
  'Bat Yam',
  'Herzliya',
  'Kfar Saba',
  'Hadera',
  "Modi'in",
  'Nazareth',
  'Lod',
] as const;

// Hebrew (he) - kept on the locale=ka slot for now because the project
// only ships en/ka/ru locales. When `he` joins the locale union, move
// these into a dedicated key.
export const ISRAELI_CITIES_HE = [
  'תל אביב',
  'ירושלים',
  'חיפה',
  'ראשון לציון',
  'פתח תקווה',
  'אשדוד',
  'נתניה',
  'באר שבע',
  'חולון',
  'בני ברק',
  'רמת גן',
  'אשקלון',
  'רחובות',
  'בת ים',
  'הרצליה',
  'כפר סבא',
  'חדרה',
  'מודיעין',
  'נצרת',
  'לוד',
] as const;

export const ISRAELI_CITIES_RU = [
  'Тель-Авив',
  'Иерусалим',
  'Хайфа',
  'Ришон-ле-Цион',
  'Петах-Тиква',
  'Ашдод',
  'Нетания',
  'Беэр-Шева',
  'Холон',
  'Бней-Брак',
  'Рамат-Ган',
  'Ашкелон',
  'Реховот',
  'Бат-Ям',
  'Герцлия',
  'Кфар-Саба',
  'Хадера',
  'Модиин',
  'Назарет',
  'Лод',
] as const;
