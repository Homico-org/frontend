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
  const { t, pick } = useLanguage();

  const itemName = pick({ en: item.nameEn, ka: item.nameKa });
  const categoryName = t(`tools.categories.${item.category}`);
  const unitLabel = t(`tools.units.${item.unit}`);
  const perUnit = t('tools.prices.perUnit');

  const CategoryIcon = getCategoryIcon(item.category);

  return (
    <div
      className={cn(
        'bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)] overflow-hidden transition-all',
        expanded && 'ring-1 ring-[var(--hm-brand-500)]/30',
        className
      )}
    >
      {/* Main Row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-[var(--hm-bg-tertiary)]/50 transition-colors"
      >
        {/* Category Icon */}
        <div className="w-10 h-10 bg-[var(--hm-bg-tertiary)] flex items-center justify-center flex-shrink-0">
          <CategoryIcon className="w-5 h-5 text-[var(--hm-fg-secondary)]" strokeWidth={1.5} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-medium text-[var(--hm-fg-primary)] truncate">
              {itemName}
            </h3>
            {item.includesMaterials && (
              <Badge variant="success" size="xs" icon={<Package className="w-3 h-3" strokeWidth={1.5} />}>
                {t('tools.prices.withMaterials')}
              </Badge>
            )}
          </div>
          <div className="text-xs text-[var(--hm-fg-muted)]">
            {categoryName} • {unitLabel}
          </div>
        </div>

        {/* Prices - Desktop */}
        <div className="hidden sm:flex items-baseline gap-4">
          <div className="text-sm text-[var(--hm-fg-muted)] tabular-nums">{item.priceLow}₾</div>
          <div className="text-lg font-semibold text-[var(--hm-brand-500)] tabular-nums">
            {item.priceMid}₾
          </div>
          <div className="text-sm text-[var(--hm-fg-muted)] tabular-nums">{item.priceHigh}₾</div>
        </div>

        {/* Price - Mobile */}
        <div className="sm:hidden text-right">
          <div className="text-lg font-semibold text-[var(--hm-brand-500)] tabular-nums">
            {item.priceMid}₾
          </div>
        </div>

        {/* Expand Icon */}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-[var(--hm-fg-muted)] transition-transform duration-200 flex-shrink-0',
            expanded && 'rotate-180'
          )}
          strokeWidth={1.5}
        />
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[var(--hm-border-subtle)]">
          <div className="grid grid-cols-3 gap-3">
            {/* Economy */}
            <div className="bg-[var(--hm-bg-tertiary)]/50 p-3 text-center">
              <div className="text-xs text-[var(--hm-fg-muted)] mb-1">
                {t('tools.prices.economy')}
              </div>
              <div className="text-lg font-semibold text-[var(--hm-fg-secondary)] tabular-nums">
                {item.priceLow}₾
              </div>
              <div className="text-xs text-[var(--hm-fg-muted)]">
                {perUnit} {unitLabel}
              </div>
            </div>

            {/* Standard */}
            <div className="bg-[var(--hm-brand-500)]/10 p-3 text-center border border-[var(--hm-brand-500)]/20">
              <div className="text-xs text-[var(--hm-brand-500)] font-medium mb-1">
                {t('tools.prices.standard')}
              </div>
              <div className="text-xl font-bold text-[var(--hm-brand-500)] tabular-nums">
                {item.priceMid}₾
              </div>
              <div className="text-xs text-[var(--hm-brand-500)]/70">
                {perUnit} {unitLabel}
              </div>
            </div>

            {/* Premium */}
            <div className="bg-[var(--hm-brand-500)]/10 p-3 text-center">
              <div className="text-xs text-[var(--hm-brand-500)] mb-1">
                {t('tools.prices.premium')}
              </div>
              <div className="text-lg font-semibold text-[var(--hm-brand-500)] tabular-nums">
                {item.priceHigh}₾
              </div>
              <div className="text-xs text-[var(--hm-brand-500)]/70">
                {perUnit} {unitLabel}
              </div>
            </div>
          </div>

          {item.notes && (
            <p className="mt-3 text-sm text-[var(--hm-fg-muted)] italic">{item.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default PriceCard;
