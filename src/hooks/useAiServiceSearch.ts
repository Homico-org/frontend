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
  // Default minQueryLength was 5, which silently disabled AI for short
  // queries like "leak", "tile", "გიფს" - exactly the high-recall short
  // tokens users actually type in Georgian/Russian. Dropped to 3 so AI
  // fires on real two-syllable searches; local keyword match handles
  // 1-2 char prefixes (different code path in the consuming components).
  const { debounceMs = 600, minQueryLength = 3 } = options;
  const { locale } = useLanguage();
  const [aiResults, setAiResults] = useState<AiMatch[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  // aiAttempted tracks whether a request was actually dispatched for
  // the current query. Lets the UI distinguish "query too short, didn't
  // ask AI" from "asked AI and got nothing back" - previously both
  // states rendered identically and users couldn't tell whether AI was
  // broken or whether their query simply didn't match.
  const [aiAttempted, setAiAttempted] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < minQueryLength) {
      setAiResults(null);
      setAiLoading(false);
      setAiAttempted(false);
      return;
    }
    setAiLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/categories/ai-search?q=${encodeURIComponent(query)}&locale=${locale}`);
        const matches: AiMatch[] = res.data?.subcategories || [];
        setAiResults(matches.length > 0 ? matches : null);
        setAiAttempted(true);
      } catch {
        setAiResults(null);
        setAiAttempted(true);
      } finally {
        setAiLoading(false);
      }
    }, debounceMs);
  }, [locale, debounceMs, minQueryLength]);

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAiResults(null);
    setAiLoading(false);
    setAiAttempted(false);
  }, []);

  return { aiResults, aiLoading, aiAttempted, search, clear };
}
