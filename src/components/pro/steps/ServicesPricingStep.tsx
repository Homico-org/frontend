"use client";

import CategoryIcon from "@/components/categories/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toggle } from "@/components/ui/Toggle";
import { useCategories } from "@/contexts/CategoriesContext";
import type { CatalogServiceItem, Subcategory } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAiServiceSearch } from "@/hooks/useAiServiceSearch";
import AiSearchBar from "@/components/common/AiSearchBar";
import { useClickOutside } from "@/hooks/useClickOutside";
import { ArrowLeft, Check, CheckCircle2, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

// ─── Exported types ──────────────────────────────────────────────────────────

export interface DiscountTier {
  minQuantity: number;
  percent: number;
}

export interface UnitPriceEntry {
  unitId?: string; // Stable catalog id — source of truth
  unitKey: string;
  unit: string;
  unitLabel: string;
  defaultPrice: number;
  maxPrice?: number;
  price: number;
  isActive: boolean;
  discountTiers: DiscountTier[];
  // Optional range mode (added 2026-05). When `useRange` is true, the UI shows
  // min/max inputs; on save, `price` is set to the midpoint for legacy consumers
  // and `priceMin`/`priceMax` carry the explicit range.
  useRange?: boolean;
  priceMin?: number;
  priceMax?: number;
}

export interface ServicePriceEntry {
  serviceId?: string;      // Stable catalog id — source of truth
  subcategoryId?: string;
  categoryId?: string;
  serviceKey: string;
  subcategoryKey: string;
  categoryKey: string;
  label: string;
  // Legacy single-unit fields (backward compat)
  unit: string;
  unitLabel: string;
  basePrice: number;
  price: number;
  isActive: boolean;
  discountTiers: DiscountTier[];
  // Multi-unit pricing
  unitPrices?: UnitPriceEntry[];
  // Pro's free-text explanation, e.g. "Prices vary by floor type" (added 2026-05).
  notes?: string;
}

export interface SelectedSubcategoryWithPricing {
  id?: string;         // Stable catalog id — source of truth
  categoryId?: string;
  key: string;
  categoryKey: string;
  name: string;
  nameKa: string;
  experience: "1-2" | "3-5" | "5-10" | "10+";
  services: ServicePriceEntry[];
}

interface ServicesPricingStepProps {
  selectedSubcategories: SelectedSubcategoryWithPricing[];
  onSelectedSubcategoriesChange: (subs: SelectedSubcategoryWithPricing[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PickFn = (values: Partial<Record<"en" | "ka" | "ru", string | undefined>>, fallback?: string) => string;

function buildServiceEntries(
  sub: Subcategory,
  categoryKey: string,
  categoryId: string | undefined,
  pick: PickFn
): ServicePriceEntry[] {
  if (!sub.services || sub.services.length === 0) return [];
  return sub.services.map((svc: CatalogServiceItem) => {
    // Build unit price entries from catalog unitOptions
    const unitPrices: UnitPriceEntry[] = (svc.unitOptions && svc.unitOptions.length > 0)
      ? svc.unitOptions.map((uo, i) => ({
          unitId: uo.id,
          unitKey: uo.key,
          unit: uo.unit,
          unitLabel: pick({ en: uo.label.en, ka: uo.label.ka }),
          defaultPrice: uo.defaultPrice,
          maxPrice: uo.maxPrice,
          price: 0,
          isActive: i === 0, // Primary unit active by default
          discountTiers: [],
        }))
      : [{
          unitKey: svc.unit,
          unit: svc.unit,
          unitLabel: pick({ en: svc.unitName, ka: svc.unitNameKa }),
          defaultPrice: svc.basePrice,
          maxPrice: svc.maxPrice,
          price: 0,
          isActive: true, // Single unit always active
          discountTiers: [],
        }];

    return {
      serviceId: svc.id,
      subcategoryId: sub.id,
      categoryId,
      serviceKey: svc.key,
      subcategoryKey: sub.key,
      categoryKey,
      label: pick({ en: svc.name, ka: svc.nameKa }),
      // Legacy fields from primary unit
      unit: svc.unit,
      unitLabel: pick({ en: svc.unitName, ka: svc.unitNameKa }),
      basePrice: svc.basePrice,
      price: 0,
      isActive: false,
      discountTiers: [],
      // Multi-unit
      unitPrices,
    };
  });
}

const EXP_OPTIONS = [
  { value: "1-2" as const, labelKey: "register.exp1to2" },
  { value: "3-5" as const, labelKey: "register.exp3to5" },
  { value: "5-10" as const, labelKey: "register.exp5to10" },
  { value: "10+" as const, labelKey: "register.exp10plus" },
];

// ─── Unit Pricing Sub-component ─────────────────────────────────────────────

function ServiceUnitPricing({
  svc,
  subKey,
  updateSub,
}: {
  svc: ServicePriceEntry;
  subKey: string;
  updateSub: (subKey: string, updater: (s: SelectedSubcategoryWithPricing) => SelectedSubcategoryWithPricing) => void;
}) {
  const { t } = useLanguage();
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const pickerRef = useClickOutside<HTMLDivElement>(() => setShowUnitPicker(false), showUnitPicker);

  const activeUnits = svc.unitPrices?.filter(u => u.isActive) || [];
  const inactiveUnits = svc.unitPrices?.filter(u => !u.isActive) || [];
  const hasMultipleOptions = (svc.unitPrices?.length || 0) > 1;

  // Helper to update a specific unit within this service
  const updateUnit = (unitKey: string, patch: Partial<UnitPriceEntry>) => {
    updateSub(subKey, (s) => ({
      ...s,
      services: s.services.map((sv) => {
        if (sv.serviceKey !== svc.serviceKey) return sv;
        const updatedUnits = sv.unitPrices?.map(u =>
          u.unitKey === unitKey ? { ...u, ...patch } : u
        ) || [];
        const firstActive = updatedUnits.find(u => u.isActive && u.price > 0);
        return {
          ...sv,
          unitPrices: updatedUnits,
          price: firstActive?.price || 0,
          discountTiers: firstActive?.discountTiers || [],
        };
      }),
    }));
  };

  const activateUnit = (unitKey: string) => {
    updateUnit(unitKey, { isActive: true });
    setShowUnitPicker(false);
  };

  const deactivateUnit = (unitKey: string) => {
    updateUnit(unitKey, { isActive: false });
  };

  // Discount tier helpers for a specific unit
  const addDiscount = (unitKey: string, tiers: DiscountTier[]) => {
    const last = tiers[tiers.length - 1];
    const newTier: DiscountTier = {
      minQuantity: last ? last.minQuantity + 2 : 3,
      percent: last ? Math.min(99, last.percent + 5) : 10,
    };
    updateUnit(unitKey, { discountTiers: [...tiers, newTier] });
  };

  const updateDiscount = (unitKey: string, tiers: DiscountTier[], idx: number, patch: Partial<DiscountTier>) => {
    updateUnit(unitKey, {
      discountTiers: tiers.map((t, i) => i === idx ? { ...t, ...patch } : t),
    });
  };

  const removeDiscount = (unitKey: string, tiers: DiscountTier[], idx: number) => {
    updateUnit(unitKey, { discountTiers: tiers.filter((_, i) => i !== idx) });
  };

  return (
    <div className="px-3 pb-3 space-y-2">
      {/* Active unit rows — each with its own price + discount */}
      {activeUnits.map((up) => (
        <div key={up.unitKey} className="space-y-1.5">
          {/* Price row - on mobile the label takes its own row so it never
              truncates; the Fixed|Range tabs + price inputs sit below it.
              From sm: up everything fits on one line. */}
          <div
            className="flex flex-wrap items-center gap-x-2 gap-y-2 py-2 px-2.5 rounded-lg"
            style={{
              border: '1px solid var(--hm-border-subtle)',
            }}
          >
            <span
              className="text-[12px] font-medium w-full sm:w-auto sm:flex-1 sm:min-w-0"
              style={{ color: 'var(--hm-fg-primary)' }}
            >
              {up.unitLabel}
            </span>
            {/* Mode segmented control — explicit "Fixed | Range" pills so pros
                immediately see they can switch pricing models. Replaces the
                tiny ↔ icon that nobody understood. */}
            <div
              className="inline-flex items-center rounded-full p-[2px] shrink-0"
              style={{ background: 'var(--hm-n-100)' }}
              role="tablist"
              aria-label={t("register.useRangePrice")}
            >
              <button
                type="button"
                role="tab"
                aria-selected={!up.useRange}
                onClick={() => {
                  if (up.useRange) {
                    updateUnit(up.unitKey, { useRange: false, priceMin: undefined, priceMax: undefined });
                  }
                }}
                className="px-2.5 py-[3px] rounded-full text-[11px] font-semibold transition-colors"
                style={{
                  background: !up.useRange ? 'var(--hm-bg-elevated)' : 'transparent',
                  color: !up.useRange ? 'var(--hm-fg-primary)' : 'var(--hm-fg-muted)',
                  boxShadow: !up.useRange ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {t("register.pricingFixed")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!!up.useRange}
                onClick={() => {
                  if (!up.useRange) {
                    const seed = up.price > 0 ? up.price : up.defaultPrice;
                    const seedMin = Math.max(1, Math.round(seed * 0.7));
                    const seedMax = up.maxPrice && up.maxPrice > 0 ? up.maxPrice : Math.round(seed * 1.3);
                    updateUnit(up.unitKey, { useRange: true, priceMin: seedMin, priceMax: seedMax });
                  }
                }}
                className="px-2.5 py-[3px] rounded-full text-[11px] font-semibold transition-colors"
                style={{
                  background: up.useRange ? 'var(--hm-bg-elevated)' : 'transparent',
                  color: up.useRange ? 'var(--hm-brand-500)' : 'var(--hm-fg-muted)',
                  boxShadow: up.useRange ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {t("register.pricingRange")}
              </button>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {up.useRange ? (
                /* Range inputs: min - max */
                <>
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium z-10" style={{ color: 'var(--hm-fg-muted)' }}>₾</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      inputSize="sm"
                      value={up.priceMin && up.priceMin > 0 ? up.priceMin.toString() : ""}
                      onChange={(e) => {
                        const min = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                        const max = up.priceMax ?? 0;
                        const mid = max > 0 ? Math.round((min + max) / 2) : min;
                        updateUnit(up.unitKey, { priceMin: min, price: mid });
                      }}
                      placeholder={up.defaultPrice > 0 ? `${up.defaultPrice}` : t("register.priceMin")}
                      error={!up.priceMin || up.priceMin === 0 || ((up.priceMax ?? 0) > 0 && (up.priceMin ?? 0) > (up.priceMax ?? 0))}
                      className="w-[68px] pl-4 pr-1.5 text-[12px] font-semibold rounded-md"
                      aria-label={t("register.priceMin")}
                    />
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: 'var(--hm-fg-muted)' }}>-</span>
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium z-10" style={{ color: 'var(--hm-fg-muted)' }}>₾</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      inputSize="sm"
                      value={up.priceMax && up.priceMax > 0 ? up.priceMax.toString() : ""}
                      onChange={(e) => {
                        const max = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                        const min = up.priceMin ?? 0;
                        const mid = min > 0 ? Math.round((min + max) / 2) : max;
                        updateUnit(up.unitKey, { priceMax: max, price: mid });
                      }}
                      placeholder={up.maxPrice && up.maxPrice > 0 ? `${up.maxPrice}` : t("register.priceMax")}
                      error={!up.priceMax || up.priceMax === 0 || (up.priceMin ?? 0) > (up.priceMax ?? 0)}
                      className="w-[68px] pl-4 pr-1.5 text-[12px] font-semibold rounded-md"
                      aria-label={t("register.priceMax")}
                    />
                  </div>
                </>
              ) : (
                /* Single price input (default) */
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-medium z-10" style={{ color: 'var(--hm-fg-muted)' }}>₾</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    inputSize="sm"
                    value={up.price > 0 ? up.price.toString() : ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                      updateUnit(up.unitKey, { price: val });
                    }}
                    placeholder={up.defaultPrice > 0 ? `${up.defaultPrice}` : "0"}
                    error={up.price === 0}
                    className="w-18 pl-5 pr-2 text-[13px] font-semibold rounded-md"
                  />
                </div>
              )}
              {!up.useRange && up.price === 0 && up.defaultPrice > 0 && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => updateUnit(up.unitKey, { price: up.defaultPrice })}
                  className="text-[10px] font-medium whitespace-nowrap h-auto"
                >
                  ~{up.defaultPrice}₾
                </Button>
              )}
              {activeUnits.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deactivateUnit(up.unitKey)}
                  className="w-5 h-5 rounded-full hover:bg-[var(--hm-error-50)] [&_svg]:size-3"
                  aria-label={t("common.close")}
                >
                  <X className="text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)]" />
                </Button>
              )}
            </div>
          </div>

          {/* Per-unit discount tiers — readable "buy N+ → save X% → final price"
              flow with labelled inputs and a soft success pill on the right */}
          {up.price > 0 && (
            <div className="pl-3 space-y-1.5">
              {up.discountTiers.map((tier, tidx) => {
                const discountedPrice = Math.round(up.price * (1 - tier.percent / 100));
                const savings = up.price - discountedPrice;
                const prevQty = tidx > 0 ? up.discountTiers[tidx - 1].minQuantity : 1;
                const prevPercent = tidx > 0 ? up.discountTiers[tidx - 1].percent : 0;
                const minQty = prevQty + 1;
                const minPercent = prevPercent + 1;
                const validate = () => {
                  const fixes: Partial<DiscountTier> = {};
                  if (tier.minQuantity < minQty) fixes.minQuantity = minQty;
                  if (tier.percent < minPercent) fixes.percent = minPercent;
                  if (tier.percent > 99) fixes.percent = 99;
                  if (Object.keys(fixes).length > 0) updateDiscount(up.unitKey, up.discountTiers, tidx, fixes);
                };
                return (
                  <div
                    key={tidx}
                    className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 px-2.5 py-1.5 rounded-lg text-[11px]"
                    style={{ border: '1px solid var(--hm-border-subtle)' }}
                  >
                    {/* Quantity threshold */}
                    <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--hm-fg-muted)' }}>
                      {t('common.from').toLowerCase()}
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      inputSize="sm"
                      value={tier.minQuantity}
                      onChange={(e) => updateDiscount(up.unitKey, up.discountTiers, tidx, { minQuantity: parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
                      onBlur={validate}
                      error={tier.minQuantity < minQty}
                      className="w-10 px-1 py-0.5 text-center rounded font-semibold text-[12px] h-auto"
                    />
                    <span className="text-[10px]" style={{ color: 'var(--hm-fg-muted)' }}>{t('common.units').toLowerCase()}</span>

                    {/* Arrow separator */}
                    <span className="opacity-50" style={{ color: 'var(--hm-fg-muted)' }}>→</span>

                    {/* Discount percent */}
                    <Input
                      type="text"
                      inputMode="numeric"
                      inputSize="sm"
                      value={tier.percent}
                      onChange={(e) => updateDiscount(up.unitKey, up.discountTiers, tidx, { percent: parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
                      onBlur={validate}
                      error={tier.percent < minPercent}
                      className="w-10 px-1 py-0.5 text-center rounded font-semibold text-[12px] h-auto"
                    />
                    <span className="text-[10px]" style={{ color: 'var(--hm-fg-muted)' }}>%</span>

                    {/* Result pill + remove button - wrap onto a second line on
                        narrow screens so the pill never gets clipped. The
                        `ml-auto` pushes them right when there's room on the
                        first row, but `flex-wrap` lets them drop down cleanly
                        when not. */}
                    <div className="flex items-center gap-1 ml-auto">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
                        style={{
                          color: 'var(--hm-success-500)',
                          border: '1px solid rgba(62,143,90,0.25)',
                        }}
                      >
                        {discountedPrice}₾
                        <span className="text-[9px] opacity-70 font-medium">−{savings}</span>
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeDiscount(up.unitKey, up.discountTiers, tidx)}
                        className="w-5 h-5 text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)] [&_svg]:size-3"
                        aria-label={t("common.close")}
                      >
                        <X />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addDiscount(up.unitKey, up.discountTiers)}
                className="text-[11px] font-medium h-auto px-2 py-1 rounded-full"
                style={{
                  color: 'var(--hm-brand-500)',
                  border: '1px dashed rgba(239,78,36,0.30)',
                }}
              >
                <Plus className="w-3 h-3" />
                {t("common.discount")}
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* "Add pricing option" button */}
      {hasMultipleOptions && inactiveUnits.length > 0 && (
        <div className="relative" ref={pickerRef}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowUnitPicker(!showUnitPicker)}
            className="text-[11px] font-medium hover:text-[var(--hm-brand-500)] py-1 h-auto px-0"
            style={{ color: 'var(--hm-fg-muted)' }}
          >
            <Plus className="w-3 h-3" />
            {t("register.addPricingOption")}
            <ChevronDown className={`w-3 h-3 transition-transform ${showUnitPicker ? 'rotate-180' : ''}`} />
          </Button>

          {showUnitPicker && (
            <div
              className="absolute left-0 top-full mt-1.5 z-20 rounded-xl shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] py-1 min-w-[200px] overflow-hidden"
              style={{
                backgroundColor: 'var(--hm-bg-elevated)',
                border: '1px solid var(--hm-border-subtle)',
              }}
            >
              {inactiveUnits.map((up) => (
                <Button
                  key={up.unitKey}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => activateUnit(up.unitKey)}
                  className="w-full justify-between text-left px-3 py-2 text-[12px] font-medium hover:bg-[var(--hm-bg-tertiary)] rounded-none h-auto"
                  style={{ color: 'var(--hm-fg-primary)' }}
                >
                  <span>{up.unitLabel}</span>
                  {up.defaultPrice > 0 && (
                    <span className="text-[10px] tabular-nums" style={{ color: 'var(--hm-fg-muted)' }}>
                      ~{up.defaultPrice}₾
                    </span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ServicesPricingStep({
  selectedSubcategories,
  onSelectedSubcategoriesChange,
}: ServicesPricingStepProps) {
  const { t, pick } = useLanguage();
  const { categories, loading } = useCategories();

  // Always start on category grid — user navigates into subcategories themselves
  const [panel, setPanel] = useState<"categories" | "subcategories">("categories");
  const [activeCategoryKey, setActiveCategoryKey] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const { aiResults, aiLoading, search: aiSearch, clear: aiClear } = useAiServiceSearch();

  const selectedKeys = useMemo(
    () => new Set(selectedSubcategories.map((s) => s.key)),
    [selectedSubcategories]
  );

  const handleToggle = useCallback(
    (sub: Subcategory, categoryKey: string, categoryId?: string) => {
      if (selectedKeys.has(sub.key)) {
        onSelectedSubcategoriesChange(
          selectedSubcategories.filter((s) => s.key !== sub.key)
        );
      } else {
        // Auto-activate the first service with its catalog default price,
        // so the user can hit "Continue" immediately and fine-tune later.
        const services = buildServiceEntries(sub, categoryKey, categoryId, pick);
        if (services.length > 0) {
          const first = services[0];
          first.isActive = true;
          if (first.unitPrices && first.unitPrices.length > 0) {
            // Seed primary unit with its catalog defaultPrice
            first.unitPrices[0] = {
              ...first.unitPrices[0],
              price: first.unitPrices[0].defaultPrice,
              isActive: true,
            };
            first.price = first.unitPrices[0].price;
          } else {
            first.price = first.basePrice;
          }
        }
        onSelectedSubcategoriesChange([
          ...selectedSubcategories,
          {
            id: sub.id,
            categoryId,
            key: sub.key,
            categoryKey,
            name: sub.name,
            nameKa: sub.nameKa,
            experience: "3-5",
            services,
          },
        ]);
      }
    },
    [selectedKeys, selectedSubcategories, onSelectedSubcategoriesChange, pick]
  );

  const updateSub = useCallback(
    (subKey: string, updater: (s: SelectedSubcategoryWithPricing) => SelectedSubcategoryWithPricing) => {
      onSelectedSubcategoriesChange(
        selectedSubcategories.map((s) => (s.key === subKey ? updater(s) : s))
      );
    },
    [selectedSubcategories, onSelectedSubcategoriesChange]
  );

  const activeCategory = useMemo(
    () => categories.find((c) => c.key === activeCategoryKey),
    [categories, activeCategoryKey]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const localResults: Array<{ sub: Subcategory; categoryKey: string; categoryId: string; catName: string }> = [];
    for (const cat of categories) {
      const catName = pick({ en: cat.name, ka: cat.nameKa });
      for (const sub of cat.subcategories) {
        if (sub.name.toLowerCase().includes(q) || sub.nameKa.toLowerCase().includes(q)) {
          localResults.push({ sub, categoryKey: cat.key, categoryId: cat.id, catName });
        }
      }
    }

    // Merge AI results: resolve keys to subcategories
    if (aiResults && aiResults.length > 0) {
      const aiKeySet = new Set(aiResults.map(r => r.key));
      const aiMatched: typeof localResults = [];
      for (const cat of categories) {
        const catName = pick({ en: cat.name, ka: cat.nameKa });
        for (const sub of cat.subcategories) {
          if (aiKeySet.has(sub.key) || (sub.services ?? []).some(s => aiKeySet.has(s.key))) {
            aiMatched.push({ sub, categoryKey: cat.key, categoryId: cat.id, catName });
          }
        }
      }
      // Deduplicate: AI first, then local
      const seen = new Set<string>();
      const merged: typeof localResults = [];
      for (const r of [...aiMatched, ...localResults]) {
        if (!seen.has(r.sub.key)) {
          seen.add(r.sub.key);
          merged.push(r);
        }
      }
      return merged.length > 0 ? merged : null;
    }

    return localResults.length > 0 ? localResults : null;
  }, [categories, searchQuery, pick, aiResults]);

  const goToCategory = (catKey: string) => {
    setActiveCategoryKey(catKey);
    setPanel("subcategories");
  };

  const goBackToCategories = () => {
    setPanel("categories");
    setActiveCategoryKey("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="xl" variant="border" color="var(--hm-brand-500)" />
      </div>
    );
  }

  // ── Panel 1: Category Grid ────────────────────────────────────────────────

  if (panel === "categories") {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--hm-fg-primary)' }}>
            {t("register.servicesPricingTitle")}
          </h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--hm-fg-muted)' }}>
            {t("register.servicesPricingDescription")}
          </p>
        </div>

        <AiSearchBar
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v);
            if (v) aiSearch(v);
            else aiClear();
          }}
          aiLoading={aiLoading}
          aiResultsCount={aiResults?.length ?? 0}
          placeholder={t("register.filterSubcategories")}
        />

        {/* Search results */}
        {searchResults !== null ? (
          <div className="space-y-1.5">
            {searchResults.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--hm-fg-muted)' }}>
                {t("common.noResults")}
              </p>
            ) : (
              searchResults.map(({ sub, categoryKey, categoryId, catName }) => {
                const isSelected = selectedKeys.has(sub.key);
                const subName = pick({ en: sub.name, ka: sub.nameKa });
                const handleSelectFromSearch = () => {
                  if (!isSelected) {
                    handleToggle(sub, categoryKey, categoryId);
                  }
                  // Drop out of search and jump into the sub's category panel
                  // so the user can price the newly-selected service right away.
                  setSearchQuery("");
                  aiClear();
                  goToCategory(categoryKey);
                };
                return (
                  <button
                    key={sub.key}
                    type="button"
                    onClick={handleSelectFromSearch}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={{
                      backgroundColor: isSelected ? 'rgba(239,78,36,0.06)' : 'var(--hm-bg-elevated)',
                      border: `1px solid ${isSelected ? 'rgba(239,78,36,0.3)' : 'var(--hm-border-subtle)'}`,
                    }}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-[var(--hm-brand-500)] border-[var(--hm-brand-500)]' : 'border-[var(--hm-border)]'}`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block truncate" style={{ color: 'var(--hm-fg-primary)' }}>{subName}</span>
                      <span className="text-[11px]" style={{ color: 'var(--hm-fg-muted)' }}>{catName}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          /* Category grid — modern color-tinted cards using catalog `color`.
             Each category gets its own brand color (cleaning=emerald,
             plumbing=blue, painters=pink, etc.) instead of uniform vermillion.
             Selected state is signalled by a green check + vermillion count
             badge, NOT by tinting the entire card peach. */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {categories.map((cat) => {
              const catName = pick({ en: cat.name, ka: cat.nameKa });
              const accent = cat.color || 'var(--hm-brand-500)';
              // Only count subcategories that have at least 1 active service with price
              const selectedCount = cat.subcategories.filter((s) => {
                if (!selectedKeys.has(s.key)) return false;
                const subData = selectedSubcategories.find(ss => ss.key === s.key);
                return subData?.services.some(svc => svc.isActive && (svc.price > 0 || svc.unitPrices?.some(u => u.isActive && u.price > 0))) ?? false;
              }).length;
              const hasSelections = selectedCount > 0;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => goToCategory(cat.key)}
                  className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40"
                  style={{
                    backgroundColor: 'var(--hm-bg-elevated)',
                    border: `1px solid ${hasSelections ? accent : 'var(--hm-border-subtle)'}`,
                    boxShadow: hasSelections
                      ? `0 4px 14px -6px ${accent}40, 0 1px 2px rgba(0,0,0,0.03)`
                      : '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Selected check pill — top-right, vermillion */}
                  {hasSelections && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        background: 'var(--hm-brand-500)',
                        boxShadow: '0 2px 6px -2px rgba(239,78,36,0.45)',
                      }}
                    >
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}

                  {/* Icon — color-tinted backplate using the category's real color */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
                    style={{
                      backgroundColor: `${accent}14`,
                      color: accent,
                    }}
                  >
                    <CategoryIcon type={cat.icon || cat.key} className="w-5 h-5" />
                  </div>

                  {/* Name + count */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] sm:text-[14px] font-semibold block leading-tight" style={{ color: 'var(--hm-fg-primary)' }}>
                      {catName}
                    </span>
                    {hasSelections ? (
                      <span className="text-[11px] font-semibold mt-0.5 inline-block" style={{ color: 'var(--hm-brand-500)' }}>
                        {selectedCount} {t("browse.selectedCount")}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--hm-fg-muted)] mt-0.5 inline-block">
                        {cat.subcategories.length} {t("common.options")}
                      </span>
                    )}
                  </div>

                  {/* Arrow — visible only when no selection (replaced by check pill when selected) */}
                  {!hasSelections && (
                    <ChevronRight
                      className="w-4 h-4 shrink-0 transition-all hidden sm:block opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5"
                      style={{ color: 'var(--hm-fg-muted)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Panel 2: Subcategories with inline pricing ─────────────────────────

  if (panel === "subcategories" && activeCategory) {
    const catName = pick({ en: activeCategory.name, ka: activeCategory.nameKa });

    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={goBackToCategories}
          className="text-sm font-medium hover:text-[var(--hm-brand-500)] px-0"
          style={{ color: 'var(--hm-fg-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {catName}
        </Button>

        <div className="space-y-2">
          {activeCategory.subcategories.map((sub) => {
            const isSelected = selectedKeys.has(sub.key);
            const subData = selectedSubcategories.find((s) => s.key === sub.key);
            const subName = pick({ en: sub.name, ka: sub.nameKa });

            return (
              <div
                key={sub.key}
                className="rounded-2xl transition-all"
                style={{
                  backgroundColor: 'var(--hm-bg-elevated)',
                  border: `1px solid ${isSelected ? 'var(--hm-brand-500)' : 'var(--hm-border-subtle)'}`,
                  boxShadow: isSelected
                    ? '0 4px 14px -8px rgba(239,78,36,0.30)'
                    : '0 1px 2px rgba(0,0,0,0.02)',
                }}
              >
                {/* Toggle row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <Toggle
                    size="sm"
                    checked={isSelected}
                    onChange={() => handleToggle(sub, activeCategory.key, activeCategory.id)}
                  />
                  <span
                    className="flex-1 text-sm font-medium truncate cursor-pointer"
                    style={{ color: 'var(--hm-fg-primary)' }}
                    onClick={() => handleToggle(sub, activeCategory.key, activeCategory.id)}
                  >
                    {subName}
                  </span>
                </div>

                {/* Inline: experience + services with prices */}
                {isSelected && subData && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* Experience */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] shrink-0" style={{ color: 'var(--hm-fg-muted)' }}>
                        {t("register.experienceYears")}
                      </span>
                      <div className="flex gap-1">
                        {EXP_OPTIONS.map((opt) => {
                          const isActive = subData.experience === opt.value;
                          return (
                            <Button
                              key={opt.value}
                              type="button"
                              variant={isActive ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateSub(sub.key, (s) => ({ ...s, experience: opt.value }))}
                              className="px-2.5 py-1 text-[11px] font-medium rounded-full h-auto"
                            >
                              {t(opt.labelKey)}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Warning: no services selected */}
                    {subData.services.length > 0 && !subData.services.some(s => s.isActive) && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]" style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: 'rgb(180,110,10)' }}>
                        <span>⚠</span>
                        <span>{t("register.selectAtLeastOneService")}</span>
                      </div>
                    )}

                    {/* Services + inline pricing */}
                    {subData.services.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-medium" style={{ color: 'var(--hm-fg-muted)' }}>
                            {t("register.setPricesForServices")}
                          </p>
                          {(() => {
                            const active = subData.services.filter(s => s.isActive);
                            const filled = active.filter(s => s.price > 0 || s.unitPrices?.some(u => u.isActive && u.price > 0)).length;
                            if (active.length === 0) return null;
                            const missing = active.length - filled;
                            if (missing === 0) {
                              return (
                                <span className="text-[10px] font-semibold text-[var(--hm-success-500)]">
                                  {filled}/{active.length} ✓
                                </span>
                              );
                            }
                            return (
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{
                                  background: 'rgba(239,78,36,0.10)',
                                  color: 'var(--hm-brand-500)',
                                }}
                              >
                                {missing} {t('common.priceMissing')}
                              </span>
                            );
                          })()}
                        </div>
                        {subData.services.map((svc) => {
                          const hasPricedUnit = (svc.unitPrices ?? []).some(u => u.isActive && u.price > 0) || svc.price > 0;
                          const needsPrice = svc.isActive && !hasPricedUnit;
                          return (
                          <div
                            key={svc.serviceKey}
                            className="rounded-xl transition-all"
                            style={{
                              backgroundColor: 'var(--hm-bg-elevated)',
                              border: `1px solid ${needsPrice ? 'var(--hm-brand-500)' : 'var(--hm-border-subtle)'}`,
                              opacity: svc.isActive ? 1 : 0.6,
                            }}
                          >
                            {/* Service name + toggle row */}
                            <div className="flex items-center gap-2.5 py-2.5 px-3">
                              <Toggle
                                size="sm"
                                checked={svc.isActive}
                                onChange={() =>
                                  updateSub(sub.key, (s) => ({
                                    ...s,
                                    services: s.services.map((sv) => {
                                      if (sv.serviceKey !== svc.serviceKey) return sv;
                                      const turningOn = !sv.isActive;
                                      if (!turningOn) {
                                        return { ...sv, isActive: false };
                                      }
                                      // Seed primary unit with catalog default price so toggling on
                                      // always leaves the service in a valid (priced) state.
                                      if (sv.unitPrices && sv.unitPrices.length > 0) {
                                        const primary = sv.unitPrices[0];
                                        const updatedUnits = sv.unitPrices.map((u, i) =>
                                          i === 0
                                            ? {
                                                ...u,
                                                isActive: true,
                                                price: u.price > 0 ? u.price : u.defaultPrice,
                                              }
                                            : u
                                        );
                                        return {
                                          ...sv,
                                          isActive: true,
                                          unitPrices: updatedUnits,
                                          price: sv.price > 0 ? sv.price : primary.defaultPrice,
                                        };
                                      }
                                      return {
                                        ...sv,
                                        isActive: true,
                                        price: sv.price > 0 ? sv.price : sv.basePrice,
                                      };
                                    }),
                                  }))
                                }
                              />
                              <div className="flex-1 min-w-0">
                                {/* On mobile we let the title wrap to two lines
                                    instead of truncating, since the screen is
                                    too narrow for long service names like
                                    "PVC ფანჯრების მონტაჟი". Desktop keeps
                                    truncate for the single-line row layout. */}
                                <span
                                  className="text-[13px] font-medium block sm:truncate leading-snug"
                                  style={{ color: 'var(--hm-fg-primary)' }}
                                >
                                  {svc.label}
                                </span>
                              </div>
                              {/* Show price summary when active. Range-mode
                                  units expose their (priceMin, priceMax) span
                                  instead of the midpoint, so the header
                                  matches what the pro actually entered. */}
                              {svc.isActive && (() => {
                                // Flag any range-mode unit where min > max so the
                                // header shows an inline warning instead of a
                                // misleading "1120-800₾" string.
                                const hasInvertedRange = (svc.unitPrices ?? []).some((u) => {
                                  if (!u.isActive || !u.useRange) return false;
                                  const min = u.priceMin ?? 0;
                                  const max = u.priceMax ?? 0;
                                  return min > 0 && max > 0 && min > max;
                                });
                                if (hasInvertedRange) return (
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--hm-warning-500)] shrink-0">
                                    {t("register.invalidRange")}
                                  </span>
                                );
                                const activeUnits = svc.unitPrices?.filter(u => {
                                  if (!u.isActive) return false;
                                  if (u.useRange) {
                                    return (u.priceMin ?? 0) > 0 && (u.priceMax ?? 0) > 0;
                                  }
                                  return u.price > 0;
                                }) || [];
                                if (activeUnits.length === 0 && svc.price > 0) return (
                                  <span className="text-[13px] font-bold text-[var(--hm-brand-500)] shrink-0">{svc.price}₾</span>
                                );
                                if (activeUnits.length === 0) return (
                                  <span className="text-[10px] font-medium text-[var(--hm-warning-500)] shrink-0">{t("register.priceQuestion")}</span>
                                );
                                // Use the bounds from range-mode units, fall back to `price` for single-mode.
                                let lo = Number.POSITIVE_INFINITY;
                                let hi = Number.NEGATIVE_INFINITY;
                                for (const u of activeUnits) {
                                  const min = u.useRange ? (u.priceMin ?? u.price) : u.price;
                                  const max = u.useRange ? (u.priceMax ?? u.price) : u.price;
                                  if (min < lo) lo = min;
                                  if (max > hi) hi = max;
                                }
                                return (
                                  <span className="text-[12px] font-bold text-[var(--hm-brand-500)] shrink-0">
                                    {lo === hi ? `${lo}₾` : `${lo}-${hi}₾`}
                                  </span>
                                );
                              })()}
                            </div>

                            {/* Unit pricing — active rows + "add pricing" button */}
                            {svc.isActive && svc.unitPrices && svc.unitPrices.length > 0 && (
                              <ServiceUnitPricing
                                svc={svc}
                                subKey={sub.key}
                                updateSub={updateSub}
                              />
                            )}

                            {/* Fallback: single unit (no unitOptions) */}
                            {svc.isActive && (!svc.unitPrices || svc.unitPrices.length === 0) && (
                              <div className="flex items-center gap-2 px-3 pb-2.5">
                                <span className="text-[10px] shrink-0" style={{ color: 'var(--hm-fg-muted)' }}>{svc.unitLabel}</span>
                                <div className="relative ml-auto">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-medium z-10" style={{ color: 'var(--hm-fg-muted)' }}>₾</span>
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    inputSize="sm"
                                    value={svc.price > 0 ? svc.price.toString() : ""}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                                      updateSub(sub.key, (s) => ({
                                        ...s,
                                        services: s.services.map((sv) =>
                                          sv.serviceKey === svc.serviceKey ? { ...sv, price: val } : sv
                                        ),
                                      }));
                                    }}
                                    placeholder={svc.basePrice > 0 ? `${svc.basePrice}` : "0"}
                                    error={svc.price === 0}
                                    className="w-20 pl-6 pr-2 text-sm font-semibold rounded-lg"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Optional pro note (e.g. "Price varies by floor type") */}
                            {svc.isActive && (
                              <div className="px-3 pb-2.5">
                                {svc.notes !== undefined ? (
                                  <div className="flex items-start gap-1.5">
                                    <textarea
                                      value={svc.notes}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        updateSub(sub.key, (s) => ({
                                          ...s,
                                          services: s.services.map((sv) =>
                                            sv.serviceKey === svc.serviceKey ? { ...sv, notes: val } : sv
                                          ),
                                        }));
                                      }}
                                      placeholder={t("register.priceNotePlaceholder")}
                                      rows={2}
                                      className="flex-1 text-[11px] rounded-md px-2 py-1.5 resize-none outline-none focus:border-[var(--hm-brand-500)] focus:ring-2 focus:ring-[var(--hm-brand-500)]/15 transition-shadow"
                                      style={{
                                        backgroundColor: 'var(--hm-bg-elevated)',
                                        border: '1px solid var(--hm-border-subtle)',
                                        color: 'var(--hm-fg-primary)',
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => {
                                        updateSub(sub.key, (s) => ({
                                          ...s,
                                          services: s.services.map((sv) =>
                                            sv.serviceKey === svc.serviceKey ? { ...sv, notes: undefined } : sv
                                          ),
                                        }));
                                      }}
                                      className="w-5 h-5 mt-0.5 shrink-0 [&_svg]:size-3"
                                      aria-label={t("common.close")}
                                    >
                                      <X className="text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)]" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      updateSub(sub.key, (s) => ({
                                        ...s,
                                        services: s.services.map((sv) =>
                                          sv.serviceKey === svc.serviceKey ? { ...sv, notes: "" } : sv
                                        ),
                                      }));
                                    }}
                                    className="text-[10px] font-medium hover:text-[var(--hm-brand-500)] h-auto px-0 py-0"
                                    style={{ color: 'var(--hm-fg-muted)' }}
                                  >
                                    + {t("register.addNote")}
                                  </Button>
                                )}
                              </div>
                            )}

                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={goBackToCategories}
          className="w-full py-2.5 rounded-xl text-sm font-medium"
          style={{ color: 'var(--hm-fg-secondary)' }}
        >
          ← {t("register.chooseDifferentCategory")}
        </Button>
      </div>
    );
  }

  return null;
}
