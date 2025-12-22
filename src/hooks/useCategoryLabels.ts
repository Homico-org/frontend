import { useLanguage } from '@/contexts/LanguageContext';
import { useCallback } from 'react';

// Centralized category labels mapping
const CATEGORY_LABELS: Record<string, { en: string; ka: string }> = {
  // Main categories
  renovation: { en: 'Renovation', ka: 'რემონტი' },
  design: { en: 'Design', ka: 'დიზაინი' },
  architecture: { en: 'Architecture', ka: 'არქიტექტურა' },
  services: { en: 'Services', ka: 'სერვისები' },
  craftsmen: { en: 'Craftsmen', ka: 'ხელოსნები' },
  homecare: { en: 'Home Care', ka: 'სახლის მოვლა' },
  'home-care': { en: 'Home Care', ka: 'მოვლა' },

  // Subcategories - Renovation
  plumbing: { en: 'Plumbing', ka: 'სანტექნიკა' },
  electrical: { en: 'Electrical', ka: 'ელექტრობა' },
  electricity: { en: 'Electricity', ka: 'ელექტროსანტექნიკა' },
  painting: { en: 'Painting', ka: 'შეღებვა' },
  mural: { en: 'Mural', ka: 'მალიარი' },
  flooring: { en: 'Flooring', ka: 'იატაკი' },
  roofing: { en: 'Roofing', ka: 'სახურავი' },
  tile: { en: 'Tile', ka: 'ჭერი' },
  tiling: { en: 'Tiling', ka: 'მოპირკეთება' },
  plastering: { en: 'Plastering', ka: 'მლესავი' },
  hvac: { en: 'HVAC', ka: 'კონდიცირება/გათბობა' },
  carpentry: { en: 'Carpentry', ka: 'ხის სამუშაოები' },
  drywall: { en: 'Drywall', ka: 'თაბაშირმუყაო' },
  insulation: { en: 'Insulation', ka: 'იზოლაცია' },
  demolition: { en: 'Demolition', ka: 'დემონტაჟი' },
  masonry: { en: 'Masonry', ka: 'ქვის სამუშაო' },
  construction: { en: 'Construction', ka: 'მშენებლობა' },

  // Subcategories - Design
  interior: { en: 'Interior Design', ka: 'ინტერიერი' },
  'interior-design': { en: 'Interior Design', ka: 'ინტერიერის დიზაინი' },
  exterior: { en: 'Exterior Design', ka: 'ექსტერიერი' },
  '3d-design': { en: '3D Design', ka: '3D დიზაინი' },
  designer: { en: 'Designer', ka: 'დიზაინერი' },

  // Subcategories - Architecture
  residential: { en: 'Residential', ka: 'საცხოვრებელი' },
  'residential-architecture': { en: 'Residential Architecture', ka: 'საცხოვრებელი არქიტექტურა' },
  commercial: { en: 'Commercial', ka: 'კომერციული' },
  'commercial-architecture': { en: 'Commercial Architecture', ka: 'კომერციული არქიტექტურა' },
  'industrial-architecture': { en: 'Industrial Architecture', ka: 'სამრეწველო არქიტექტურა' },
  reconstruction: { en: 'Reconstruction', ka: 'რეკონსტრუქცია' },
  landscape: { en: 'Landscape', ka: 'ლანდშაფტი' },

  // Subcategories - Services
  cleaning: { en: 'Cleaning', ka: 'დალაგება' },
  'deep-cleaning': { en: 'Deep Cleaning', ka: 'გენერალური დალაგება' },
  'deep-clean': { en: 'Deep Clean', ka: 'ღრმა წმენდა' },
  moving: { en: 'Moving', ka: 'გადაზიდვა' },
  gardening: { en: 'Gardening', ka: 'მებაღეობა' },
  landscaping: { en: 'Landscaping', ka: 'ლანდშაფტი' },
  'appliance-repair': { en: 'Appliance Repair', ka: 'ტექნიკის შეკეთება' },
  appliances: { en: 'Appliances', ka: 'ტექნიკა' },
  'pest-control': { en: 'Pest Control', ka: 'დეზინსექცია' },
  'window-cleaning': { en: 'Window Cleaning', ka: 'ფანჯრების წმენდა' },
  security: { en: 'Security', ka: 'უსაფრთხოება' },
  solar: { en: 'Solar', ka: 'მზის პანელები' },
  pool: { en: 'Pool', ka: 'აუზი' },
  'smart-home': { en: 'Smart Home', ka: 'ჭკვიანი სახლი' },
  lighting: { en: 'Lighting', ka: 'განათება' },
  windows: { en: 'Windows', ka: 'ფანჯრები' },
  doors: { en: 'Doors', ka: 'კარები' },

  // Other
  furniture: { en: 'Furniture', ka: 'ავეჯი' },
  other: { en: 'Other', ka: 'სხვა' },
};

export function useCategoryLabels() {
  const { locale } = useLanguage();

  const getCategoryLabel = useCallback(
    (category?: string): string => {
      if (!category) return '';
      const label = CATEGORY_LABELS[category];
      if (label) {
        return label[locale as 'en' | 'ka'] || label.en;
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
    return label[locale as 'en' | 'ka'] || label.en;
  }
  return category
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export { CATEGORY_LABELS };
