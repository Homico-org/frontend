'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { JobFilters } from '@/contexts/JobsContext';
import { RotateCcw, Bookmark, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ACCENT_COLOR as ACCENT } from '@/constants/theme';
import { Badge } from '@/components/ui/badge';

// Re-export JobFilters for convenience
export type { JobFilters } from '@/contexts/JobsContext';

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
        <Badge variant="premium" size="xs" className="ml-auto">
          {count}
        </Badge>
      )}
    </label>
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
  // Auto-open if there are active filters, otherwise use defaultOpen
  const [isOpen, setIsOpen] = useState(defaultOpen || activeCount > 0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  // Auto-open when filters become active
  useEffect(() => {
    if (activeCount > 0 && !isOpen) {
      setIsOpen(true);
    }
  }, [activeCount, isOpen]);

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
            <Badge variant="premium" size="xs" className="!w-4 !h-4 !p-0 !rounded-full flex items-center justify-center">
              {activeCount}
            </Badge>
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
  const { t, locale } = useLanguage();

  // Local state for budget inputs (to allow typing without immediate filtering)
  const [minInput, setMinInput] = useState<string>(filters.budgetMin?.toString() || '');
  const [maxInput, setMaxInput] = useState<string>(filters.budgetMax?.toString() || '');

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
      ...filters,
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
    filters.budgetMin !== null ||
    filters.budgetMax !== null ||
    filters.propertyType !== 'all' ||
    filters.deadline !== 'all' ||
    filters.showFavoritesOnly;

  return (
    <aside className="w-full h-full overflow-y-auto overflow-x-hidden">
      <div className="px-4 py-3">
        {/* Clear filters button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-end mb-2">
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              {t('browse.clearAll')}
            </button>
          </div>
        )}

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
            {t('browse.saved')}
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

        {/* Budget Section - Range Inputs */}
        <CollapsibleSection
          title={t('common.budget')}
          activeCount={(filters.budgetMin !== null || filters.budgetMax !== null) ? 1 : 0}
        >
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                placeholder={t('browse.min')}
                value={minInput}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || parseFloat(value) >= 0) {
                    setMinInput(value);
                  }
                }}
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
                placeholder={t('browse.max')}
                value={maxInput}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || parseFloat(value) >= 0) {
                    setMaxInput(value);
                  }
                }}
                onBlur={handleBudgetChange}
                onKeyDown={(e) => e.key === 'Enter' && handleBudgetChange()}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': ACCENT, '--tw-ring-opacity': '0.5' } as React.CSSProperties}
                min="0"
              />
            </div>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5 px-1">
            {t('browse.inGel')}
          </p>
        </CollapsibleSection>

        {/* Divider */}
        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

        {/* Property Type Section */}
        <CollapsibleSection
          title={t('browse.property')}
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
          title={t('browse.deadline')}
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
