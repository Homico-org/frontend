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
  unitName: string;
  unitNameKa: string;
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
      onServicesChange([
        ...selectedServices,
        {
          serviceKey: svc.key,
          name: svc.name,
          nameKa: svc.nameKa,
          unit: svc.unit,
          unitName: svc.unitName,
          unitNameKa: svc.unitNameKa,
          budget: 0,
          marketMin: svc.basePrice,
          marketMax: svc.maxPrice ?? svc.basePrice,
        },
      ]);
    }
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
  const totalBudget = selectedServices.reduce((sum, s) => sum + s.budget, 0);

  return (
    <div className="space-y-4">
      {/* AI Search */}
      <div className="relative">
        {aiLoading ? (
          <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-pulse text-[#C4735B]" />
        ) : (
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        )}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('browse.searchServices')}
          className="w-full pl-10 pr-9 py-3 rounded-xl text-sm border outline-none transition-colors"
          style={{
            borderColor: 'var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)',
          }}
        />
        {searchQuery && (
          <button type="button" onClick={() => { setSearchQuery(''); aiClear(); }} className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && searchResults && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-bg-elevated)' }}>
          {aiResults && (
            <div className="flex items-center gap-1.5 px-3.5 py-2 border-b" style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'rgba(196,115,91,0.04)' }}>
              <Sparkles className="w-3.5 h-3.5 text-[#C4735B]" />
              <span className="text-xs font-semibold text-[#C4735B]">{t('browse.aiSuggested')}</span>
            </div>
          )}
          <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
            {searchResults.map(({ svc, sub, catKey }) => {
              const isChecked = selectedServices.some(s => s.serviceKey === svc.key);
              return (
                <button
                  key={svc.key}
                  type="button"
                  onClick={() => handleSearchServiceSelect(svc.key, sub.key, catKey)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isChecked ? 'bg-[#C4735B] border-[#C4735B]' : 'border-neutral-300'}`}>
                    {isChecked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {pick(svc.name, svc.nameKa)}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                      {pick(sub.name, sub.nameKa)}
                    </span>
                  </div>
                  {svc.basePrice > 0 && (
                    <span className="text-[11px] font-medium shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
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
          <Sparkles className="w-4 h-4 animate-pulse text-[#C4735B]" />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t('browse.searchingAI')}</span>
        </div>
      )}

      {/* Category Grid — hidden when search is active */}
      {!searchQuery && <div className="grid grid-cols-2 gap-2">
        {categories.filter(c => c.isActive).map(cat => {
          const isSelected = cat.key === selectedCategory;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => handleCategoryClick(cat.key)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-[#C4735B] bg-[#C4735B]/8 text-[#C4735B]'
                  : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-[#C4735B]/50 hover:bg-[#C4735B]/4'
              }`}
              style={isSelected ? { backgroundColor: 'rgba(196,115,91,0.08)' } : undefined}
            >
              <span
                className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg ${
                  isSelected
                    ? 'text-[#C4735B]'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                <CategoryIcon type={cat.key} className="w-5 h-5" />
              </span>
              <span className="text-xs font-medium leading-tight line-clamp-2">
                {locale === 'ka' ? cat.nameKa : cat.name}
              </span>
            </button>
          );
        })}
      </div>}

      {/* Category switch confirmation */}
      {!searchQuery && pendingCategory && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 flex flex-col gap-3">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {t('job.switchCategoryConfirm')}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmCategorySwitch}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              {t('common.confirm')}
            </button>
            <button
              type="button"
              onClick={cancelCategorySwitch}
              className="flex-1 py-2 px-4 rounded-lg text-sm font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Services area */}
      {!searchQuery && !selectedCategory && (
        <p className="text-sm text-neutral-400 text-center py-4">
          {t('job.selectCategoryFirst')}
        </p>
      )}

      {!searchQuery && selectedCategoryData && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            {t('job.selectServices')}
          </p>

          {selectedCategoryData.subcategories
            .filter(sub => sub.isActive && sub.services && sub.services.length > 0)
            .map(subcat => (
              <div key={subcat.key} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
                {/* Subcategory header */}
                <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    {locale === 'ka' ? subcat.nameKa : subcat.name}
                  </span>
                </div>

                {/* Services list */}
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {(subcat.services ?? []).map(svc => {
                    const isChecked = selectedServices.some(s => s.serviceKey === svc.key);
                    const selection = selectedServices.find(s => s.serviceKey === svc.key);
                    const marketMin = svc.basePrice;
                    const marketMax = svc.maxPrice ?? svc.basePrice;
                    const budget = selection?.budget ?? 0;
                    const aboveMarket = budget > 0 && budget > marketMax;
                    const belowMarket = budget > 0 && budget < marketMin;
                    const unitLabel = locale === 'ka' ? svc.unitNameKa : svc.unitName;

                    return (
                      <div key={svc.key} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleServiceToggle(svc.key, subcat.key)}
                            className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-[#C4735B] border-[#C4735B]'
                                : 'border-neutral-300 dark:border-neutral-600 hover:border-[#C4735B]'
                            }`}
                            aria-checked={isChecked}
                            role="checkbox"
                          >
                            {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </button>

                          {/* Service info + budget input */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                                {locale === 'ka' ? svc.nameKa : svc.name}
                              </span>
                              {unitLabel && (
                                <span className="text-[11px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                  {unitLabel}
                                </span>
                              )}
                              {/* Market price hint */}
                              {marketMax > 0 && (
                                <span className="text-[11px] text-neutral-400">
                                  {t('job.marketPrice')}: {marketMin}–{marketMax}₾
                                </span>
                              )}
                            </div>

                            {/* Budget input — only show when checked */}
                            {isChecked && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="relative flex-1 max-w-[160px]">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500">₾</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={budget === 0 ? '' : budget}
                                    onChange={e => handleBudgetChange(svc.key, e.target.value)}
                                    placeholder={`${marketMin}–${marketMax}`}
                                    className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B] focus:ring-2 focus:ring-[#C4735B]/10 transition-all"
                                    aria-label={t('job.yourBudget')}
                                  />
                                </div>
                                {aboveMarket && (
                                  <span className="text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                                    {t('job.aboveMarket')}
                                  </span>
                                )}
                                {belowMarket && (
                                  <span className="text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                                    {t('job.belowMarket')}
                                  </span>
                                )}
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
        <div className="rounded-xl border border-[#C4735B]/30 bg-[#C4735B]/5 p-4 flex items-center justify-between">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{selectedServices.length}</span>{' '}
            {t('job.servicesSelected')}
          </span>
          {totalBudget > 0 && (
            <span className="text-sm font-semibold text-[#C4735B]">
              {t('job.totalBudget')}: {totalBudget}₾
            </span>
          )}
        </div>
      )}
    </div>
  );
}
