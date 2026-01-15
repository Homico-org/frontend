'use client';

import { CategoryIcon } from '@/components/categories';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBrowseContext } from '@/contexts/BrowseContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown, Facebook, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

// Muted terracotta color matching design
const ACCENT_COLOR = '#C47B65';

// Budget range constants
const MIN_BUDGET = 0;
const MAX_BUDGET = 5000;

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
    <div className="bg-white rounded-lg border border-neutral-100 shadow-sm overflow-hidden">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-neutral-50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span style={{ color: ACCENT_COLOR }} className="transition-transform duration-200 group-hover:scale-110">
            {categoryIcon}
          </span>
          <span className="text-xs font-medium text-neutral-800">
            {categoryLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isExpanded ? 'rotate-180 text-neutral-600' : 'rotate-0'
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
                      : 'border-neutral-300 group-hover:border-neutral-400 bg-white group-hover:scale-105'
                  }`}
                  style={isSelected ? { borderColor: ACCENT_COLOR, backgroundColor: ACCENT_COLOR } : {}}
                >
                  {isSelected && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs transition-colors duration-200 ${isSelected ? 'font-medium text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'}`}>
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

// Collapsible Section Component
function CollapsibleCard({
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
  const [height, setHeight] = useState<number>(0);

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
    <div className="bg-white rounded-lg border border-neutral-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-neutral-50 transition-colors group"
      >
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors">
            {title}
          </h3>
          {activeCount > 0 && (
            <Badge variant="premium" size="xs" className="!w-4 !h-4 !p-0 !rounded-full flex items-center justify-center">
              {activeCount}
            </Badge>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isOpen ? 'rotate-180 text-neutral-600' : 'rotate-0'
          }`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          maxHeight: isOpen ? height : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="px-3 pb-3">
          {children}
        </div>
      </div>
    </div>
  );
}

interface BrowseFiltersSidebarProps {
  showRatingFilter?: boolean;
  showBudgetFilter?: boolean;
  showSearch?: boolean; // Not used in UI but kept for API compatibility
}

export default function BrowseFiltersSidebar({
  showBudgetFilter = true,
  showRatingFilter = true,
}: BrowseFiltersSidebarProps) {
  const { t, locale } = useLanguage();
  const { categories, getSubcategoriesForCategory } = useCategories();
  const {
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    minRating,
    setMinRating,
    budgetMin,
    setBudgetMin,
    budgetMax,
    setBudgetMax,
    clearAllFilters,
  } = useBrowseContext();

  // Only count filters that are actually visible on this page
  const hasActiveFiltersLocal =
    selectedCategory !== null ||
    selectedSubcategory !== null ||
    (showRatingFilter && minRating > 0) ||
    (showBudgetFilter && (budgetMin !== null || budgetMax !== null));

  // Track which category accordions are expanded
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Auto-expand parent category when a subcategory is selected
  useEffect(() => {
    if (selectedCategory && !expandedCategories[selectedCategory]) {
      setExpandedCategories(prev => ({
        ...prev,
        [selectedCategory]: true,
      }));
    }
  }, [selectedCategory]);

  // Local state for price inputs
  const [localMinPrice, setLocalMinPrice] = useState<string>(budgetMin?.toString() || '');
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(budgetMax?.toString() || '');

  const toggleCategoryExpand = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  };

  const handleSubcategoryToggle = (categoryKey: string, subcategoryKey: string) => {
    if (selectedCategory === categoryKey && selectedSubcategory === subcategoryKey) {
      // Deselect if already selected - clear both category and subcategory
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else {
      // Select the category and subcategory
      setSelectedCategory(categoryKey);
      setSelectedSubcategory(subcategoryKey);
    }
  };

  const handleMinPriceChange = (value: string) => {
    const numValue = value === '' ? '' : value.replace(/\D/g, '');
    setLocalMinPrice(numValue);
    setBudgetMin(numValue === '' ? null : parseInt(numValue, 10));
  };

  const handleMaxPriceChange = (value: string) => {
    const numValue = value === '' ? '' : value.replace(/\D/g, '');
    setLocalMaxPrice(numValue);
    setBudgetMax(numValue === '' ? null : parseInt(numValue, 10));
  };

  const handleRatingToggle = (rating: number) => {
    if (minRating === rating) {
      setMinRating(0);
    } else {
      setMinRating(rating);
    }
  };

  // Render star icons
  const renderStars = (count: number, filled: number) => {
    return Array.from({ length: count }).map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < filled ? 'text-amber-400' : 'text-neutral-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <aside className="w-full h-full overflow-y-auto overflow-x-hidden bg-[#FAF9F8] flex flex-col">
      <div className="p-3 space-y-2.5 flex-1">

        {/* Clear filters button */}
        {hasActiveFiltersLocal && (
          <div className="flex items-center justify-end mb-1">
            <Button
              variant="link"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs p-0 h-auto"
            >
              {t('browse.clearAll')}
            </Button>
          </div>
        )}

        {/* Category Accordions Zone */}
        <div className="space-y-2">
          {categories.map((category) => {
            const categoryKey = category.key;
            // Only expand if manually toggled - don't auto-expand on selection
            const isExpanded = expandedCategories[categoryKey] ?? false;
            const subcategories = getSubcategoriesForCategory(categoryKey);
            const categoryLabel = locale === 'ka' ? category.nameKa : category.name;

            return (
              <CategoryAccordion
                key={categoryKey}
                categoryKey={categoryKey}
                categoryLabel={categoryLabel}
                categoryIcon={<CategoryIcon type={categoryKey} className="w-4 h-4" />}
                isExpanded={isExpanded}
                onToggle={() => toggleCategoryExpand(categoryKey)}
                subcategories={subcategories}
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
                onSubcategoryToggle={handleSubcategoryToggle}
                locale={locale}
              />
            );
          })}
        </div>

        {/* Price Range Zone */}
        {showBudgetFilter && (
          <CollapsibleCard
            title={t('common.price')}
            activeCount={(budgetMin !== null || budgetMax !== null) ? 1 : 0}
          >
            <div className="flex items-center gap-2">
              {/* Min Input */}
              <div className="flex-1">
                <label className="block text-[10px] text-neutral-500 mb-1">Min</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={localMinPrice}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  placeholder={MIN_BUDGET.toString()}
                  className="h-8 text-xs"
                />
              </div>

              {/* Separator */}
              <span className="text-neutral-300 mt-4 text-xs">—</span>

              {/* Max Input */}
              <div className="flex-1">
                <label className="block text-[10px] text-neutral-500 mb-1">Max</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={localMaxPrice}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  placeholder={MAX_BUDGET.toString()}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </CollapsibleCard>
        )}

        {/* Rating Zone */}
        {showRatingFilter && (
          <CollapsibleCard
            title={t('common.rating')}
            activeCount={minRating > 0 ? 1 : 0}
          >
            <div className="space-y-1.5">
              {/* Interactive star rating row */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingToggle(star)}
                    className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
                    title={`${star}+ ${t('browse.stars')}`}
                  >
                    <svg
                      className={`w-4 h-4 transition-colors ${
                        minRating > 0 && star <= minRating
                          ? 'text-amber-400'
                          : 'text-neutral-300 hover:text-amber-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
              {/* Helper text */}
              <p className="text-[10px] text-neutral-500">
                {minRating > 0
                  ? `${minRating}+ ${locale === 'ka' ? 'ვარსკვლავი' : 'stars'}`
                  : t('browse.selectMinimum')}
              </p>
            </div>
          </CollapsibleCard>
        )}
      </div>

      {/* Footer: Help + Social */}
      <div className="p-3 border-t border-neutral-200/70 bg-white/70 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
          >
            <HelpCircle className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
            {t('common.help')}
          </Link>

          <div className="flex items-center gap-2">
            <a
              href="https://www.facebook.com/profile.php?id=61585402505170"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 transition-colors"
              aria-label="Facebook"
              title="Facebook"
            >
              <Facebook className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
