'use client';

import { CATEGORIES } from '@/constants/categories';
import { useBrowseContext } from '@/contexts/BrowseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight, RotateCcw, Search, Sparkles, Star, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const RATING_OPTIONS = [
  { value: 0, label: 'All', labelKa: 'ყველა' },
  { value: 3, label: '3+', labelKa: '3+' },
  { value: 4, label: '4+', labelKa: '4+' },
  { value: 4.5, label: '4.5+', labelKa: '4.5+' },
];

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended', labelKa: 'რეკომენდებული', icon: Sparkles },
  { value: 'rating', label: 'Top Rated', labelKa: 'რეიტინგით', icon: Star },
  { value: 'newest', label: 'Newest', labelKa: 'უახლესი', icon: null },
  { value: 'most-liked', label: 'Popular', labelKa: 'პოპულარული', icon: null },
];

// Category icons as simple SVG components
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

interface BrowseFiltersSidebarProps {
  showRatingFilter?: boolean;
  showBudgetFilter?: boolean;
  showSearch?: boolean;
}

export default function BrowseFiltersSidebar({
  showRatingFilter = true,
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
    searchQuery,
    setSearchQuery,
    clearAllFilters,
    hasActiveFilters,
  } = useBrowseContext();

  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    selectedCategory ? [selectedCategory] : []
  );
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [categorySearchInput, setCategorySearchInput] = useState('');
  const [isCategorySearchFocused, setIsCategorySearchFocused] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Helper function to check if a string matches the search term
  const matchesSearch = (text: string, searchTerm: string): boolean => {
    return text.toLowerCase().includes(searchTerm);
  };

  // Helper function to check if any keyword matches
  const keywordsMatch = (keywords: string[] | undefined, searchTerm: string): boolean => {
    if (!keywords) return false;
    return keywords.some(keyword => keyword.toLowerCase().includes(searchTerm));
  };

  // Filter categories and subcategories based on search (including keywords)
  const filteredCategories = useMemo(() => {
    if (!categorySearchInput.trim()) return CATEGORIES;

    const searchLower = categorySearchInput.toLowerCase().trim();

    return CATEGORIES.map(category => {
      // Check if category name or keywords match
      const categoryNameMatches =
        matchesSearch(category.name, searchLower) ||
        matchesSearch(category.nameKa, searchLower) ||
        keywordsMatch(category.keywords, searchLower);

      // Check each subcategory for name or keyword match
      const matchingSubcategories = category.subcategories.filter(sub =>
        matchesSearch(sub.name, searchLower) ||
        matchesSearch(sub.nameKa, searchLower) ||
        keywordsMatch(sub.keywords, searchLower)
      );

      // If category name/keywords match, show all subcategories
      if (categoryNameMatches) {
        return category;
      }

      // If some subcategories match, show category with only matching subcategories
      if (matchingSubcategories.length > 0) {
        return {
          ...category,
          subcategories: matchingSubcategories,
        };
      }

      return null;
    }).filter(Boolean) as typeof CATEGORIES;
  }, [categorySearchInput]);

  // Auto-expand categories when searching
  useEffect(() => {
    if (categorySearchInput.trim()) {
      // Expand all filtered categories when searching
      setExpandedCategories(filteredCategories.map(c => c.key));
    }
  }, [categorySearchInput, filteredCategories]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const toggleCategoryExpand = (key: string) => {
    setExpandedCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleCategorySelect = (key: string) => {
    if (selectedCategory === key) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else {
      setSelectedCategory(key);
      setSelectedSubcategory(null);
      if (!expandedCategories.includes(key)) {
        setExpandedCategories(prev => [...prev, key]);
      }
    }
  };

  const handleSubcategorySelect = (subKey: string, categoryKey: string) => {
    if (selectedCategory !== categoryKey) {
      setSelectedCategory(categoryKey);
    }
    if (selectedSubcategory === subKey) {
      setSelectedSubcategory(null);
    } else {
      setSelectedSubcategory(subKey);
    }
  };

  return (
    <aside className="w-full h-full overflow-y-auto overflow-x-hidden filter-sidebar-scroll">
      <div className="p-4 space-y-5">
        {/* Search Input - Refined */}
        {showSearch && (
          <div className="relative group">
            <div className={`
              relative flex items-center transition-all duration-300 ease-out
              ${isSearchFocused
                ? 'filter-search-focused'
                : 'filter-search-default'
              }
            `}>
              <Search className={`
                absolute left-3.5 w-[18px] h-[18px] transition-colors duration-200
                ${isSearchFocused ? 'text-[#E07B4F]' : 'text-[var(--color-text-tertiary)]'}
              `} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder={locale === 'ka' ? 'სახელი, #ტეგი...' : 'Name, #tag...'}
                className="w-full bg-transparent pl-11 pr-9 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
              />
              {searchInput && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 p-1 rounded-full hover:bg-[#E07B4F]/10 text-[var(--color-text-tertiary)] hover:text-[#E07B4F] transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Header with Active Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] tracking-tight">
              {locale === 'ka' ? 'ფილტრები' : 'Filters'}
            </h3>
            {hasActiveFilters && (
              <span className="filter-active-badge">
                {[selectedCategory, selectedSubcategory, minRating > 0].filter(Boolean).length}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="filter-clear-btn"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{locale === 'ka' ? 'გასუფთავება' : 'Clear'}</span>
            </button>
          )}
        </div>

        {/* Sort Options - Visual Cards */}
        <div className="space-y-2.5">
          <span className="filter-section-label">
            {locale === 'ka' ? 'დალაგება' : 'Sort by'}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {SORT_OPTIONS.map(option => {
              const isActive = sortBy === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`filter-sort-option ${isActive ? 'filter-sort-active' : ''}`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{locale === 'ka' ? option.labelKa : option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories - Elegant Accordion */}
        <div className="space-y-2.5">
          <span className="filter-section-label">
            {locale === 'ka' ? 'კატეგორია' : 'Category'}
          </span>

          {/* Category Search Input */}
          <div className="relative">
            <div className={`
              relative flex items-center transition-all duration-200 ease-out
              rounded-lg border bg-[var(--color-bg-secondary)]
              ${isCategorySearchFocused
                ? 'border-[#E07B4F]/40 ring-2 ring-[#E07B4F]/10'
                : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border)]'
              }
            `}>
              <Search className={`
                absolute left-2.5 w-3.5 h-3.5 transition-colors duration-200
                ${isCategorySearchFocused ? 'text-[#E07B4F]' : 'text-[var(--color-text-tertiary)]'}
              `} />
              <input
                type="text"
                value={categorySearchInput}
                onChange={(e) => setCategorySearchInput(e.target.value)}
                onFocus={() => setIsCategorySearchFocused(true)}
                onBlur={() => setIsCategorySearchFocused(false)}
                placeholder={locale === 'ka' ? 'კატეგორიის ძიება...' : 'Search categories...'}
                className="w-full bg-transparent pl-8 pr-7 py-2 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
              />
              {categorySearchInput && (
                <button
                  onClick={() => setCategorySearchInput('')}
                  className="absolute right-2 p-0.5 rounded-full hover:bg-[#E07B4F]/10 text-[var(--color-text-tertiary)] hover:text-[#E07B4F] transition-all duration-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {filteredCategories.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {locale === 'ka' ? 'კატეგორია არ მოიძებნა' : 'No categories found'}
                </p>
              </div>
            ) : (
              filteredCategories.map(category => {
                const isSelected = selectedCategory === category.key;
                const isExpanded = expandedCategories.includes(category.key);
                const IconComponent = CategoryIcons[category.key];

                return (
                  <div key={category.key} className="filter-category-wrapper">
                    <button
                      onClick={() => handleCategorySelect(category.key)}
                      className={`filter-category-btn ${isSelected ? 'filter-category-active' : ''}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`filter-category-icon ${isSelected ? 'filter-category-icon-active' : ''}`}>
                          {IconComponent && <IconComponent className="w-4 h-4" />}
                        </div>
                        <span className="font-medium">
                          {locale === 'ka' ? category.nameKa : category.name}
                        </span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategoryExpand(category.key);
                        }}
                      />
                    </button>

                    {/* Subcategories with smooth animation */}
                    <div className={`filter-subcategories ${isExpanded ? 'filter-subcategories-open' : ''}`}>
                      <div className="pt-1.5 pb-1 space-y-0.5">
                        {category.subcategories.map(sub => {
                          const isSubSelected = selectedSubcategory === sub.key;
                          return (
                            <button
                              key={sub.key}
                              onClick={() => handleSubcategorySelect(sub.key, category.key)}
                              className={`filter-subcategory-btn ${isSubSelected ? 'filter-subcategory-active' : ''}`}
                            >
                              <span className={`filter-subcategory-dot ${isSubSelected ? 'filter-subcategory-dot-active' : ''}`} />
                              <span>{locale === 'ka' ? sub.nameKa : sub.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Rating Filter - Star Pills */}
        {showRatingFilter && (
          <div className="space-y-2.5">
            <span className="filter-section-label flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-[#E07B4F] fill-[#E07B4F]" />
              {locale === 'ka' ? 'რეიტინგი' : 'Rating'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {RATING_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setMinRating(option.value)}
                  className={`filter-rating-btn ${minRating === option.value ? 'filter-rating-active' : ''}`}
                >
                  {option.value > 0 && <Star className="w-2.5 h-2.5 fill-current" />}
                  <span>{locale === 'ka' ? option.labelKa : option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters - Compact Tags */}
        {hasActiveFilters && (
          <div className="filter-active-section">
            <span className="filter-section-label">
              {locale === 'ka' ? 'არჩეული' : 'Selected'}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedCategory && (
                <span className="filter-tag filter-tag-category">
                  {locale === 'ka'
                    ? CATEGORIES.find(c => c.key === selectedCategory)?.nameKa
                    : CATEGORIES.find(c => c.key === selectedCategory)?.name
                  }
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                    }}
                    className="filter-tag-remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedSubcategory && (
                <span className="filter-tag filter-tag-sub">
                  {(() => {
                    const cat = CATEGORIES.find(c => c.key === selectedCategory);
                    const sub = cat?.subcategories.find(s => s.key === selectedSubcategory);
                    return locale === 'ka' ? sub?.nameKa : sub?.name;
                  })()}
                  <button
                    onClick={() => setSelectedSubcategory(null)}
                    className="filter-tag-remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {minRating > 0 && (
                <span className="filter-tag filter-tag-rating">
                  <Star className="w-3 h-3 fill-current" />
                  {minRating}+
                  <button
                    onClick={() => setMinRating(0)}
                    className="filter-tag-remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
