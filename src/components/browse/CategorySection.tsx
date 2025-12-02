'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Category {
  key: string;
  name: string;
  nameKa: string;
  description: string;
  descriptionKa: string;
  icon: string;
  subcategories?: Subcategory[];
}

interface Subcategory {
  key: string;
  name: string;
  nameKa: string;
}

const categories: Category[] = [
  {
    key: 'interior-design',
    name: 'Designer',
    nameKa: 'დიზაინერი',
    description: 'Interior designers and space planners',
    descriptionKa: 'ინტერიერის დიზაინერები',
    icon: 'designer',
    subcategories: [
      { key: 'residential', name: 'Residential', nameKa: 'საცხოვრებელი' },
      { key: 'commercial', name: 'Commercial', nameKa: 'კომერციული' },
      { key: 'kitchen', name: 'Kitchen Design', nameKa: 'სამზარეულო' },
      { key: 'bathroom', name: 'Bathroom Design', nameKa: 'სააბაზანო' },
    ],
  },
  {
    key: 'architecture',
    name: 'Architect',
    nameKa: 'არქიტექტორი',
    description: 'Architects and structural designers',
    descriptionKa: 'არქიტექტორები და კონსტრუქტორები',
    icon: 'architect',
    subcategories: [
      { key: 'residential-arch', name: 'Residential', nameKa: 'საცხოვრებელი' },
      { key: 'commercial-arch', name: 'Commercial', nameKa: 'კომერციული' },
      { key: 'landscape', name: 'Landscape', nameKa: 'ლანდშაფტი' },
      { key: 'renovation', name: 'Renovation', nameKa: 'რენოვაცია' },
    ],
  },
  {
    key: 'craftsmen',
    name: 'Craftsmen',
    nameKa: 'ხელოსანი',
    description: 'Electricians, plumbers, and skilled trades',
    descriptionKa: 'ელექტრიკოსები, სანტექნიკები',
    icon: 'craftsmen',
    subcategories: [
      { key: 'electrical', name: 'Electrician', nameKa: 'ელექტრიკოსი' },
      { key: 'plumbing', name: 'Plumber', nameKa: 'სანტექნიკი' },
      { key: 'carpentry', name: 'Carpenter', nameKa: 'ხურო' },
      { key: 'painting', name: 'Painter', nameKa: 'მხატვარი' },
      { key: 'tiling', name: 'Tiler', nameKa: 'კაფელის მგები' },
      { key: 'hvac', name: 'HVAC', nameKa: 'კონდიცირება' },
    ],
  },
  {
    key: 'home-care',
    name: 'Home Care',
    nameKa: 'მოვლა',
    description: 'Cleaning and maintenance services',
    descriptionKa: 'დასუფთავება და მოვლა',
    icon: 'homecare',
    subcategories: [
      { key: 'cleaning', name: 'Cleaning', nameKa: 'დასუფთავება' },
      { key: 'moving', name: 'Moving', nameKa: 'გადაზიდვა' },
      { key: 'gardening', name: 'Gardening', nameKa: 'ბაღის მოვლა' },
      { key: 'security', name: 'Security', nameKa: 'დაცვა' },
    ],
  },
];

// Custom SVG icons for each category
const CategoryIcon = ({ type, className = '' }: { type: string; className?: string }) => {
  switch (type) {
    case 'designer':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Elegant interior design icon - furniture/couch silhouette */}
          <path d="M6 32V28C6 26.8954 6.89543 26 8 26H40C41.1046 26 42 26.8954 42 28V32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M10 26V22C10 20.8954 10.8954 20 12 20H36C37.1046 20 38 20.8954 38 22V26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="6" y="32" width="36" height="6" rx="2" stroke="currentColor" strokeWidth="2.5"/>
          <path d="M10 38V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M38 38V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Decorative element */}
          <path d="M24 12L28 16L24 20L20 16L24 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="24" cy="8" r="2" fill="currentColor"/>
        </svg>
      );
    case 'architect':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Blueprint/building design icon */}
          <path d="M8 40V16L24 6L40 16V40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 40H40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Windows */}
          <rect x="14" y="22" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="28" y="22" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
          {/* Door */}
          <path d="M20 40V34C20 32.8954 20.8954 32 22 32H26C27.1046 32 28 32.8954 28 34V40" stroke="currentColor" strokeWidth="2"/>
          {/* Roof detail */}
          <path d="M24 6V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="24" cy="14" r="2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
    case 'craftsmen':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Tools icon - wrench and hammer combined */}
          <path d="M12 36L20 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M8 40L12 36L16 40L12 44L8 40Z" fill="currentColor"/>
          {/* Wrench */}
          <path d="M32 8C28.6863 8 26 10.6863 26 14C26 15.1256 26.3086 16.1832 26.8438 17.0938L18 26L22 30L30.9062 21.1562C31.8168 21.6914 32.8744 22 34 22C37.3137 22 40 19.3137 40 16C40 15.5 39.9 15 39.8 14.5L36 18L32 14L35.5 10.2C35 10.1 34.5 10 34 10C33.3 10 32.6 10.1 32 10.2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Hammer handle */}
          <path d="M16 32L10 38" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          {/* Electric bolt */}
          <path d="M38 30L34 36H38L34 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'homecare':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Home with heart/care icon */}
          <path d="M6 22L24 8L42 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 20V38C10 39.1046 10.8954 40 12 40H36C37.1046 40 38 39.1046 38 38V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Sparkle/clean elements */}
          <path d="M24 24C26.5 24 28.5 26 28.5 28.5C28.5 32 24 35 24 35C24 35 19.5 32 19.5 28.5C19.5 26 21.5 24 24 24Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          {/* Sparkles */}
          <path d="M16 16L17 18L16 20L15 18L16 16Z" fill="currentColor"/>
          <path d="M32 16L33 18L32 20L31 18L32 16Z" fill="currentColor"/>
          <circle cx="24" cy="14" r="1.5" fill="currentColor"/>
        </svg>
      );
    default:
      return null;
  }
};

interface CategorySectionProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  selectedSubcategory?: string | null;
  onSelectSubcategory?: (subcategory: string | null) => void;
}

export default function CategorySection({
  selectedCategory,
  onSelectCategory,
  selectedSubcategory,
  onSelectSubcategory,
}: CategorySectionProps) {
  const { locale } = useLanguage();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const activeCategory = categories.find(c => c.key === selectedCategory);

  return (
    <div className="w-full">
      {/* Main Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {categories.map((category, index) => {
          const isSelected = selectedCategory === category.key;
          const isHovered = hoveredCategory === category.key;

          return (
            <button
              key={category.key}
              onClick={() => onSelectCategory(isSelected ? null : category.key)}
              onMouseEnter={() => setHoveredCategory(category.key)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`
                group relative overflow-hidden rounded-2xl p-5 md:p-6
                transition-all duration-300 ease-out
                animate-fade-in
                ${isSelected
                  ? 'bg-[var(--color-accent)] text-white shadow-lg scale-[1.02]'
                  : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'
                }
                border border-[var(--color-border-subtle)]
                hover:border-[var(--color-border)]
                hover:shadow-md
              `}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              {/* Ambient glow on hover */}
              <div
                className={`
                  absolute inset-0 opacity-0 transition-opacity duration-500
                  ${isHovered && !isSelected ? 'opacity-100' : ''}
                `}
                style={{
                  background: 'radial-gradient(circle at 50% 0%, var(--color-accent-soft) 0%, transparent 70%)',
                }}
              />

              {/* Icon */}
              <div className={`
                relative w-12 h-12 md:w-14 md:h-14 mb-4
                transition-transform duration-300
                ${isHovered ? 'scale-110' : ''}
              `}>
                <CategoryIcon
                  type={category.icon}
                  className={`
                    w-full h-full
                    transition-colors duration-300
                    ${isSelected
                      ? 'text-white'
                      : 'text-[var(--color-accent)]'
                    }
                  `}
                />
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className={`
                  text-lg md:text-xl font-semibold mb-1
                  transition-colors duration-300
                `}>
                  {locale === 'ka' ? category.nameKa : category.name}
                </h3>
                <p className={`
                  text-sm leading-relaxed
                  transition-colors duration-300
                  ${isSelected
                    ? 'text-white/80'
                    : 'text-[var(--color-text-tertiary)]'
                  }
                `}>
                  {locale === 'ka' ? category.descriptionKa : category.description}
                </p>
              </div>

              {/* Selection indicator */}
              <div className={`
                absolute top-4 right-4
                w-6 h-6 rounded-full
                flex items-center justify-center
                transition-all duration-300
                ${isSelected
                  ? 'bg-white/20 scale-100'
                  : 'bg-[var(--color-accent-soft)] scale-0'
                }
              `}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Subcategory count badge */}
              {category.subcategories && category.subcategories.length > 0 && (
                <div className={`
                  absolute bottom-4 right-4
                  px-2 py-0.5 rounded-full text-xs font-medium
                  transition-all duration-300
                  ${isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  }
                `}>
                  {category.subcategories.length}+
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Subcategories - Expandable Section */}
      {activeCategory && activeCategory.subcategories && (
        <div
          className="mt-4 overflow-hidden animate-fade-in"
          style={{ animationDuration: '200ms' }}
        >
          <div className="p-4 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2 mb-3">
              <CategoryIcon
                type={activeCategory.icon}
                className="w-5 h-5 text-[var(--color-accent)]"
              />
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                {locale === 'ka' ? 'ქვეკატეგორიები' : 'Subcategories'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeCategory.subcategories.map((sub, index) => {
                const isSubSelected = selectedSubcategory === sub.key;
                return (
                  <button
                    key={sub.key}
                    onClick={() => onSelectSubcategory?.(isSubSelected ? null : sub.key)}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-medium
                      transition-all duration-200
                      animate-fade-in
                      ${isSubSelected
                        ? 'bg-[var(--color-accent)] text-white shadow-sm'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]'
                      }
                      border border-[var(--color-border-subtle)]
                      hover:border-[var(--color-border)]
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {locale === 'ka' ? sub.nameKa : sub.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
