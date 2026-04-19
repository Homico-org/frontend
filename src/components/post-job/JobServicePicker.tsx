'use client';

import CategoryIcon from '@/components/categories/CategoryIcon';
import { useCategories } from '@/contexts/CategoriesContext';
import type { CatalogServiceItem, Subcategory } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAiServiceSearch } from '@/hooks/useAiServiceSearch';
import { Check, Search, Sparkles, X } from 'lucide-react';
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
  const { t, locale } = useLanguage();
  const { categories } = useCategories();
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { aiResults, aiLoading, search: aiSearch, clear: aiClear } = useAiServiceSearch();

  const pick = (en: string, ka: string) => locale === 'ka' ? ka : en;

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
    if (pendingCategory) {
      onCategoryChange(pendingCategory);
      onServicesChange([]);
      setPendingCategory(null);
    }
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
          unitName: primaryUnit ? (locale === 'ka' ? primaryUnit.label.ka : primaryUnit.label.en) : svc.unitName,
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

  const selectedCategoryData = categories.find(c => c.key === selectedCategory);
  const totalBudget = selectedServices.reduce((sum, s) => sum + s.budget * (s.quantity || 1), 0);

  return (
    <div className="space-y-4">
      {/* AI Search */}
      <div className="relative">
        {aiLoading ? (
          <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-pulse text-[var(--hm-brand-500)]" />
        ) : (
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hm-fg-muted)]" />
        )}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('browse.searchServices')}
          className="w-full pl-10 pr-9 py-3 rounded-xl text-sm border outline-none transition-colors"
          style={{
            borderColor: 'var(--hm-border-subtle)',
            backgroundColor: 'var(--hm-bg-elevated)',
            color: 'var(--hm-fg-primary)',
          }}
        />
        {searchQuery && (
          <button type="button" onClick={() => { setSearchQuery(''); aiClear(); }} className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-[var(--hm-fg-muted)]" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && searchResults && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--hm-border-subtle)', backgroundColor: 'var(--hm-bg-elevated)' }}>
          {aiResults && (
            <div className="flex items-center gap-1.5 px-3.5 py-2 border-b" style={{ borderColor: 'var(--hm-border-subtle)', backgroundColor: 'rgba(239,78,36,0.04)' }}>
              <Sparkles className="w-3.5 h-3.5 text-[var(--hm-brand-500)]" />
              <span className="text-xs font-semibold text-[var(--hm-brand-500)]">{t('browse.aiSuggested')}</span>
            </div>
          )}
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
                      {pick(svc.name, svc.nameKa)}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--hm-fg-muted)' }}>
                      {pick(sub.name, sub.nameKa)}
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

      {/* Search loading */}
      {searchQuery && !searchResults && aiLoading && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Sparkles className="w-4 h-4 animate-pulse text-[var(--hm-brand-500)]" />
          <span className="text-sm" style={{ color: 'var(--hm-fg-secondary)' }}>{t('browse.searchingAI')}</span>
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
            {locale === 'ka' ? selectedCategoryData.nameKa : selectedCategoryData.name}
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

      {/* Category Grid — only shown when no category is selected */}
      {!searchQuery && !selectedCategory && <div className="grid grid-cols-2 gap-2">
        {categories.filter(c => c.isActive).map(cat => (
          <button
            key={cat.key}
            type="button"
            onClick={() => handleCategoryClick(cat.key)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-brand-500)]/50 hover:bg-[var(--hm-brand-500)]/4"
          >
            <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-[var(--hm-fg-muted)]">
              <CategoryIcon type={cat.key} className="w-5 h-5" />
            </span>
            <span className="text-xs font-medium leading-tight line-clamp-2">
              {locale === 'ka' ? cat.nameKa : cat.name}
            </span>
          </button>
        ))}
      </div>}

      {/* Category switch confirmation */}
      {!searchQuery && pendingCategory && (
        <div className="rounded-xl border border-amber-200 bg-[var(--hm-warning-50)] p-4 flex flex-col gap-3">
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

      {/* Services area */}
      {!searchQuery && !selectedCategory && (
        <p className="text-sm text-[var(--hm-fg-muted)] text-center py-4">
          {t('job.selectCategoryFirst')}
        </p>
      )}

      {!searchQuery && selectedCategoryData && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-[var(--hm-fg-muted)] uppercase tracking-wider">
            {t('job.selectServices')}
          </p>

          {selectedCategoryData.subcategories
            .filter(sub => sub.isActive && sub.services && sub.services.length > 0)
            .map(subcat => (
              <div key={subcat.key} className="rounded-xl border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] overflow-hidden">
                {/* Subcategory header */}
                <div className="px-4 py-2.5 bg-[var(--hm-bg-tertiary)]/60 border-b border-[var(--hm-border)]">
                  <span className="text-xs font-semibold text-[var(--hm-fg-secondary)]">
                    {locale === 'ka' ? subcat.nameKa : subcat.name}
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
                      ? (locale === 'ka' ? selection.unitNameKa : selection.unitName)
                      : selectedUnit
                        ? (locale === 'ka' ? selectedUnit.label.ka : selectedUnit.label.en)
                        : (locale === 'ka' ? svc.unitNameKa : svc.unitName);

                    return (
                      <div key={svc.key} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleServiceToggle(svc.key, subcat.key)}
                            className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-[var(--hm-brand-500)] border-[var(--hm-brand-500)]'
                                : 'border-[var(--hm-border-strong)] hover:border-[var(--hm-brand-500)]'
                            }`}
                            aria-checked={isChecked}
                            role="checkbox"
                          >
                            {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </button>

                          {/* Service info + unit picker + budget input */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-medium text-[var(--hm-fg-primary)]">
                                {locale === 'ka' ? svc.nameKa : svc.name}
                              </span>
                              {!isChecked && unitLabel && (
                                <span className="text-[11px] text-[var(--hm-fg-muted)] bg-[var(--hm-bg-tertiary)] px-1.5 py-0.5 rounded">
                                  {unitLabel}
                                </span>
                              )}
                              {/* Market price hint */}
                              {marketMax > 0 && (
                                <span className="text-[11px] text-[var(--hm-fg-muted)]">
                                  {t('job.marketPrice')}: {marketMin === marketMax ? `${marketMin}₾` : `${marketMin}–${marketMax}₾`}
                                </span>
                              )}
                            </div>

                            {/* Unit picker + Budget input — only when checked */}
                            {isChecked && (
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
                                                    unitName: locale === 'ka' ? uo.label.ka : uo.label.en,
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
                                          {locale === 'ka' ? uo.label.ka : uo.label.en}
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
                                  style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}
                                >
                                  <div className="flex items-center gap-3">
                                    {/* Quantity */}
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-medium" style={{ color: 'var(--hm-fg-muted)' }}>
                                        {locale === 'ka' ? 'რაოდენობა' : 'Qty'}
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

                                    {/* Per-unit price */}
                                    <div className="flex items-center gap-1.5 flex-1">
                                      <span className="text-[11px] font-medium shrink-0" style={{ color: 'var(--hm-fg-muted)' }}>
                                        {locale === 'ka' ? 'ფასი' : 'Price'}/{unitLabel}
                                      </span>
                                      <div className="relative flex-1 max-w-[120px]">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-medium" style={{ color: 'var(--hm-fg-muted)' }}>₾</span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={budget === 0 ? '' : budget}
                                          onChange={e => handleBudgetChange(svc.key, e.target.value)}
                                          placeholder={`${marketMin}–${marketMax}`}
                                          className="w-full pl-5 pr-2 py-1 text-[13px] font-semibold rounded-md border outline-none transition-all focus:border-[var(--hm-brand-500)]"
                                          style={{
                                            borderColor: 'var(--hm-border-subtle)',
                                            backgroundColor: 'var(--hm-bg-elevated)',
                                            color: 'var(--hm-fg-primary)',
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Total line + market warnings */}
                                  <div className="flex items-center justify-between">
                                    {budget > 0 && (selection?.quantity ?? 1) > 1 ? (
                                      <span className="text-[11px] font-bold" style={{ color: 'var(--hm-brand-500)' }}>
                                        = {budget * (selection?.quantity ?? 1)}₾ {locale === 'ka' ? 'ჯამი' : 'total'}
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
      )}

      {/* Summary */}
      {selectedServices.length > 0 && (
        <div className="rounded-xl border border-[var(--hm-brand-500)]/30 bg-[var(--hm-brand-500)]/5 p-4 flex items-center justify-between">
          <span className="text-sm text-[var(--hm-fg-secondary)]">
            <span className="font-semibold text-[var(--hm-fg-primary)]">{selectedServices.length}</span>{' '}
            {t('job.servicesSelected')}
          </span>
          {totalBudget > 0 && (
            <span className="text-sm font-semibold text-[var(--hm-brand-500)]">
              {t('job.totalBudget')}: {totalBudget}₾
            </span>
          )}
        </div>
      )}
    </div>
  );
}
