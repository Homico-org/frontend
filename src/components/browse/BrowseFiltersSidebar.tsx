'use client';

import { CATEGORIES } from '@/constants/categories';
import { useBrowseContext } from '@/contexts/BrowseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown, RotateCcw, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

// Muted terracotta color (matching job page redesign)
const ACCENT_COLOR = '#C4735B';
const ACCENT_BG = 'rgba(196, 115, 91, 0.08)';
const ACCENT_BORDER = 'rgba(196, 115, 91, 0.25)';

// Category icons as visual tiles
const CategoryIcons: Record<string, React.FC<{ className?: string }>> = {
  'interior-design': ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="8" width="18" height="12" rx="1" />
      <path d="M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2" />
      <path d="M12 12v4" />
    </svg>
  ),
  'architecture': ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <rect x="9" y="13" width="6" height="8" rx="0.5" />
    </svg>
  ),
  'craftsmen': ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14.7 6.3a2.5 2.5 0 00-4.4 1.4c0 .8.4 1.5 1 2L5 16l2 2 6.3-6.3c.5.3 1 .5 1.6.5a2.5 2.5 0 002.1-3.9L14 11l-2-2 2.7-.7z" />
      <path d="M5 16l-2 5 5-2" fill="currentColor" />
    </svg>
  ),
  'home-care': ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 12l9-8 9 8" />
      <path d="M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9" />
      <circle cx="12" cy="14" r="2" />
    </svg>
  ),
};

// Rating options (hidden by default - rarely used)
const RATING_OPTIONS = [
  { value: 0, label: 'All', labelKa: 'ყველა' },
  { value: 3, label: '3+', labelKa: '3+' },
  { value: 4, label: '4+', labelKa: '4+' },
  { value: 4.5, label: '4.5+', labelKa: '4.5+' },
];

interface BrowseFiltersSidebarProps {
  showRatingFilter?: boolean;
  showBudgetFilter?: boolean;
  showSearch?: boolean;
}

export default function BrowseFiltersSidebar({
  showRatingFilter = false, // Hidden by default (rarely used)
  showBudgetFilter = false,
  showSearch = false,
}: BrowseFiltersSidebarProps) {
  const { locale } = useLanguage();
  const {
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    minRating,
    setMinRating,
    sortBy,
    setSortBy,
    clearAllFilters,
    hasActiveFilters,
  } = useBrowseContext();

  // Collapsible sections - all collapsed by default
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-expand category section if a category is selected
  useEffect(() => {
    if (selectedCategory && !expandedSections.includes('category')) {
      setExpandedSections(prev => [...prev, 'category']);
    }
  }, [selectedCategory]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleCategorySelect = (key: string) => {
    if (selectedCategory === key) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else {
      setSelectedCategory(key);
      setSelectedSubcategory(null);
    }
  };

  const handleSubcategorySelect = (subKey: string) => {
    if (selectedSubcategory === subKey) {
      setSelectedSubcategory(null);
    } else {
      setSelectedSubcategory(subKey);
    }
  };

  // Get selected category data
  const selectedCategoryData = CATEGORIES.find(c => c.key === selectedCategory);

  // Limit visible categories (show 5-6, then "Show more")
  const visibleCategories = showMoreCategories ? CATEGORIES : CATEGORIES.slice(0, 5);
  const hasMoreCategories = CATEGORIES.length > 5;

  // Limit visible subcategories
  const [showMoreSubs, setShowMoreSubs] = useState(false);
  const visibleSubcategories = selectedCategoryData
    ? (showMoreSubs ? selectedCategoryData.subcategories : selectedCategoryData.subcategories.slice(0, 6))
    : [];
  const hasMoreSubs = selectedCategoryData && selectedCategoryData.subcategories.length > 6;

  return (
    <aside className="w-full h-full overflow-y-auto overflow-x-hidden">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {locale === 'ka' ? 'ფილტრები' : 'Filters'}
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              {locale === 'ka' ? 'გასუფთავება' : 'Clear'}
            </button>
          )}
        </div>

        {/* Category Section - Collapsible */}
        <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {locale === 'ka' ? 'კატეგორია' : 'Category'}
            </span>
            <div className="flex items-center gap-2">
              {selectedCategory && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: ACCENT_BG, color: ACCENT_COLOR }}
                >
                  1
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${
                  expandedSections.includes('category') ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {/* Category Options - Visual Tiles */}
          {expandedSections.includes('category') && (
            <div className="p-3 pt-2 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {visibleCategories.map(category => {
                  const isSelected = selectedCategory === category.key;
                  const IconComponent = CategoryIcons[category.key];

                  return (
                    <button
                      key={category.key}
                      onClick={() => handleCategorySelect(category.key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-current bg-current/5'
                          : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]'
                      }`}
                      style={isSelected ? { borderColor: ACCENT_COLOR, backgroundColor: ACCENT_BG, color: ACCENT_COLOR } : {}}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected ? '' : 'bg-[var(--color-bg-tertiary)]'
                        }`}
                        style={isSelected ? { backgroundColor: `${ACCENT_COLOR}15` } : {}}
                      >
                        {IconComponent && (
                          <IconComponent
                            className={`w-5 h-5 ${isSelected ? '' : 'text-[var(--color-text-secondary)]'}`}
                          />
                        )}
                      </div>
                      <span className={`text-xs font-medium text-center leading-tight ${
                        isSelected ? '' : 'text-[var(--color-text-secondary)]'
                      }`}>
                        {locale === 'ka' ? category.nameKa : category.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Show More Categories */}
              {hasMoreCategories && (
                <button
                  onClick={() => setShowMoreCategories(!showMoreCategories)}
                  className="w-full text-center text-xs font-medium py-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  {showMoreCategories
                    ? (locale === 'ka' ? 'ნაკლების ჩვენება' : 'Show less')
                    : (locale === 'ka' ? `+${CATEGORIES.length - 5} მეტი` : `+${CATEGORIES.length - 5} more`)
                  }
                </button>
              )}

              {/* Subcategories - Auto-expanded when category selected */}
              {selectedCategoryData && (
                <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                  <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2 px-1">
                    {locale === 'ka' ? 'ქვეკატეგორია' : 'Subcategory'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleSubcategories.map(sub => {
                      const isSubSelected = selectedSubcategory === sub.key;
                      return (
                        <button
                          key={sub.key}
                          onClick={() => handleSubcategorySelect(sub.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            isSubSelected
                              ? 'text-white'
                              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]'
                          }`}
                          style={isSubSelected ? { backgroundColor: ACCENT_COLOR } : {}}
                        >
                          {locale === 'ka' ? sub.nameKa : sub.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Show More Subcategories */}
                  {hasMoreSubs && (
                    <button
                      onClick={() => setShowMoreSubs(!showMoreSubs)}
                      className="mt-2 text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                    >
                      {showMoreSubs
                        ? (locale === 'ka' ? 'ნაკლები' : 'Less')
                        : (locale === 'ka' ? `+${selectedCategoryData.subcategories.length - 6} მეტი` : `+${selectedCategoryData.subcategories.length - 6} more`)
                      }
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Advanced Filters - Hidden by default (rarely used) */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <span>{locale === 'ka' ? 'დამატებითი ფილტრები' : 'More filters'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {showAdvanced && (
          <div className="space-y-3 pt-1">
            {/* Rating Section - Collapsible */}
            {showRatingFilter && (
              <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('rating')}
                  className="w-full flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                    <Star className="w-4 h-4" style={{ color: ACCENT_COLOR, fill: ACCENT_COLOR }} />
                    {locale === 'ka' ? 'რეიტინგი' : 'Rating'}
                  </span>
                  <div className="flex items-center gap-2">
                    {minRating > 0 && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: ACCENT_BG, color: ACCENT_COLOR }}
                      >
                        {minRating}+
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${
                        expandedSections.includes('rating') ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {expandedSections.includes('rating') && (
                  <div className="p-3 pt-2">
                    <div className="flex flex-wrap gap-2">
                      {RATING_OPTIONS.map(option => {
                        const isActive = minRating === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setMinRating(option.value)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                              isActive
                                ? 'text-white'
                                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]'
                            }`}
                            style={isActive ? { backgroundColor: ACCENT_COLOR } : {}}
                          >
                            {option.value > 0 && (
                              <Star className="w-3 h-3 fill-current" />
                            )}
                            {locale === 'ka' ? option.labelKa : option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <p className="text-[11px] text-[var(--color-text-tertiary)] text-center pt-2">
          {locale === 'ka'
            ? 'აირჩიეთ კატეგორია შედეგების სანახავად'
            : 'Select a category to see results'
          }
        </p>
      </div>
    </aside>
  );
}
