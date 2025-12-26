'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { JobFilters } from '@/contexts/JobsContext';
import { RotateCcw, Bookmark, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Re-export JobFilters for convenience
export type { JobFilters } from '@/contexts/JobsContext';

// Warm terracotta accent
const ACCENT = '#C4735B';

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  renovation: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  ),
  design: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
    </svg>
  ),
  architecture: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  services: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
};

// Default icon for categories not in the mapping
const DefaultCategoryIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
);

// Property type options
const PROPERTY_TYPES = [
  { key: 'all', label: 'Any', labelKa: 'ყველა' },
  { key: 'apartment', label: 'Apartment', labelKa: 'ბინა' },
  { key: 'house', label: 'House', labelKa: 'სახლი' },
  { key: 'office', label: 'Office', labelKa: 'ოფისი' },
  { key: 'building', label: 'Building', labelKa: 'შენობა' },
];

// Deadline filter options
const DEADLINE_FILTERS = [
  { key: 'all', label: 'Any', labelKa: 'ყველა' },
  { key: 'urgent', label: 'Urgent', labelKa: 'სასწრაფო' },
  { key: 'week', label: 'This week', labelKa: 'ეს კვირა' },
  { key: 'month', label: 'This month', labelKa: 'ეს თვე' },
  { key: 'flexible', label: 'Flexible', labelKa: 'მოქნილი' },
];

interface JobsFiltersSidebarProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  savedCount?: number;
}

// Custom checkbox component
function Checkbox({
  checked,
  onChange,
  label,
  count
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div
          className={`w-4 h-4 rounded border-[1.5px] transition-all duration-200 flex items-center justify-center ${
            checked
              ? 'border-transparent'
              : 'border-neutral-300 dark:border-neutral-600 group-hover:border-neutral-400 dark:group-hover:border-neutral-500'
          }`}
          style={checked ? { backgroundColor: ACCENT } : {}}
        >
          {checked && (
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
      <span className={`text-[13px] transition-colors ${
        checked
          ? 'text-neutral-900 dark:text-white font-medium'
          : 'text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-300'
      }`}>
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span
          className="ml-auto text-[11px] font-medium px-1.5 py-0.5 rounded-md"
          style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
        >
          {count}
        </span>
      )}
    </label>
  );
}

// Category Accordion with smooth animation
function CategoryAccordion({
  categoryKey,
  categoryLabel,
  categoryIcon,
  isExpanded,
  onToggle,
  subcategories,
  selectedCategory,
  selectedSubcategory,
  onSubcategoryToggle,
  locale,
}: {
  categoryKey: string;
  categoryLabel: string;
  categoryIcon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  subcategories: { key: string; name: string; nameKa: string }[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onSubcategoryToggle: (categoryKey: string, subcategoryKey: string) => void;
  locale: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [subcategories, isExpanded]);

  return (
    <div className="bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-700/50 overflow-hidden">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span style={{ color: ACCENT }} className="transition-transform duration-200 group-hover:scale-110">
            {categoryIcon}
          </span>
          <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
            {categoryLabel}
          </span>
          {selectedCategory === categoryKey && (
            <span
              className="text-[9px] font-bold w-4 h-4 rounded-full text-white flex items-center justify-center"
              style={{ backgroundColor: ACCENT }}
            >
              1
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isExpanded ? 'rotate-180 text-neutral-600 dark:text-neutral-300' : 'rotate-0'
          }`}
        />
      </button>

      {/* Subcategories (animated content) */}
      <div
        className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          maxHeight: isExpanded ? height : 0,
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="px-3 pb-2.5 space-y-1.5">
          {subcategories.map((sub, index) => {
            const isSelected = selectedCategory === categoryKey && selectedSubcategory === sub.key;
            const subLabel = locale === 'ka' ? sub.nameKa : sub.name;

            return (
              <button
                key={sub.key}
                onClick={() => onSubcategoryToggle(categoryKey, sub.key)}
                className="flex items-center gap-2 w-full text-left group pl-6 transition-all duration-200"
                style={{
                  transitionDelay: isExpanded ? `${index * 30}ms` : '0ms',
                  opacity: isExpanded ? 1 : 0,
                  transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
                }}
              >
                {/* Rounded Square Checkbox */}
                <div
                  className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                    isSelected
                      ? 'scale-105'
                      : 'border-neutral-300 dark:border-neutral-600 group-hover:border-neutral-400 dark:group-hover:border-neutral-500 bg-white dark:bg-neutral-800 group-hover:scale-105'
                  }`}
                  style={isSelected ? { borderColor: ACCENT, backgroundColor: ACCENT } : {}}
                >
                  {isSelected && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs transition-colors duration-200 ${isSelected ? 'font-medium text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200'}`}>
                  {subLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Collapsible filter section component with smooth animation
function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  activeCount = 0,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  activeCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (contentRef.current) {
          setHeight(contentRef.current.scrollHeight);
        }
      });
      resizeObserver.observe(contentRef.current);
      setHeight(contentRef.current.scrollHeight);
      return () => resizeObserver.disconnect();
    }
  }, [children]);

  return (
    <div className="py-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2.5 px-1 group transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg -mx-1"
      >
        <div className="flex items-center gap-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
            {title}
          </h4>
          {activeCount > 0 && (
            <span
              className="text-[9px] font-bold w-4 h-4 rounded-full text-white flex items-center justify-center"
              style={{ backgroundColor: ACCENT }}
            >
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          maxHeight: isOpen ? height : 0,
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
        }}
      >
        <div ref={contentRef} className="space-y-0.5 pb-2 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function JobsFiltersSidebar({ filters, onFiltersChange, savedCount = 0 }: JobsFiltersSidebarProps) {
  const { locale } = useLanguage();
  const { categories, getSubcategoriesForCategory } = useCategories();

  // Track which category accordions are expanded
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Local state for budget inputs (to allow typing without immediate filtering)
  const [minInput, setMinInput] = useState<string>(filters.budgetMin?.toString() || '');
  const [maxInput, setMaxInput] = useState<string>(filters.budgetMax?.toString() || '');

  const toggleCategoryExpand = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  const handleSubcategoryToggle = (categoryKey: string, subcategoryKey: string) => {
    if (filters.category === categoryKey && filters.subcategory === subcategoryKey) {
      // Deselect if already selected
      onFiltersChange({ ...filters, category: null, subcategory: null });
    } else {
      // Select the category and subcategory
      onFiltersChange({ ...filters, category: categoryKey, subcategory: subcategoryKey });
    }
  };

  // Sync local state when filters change externally
  useEffect(() => {
    setMinInput(filters.budgetMin?.toString() || '');
    setMaxInput(filters.budgetMax?.toString() || '');
  }, [filters.budgetMin, filters.budgetMax]);

  const updateFilter = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleBudgetChange = () => {
    const min = minInput ? parseInt(minInput, 10) : null;
    const max = maxInput ? parseInt(maxInput, 10) : null;
    onFiltersChange({
      ...filters,
      budgetMin: min && !isNaN(min) ? min : null,
      budgetMax: max && !isNaN(max) ? max : null,
    });
  };

  const clearAllFilters = () => {
    setMinInput('');
    setMaxInput('');
    onFiltersChange({
      category: null,
      subcategory: null,
      budgetMin: null,
      budgetMax: null,
      propertyType: 'all',
      location: 'all',
      deadline: 'all',
      searchQuery: '',
      showFavoritesOnly: false,
    });
  };

  const hasActiveFilters =
    filters.category !== null ||
    filters.subcategory !== null ||
    filters.budgetMin !== null ||
    filters.budgetMax !== null ||
    filters.propertyType !== 'all' ||
    filters.deadline !== 'all' ||
    filters.showFavoritesOnly;

  const activeFilterCount = [
    filters.category !== null ? 1 : 0,
    (filters.budgetMin !== null || filters.budgetMax !== null) ? 1 : 0,
    filters.propertyType !== 'all' ? 1 : 0,
    filters.deadline !== 'all' ? 1 : 0,
    filters.showFavoritesOnly ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <aside className="w-full h-full overflow-y-auto overflow-x-hidden">
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              {locale === 'ka' ? 'ფილტრები' : 'Filters'}
            </h3>
            {activeFilterCount > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: ACCENT }}
              >
                {activeFilterCount}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              {locale === 'ka' ? 'გასუფთავება' : 'Clear'}
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-3" />

        {/* Saved Jobs Toggle */}
        <label
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-3 ${
            filters.showFavoritesOnly
              ? 'text-white'
              : 'bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          style={filters.showFavoritesOnly ? { backgroundColor: ACCENT } : {}}
        >
          <Bookmark className={`w-4 h-4 ${filters.showFavoritesOnly ? 'fill-white' : ''}`} />
          <span className="text-[13px] font-medium flex-1">
            {locale === 'ka' ? 'შენახულები' : 'Saved'}
          </span>
          <input
            type="checkbox"
            checked={filters.showFavoritesOnly}
            onChange={() => updateFilter('showFavoritesOnly', !filters.showFavoritesOnly)}
            className="sr-only"
          />
          {savedCount > 0 && (
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
              filters.showFavoritesOnly
                ? 'bg-white/20'
                : ''
            }`}
            style={!filters.showFavoritesOnly ? { backgroundColor: `${ACCENT}15`, color: ACCENT } : {}}
            >
              {savedCount}
            </span>
          )}
        </label>

        {/* Categories Section */}
        <div className="mb-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 px-1">
            {locale === 'ka' ? 'კატეგორიები' : 'Categories'}
          </h4>
          <div className="space-y-2">
            {categories.map((category) => {
              const categoryKey = category.key;
              const isExpanded = expandedCategories[categoryKey] ?? false;
              const subcategories = getSubcategoriesForCategory(categoryKey);
              const categoryLabel = locale === 'ka' ? category.nameKa : category.name;
              const CategoryIcon = CATEGORY_ICONS[categoryKey] || <DefaultCategoryIcon />;

              return (
                <CategoryAccordion
                  key={categoryKey}
                  categoryKey={categoryKey}
                  categoryLabel={categoryLabel}
                  categoryIcon={CategoryIcon}
                  isExpanded={isExpanded}
                  onToggle={() => toggleCategoryExpand(categoryKey)}
                  subcategories={subcategories}
                  selectedCategory={filters.category}
                  selectedSubcategory={filters.subcategory}
                  onSubcategoryToggle={handleSubcategoryToggle}
                  locale={locale}
                />
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-3" />

        {/* Budget Section - Range Inputs */}
        <CollapsibleSection
          title={locale === 'ka' ? 'ბიუჯეტი' : 'Budget'}
          activeCount={(filters.budgetMin !== null || filters.budgetMax !== null) ? 1 : 0}
        >
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                placeholder={locale === 'ka' ? 'მინ' : 'Min'}
                value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
                onBlur={handleBudgetChange}
                onKeyDown={(e) => e.key === 'Enter' && handleBudgetChange()}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': ACCENT, '--tw-ring-opacity': '0.5' } as React.CSSProperties}
                min="0"
              />
            </div>
            <span className="text-neutral-400 text-sm">-</span>
            <div className="flex-1">
              <input
                type="number"
                placeholder={locale === 'ka' ? 'მაქს' : 'Max'}
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                onBlur={handleBudgetChange}
                onKeyDown={(e) => e.key === 'Enter' && handleBudgetChange()}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': ACCENT, '--tw-ring-opacity': '0.5' } as React.CSSProperties}
                min="0"
              />
            </div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5 px-1">
            {locale === 'ka' ? '₾ ლარში' : 'In ₾ GEL'}
          </p>
        </CollapsibleSection>

        {/* Divider */}
        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

        {/* Property Type Section */}
        <CollapsibleSection
          title={locale === 'ka' ? 'ტიპი' : 'Property'}
          activeCount={filters.propertyType !== 'all' ? 1 : 0}
        >
          {PROPERTY_TYPES.filter(o => o.key !== 'all').map(option => (
            <Checkbox
              key={option.key}
              checked={filters.propertyType === option.key}
              onChange={() => updateFilter('propertyType', filters.propertyType === option.key ? 'all' : option.key)}
              label={locale === 'ka' ? option.labelKa : option.label}
            />
          ))}
        </CollapsibleSection>

        {/* Divider */}
        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

        {/* Deadline Section */}
        <CollapsibleSection
          title={locale === 'ka' ? 'ვადა' : 'Deadline'}
          activeCount={filters.deadline !== 'all' ? 1 : 0}
        >
          {DEADLINE_FILTERS.filter(o => o.key !== 'all').map(option => (
            <Checkbox
              key={option.key}
              checked={filters.deadline === option.key}
              onChange={() => updateFilter('deadline', filters.deadline === option.key ? 'all' : option.key)}
              label={locale === 'ka' ? option.labelKa : option.label}
            />
          ))}
        </CollapsibleSection>
      </div>
    </aside>
  );
}
