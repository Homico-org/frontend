import { useLanguage } from '@/contexts/LanguageContext';
import { useCallback } from 'react';

// Centralized category labels mapping
const CATEGORY_LABELS: Record<string, { en: string; ka: string; ru: string }> = {
  // Main categories
  renovation: { en: 'Renovation', ka: 'რემონტი', ru: 'Ремонт' },
  design: { en: 'Design', ka: 'დიზაინი', ru: 'Дизайн' },
  architecture: { en: 'Architecture', ka: 'არქიტექტურა', ru: 'Архитектура' },
  services: { en: 'Services', ka: 'სერვისები', ru: 'Услуги' },
  craftsmen: { en: 'Craftsmen', ka: 'ხელოსნები', ru: 'Мастера' },
  homecare: { en: 'Home Care', ka: 'სახლის მოვლა', ru: 'Уход за домом' },
  'home-care': { en: 'Home Care', ka: 'მოვლა', ru: 'Уход' },

  // Subcategories - Renovation
  plumbing: { en: 'Plumbing', ka: 'სანტექნიკა', ru: 'Сантехника' },
  electrical: { en: 'Electrical', ka: 'ელექტრობა', ru: 'Электрика' },
  electricity: { en: 'Electricity', ka: 'ელექტროსანტექნიკა', ru: 'Электричество' },
  painting: { en: 'Painting', ka: 'შეღებვა', ru: 'Покраска' },
  mural: { en: 'Mural', ka: 'მალიარი', ru: 'Роспись' },
  flooring: { en: 'Flooring', ka: 'იატაკი', ru: 'Полы' },
  roofing: { en: 'Roofing', ka: 'სახურავი', ru: 'Кровля' },
  tile: { en: 'Tile', ka: 'ჭერი', ru: 'Плитка' },
  tiling: { en: 'Tiling', ka: 'მოპირკეთება', ru: 'Укладка плитки' },
  plastering: { en: 'Plastering', ka: 'მლესავი', ru: 'Штукатурка' },
  hvac: { en: 'HVAC', ka: 'კონდიცირება/გათბობა', ru: 'Кондиционирование/отопление' },
  carpentry: { en: 'Carpentry', ka: 'ხის სამუშაოები', ru: 'Столярные работы' },
  drywall: { en: 'Drywall', ka: 'თაბაშირმუყაო', ru: 'Гипсокартон' },
  insulation: { en: 'Insulation', ka: 'იზოლაცია', ru: 'Изоляция' },
  demolition: { en: 'Demolition', ka: 'დემონტაჟი', ru: 'Демонтаж' },
  masonry: { en: 'Masonry', ka: 'ქვის სამუშაო', ru: 'Каменные работы' },
  construction: { en: 'Construction', ka: 'მშენებლობა', ru: 'Строительство' },

  // Subcategories - Design
  interior: { en: 'Interior Design', ka: 'ინტერიერი', ru: 'Дизайн интерьера' },
  'interior-design': { en: 'Interior Design', ka: 'ინტერიერის დიზაინი', ru: 'Дизайн интерьера' },
  exterior: { en: 'Exterior Design', ka: 'ექსტერიერი', ru: 'Экстерьер' },
  '3d-design': { en: '3D Design', ka: '3D დიზაინი', ru: '3D дизайн' },
  designer: { en: 'Designer', ka: 'დიზაინერი', ru: 'Дизайнер' },

  // Subcategories - Architecture
  residential: { en: 'Residential', ka: 'საცხოვრებელი', ru: 'Жилой' },
  'residential-architecture': { en: 'Residential Architecture', ka: 'საცხოვრებელი', ru: 'Жилая архитектура' },
  commercial: { en: 'Commercial', ka: 'კომერციული', ru: 'Коммерческий' },
  'commercial-architecture': { en: 'Commercial Architecture', ka: 'კომერციული', ru: 'Коммерческая архитектура' },
  'industrial-architecture': { en: 'Industrial Architecture', ka: 'სამრეწველო', ru: 'Промышленная архитектура' },
  reconstruction: { en: 'Reconstruction', ka: 'რეკონსტრუქცია', ru: 'Реконструкция' },
  landscape: { en: 'Landscape', ka: 'ლანდშაფტი', ru: 'Ландшафт' },

  // Subcategories - Services
  cleaning: { en: 'Cleaning', ka: 'დალაგება', ru: 'Уборка' },
  'deep-cleaning': { en: 'Deep Cleaning', ka: 'გენერალური დალაგება', ru: 'Генеральная уборка' },
  'deep-clean': { en: 'Deep Clean', ka: 'ღრმა წმენდა', ru: 'Глубокая чистка' },
  moving: { en: 'Moving', ka: 'გადაზიდვა', ru: 'Переезд' },
  gardening: { en: 'Gardening', ka: 'მებაღეობა', ru: 'Садоводство' },
  landscaping: { en: 'Landscaping', ka: 'ლანდშაფტი', ru: 'Ландшафтный дизайн' },
  'appliance-repair': { en: 'Appliance Repair', ka: 'ტექნიკის შეკეთება', ru: 'Ремонт техники' },
  appliances: { en: 'Appliances', ka: 'ტექნიკა', ru: 'Техника' },
  'pest-control': { en: 'Pest Control', ka: 'დეზინსექცია', ru: 'Дезинсекция' },
  'window-cleaning': { en: 'Window Cleaning', ka: 'ფანჯრების წმენდა', ru: 'Мытьё окон' },
  security: { en: 'Security', ka: 'უსაფრთხოება', ru: 'Безопасность' },
  solar: { en: 'Solar', ka: 'მზის პანელები', ru: 'Солнечные панели' },
  pool: { en: 'Pool', ka: 'აუზი', ru: 'Бассейн' },
  'smart-home': { en: 'Smart Home', ka: 'ჭკვიანი სახლი', ru: 'Умный дом' },
  lighting: { en: 'Lighting', ka: 'განათება', ru: 'Освещение' },
  windows: { en: 'Windows', ka: 'ფანჯრები', ru: 'Окна' },
  doors: { en: 'Doors', ka: 'კარები', ru: 'Двери' },
  'it-support': { en: 'IT Support', ka: 'IT მხარდაჭერა', ru: 'IT поддержка' },
  'network-admin': { en: 'Network Administration', ka: 'ქსელის ადმინისტრირება', ru: 'Сетевое администрирование' },

  // Craftsmen subcategories
  handyman: { en: 'Handyman', ka: 'ხელოსანი', ru: 'Мастер на все руки' },
  welder: { en: 'Welder', ka: 'შემდუღებელი', ru: 'Сварщик' },
  locksmith: { en: 'Locksmith', ka: 'საკეტების ოსტატი', ru: 'Слесарь' },
  glasswork: { en: 'Glasswork', ka: 'მინის სამუშაოები', ru: 'Стекольные работы' },
  upholstery: { en: 'Upholstery', ka: 'რბილი ავეჯის აღდგენა', ru: 'Обивка мебели' },
  'furniture-repair': { en: 'Furniture Repair', ka: 'ავეჯის შეკეთება', ru: 'Ремонт мебели' },
  'furniture-assembly': { en: 'Furniture Assembly', ka: 'ავეჯის აწყობა', ru: 'Сборка мебели' },

  // Additional renovation subcategories
  concrete: { en: 'Concrete', ka: 'ბეტონი', ru: 'Бетон' },
  fencing: { en: 'Fencing', ka: 'ღობე', ru: 'Забор' },
  decking: { en: 'Decking', ka: 'ტერასა', ru: 'Терраса' },
  waterproofing: { en: 'Waterproofing', ka: 'ჰიდროიზოლაცია', ru: 'Гидроизоляция' },

  // Kitchen & Bathroom
  'kitchen-design': { en: 'Kitchen Design', ka: 'სამზარეულოს დიზაინი', ru: 'Дизайн кухни' },
  'bathroom-design': { en: 'Bathroom Design', ka: 'აბაზანის დიზაინი', ru: 'Дизайн ванной' },
  'kitchen-renovation': { en: 'Kitchen Renovation', ka: 'სამზარეულოს რემონტი', ru: 'Ремонт кухни' },
  'bathroom-renovation': { en: 'Bathroom Renovation', ka: 'აბაზანის რემონტი', ru: 'Ремонт ванной' },

  // Other
  furniture: { en: 'Furniture', ka: 'ავეჯი', ru: 'Мебель' },
  other: { en: 'Other', ka: 'სხვა', ru: 'Другое' },
};

export function useCategoryLabels() {
  const { locale } = useLanguage();

  const getCategoryLabel = useCallback(
    (category?: string): string => {
      if (!category) return '';
      const label = CATEGORY_LABELS[category];
      if (label) {
        return label[locale as 'en' | 'ka' | 'ru'] || label.en;
      }
      // Fallback: format the category key nicely
      return category
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
    },
    [locale]
  );

  return { getCategoryLabel, locale };
}

// Export for non-hook usage (e.g., in utility functions)
export function getCategoryLabelStatic(category: string | undefined, locale: string): string {
  if (!category) return '';
  const label = CATEGORY_LABELS[category];
  if (label) {
    return label[locale as 'en' | 'ka' | 'ru'] || label.en;
  }
  return category
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export { CATEGORY_LABELS };
