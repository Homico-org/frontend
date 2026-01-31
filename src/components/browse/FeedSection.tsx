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
import { SkeletonCardGrid } from '@/components/ui/Skeleton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ACCENT_COLOR } from '@/constants/theme';

interface FeedSectionProps {
  selectedCategory: string | null;
  topRatedActive?: boolean;
}

export default function FeedSection({ selectedCategory, topRatedActive }: FeedSectionProps) {
  const { t, locale } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { searchQuery, sortBy, selectedCity, selectedSubcategory } = useBrowseContext();
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
        // Only apply subcategory filter when user explicitly selects it from filters.
        if (selectedSubcategory) {
          params.append('subcategories', selectedSubcategory);
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
            const targetId = item.likeTargetId || item.id;
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
    [selectedCategory, selectedSubcategory, selectedCity, topRatedActive, searchQuery, sortBy, initializeLikeStates]
  );

  // Previous filters ref to detect actual changes
  const prevFiltersRef = useRef<string | undefined>(undefined);

  // Create a stable filter key for comparison
  const filterKey = `${selectedCategory}-${selectedSubcategory}-${selectedCity}-${topRatedActive}-${searchQuery}-${sortBy}`;

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
        item.id === itemId
          ? { ...item, isLiked: newState.isLiked, likeCount: newState.likeCount }
          : item
      )
    );

    // Also update likeStates for the actual target if different from itemId
    if (actualTargetId !== itemId) {
      initializeLikeStates({ [actualTargetId]: newState });
    }
  };

  // Skeleton loading - Grid style (mobile-first)
  const FeedSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl overflow-hidden border border-neutral-200/70 dark:border-neutral-800/80">
          <div className="aspect-[4/3] bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          <div className="p-2.5 sm:p-4">
            <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 animate-pulse mb-2" />
            <div className="h-4 sm:h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-full animate-pulse mb-2" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 animate-pulse" />
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
          {/* Grid Layout - Mobile first: 2 columns */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
            {feedItems.map((item, index) => (
              <div
                key={item.id || `feed-item-${index}`}
                className="animate-fade-in"
                style={{ animationDelay: `${(index % 12) * 40}ms` }}
              >
                <FeedCard
                  item={{
                    ...item,
                    // Use actual like target for state lookup
                    isLiked: likeStates[item.likeTargetId || item.id]?.isLiked ?? item.isLiked,
                    likeCount: likeStates[item.likeTargetId || item.id]?.likeCount ?? item.likeCount,
                  }}
                  onLike={(likeTargetType, likeTargetId) => handleLike(item.id, likeTargetType, likeTargetId)}
                  isAuthenticated={isAuthenticated}
                  locale={locale}
                />
              </div>
            ))}
          </div>

          {/* Load More / Loader */}
          <div ref={loaderRef} className="flex justify-center py-6 sm:py-12">
            {isLoadingMore && (
              <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                <LoadingSpinner size="sm" color={ACCENT_COLOR} />
                <span className="text-xs sm:text-sm text-neutral-500">
                  {t('common.loading')}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
