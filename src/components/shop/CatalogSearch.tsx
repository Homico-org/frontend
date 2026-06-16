'use client';

import { SearchInput } from '@/components/ui/SearchInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import EdgeFadeScroller from '@/components/ui/EdgeFadeScroller';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { Check, Package, PackageCheck, Store, Wallet, X } from 'lucide-react';
import SupplierAvatar from './SupplierAvatar';
import Select from '@/components/common/Select';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  useProductSearch,
  ProductSearchFilters,
  ProductSort,
} from '@/hooks/useProductSearch';
import CatalogProductCard from './CatalogProductCard';
import {
  CatalogProduct,
  CatalogCategoryFacet,
  CatalogSupplier,
  supplierLabel,
} from './types';

interface PricePreset {
  key: string;
  labelKey: string;
  params?: Record<string, number>;
  filter: Pick<ProductSearchFilters, 'minPrice' | 'maxPrice'>;
}

const PRICE_PRESETS: PricePreset[] = [
  { key: 'lt50', labelKey: 'projects.catalogPriceUnder', params: { amount: 50 }, filter: { maxPrice: 50 } },
  { key: 'mid', labelKey: 'projects.catalogPriceMid', params: { min: 50, max: 150 }, filter: { minPrice: 50, maxPrice: 150 } },
  { key: 'gt150', labelKey: 'projects.catalogPriceOver', params: { amount: 150 }, filter: { minPrice: 150 } },
];

const SORTS: ProductSort[] = ['relevance', 'price_asc', 'price_desc', 'newest'];
const SORT_LABEL_KEY: Record<ProductSort, string> = {
  relevance: 'projects.catalogSortRelevance',
  price_asc: 'projects.catalogSortPriceAsc',
  price_desc: 'projects.catalogSortPriceDesc',
  newest: 'projects.catalogSortNewest',
};

interface CatalogSearchProps {
  onPick: (p: CatalogProduct) => void;
  pickBusyId?: string | null;
  addedIds?: Set<string>;
  /** Tailwind grid-cols classes for the result grid. */
  gridClassName?: string;
  className?: string;
  /** Open product detail (image/title become buttons). */
  onOpenDetail?: (p: CatalogProduct) => void;
  /** Quantity of a product currently in the cart. */
  cartQtyOf?: (id: string) => number;
  /** Remove one from cart (the card stepper's minus). */
  onDecrement?: (p: CatalogProduct) => void;
  /** Card action label key (defaults to the "add to list" label). */
  addLabelKey?: string;
  /** Cart mode swaps the action icon to a cart. */
  cartMode?: boolean;
  /** Stick the search + filter bar to the top while scrolling the grid. */
  sticky?: boolean;
  /** Rendered inline at the right of the search row (e.g. a cart button). */
  endSlot?: ReactNode;
}

export default function CatalogSearch({
  onPick,
  pickBusyId,
  addedIds,
  gridClassName = 'grid grid-cols-2 gap-3 sm:grid-cols-3',
  className,
  onOpenDetail,
  cartQtyOf,
  onDecrement,
  addLabelKey,
  cartMode,
  sticky,
  endSlot,
}: CatalogSearchProps) {
  const { t } = useLanguage();
  const {
    query,
    setQuery,
    filters,
    setFilters,
    items,
    total,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    reset,
  } = useProductSearch();

  const hasActiveFilters =
    !!query ||
    !!filters.supplierKey ||
    !!filters.category ||
    !!filters.inStockOnly ||
    filters.minPrice != null ||
    filters.maxPrice != null;

  const clearAllFilters = () => {
    setQuery('');
    setFilters({});
  };

  const [suppliers, setSuppliers] = useState<CatalogSupplier[]>([]);
  const [categories, setCategories] = useState<CatalogCategoryFacet[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Shops, fetched once.
  useEffect(() => {
    api
      .get<CatalogSupplier[]>('/supplier-catalog/suppliers')
      .then((r) => setSuppliers(r.data || []))
      .catch(() => setSuppliers([]));
  }, []);

  // Categories, re-fetched whenever the shop filter changes.
  useEffect(() => {
    api
      .get<CatalogCategoryFacet[]>('/supplier-catalog/categories', {
        params: { supplierKey: filters.supplierKey || undefined },
      })
      .then((r) => setCategories(r.data || []))
      .catch(() => setCategories([]));
  }, [filters.supplierKey]);

  // Infinite scroll.
  useEffect(() => {
    const el = loaderRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  const activePreset = (preset: PricePreset) =>
    filters.minPrice === preset.filter.minPrice &&
    filters.maxPrice === preset.filter.maxPrice;

  const togglePreset = (preset: PricePreset) => {
    setFilters((f) =>
      activePreset(preset)
        ? { ...f, minPrice: undefined, maxPrice: undefined }
        : { ...f, ...preset.filter },
    );
  };

  const setShop = (key?: string) =>
    setFilters((f) => ({ ...f, supplierKey: key, category: undefined }));

  const totalProducts = suppliers.reduce((sum, s) => sum + (s.productCount || 0), 0);
  const num = (n: number) =>
    (Number.isFinite(n) ? n : 0).toLocaleString('en-US').replace(/,/g, ' ');

  // Shop card - bigger, scannable tile so each shop is easy to spot and
  // enter (vs the old thin chip row). Selected shop gets a brand ring.
  const shopCardCls = (active: boolean) =>
    `group relative flex shrink-0 items-center gap-2.5 rounded-2xl border p-2.5 pr-3.5 text-left transition-all ${
      active
        ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/[0.05] ring-1 ring-[var(--hm-brand-500)]'
        : 'border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] hover:-translate-y-0.5 hover:border-[var(--hm-border)] hover:shadow-[0_8px_22px_-14px_rgba(17,16,13,0.25)]'
    }`;

  return (
    <div className={className}>
      {/* Shops - bigger cards so each shop is easy to find and enter. One
          swipeable row; clicking a card scopes the search + categories below
          to that shop. */}
      {suppliers.length > 1 && (
        <div className="mb-4">
          <div className="mb-2.5 flex items-center gap-2">
            <Store className="h-4 w-4 text-[var(--hm-fg-muted)]" strokeWidth={1.8} />
            <h2 className="text-[13px] font-bold tracking-[-0.01em] text-[var(--hm-fg-primary)]">
              {t('projects.catalogShops')}
            </h2>
            <span className="text-[12px] font-medium tabular-nums text-[var(--hm-fg-muted)]">
              {suppliers.length}
            </span>
          </div>
          <EdgeFadeScroller className="-mx-1 flex gap-2.5 px-1 pb-1.5">
            {/* All shops */}
            <button
              type="button"
              onClick={() => setShop(undefined)}
              className={`${shopCardCls(!filters.supplierKey)} w-[150px]`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)]">
                <Store className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-[var(--hm-fg-primary)]">
                  {t('projects.catalogAllShops')}
                </span>
                <span className="mt-0.5 block text-[11px] tabular-nums text-[var(--hm-fg-muted)]">
                  {num(totalProducts)}
                </span>
              </span>
            </button>
            {suppliers.map((s) => {
              const active = filters.supplierKey === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  // Click a selected shop again to clear it (back to All shops).
                  onClick={() => setShop(active ? undefined : s.key)}
                  className={`${shopCardCls(active)} w-[168px]`}
                >
                  <SupplierAvatar supplierKey={s.key} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[var(--hm-fg-primary)]">
                      {supplierLabel(s.key)}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] tabular-nums text-[var(--hm-fg-muted)]">
                      <Package className="h-3 w-3" strokeWidth={1.8} />
                      {num(s.productCount)}
                    </span>
                  </span>
                  {active && (
                    <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--hm-brand-500)] text-white">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </EdgeFadeScroller>
        </div>
      )}

      <div
        className={
          sticky
            ? 'sticky top-0 z-20 -mx-4 border-b border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]/90 px-4 pb-3 pt-3 backdrop-blur-md'
            : ''
        }
      >
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={query}
              onValueChange={setQuery}
              placeholder={t('projects.catalogSearchPlaceholder')}
              variant="filled"
              autoFocus
            />
          </div>
          {endSlot}
        </div>

      {/* Category rail - scrollable chips, store-style */}
      {categories.length > 0 && (
        <EdgeFadeScroller className="-mx-1 mt-3 flex gap-2 px-1 pb-0.5">
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, category: undefined }))}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
              !filters.category
                ? 'border border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)] text-white'
                : 'border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]'
            }`}
          >
            {t('projects.catalogAllProducts')}
          </button>
          {categories.map((c) => (
            <button
              key={c.category}
              type="button"
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  category: f.category === c.category ? undefined : c.category,
                }))
              }
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                filters.category === c.category
                  ? 'border border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)] text-white'
                  : 'border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]'
              }`}
            >
              {c.categoryLabel || c.category}
              <span
                className={`tabular-nums ${
                  filters.category === c.category
                    ? 'text-white/70'
                    : 'text-[var(--hm-fg-subtle)]'
                }`}
              >
                {c.count}
              </span>
            </button>
          ))}
        </EdgeFadeScroller>
      )}

      {/* Sort + in-stock + price - one swipeable row on mobile */}
      <EdgeFadeScroller className="-mx-1 mt-3 flex items-center gap-2 px-1 pb-0.5">
        <Select
          value={filters.sort || 'relevance'}
          onChange={(v) =>
            setFilters((f) => ({ ...f, sort: v as ProductSort }))
          }
          options={SORTS.map((s) => ({
            value: s,
            label: t(SORT_LABEL_KEY[s]),
          }))}
          size="sm"
          className="w-[172px] shrink-0"
        />

        <button
          type="button"
          onClick={() =>
            setFilters((f) => ({ ...f, inStockOnly: !f.inStockOnly }))
          }
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-colors ${
            filters.inStockOnly
              ? 'bg-[var(--hm-success-500)] text-white'
              : 'border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]'
          }`}
        >
          {filters.inStockOnly ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <PackageCheck className="h-3.5 w-3.5" />
          )}
          {t('projects.catalogInStockOnly')}
        </button>

        {PRICE_PRESETS.map((preset, i) => {
          const active = activePreset(preset);
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => togglePreset(preset)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                active
                  ? 'border border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)] text-white'
                  : 'border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]'
              }`}
            >
              {i === 0 && <Wallet className="h-3.5 w-3.5" />}
              {t(preset.labelKey, preset.params)}
            </button>
          );
        })}
      </EdgeFadeScroller>

      </div>

      {/* Result count + clear-all */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-[var(--hm-fg-muted)]">
          {!isLoading &&
            total > 0 &&
            t('projects.catalogResultCount', {
              count: total.toLocaleString('en-US').replace(/,/g, ' '),
            })}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold text-[var(--hm-brand-500)] transition-colors hover:bg-[var(--hm-brand-500)]/[0.08]"
          >
            <X className="h-3.5 w-3.5" />
            {t('projects.catalogClearAll')}
          </button>
        )}
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className={gridClassName}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-[var(--hm-bg-tertiary)]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 text-center">
            <p className="text-[14px] text-[var(--hm-fg-muted)]">
              {t('projects.catalogError')}
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-3 text-[13px] font-semibold text-[var(--hm-brand-500)] hover:underline"
            >
              {t('projects.catalogRetry')}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 text-center">
            <Package className="h-6 w-6 text-[var(--hm-fg-muted)]" />
            <p className="text-[14px] text-[var(--hm-fg-muted)]">
              {t('projects.catalogNoResults')}
            </p>
          </div>
        ) : (
          <>
            <div className={gridClassName}>
              {items.map((p) => (
                <CatalogProductCard
                  key={p.id}
                  product={p}
                  onPick={onPick}
                  busy={pickBusyId === p.id}
                  added={addedIds?.has(p.id)}
                  cartQty={cartQtyOf?.(p.id)}
                  onDecrement={onDecrement}
                  onOpenDetail={onOpenDetail}
                  addLabelKey={addLabelKey}
                  cartMode={cartMode}
                />
              ))}
            </div>
            <div
              ref={loaderRef}
              className="flex h-12 items-center justify-center"
            >
              {isLoadingMore && <LoadingSpinner size="sm" />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
