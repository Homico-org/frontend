'use client';

import type { Category, CatalogServiceItem, CatalogAddonItem } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, Minus, Plus } from 'lucide-react';
import { useMemo } from 'react';
import type { JobServiceSelection } from './JobServicePicker';

/**
 * Dedicated cleaning (დალაგება) picker. Unlike the generic budget-based
 * picker, cleaning has FIXED per-room prices: the client picks a cleaning type
 * (subcategory), then bumps each room's quantity with +/− (multiple bathrooms /
 * bedrooms), ticks add-ons, and the total is computed live from the catalog
 * prices. Area-based rooms (veranda, per m²) use a m² input instead of +/−.
 *
 * It emits into the shared `selectedServices` model so the rest of the post-job
 * flow (total, submit → job.services) works unchanged: each line carries
 * `budget = catalog price` and `quantity`, so `unitPrice × quantity` is correct.
 */

interface Props {
  category: Category; // the cleaning category
  selectedServices: JobServiceSelection[];
  onServicesChange: (services: JobServiceSelection[]) => void;
  activeSubKey: string;
  onActiveSubChange: (key: string) => void;
}

const AREA_UNITS = new Set(['sqm', 'm2', 'meter']);

export default function CleaningServicePicker({
  category,
  selectedServices,
  onServicesChange,
  activeSubKey,
  onActiveSubChange,
}: Props) {
  const { locale, pick } = useLanguage();

  const subs = useMemo(
    () => (category.subcategories ?? []).filter((s) => s.isActive),
    [category],
  );
  const activeSub = useMemo(
    () => subs.find((s) => s.key === activeSubKey) ?? subs[0],
    [subs, activeSubKey],
  );

  const label = (item: { name: string; nameKa: string; nameRu?: string }) =>
    pick({ en: item.name, ka: item.nameKa, ru: item.nameRu ?? item.name });

  const qtyOf = (key: string) =>
    selectedServices.find((s) => s.serviceKey === key)?.quantity ?? 0;
  const isSelected = (key: string) =>
    selectedServices.some((s) => s.serviceKey === key);

  // Upsert/remove a line. qty <= 0 removes it. budget = fixed catalog price.
  const setLine = (
    svc: CatalogServiceItem | CatalogAddonItem,
    qty: number,
  ) => {
    const others = selectedServices.filter((s) => s.serviceKey !== svc.key);
    if (qty <= 0) {
      onServicesChange(others);
      return;
    }
    const price = svc.basePrice;
    const unitNameEn = 'unitName' in svc ? svc.unitName : undefined;
    const unitNameKa = 'unitNameKa' in svc ? svc.unitNameKa : undefined;
    onServicesChange([
      ...others,
      {
        serviceKey: svc.key,
        categoryKey: category.key,
        name: svc.name,
        nameKa: svc.nameKa,
        unit: svc.unit,
        unitName: unitNameEn ?? svc.unit,
        unitNameKa: unitNameKa ?? svc.unit,
        quantity: qty,
        budget: price,
        marketMin: price,
        marketMax: 'maxPrice' in svc ? svc.maxPrice ?? price : price,
      },
    ]);
  };

  // Total for the ACTIVE cleaning type only (rooms + addons).
  const activeKeys = useMemo(() => {
    const keys = new Set<string>();
    (activeSub?.services ?? []).forEach((s) => keys.add(s.key));
    (activeSub?.addons ?? []).forEach((a) => keys.add(a.key));
    return keys;
  }, [activeSub]);

  const total = useMemo(
    () =>
      selectedServices
        .filter((s) => activeKeys.has(s.serviceKey))
        .reduce((sum, s) => sum + s.budget * (s.quantity || 1), 0),
    [selectedServices, activeKeys],
  );

  // Switching cleaning type clears the previous type's lines (you book one type).
  const switchSub = (key: string) => {
    if (key === activeSub?.key) return;
    const keep = selectedServices.filter((s) => !activeKeys.has(s.serviceKey));
    onServicesChange(keep);
    onActiveSubChange(key);
  };

  if (!activeSub) return null;

  const sym = '₾';

  return (
    <div className="space-y-5">
      {/* Cleaning type tabs */}
      <div className="flex flex-wrap gap-2">
        {subs.map((s) => {
          const on = s.key === activeSub.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => switchSub(s.key)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                on
                  ? 'bg-[var(--hm-brand-500)] text-white'
                  : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-secondary)]'
              }`}
            >
              {label(s)}
            </button>
          );
        })}
      </div>

      {/* Description */}
      {activeSub.description &&
        pick({
          en: activeSub.description.en,
          ka: activeSub.description.ka,
          ru: activeSub.description.ru,
        }).trim().length > 0 && (
          <div className="rounded-xl bg-[var(--hm-bg-secondary)] p-3 sm:p-4 text-xs sm:text-sm text-[var(--hm-fg-secondary)] whitespace-pre-line leading-relaxed">
            {pick({
              en: activeSub.description.en,
              ka: activeSub.description.ka,
              ru: activeSub.description.ru,
            })}
          </div>
        )}

      {/* Rooms */}
      <div className="space-y-2">
        {(activeSub.services ?? []).map((svc) => {
          const isArea = AREA_UNITS.has((svc.unit || '').toLowerCase());
          const qty = qtyOf(svc.key);
          return (
            <div
              key={svc.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--hm-border)] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--hm-fg-primary)] truncate">
                  {label(svc)}
                </p>
                <p className="text-xs text-[var(--hm-fg-muted)]">
                  {svc.basePrice}
                  {sym}
                  {isArea ? ` / ${pick({ en: svc.unitName ?? 'm²', ka: svc.unitNameKa ?? 'მ²' })}` : ''}
                </p>
              </div>

              {isArea ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={qty || ''}
                    onChange={(e) => {
                      const n = parseInt(e.target.value);
                      setLine(svc, isNaN(n) || n < 0 ? 0 : n);
                    }}
                    placeholder="0"
                    className="w-16 h-9 rounded-lg border border-[var(--hm-border)] bg-[var(--hm-bg-secondary)] text-center text-sm text-[var(--hm-fg-primary)]"
                  />
                  <span className="text-xs text-[var(--hm-fg-muted)]">მ²</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLine(svc, Math.max(0, qty - 1))}
                    disabled={qty <= 0}
                    className="h-8 w-8 rounded-full border border-[var(--hm-border)] flex items-center justify-center text-[var(--hm-fg-secondary)] disabled:opacity-40 hover:border-[var(--hm-brand-500)] transition-colors"
                    aria-label="−"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-[var(--hm-fg-primary)]">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLine(svc, qty + 1)}
                    className="h-8 w-8 rounded-full border border-[var(--hm-border)] flex items-center justify-center text-[var(--hm-fg-secondary)] hover:border-[var(--hm-brand-500)] transition-colors"
                    aria-label="+"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add-ons */}
      {(activeSub.addons ?? []).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--hm-fg-muted)]">
            {pick({ en: 'Add-ons', ka: 'დამატებითი სერვისები', ru: 'Доп. услуги' })}
          </p>
          {(activeSub.addons ?? []).map((a) => {
            const on = isSelected(a.key);
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => setLine(a, on ? 0 : 1)}
                className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  on
                    ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/5'
                    : 'border-[var(--hm-border)] hover:border-[var(--hm-brand-500)]/50'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                      on
                        ? 'bg-[var(--hm-brand-500)] border-[var(--hm-brand-500)]'
                        : 'border-[var(--hm-border)]'
                    }`}
                  >
                    {on && <Check className="w-3.5 h-3.5 text-white" />}
                  </span>
                  <span className="text-sm text-[var(--hm-fg-primary)] truncate">
                    {label(a)}
                  </span>
                </span>
                <span className="text-sm font-medium text-[var(--hm-brand-500)] flex-shrink-0">
                  +{a.basePrice}
                  {sym}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Live total */}
      <div className="flex items-center justify-between rounded-xl bg-[var(--hm-brand-500)]/10 px-4 py-3">
        <span className="text-sm font-medium text-[var(--hm-fg-secondary)]">
          {pick({ en: 'Total', ka: 'ჯამი', ru: 'Итого' })}
        </span>
        <span className="text-lg font-bold text-[var(--hm-brand-500)]">
          {total.toLocaleString()} {sym}
        </span>
      </div>
    </div>
  );
}
