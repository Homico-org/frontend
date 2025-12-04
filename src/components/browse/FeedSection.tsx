'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { FeedItem, LikeTargetType } from '@/types';
import FeedCard from './FeedCard';
import { useLikes } from '@/hooks/useLikes';

interface FeedSectionProps {
  selectedCategory: string | null;
}

export default function FeedSection({ selectedCategory }: FeedSectionProps) {
  const { locale } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { toggleLike, initializeLikeStates, likeStates } = useLikes();

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

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

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/feed?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch feed');
        }

        const result = await response.json();

        // Safely handle response data
        const data = result.data || [];
        const pagination = result.pagination || { hasMore: false, total: 0 };

        if (append) {
          setFeedItems((prev) => [...prev, ...data]);
        } else {
          setFeedItems(data);
        }

        setHasMore(pagination.hasMore);
        setTotalCount(pagination.total);

        // Initialize like states from server data
        if (data.length > 0) {
          const likeStatesFromServer: Record<string, { isLiked: boolean; likeCount: number }> = {};
          data.forEach((item: FeedItem) => {
            likeStatesFromServer[item._id] = {
              isLiked: item.isLiked || false,
              likeCount: item.likeCount || 0,
            };
          });
          initializeLikeStates(likeStatesFromServer);
        }
      } catch (error) {
        console.error('Failed to fetch feed:', error);
        // Set empty data on error
        if (!append) {
          setFeedItems([]);
        }
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedCategory, initializeLikeStates]
  );

  // Initial fetch
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    fetchFeed(1);
  }, [fetchFeed]);

  // Refetch when category changes
  useEffect(() => {
    setPage(1);
    setFeedItems([]);
    initialFetchDone.current = false;
    fetchFeed(1);
  }, [selectedCategory]);

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

  const handleLike = async (itemId: string) => {
    if (!isAuthenticated) {
      // Could redirect to login or show a toast
      return;
    }

    const currentState = likeStates[itemId] || { isLiked: false, likeCount: 0 };
    const newState = await toggleLike(LikeTargetType.PORTFOLIO_ITEM, itemId, currentState);

    // Update local feed items state
    setFeedItems((prev) =>
      prev.map((item) =>
        item._id === itemId
          ? { ...item, isLiked: newState.isLiked, likeCount: newState.likeCount }
          : item
      )
    );
  };

  // Loading skeleton
  const FeedSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-[var(--color-bg-secondary)] rounded-2xl overflow-hidden border border-[var(--color-border-subtle)] animate-pulse"
        >
          <div className="aspect-[4/3] bg-[var(--color-bg-tertiary)]" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-[var(--color-bg-tertiary)] rounded w-3/4" />
            <div className="h-4 bg-[var(--color-bg-tertiary)] rounded w-full" />
            <div className="h-4 bg-[var(--color-bg-tertiary)] rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-4">
        <svg
          className="w-10 h-10 text-[var(--color-text-tertiary)]"
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
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {locale === 'ka' ? 'ფიდი ცარიელია' : 'Feed is empty'}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] text-center max-w-md">
        {locale === 'ka'
          ? 'ამჟამად არ არის შესაბამისი ნამუშევარი. სცადეთ სხვა კატეგორია ან დაბრუნდით მოგვიანებით.'
          : 'No matching work found. Try a different category or check back later.'}
      </p>
    </div>
  );

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (feedItems.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {locale === 'ka'
            ? `ნაჩვენებია ${feedItems.length} / ${totalCount} ნამუშევარი`
            : `Showing ${feedItems.length} of ${totalCount} items`}
        </p>
      </div>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {feedItems.map((item, index) => (
          <div
            key={item._id}
            className="animate-fade-in"
            style={{ animationDelay: `${(index % 12) * 50}ms` }}
          >
            <FeedCard
              item={{
                ...item,
                isLiked: likeStates[item._id]?.isLiked ?? item.isLiked,
                likeCount: likeStates[item._id]?.likeCount ?? item.likeCount,
              }}
              onLike={() => handleLike(item._id)}
            />
          </div>
        ))}
      </div>

      {/* Load More / Loader */}
      <div ref={loaderRef} className="flex justify-center py-8">
        {isLoadingMore && (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[var(--color-text-secondary)]">
              {locale === 'ka' ? 'იტვირთება...' : 'Loading...'}
            </span>
          </div>
        )}
        {!hasMore && feedItems.length > 0 && (
          <p className="text-sm text-[var(--color-text-tertiary)]">
            {locale === 'ka' ? 'ყველა ნამუშევარი ნაჩვენებია' : 'All items loaded'}
          </p>
        )}
      </div>
    </div>
  );
}
