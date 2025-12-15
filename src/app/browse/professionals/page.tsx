"use client";

import ProCard from "@/components/common/ProCard";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLikes } from "@/hooks/useLikes";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { LikeTargetType, ProProfile } from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Popular search suggestions
const SEARCH_SUGGESTIONS = [
  { key: 'interior', en: 'Interior Design', ka: 'ინტერიერის დიზაინი' },
  { key: 'electric', en: 'Electrician', ka: 'ელექტრიკოსი' },
  { key: 'plumber', en: 'Plumber', ka: 'სანტექნიკოსი' },
  { key: 'painter', en: 'Painter', ka: 'მხატვარი' },
  { key: 'architect', en: 'Architect', ka: 'არქიტექტორი' },
];

export default function ProfessionalsPage() {
  const { t, locale } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { selectedCategory, selectedSubcategory, minRating } = useBrowseContext();
  const { toggleLike, initializeLikeStates, likeStates } = useLikes();

  const [results, setResults] = useState<ProProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentProSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch {}
    }
  }, []);

  // Save search to recent searches
  const saveToRecentSearches = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentProSearches', JSON.stringify(updated));
  };

  // Handle search submit
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchInput(query);
    setShowSuggestions(false);
    if (query.trim()) {
      saveToRecentSearches(query);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchInput("");
    searchInputRef.current?.focus();
  };

  const debouncedSearch = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (value: string, callback: (v: string) => void) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback(value), 300);
    };
  }, []);

  // Fetch professionals
  const fetchProfessionals = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        if (reset) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const params = new URLSearchParams();
        params.append("page", pageNum.toString());
        params.append("limit", "12");

        if (selectedCategory) params.append("category", selectedCategory);
        if (selectedSubcategory) params.append("subcategory", selectedSubcategory);
        if (minRating > 0) params.append("minRating", minRating.toString());
        if (searchQuery) params.append("search", searchQuery);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/pro-profiles?${params.toString()}`,
          {
            headers: {
              ...(localStorage.getItem("token") && {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }),
            },
          }
        );

        if (!response.ok) {
          setHasMore(false);
          throw new Error("Failed to fetch");
        }

        const result = await response.json();
        const profiles = result.data || result.profiles || [];
        const pagination = result.pagination || {};

        if (reset) {
          setResults(profiles);
          initializeLikeStates(
            profiles.map((p: ProProfile) => ({
              id: p._id,
              isLiked: p.isLiked || false,
              likeCount: p.likeCount || 0,
            }))
          );
        } else {
          setResults((prev) => [...prev, ...profiles]);
          initializeLikeStates(
            profiles.map((p: ProProfile) => ({
              id: p._id,
              isLiked: p.isLiked || false,
              likeCount: p.likeCount || 0,
            }))
          );
        }

        setTotalCount(pagination.total || result.total || result.totalCount || 0);
        setHasMore(pagination.hasMore ?? (profiles.length === 12 && profiles.length > 0));
      } catch (error) {
        console.error("Error fetching professionals:", error);
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedCategory, selectedSubcategory, minRating, searchQuery, initializeLikeStates]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchProfessionals(1, true);
  }, [selectedCategory, selectedSubcategory, minRating, searchQuery]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore]);

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchProfessionals(page);
    }
  }, [page]);

  const handleProLike = async (proId: string) => {
    if (!user) return;
    await toggleLike(LikeTargetType.PRO_PROFILE, proId);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Remove a recent search
  const removeRecentSearch = (query: string) => {
    const updated = recentSearches.filter(s => s !== query);
    setRecentSearches(updated);
    localStorage.setItem('recentProSearches', JSON.stringify(updated));
  };

  // Premium Loading skeleton
  const ProfessionalsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="pro-card-premium overflow-hidden animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {/* Image skeleton */}
          <div className="aspect-[4/3] bg-gradient-to-br from-[#D2691E]/5 to-[#CD853F]/10 relative">
            <div className="absolute inset-0 shimmer-premium" />
            {/* Status badge skeleton */}
            <div className="absolute top-3 right-3 w-16 h-6 rounded-full bg-[#D2691E]/10" />
            {/* Stats overlay skeleton */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-4 rounded bg-white/20" />
                <div className="w-12 h-4 rounded bg-white/20" />
              </div>
              <div className="w-36 h-6 rounded bg-white/30" />
            </div>
          </div>
          {/* Content skeleton */}
          <div className="p-4">
            <div className="h-5 rounded-lg w-2/3 mb-3 bg-[#D2691E]/10" />
            <div className="h-4 rounded-lg w-full bg-[#D2691E]/5" />
          </div>
        </div>
      ))}
    </div>
  );

  // Premium Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#D2691E]/10 to-[#CD853F]/5 flex items-center justify-center -rotate-3">
          <svg
            className="w-12 h-12 text-[#D2691E]/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
        </div>
        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#D2691E]/20 animate-float-slow" />
        <div className="absolute -bottom-1 -right-3 w-4 h-4 rounded-full bg-[#CD853F]/15 animate-float-slower" />
      </div>

      <h3 className="browse-title text-xl sm:text-2xl text-gradient-terracotta mb-2">
        {locale === "ka" ? "სპეციალისტები არ მოიძებნა" : "No professionals found"}
      </h3>
      <p className="text-sm sm:text-base text-[var(--color-text-secondary)] text-center max-w-md font-serif-italic">
        {locale === "ka"
          ? "სცადეთ სხვა ფილტრები ან კატეგორია სასურველი სპეციალისტის მოსაძებნად"
          : "Try adjusting your filters or explore different categories to find the right professional"}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="search-container relative">
        <div className="relative">
          {/* Search Input */}
          <div className="relative flex items-center">
            <div className="absolute left-4 text-[var(--color-text-tertiary)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                debouncedSearch(e.target.value, setSearchQuery);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchInput);
                }
              }}
              placeholder={locale === 'ka' ? 'მოძებნე სპეციალისტი სახელით ან #ტეგით...' : 'Search by name or #tag...'}
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] focus:border-[#D2691E] focus:ring-2 focus:ring-[#D2691E]/20 outline-none transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-4 p-1 rounded-full hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-2xl shadow-xl z-50 overflow-hidden">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="p-3 border-b border-[var(--color-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">
                      {locale === 'ka' ? 'ბოლო ძიებები' : 'Recent Searches'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, idx) => (
                      <div
                        key={idx}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-bg-tertiary)] hover:bg-[#D2691E]/10 cursor-pointer transition-colors"
                      >
                        <button
                          onClick={() => handleSearch(search)}
                          className="text-sm text-[var(--color-text-secondary)] group-hover:text-[#D2691E]"
                        >
                          {search.startsWith('#') && (
                            <span className="text-[#D2691E] font-medium">#</span>
                          )}
                          {search.startsWith('#') ? search.slice(1) : search}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(search);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-[var(--color-bg-secondary)] transition-all"
                        >
                          <svg className="w-3 h-3 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Suggestions */}
              <div className="p-3">
                <span className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 block">
                  {locale === 'ka' ? 'პოპულარული' : 'Popular'}
                </span>
                <div className="space-y-1">
                  {SEARCH_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion.key}
                      onClick={() => handleSearch(locale === 'ka' ? suggestion.ka : suggestion.en)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#D2691E]/10 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#D2691E]/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#D2691E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[#D2691E] transition-colors">
                        {locale === 'ka' ? suggestion.ka : suggestion.en}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search by Tag Hint */}
              <div className="px-4 py-3 bg-[#D2691E]/5 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                  <span className="px-1.5 py-0.5 rounded bg-[#D2691E]/20 text-[#D2691E] font-mono font-medium">#</span>
                  <span>{locale === 'ka' ? 'მოძებნე კონკრეტული სპეციალისტი ტეგით (მაგ: #100001)' : 'Search specific professional by tag (e.g. #100001)'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Search Tag */}
        {searchQuery && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-tertiary)]">
              {locale === 'ka' ? 'ძიება:' : 'Searching:'}
            </span>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D2691E]/10 border border-[#D2691E]/20">
              {searchQuery.startsWith('#') ? (
                <>
                  <span className="text-[#D2691E] font-medium">#</span>
                  <span className="text-sm font-medium text-[#D2691E]">{searchQuery.slice(1)}</span>
                </>
              ) : (
                <span className="text-sm font-medium text-[#D2691E]">{searchQuery}</span>
              )}
              <button
                onClick={clearSearch}
                className="p-0.5 rounded-full hover:bg-[#D2691E]/20 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-[#D2691E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      {!isLoading && results.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            <span className="font-semibold text-[#D2691E]">{totalCount}</span>
            {' '}
            {locale === 'ka' ? 'სპეციალისტი' : 'professionals'}
          </p>
        </div>
      )}

      {/* Results Grid */}
      {isLoading ? (
        <ProfessionalsSkeleton />
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {results.map((profile, index) => (
            <div
              key={profile._id}
              className="animate-stagger"
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
            >
              <ProCard
                profile={{
                  ...profile,
                  isLiked: likeStates[profile._id]?.isLiked ?? profile.isLiked,
                  likeCount: likeStates[profile._id]?.likeCount ?? profile.likeCount,
                }}
                onLike={() => handleProLike(profile._id)}
                showLikeButton={true}
                variant="compact"
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Infinite scroll loader */}
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
        {!hasMore && results.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)]">
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-[#D2691E]/20 to-transparent" />
            <span className="font-serif-italic">
              {locale === 'ka' ? 'ყველა სპეციალისტი ნაჩვენებია' : 'All professionals displayed'}
            </span>
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-[#D2691E]/20 to-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
