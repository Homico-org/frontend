import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseInfiniteScrollOptions {
  /** Threshold for intersection observer (0-1) */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Whether to enable infinite scroll */
  enabled?: boolean;
}

export interface UseInfiniteScrollReturn<T> {
  /** Current page number */
  page: number;
  /** Set page number manually */
  setPage: React.Dispatch<React.SetStateAction<number>>;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Set hasMore state */
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Set loading state */
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  /** Whether loading more items */
  isLoadingMore: boolean;
  /** Set loading more state */
  setIsLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  /** Ref to attach to the loader element */
  loaderRef: React.RefObject<HTMLDivElement>;
  /** Current items */
  items: T[];
  /** Set items */
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  /** Reset pagination state and items */
  reset: () => void;
  /** Append items to the list */
  appendItems: (newItems: T[]) => void;
}

/**
 * Custom hook for infinite scroll pagination
 *
 * @example
 * ```tsx
 * const {
 *   items,
 *   setItems,
 *   page,
 *   hasMore,
 *   setHasMore,
 *   isLoading,
 *   setIsLoading,
 *   isLoadingMore,
 *   setIsLoadingMore,
 *   loaderRef,
 *   reset,
 *   appendItems,
 * } = useInfiniteScroll<Job>();
 *
 * // Fetch function
 * const fetchData = async (pageNum: number, isReset = false) => {
 *   if (isReset) setIsLoading(true);
 *   else setIsLoadingMore(true);
 *
 *   const data = await api.get(`/items?page=${pageNum}`);
 *
 *   if (isReset) {
 *     setItems(data.items);
 *   } else {
 *     appendItems(data.items);
 *   }
 *
 *   setHasMore(data.hasMore);
 *   setIsLoading(false);
 *   setIsLoadingMore(false);
 * };
 *
 * // Fetch more when page changes
 * useEffect(() => {
 *   if (page > 1) fetchData(page);
 * }, [page]);
 *
 * // Render
 * return (
 *   <>
 *     {items.map(item => <Item key={item.id} />)}
 *     <div ref={loaderRef} />
 *   </>
 * );
 * ```
 */
export function useInfiniteScroll<T>(
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn<T> {
  const { threshold = 0.1, rootMargin = '0px', enabled = true } = options;

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [items, setItems] = useState<T[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Reset function
  const reset = useCallback(() => {
    setPage(1);
    setHasMore(true);
    setItems([]);
  }, []);

  // Append items helper
  const appendItems = useCallback((newItems: T[]) => {
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold, rootMargin }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
      observer.disconnect();
    };
  }, [hasMore, isLoading, isLoadingMore, enabled, threshold, rootMargin]);

  return {
    page,
    setPage,
    hasMore,
    setHasMore,
    isLoading,
    setIsLoading,
    isLoadingMore,
    setIsLoadingMore,
    loaderRef,
    items,
    setItems,
    reset,
    appendItems,
  };
}

export default useInfiniteScroll;
