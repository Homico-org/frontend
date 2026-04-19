'use client';

import { CategoryIcon } from '@/components/categories';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryLabelStatic } from '@/hooks/useCategoryLabels';
import { Star } from 'lucide-react';
import { useState } from 'react';

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
  const { t, locale } = useLanguage();
  const { categories } = useCategories();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const activeCategory = categories.find(c => c.key === selectedCategory);

  const ratingOptions = [
    { value: 0, label: t('common.all') },
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
                  ? 'bg-[var(--hm-brand-500)] text-white shadow-md shadow-[var(--hm-brand-500)]/20'
                  : 'bg-[var(--hm-bg-tertiary)] border border-[var(--hm-border-subtle)] text-[var(--hm-fg-secondary)] hover:text-[var(--hm-brand-500)] hover:border-[var(--hm-brand-500)]/30'
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
                {getCategoryLabelStatic(category.key, locale)}
              </span>

              {/* Hover glow effect */}
              {(isHovered && !isSelected) && (
                <span className="absolute inset-0 rounded-lg bg-[var(--hm-brand-500)]/5 animate-scale-in" />
              )}
            </button>
          );
        })}

        {/* Rating filter - Desktop inline */}
        {showRatingFilter && onRatingChange && (
          <>
            <div className="hidden sm:block h-6 w-px mx-1.5 bg-[var(--hm-border-subtle)]" />
            <div className="hidden sm:flex items-center gap-0.5 flex-shrink-0 bg-[var(--hm-bg-tertiary)] border border-[var(--hm-border-subtle)] rounded-lg px-2 py-1">
              <Star className="w-3.5 h-3.5 text-[var(--hm-brand-500)] fill-current mr-1" />
              {ratingOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onRatingChange(option.value)}
                  className={`
                    px-2 py-1 rounded text-xs font-medium transition-all duration-150
                    ${minRating === option.value
                      ? 'bg-[var(--hm-brand-500)]/20 text-[var(--hm-brand-500)]'
                      : 'text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/10'
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
          <span className="text-[11px] text-[var(--hm-fg-muted)] mr-1 flex-shrink-0 font-medium">
            {t('browse.spec')}
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
                    ? 'bg-[var(--hm-brand-500)]/15 text-[var(--hm-brand-500)]'
                    : 'bg-[var(--hm-bg-page)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/5'
                  }
                `}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {getCategoryLabelStatic(sub.key, locale)}
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile rating filter */}
      {showRatingFilter && onRatingChange && (
        <div className="flex sm:hidden items-center gap-1.5 pt-1">
          <Star className="w-3.5 h-3.5 text-[var(--hm-brand-500)] fill-current" />
          <div className="flex gap-0.5">
            {ratingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onRatingChange(option.value)}
                className={`
                  px-2 py-1 rounded text-[11px] font-medium transition-all duration-150
                  ${minRating === option.value
                    ? 'bg-[var(--hm-brand-500)]/20 text-[var(--hm-brand-500)]'
                    : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
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
