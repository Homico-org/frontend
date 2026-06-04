'use client';

import CategoryIcon from '@/components/categories/CategoryIcon';
import { useCategories } from '@/contexts/CategoriesContext';
import type { CatalogServiceItem, Subcategory } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAiServiceSearch } from '@/hooks/useAiServiceSearch';
import { expandSearchQuery } from '@/data/searchSynonyms';
import { useCountry } from '@/hooks/useCountry';
import { currencySymbol } from '@/utils/currency';
import AiSearchBar from '@/components/common/AiSearchBar';
import { Check, MessageCircle, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface JobServiceSelection {
  serviceKey: string;
  // Stable parent-category key (e.g. "plumbing", "electrical"). Added in
  // 2026-05 when post-job became multi-category so we can group selections
  // and derive the job's primary category at submit time without
  // re-walking the catalog tree.
  categoryKey: string;
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
  const country = useCountry();
  const sym = currencySymbol({ country });
  const [searchQuery, setSearchQuery] = useState('');
  const { aiResults, aiLoading, aiAttempted, search: aiSearch, clear: aiClear } = useAiServiceSearch();

  // Tab strip auto-scroll. When the selected category changes - either
  // by user click (likely already in view) or by AI search resolving
  // to a category whose tab is off-screen (e.g. user types "gipso" and
  // the "Contractors" tab is far right) - scroll the active tab into
  // the visible area of the strip. `inline: 'center'` centers the
  // active pill so the user sees neighbouring tabs on both sides; the
  // outer container is `position: relative` so the scroll stays inside
  // the strip and doesn't yank the whole page.
  const tabStripRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const strip = tabStripRef.current;
    if (!strip) return;
    const targetKey = selectedCategory || '__all__';
    const active = strip.querySelector<HTMLElement>(
      `[data-tab-key="${targetKey}"]`,
    );
    if (active) {
      active.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedCategory]);

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

  // Local text search fallback. Matches service name (en/ka), service
  // tags, subcategory name, subcategory keywords, AND a frontend
  // synonym expansion (data/searchSynonyms.ts). Synonyms cover the
  // colloquial / transliterated terms users actually type that don't
  // appear in the canonical catalog text - e.g. "gipso" expands to
  // "drywall" + "გიფს" + "гипсокарт" so it matches "Plasterer &
  // drywaller" / "გიფსოკარტონი" / "Гипсокартон" without needing the
  // catalog seed to carry every spelling variant. 1-char gate.
  const localSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const tokens = expandSearchQuery(searchQuery);
    if (tokens.length === 0) return null;
    const results: { svc: CatalogServiceItem; sub: Subcategory; catKey: string }[] = [];
    for (const cat of categories) {
      for (const sub of cat.subcategories) {
        const subFields = [
          sub.name.toLowerCase(),
          sub.nameKa.toLowerCase(),
          ...((sub.keywords ?? []) as string[]).map((k) => k.toLowerCase()),
        ];
        const subHit = tokens.some((t) => subFields.some((f) => f.includes(t)));
        for (const svc of sub.services ?? []) {
          const svcFields = [
            svc.name.toLowerCase(),
            svc.nameKa.toLowerCase(),
            ...((svc.tags ?? []) as string[]).map((tg) => tg.toLowerCase()),
          ];
          const svcHit = tokens.some((t) => svcFields.some((f) => f.includes(t)));
          if (subHit || svcHit) {
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
    // Multi-category mode: services from different categories coexist on
    // the same job. Toggling from search just opens that category in the
    // drill-down view so the user can see what they just added in
    // context, without clearing any prior selections.
    if (catKey !== selectedCategory) {
      onCategoryChange(catKey);
    }
    handleServiceToggle(svcKey, subKey, catKey);
    setSearchQuery('');
    aiClear();
  }

  const handleServiceToggle = (serviceKey: string, subcatKey: string, categoryKeyOverride?: string) => {
    // categoryKeyOverride lets search results jump straight to a service
    // in a category the user isn't currently viewing. The drill-down view
    // always passes `selectedCategory` (matches its own filtering). The
    // "All services" view callers MUST pass `cat.key` from their render
    // closure because selectedCategory is '' there.
    let catKey = categoryKeyOverride ?? selectedCategory;
    // Belt-and-suspenders: if we still don't know which category owns
    // this service (a future caller forgot to pass it), scan to find it.
    // Cheap - categories are O(10), subcategories O(10) each.
    if (!catKey) {
      const owner = categories.find((c) =>
        c.subcategories?.some(
          (s) =>
            s.key === subcatKey &&
            s.services?.some((svc) => svc.key === serviceKey),
        ),
      );
      if (owner) catKey = owner.key;
    }
    const cat = categories.find(c => c.key === catKey);
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
          categoryKey: catKey,
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
    // Allow the field to be empty (quantity: 0) during typing so the user
    // can backspace the current digit and type a new one. The previous
    // version snapped to 1 on every keystroke, which made deleting the
    // "1" impossible - React immediately re-set the value to 1 so the
    // user could never type a replacement digit.
    //
    // We accept 0 as a temporary "empty input" state, the line-total
    // calculations already fall back to 1 via `(s.quantity || 1)`, and
    // `handleQuantityBlur` below snaps to >= 1 when the user leaves the
    // field so we never save a 0-qty service.
    const num = parseInt(value);
    const next = isNaN(num) ? 0 : Math.max(0, num);
    onServicesChange(
      selectedServices.map(s =>
        s.serviceKey === serviceKey ? { ...s, quantity: next } : s
      )
    );
  };

  const handleQuantityBlur = (serviceKey: string) => {
    onServicesChange(
      selectedServices.map(s =>
        s.serviceKey === serviceKey && (!s.quantity || s.quantity < 1)
          ? { ...s, quantity: 1 }
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
    // Switching modes is just a flag flip - never auto-fill anything.
    // Earlier versions seeded budgetMin/Max from the catalog's market
    // range and copied the midpoint into `budget`, which made values
    // appear out of nowhere when the user clicked Range and then again
    // when they switched back to Fixed. The user reported this as
    // confusing ("prices set automatically"), so we now clear the
    // range fields on every toggle and leave the user's own `budget`
    // entry untouched. If they had typed a fixed price, it persists
    // across switches; if they hadn't, both modes start empty.
    onServicesChange(
      selectedServices.map(s =>
        s.serviceKey === serviceKey
          ? { ...s, useRange: !s.useRange, budgetMin: undefined, budgetMax: undefined }
          : s,
      ),
    );
  };

  const setNotes = (serviceKey: string, value: string | undefined) => {
    onServicesChange(
      selectedServices.map(s =>
        s.serviceKey === serviceKey ? { ...s, notes: value } : s
      )
    );
  };

  const totalBudget = selectedServices.reduce((sum, s) => sum + s.budget * (s.quantity || 1), 0);

  // "Open to offers" semantics differ per pricing mode:
  //   - fixed: budget must be 0 / unset
  //   - range: both budgetMin and budgetMax must be 0 / unset
  // Using just `budget === 0` would mis-flag a service that's in range
  // mode with empty inputs but a stale `budget` left over from a prior
  // fixed-mode entry the user typed before toggling.
  const isServiceOpenToOffers = (s: JobServiceSelection): boolean => {
    if (s.useRange) {
      return (!s.budgetMin || s.budgetMin === 0) && (!s.budgetMax || s.budgetMax === 0);
    }
    return !s.budget || s.budget === 0;
  };

  // Group current selections by category so we can render a "you have
  // services in these categories" chip row above the grid. Sorted by
  // first-appearance so chips stay stable across toggles.
  const selectionsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of selectedServices) {
      map.set(s.categoryKey, (map.get(s.categoryKey) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([key, count]) => ({
      key,
      count,
      data: categories.find(c => c.key === key),
    }));
  }, [selectedServices, categories]);

  return (
    <div className="space-y-4">
      {/* Unified AI search - promoted to the top of the picker with a
          bigger placeholder and a hint that it searches across every
          category, so users with the "I can't find X" problem land on
          the search first instead of scanning the grid. */}
      <div className="space-y-1.5">
        <AiSearchBar
          value={searchQuery}
          onChange={(v) => handleSearchChange(v)}
          aiLoading={aiLoading}
          aiResultsCount={aiResults?.length ?? 0}
          aiAttempted={aiAttempted}
          hasLocalResults={(localSearchResults?.length ?? 0) > 0}
          placeholder={t('browse.searchServices')}
        />
        {!searchQuery && (
          <p className="text-[11px] text-[var(--hm-fg-muted)] pl-1">
            {t('job.searchAcrossCategoriesHint')}
          </p>
        )}
      </div>

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
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isChecked ? 'bg-[var(--hm-brand-500)] border-[var(--hm-brand-500)]' : 'border-[var(--hm-border-strong)]'}`}>
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
                      ~{svc.basePrice}{sym}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category tab strip. Replaces the old category-grid + drill-in
          two-step discovery. "All" is the default tab and shows every
          category's services in one scroll; the per-category tabs scope
          the list. Picked-count badges per tab carry the function that
          the now-removed "Your selections:" chip row used to. */}
      {!searchQuery && (
        // Note: `snap-x` was here previously - removed because on touch
        // devices the snap engine occasionally swallowed taps on the
        // pills (it interpreted the press as a swipe-to-snap intent).
        // Plain overflow-x-auto keeps the horizontal scroll without
        // that side-effect. Also bumped py to 2 for a slightly larger
        // tap target (44x44 is the iOS minimum recommendation).
        <div ref={tabStripRef} className="-mx-3 sm:mx-0 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 px-3 sm:px-0 min-w-min">
            {(() => {
              const isAll = !selectedCategory;
              return (
                <button
                  type="button"
                  data-tab-key="__all__"
                  onClick={() => onCategoryChange('')}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold transition-all shrink-0 whitespace-nowrap border touch-manipulation ${
                    isAll
                      ? 'bg-[var(--hm-brand-500)] text-white border-[var(--hm-brand-500)]'
                      : 'bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-secondary)] border-[var(--hm-border-subtle)] hover:border-[var(--hm-border-strong)]'
                  }`}
                >
                  {t('job.allServices')}
                  {selectedServices.length > 0 && (
                    <span
                      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white ${
                        isAll ? 'bg-white/25' : 'bg-[var(--hm-brand-500)]'
                      }`}
                    >
                      {selectedServices.length}
                    </span>
                  )}
                </button>
              );
            })()}
            {categories.filter(c => c.isActive).map(cat => {
              const accent = cat.color || 'var(--hm-brand-500)';
              const isActive = selectedCategory === cat.key;
              const pickedCount = selectionsByCategory.find(s => s.key === cat.key)?.count ?? 0;
              return (
                <button
                  key={cat.key}
                  type="button"
                  data-tab-key={cat.key}
                  onClick={() => onCategoryChange(cat.key)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold transition-all shrink-0 whitespace-nowrap border touch-manipulation"
                  style={{
                    background: isActive ? accent : `${accent}14`,
                    color: isActive ? '#fff' : accent,
                    borderColor: isActive ? accent : `${accent}40`,
                  }}
                >
                  <span className="inline-flex w-3.5 h-3.5">
                    <CategoryIcon type={cat.key} className="w-full h-full" />
                  </span>
                  {pick({ en: cat.name, ka: cat.nameKa })}
                  {pickedCount > 0 && (
                    <span
                      className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white"
                      style={{ background: isActive ? 'rgba(255,255,255,0.25)' : accent }}
                    >
                      {pickedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Always-visible services list, scoped to the active tab. The
          "All" tab shows every category with a small category header
          per group; a specific tab shows only that category's
          subcategories (no header needed, the tab already labels it).
          This removes the previous drill-in step that hid services
          like "Gypsum wall maker" two clicks deep. */}
      {!searchQuery && (() => {
        const categoriesToShow = selectedCategory
          ? categories.filter(c => c.key === selectedCategory)
          : categories.filter(c => c.isActive);
        const showCategoryHeaders = !selectedCategory;
        return (
        <div className="space-y-4">
          {categoriesToShow.map(cat => {
            const accent = cat.color || 'var(--hm-brand-500)';
            const subcats = cat.subcategories.filter(sub => sub.isActive && sub.services && sub.services.length > 0);
            if (subcats.length === 0) return null;
            return (
              <div key={cat.key} className="space-y-3">
                {showCategoryHeaders && (
                  <div className="flex items-center gap-2.5 pt-1">
                    <span
                      className="flex items-center justify-center rounded-lg w-8 h-8"
                      style={{ background: `${accent}14`, color: accent }}
                    >
                      <CategoryIcon type={cat.key} className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-semibold text-[var(--hm-fg-primary)]">
                      {pick({ en: cat.name, ka: cat.nameKa })}
                    </span>
                  </div>
                )}
                {subcats.map(subcat => (
              <div
                key={subcat.key}
                className="rounded-2xl border bg-[var(--hm-bg-elevated)] overflow-hidden"
                style={{ borderColor: 'var(--hm-border-subtle)' }}
              >
                {/* Subcategory header - clean: thin color accent line on the left, neutral bg */}
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
                    // Admin marked this service as quote-only - hide price inputs
                    // and surface a "Request a quote" indicator instead.
                    const isQuoteOnly = svc.pricingModel === 'quote';

                    return (
                      <div
                        key={svc.key}
                        className="px-4 py-3.5"
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox - bumped to 22×22 with brand-tinted hover ring and a check icon that pops in.
                              The 3rd arg `cat.key` is REQUIRED on the "All
                              services" view (selectedCategory === ''). Without it,
                              handleServiceToggle's catKey lookup returns
                              undefined and the click is a silent no-op. */}
                          <button
                            type="button"
                            onClick={() => handleServiceToggle(svc.key, subcat.key, cat.key)}
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
                              {/* Quote-only badge - admin opted out of upfront pricing */}
                              {isQuoteOnly && (
                                <span className="text-[10px] font-semibold text-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {t('job.quoteRequired')}
                                </span>
                              )}
                              {/* Market price hint - suppressed for quote-only services */}
                              {!isQuoteOnly && marketMax > 0 && (
                                <span className="text-[11px] text-[var(--hm-fg-muted)]">
                                  {t('job.marketPrice')}: {marketMin === marketMax ? `${marketMin}${sym}` : `${marketMin}-${marketMax}${sym}`}
                                </span>
                              )}
                            </div>

                            {/* Unit picker + Budget input - only when checked AND not quote-only */}
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
                                {/* Unit selector - pill buttons for multi-unit services */}
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
                                            <span className={`ml-1 ${isActive ? 'opacity-80' : 'opacity-50'}`}>~{uo.defaultPrice}{sym}</span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Quantity + Per-unit price.
                                    On mobile the Qty input + × +
                                    Price cluster (label + Fixed/Range
                                    toggle + 1-2 number inputs) is too
                                    wide for the card; previously the
                                    row had `flex items-center gap-3`
                                    with no wrap and the Price cluster
                                    pushed off the right edge of the
                                    screen. Switched to a vertical
                                    stack on mobile (each row gets full
                                    card width to wrap its own
                                    contents), inline on sm+. The `×`
                                    separator only renders on sm+
                                    because it has no meaning when the
                                    two clusters live on separate rows. */}
                                <div
                                  className="rounded-lg px-3 py-2.5 space-y-2"
                                  style={{ border: '1px solid var(--hm-border-subtle)' }}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                    {/* Quantity */}
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-medium" style={{ color: 'var(--hm-fg-muted)' }}>
                                        {t('common.qty')}
                                      </span>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={selection?.quantity ? selection.quantity : ''}
                                        onChange={e => handleQuantityChange(svc.key, e.target.value.replace(/[^0-9]/g, ''))}
                                        onBlur={() => handleQuantityBlur(svc.key)}
                                        onFocus={e => e.target.select()}
                                        className="w-12 px-1.5 py-1 text-[13px] font-semibold text-center rounded-md border outline-none transition-all focus:border-[var(--hm-brand-500)]"
                                        style={{
                                          borderColor: 'var(--hm-border-subtle)',
                                          backgroundColor: 'var(--hm-bg-elevated)',
                                          color: 'var(--hm-fg-primary)',
                                        }}
                                      />
                                    </div>

                                    <span className="hidden sm:inline text-[11px]" style={{ color: 'var(--hm-fg-muted)' }}>×</span>

                                    {/* Per-unit price (single OR min-max range).
                                        The mode toggle is rendered as an
                                        explicit Fixed/Range segmented
                                        control next to the price label so
                                        the user sees both options up front
                                        instead of guessing what the
                                        previous ↔ icon meant. */}
                                    <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                                      <span className="text-[11px] font-medium shrink-0" style={{ color: 'var(--hm-fg-muted)' }}>
                                        {t('common.price')}/{unitLabel}
                                      </span>
                                      <div
                                        className="inline-flex shrink-0 overflow-hidden rounded-full"
                                        style={{ border: '1px solid var(--hm-border-subtle)' }}
                                        role="tablist"
                                        aria-label={t('register.useRangePrice')}
                                      >
                                        <button
                                          type="button"
                                          role="tab"
                                          aria-selected={!selection?.useRange}
                                          onClick={() => { if (selection?.useRange) toggleRange(svc.key); }}
                                          className="px-3 py-1.5 text-[11px] font-semibold transition-colors min-h-[32px]"
                                          style={{
                                            background: !selection?.useRange ? 'var(--hm-brand-500)' : 'transparent',
                                            color: !selection?.useRange ? '#fff' : 'var(--hm-fg-muted)',
                                          }}
                                        >
                                          {t('job.priceModeFixed')}
                                        </button>
                                        <button
                                          type="button"
                                          role="tab"
                                          aria-selected={!!selection?.useRange}
                                          onClick={() => { if (!selection?.useRange) toggleRange(svc.key); }}
                                          className="px-3 py-1.5 text-[11px] font-semibold transition-colors min-h-[32px]"
                                          style={{
                                            background: selection?.useRange ? 'var(--hm-brand-500)' : 'transparent',
                                            color: selection?.useRange ? '#fff' : 'var(--hm-fg-muted)',
                                          }}
                                        >
                                          {t('job.priceModeRange')}
                                        </button>
                                      </div>
                                      {selection?.useRange ? (
                                        <div className="flex items-center gap-1 flex-1">
                                          <div className="relative flex-1 max-w-[64px]">
                                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium" style={{ color: 'var(--hm-fg-muted)' }}>{sym}</span>
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
                                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium" style={{ color: 'var(--hm-fg-muted)' }}>{sym}</span>
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
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-medium" style={{ color: 'var(--hm-fg-muted)' }}>{sym}</span>
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

                                  {/* Total line + market warnings + open-to-offers hint.
                                      When the customer hasn't entered any
                                      price (mode-aware: empty fixed, or
                                      empty range with no min/max) we
                                      surface "Open to offers" so the row
                                      doesn't read as a missing field. */}
                                  {(() => {
                                    const openToOffers = selection ? isServiceOpenToOffers(selection) : true;
                                    return (
                                      <>
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          {budget > 0 && (selection?.quantity ?? 1) > 1 ? (
                                            <span className="text-[11px] font-bold" style={{ color: 'var(--hm-brand-500)' }}>
                                              = {budget * (selection?.quantity ?? 1)}{sym} {t('common.total').toLowerCase()}
                                            </span>
                                          ) : openToOffers ? (
                                            <span
                                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                              style={{
                                                background: 'var(--hm-bg-tertiary)',
                                                color: 'var(--hm-fg-secondary)',
                                                border: '1px dashed var(--hm-border-subtle)',
                                              }}
                                              title={t('job.openToOffersHint')}
                                            >
                                              <MessageCircle className="w-2.5 h-2.5" />
                                              {t('job.openToOffers')}
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
                                        {openToOffers && (
                                          <p className="text-[10px] leading-snug" style={{ color: 'var(--hm-fg-muted)' }}>
                                            {t('job.openToOffersHint')}
                                          </p>
                                        )}
                                      </>
                                    );
                                  })()}
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
          })}
        </div>
        );
      })()}

      {/* Summary - neutral footer with a vermillion check pill so the count is visible */}
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
          {(() => {
            // Mixed-state summary: when some services have prices and
            // others are open to offers, the bare "Total: N₾" reads as
            // if it covers everything. Append "+ X open to offers" so
            // the customer sees the partial nature of the total.
            const quoteCount = selectedServices.filter(isServiceOpenToOffers).length;
            if (totalBudget > 0 && quoteCount > 0) {
              return (
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-sm font-semibold" style={{ color: 'var(--hm-brand-500)' }}>
                    {t('job.totalBudget')}: {totalBudget}{sym}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--hm-fg-muted)' }}>
                    {t('job.openToOffersCount', { count: quoteCount })}
                  </span>
                </div>
              );
            }
            if (totalBudget > 0) {
              return (
                <span className="text-sm font-semibold" style={{ color: 'var(--hm-brand-500)' }}>
                  {t('job.totalBudget')}: {totalBudget}{sym}
                </span>
              );
            }
            if (quoteCount > 0) {
              return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                  style={{
                    background: 'var(--hm-bg-tertiary)',
                    color: 'var(--hm-fg-secondary)',
                    border: '1px dashed var(--hm-border-subtle)',
                  }}
                >
                  <MessageCircle className="w-3 h-3" />
                  {t('job.openToOffers')}
                </span>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
}
