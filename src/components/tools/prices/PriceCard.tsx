'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCategoryIcon } from './categoryIcons';
import type { PriceItem, PriceCategory } from '@/data/priceDatabase';

export interface PriceCardProps {
  /** Price item data */
  item: PriceItem;
  /** Whether expanded to show details */
  expanded?: boolean;
  /** Toggle expanded callback */
  onToggle?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Price card component for displaying a renovation work item with pricing tiers.
 */
export function PriceCard({
  item,
  expanded = false,
  onToggle,
  className,
}: PriceCardProps) {
  const { t, locale } = useLanguage();

  const itemName = locale === 'ka' ? item.nameKa : item.nameEn;
  const categoryName = t(`tools.categories.${item.category}`);
  const unitLabel = t(`tools.units.${item.unit}`);
  const perUnit = t('tools.prices.perUnit');

  const CategoryIcon = getCategoryIcon(item.category);

  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-all',
        expanded && 'ring-1 ring-[#E07B4F]/30',
        className
      )}
    >
      {/* Main Row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        {/* Category Icon */}
        <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
          <CategoryIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" strokeWidth={1.5} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-medium text-neutral-900 dark:text-white truncate">
              {itemName}
            </h3>
            {item.includesMaterials && (
              <Badge variant="success" size="xs" icon={<Package className="w-3 h-3" strokeWidth={1.5} />}>
                {t('tools.prices.withMaterials')}
              </Badge>
            )}
          </div>
          <div className="text-xs text-neutral-500">
            {categoryName} • {unitLabel}
          </div>
        </div>

        {/* Prices - Desktop */}
        <div className="hidden sm:flex items-baseline gap-4">
          <div className="text-sm text-neutral-400 tabular-nums">{item.priceLow}₾</div>
          <div className="text-lg font-semibold text-[#4A7C59] dark:text-[#6B9B7A] tabular-nums">
            {item.priceMid}₾
          </div>
          <div className="text-sm text-neutral-400 tabular-nums">{item.priceHigh}₾</div>
        </div>

        {/* Price - Mobile */}
        <div className="sm:hidden text-right">
          <div className="text-lg font-semibold text-[#4A7C59] dark:text-[#6B9B7A] tabular-nums">
            {item.priceMid}₾
          </div>
        </div>

        {/* Expand Icon */}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-neutral-400 transition-transform duration-200 flex-shrink-0',
            expanded && 'rotate-180'
          )}
          strokeWidth={1.5}
        />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="grid grid-cols-3 gap-3">
            {/* Economy */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 text-center">
              <div className="text-xs text-neutral-500 mb-1">
                {t('tools.prices.economy')}
              </div>
              <div className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">
                {item.priceLow}₾
              </div>
              <div className="text-xs text-neutral-400">
                {perUnit} {unitLabel}
              </div>
            </div>

            {/* Standard */}
            <div className="bg-[#4A7C59]/10 dark:bg-[#4A7C59]/20 rounded-lg p-3 text-center border border-[#4A7C59]/20 dark:border-[#4A7C59]/30">
              <div className="text-xs text-[#4A7C59] dark:text-[#6B9B7A] font-medium mb-1">
                {t('tools.prices.standard')}
              </div>
              <div className="text-xl font-bold text-[#4A7C59] dark:text-[#6B9B7A] tabular-nums">
                {item.priceMid}₾
              </div>
              <div className="text-xs text-[#4A7C59]/70 dark:text-[#6B9B7A]/70">
                {perUnit} {unitLabel}
              </div>
            </div>

            {/* Premium */}
            <div className="bg-[#E07B4F]/10 dark:bg-[#E07B4F]/20 rounded-lg p-3 text-center">
              <div className="text-xs text-[#E07B4F] dark:text-[#E8956A] mb-1">
                {t('tools.prices.premium')}
              </div>
              <div className="text-lg font-semibold text-[#E07B4F] dark:text-[#E8956A] tabular-nums">
                {item.priceHigh}₾
              </div>
              <div className="text-xs text-[#E07B4F]/70 dark:text-[#E8956A]/70">
                {perUnit} {unitLabel}
              </div>
            </div>
          </div>

          {item.notes && (
            <p className="mt-3 text-sm text-neutral-500 italic">{item.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default PriceCard;
