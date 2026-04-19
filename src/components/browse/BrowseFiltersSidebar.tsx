'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBrowseContext } from '@/contexts/BrowseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Budget range constants
const MIN_BUDGET = 0;
const MAX_BUDGET = 5000;

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
    <div className="bg-[var(--hm-bg-elevated)] rounded-lg border border-[var(--hm-border-subtle)] shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--hm-bg-page)] transition-colors group"
      >
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold text-[var(--hm-fg-primary)] group-hover:text-[var(--hm-fg-secondary)] transition-colors">
            {title}
          </h3>
          {activeCount > 0 && (
            <Badge variant="premium" size="xs" className="!w-4 !h-4 !p-0 !rounded-full flex items-center justify-center">
              {activeCount}
            </Badge>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--hm-fg-muted)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
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
  const {
    minRating,
    setMinRating,
    budgetMin,
    setBudgetMin,
    budgetMax,
    setBudgetMax,
    clearAllFilters,
  } = useBrowseContext();

  // Only count filters that are actually visible on this page (categories are in sidebar now)
  const hasActiveFiltersLocal =
    (showRatingFilter && minRating > 0) ||
    (showBudgetFilter && (budgetMin !== null || budgetMax !== null));

  // Local state for price inputs
  const [localMinPrice, setLocalMinPrice] = useState<string>(budgetMin?.toString() || '');
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(budgetMax?.toString() || '');

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
    <aside className="w-full h-full min-h-0 bg-[var(--hm-bg-page)] flex flex-col">
      {/* Content (scrolls) */}
      <div
        className="p-3 space-y-2.5 flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >

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

        {/* Price Range Zone */}
        {showBudgetFilter && (
          <CollapsibleCard
            title={t('common.price')}
            activeCount={(budgetMin !== null || budgetMax !== null) ? 1 : 0}
          >
            <div className="flex items-center gap-2">
              {/* Min Input */}
              <div className="flex-1">
                <label className="block text-[10px] text-[var(--hm-fg-muted)] mb-1">Min</label>
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
              <span className="text-[var(--hm-n-300)] mt-4 text-xs">—</span>

              {/* Max Input */}
              <div className="flex-1">
                <label className="block text-[10px] text-[var(--hm-fg-muted)] mb-1">Max</label>
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
                          : 'text-[var(--hm-n-300)] hover:text-amber-300'
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
              <p className="text-[10px] text-[var(--hm-fg-muted)]">
                {minRating > 0
                  ? `${minRating}+ ${locale === 'ka' ? 'ვარსკვლავი' : 'stars'}`
                  : t('browse.selectMinimum')}
              </p>
            </div>
          </CollapsibleCard>
        )}
      </div>

    </aside>
  );
}
