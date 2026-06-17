// Shared, localized labels for the moderated public-profile fields. Used by
// the admin moderation hub (/admin/moderation) and the pro-facing
// "changes pending review" banner so both name fields the same way.

type Locale = 'en' | 'ka' | 'ru';

export const PROFILE_FIELD_LABELS: Record<string, Record<Locale, string>> = {
  name: { en: 'Name', ka: 'სახელი', ru: 'Имя' },
  firstName: { en: 'First name', ka: 'სახელი', ru: 'Имя' },
  lastName: { en: 'Last name', ka: 'გვარი', ru: 'Фамилия' },
  avatar: { en: 'Avatar', ka: 'ავატარი', ru: 'Аватар' },
  coverImage: { en: 'Cover image', ka: 'ფონური სურათი', ru: 'Обложка' },
  title: { en: 'Title', ka: 'სათაური', ru: 'Заголовок' },
  tagline: { en: 'Tagline', ka: 'სლოგანი', ru: 'Слоган' },
  bio: { en: 'Bio', ka: 'ბიო', ru: 'Био' },
  description: { en: 'Description', ka: 'აღწერა', ru: 'Описание' },
  categories: { en: 'Categories', ka: 'კატეგორიები', ru: 'Категории' },
  subcategories: { en: 'Subcategories', ka: 'ქვეკატეგორიები', ru: 'Подкатегории' },
  selectedServices: { en: 'Services', ka: 'სერვისები', ru: 'Услуги' },
  servicePricing: { en: 'Pricing', ka: 'ფასები', ru: 'Цены' },
  yearsExperience: { en: 'Years of experience', ka: 'გამოცდილება (წლები)', ru: 'Опыт (лет)' },
  serviceAreas: { en: 'Service areas', ka: 'მომსახურების ზონები', ru: 'Зоны обслуживания' },
  pricingModel: { en: 'Pricing model', ka: 'ფასის მოდელი', ru: 'Модель цены' },
  basePrice: { en: 'Base price', ka: 'საბაზისო ფასი', ru: 'Базовая цена' },
  maxPrice: { en: 'Max price', ka: 'მაქს. ფასი', ru: 'Макс. цена' },
  phone: { en: 'Phone', ka: 'ტელეფონი', ru: 'Телефон' },
  whatsapp: { en: 'WhatsApp', ka: 'WhatsApp', ru: 'WhatsApp' },
  telegram: { en: 'Telegram', ka: 'Telegram', ru: 'Telegram' },
  facebookUrl: { en: 'Facebook', ka: 'Facebook', ru: 'Facebook' },
  instagramUrl: { en: 'Instagram', ka: 'Instagram', ru: 'Instagram' },
  linkedinUrl: { en: 'LinkedIn', ka: 'LinkedIn', ru: 'LinkedIn' },
  tiktokUrl: { en: 'TikTok', ka: 'TikTok', ru: 'TikTok' },
  websiteUrl: { en: 'Website', ka: 'ვებსაიტი', ru: 'Сайт' },
  portfolioProjects: { en: 'Portfolio', ka: 'პორტფოლიო', ru: 'Портфолио' },
  portfolioImages: { en: 'Portfolio images', ka: 'პორტფოლიოს სურათები', ru: 'Изображения портфолио' },
  certifications: { en: 'Certifications', ka: 'სერთიფიკატები', ru: 'Сертификаты' },
  languages: { en: 'Languages', ka: 'ენები', ru: 'Языки' },
  profileType: { en: 'Profile type', ka: 'პროფილის ტიპი', ru: 'Тип профиля' },
  city: { en: 'City', ka: 'ქალაქი', ru: 'Город' },
};

export function getProfileFieldLabel(field: string, locale: string): string {
  const loc = (locale as Locale) || 'en';
  return PROFILE_FIELD_LABELS[field]?.[loc] || PROFILE_FIELD_LABELS[field]?.en || field;
}
