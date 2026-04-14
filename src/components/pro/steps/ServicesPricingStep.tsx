"use client";

import CategoryIcon from "@/components/categories/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/Toggle";
import { useCategories } from "@/contexts/CategoriesContext";
import type { CatalogServiceItem, Subcategory } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAiServiceSearch } from "@/hooks/useAiServiceSearch";
import { ArrowLeft, CheckCircle2, ChevronRight, Search, Sparkles, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

// ─── Exported types ──────────────────────────────────────────────────────────

export interface DiscountTier {
  minQuantity: number;
  percent: number;
}

export interface ServicePriceEntry {
  serviceKey: string;
  subcategoryKey: string;
  categoryKey: string;
  label: string;
  unit: string;
  unitLabel: string;
  basePrice: number;
  price: number;
  isActive: boolean;
  discountTiers: DiscountTier[];
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

function buildServiceEntries(
  sub: Subcategory,
  categoryKey: string,
  locale: string
): ServicePriceEntry[] {
  if (!sub.services || sub.services.length === 0) return [];
  return sub.services.map((svc: CatalogServiceItem) => ({
    serviceKey: svc.key,
    subcategoryKey: sub.key,
    categoryKey,
    label: locale === "ka" ? svc.nameKa : svc.name,
    unit: svc.unit,
    unitLabel: locale === "ka" ? svc.unitNameKa : svc.unitName,
    basePrice: svc.basePrice,
    price: 0,
    isActive: true,
    discountTiers: [],
  }));
}

const EXP_OPTIONS = [
  { value: "1-2" as const, labelKey: "register.exp1to2" },
  { value: "3-5" as const, labelKey: "register.exp3to5" },
  { value: "5-10" as const, labelKey: "register.exp5to10" },
  { value: "10+" as const, labelKey: "register.exp10plus" },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ServicesPricingStep({
  selectedSubcategories,
  onSelectedSubcategoriesChange,
}: ServicesPricingStepProps) {
  const { t, locale } = useLanguage();
  const { categories, loading } = useCategories();

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
            services: buildServiceEntries(sub, categoryKey, locale),
          },
        ]);
      }
    },
    [selectedKeys, selectedSubcategories, onSelectedSubcategoriesChange, locale]
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
      const catName = locale === "ka" ? cat.nameKa : cat.name;
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
        const catName = locale === "ka" ? cat.nameKa : cat.name;
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
  }, [categories, searchQuery, locale, aiResults]);

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
        <div className="w-8 h-8 border-2 border-[#C4735B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Panel 1: Category Grid ────────────────────────────────────────────────

  if (panel === "categories") {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t("register.servicesPricingTitle")}
          </h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {t("register.servicesPricingDescription")}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          {aiLoading ? (
            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-pulse text-[#C4735B]" />
          ) : (
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          )}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); aiSearch(e.target.value); }}
            placeholder={t("register.filterSubcategories")}
            className="w-full pl-10 pr-9 py-3 rounded-xl text-sm border outline-none transition-colors"
            style={{
              borderColor: 'var(--color-border-subtle)',
              backgroundColor: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
            }}
          />
          {searchQuery && (
            <button type="button" onClick={() => { setSearchQuery(""); aiClear(); }} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}
        </div>

        {/* Search results */}
        {searchResults !== null ? (
          <div className="space-y-1.5">
            {searchResults.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
                {t("common.noResults")}
              </p>
            ) : (
              searchResults.map(({ sub, categoryKey, catName }) => {
                const isSelected = selectedKeys.has(sub.key);
                const subName = locale === "ka" ? sub.nameKa : sub.name;
                return (
                  <button
                    key={sub.key}
                    type="button"
                    onClick={() => handleToggle(sub, categoryKey)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={{
                      backgroundColor: isSelected ? 'rgba(196,115,91,0.06)' : 'var(--color-bg-elevated)',
                      border: `1px solid ${isSelected ? 'rgba(196,115,91,0.3)' : 'var(--color-border-subtle)'}`,
                    }}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-[#C4735B] border-[#C4735B]' : 'border-[var(--color-border)]'}`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block truncate" style={{ color: 'var(--color-text-primary)' }}>{subName}</span>
                      <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{catName}</span>
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
              const catName = locale === "ka" ? cat.nameKa : cat.name;
              const selectedCount = cat.subcategories.filter((s) => selectedKeys.has(s.key)).length;
              const hasSelections = selectedCount > 0;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => goToCategory(cat.key)}
                  className="group relative flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-150 hover:shadow-sm active:scale-[0.98]"
                  style={{
                    backgroundColor: hasSelections ? 'rgba(196,115,91,0.06)' : 'var(--color-bg-elevated)',
                    border: `1px solid ${hasSelections ? 'rgba(196,115,91,0.25)' : 'var(--color-border-subtle)'}`,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      backgroundColor: hasSelections ? 'rgba(196,115,91,0.12)' : 'var(--color-bg-tertiary)',
                      color: hasSelections ? '#C4735B' : 'var(--color-text-secondary)',
                    }}
                  >
                    <CategoryIcon type={cat.key} className="w-5 h-5" />
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium block leading-tight truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {catName}
                    </span>
                    {hasSelections && (
                      <span className="text-[11px] font-medium text-[#C4735B]">
                        {selectedCount} {t("browse.selectedCount")}
                      </span>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-30 group-hover:opacity-60 transition-opacity" />
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
    const catName = locale === "ka" ? activeCategory.nameKa : activeCategory.name;

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={goBackToCategories}
          className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#C4735B]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {catName}
        </button>

        <div className="space-y-2">
          {activeCategory.subcategories.map((sub) => {
            const isSelected = selectedKeys.has(sub.key);
            const subData = selectedSubcategories.find((s) => s.key === sub.key);
            const subName = locale === "ka" ? sub.nameKa : sub.name;

            return (
              <div
                key={sub.key}
                className="rounded-xl overflow-hidden transition-all"
                style={{
                  backgroundColor: isSelected ? 'rgba(196,115,91,0.04)' : 'var(--color-bg-elevated)',
                  border: `1px solid ${isSelected ? 'rgba(196,115,91,0.2)' : 'var(--color-border-subtle)'}`,
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
                    style={{ color: 'var(--color-text-primary)' }}
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
                      <span className="text-[11px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                        {t("register.experienceYears")}
                      </span>
                      <div className="flex gap-1">
                        {EXP_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateSub(sub.key, (s) => ({ ...s, experience: opt.value }))}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all ${
                              subData.experience === opt.value
                                ? "bg-[#C4735B] text-white"
                                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                            }`}
                            style={
                              subData.experience !== opt.value
                                ? { border: '1px solid var(--color-border-subtle)' }
                                : undefined
                            }
                          >
                            {t(opt.labelKey)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Services + inline pricing */}
                    {subData.services.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                          {t("register.setPricesForServices")}
                        </p>
                        {subData.services.map((svc) => (
                          <div
                            key={svc.serviceKey}
                            className="flex items-center gap-2 py-2 px-3 rounded-lg"
                            style={{
                              backgroundColor: svc.isActive ? 'var(--color-bg-tertiary)' : 'transparent',
                              opacity: svc.isActive ? 1 : 0.4,
                            }}
                          >
                            <Toggle
                              size="sm"
                              checked={svc.isActive}
                              onChange={() =>
                                updateSub(sub.key, (s) => ({
                                  ...s,
                                  services: s.services.map((sv) =>
                                    sv.serviceKey === svc.serviceKey ? { ...sv, isActive: !sv.isActive } : sv
                                  ),
                                }))
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-medium block truncate" style={{ color: 'var(--color-text-primary)' }}>
                                {svc.label}
                              </span>
                              <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                {svc.unitLabel}
                              </span>
                            </div>
                            {svc.isActive && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-medium" style={{ color: 'var(--color-text-muted)' }}>₾</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
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
                                    className="w-20 pl-6 pr-2 py-1.5 text-sm font-semibold rounded-lg border outline-none transition-colors"
                                    style={{
                                      borderColor: svc.price === 0 ? 'rgba(196,115,91,0.4)' : 'var(--color-border-subtle)',
                                      backgroundColor: 'var(--color-bg-elevated)',
                                      color: 'var(--color-text-primary)',
                                    }}
                                  />
                                </div>
                                {svc.price === 0 && svc.basePrice > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateSub(sub.key, (s) => ({
                                        ...s,
                                        services: s.services.map((sv) =>
                                          sv.serviceKey === svc.serviceKey ? { ...sv, price: svc.basePrice } : sv
                                        ),
                                      }))
                                    }
                                    className="text-[10px] font-medium text-[#C4735B] hover:underline whitespace-nowrap"
                                  >
                                    ~{svc.basePrice}₾
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Discount tiers — inline under price */}
                            {svc.isActive && svc.price > 0 && (
                              <div className="mt-2 pt-2 space-y-1.5" style={{ borderTop: '1px dashed var(--color-border-subtle)' }}>
                                {svc.discountTiers.map((tier, tidx) => {
                                  const discountedPrice = Math.round(svc.price * (1 - tier.percent / 100));
                                  return (
                                    <div key={tidx} className="flex items-center gap-1.5 text-[11px]">
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={tier.minQuantity}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 1;
                                          updateSub(sub.key, (s) => ({
                                            ...s,
                                            services: s.services.map((sv) =>
                                              sv.serviceKey === svc.serviceKey
                                                ? { ...sv, discountTiers: sv.discountTiers.map((dt, i) => i === tidx ? { ...dt, minQuantity: val } : dt) }
                                                : sv
                                            ),
                                          }));
                                        }}
                                        className="w-8 px-1 py-0.5 text-center rounded border outline-none text-[11px] font-semibold"
                                        style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                                      />
                                      <span style={{ color: 'var(--color-text-muted)' }}>+ →</span>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={tier.percent}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                                          updateSub(sub.key, (s) => ({
                                            ...s,
                                            services: s.services.map((sv) =>
                                              sv.serviceKey === svc.serviceKey
                                                ? { ...sv, discountTiers: sv.discountTiers.map((dt, i) => i === tidx ? { ...dt, percent: val } : dt) }
                                                : sv
                                            ),
                                          }));
                                        }}
                                        className="w-10 px-1 py-0.5 text-center rounded border outline-none text-[11px] font-semibold"
                                        style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                                      />
                                      <span style={{ color: 'var(--color-text-muted)' }}>%</span>
                                      <span className="font-medium text-emerald-600 ml-auto">= {discountedPrice}₾</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateSub(sub.key, (s) => ({
                                            ...s,
                                            services: s.services.map((sv) =>
                                              sv.serviceKey === svc.serviceKey
                                                ? { ...sv, discountTiers: sv.discountTiers.filter((_, i) => i !== tidx) }
                                                : sv
                                            ),
                                          }))
                                        }
                                        className="text-red-400 hover:text-red-600 transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const lastQty = svc.discountTiers.length > 0
                                      ? svc.discountTiers[svc.discountTiers.length - 1].minQuantity + 2
                                      : 3;
                                    updateSub(sub.key, (s) => ({
                                      ...s,
                                      services: s.services.map((sv) =>
                                        sv.serviceKey === svc.serviceKey
                                          ? { ...sv, discountTiers: [...sv.discountTiers, { minQuantity: lastQty, percent: 10 }] }
                                          : sv
                                      ),
                                    }));
                                  }}
                                  className="text-[10px] font-medium text-[#C4735B] hover:underline"
                                >
                                  + {t("register.addDiscount")}
                                </button>
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

        <Button variant="secondary" size="sm" onClick={goBackToCategories} className="w-full">
          {t("common.done")}
        </Button>
      </div>
    );
  }

  return null;
}
