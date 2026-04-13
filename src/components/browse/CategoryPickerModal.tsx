'use client';

import CategoryIcon from '@/components/categories/CategoryIcon';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/contexts/CategoriesContext';
import type { Category, CatalogServiceItem, Subcategory } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAiServiceSearch } from '@/hooks/useAiServiceSearch';
import { Search, Sparkles, X, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CategoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKeys: string[];
  onApply: (keys: string[]) => void;
  activeCategory?: string;
}

type TriState = 'none' | 'some' | 'all';

function getTriState(subKey: string, services: CatalogServiceItem[], draft: Set<string>): TriState {
  if (services.length === 0) return draft.has(subKey) ? 'all' : 'none';
  const selected = services.filter(s => draft.has(s.key)).length;
  if (selected === 0) return 'none';
  if (selected === services.length) return 'all';
  return 'some';
}

function TriCheckbox({ state, onChange }: { state: TriState; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = state === 'some';
      ref.current.checked = state === 'all';
    }
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      onChange={onChange}
      className="w-4 h-4 rounded cursor-pointer flex-shrink-0"
      style={{ accentColor: '#C4735B' }}
    />
  );
}

interface ServiceSearchResult {
  service: CatalogServiceItem;
  subcategory: Subcategory;
  category: Category;
}

function flattenSearch(categories: Category[], query: string): ServiceSearchResult[] {
  const q = query.toLowerCase();
  const results: ServiceSearchResult[] = [];
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      const services = sub.services ?? [];
      for (const svc of services) {
        if (svc.name.toLowerCase().includes(q) || svc.nameKa.toLowerCase().includes(q)) {
          results.push({ service: svc, subcategory: sub, category: cat });
        }
      }
    }
  }
  return results;
}

export default function CategoryPickerModal({
  isOpen,
  onClose,
  selectedKeys,
  onApply,
  activeCategory,
}: CategoryPickerModalProps) {
  const { t, locale } = useLanguage();
  const { categories } = useCategories();

  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [activeCatKey, setActiveCatKey] = useState<string>('');
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const { aiResults, aiLoading, search: aiSearch, clear: aiClear } = useAiServiceSearch();

  const pick = (en: string, ka: string) => (locale === 'ka' ? ka : en);

  useEffect(() => {
    if (isOpen) {
      setDraft(new Set(selectedKeys));
      const initial = activeCategory ?? categories[0]?.key ?? '';
      setActiveCatKey(initial);
      setExpandedSubs(new Set());
      setSearch('');
      aiClear();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchChange(value: string) {
    setSearch(value);
    aiSearch(value);
  }

  function toggleService(key: string) {
    setDraft(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSubcategory(sub: Subcategory) {
    const services = sub.services ?? [];
    if (services.length === 0) {
      toggleService(sub.key);
      return;
    }
    const state = getTriState(sub.key, services, draft);
    setDraft(prev => {
      const next = new Set(prev);
      if (state === 'all') {
        services.forEach(s => next.delete(s.key));
      } else {
        services.forEach(s => next.add(s.key));
      }
      return next;
    });
  }

  function toggleExpandSub(key: string) {
    setExpandedSubs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleApply() {
    onApply(Array.from(draft));
    onClose();
  }

  function handleClear() {
    setDraft(new Set());
  }

  const activeCount = draft.size;
  const activeCat = categories.find(c => c.key === activeCatKey);
  // Combine local text search with AI-matched results
  const searchResults = (() => {
    if (search.length < 1) return null;
    const localResults = flattenSearch(categories, search);

    // If AI returned matches, resolve them to ServiceSearchResult objects
    if (aiResults && aiResults.length > 0) {
      const aiResolved: ServiceSearchResult[] = [];
      const aiKeySet = new Set(aiResults.map(r => r.key));
      for (const cat of categories) {
        for (const sub of cat.subcategories) {
          // Check if subcategory itself was matched
          if (aiKeySet.has(sub.key)) {
            for (const svc of (sub.services ?? [])) {
              aiResolved.push({ service: svc, subcategory: sub, category: cat });
            }
          }
          // Check individual services
          for (const svc of (sub.services ?? [])) {
            if (aiKeySet.has(svc.key)) {
              aiResolved.push({ service: svc, subcategory: sub, category: cat });
            }
          }
        }
      }
      // Merge: AI results first, then local (deduplicated)
      const seen = new Set<string>();
      const merged: ServiceSearchResult[] = [];
      for (const r of [...aiResolved, ...localResults]) {
        if (!seen.has(r.service.key)) {
          seen.add(r.service.key);
          merged.push(r);
        }
      }
      return merged;
    }

    return localResults;
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" showCloseButton closeOnBackdrop>
      {/* Header */}
      <div
        className="px-5 pt-5 pb-3 border-b"
        style={{ borderColor: 'var(--color-border-subtle)' }}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {t('browse.selectCategory')}
        </h2>
      </div>

      {/* Search bar */}
      <div
        className="px-5 py-3 border-b"
        style={{ borderColor: 'var(--color-border-subtle)' }}
      >
        <div
          className="relative flex items-center rounded-lg border"
          style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-tertiary)' }}
        >
          {aiLoading ? (
            <Sparkles className="absolute left-3 w-4 h-4 animate-pulse" style={{ color: '#C4735B' }} />
          ) : (
            <Search className="absolute left-3 w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
          )}
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder={t('browse.searchServices')}
            className="w-full pl-9 pr-9 py-2 text-sm bg-transparent focus:outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); aiClear(); }}
              className="absolute right-2.5 p-0.5 rounded"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
            </button>
          )}
        </div>
      </div>

      <ModalBody className="p-0 overflow-hidden">
        {/* Search results mode */}
        {searchResults !== null ? (
          <div className="overflow-y-auto max-h-[50vh] px-5 py-3 space-y-4">
            {searchResults.length === 0 && !aiLoading ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                {t('browse.noResults')}
              </p>
            ) : searchResults.length === 0 && aiLoading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Sparkles className="w-4 h-4 animate-pulse text-[#C4735B]" />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('browse.searchingAI')}
                </p>
              </div>
            ) : (
              (() => {
                const grouped = new Map<string, ServiceSearchResult[]>();
                for (const r of searchResults) {
                  const key = r.subcategory.key;
                  if (!grouped.has(key)) grouped.set(key, []);
                  grouped.get(key)!.push(r);
                }

                const allKeys = searchResults.map(r => r.service.key);
                const allSelected = allKeys.length > 0 && allKeys.every(k => draft.has(k));

                return (
                  <>
                    {/* AI suggestion header */}
                    {aiResults && aiResults.length > 0 && (
                      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#C4735B]" />
                          <span className="text-xs font-semibold text-[#C4735B]">
                            {t('browse.aiSuggested')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDraft(prev => {
                              const next = new Set(prev);
                              if (allSelected) {
                                allKeys.forEach(k => next.delete(k));
                              } else {
                                allKeys.forEach(k => next.add(k));
                              }
                              return next;
                            });
                          }}
                          className="text-xs font-medium text-[#C4735B] hover:underline"
                        >
                          {allSelected ? t('browse.deselectAll') : t('browse.selectAll')}
                        </button>
                      </div>
                    )}

                    {Array.from(grouped.entries()).map(([subKey, results]) => {
                      const { subcategory, category } = results[0];
                      return (
                        <div key={subKey}>
                          <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                            {pick(category.name, category.nameKa)} › {pick(subcategory.name, subcategory.nameKa)}
                          </p>
                      <div className="space-y-1">
                        {results.map(({ service }) => (
                          <label key={service.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--color-bg-tertiary)]">
                            <input
                              type="checkbox"
                              checked={draft.has(service.key)}
                              onChange={() => toggleService(service.key)}
                              className="w-4 h-4 rounded flex-shrink-0"
                              style={{ accentColor: '#C4735B' }}
                            />
                            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                              {pick(service.name, service.nameKa)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                      );
                    })}
                  </>
                );
              })()
            )}
          </div>
        ) : (
          /* Two-panel layout — desktop */
          <div className="hidden sm:flex h-[50vh]">
            {/* Left panel: categories */}
            <div
              className="w-[200px] flex-shrink-0 border-r overflow-y-auto"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              {categories.map(cat => {
                const isActive = cat.key === activeCatKey;
                const catServices: string[] = cat.subcategories.flatMap(s => (s.services ?? []).map(sv => sv.key));
                const hasSelected = catServices.some(k => draft.has(k));
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCatKey(cat.key)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
                    style={
                      isActive
                        ? { background: 'rgba(196,115,91,0.10)', color: '#C4735B', fontWeight: 600 }
                        : { color: 'var(--color-text-secondary)' }
                    }
                  >
                    <CategoryIcon type={cat.icon || cat.key} className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate text-[13px]">{pick(cat.name, cat.nameKa)}</span>
                    {hasSelected && !isActive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: '#C4735B' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right panel: subcategories + services */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {activeCat?.subcategories.map(sub => {
                const services = sub.services ?? [];
                const triState = getTriState(sub.key, services, draft);
                const isExpanded = expandedSubs.has(sub.key) || services.some(s => draft.has(s.key));
                return (
                  <div key={sub.key}>
                    <div className="flex items-center gap-2 py-1.5">
                      <TriCheckbox state={triState} onChange={() => toggleSubcategory(sub)} />
                      <button
                        className="flex-1 flex items-center gap-1.5 text-left min-w-0"
                        onClick={() => services.length > 0 && toggleExpandSub(sub.key)}
                      >
                        <span
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {pick(sub.name, sub.nameKa)}
                        </span>
                        {services.length > 0 && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            style={{ color: 'var(--color-text-tertiary)' }}
                          />
                        )}
                      </button>
                    </div>
                    {isExpanded && services.length > 0 && (
                      <div className="ml-6 space-y-0.5 pb-1">
                        {services.map(svc => (
                          <label key={svc.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--color-bg-tertiary)]">
                            <input
                              type="checkbox"
                              checked={draft.has(svc.key)}
                              onChange={() => toggleService(svc.key)}
                              className="w-3.5 h-3.5 rounded flex-shrink-0"
                              style={{ accentColor: '#C4735B' }}
                            />
                            <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                              {pick(svc.name, svc.nameKa)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile single-column layout */}
        {searchResults === null && (
          <div className="sm:hidden overflow-y-auto max-h-[60vh]">
            {/* Category pills — horizontal scroll */}
            <div className="px-4 pt-3 pb-3">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {categories.map(cat => {
                  const isActive = cat.key === activeCatKey;
                  const catServices = cat.subcategories.flatMap(s => (s.services ?? []).map(sv => sv.key));
                  const hasSelected = catServices.some(k => draft.has(k));
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCatKey(cat.key)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium border transition-all shrink-0 whitespace-nowrap"
                      style={
                        isActive
                          ? { borderColor: '#C4735B', background: 'rgba(196,115,91,0.12)', color: '#C4735B' }
                          : { borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-secondary)' }
                      }
                    >
                      <CategoryIcon type={cat.icon || cat.key} className="w-3.5 h-3.5 flex-shrink-0" />
                      {pick(cat.name, cat.nameKa)}
                      {hasSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C4735B] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Separator + section label */}
            {activeCat && (
              <div className="px-4 pb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                  {pick(activeCat.name, activeCat.nameKa)} — {t('browse.selectServices')}
                </p>
              </div>
            )}

            {/* Active category subcategories */}
            <div className="px-4 pb-4 space-y-1.5">
              {activeCat?.subcategories.map(sub => {
                const services = sub.services ?? [];
                const triState = getTriState(sub.key, services, draft);
                const isExpanded = expandedSubs.has(sub.key) || services.some(s => draft.has(s.key));
                return (
                  <div
                    key={sub.key}
                    className="rounded-xl overflow-hidden transition-all"
                    style={{
                      border: `1px solid ${triState !== 'none' ? 'rgba(196,115,91,0.3)' : 'var(--color-border-subtle)'}`,
                      background: triState !== 'none' ? 'rgba(196,115,91,0.04)' : 'var(--color-bg-elevated)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 px-3.5 py-3">
                      <TriCheckbox state={triState} onChange={() => toggleSubcategory(sub)} />
                      <button
                        className="flex-1 flex items-center gap-1.5 text-left"
                        onClick={() => services.length > 0 && toggleExpandSub(sub.key)}
                      >
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {pick(sub.name, sub.nameKa)}
                        </span>
                        {services.length > 0 && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 ml-auto flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            style={{ color: 'var(--color-text-tertiary)' }}
                          />
                        )}
                      </button>
                    </div>
                    {isExpanded && services.length > 0 && (
                      <div
                        className="px-3.5 pb-3 pt-1 space-y-0.5 border-t ml-8"
                        style={{ borderColor: 'var(--color-border-subtle)' }}
                      >
                        {services.map(svc => (
                          <label key={svc.key} className="flex items-center gap-2.5 py-1.5 cursor-pointer rounded-lg px-1 hover:bg-black/[0.02]">
                            <input
                              type="checkbox"
                              checked={draft.has(svc.key)}
                              onChange={() => toggleService(svc.key)}
                              className="w-4 h-4 rounded flex-shrink-0"
                              style={{ accentColor: '#C4735B' }}
                            />
                            <span className="text-[13px]" style={{ color: draft.has(svc.key) ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                              {pick(svc.name, svc.nameKa)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter className="border-t border-[var(--color-border-subtle)]">
        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {t('browse.clearFilter')}
          </button>
        )}
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
        >
          {t('common.cancel')}
        </Button>
        <button
          onClick={handleApply}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors flex items-center gap-2"
          style={{ background: '#C4735B' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#B5624A')}
          onMouseLeave={e => (e.currentTarget.style.background = '#C4735B')}
        >
          {t('browse.showResults')}
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20">
              {activeCount}
            </span>
          )}
        </button>
      </ModalFooter>
    </Modal>
  );
}
