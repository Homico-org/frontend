'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useBrowseContext } from '@/contexts/BrowseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLikes } from '@/hooks/useLikes';
import { FeedItem, LikeTargetType } from '@/types';
import { Image } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import FeedCard from './FeedCard';
import EmptyState from '../common/EmptyState';

// Terracotta accent
const ACCENT_COLOR = '#C4735B';

interface FeedSectionProps {
  selectedCategory: string | null;
  topRatedActive?: boolean;
}

export default function FeedSection({ selectedCategory, topRatedActive }: FeedSectionProps) {
  const { locale } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { searchQuery, sortBy, selectedCity } = useBrowseContext();
  const { toggleLike, initializeLikeStates, likeStates } = useLikes();

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef<HTMLDivElement>(null);
  const initialFetchDone = useRef(false);

  // Ref for AbortController to cancel stale requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFeed = useCallback(
    async (pageNum: number, append: boolean = false) => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams();
        params.append('page', pageNum.toString());
        params.append('limit', '12');
        if (selectedCategory) {
          params.append('category', selectedCategory);
        }
        if (selectedCity && selectedCity !== 'all') {
          params.append('location', selectedCity);
        }
        if (topRatedActive) {
          params.append('minRating', '4');
          params.append('sort', 'rating');
        } else if (sortBy && sortBy !== 'recommended') {
          params.append('sort', sortBy);
        }
        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/feed?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch feed');
        }

        const result = await response.json();
        const data = result.data || [];
        const pagination = result.pagination || { hasMore: false, total: 0 };

        if (append) {
          setFeedItems((prev) => [...prev, ...data]);
        } else {
          setFeedItems(data);
        }

        setHasMore(pagination.hasMore);

        if (data.length > 0) {
          const likeStatesFromServer: Record<string, { isLiked: boolean; likeCount: number }> = {};
          data.forEach((item: FeedItem) => {
            // Use the actual like target ID for state tracking
            const targetId = item.likeTargetId || item._id;
            likeStatesFromServer[targetId] = {
              isLiked: item.isLiked || false,
              likeCount: item.likeCount || 0,
            };
          });
          initializeLikeStates(likeStatesFromServer);
        }
      } catch (error) {
        // Ignore abort errors - these are expected when canceling stale requests
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to fetch feed:', error);
        if (!append) {
          setFeedItems([]);
        }
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedCategory, selectedCity, topRatedActive, searchQuery, sortBy, initializeLikeStates]
  );

  // Previous filters ref to detect actual changes
  const prevFiltersRef = useRef<string | undefined>(undefined);

  // Create a stable filter key for comparison
  const filterKey = `${selectedCategory}-${selectedCity}-${topRatedActive}-${searchQuery}-${sortBy}`;

  // Fetch when any filter changes (including initial mount)
  useEffect(() => {
    // Skip if this is a re-render with the same filters
    if (prevFiltersRef.current === filterKey && initialFetchDone.current) {
      return;
    }

    prevFiltersRef.current = filterKey;

    // If already fetched and filters didn't change, skip
    if (initialFetchDone.current) {
      // Filters changed - reset and fetch
      setPage(1);
      setFeedItems([]);
    }

    initialFetchDone.current = true;
    fetchFeed(1);
  }, [filterKey, fetchFeed]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchFeed(nextPage, true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, page, fetchFeed]);

  const handleLike = async (itemId: string, likeTargetType?: string, likeTargetId?: string) => {
    if (!isAuthenticated) return;

    // Use the actual like target (for embedded projects, this might be the pro profile)
    const actualTargetId = likeTargetId || itemId;
    const actualTargetType = likeTargetType === 'pro_profile'
      ? LikeTargetType.PRO_PROFILE
      : LikeTargetType.PORTFOLIO_ITEM;

    const currentState = likeStates[actualTargetId] || { isLiked: false, likeCount: 0 };
    const newState = await toggleLike(actualTargetType, actualTargetId, currentState);

    // Update both the actual target ID and the item ID states
    setFeedItems((prev) =>
      prev.map((item) =>
        item._id === itemId
          ? { ...item, isLiked: newState.isLiked, likeCount: newState.likeCount }
          : item
      )
    );

    // Also update likeStates for the actual target if different from itemId
    if (actualTargetId !== itemId) {
      initializeLikeStates({ [actualTargetId]: newState });
    }
  };

  // Skeleton loading - Grid style
  const FeedSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 overflow-hidden animate-pulse"
        >
          <div className="aspect-[4/3] bg-neutral-200 dark:bg-neutral-800" />
          <div className="p-4 space-y-3">
            <div className="h-4 rounded w-16 bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-5 rounded w-3/4 bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 rounded w-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4 rounded w-24 bg-neutral-200 dark:bg-neutral-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state using shared component
  const FeedEmptyState = () => (
    <EmptyState
      icon={Image}
      title="No work found"
      titleKa="ნამუშევრები არ მოიძებნა"
      description="No matching work found in this category. Try exploring other categories."
      descriptionKa="ამჟამად არ არის შესაბამისი ნამუშევარი. სცადეთ სხვა კატეგორია."
      variant="illustrated"
      size="lg"
    />
  );

  return (
    <div>
      {isLoading ? (
        <FeedSkeleton />
      ) : feedItems.length === 0 ? (
        <FeedEmptyState />
      ) : (
        <>
          {/* Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {feedItems.map((item, index) => (
              <div
                key={item._id}
                className="animate-fade-in"
                style={{ animationDelay: `${(index % 12) * 40}ms` }}
              >
                <FeedCard
                  item={{
                    ...item,
                    // Use actual like target for state lookup
                    isLiked: likeStates[item.likeTargetId || item._id]?.isLiked ?? item.isLiked,
                    likeCount: likeStates[item.likeTargetId || item._id]?.likeCount ?? item.likeCount,
                  }}
                  onLike={(likeTargetType, likeTargetId) => handleLike(item._id, likeTargetType, likeTargetId)}
                  isAuthenticated={isAuthenticated}
                  locale={locale}
                />
              </div>
            ))}
          </div>

          {/* Load More / Loader */}
          <div ref={loaderRef} className="flex justify-center py-12">
            {isLoadingMore && (
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: ACCENT_COLOR, borderTopColor: 'transparent' }}
                />
                <span className="text-sm text-neutral-500">
                  {locale === 'ka' ? 'იტვირთება...' : 'Loading...'}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
