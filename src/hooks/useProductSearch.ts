'use client';

import { api } from '@/lib/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CatalogProduct,
  CatalogSearchResponse,
  mapCatalogProduct,
} from '@/components/shop/types';

export type ProductSort = 'relevance' | 'price_asc' | 'price_desc' | 'newest';

export interface ProductSearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  supplierKey?: string;
  inStockOnly?: boolean;
  sort?: ProductSort;
}

interface UseProductSearchOptions {
  debounceMs?: number;
  pageSize?: number;
}

/**
 * Debounced + paginated search over the supplier catalog. Owns its own
 * page state and guards against out-of-order responses with a request seq.
 * An empty query returns a populated "browse" first page rather than nothing.
 */
export function useProductSearch(options: UseProductSearchOptions = {}) {
  const { debounceMs = 300, pageSize = 24 } = options;

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ProductSearchFilters>({});
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped on every new search; responses with a stale seq are dropped.
  const seqRef = useRef(0);

  const fetchPage = useCallback(
    async (nextPage: number, q: string, f: ProductSearchFilters) => {
      const seq = ++seqRef.current;
      if (nextPage === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      setError(null);
      try {
        const res = await api.get<CatalogSearchResponse>(
          '/supplier-catalog/products',
          {
            params: {
              q: q.trim() || undefined,
              category: f.category || undefined,
              minPrice: f.minPrice,
              maxPrice: f.maxPrice,
              supplierKey: f.supplierKey || undefined,
              inStockOnly: f.inStockOnly ? 'true' : undefined,
              sort: f.sort && f.sort !== 'relevance' ? f.sort : undefined,
              page: nextPage,
              limit: pageSize,
            },
          },
        );
        if (seq !== seqRef.current) return; // stale
        const mapped = (res.data.items || []).map(mapCatalogProduct);
        setItems((prev) => (nextPage === 1 ? mapped : [...prev, ...mapped]));
        setHasMore(!!res.data.hasMore);
        if (typeof res.data.total === 'number') setTotal(res.data.total);
        setPage(nextPage);
      } catch {
        if (seq !== seqRef.current) return;
        setError('error');
        if (nextPage === 1) {
          setItems([]);
          setHasMore(false);
        }
      } finally {
        if (seq === seqRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [pageSize],
  );

  // Debounced first-page fetch whenever query or filters change.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchPage(1, query, filters);
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, filters, debounceMs, fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return;
    void fetchPage(page + 1, query, filters);
  }, [isLoading, isLoadingMore, hasMore, page, query, filters, fetchPage]);

  const reset = useCallback(() => {
    void fetchPage(1, query, filters);
  }, [fetchPage, query, filters]);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    items,
    total,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    reset,
  };
}
