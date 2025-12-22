'use client';

import { useBrowseContext } from '@/contexts/BrowseContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// Muted terracotta color matching design
const ACCENT_COLOR = '#C47B65';

// Budget range constants
const MIN_BUDGET = 0;
const MAX_BUDGET = 5000;

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  renovation: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  ),
  design: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
    </svg>
  ),
  architecture: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  services: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
};

// Default icon for categories not in the mapping
const DefaultCategoryIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
);

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
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span style={{ color: ACCENT_COLOR }} className="transition-transform duration-200 group-hover:scale-110">
            {categoryIcon}
          </span>
          <span className="text-sm font-medium text-neutral-800">
            {categoryLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
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
        <div ref={contentRef} className="px-4 pb-3 space-y-2.5">
          {subcategories.map((sub, index) => {
            const isSelected = selectedCategory === categoryKey && selectedSubcategory === sub.key;
            const subLabel = locale === 'ka' ? sub.nameKa : sub.name;

            return (
              <button
                key={sub.key}
                onClick={() => onSubcategoryToggle(categoryKey, sub.key)}
                className="flex items-center gap-3 w-full text-left group pl-8 transition-all duration-200"
                style={{
                  transitionDelay: isExpanded ? `${index * 30}ms` : '0ms',
                  opacity: isExpanded ? 1 : 0,
                  transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
                }}
              >
                {/* Rounded Square Checkbox */}
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                    isSelected
                      ? 'scale-105'
                      : 'border-neutral-300 group-hover:border-neutral-400 bg-white group-hover:scale-105'
                  }`}
                  style={isSelected ? { borderColor: ACCENT_COLOR, backgroundColor: ACCENT_COLOR } : {}}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm transition-colors duration-200 ${isSelected ? 'font-medium text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'}`}>
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
  defaultOpen = true,
  activeCount = 0,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  activeCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

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
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors">
            {title}
          </h3>
          {activeCount > 0 && (
            <span
              className="text-[10px] font-bold w-5 h-5 rounded-full text-white flex items-center justify-center"
              style={{ backgroundColor: ACCENT_COLOR }}
            >
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
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
        <div ref={contentRef} className="px-4 pb-4">
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
  const { locale } = useLanguage();
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
    hasActiveFilters,
  } = useBrowseContext();

  // Track which category accordions are expanded
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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
    <aside className="w-full h-full overflow-y-auto overflow-x-hidden bg-[#FAF9F8]">
      <div className="p-5 space-y-4">

        {/* Header Zone */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-neutral-900">
            {locale === 'ka' ? 'ფილტრები' : 'Filters'}
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: ACCENT_COLOR }}
            >
              {locale === 'ka' ? 'გასუფთავება' : 'Clear All'}
            </button>
          )}
        </div>

        {/* Category Accordions Zone */}
        <div className="space-y-3">
          {categories.map((category) => {
            const categoryKey = category.key;
            const isExpanded = expandedCategories[categoryKey] || selectedCategory === categoryKey;
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
            title={locale === 'ka' ? 'ფასის დიაპაზონი (₾)' : 'Price Range (₾)'}
            activeCount={(budgetMin !== null || budgetMax !== null) ? 1 : 0}
          >
            <div className="flex items-center gap-3">
              {/* Min Input */}
              <div className="flex-1">
                <label className="block text-xs text-neutral-500 mb-1.5">Min</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={localMinPrice}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  placeholder={MIN_BUDGET.toString()}
                  className="w-full h-10 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C47B65]/20 focus:border-[#C47B65]/50 transition-all"
                />
              </div>

              {/* Separator */}
              <span className="text-neutral-300 mt-5">—</span>

              {/* Max Input */}
              <div className="flex-1">
                <label className="block text-xs text-neutral-500 mb-1.5">Max</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={localMaxPrice}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  placeholder={MAX_BUDGET.toString()}
                  className="w-full h-10 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C47B65]/20 focus:border-[#C47B65]/50 transition-all"
                />
              </div>
            </div>
          </CollapsibleCard>
        )}

        {/* Rating Zone */}
        {showRatingFilter && (
          <CollapsibleCard
            title={locale === 'ka' ? 'რეიტინგი' : 'Rating'}
            activeCount={minRating > 0 ? 1 : 0}
          >
            <div className="space-y-2">
              {/* Interactive star rating row */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingToggle(star)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    title={`${star}+ ${locale === 'ka' ? 'ვარსკვლავი' : 'stars'}`}
                  >
                    <svg
                      className={`w-6 h-6 transition-colors ${
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
              <p className="text-xs text-neutral-500">
                {minRating > 0
                  ? `${minRating}+ ${locale === 'ka' ? 'ვარსკვლავი' : 'stars'}`
                  : locale === 'ka' ? 'აირჩიეთ მინიმალური რეიტინგი' : 'Select minimum rating'}
              </p>
            </div>
          </CollapsibleCard>
        )}
      </div>
    </aside>
  );
}
