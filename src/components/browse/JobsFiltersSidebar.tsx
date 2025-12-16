'use client';

import { CATEGORIES } from '@/constants/categories';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Bookmark,
  Building2,
  ChevronRight,
  Home,
  MapPin,
  RotateCcw,
  Search,
  Wallet,
  X,
  Calendar,
  Briefcase
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Budget filter options
export const JOB_BUDGET_FILTERS = [
  { key: 'all', label: 'All Budgets', labelKa: 'ყველა', min: undefined, max: undefined },
  { key: 'under-1k', label: 'Under ₾1,000', labelKa: '₾1,000-მდე', min: 0, max: 1000 },
  { key: '1k-5k', label: '₾1,000 - ₾5,000', labelKa: '₾1,000 - ₾5,000', min: 1000, max: 5000 },
  { key: '5k-15k', label: '₾5,000 - ₾15,000', labelKa: '₾5,000 - ₾15,000', min: 5000, max: 15000 },
  { key: '15k-50k', label: '₾15,000 - ₾50,000', labelKa: '₾15,000 - ₾50,000', min: 15000, max: 50000 },
  { key: 'over-50k', label: 'Over ₾50,000', labelKa: '₾50,000+', min: 50000, max: undefined },
];

// Property type options
const PROPERTY_TYPES = [
  { key: 'all', label: 'All Types', labelKa: 'ყველა', icon: Building2 },
  { key: 'apartment', label: 'Apartment', labelKa: 'ბინა', icon: Building2 },
  { key: 'house', label: 'House', labelKa: 'სახლი', icon: Home },
  { key: 'office', label: 'Office', labelKa: 'ოფისი', icon: Briefcase },
  { key: 'commercial', label: 'Commercial', labelKa: 'კომერციული', icon: Building2 },
];

// Location options (Georgian cities)
const LOCATIONS = [
  { key: 'all', label: 'All Locations', labelKa: 'ყველა' },
  { key: 'tbilisi', label: 'Tbilisi', labelKa: 'თბილისი' },
  { key: 'batumi', label: 'Batumi', labelKa: 'ბათუმი' },
  { key: 'kutaisi', label: 'Kutaisi', labelKa: 'ქუთაისი' },
  { key: 'rustavi', label: 'Rustavi', labelKa: 'რუსთავი' },
  { key: 'gori', label: 'Gori', labelKa: 'გორი' },
];

// Deadline filter options
const DEADLINE_FILTERS = [
  { key: 'all', label: 'Any Deadline', labelKa: 'ყველა' },
  { key: 'urgent', label: 'Urgent (< 7 days)', labelKa: 'სასწრაფო (< 7 დღე)' },
  { key: 'week', label: 'This Week', labelKa: 'ამ კვირაში' },
  { key: 'month', label: 'This Month', labelKa: 'ამ თვეში' },
  { key: 'flexible', label: 'Flexible', labelKa: 'მოქნილი' },
];

export interface JobFilters {
  category: string | null;
  subcategory: string | null;
  budget: string;
  propertyType: string;
  location: string;
  deadline: string;
  searchQuery: string;
  showFavoritesOnly: boolean;
}

interface JobsFiltersSidebarProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  savedCount?: number;
}

export default function JobsFiltersSidebar({ filters, onFiltersChange, savedCount = 0 }: JobsFiltersSidebarProps) {
  const { locale } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    filters.category ? [filters.category] : []
  );
  const [categorySearchInput, setCategorySearchInput] = useState('');
  const [isCategorySearchFocused, setIsCategorySearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.searchQuery);

  // Sync search input with filters
  useEffect(() => {
    setSearchInput(filters.searchQuery);
  }, [filters.searchQuery]);

  const updateFilter = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      category: null,
      subcategory: null,
      budget: 'all',
      propertyType: 'all',
      location: 'all',
      deadline: 'all',
      searchQuery: '',
      showFavoritesOnly: false,
    });
    setSearchInput('');
    setCategorySearchInput('');
  };

  const hasActiveFilters =
    filters.category !== null ||
    filters.subcategory !== null ||
    filters.budget !== 'all' ||
    filters.propertyType !== 'all' ||
    filters.location !== 'all' ||
    filters.deadline !== 'all' ||
    filters.searchQuery !== '' ||
    filters.showFavoritesOnly;

  const activeFilterCount = [
    filters.category,
    filters.subcategory,
    filters.budget !== 'all' ? filters.budget : null,
    filters.propertyType !== 'all' ? filters.propertyType : null,
    filters.location !== 'all' ? filters.location : null,
    filters.deadline !== 'all' ? filters.deadline : null,
    filters.showFavoritesOnly ? 'favorites' : null,
  ].filter(Boolean).length;

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categorySearchInput.trim()) return CATEGORIES;

    const searchLower = categorySearchInput.toLowerCase().trim();

    return CATEGORIES.map(category => {
      const categoryNameMatches =
        category.name.toLowerCase().includes(searchLower) ||
        category.nameKa.toLowerCase().includes(searchLower);

      const matchingSubcategories = category.subcategories.filter(sub =>
        sub.name.toLowerCase().includes(searchLower) ||
        sub.nameKa.toLowerCase().includes(searchLower)
      );

      if (categoryNameMatches) return category;
      if (matchingSubcategories.length > 0) {
        return { ...category, subcategories: matchingSubcategories };
      }
      return null;
    }).filter(Boolean) as typeof CATEGORIES;
  }, [categorySearchInput]);

  // Auto-expand when searching
  useEffect(() => {
    if (categorySearchInput.trim()) {
      setExpandedCategories(filteredCategories.map(c => c.key));
    }
  }, [categorySearchInput, filteredCategories]);

  const toggleCategoryExpand = (key: string) => {
    setExpandedCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleCategorySelect = (key: string) => {
    if (filters.category === key) {
      updateFilter('category', null);
      updateFilter('subcategory', null);
    } else {
      updateFilter('category', key);
      updateFilter('subcategory', null);
      if (!expandedCategories.includes(key)) {
        setExpandedCategories(prev => [...prev, key]);
      }
    }
  };

  const handleSubcategorySelect = (subKey: string, categoryKey: string) => {
    if (filters.category !== categoryKey) {
      updateFilter('category', categoryKey);
    }
    updateFilter('subcategory', filters.subcategory === subKey ? null : subKey);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    // Debounce search
    const timeout = setTimeout(() => {
      updateFilter('searchQuery', value);
    }, 300);
    return () => clearTimeout(timeout);
  };

  return (
    <aside className="w-full h-full overflow-y-auto overflow-x-hidden filter-sidebar-scroll">
      <div className="p-4 space-y-5">
        {/* Search Input */}
        <div className="relative">
          <div className="relative flex items-center transition-all duration-200 ease-out rounded-xl border bg-[var(--color-bg-secondary)] border-[var(--color-border-subtle)] hover:border-[var(--color-border)] focus-within:border-[#E07B4F]/40 focus-within:ring-2 focus-within:ring-[#E07B4F]/10">
            <Search className="absolute left-3.5 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={locale === 'ka' ? 'სამუშაოს ძებნა...' : 'Search jobs...'}
              className="w-full bg-transparent pl-10 pr-9 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); updateFilter('searchQuery', ''); }}
                className="absolute right-3 p-1 rounded-full hover:bg-[#E07B4F]/10 text-[var(--color-text-tertiary)] hover:text-[#E07B4F] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Header with Active Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] tracking-tight">
              {locale === 'ka' ? 'ფილტრები' : 'Filters'}
            </h3>
            {activeFilterCount > 0 && (
              <span className="filter-active-badge">
                {activeFilterCount}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="filter-clear-btn">
              <RotateCcw className="w-3 h-3" />
              <span>{locale === 'ka' ? 'გასუფთავება' : 'Clear'}</span>
            </button>
          )}
        </div>

        {/* Favorites Toggle */}
        <button
          onClick={() => updateFilter('showFavoritesOnly', !filters.showFavoritesOnly)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            filters.showFavoritesOnly
              ? 'bg-[#E07B4F] text-white'
              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[#E07B4F]/10 hover:text-[#E07B4F] border border-[var(--color-border-subtle)]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Bookmark className={`w-4 h-4 ${filters.showFavoritesOnly ? 'fill-current' : ''}`} />
            <span>{locale === 'ka' ? 'შენახულები' : 'Saved Jobs'}</span>
          </div>
          {savedCount > 0 && (
            <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-semibold ${
              filters.showFavoritesOnly
                ? 'bg-white/20 text-white'
                : 'bg-[#E07B4F]/10 text-[#E07B4F]'
            }`}>
              {savedCount}
            </span>
          )}
        </button>

        {/* Budget Filter */}
        <div className="space-y-2.5">
          <span className="filter-section-label flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-[#E07B4F]" />
            {locale === 'ka' ? 'ბიუჯეტი' : 'Budget'}
          </span>
          <div className="space-y-1">
            {JOB_BUDGET_FILTERS.map(option => (
              <button
                key={option.key}
                onClick={() => updateFilter('budget', option.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filters.budget === option.key
                    ? 'bg-[#E07B4F] text-white'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[#E07B4F]/10 hover:text-[#E07B4F]'
                }`}
              >
                {locale === 'ka' ? option.labelKa : option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Property Type Filter */}
        <div className="space-y-2.5">
          <span className="filter-section-label flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#E07B4F]" />
            {locale === 'ka' ? 'ობიექტის ტიპი' : 'Property Type'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PROPERTY_TYPES.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.key}
                  onClick={() => updateFilter('propertyType', option.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    filters.propertyType === option.key
                      ? 'bg-[#E07B4F] text-white'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[#E07B4F]/10 hover:text-[#E07B4F]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {locale === 'ka' ? option.labelKa : option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location Filter */}
        <div className="space-y-2.5">
          <span className="filter-section-label flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#E07B4F]" />
            {locale === 'ka' ? 'ლოკაცია' : 'Location'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {LOCATIONS.map(option => (
              <button
                key={option.key}
                onClick={() => updateFilter('location', option.key)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  filters.location === option.key
                    ? 'bg-[#E07B4F] text-white'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[#E07B4F]/10 hover:text-[#E07B4F]'
                }`}
              >
                {locale === 'ka' ? option.labelKa : option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deadline Filter */}
        <div className="space-y-2.5">
          <span className="filter-section-label flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#E07B4F]" />
            {locale === 'ka' ? 'ვადა' : 'Deadline'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DEADLINE_FILTERS.map(option => (
              <button
                key={option.key}
                onClick={() => updateFilter('deadline', option.key)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  filters.deadline === option.key
                    ? 'bg-[#E07B4F] text-white'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[#E07B4F]/10 hover:text-[#E07B4F]'
                }`}
              >
                {locale === 'ka' ? option.labelKa : option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2.5">
          <span className="filter-section-label">
            {locale === 'ka' ? 'კატეგორია' : 'Category'}
          </span>

          {/* Category Search */}
          <div className="relative">
            <div className={`
              relative flex items-center transition-all duration-200 ease-out
              rounded-lg border bg-[var(--color-bg-secondary)]
              ${isCategorySearchFocused
                ? 'border-[#E07B4F]/40 ring-2 ring-[#E07B4F]/10'
                : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border)]'
              }
            `}>
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
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
                  className="absolute right-2 p-0.5 rounded-full hover:bg-[#E07B4F]/10 text-[var(--color-text-tertiary)] hover:text-[#E07B4F]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {locale === 'ka' ? 'კატეგორია არ მოიძებნა' : 'No categories found'}
                </p>
              </div>
            ) : (
              filteredCategories.map(category => {
                const isSelected = filters.category === category.key;
                const isExpanded = expandedCategories.includes(category.key);

                return (
                  <div key={category.key} className="filter-category-wrapper">
                    <button
                      onClick={() => handleCategorySelect(category.key)}
                      className={`filter-category-btn ${isSelected ? 'filter-category-active' : ''}`}
                    >
                      <span className="font-medium text-xs">
                        {locale === 'ka' ? category.nameKa : category.name}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategoryExpand(category.key);
                        }}
                      />
                    </button>

                    {/* Subcategories */}
                    <div className={`filter-subcategories ${isExpanded ? 'filter-subcategories-open' : ''}`}>
                      <div className="pt-1.5 pb-1 space-y-0.5">
                        {category.subcategories.map(sub => {
                          const isSubSelected = filters.subcategory === sub.key;
                          return (
                            <button
                              key={sub.key}
                              onClick={() => handleSubcategorySelect(sub.key, category.key)}
                              className={`filter-subcategory-btn ${isSubSelected ? 'filter-subcategory-active' : ''}`}
                            >
                              <span className={`filter-subcategory-dot ${isSubSelected ? 'filter-subcategory-dot-active' : ''}`} />
                              <span className="text-[11px]">{locale === 'ka' ? sub.nameKa : sub.name}</span>
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

        {/* Active Filters Tags */}
        {hasActiveFilters && (
          <div className="filter-active-section">
            <span className="filter-section-label">
              {locale === 'ka' ? 'არჩეული' : 'Selected'}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {filters.category && (
                <span className="filter-tag filter-tag-category">
                  {locale === 'ka'
                    ? CATEGORIES.find(c => c.key === filters.category)?.nameKa
                    : CATEGORIES.find(c => c.key === filters.category)?.name
                  }
                  <button
                    onClick={() => { updateFilter('category', null); updateFilter('subcategory', null); }}
                    className="filter-tag-remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.subcategory && (
                <span className="filter-tag filter-tag-sub">
                  {(() => {
                    const cat = CATEGORIES.find(c => c.key === filters.category);
                    const sub = cat?.subcategories.find(s => s.key === filters.subcategory);
                    return locale === 'ka' ? sub?.nameKa : sub?.name;
                  })()}
                  <button onClick={() => updateFilter('subcategory', null)} className="filter-tag-remove">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.budget !== 'all' && (
                <span className="filter-tag filter-tag-category">
                  {locale === 'ka'
                    ? JOB_BUDGET_FILTERS.find(b => b.key === filters.budget)?.labelKa
                    : JOB_BUDGET_FILTERS.find(b => b.key === filters.budget)?.label
                  }
                  <button onClick={() => updateFilter('budget', 'all')} className="filter-tag-remove">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.propertyType !== 'all' && (
                <span className="filter-tag filter-tag-sub">
                  {locale === 'ka'
                    ? PROPERTY_TYPES.find(p => p.key === filters.propertyType)?.labelKa
                    : PROPERTY_TYPES.find(p => p.key === filters.propertyType)?.label
                  }
                  <button onClick={() => updateFilter('propertyType', 'all')} className="filter-tag-remove">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.location !== 'all' && (
                <span className="filter-tag filter-tag-sub">
                  {locale === 'ka'
                    ? LOCATIONS.find(l => l.key === filters.location)?.labelKa
                    : LOCATIONS.find(l => l.key === filters.location)?.label
                  }
                  <button onClick={() => updateFilter('location', 'all')} className="filter-tag-remove">
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
