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
import { useClickOutside } from "@/hooks/useClickOutside";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Plus, Search, Sparkles, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

// ─── Exported types ──────────────────────────────────────────────────────────

export interface DiscountTier {
  minQuantity: number;
  percent: number;
}

export interface UnitPriceEntry {
  unitKey: string;
  unit: string;
  unitLabel: string;
  defaultPrice: number;
  maxPrice?: number;
  price: number;
  isActive: boolean;
  discountTiers: DiscountTier[];
}

export interface ServicePriceEntry {
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
}

export interface SelectedSubcategoryWithPricing {
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
  pick: PickFn
): ServicePriceEntry[] {
  if (!sub.services || sub.services.length === 0) return [];
  return sub.services.map((svc: CatalogServiceItem) => {
    // Build unit price entries from catalog unitOptions
    const unitPrices: UnitPriceEntry[] = (svc.unitOptions && svc.unitOptions.length > 0)
      ? svc.unitOptions.map((uo, i) => ({
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
          {/* Price row */}
          <div
            className="flex items-center gap-2 py-2 px-2.5 rounded-lg"
            style={{
              backgroundColor: 'var(--hm-bg-tertiary)',
              border: '1px solid var(--hm-border-subtle)',
            }}
          >
            <span className="text-[12px] font-medium flex-1" style={{ color: 'var(--hm-fg-primary)' }}>
              {up.unitLabel}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
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
                  className="w-18 pl-5 pr-2 text-[13px] font-semibold rounded-md"
                />
              </div>
              {up.price === 0 && up.defaultPrice > 0 && (
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

          {/* Per-unit discount tiers */}
          {up.price > 0 && (
            <div className="pl-3 space-y-1">
              {up.discountTiers.map((tier, tidx) => {
                const discountedPrice = Math.round(up.price * (1 - tier.percent / 100));
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
                  <div key={tidx} className="flex items-center gap-1.5 text-[11px]">
                    <Input
                      type="text"
                      inputMode="numeric"
                      inputSize="sm"
                      value={tier.minQuantity}
                      onChange={(e) => updateDiscount(up.unitKey, up.discountTiers, tidx, { minQuantity: parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
                      onBlur={validate}
                      error={tier.minQuantity < minQty}
                      className="w-9 px-1 py-0.5 text-center rounded font-semibold text-[11px] h-auto"
                    />
                    <span style={{ color: 'var(--hm-fg-muted)' }}>+</span>
                    <span style={{ color: 'var(--hm-fg-muted)' }}>→</span>
                    <span style={{ color: 'var(--hm-fg-secondary)' }}>%</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      inputSize="sm"
                      value={tier.percent}
                      onChange={(e) => updateDiscount(up.unitKey, up.discountTiers, tidx, { percent: parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
                      onBlur={validate}
                      error={tier.percent < minPercent}
                      className="w-9 px-1 py-0.5 text-center rounded font-semibold text-[11px] h-auto"
                    />
                    <span className="font-bold text-[var(--hm-success-500)]">= {discountedPrice}₾</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeDiscount(up.unitKey, up.discountTiers, tidx)}
                      className="ml-auto w-5 h-5 text-[var(--hm-n-300)] hover:text-[var(--hm-error-500)] [&_svg]:size-3"
                      aria-label={t("common.close")}
                    >
                      <X />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addDiscount(up.unitKey, up.discountTiers)}
                className="text-[10px] font-medium hover:text-[var(--hm-brand-500)] h-auto px-0 py-0"
                style={{ color: 'var(--hm-fg-muted)' }}
              >
                + {t("common.discount")}
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
              className="absolute left-0 top-full mt-1 z-20 rounded-lg shadow-lg py-1 min-w-[180px]"
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
                  className="w-full justify-start text-left px-3 py-2 text-[12px] font-medium hover:bg-[rgba(239,78,36,0.06)] rounded-none h-auto"
                  style={{ color: 'var(--hm-fg-primary)' }}
                >
                  <span>{up.unitLabel}</span>
                  {up.defaultPrice > 0 && (
                    <span className="ml-2 text-[10px]" style={{ color: 'var(--hm-fg-muted)' }}>
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
    (sub: Subcategory, categoryKey: string) => {
      if (selectedKeys.has(sub.key)) {
        onSelectedSubcategoriesChange(
          selectedSubcategories.filter((s) => s.key !== sub.key)
        );
      } else {
        onSelectedSubcategoriesChange([
          ...selectedSubcategories,
          {
            key: sub.key,
            categoryKey,
            name: sub.name,
            nameKa: sub.nameKa,
            experience: "3-5",
            services: buildServiceEntries(sub, categoryKey, pick),
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
    const localResults: Array<{ sub: Subcategory; categoryKey: string; catName: string }> = [];
    for (const cat of categories) {
      const catName = pick({ en: cat.name, ka: cat.nameKa });
      for (const sub of cat.subcategories) {
        if (sub.name.toLowerCase().includes(q) || sub.nameKa.toLowerCase().includes(q)) {
          localResults.push({ sub, categoryKey: cat.key, catName });
        }
      }
    }

    // Merge AI results: resolve keys to subcategories
    if (aiResults && aiResults.length > 0) {
      const aiKeySet = new Set(aiResults.map(r => r.key));
      const aiMatched: Array<{ sub: Subcategory; categoryKey: string; catName: string }> = [];
      for (const cat of categories) {
        const catName = pick({ en: cat.name, ka: cat.nameKa });
        for (const sub of cat.subcategories) {
          if (aiKeySet.has(sub.key) || (sub.services ?? []).some(s => aiKeySet.has(s.key))) {
            aiMatched.push({ sub, categoryKey: cat.key, catName });
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

        {/* Search */}
        <div className="relative">
          {aiLoading ? (
            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-pulse text-[var(--hm-brand-500)] z-10" />
          ) : (
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: 'var(--hm-fg-muted)' }} />
          )}
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); aiSearch(e.target.value); }}
            placeholder={t("register.filterSubcategories")}
            className="pl-10 pr-9 py-3 rounded-xl text-sm"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => { setSearchQuery(""); aiClear(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 [&_svg]:size-3.5"
              aria-label={t("common.close")}
            >
              <X style={{ color: 'var(--hm-fg-muted)' }} />
            </Button>
          )}
        </div>

        {/* Search results */}
        {searchResults !== null ? (
          <div className="space-y-1.5">
            {searchResults.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--hm-fg-muted)' }}>
                {t("common.noResults")}
              </p>
            ) : (
              searchResults.map(({ sub, categoryKey, catName }) => {
                const isSelected = selectedKeys.has(sub.key);
                const subName = pick({ en: sub.name, ka: sub.nameKa });
                return (
                  <button
                    key={sub.key}
                    type="button"
                    onClick={() => handleToggle(sub, categoryKey)}
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
          /* Category grid — clean, minimal */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => {
              const catName = pick({ en: cat.name, ka: cat.nameKa });
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
                  className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-xl text-left transition-all duration-150 hover:shadow-sm active:scale-[0.98]"
                  style={{
                    backgroundColor: hasSelections ? 'rgba(239,78,36,0.06)' : 'var(--hm-bg-elevated)',
                    border: `1px solid ${hasSelections ? 'rgba(239,78,36,0.25)' : 'var(--hm-border-subtle)'}`,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      backgroundColor: hasSelections ? 'rgba(239,78,36,0.12)' : 'var(--hm-bg-tertiary)',
                      color: hasSelections ? 'var(--hm-brand-500)' : 'var(--hm-fg-secondary)',
                    }}
                  >
                    <CategoryIcon type={cat.key} className="w-5 h-5" />
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] sm:text-[13px] font-medium block leading-tight" style={{ color: 'var(--hm-fg-primary)' }}>
                      {catName}
                    </span>
                    {hasSelections && (
                      <span className="text-[11px] font-medium text-[var(--hm-brand-500)]">
                        {selectedCount} {t("browse.selectedCount")}
                      </span>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-30 group-hover:opacity-60 transition-opacity hidden sm:block" />
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
                className="rounded-xl transition-all"
                style={{
                  backgroundColor: isSelected ? 'rgba(239,78,36,0.04)' : 'var(--hm-bg-elevated)',
                  border: `1px solid ${isSelected ? 'rgba(239,78,36,0.2)' : 'var(--hm-border-subtle)'}`,
                }}
              >
                {/* Toggle row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <Toggle
                    size="sm"
                    checked={isSelected}
                    onChange={() => handleToggle(sub, activeCategory.key)}
                  />
                  <span
                    className="flex-1 text-sm font-medium truncate cursor-pointer"
                    style={{ color: 'var(--hm-fg-primary)' }}
                    onClick={() => handleToggle(sub, activeCategory.key)}
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
                            return (
                              <span className={`text-[10px] font-semibold ${filled === active.length ? 'text-[var(--hm-success-500)]' : 'text-[var(--hm-warning-500)]'}`}>
                                {filled}/{active.length}
                              </span>
                            );
                          })()}
                        </div>
                        {subData.services.map((svc) => (
                          <div
                            key={svc.serviceKey}
                            className="rounded-xl transition-all"
                            style={{
                              backgroundColor: svc.isActive ? 'var(--hm-bg-elevated)' : 'var(--hm-bg-page)',
                              border: `1px solid ${svc.isActive ? 'var(--hm-border-subtle)' : 'var(--hm-border-subtle)'}`,
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
                                    services: s.services.map((sv) =>
                                      sv.serviceKey === svc.serviceKey
                                        ? { ...sv, isActive: !sv.isActive }
                                        : sv
                                    ),
                                  }))
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-[13px] font-medium block truncate" style={{ color: 'var(--hm-fg-primary)' }}>
                                  {svc.label}
                                </span>
                              </div>
                              {/* Show price summary when active */}
                              {svc.isActive && (() => {
                                const activeUnits = svc.unitPrices?.filter(u => u.isActive && u.price > 0) || [];
                                if (activeUnits.length === 0 && svc.price > 0) return (
                                  <span className="text-[13px] font-bold text-[var(--hm-brand-500)] shrink-0">{svc.price}₾</span>
                                );
                                if (activeUnits.length === 0) return (
                                  <span className="text-[10px] font-medium text-[var(--hm-warning-500)] shrink-0">{t("register.priceQuestion")}</span>
                                );
                                const prices = activeUnits.map(u => u.price);
                                const min = Math.min(...prices);
                                const max = Math.max(...prices);
                                return (
                                  <span className="text-[12px] font-bold text-[var(--hm-brand-500)] shrink-0">
                                    {min === max ? `${min}₾` : `${min}–${max}₾`}
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
                                    className="w-20 pl-6 pr-2 text-sm font-semibold rounded-lg"
                                  />
                                </div>
                              </div>
                            )}

                          </div>
                        ))}
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
