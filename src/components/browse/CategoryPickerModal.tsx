'use client';

import CategoryIcon from '@/components/categories/CategoryIcon';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Checkbox from '@/components/ui/Checkbox';
import { useCategories } from '@/contexts/CategoriesContext';
import type { Category, CatalogServiceItem, Subcategory } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAiServiceSearch } from '@/hooks/useAiServiceSearch';
import { Search, Sparkles, X } from 'lucide-react';
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
      style={{ accentColor: 'var(--hm-brand-500)' }}
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
  const { t, pick } = useLanguage();
  const { categories } = useCategories();

  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [activeCatKey, setActiveCatKey] = useState<string>('');
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const { aiResults, aiLoading, search: aiSearch, clear: aiClear } = useAiServiceSearch();

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
        style={{ borderColor: 'var(--hm-border-subtle)' }}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--hm-fg-primary)' }}>
          {t('browse.selectCategory')}
        </h2>
      </div>

      {/* Search bar */}
      <div
        className="px-5 py-3 border-b"
        style={{ borderColor: 'var(--hm-border-subtle)' }}
      >
        <div
          className="relative flex items-center rounded-lg border"
          style={{ borderColor: 'var(--hm-border-subtle)', background: 'var(--hm-bg-tertiary)' }}
        >
          {aiLoading ? (
            <Sparkles className="absolute left-3 w-4 h-4 animate-pulse" style={{ color: 'var(--hm-brand-500)' }} />
          ) : (
            <Search className="absolute left-3 w-4 h-4" style={{ color: 'var(--hm-fg-muted)' }} />
          )}
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder={t('browse.searchServices')}
            className="w-full pl-9 pr-9 py-2 text-sm bg-transparent focus:outline-none text-[var(--hm-fg-primary)] placeholder:text-[var(--hm-fg-muted)]"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => { setSearch(''); aiClear(); }}
              className="absolute right-1.5 h-6 w-6 rounded text-[var(--hm-fg-muted)]"
              aria-label={t('common.clear')}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <ModalBody className="p-0 overflow-hidden">
        {/* Search results mode */}
        {searchResults !== null ? (
          <div className="overflow-y-auto max-h-[50vh] px-5 py-3 space-y-4">
            {searchResults.length === 0 && !aiLoading ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--hm-fg-secondary)' }}>
                {t('browse.noResults')}
              </p>
            ) : searchResults.length === 0 && aiLoading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Sparkles className="w-4 h-4 animate-pulse text-[var(--hm-brand-500)]" />
                <p className="text-sm" style={{ color: 'var(--hm-fg-secondary)' }}>
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
                      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--hm-border-subtle)' }}>
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[var(--hm-brand-500)]" />
                          <span className="text-xs font-semibold text-[var(--hm-brand-500)]">
                            {t('browse.aiSuggested')}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
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
                          className="text-xs font-medium text-[var(--hm-brand-500)]"
                        >
                          {allSelected ? t('browse.deselectAll') : t('browse.selectAll')}
                        </Button>
                      </div>
                    )}

                    {Array.from(grouped.entries()).map(([subKey, results]) => {
                      const { subcategory, category } = results[0];
                      return (
                        <div key={subKey}>
                          <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--hm-fg-secondary)' }}>
                            {pick({ en: category.name, ka: category.nameKa })} › {pick({ en: subcategory.name, ka: subcategory.nameKa })}
                          </p>
                      <div className="space-y-1">
                        {results.map(({ service }) => (
                          <div key={service.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--hm-bg-tertiary)]">
                            <Checkbox
                              size="sm"
                              checked={draft.has(service.key)}
                              onChange={() => toggleService(service.key)}
                            >
                              <span className="text-sm text-[var(--hm-fg-primary)]">
                                {pick({ en: service.name, ka: service.nameKa })}
                              </span>
                            </Checkbox>
                          </div>
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
              style={{ borderColor: 'var(--hm-border-subtle)' }}
            >
              {categories.map(cat => {
                const isActive = cat.key === activeCatKey;
                const selectedCount = cat.subcategories.reduce((acc, sub) => {
                  const serviceKeys = (sub.services ?? []).map(sv => sv.key);
                  const isSubSelected = draft.has(sub.key) || serviceKeys.some(k => draft.has(k));
                  return acc + (isSubSelected ? 1 : 0);
                }, 0);
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCatKey(cat.key)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
                    style={
                      isActive
                        ? { background: 'rgba(239,78,36,0.10)', color: 'var(--hm-brand-500)', fontWeight: 600 }
                        : { color: 'var(--hm-fg-secondary)' }
                    }
                  >
                    <CategoryIcon type={cat.icon || cat.key} className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate text-[13px]">{pick({ en: cat.name, ka: cat.nameKa })}</span>
                    {selectedCount > 0 && (
                      <span
                        className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ background: 'var(--hm-brand-500)', color: '#fff' }}
                      >
                        {selectedCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right panel: subcategories as flat checkboxes */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {activeCat?.subcategories.map(sub => {
                const services = sub.services ?? [];
                // For browse: select subcategory key OR its single service key
                const serviceKeys = services.map(s => s.key);
                const isSelected = draft.has(sub.key) || serviceKeys.some(k => draft.has(k));

                return (
                  <div
                    key={sub.key}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-[var(--hm-bg-tertiary)]"
                    style={isSelected ? { backgroundColor: 'rgba(239,78,36,0.06)' } : undefined}
                  >
                    <Checkbox
                      size="sm"
                      checked={isSelected}
                      onChange={() => {
                        setDraft(prev => {
                          const next = new Set(prev);
                          if (isSelected) {
                            next.delete(sub.key);
                            serviceKeys.forEach(k => next.delete(k));
                          } else {
                            // Add subcategory key for browse filtering
                            next.add(sub.key);
                          }
                          return next;
                        });
                      }}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: isSelected ? 'var(--hm-brand-500)' : 'var(--hm-fg-primary)' }}
                      >
                        {pick({ en: sub.name, ka: sub.nameKa })}
                      </span>
                    </Checkbox>
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
                  const selectedCount = cat.subcategories.reduce((acc, sub) => {
                    const serviceKeys = (sub.services ?? []).map(sv => sv.key);
                    const isSubSelected = draft.has(sub.key) || serviceKeys.some(k => draft.has(k));
                    return acc + (isSubSelected ? 1 : 0);
                  }, 0);
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCatKey(cat.key)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium border transition-all shrink-0 whitespace-nowrap"
                      style={
                        isActive
                          ? { borderColor: 'var(--hm-brand-500)', background: 'rgba(239,78,36,0.12)', color: 'var(--hm-brand-500)' }
                          : { borderColor: 'var(--hm-border-subtle)', color: 'var(--hm-fg-secondary)' }
                      }
                    >
                      <CategoryIcon type={cat.icon || cat.key} className="w-3.5 h-3.5 flex-shrink-0" />
                      {pick({ en: cat.name, ka: cat.nameKa })}
                      {selectedCount > 0 && (
                        <span
                          className="min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{ background: 'var(--hm-brand-500)', color: '#fff' }}
                        >
                          {selectedCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Separator + section label */}
            {activeCat && (
              <div className="px-4 pb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--hm-fg-muted)' }}>
                  {pick({ en: activeCat.name, ka: activeCat.nameKa })} — {t('browse.selectServices')}
                </p>
              </div>
            )}

            {/* Active category subcategories — flat checkboxes */}
            <div className="px-4 pb-4 space-y-1.5">
              {activeCat?.subcategories.map(sub => {
                const services = sub.services ?? [];
                const serviceKeys = services.map(s => s.key);
                const isSelected = draft.has(sub.key) || serviceKeys.some(k => draft.has(k));
                return (
                  <div
                    key={sub.key}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all"
                    style={{
                      border: `1px solid ${isSelected ? 'rgba(239,78,36,0.3)' : 'var(--hm-border-subtle)'}`,
                      background: isSelected ? 'rgba(239,78,36,0.04)' : 'var(--hm-bg-elevated)',
                    }}
                  >
                    <Checkbox
                      size="sm"
                      checked={isSelected}
                      onChange={() => {
                        setDraft(prev => {
                          const next = new Set(prev);
                          if (isSelected) {
                            next.delete(sub.key);
                            serviceKeys.forEach(k => next.delete(k));
                          } else {
                            next.add(sub.key);
                          }
                          return next;
                        });
                      }}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: isSelected ? 'var(--hm-brand-500)' : 'var(--hm-fg-primary)' }}
                      >
                        {pick({ en: sub.name, ka: sub.nameKa })}
                      </span>
                    </Checkbox>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter className="border-t border-[var(--hm-border-subtle)]">
        {activeCount > 0 && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleClear}
            className="text-sm font-medium text-[var(--hm-fg-secondary)]"
          >
            {t('browse.clearFilter')}
          </Button>
        )}
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleApply}
          className="rounded-lg"
        >
          {t('browse.showResults')}
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20">
              {activeCount}
            </span>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
