'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { JobFilters } from '@/contexts/JobsContext';
import { RotateCcw, Bookmark } from 'lucide-react';

// Re-export JobFilters for convenience
export type { JobFilters } from '@/contexts/JobsContext';

// Warm terracotta accent
const ACCENT = '#C4735B';

// Budget filter options
export const JOB_BUDGET_FILTERS = [
  { key: 'all', label: 'Any', labelKa: 'ყველა', min: undefined as number | undefined, max: undefined as number | undefined },
  { key: 'under-1k', label: 'Under ₾1K', labelKa: '₾1K-მდე', min: undefined as number | undefined, max: 1000 },
  { key: '1k-5k', label: '₾1K - 5K', labelKa: '₾1K-5K', min: 1000, max: 5000 },
  { key: '5k-15k', label: '₾5K - 15K', labelKa: '₾5K-15K', min: 5000, max: 15000 },
  { key: '15k-50k', label: '₾15K - 50K', labelKa: '₾15K-50K', min: 15000, max: 50000 },
  { key: 'over-50k', label: '₾50K+', labelKa: '₾50K+', min: 50000, max: undefined as number | undefined },
];

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

// Filter section component
function FilterSection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2.5 px-1">
        {title}
      </h4>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}

export default function JobsFiltersSidebar({ filters, onFiltersChange, savedCount = 0 }: JobsFiltersSidebarProps) {
  const { locale } = useLanguage();

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
  };

  const hasActiveFilters =
    filters.budget !== 'all' ||
    filters.propertyType !== 'all' ||
    filters.deadline !== 'all' ||
    filters.showFavoritesOnly;

  const activeFilterCount = [
    filters.budget !== 'all' ? 1 : 0,
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

        {/* Budget Section */}
        <FilterSection title={locale === 'ka' ? 'ბიუჯეტი' : 'Budget'}>
          {JOB_BUDGET_FILTERS.map(option => (
            <Checkbox
              key={option.key}
              checked={filters.budget === option.key}
              onChange={() => updateFilter('budget', option.key)}
              label={locale === 'ka' ? option.labelKa : option.label}
            />
          ))}
        </FilterSection>

        {/* Divider */}
        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

        {/* Property Type Section */}
        <FilterSection title={locale === 'ka' ? 'ტიპი' : 'Property'}>
          {PROPERTY_TYPES.map(option => (
            <Checkbox
              key={option.key}
              checked={filters.propertyType === option.key}
              onChange={() => updateFilter('propertyType', option.key)}
              label={locale === 'ka' ? option.labelKa : option.label}
            />
          ))}
        </FilterSection>

        {/* Divider */}
        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

        {/* Deadline Section */}
        <FilterSection title={locale === 'ka' ? 'ვადა' : 'Deadline'}>
          {DEADLINE_FILTERS.map(option => (
            <Checkbox
              key={option.key}
              checked={filters.deadline === option.key}
              onChange={() => updateFilter('deadline', option.key)}
              label={locale === 'ka' ? option.labelKa : option.label}
            />
          ))}
        </FilterSection>
      </div>
    </aside>
  );
}
