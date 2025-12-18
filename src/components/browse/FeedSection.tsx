'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useBrowseContext } from '@/contexts/BrowseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLikes } from '@/hooks/useLikes';
import { FeedItem, LikeTargetType } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import FeedCard from './FeedCard';

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

  const fetchFeed = useCallback(
    async (pageNum: number, append: boolean = false) => {
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
          `${process.env.NEXT_PUBLIC_API_URL}/feed?${params.toString()}`
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

  // Illustrated Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      {/* Illustration */}
      <div className="relative mb-8">
        {/* Main illustration container */}
        <div className="w-32 h-32 rounded-3xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center relative overflow-hidden">
          {/* Abstract shapes */}
          <div className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 rotate-12" />
          <div className="absolute bottom-6 right-4 w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="absolute top-8 right-8 w-4 h-4 rounded bg-neutral-300 dark:bg-neutral-700" />

          {/* Main icon */}
          <svg
            className="w-12 h-12 text-neutral-400 dark:text-neutral-600 relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
        </div>

        {/* Floating decorative elements */}
        <div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
          style={{ backgroundColor: `${ACCENT_COLOR}20` }}
        />
        <div
          className="absolute -bottom-1 -left-3 w-4 h-4 rounded-full"
          style={{ backgroundColor: `${ACCENT_COLOR}15` }}
        />
      </div>

      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
        {locale === 'ka' ? 'ნამუშევრები არ მოიძებნა' : 'No work found'}
      </h3>
      <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-sm">
        {locale === 'ka'
          ? 'ამჟამად არ არის შესაბამისი ნამუშევარი. სცადეთ სხვა კატეგორია.'
          : 'No matching work found in this category. Try exploring other categories.'}
      </p>
    </div>
  );

  return (
    <div>
      {isLoading ? (
        <FeedSkeleton />
      ) : feedItems.length === 0 ? (
        <EmptyState />
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
