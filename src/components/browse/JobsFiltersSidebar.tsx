'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { JobFilters } from '@/contexts/JobsContext';
import {
  Building2,
  Home,
  ChevronDown,
  RotateCcw,
  Wallet,
  Briefcase,
  Store
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Re-export JobFilters for convenience
export type { JobFilters } from '@/contexts/JobsContext';

// Muted terracotta color (matching job page redesign)
const ACCENT_COLOR = '#C4735B';
const ACCENT_BG = 'rgba(196, 115, 91, 0.08)';

// Budget filter options - simplified to 5-6 options
export const JOB_BUDGET_FILTERS = [
  { key: 'all', label: 'Any budget', labelKa: 'ნებისმიერი', icon: null },
  { key: 'under-1k', label: 'Under ₾1,000', labelKa: '₾1,000-მდე', icon: null },
  { key: '1k-5k', label: '₾1,000 - ₾5,000', labelKa: '₾1K - ₾5K', icon: null },
  { key: '5k-15k', label: '₾5,000 - ₾15,000', labelKa: '₾5K - ₾15K', icon: null },
  { key: '15k-50k', label: '₾15,000 - ₾50,000', labelKa: '₾15K - ₾50K', icon: null },
  { key: 'over-50k', label: 'Over ₾50,000', labelKa: '₾50,000+', icon: null },
];

// Property type options with icons
const PROPERTY_TYPES = [
  { key: 'all', label: 'Any type', labelKa: 'ნებისმიერი', icon: Building2 },
  { key: 'apartment', label: 'Apartment', labelKa: 'ბინა', icon: Building2 },
  { key: 'house', label: 'House', labelKa: 'სახლი', icon: Home },
  { key: 'office', label: 'Office', labelKa: 'ოფისი', icon: Briefcase },
  { key: 'commercial', label: 'Commercial', labelKa: 'კომერციული', icon: Store },
];

// Location options - hidden by default (rarely used)
const LOCATIONS = [
  { key: 'all', label: 'All Locations', labelKa: 'ყველა' },
  { key: 'tbilisi', label: 'Tbilisi', labelKa: 'თბილისი' },
  { key: 'batumi', label: 'Batumi', labelKa: 'ბათუმი' },
  { key: 'kutaisi', label: 'Kutaisi', labelKa: 'ქუთაისი' },
  { key: 'rustavi', label: 'Rustavi', labelKa: 'რუსთავი' },
  { key: 'gori', label: 'Gori', labelKa: 'გორი' },
];

// Deadline filter options - hidden by default (rarely used)
const DEADLINE_FILTERS = [
  { key: 'all', label: 'Any Deadline', labelKa: 'ნებისმიერი' },
  { key: 'urgent', label: 'Urgent (< 7 days)', labelKa: 'სასწრაფო' },
  { key: 'week', label: 'This Week', labelKa: 'ამ კვირაში' },
  { key: 'month', label: 'This Month', labelKa: 'ამ თვეში' },
  { key: 'flexible', label: 'Flexible', labelKa: 'მოქნილი' },
];

interface JobsFiltersSidebarProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  savedCount?: number;
}

export default function JobsFiltersSidebar({ filters, onFiltersChange, savedCount = 0 }: JobsFiltersSidebarProps) {
  const { locale } = useLanguage();

  // Collapsible sections - all collapsed by default
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-expand sections with active filters
  useEffect(() => {
    const sectionsToExpand: string[] = [];
    if (filters.budget !== 'all') sectionsToExpand.push('budget');
    if (filters.propertyType !== 'all') sectionsToExpand.push('property');
    if (sectionsToExpand.length > 0) {
      setExpandedSections(prev => [...new Set([...prev, ...sectionsToExpand])]);
    }
  }, []);

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
    filters.location !== 'all' ||
    filters.deadline !== 'all' ||
    filters.showFavoritesOnly;

  const activeFilterCount = [
    filters.budget !== 'all' ? 1 : 0,
    filters.propertyType !== 'all' ? 1 : 0,
    filters.location !== 'all' ? 1 : 0,
    filters.deadline !== 'all' ? 1 : 0,
    filters.showFavoritesOnly ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

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

        {/* Budget Section - Collapsible */}
        <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('budget')}
            className="w-full flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
              <Wallet className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
              {locale === 'ka' ? 'ბიუჯეტი' : 'Budget'}
            </span>
            <div className="flex items-center gap-2">
              {filters.budget !== 'all' && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: ACCENT_BG, color: ACCENT_COLOR }}
                >
                  1
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${
                  expandedSections.includes('budget') ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {/* Budget Options - Visual Tiles */}
          {expandedSections.includes('budget') && (
            <div className="p-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                {JOB_BUDGET_FILTERS.map(option => {
                  const isSelected = filters.budget === option.key;
                  return (
                    <button
                      key={option.key}
                      onClick={() => updateFilter('budget', option.key)}
                      className={`flex items-center justify-center p-3 rounded-xl border-2 text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? 'text-white border-transparent'
                          : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]'
                      }`}
                      style={isSelected ? { backgroundColor: ACCENT_COLOR } : {}}
                    >
                      {locale === 'ka' ? option.labelKa : option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Property Type Section - Collapsible */}
        <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('property')}
            className="w-full flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
              <Building2 className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
              {locale === 'ka' ? 'ობიექტის ტიპი' : 'Property Type'}
            </span>
            <div className="flex items-center gap-2">
              {filters.propertyType !== 'all' && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: ACCENT_BG, color: ACCENT_COLOR }}
                >
                  1
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${
                  expandedSections.includes('property') ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {/* Property Type Options - Visual Tiles with Icons */}
          {expandedSections.includes('property') && (
            <div className="p-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                {PROPERTY_TYPES.map(option => {
                  const isSelected = filters.propertyType === option.key;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.key}
                      onClick={() => updateFilter('propertyType', option.key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-transparent'
                          : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]'
                      }`}
                      style={isSelected ? { backgroundColor: ACCENT_BG, borderColor: ACCENT_COLOR } : {}}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected ? '' : 'bg-[var(--color-bg-tertiary)]'
                        }`}
                        style={isSelected ? { backgroundColor: `${ACCENT_COLOR}20` } : {}}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={isSelected ? { color: ACCENT_COLOR } : {}}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${isSelected ? '' : 'text-[var(--color-text-secondary)]'}`}
                        style={isSelected ? { color: ACCENT_COLOR } : {}}
                      >
                        {locale === 'ka' ? option.labelKa : option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Advanced Filters - Hidden by default (rarely used: Location, Deadline, Saved) */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <span>{locale === 'ka' ? 'დამატებითი ფილტრები' : 'More filters'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {showAdvanced && (
          <div className="space-y-3 pt-1">
            {/* Location Section - Collapsible (rarely used) */}
            <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('location')}
                className="w-full flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {locale === 'ka' ? 'ლოკაცია' : 'Location'}
                </span>
                <div className="flex items-center gap-2">
                  {filters.location !== 'all' && (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: ACCENT_BG, color: ACCENT_COLOR }}
                    >
                      1
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${
                      expandedSections.includes('location') ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {expandedSections.includes('location') && (
                <div className="p-3 pt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {LOCATIONS.map(option => {
                      const isSelected = filters.location === option.key;
                      return (
                        <button
                          key={option.key}
                          onClick={() => updateFilter('location', option.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            isSelected
                              ? 'text-white'
                              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]'
                          }`}
                          style={isSelected ? { backgroundColor: ACCENT_COLOR } : {}}
                        >
                          {locale === 'ka' ? option.labelKa : option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Deadline Section - Collapsible (rarely used) */}
            <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('deadline')}
                className="w-full flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {locale === 'ka' ? 'ვადა' : 'Deadline'}
                </span>
                <div className="flex items-center gap-2">
                  {filters.deadline !== 'all' && (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: ACCENT_BG, color: ACCENT_COLOR }}
                    >
                      1
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform duration-200 ${
                      expandedSections.includes('deadline') ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {expandedSections.includes('deadline') && (
                <div className="p-3 pt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {DEADLINE_FILTERS.map(option => {
                      const isSelected = filters.deadline === option.key;
                      return (
                        <button
                          key={option.key}
                          onClick={() => updateFilter('deadline', option.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            isSelected
                              ? 'text-white'
                              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]'
                          }`}
                          style={isSelected ? { backgroundColor: ACCENT_COLOR } : {}}
                        >
                          {locale === 'ka' ? option.labelKa : option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Saved Jobs Toggle (rarely used) */}
            <button
              onClick={() => updateFilter('showFavoritesOnly', !filters.showFavoritesOnly)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all border-2 ${
                filters.showFavoritesOnly
                  ? 'text-white border-transparent'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:border-[var(--color-border)]'
              }`}
              style={filters.showFavoritesOnly ? { backgroundColor: ACCENT_COLOR } : {}}
            >
              <span>{locale === 'ka' ? 'შენახულები' : 'Saved Jobs'}</span>
              {savedCount > 0 && (
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${
                  filters.showFavoritesOnly
                    ? 'bg-white/20 text-white'
                    : ''
                }`}
                style={!filters.showFavoritesOnly ? { backgroundColor: ACCENT_BG, color: ACCENT_COLOR } : {}}
                >
                  {savedCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Help Text */}
        <p className="text-[11px] text-[var(--color-text-tertiary)] text-center pt-2">
          {locale === 'ka'
            ? 'აირჩიეთ ბიუჯეტი ან ტიპი შედეგების სანახავად'
            : 'Select budget or type to filter results'
          }
        </p>
      </div>
    </aside>
  );
}
