'use client';

import Button from '@/components/common/Button';
import { CATEGORIES } from '@/constants/categories';
import { useLanguage } from '@/contexts/LanguageContext';

const categories = CATEGORIES;

// Clean, minimal icons with consistent style
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

  const activeCategory = categories.find(c => c.key === selectedCategory);

  const ratingOptions = [
    { value: 0, label: locale === 'ka' ? 'ყველა' : 'All' },
    { value: 4, label: '4+' },
    { value: 4.5, label: '4.5+' },
  ];

  return (
    <div className="w-full space-y-2.5">
      {/* Categories - Clean horizontal layout */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.key;

          return (
            <Button
              key={category.key}
              onClick={() => {
                onSelectCategory(isSelected ? null : category.key);
              }}
              variant={isSelected ? 'primary' : 'outline'}
              size="sm"
              icon={
                <CategoryIcon
                  type={category.icon}
                  className="w-full h-full"
                />
              }
              className="rounded-xl flex-shrink-0"
            >
              {locale === 'ka' ? category.nameKa : category.name}
            </Button>
          );
        })}

        {/* Rating filter - subtle inline control */}
        {showRatingFilter && onRatingChange && (
          <>
            <div className="hidden sm:block h-4 w-px mx-1.5 bg-terracotta-200 dark:bg-terracotta-700/50" />
            <div className="hidden sm:flex items-center gap-0.5 flex-shrink-0">
              <span className="text-terracotta-500 mr-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
              {ratingOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onRatingChange(option.value)}
                  className={`
                    px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150
                    ${minRating === option.value
                      ? 'bg-terracotta-100 dark:bg-terracotta-500/20 text-terracotta-600 dark:text-terracotta-400 font-medium'
                      : 'text-[var(--color-text-tertiary)] hover:text-terracotta-500 hover:bg-terracotta-50 dark:hover:bg-terracotta-500/10'
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

      {/* Subcategories - Appears when category selected */}
      {activeCategory?.subcategories && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
          <span className="text-xs text-terracotta-400 dark:text-terracotta-500 mr-0.5 flex-shrink-0 font-medium">
            {locale === 'ka' ? 'სპეც:' : 'Type:'}
          </span>
          {activeCategory.subcategories.map((sub) => {
            const isSubSelected = selectedSubcategory === sub.key;
            return (
              <Button
                key={sub.key}
                onClick={() => onSelectSubcategory?.(isSubSelected ? null : sub.key)}
                variant={isSubSelected ? 'primary' : 'outline'}
                size="sm"
                className="rounded-lg"
              >
                {locale === 'ka' ? sub.nameKa : sub.name}
              </Button>
            );
          })}
        </div>
      )}

      {/* Mobile rating - Only shows on small screens */}
      {showRatingFilter && onRatingChange && (
        <div className="flex sm:hidden items-center gap-1.5">
          <span className="text-terracotta-500 mr-0.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
          <span className="text-xs text-[var(--color-text-muted)] mr-0.5">
            {locale === 'ka' ? 'რეიტინგი:' : 'Rating:'}
          </span>
          {ratingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onRatingChange(option.value)}
              className={`
                px-2.5 py-1 rounded-lg text-xs transition-all duration-150
                ${minRating === option.value
                  ? 'bg-terracotta-100 dark:bg-terracotta-500/20 text-terracotta-600 dark:text-terracotta-400 font-medium'
                  : 'bg-terracotta-50 dark:bg-terracotta-500/10 text-[var(--color-text-tertiary)]'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
