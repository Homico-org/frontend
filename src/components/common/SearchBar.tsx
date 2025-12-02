'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder }: SearchBarProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchPlaceholder = placeholder || t('landing.searchPlaceholder');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className={`relative flex items-center bg-white dark:bg-dark-card rounded-xl border transition-all duration-200 ease-out ${
        isFocused ? 'border-blue-500 shadow-md dark:shadow-none' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-dark-border-subtle'
      }`}>
        {/* Search Icon */}
        <div className="absolute left-4 pointer-events-none">
          <svg
            className="w-5 h-5 text-neutral-400 dark:text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={searchPlaceholder}
          className="flex-1 pl-12 pr-4 py-3.5 bg-transparent border-none rounded-l-xl focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-neutral-900 dark:text-neutral-50"
        />

        <button
          type="submit"
          className="px-5 py-2.5 m-1.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 ease-out flex items-center gap-2"
        >
          <span>{t('common.search')}</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
