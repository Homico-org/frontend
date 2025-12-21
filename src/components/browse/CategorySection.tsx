'use client';

import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

// Refined architectural icons
const CategoryIcon = ({ type, className = '' }: { type: string; className?: string }) => {
  const iconProps = { className, viewBox: "0 0 24 24", fill: "none" };

  switch (type) {
    case 'designer':
      return (
        <svg {...iconProps}>
          <path d="M20 19H4V17C4 15.9 4.9 15 6 15H18C19.1 15 20 15.9 20 17V19Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M18 15V13C18 11.9 17.1 11 16 11H8C6.9 11 6 11.9 6 13V15" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 11V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="12" cy="6" r="2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
    case 'architect':
      return (
        <svg {...iconProps}>
          <path d="M3 20H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M5 20V10L12 5L19 10V20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <rect x="9" y="14" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 14V20" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
    case 'craftsmen':
      return (
        <svg {...iconProps}>
          <path d="M14.7 6.3C14.3 5.5 13.5 5 12.6 5C11.2 5 10 6.2 10 7.6C10 8 10.1 8.4 10.3 8.7L5 14L7 16L12.3 10.7C12.6 10.9 13 11 13.4 11C14.8 11 16 9.8 16 8.4C16 8 15.9 7.6 15.7 7.3L14 9L12 7L14.7 6.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M5 14L3 19L8 17L5 14Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
        </svg>
      );
    case 'homecare':
      return (
        <svg {...iconProps}>
          <path d="M3 11L12 4L21 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 10V19C5 19.6 5.4 20 6 20H18C18.6 20 19 19.6 19 19V10" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 20V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/>
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
  minRating?: number;
  onRatingChange?: (rating: number) => void;
  showRatingFilter?: boolean;
}

export default function CategorySection({
  selectedCategory,
  onSelectCategory,
  selectedSubcategory,
  onSelectSubcategory,
  minRating = 0,
  onRatingChange,
  showRatingFilter = false,
}: CategorySectionProps) {
  const { locale } = useLanguage();
  const { categories } = useCategories();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const activeCategory = categories.find(c => c.key === selectedCategory);

  const ratingOptions = [
    { value: 0, label: locale === 'ka' ? 'ყველა' : 'All' },
    { value: 4, label: '4+' },
    { value: 4.5, label: '4.5+' },
  ];

  return (
    <div className="w-full space-y-3">
      {/* Main Categories - Compact pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
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
                group relative flex items-center gap-1.5 px-3 py-2
                rounded-lg font-medium text-xs
                transition-all duration-200 ease-out
                flex-shrink-0 touch-manipulation
                ${isSelected
                  ? 'bg-[#E07B4F] text-white shadow-md shadow-[#E07B4F]/20'
                  : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[#E07B4F] hover:border-[#E07B4F]/30'
                }
              `}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {/* Icon */}
              <span className={`
                w-4 h-4 transition-transform duration-200
                ${isSelected ? '' : 'group-hover:scale-105'}
              `}>
                <CategoryIcon type={category.icon || ''} className="w-full h-full" />
              </span>

              {/* Label */}
              <span className="font-semibold">
                {locale === 'ka' ? category.nameKa : category.name}
              </span>

              {/* Hover glow effect */}
              {(isHovered && !isSelected) && (
                <span className="absolute inset-0 rounded-lg bg-[#E07B4F]/5 animate-scale-in" />
              )}
            </button>
          );
        })}

        {/* Rating filter - Desktop inline */}
        {showRatingFilter && onRatingChange && (
          <>
            <div className="hidden sm:block h-6 w-px mx-1.5 bg-[var(--color-border-subtle)]" />
            <div className="hidden sm:flex items-center gap-0.5 flex-shrink-0 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] rounded-lg px-2 py-1">
              <svg className="w-3.5 h-3.5 text-[#E07B4F] mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {ratingOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onRatingChange(option.value)}
                  className={`
                    px-2 py-1 rounded text-xs font-medium transition-all duration-150
                    ${minRating === option.value
                      ? 'bg-[#E07B4F]/20 text-[#E07B4F] dark:text-[#E8956A]'
                      : 'text-[var(--color-text-tertiary)] hover:text-[#E07B4F] hover:bg-[#E07B4F]/10'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Subcategories - Compact reveal */}
      {activeCategory?.subcategories && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap animate-fade-in">
          <span className="text-[11px] text-[var(--color-text-muted)] mr-1 flex-shrink-0 font-medium">
            {locale === 'ka' ? 'სპეც:' : 'Spec:'}
          </span>
          {activeCategory.subcategories.map((sub, index) => {
            const isSubSelected = selectedSubcategory === sub.key;
            return (
              <button
                key={sub.key}
                onClick={() => onSelectSubcategory?.(isSubSelected ? null : sub.key)}
                className={`
                  relative px-2.5 py-1.5 rounded text-[11px] font-medium
                  transition-all duration-200 ease-out
                  flex-shrink-0 touch-manipulation
                  ${isSubSelected
                    ? 'bg-[#E07B4F]/15 text-[#E07B4F] dark:bg-[#E8956A]/20 dark:text-[#E8956A]'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] hover:text-[#E07B4F] hover:bg-[#E07B4F]/5'
                  }
                `}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {locale === 'ka' ? sub.nameKa : sub.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile rating filter */}
      {showRatingFilter && onRatingChange && (
        <div className="flex sm:hidden items-center gap-1.5 pt-1">
          <svg className="w-3.5 h-3.5 text-[#E07B4F]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <div className="flex gap-0.5">
            {ratingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onRatingChange(option.value)}
                className={`
                  px-2 py-1 rounded text-[11px] font-medium transition-all duration-150
                  ${minRating === option.value
                    ? 'bg-[#E07B4F]/20 text-[#E07B4F] dark:text-[#E8956A]'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
