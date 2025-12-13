'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLikes } from '@/hooks/useLikes';
import { FeedItem, LikeTargetType } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import FeedCard from './FeedCard';

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
        const data = result.data || [];
        const pagination = result.pagination || { hasMore: false, total: 0 };

        if (append) {
          setFeedItems((prev) => [...prev, ...data]);
        } else {
          setFeedItems(data);
        }

        setHasMore(pagination.hasMore);
        setTotalCount(pagination.total);

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
    if (!isAuthenticated) return;

    const currentState = likeStates[itemId] || { isLiked: false, likeCount: 0 };
    const newState = await toggleLike(LikeTargetType.PORTFOLIO_ITEM, itemId, currentState);

    setFeedItems((prev) =>
      prev.map((item) =>
        item._id === itemId
          ? { ...item, isLiked: newState.isLiked, likeCount: newState.likeCount }
          : item
      )
    );
  };

  // Premium Loading skeleton
  const FeedSkeleton = () => (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="pro-card-premium overflow-hidden animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {/* Image skeleton */}
          <div className="aspect-[4/3] bg-gradient-to-br from-[#D2691E]/5 to-[#CD853F]/10 relative">
            <div className="absolute inset-0 shimmer-premium" />
            {/* Corner accent */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#D2691E]/10" />
          </div>
          {/* Footer skeleton */}
          <div className="p-3 sm:p-4 flex items-center gap-3">
            {/* Avatar skeleton */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#D2691E]/10 to-[#CD853F]/15" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#D2691E]/10 rounded-lg w-3/4" />
              <div className="h-3 bg-[#D2691E]/5 rounded-lg w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Premium Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {/* Decorative icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#D2691E]/10 to-[#CD853F]/5 flex items-center justify-center rotate-3">
          <svg
            className="w-12 h-12 text-[#D2691E]/40"
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
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#D2691E]/20 animate-float-slow" />
        <div className="absolute -bottom-1 -left-3 w-4 h-4 rounded-full bg-[#CD853F]/15 animate-float-slower" />
      </div>

      <h3 className="browse-title text-xl sm:text-2xl text-gradient-terracotta mb-2">
        {locale === 'ka' ? 'ნამუშევრები არ მოიძებნა' : 'No work found'}
      </h3>
      <p className="text-sm sm:text-base text-[var(--color-text-secondary)] text-center max-w-md font-serif-italic">
        {locale === 'ka'
          ? 'ამჟამად არ არის შესაბამისი ნამუშევარი. სცადეთ სხვა კატეგორია ან დაბრუნდით მოგვიანებით.'
          : 'No matching work found in this category. Try exploring other categories or check back later.'}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Results count */}
      {!isLoading && feedItems.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            <span className="font-semibold text-[#D2691E]">{totalCount}</span>
            {' '}
            {locale === 'ka' ? 'ნამუშევარი' : 'works'}
          </p>
        </div>
      )}

      {isLoading ? (
        <FeedSkeleton />
      ) : feedItems.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Feed Grid with staggered animation */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
            {feedItems.map((item, index) => (
              <div
                key={item._id}
                className="animate-stagger"
                style={{ animationDelay: `${(index % 12) * 60}ms` }}
              >
                <FeedCard
                  item={{
                    ...item,
                    isLiked: likeStates[item._id]?.isLiked ?? item.isLiked,
                    likeCount: likeStates[item._id]?.likeCount ?? item.likeCount,
                  }}
                  onLike={() => handleLike(item._id)}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            ))}
          </div>

          {/* Load More / Loader with premium styling */}
          <div ref={loaderRef} className="flex justify-center py-10">
            {isLoadingMore && (
              <div className="flex items-center gap-4 px-6 py-3 rounded-2xl glass-card">
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 rounded-full border-2 border-[#D2691E]/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-[#D2691E] border-t-transparent animate-spin" />
                </div>
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  {locale === 'ka' ? 'იტვირთება...' : 'Loading more...'}
                </span>
              </div>
            )}
            {!hasMore && feedItems.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)]">
                <div className="w-8 h-px bg-gradient-to-r from-transparent via-[#D2691E]/20 to-transparent" />
                <span className="font-serif-italic">
                  {locale === 'ka' ? 'ყველა ნამუშევარი ნაჩვენებია' : 'All works displayed'}
                </span>
                <div className="w-8 h-px bg-gradient-to-r from-transparent via-[#D2691E]/20 to-transparent" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
