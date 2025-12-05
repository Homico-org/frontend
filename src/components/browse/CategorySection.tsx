'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CATEGORIES } from '@/constants/categories';

const categories = CATEGORIES;

// Refined minimal SVG icons - thinner strokes, elegant proportions
const CategoryIcon = ({ type, className = '', style }: { type: string; className?: string; style?: React.CSSProperties }) => {
  switch (type) {
    case 'designer':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 16V14.5C4 13.67 4.67 13 5.5 13H18.5C19.33 13 20 13.67 20 14.5V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M6 13V11.5C6 10.67 6.67 10 7.5 10H16.5C17.33 10 18 10.67 18 11.5V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="4" y="16" width="16" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M18 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 6L13.5 7.5L12 9L10.5 7.5L12 6Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
          <circle cx="12" cy="4" r="1" fill="currentColor"/>
        </svg>
      );
    case 'architect':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 20V10L12 4L20 10V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 20H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="7" y="11" width="3" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
          <rect x="14" y="11" width="3" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.25"/>
          <path d="M10 20V17C10 16.45 10.45 16 11 16H13C13.55 16 14 16.45 14 17V20" stroke="currentColor" strokeWidth="1.25"/>
        </svg>
      );
    case 'craftsmen':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 17L10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M5 19L7 17L9 19L7 21L5 19Z" fill="currentColor"/>
          <path d="M16 5C14.34 5 13 6.34 13 8C13 8.56 13.15 9.09 13.42 9.55L9 14L11 16L15.45 11.58C15.91 11.85 16.44 12 17 12C18.66 12 20 10.66 20 9C20 8.75 19.95 8.5 19.9 8.25L18 10L16 8L17.75 6.1C17.5 6.05 17.25 6 17 6C16.65 6 16.3 6.05 16 6.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19 15L17 18H19L17 21" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'homecare':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 11L12 5L20 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 10V19C6 19.55 6.45 20 7 20H17C17.55 20 18 19.55 18 19V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 12C13.1 12 14 12.9 14 14C14 15.5 12 17 12 17C12 17 10 15.5 10 14C10 12.9 10.9 12 12 12Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
          <circle cx="8.5" cy="8" r="0.75" fill="currentColor"/>
          <circle cx="15.5" cy="8" r="0.75" fill="currentColor"/>
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
      {/* Main Categories - Horizontal scroll on mobile, wrap on desktop */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap">
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
                group relative flex items-center gap-1.5 sm:gap-2
                px-3 sm:px-3.5 py-2 rounded-full
                text-[13px] sm:text-sm font-medium
                transition-all duration-250 ease-out
                animate-fade-in
                border flex-shrink-0
              `}
              style={{
                animationDelay: `${index * 50}ms`,
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                background: isSelected
                  ? 'linear-gradient(180deg, #0d6355 0%, #0a5248 100%)'
                  : 'var(--color-bg-secondary)',
                color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                borderColor: isSelected ? 'rgba(13, 99, 85, 0.4)' : 'var(--color-border)',
                boxShadow: isSelected
                  ? '0 4px 12px rgba(13, 99, 85, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : 'var(--shadow-xs)',
              }}
            >
              {/* Subtle hover glow */}
              <div
                className={`
                  absolute inset-0 rounded-full opacity-0 transition-opacity duration-300
                  ${isHovered && !isSelected ? 'opacity-100' : ''}
                `}
                style={{
                  background: 'radial-gradient(circle at 50% 50%, var(--color-accent-soft) 0%, transparent 70%)',
                  filter: 'blur(4px)',
                  transform: 'scale(1.1)',
                  zIndex: -1,
                }}
              />

              {/* Icon */}
              <CategoryIcon
                type={category.icon}
                className={`
                  w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0
                  transition-all duration-250
                  ${isHovered && !isSelected ? 'scale-110' : ''}
                `}
                style={{
                  color: isSelected ? '#ffffff' : '#0d6355',
                }}
              />

              {/* Title only */}
              <span className="whitespace-nowrap">
                {locale === 'ka' ? category.nameKa : category.name}
              </span>

              {/* Selection tick - appears on selected */}
              <div className={`
                flex items-center justify-center
                transition-all duration-200
                ${isSelected ? 'w-4 opacity-100' : 'w-0 opacity-0'}
                overflow-hidden
              `}>
                <svg className="w-3.5 h-3.5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>

      {/* Subcategories - Compact expandable pills */}
      {activeCategory && activeCategory.subcategories && (
        <div
          className="mt-3 overflow-hidden animate-fade-in"
          style={{ animationDuration: '200ms' }}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Subtle label */}
            <span className="text-xs text-[var(--color-text-muted)] mr-1 py-1">
              {locale === 'ka' ? 'ფილტრი:' : 'Filter:'}
            </span>

            {activeCategory.subcategories.map((sub, index) => {
              const isSubSelected = selectedSubcategory === sub.key;
              return (
                <button
                  key={sub.key}
                  onClick={() => onSelectSubcategory?.(isSubSelected ? null : sub.key)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium
                    transition-all duration-200 ease-out
                    animate-fade-in
                    border
                  `}
                  style={{
                    animationDelay: `${index * 30}ms`,
                    background: isSubSelected
                      ? 'linear-gradient(180deg, #0d6355 0%, #0a5248 100%)'
                      : 'var(--color-bg-tertiary)',
                    color: isSubSelected ? '#ffffff' : 'var(--color-text-secondary)',
                    borderColor: isSubSelected ? 'rgba(13, 99, 85, 0.3)' : 'var(--color-border)',
                    boxShadow: isSubSelected
                      ? '0 2px 8px rgba(13, 99, 85, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      : 'none',
                  }}
                >
                  {locale === 'ka' ? sub.nameKa : sub.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
