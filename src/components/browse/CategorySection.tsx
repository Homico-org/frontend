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

          const accent = category.color || 'var(--hm-brand-500)';
          return (
            <button
              key={category.key}
              onClick={() => onSelectCategory(isSelected ? null : category.key)}
              onMouseEnter={() => setHoveredCategory(category.key)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`
                group relative inline-flex items-center gap-1.5 pl-1 pr-3 py-1
                rounded-full font-medium text-xs
                transition-all duration-200 ease-out
                flex-shrink-0 touch-manipulation hover:-translate-y-px
                ${isSelected ? 'shadow-md' : ''}
              `}
              style={
                isSelected
                  ? {
                      background: 'var(--hm-brand-500)',
                      color: '#fff',
                      boxShadow:
                        '0 4px 14px -4px rgba(239,78,36,0.35), 0 1px 2px rgba(0,0,0,0.04)',
                      animationDelay: `${index * 50}ms`,
                    }
                  : {
                      background: 'var(--hm-bg-elevated)',
                      border: '1px solid var(--hm-border-subtle)',
                      color: 'var(--hm-fg-primary)',
                      animationDelay: `${index * 50}ms`,
                    }
              }
            >
              {/* Icon — color-tinted backplate using the per-category catalog color */}
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full transition-colors"
                style={
                  isSelected
                    ? { background: 'rgba(255,255,255,0.18)', color: '#fff' }
                    : { background: `${accent}14`, color: accent }
                }
              >
                <CategoryIcon
                  type={category.icon || ''}
                  className="w-3.5 h-3.5"
                />
              </span>

              <span className="font-semibold">
                {getCategoryLabelStatic(category.key, locale)}
              </span>

              {/* Hover glow effect */}
              {isHovered && !isSelected && (
                <span className="absolute inset-0 rounded-full bg-[var(--hm-brand-500)]/4 animate-scale-in pointer-events-none" />
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
