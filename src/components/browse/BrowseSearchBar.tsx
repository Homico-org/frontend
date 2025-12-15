'use client';

import { useBrowseContext } from '@/contexts/BrowseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const SEARCH_SUGGESTIONS = [
  { key: 'interior', en: 'Interior Design', ka: 'ინტერიერის დიზაინი' },
  { key: 'electric', en: 'Electrician', ka: 'ელექტრიკოსი' },
  { key: 'plumber', en: 'Plumber', ka: 'სანტექნიკოსი' },
  { key: 'painter', en: 'Painter', ka: 'მხატვარი' },
  { key: 'architect', en: 'Architect', ka: 'არქიტექტორი' },
];

interface BrowseSearchBarProps {
  placeholder?: string;
}

export default function BrowseSearchBar({ placeholder }: BrowseSearchBarProps) {
  const { locale } = useLanguage();
  const { searchQuery, setSearchQuery } = useBrowseContext();
  const [inputValue, setInputValue] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync input with context
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('recentProSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch {
        // ignore
      }
    }
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToRecent = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentProSearches', JSON.stringify(updated));
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setInputValue(value);
    setShowSuggestions(false);
    if (value.trim()) {
      saveToRecent(value);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeRecent = (query: string) => {
    const updated = recentSearches.filter(s => s !== query);
    setRecentSearches(updated);
    localStorage.setItem('recentProSearches', JSON.stringify(updated));
  };

  const defaultPlaceholder = locale === 'ka'
    ? 'მოძებნე სპეციალისტი...'
    : 'Search professionals...';

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-[var(--color-text-tertiary)]" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            // Debounced search
            const value = e.target.value;
            setTimeout(() => {
              if (inputRef.current?.value === value) {
                setSearchQuery(value);
              }
            }, 300);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(inputValue);
            }
            if (e.key === 'Escape') {
              setShowSuggestions(false);
            }
          }}
          placeholder={placeholder || defaultPlaceholder}
          className="w-full pl-9 pr-8 py-2 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-lg focus:outline-none focus:border-[#D2691E] focus:ring-1 focus:ring-[#D2691E]/20 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
        />
        {inputValue && (
          <button
            onClick={clearSearch}
            className="absolute right-2 p-1 rounded-full hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-2 border-b border-[var(--color-border-subtle)]">
              <span className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide px-2">
                {locale === 'ka' ? 'ბოლო' : 'Recent'}
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {recentSearches.map((search, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--color-bg-tertiary)] hover:bg-[#D2691E]/10 cursor-pointer"
                  >
                    <button
                      onClick={() => handleSearch(search)}
                      className="text-xs text-[var(--color-text-secondary)] group-hover:text-[#D2691E]"
                    >
                      {search}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecent(search);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5"
                    >
                      <X className="w-2.5 h-2.5 text-[var(--color-text-tertiary)]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="p-2">
            <span className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide px-2">
              {locale === 'ka' ? 'პოპულარული' : 'Popular'}
            </span>
            <div className="mt-1 space-y-0.5">
              {SEARCH_SUGGESTIONS.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion.key}
                  onClick={() => handleSearch(locale === 'ka' ? suggestion.ka : suggestion.en)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#D2691E]/10 text-left"
                >
                  <Search className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                  <span className="text-xs text-[var(--color-text-secondary)] hover:text-[#D2691E]">
                    {locale === 'ka' ? suggestion.ka : suggestion.en}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
