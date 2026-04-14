'use client';

import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCallback, useRef, useState } from 'react';

interface AiMatch {
  category: string;
  key: string;
}

interface UseAiServiceSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

export function useAiServiceSearch(options: UseAiServiceSearchOptions = {}) {
  const { debounceMs = 600, minQueryLength = 5 } = options;
  const { locale } = useLanguage();
  const [aiResults, setAiResults] = useState<AiMatch[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < minQueryLength) {
      setAiResults(null);
      setAiLoading(false);
      return;
    }
    setAiLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/categories/ai-search?q=${encodeURIComponent(query)}&locale=${locale}`);
        const matches: AiMatch[] = res.data?.subcategories || [];
        setAiResults(matches.length > 0 ? matches : null);
      } catch {
        setAiResults(null);
      } finally {
        setAiLoading(false);
      }
    }, debounceMs);
  }, [locale, debounceMs, minQueryLength]);

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAiResults(null);
    setAiLoading(false);
  }, []);

  return { aiResults, aiLoading, search, clear };
}
