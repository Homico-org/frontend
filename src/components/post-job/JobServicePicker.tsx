'use client';

import CategoryIcon from '@/components/categories/CategoryIcon';
import { useCategories } from '@/contexts/CategoriesContext';
import type { CatalogServiceItem, Subcategory } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAiServiceSearch } from '@/hooks/useAiServiceSearch';
import AiSearchBar from '@/components/common/AiSearchBar';
import { ArrowLeft, Check, ChevronRight, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface JobServiceSelection {
  serviceKey: string;
  name: string;
  nameKa: string;
  unit: string;
  unitKey?: string;
  unitName: string;
  unitNameKa: string;
  quantity: number;
  budget: number;
  marketMin: number;
  marketMax: number;
  // Optional flexibility (added 2026-05). When `useRange` is on, treat
  // `budget` as the typical/midpoint and `budgetMin`/`budgetMax` as the
  // customer's stated tolerance. `notes` is per-service free text.
  useRange?: boolean;
  budgetMin?: number;
  budgetMax?: number;
  notes?: string;
}

interface JobServicePickerProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedServices: JobServiceSelection[];
  onServicesChange: (services: JobServiceSelection[]) => void;
}

// Usage:
// <JobServicePicker
//   selectedCategory={selectedCategory}
//   onCategoryChange={(key) => { setSelectedCategory(key); setSelectedSubcategory(""); }}
//   selectedServices={selectedJobServices}
//   onServicesChange={setSelectedJobServices}
// />

export default function JobServicePicker({
  selectedCategory,
  onCategoryChange,
  selectedServices,
  onServicesChange,
}: JobServicePickerProps) {
  const { t, pick } = useLanguage();
  const { categories } = useCategories();
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { aiResults, aiLoading, search: aiSearch, clear: aiClear } = useAiServiceSearch();

  // Resolve AI results to actual service items
  const aiMatchedServices = useMemo(() => {
    if (!aiResults || aiResults.length === 0) return null;
    const aiKeySet = new Set(aiResults.map(r => r.key));
    const matches: { svc: CatalogServiceItem; sub: Subcategory; catKey: string }[] = [];
    for (const cat of categories) {
      for (const sub of cat.subcategories) {
        if (aiKeySet.has(sub.key)) {
          for (const svc of (sub.services ?? [])) {
            matches.push({ svc, sub, catKey: cat.key });
          }
        }
        for (const svc of (sub.services ?? [])) {
          if (aiKeySet.has(svc.key)) {
            matches.push({ svc, sub, catKey: cat.key });
          }
        }
      }
    }
    return matches.length > 0 ? matches : null;
  }, [aiResults, categories]);

  // Local text search fallback
  const localSearchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return null;
    const q = searchQuery.toLowerCase();
    const results: { svc: CatalogServiceItem; sub: Subcategory; catKey: string }[] = [];
    for (const cat of categories) {
      for (const sub of cat.subcategories) {
        for (const svc of (sub.services ?? [])) {
          if (svc.name.toLowerCase().includes(q) || svc.nameKa.toLowerCase().includes(q)) {
            results.push({ svc, sub, catKey: cat.key });
          }
        }
      }
    }
    return results.length > 0 ? results : null;
  }, [searchQuery, categories]);

  const searchResults = aiMatchedServices || localSearchResults;

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    aiSearch(value);
  }

  function handleSearchServiceSelect(svcKey: string, subKey: string, catKey: string) {
    // Auto-switch category if needed
    if (catKey !== selectedCategory) {
      if (selectedServices.length > 0) {
        // Clear existing services from different category
        onServicesChange([]);
      }
      onCategoryChange(catKey);
    }
    // Toggle the service
    handleServiceToggle(svcKey, subKey);
    setSearchQuery('');
    aiClear();
  }

  const handleCategoryClick = (categoryKey: string) => {
    if (categoryKey === selectedCategory) return;

    if (selectedServices.length > 0) {
      setPendingCategory(categoryKey);
    } else {
      onCategoryChange(categoryKey);
      onServicesChange([]);
    }
  };

  const confirmCategorySwitch = () => {
    if (!pendingCategory) return;
    if (pendingCategory === '__back__') {
      // User wants to return to the category grid; drop the active category
      // along with any selections so we don't keep stale services.
      onServicesChange([]);
      onCategoryChange('');
      setPendingCategory(null);
      return;
    }
    onCategoryChange(pendingCategory);
    onServicesChange([]);
    setPendingCategory(null);
  };

  const cancelCategorySwitch = () => {
    setPendingCategory(null);
  };

  const handleServiceToggle = (serviceKey: string, subcatKey: string) => {
    const cat = categories.find(c => c.key === selectedCategory);
    const subcat = cat?.subcategories.find(s => s.key === subcatKey);
    const svc = subcat?.services?.find(s => s.key === serviceKey);
    if (!svc) return;

    const existing = selectedServices.find(s => s.serviceKey === serviceKey);
    if (existing) {
      onServicesChange(selectedServices.filter(s => s.serviceKey !== serviceKey));
    } else {
      // Use primary unit option if available
      const primaryUnit = svc.unitOptions?.[0];
      onServicesChange([
        ...selectedServices,
        {
          serviceKey: svc.key,
          name: svc.name,
          nameKa: svc.nameKa,
          unit: primaryUnit?.unit ?? svc.unit,
          unitKey: primaryUnit?.key,
          unitName: primaryUnit ? pick({ en: primaryUnit.label.en, ka: primaryUnit.label.ka }) : svc.unitName,
          unitNameKa: primaryUnit?.label.ka ?? svc.unitNameKa,
          quantity: 1,
          budget: 0,
          marketMin: primaryUnit?.defaultPrice ?? svc.basePrice,
          marketMax: primaryUnit?.maxPrice ?? svc.maxPrice ?? primaryUnit?.defaultPrice ?? svc.basePrice,
        },
      ]);
    }
  };

  const handleQuantityChange = (serviceKey: string, value: string) => {
    const num = parseInt(value);
    onServicesChange(
      selectedServices.map(s =>
        s.serviceKey === serviceKey
          ? { ...s, quantity: isNaN(num) || num < 1 ? 1 : num }
          : s
      )
    );
  };

  const handleBudgetChange = (serviceKey: string, value: string) => {
    const num = parseFloat(value);
    onServicesChange(
      selectedServices.map(s =>
        s.serviceKey === serviceKey
          ? { ...s, budget: isNaN(num) || num < 0 ? 0 : num }
          : s
      )
    );
  };

  const handleBudgetMinChange = (serviceKey: string, value: string) => {
    const num = parseFloat(value);
    const min = isNaN(num) || num < 0 ? 0 : num;
    onServicesChange(
      selectedServices.map(s => {
        if (s.serviceKey !== serviceKey) return s;
        const max = s.budgetMax ?? 0;
        const mid = max > 0 ? Math.round((min + max) / 2) : min;
        return { ...s, budgetMin: min, budget: mid };
      })
    );
  };

  const handleBudgetMaxChange = (serviceKey: string, value: string) => {
    const num = parseFloat(value);
    const max = isNaN(num) || num < 0 ? 0 : num;
    onServicesChange(
      selectedServices.map(s => {
        if (s.serviceKey !== serviceKey) return s;
        const min = s.budgetMin ?? 0;
        const mid = min > 0 ? Math.round((min + max) / 2) : max;
        return { ...s, budgetMax: max, budget: mid };
      })
    );
  };

  const toggleRange = (serviceKey: string) => {
    onServicesChange(
      selectedServices.map(s => {
        if (s.serviceKey !== serviceKey) return s;
        if (s.useRange) {
          // Collapse → keep midpoint as budget, clear min/max
          return { ...s, useRange: false, budgetMin: undefined, budgetMax: undefined };
        }
        // Expand → seed from market range or current budget
        const seedMin = s.marketMin > 0 ? s.marketMin : Math.max(1, Math.round((s.budget || 0) * 0.7));
        const seedMax = s.marketMax > 0 ? s.marketMax : Math.round((s.budget || 0) * 1.3);
        return { ...s, useRange: true, budgetMin: seedMin, budgetMax: seedMax };
      })
    );
  };

  const setNotes = (serviceKey: string, value: string | undefined) => {
    onServicesChange(
      selectedServices.map(s =>
        s.serviceKey === serviceKey ? { ...s, notes: value } : s
      )
    );
  };

  const selectedCategoryData = categories.find(c => c.key === selectedCategory);
  const totalBudget = selectedServices.reduce((sum, s) => sum + s.budget * (s.quantity || 1), 0);

  return (
    <div className="space-y-4">
      {/* Unified AI search */}
      <AiSearchBar
        value={searchQuery}
        onChange={(v) => handleSearchChange(v)}
        aiLoading={aiLoading}
        aiResultsCount={aiResults?.length ?? 0}
        placeholder={t('browse.searchServices')}
      />

      {/* Search Results */}
      {searchQuery && searchResults && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--hm-border-subtle)', backgroundColor: 'var(--hm-bg-elevated)' }}>
          <div className="divide-y" style={{ borderColor: 'var(--hm-border-subtle)' }}>
            {searchResults.map(({ svc, sub, catKey }) => {
              const isChecked = selectedServices.some(s => s.serviceKey === svc.key);
              return (
                <button
                  key={svc.key}
                  type="button"
                  onClick={() => handleSearchServiceSelect(svc.key, sub.key, catKey)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isChecked ? 'bg-[var(--hm-brand-500)] border-[var(--hm-brand-500)]' : 'border-neutral-300'}`}>
                    {isChecked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate" style={{ color: 'var(--hm-fg-primary)' }}>
                      {pick({ en: svc.name, ka: svc.nameKa })}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--hm-fg-muted)' }}>
                      {pick({ en: sub.name, ka: sub.nameKa })}
                    </span>
                  </div>
                  {svc.basePrice > 0 && (
                    <span className="text-[11px] font-medium shrink-0" style={{ color: 'var(--hm-fg-secondary)' }}>
                      ~{svc.basePrice}₾
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category selection — collapsed when a category is selected */}
      {!searchQuery && selectedCategory && selectedCategoryData && (
        <div
          className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
          style={{ backgroundColor: 'rgba(239,78,36,0.06)', border: '1px solid rgba(239,78,36,0.25)' }}
        >
          <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-[var(--hm-brand-500)]">
            <CategoryIcon type={selectedCategory} className="w-5 h-5" />
          </span>
          <span className="text-sm font-semibold flex-1" style={{ color: 'var(--hm-fg-primary)' }}>
            {pick({ en: selectedCategoryData.name, ka: selectedCategoryData.nameKa })}
          </span>
          <button
            type="button"
            onClick={() => { onCategoryChange(''); onServicesChange([]); }}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors hover:bg-[rgba(239,78,36,0.1)]"
            style={{ color: 'var(--hm-brand-500)' }}
          >
            {t('common.change')}
          </button>
        </div>
      )}

      {/* Category grid — color-tinted cards using catalog `color`, with service count */}
      {!searchQuery && !selectedCategory && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
          {categories.filter(c => c.isActive).map(cat => {
            const accent = cat.color || 'var(--hm-brand-500)';
            const subCount = cat.subcategories.filter(s => s.isActive !== false).length;
            const svcCount = cat.subcategories.reduce(
              (n, s) => n + ((s.services?.length) ?? 0),
              0,
            );
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCategoryClick(cat.key)}
                className="group relative flex items-center gap-3 px-3.5 py-3.5 sm:px-4 sm:py-4 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)] focus-visible:ring-offset-2"
                style={{
                  backgroundColor: 'var(--hm-bg-elevated)',
                  border: '1px solid var(--hm-border-subtle)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = accent;
                  e.currentTarget.style.boxShadow = `0 6px 18px -8px ${accent}40, 0 1px 2px rgba(0,0,0,0.04)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--hm-border-subtle)';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
                }}
              >
                {/* Color-tinted icon backplate — soft tint, real catalog color */}
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-xl w-11 h-11 sm:w-12 sm:h-12 transition-colors"
                  style={{
                    background: `${accent}14`,
                    color: accent,
                  }}
                >
                  <CategoryIcon type={cat.key} className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-[13px] sm:text-sm font-semibold leading-tight text-[var(--hm-fg-primary)] line-clamp-2">
                    {pick({ en: cat.name, ka: cat.nameKa })}
                  </span>
                  {svcCount > 0 && (
                    <span className="text-[10px] sm:text-[11px] text-[var(--hm-fg-muted)]">
                      {svcCount} {t('common.services').toLowerCase()}
                    </span>
                  )}
                </span>
                <ChevronRight
                  className="w-4 h-4 flex-shrink-0 text-[var(--hm-fg-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Category switch confirmation */}
      {!searchQuery && pendingCategory && (
        <div className="rounded-xl border border-[var(--hm-warning-500)]/20 bg-[var(--hm-warning-50)] p-4 flex flex-col gap-3">
          <p className="text-sm text-[var(--hm-warning-500)]">
            {t('job.switchCategoryConfirm')}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmCategorySwitch}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-[var(--hm-warning-500)] text-white hover:bg-amber-600 transition-colors"
            >
              {t('common.confirm')}
            </button>
            <button
              type="button"
              onClick={cancelCategorySwitch}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-medium border border-[var(--hm-border-strong)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Empty state — visible only when no category and no search query */}
      {!searchQuery && !selectedCategory && (
        <div className="flex flex-col items-center text-center py-2">
          <Sparkles className="w-4 h-4 text-[var(--hm-brand-500)] mb-1" strokeWidth={1.6} />
          <p className="text-[13px] font-medium text-[var(--hm-fg-secondary)]">
            {t('job.selectCategoryFirst')}
          </p>
          <p className="mt-1 text-[11px] text-[var(--hm-fg-muted)]">
            {t('job.searchOrPick')}
          </p>
        </div>
      )}

      {!searchQuery && selectedCategoryData && (() => {
        const accent = selectedCategoryData.color || 'var(--hm-brand-500)';
        return (
        <div className="space-y-4">
          {/* Selected category header — shows accent + back link */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className="flex items-center justify-center rounded-lg w-8 h-8"
                style={{ background: `${accent}14`, color: accent }}
              >
                <CategoryIcon type={selectedCategoryData.key} className="w-4 h-4" />
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--hm-fg-muted)]">
                  {t('job.selectServices')}
                </span>
                <span className="text-sm font-semibold text-[var(--hm-fg-primary)]">
                  {pick({ en: selectedCategoryData.name, ka: selectedCategoryData.nameKa })}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (selectedServices.length > 0) {
                  setPendingCategory('__back__');
                  return;
                }
                onCategoryChange('');
              }}
              className="group inline-flex items-center gap-1 text-[12px] font-medium text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              {t('job.changeCategory')}
            </button>
          </div>

          {selectedCategoryData.subcategories
            .filter(sub => sub.isActive && sub.services && sub.services.length > 0)
            .map(subcat => (
              <div
                key={subcat.key}
                className="rounded-2xl border bg-[var(--hm-bg-elevated)] overflow-hidden"
                style={{ borderColor: 'var(--hm-border-subtle)' }}
              >
                {/* Subcategory header — clean: thin color accent line on the left, neutral bg */}
                <div
                  className="flex items-center justify-between px-4 py-3 border-b"
                  style={{ borderColor: 'var(--hm-border-subtle)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="block w-[3px] h-4 rounded-full" style={{ background: accent }} />
                    <span className="text-[13px] font-semibold text-[var(--hm-fg-primary)]">
                      {pick({ en: subcat.name, ka: subcat.nameKa })}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--hm-fg-muted)]">
                    {(subcat.services ?? []).length}
                  </span>
                </div>

                {/* Services list */}
                <div className="divide-y divide-[var(--hm-border-subtle)]">
                  {(subcat.services ?? []).map(svc => {
                    const isChecked = selectedServices.some(s => s.serviceKey === svc.key);
                    const selection = selectedServices.find(s => s.serviceKey === svc.key);
                    const hasMultipleUnits = (svc.unitOptions?.length ?? 0) > 1;
                    // Market prices from the selected unit option (or primary)
                    const selectedUnit = svc.unitOptions?.find(u => u.key === selection?.unitKey) ?? svc.unitOptions?.[0];
                    const marketMin = selectedUnit?.defaultPrice ?? svc.basePrice;
                    const marketMax = selectedUnit?.maxPrice ?? svc.maxPrice ?? marketMin;
                    const budget = selection?.budget ?? 0;
                    const aboveMarket = budget > 0 && budget > marketMax;
                    const belowMarket = budget > 0 && budget < marketMin;
                    const unitLabel = selection
                      ? pick({ en: selection.unitName, ka: selection.unitNameKa })
                      : selectedUnit
                        ? pick({ en: selectedUnit.label.en, ka: selectedUnit.label.ka })
                        : pick({ en: svc.unitName, ka: svc.unitNameKa });
                    // Admin marked this service as quote-only — hide price inputs
                    // and surface a "Request a quote" indicator instead.
                    const isQuoteOnly = svc.pricingModel === 'quote';

                    return (
                      <div
                        key={svc.key}
                        className="px-4 py-3.5"
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox — bumped to 22×22 with brand-tinted hover ring and a check icon that pops in */}
                          <button
                            type="button"
                            onClick={() => handleServiceToggle(svc.key, subcat.key)}
                            className={`flex-shrink-0 w-[22px] h-[22px] mt-px rounded-md border-2 flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)] focus-visible:ring-offset-1 ${
                              isChecked
                                ? 'border-[var(--hm-brand-500)] shadow-sm scale-[1.02]'
                                : 'border-[var(--hm-border-strong)] hover:border-[var(--hm-brand-500)] hover:scale-[1.02]'
                            }`}
                            style={isChecked ? { background: 'var(--hm-brand-500)' } : undefined}
                            aria-checked={isChecked}
                            role="checkbox"
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </button>

                          {/* Service info + unit picker + budget input */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-medium text-[var(--hm-fg-primary)]">
                                {pick({ en: svc.name, ka: svc.nameKa })}
                              </span>
                              {!isChecked && unitLabel && !isQuoteOnly && (
                                <span
                                  className="text-[11px] text-[var(--hm-fg-muted)] px-1.5 py-0.5 rounded"
                                  style={{ border: '1px solid var(--hm-border-subtle)' }}
                                >
                                  {unitLabel}
                                </span>
                              )}
                              {/* Quote-only badge — admin opted out of upfront pricing */}
                              {isQuoteOnly && (
                                <span className="text-[10px] font-semibold text-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {t('job.quoteRequired')}
                                </span>
                              )}
                              {/* Market price hint — suppressed for quote-only services */}
                              {!isQuoteOnly && marketMax > 0 && (
                                <span className="text-[11px] text-[var(--hm-fg-muted)]">
                                  {t('job.marketPrice')}: {marketMin === marketMax ? `${marketMin}₾` : `${marketMin}-${marketMax}₾`}
                                </span>
                              )}
                            </div>

                            {/* Unit picker + Budget input — only when checked AND not quote-only */}
                            {isChecked && isQuoteOnly && (
                              <div
                                className="mt-2 rounded-lg px-3 py-2.5 text-[12px]"
                                style={{
                                  border: '1px solid var(--hm-border-subtle)',
                                  color: 'var(--hm-fg-secondary)',
                                }}
                              >
                                {t('job.quoteOnlyExplain')}
                              </div>
                            )}
                            {isChecked && !isQuoteOnly && (
                              <div className="mt-2 space-y-2">
                                {/* Unit selector — pill buttons for multi-unit services */}
                                {hasMultipleUnits && (
                                  <div className="flex gap-1 flex-wrap">
                                    {svc.unitOptions!.map(uo => {
                                      const isActive = selection?.unitKey === uo.key;
                                      return (
                                        <button
                                          key={uo.key}
                                          type="button"
                                          onClick={() => {
                                            onServicesChange(selectedServices.map(s =>
                                              s.serviceKey === svc.key
                                                ? {
                                                    ...s,
                                                    unit: uo.unit,
                                                    unitKey: uo.key,
                                                    unitName: pick({ en: uo.label.en, ka: uo.label.ka }),
                                                    unitNameKa: uo.label.ka,
                                                    marketMin: uo.defaultPrice,
                                                    marketMax: uo.maxPrice ?? uo.defaultPrice,
                                                  }
                                                : s
                                            ));
                                          }}
                                          className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all ${
                                            isActive
                                              ? 'bg-[var(--hm-brand-500)] text-white'
                                              : 'text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]'
                                          }`}
                                          style={!isActive ? { border: '1px solid var(--hm-border-subtle)' } : undefined}
                                        >
                                          {pick({ en: uo.label.en, ka: uo.label.ka })}
                                          {uo.defaultPrice > 0 && (
                                            <span className={`ml-1 ${isActive ? 'opacity-80' : 'opacity-50'}`}>~{uo.defaultPrice}₾</span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Quantity + Per-unit price */}
                                <div
                                  className="rounded-lg px-3 py-2.5 space-y-2"
                                  style={{ border: '1px solid var(--hm-border-subtle)' }}
                                >
                                  <div className="flex items-center gap-3">
                                    {/* Quantity */}
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-medium" style={{ color: 'var(--hm-fg-muted)' }}>
                                        {t('common.qty')}
                                      </span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={selection?.quantity ?? 1}
                                        onChange={e => handleQuantityChange(svc.key, e.target.value)}
                                        className="w-12 px-1.5 py-1 text-[13px] font-semibold text-center rounded-md border outline-none transition-all focus:border-[var(--hm-brand-500)]"
                                        style={{
                                          borderColor: 'var(--hm-border-subtle)',
                                          backgroundColor: 'var(--hm-bg-elevated)',
                                          color: 'var(--hm-fg-primary)',
                                        }}
                                      />
                                    </div>

                                    <span className="text-[11px]" style={{ color: 'var(--hm-fg-muted)' }}>×</span>

                                    {/* Per-unit price (single OR min-max range) */}
                                    <div className="flex items-center gap-1.5 flex-1">
                                      <span className="text-[11px] font-medium shrink-0" style={{ color: 'var(--hm-fg-muted)' }}>
                                        {t('common.price')}/{unitLabel}
                                      </span>
                                      {selection?.useRange ? (
                                        <div className="flex items-center gap-1 flex-1">
                                          <div className="relative flex-1 max-w-[64px]">
                                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium" style={{ color: 'var(--hm-fg-muted)' }}>₾</span>
                                            <input
                                              type="number"
                                              min="0"
                                              step="1"
                                              value={selection.budgetMin === undefined || selection.budgetMin === 0 ? '' : selection.budgetMin}
                                              onChange={e => handleBudgetMinChange(svc.key, e.target.value)}
                                              placeholder={`${marketMin}`}
                                              aria-label={t('register.priceMin')}
                                              className="w-full pl-4 pr-1 py-1 text-[12px] font-semibold rounded-md border outline-none transition-all focus:border-[var(--hm-brand-500)]"
                                              style={{
                                                borderColor: 'var(--hm-border-subtle)',
                                                backgroundColor: 'var(--hm-bg-elevated)',
                                                color: 'var(--hm-fg-primary)',
                                              }}
                                            />
                                          </div>
                                          <span className="text-[11px]" style={{ color: 'var(--hm-fg-muted)' }}>-</span>
                                          <div className="relative flex-1 max-w-[64px]">
                                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium" style={{ color: 'var(--hm-fg-muted)' }}>₾</span>
                                            <input
                                              type="number"
                                              min="0"
                                              step="1"
                                              value={selection.budgetMax === undefined || selection.budgetMax === 0 ? '' : selection.budgetMax}
                                              onChange={e => handleBudgetMaxChange(svc.key, e.target.value)}
                                              placeholder={`${marketMax}`}
                                              aria-label={t('register.priceMax')}
                                              className="w-full pl-4 pr-1 py-1 text-[12px] font-semibold rounded-md border outline-none transition-all focus:border-[var(--hm-brand-500)]"
                                              style={{
                                                borderColor: 'var(--hm-border-subtle)',
                                                backgroundColor: 'var(--hm-bg-elevated)',
                                                color: 'var(--hm-fg-primary)',
                                              }}
                                            />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="relative flex-1 max-w-[120px]">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-medium" style={{ color: 'var(--hm-fg-muted)' }}>₾</span>
                                          <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={budget === 0 ? '' : budget}
                                            onChange={e => handleBudgetChange(svc.key, e.target.value)}
                                            placeholder={`${marketMin}-${marketMax}`}
                                            className="w-full pl-5 pr-2 py-1 text-[13px] font-semibold rounded-md border outline-none transition-all focus:border-[var(--hm-brand-500)]"
                                            style={{
                                              borderColor: 'var(--hm-border-subtle)',
                                              backgroundColor: 'var(--hm-bg-elevated)',
                                              color: 'var(--hm-fg-primary)',
                                            }}
                                          />
                                        </div>
                                      )}
                                      {/* Range toggle */}
                                      <button
                                        type="button"
                                        onClick={() => toggleRange(svc.key)}
                                        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--hm-bg-elevated)]"
                                        aria-label={selection?.useRange ? t('register.useFixedPrice') : t('register.useRangePrice')}
                                        title={selection?.useRange ? t('register.useFixedPrice') : t('register.useRangePrice')}
                                      >
                                        <span className="text-[12px] font-bold" style={{ color: selection?.useRange ? 'var(--hm-brand-500)' : 'var(--hm-fg-muted)' }}>↔</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Optional per-service note */}
                                  {selection?.notes !== undefined ? (
                                    <div className="flex items-start gap-1.5">
                                      <textarea
                                        value={selection.notes}
                                        onChange={e => setNotes(svc.key, e.target.value)}
                                        placeholder={t('register.priceNotePlaceholder')}
                                        rows={2}
                                        className="flex-1 text-[11px] rounded-md px-2 py-1.5 resize-none border outline-none focus:border-[var(--hm-brand-500)]"
                                        style={{
                                          borderColor: 'var(--hm-border-subtle)',
                                          backgroundColor: 'var(--hm-bg-elevated)',
                                          color: 'var(--hm-fg-primary)',
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setNotes(svc.key, undefined)}
                                        className="w-5 h-5 mt-0.5 rounded-full shrink-0 flex items-center justify-center hover:bg-[var(--hm-error-50)]"
                                        aria-label={t('common.close')}
                                      >
                                        <X className="w-3 h-3 text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)]" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setNotes(svc.key, '')}
                                      className="text-[10px] font-medium hover:text-[var(--hm-brand-500)]"
                                      style={{ color: 'var(--hm-fg-muted)' }}
                                    >
                                      + {t('register.addNote')}
                                    </button>
                                  )}

                                  {/* Total line + market warnings */}
                                  <div className="flex items-center justify-between">
                                    {budget > 0 && (selection?.quantity ?? 1) > 1 ? (
                                      <span className="text-[11px] font-bold" style={{ color: 'var(--hm-brand-500)' }}>
                                        = {budget * (selection?.quantity ?? 1)}₾ {t('common.total').toLowerCase()}
                                      </span>
                                    ) : <span />}
                                    <div className="flex gap-1.5">
                                      {aboveMarket && (
                                        <span className="text-[10px] font-medium text-[var(--hm-warning-500)] bg-[var(--hm-warning-50)]/30 px-1.5 py-0.5 rounded-full">
                                          {t('job.aboveMarket')}
                                        </span>
                                      )}
                                      {belowMarket && (
                                        <span className="text-[10px] font-medium text-[var(--hm-warning-500)] bg-[var(--hm-warning-50)]/30 px-1.5 py-0.5 rounded-full">
                                          {t('job.belowMarket')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
        );
      })()}

      {/* Summary — neutral footer with a vermillion check pill so the count is visible */}
      {selectedServices.length > 0 && (
        <div
          className="rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap"
          style={{
            border: '1px solid var(--hm-border-subtle)',
            background: 'var(--hm-bg-elevated)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full text-white"
              style={{ background: 'var(--hm-brand-500)' }}
            >
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
            </span>
            <span className="text-sm text-[var(--hm-fg-secondary)]">
              <span className="font-semibold text-[var(--hm-fg-primary)]">{selectedServices.length}</span>{' '}
              {t('job.servicesSelected')}
            </span>
          </div>
          {totalBudget > 0 && (
            <span className="text-sm font-semibold" style={{ color: 'var(--hm-brand-500)' }}>
              {t('job.totalBudget')}: {totalBudget}₾
            </span>
          )}
        </div>
      )}
    </div>
  );
}
