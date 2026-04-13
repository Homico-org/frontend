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
  electricity: { en: 'Electricity', ka: 'ელექტროობა', ru: 'Электричество' },
  painting: { en: 'Painting', ka: 'შეღებვა', ru: 'Покраска' },
  mural: { en: 'Mural', ka: 'მალიარი', ru: 'Роспись' },
  flooring: { en: 'Flooring', ka: 'იატაკი', ru: 'Полы' },
  roofing: { en: 'Roofing', ka: 'სახურავი', ru: 'Кровля' },
  tile: { en: 'Tile', ka: 'ჭერი', ru: 'Плитка' },
  tiling: { en: 'Tiling', ka: 'მოპირკეთება', ru: 'Укладка плитки' },
  plastering: { en: 'Plastering', ka: 'მლესავი', ru: 'Штукатурка' },
  hvac: { en: 'HVAC', ka: 'კონდიცირება/გათბობა', ru: 'Кондиционирование/отопление' },
  iron: { en: 'Ironwork', ka: 'რკინის სამუშაოები', ru: 'Металлоконструкции' },
  carpentry: { en: 'Carpentry', ka: 'ხის სამუშაოები', ru: 'Столярные работы' },
  drywall: { en: 'Drywall', ka: 'თაბაშირმუყაო', ru: 'Гипсокартон' },
  demolition: { en: 'Demolition', ka: 'დემონტაჟი', ru: 'Демонтаж' },
  masonry: { en: 'Masonry', ka: 'ქვის სამუშაო', ru: 'Каменные работы' },
  construction: { en: 'Construction', ka: 'მშენებლობა', ru: 'Строительство' },
  'doors-windows': { en: 'Doors & Windows', ka: 'კარ-ფანჯარა', ru: 'Двери и окна' },
  gas: { en: 'Gas Work', ka: 'გაზის სამუშაოები', ru: 'Газовые работы' },
  fireplace: { en: 'Fireplace', ka: 'ბუხარი', ru: 'Камин' },
  measurement: { en: 'Measurement', ka: 'აზომვა', ru: 'Замеры' },

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
  'furniture-cleaning': { en: 'Furniture Cleaning', ka: 'ავეჯის ქიმწმენდა', ru: 'Химчистка мебели' },

  // Craftsmen subcategories
  handyman: { en: 'Handyman', ka: 'ხელოსანი', ru: 'Мастер на все руки' },
  welder: { en: 'Welder', ka: 'შემდუღებელი', ru: 'Сварщик' },
  locksmith: { en: 'Locksmith', ka: 'საკეტების ოსტატი', ru: 'Слесарь' },
  glasswork: { en: 'Glasswork', ka: 'მინის სამუშაოები', ru: 'Стекольные работы' },
  mirrors: { en: 'Mirrors', ka: 'სარკეები', ru: 'Зеркала' },
  'shower-glass': { en: 'Shower Glass / Partitions', ka: 'შხაპკაბინა / შუშის ტიხრები', ru: 'Душевое стекло / перегородки' },
  'facade-glazing': { en: 'Facade Glazing', ka: 'ფასადის მოჭიქვა', ru: 'Фасадное остекление' },
  upholstery: { en: 'Upholstery', ka: 'რბილი ავეჯის აღდგენა', ru: 'Обивка мебели' },
  'furniture-repair': { en: 'Furniture Repair', ka: 'ავეჯის შეკეთება', ru: 'Ремонт мебели' },
  'furniture-assembly': { en: 'Furniture Assembly', ka: 'ავეჯის აწყობა', ru: 'Сборка мебели' },
  woodwork: { en: 'Woodwork', ka: 'ხის სამუშაოები', ru: 'Деревянные работы' },

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
  wood: { en: 'Wood', ka: 'ხე', ru: 'Дерево' },
  furniture: { en: 'Furniture', ka: 'ავეჯი', ru: 'Мебель' },
  other: { en: 'Other', ka: 'სხვა', ru: 'Другое' },

  // Service Catalog categories
  heating_cooling: { en: 'Heating & Cooling', ka: 'გათბობა და გაგრილება', ru: 'Отопление и охлаждение' },
  appliance: { en: 'Appliance Repair', ka: 'ტექნიკის შეკეთება', ru: 'Ремонт техники' },
  doors_locks: { en: 'Doors & Locks', ka: 'კარები და საკეტები', ru: 'Двери и замки' },
  chemical_cleaning: { en: 'Chemical Cleaning', ka: 'ქიმწმენდა', ru: 'Химчистка' },
  it_services: { en: 'IT Services', ka: 'IT სერვისები', ru: 'IT услуги' },
  heavy_lifting: { en: 'Heavy Lifting', ka: 'მძიმე ტვირთი', ru: 'Тяжёлые грузы' },

  // Service Catalog subcategories
  pipes: { en: 'Pipes & Drains', ka: 'მილები და კანალიზაცია', ru: 'Трубы и канализация' },
  bathroom_install: { en: 'Bathroom Installation', ka: 'საბაზანოს მონტაჟი', ru: 'Установка ванной' },
  kitchen_plumbing: { en: 'Kitchen Plumbing', ka: 'სამზარეულოს სანტექნიკა', ru: 'Кухонная сантехника' },
  water_heater: { en: 'Water Heater', ka: 'წყლის გამაცხელებელი', ru: 'Водонагреватель' },
  sewer: { en: 'Sewer', ka: 'კანალიზაცია და სეპტიკი', ru: 'Канализация' },
  ac_services: { en: 'AC Services', ka: 'კონდიციონერის სერვისები', ru: 'Кондиционеры' },
  heating: { en: 'Heating', ka: 'გათბობა', ru: 'Отопление' },
  ventilation: { en: 'Ventilation', ka: 'ვენტილაცია', ru: 'Вентиляция' },
  mounting: { en: 'Mounting & Hanging', ka: 'მონტაჟი და ჩამოკიდება', ru: 'Монтаж и подвеска' },
  minor_repairs: { en: 'Minor Repairs', ka: 'მცირე შეკეთება', ru: 'Мелкий ремонт' },
  handyman_assembly: { en: 'Assembly Services', ka: 'აწყობის სერვისები', ru: 'Сборка' },
  outdoor: { en: 'Outdoor', ka: 'გარე სამუშაოები', ru: 'Наружные работы' },
  large_appliances: { en: 'Large Appliances', ka: 'დიდი ტექნიკა', ru: 'Крупная техника' },
  small_appliances: { en: 'Small Appliances', ka: 'მცირე ტექნიკა', ru: 'Малая техника' },
  appliance_installation: { en: 'Appliance Installation', ka: 'ტექნიკის მონტაჟი', ru: 'Установка техники' },
  wiring: { en: 'Wiring', ka: 'გაყვანილობა', ru: 'Проводка' },
  panel: { en: 'Electrical Panel', ka: 'ელექტრო პანელი', ru: 'Электрощит' },
  smart_home: { en: 'Smart Home', ka: 'ჭკვიანი სახლი', ru: 'Умный дом' },
  door_install: { en: 'Door Installation', ka: 'კარის მონტაჟი', ru: 'Установка дверей' },
  door_repair: { en: 'Door Repair', ka: 'კარის შეკეთება', ru: 'Ремонт дверей' },
  locks: { en: 'Locks', ka: 'საკეტები', ru: 'Замки' },
  assembly: { en: 'Assembly', ka: 'აწყობა', ru: 'Сборка' },
  custom_furniture: { en: 'Custom Furniture', ka: 'ავეჯის დამზადება', ru: 'Мебель на заказ' },
  furniture_repair: { en: 'Furniture Repair', ka: 'ავეჯის შეკეთება', ru: 'Ремонт мебели' },
  disassembly: { en: 'Disassembly', ka: 'დაშლა', ru: 'Разборка' },
  carpet: { en: 'Carpet Cleaning', ka: 'ხალიჩის წმენდა', ru: 'Чистка ковров' },
  curtains_cleaning: { en: 'Curtains Cleaning', ka: 'ფარდის წმენდა', ru: 'Чистка штор' },
  computer: { en: 'Computer Services', ka: 'კომპიუტერის სერვისები', ru: 'Компьютерные услуги' },
  network: { en: 'Network & WiFi', ka: 'ქსელი და WiFi', ru: 'Сеть и WiFi' },
  smart_home_tech: { en: 'Smart Home Tech', ka: 'ჭკვიანი სახლის ტექნოლოგია', ru: 'Технологии умного дома' },
  peripheral: { en: 'Peripherals', ka: 'პერიფერიული მონტაჟობრივი', ru: 'Периферия' },
  delivery: { en: 'Delivery', ka: 'მიტანა', ru: 'Доставка' },
  disposal: { en: 'Disposal', ka: 'ნაგვის გატანა', ru: 'Вывоз мусора' },
  standard_cleaning: { en: 'Standard Cleaning', ka: 'სტანდარტული დასუფთავება', ru: 'Стандартная уборка' },
  deep_cleaning: { en: 'Deep Cleaning', ka: 'გენერალური დასუფთავება', ru: 'Генеральная уборка' },
  window_cleaning: { en: 'Window Cleaning', ka: 'ფანჯრების წმენდა', ru: 'Мытьё окон' },
  rental_host_cleaning: { en: 'Rental Host Cleaning', ka: 'გაქირავების დასუფთავება', ru: 'Уборка для хостов' },
  hourly_cleaning: { en: 'Hourly Cleaning', ka: 'საათობრივი დასუფთავება', ru: 'Почасовая уборка' },
  ironing_service: { en: 'Ironing Service', ka: 'დაუთოვება', ru: 'Глажка' },
  entrance_cleaning: { en: 'Entrance Cleaning', ka: 'სადარბაზოს დასუფთავება', ru: 'Уборка подъезда' },
};

export function useCategoryLabels() {
  const { locale } = useLanguage();

  const getCategoryLabel = useCallback(
    (category?: string): string => {
      if (!category) return '';
      const key = category.trim().toLowerCase();
      const label = CATEGORY_LABELS[key];
      if (label) {
        return label[locale as 'en' | 'ka' | 'ru'] || label.en;
      }
      // Fallback: format the category key nicely
      return category.trim()
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
  const key = category.trim().toLowerCase();
  const label = CATEGORY_LABELS[key];
  if (label) {
    return label[locale as 'en' | 'ka' | 'ru'] || label.en;
  }
  return category.trim()
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export { CATEGORY_LABELS };
