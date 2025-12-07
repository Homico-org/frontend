'use client';

import ArchitecturalBackground from '@/components/browse/ArchitecturalBackground';
import BrowseDecorations from '@/components/browse/BrowseDecorations';
import BrowseTabSwitcher from '@/components/browse/BrowseTabSwitcher';
import CategorySection from '@/components/browse/CategorySection';
import FeedSection from '@/components/browse/FeedSection';
import Header from '@/components/common/Header';
import JobCard from '@/components/common/JobCard';
import ProCard from '@/components/common/ProCard';
import Select from '@/components/common/Select';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useLikes } from '@/hooks/useLikes';
import { storage } from '@/services/storage';
import { LikeTargetType } from '@/types';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  location: string;
  areaSize?: number;
  sizeUnit?: string;
  roomCount?: number;
  budgetType: string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
  pricePerUnit?: number;
  deadline?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  images: string[];
  media: MediaItem[];
  proposalCount: number;
  viewCount: number;
  createdAt: string;
  clientId: {
    _id: string;
    name: string;
    avatar?: string;
    city?: string;
    accountType?: 'individual' | 'organization';
    companyName?: string;
  };
}

interface Proposal {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    category: string;
    location: string;
    budgetAmount?: number;
    budgetMin?: number;
    budgetMax?: number;
    budgetType: string;
    status: string;
    clientId: {
      name: string;
      avatar?: string;
    };
  };
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  proposedPrice: number;
  coverLetter: string;
  estimatedDuration: string;
  createdAt: string;
}

interface Company {
  _id: string;
  name: string;
  logo?: string;
  categories: string[];
  city?: string;
  avgRating?: number;
  completedJobs?: number;
}

interface Category {
  _id: string;
  key: string;
  name: string;
  nameKa: string;
  description?: string;
  descriptionKa?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { viewMode: userViewMode, isClientMode } = useViewMode();
  const { theme } = useTheme();

  // A pro user in client mode should see professionals (like a client would)
  // A pro user in pro mode should see jobs
  const isPro = user?.role === 'pro' && !isClientMode;
  const isCompany = user?.role === 'company';

  // Show professionals (not jobs) when user is client OR when pro is in client mode
  const showProfessionals = user?.role === 'client' || (user?.role === 'pro' && isClientMode);

  // Client tab state (professionals vs feed) - URL params first, then localStorage
  const [activeClientTab, setActiveClientTab] = useState<'professionals' | 'feed'>(() => {
    // Check URL first
    const urlTab = searchParams.get('tab');
    if (urlTab === 'professionals' || urlTab === 'feed') {
      return urlTab;
    }
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('browseActiveTab');
      if (saved === 'professionals' || saved === 'feed') {
        return saved;
      }
    }
    return 'professionals';
  });

  // Key to force FeedSection remount and reset internal state when switching tabs
  const [feedResetKey, setFeedResetKey] = useState(0);

  // Save tab preference to localStorage when switching (keep filters)
  const handleTabChange = useCallback((tab: 'professionals' | 'feed') => {
    setActiveClientTab(tab);
    localStorage.setItem('browseActiveTab', tab);
  }, []);

  // Likes hook for pro profiles
  const { toggleLike, initializeLikeStates, likeStates } = useLikes();

  // Initialize filters from URL params first, then localStorage as fallback
  const getInitialFilter = (paramKey: string, storageKey: string, defaultValue: string | null = null): string | null => {
    const urlValue = searchParams.get(paramKey);
    if (urlValue) return urlValue;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) return stored;
    }
    return defaultValue;
  };

  const [searchQuery, setSearchQuery] = useState(getInitialFilter('q', 'browse_searchQuery', '') || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(getInitialFilter('category', 'browse_category'));
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(getInitialFilter('subcategory', 'browse_subcategory'));
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState(getInitialFilter('sort', 'browse_sortBy', 'recommended') || 'recommended');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [selectedBudgetType, setSelectedBudgetType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => storage.getBrowseViewMode());
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Pro-specific state
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [activeProTab, setActiveProTab] = useState<'jobs' | 'proposals' | 'active'>('jobs');
  const [proposalFilter, setProposalFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [proViewMode, setProViewMode] = useState<'grid' | 'list'>(() => storage.getProViewMode());

  // Jobs pagination state (for pro users)
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsHasMore, setJobsHasMore] = useState(true);
  const [isLoadingMoreJobs, setIsLoadingMoreJobs] = useState(false);
  const [totalJobsCount, setTotalJobsCount] = useState(0);
  const [jobsInitialLoadComplete, setJobsInitialLoadComplete] = useState(false);
  const jobsLoaderRef = useRef<HTMLDivElement>(null);

  // Jobs filter state (for pro users)
  const [showFilters, setShowFilters] = useState(false);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [clientTypeFilter, setClientTypeFilter] = useState<string>('all');
  const [budgetMinFilter, setBudgetMinFilter] = useState<string>('');
  const [budgetMaxFilter, setBudgetMaxFilter] = useState<string>('');
  const [proposalMinFilter, setProposalMinFilter] = useState<string>('');
  const [proposalMaxFilter, setProposalMaxFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Company filter state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const userCategoriesJson = JSON.stringify(user?.selectedCategories || []);
  const userCategories = useMemo(() => JSON.parse(userCategoriesJson) as string[], [userCategoriesJson]);

  // Refs to prevent duplicate fetches (React Strict Mode causes double mount)
  const categoriesFetchedRef = useRef(false);
  const dbCategoriesFetchedRef = useRef(false);
  const proposalsFetchedRef = useRef(false);
  const profilesFetchingRef = useRef(false);

  useEffect(() => {
    setSortBy(isPro ? 'newest' : 'recommended');
  }, [isPro]);

  // Sync filters to URL and localStorage
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedSubcategory) params.set('subcategory', selectedSubcategory);
    if (sortBy && sortBy !== 'recommended') params.set('sort', sortBy);
    if (activeClientTab !== 'professionals') params.set('tab', activeClientTab);

    // Update URL without reload
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);

    // Save to localStorage
    if (searchQuery) localStorage.setItem('browse_searchQuery', searchQuery);
    else localStorage.removeItem('browse_searchQuery');

    if (selectedCategory) localStorage.setItem('browse_category', selectedCategory);
    else localStorage.removeItem('browse_category');

    if (selectedSubcategory) localStorage.setItem('browse_subcategory', selectedSubcategory);
    else localStorage.removeItem('browse_subcategory');

    if (sortBy) localStorage.setItem('browse_sortBy', sortBy);

    localStorage.setItem('browseActiveTab', activeClientTab);
  }, [searchQuery, selectedCategory, selectedSubcategory, sortBy, activeClientTab]);

  useEffect(() => {
    if (categoriesFetchedRef.current) return;
    categoriesFetchedRef.current = true;

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pro-profiles/categories`);
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isPro || dbCategoriesFetchedRef.current) return;
    dbCategoriesFetchedRef.current = true;

    const fetchDbCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
        const data = await response.json();
        setDbCategories(data);
      } catch (err) {
        console.error('Failed to fetch DB categories:', err);
      }
    };
    fetchDbCategories();
  }, [isPro]);

  useEffect(() => {
    if (!isPro || isAuthLoading || proposalsFetchedRef.current) return;
    proposalsFetchedRef.current = true;

    const fetchProposals = async () => {
      setIsLoadingProposals(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/my-proposals/list`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setProposals(data);
        }
      } catch (err) {
        console.error('Failed to fetch proposals:', err);
      } finally {
        setIsLoadingProposals(false);
      }
    };

    fetchProposals();
  }, [isPro, isAuthLoading]);

  useEffect(() => {
    if (isPro || !selectedCategory) {
      setCompanies([]);
      setSelectedCompanies([]);
      return;
    }

    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/companies?category=${encodeURIComponent(selectedCategory)}&limit=20`
        );
        if (response.ok) {
          const result = await response.json();
          setCompanies(result.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch companies:', err);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
    setSelectedCompanies([]);
  }, [selectedCategory, isPro]);

  useEffect(() => {
    setPage(1);
    setResults([]);
    setHasMore(true);
    setInitialLoadComplete(false);
    // Also reset jobs when switching modes
    setJobs([]);
    setJobsPage(1);
    setJobsHasMore(true);
    setJobsInitialLoadComplete(false);
  }, [searchQuery, selectedCategory, selectedSubcategory, minRating, priceRange, sortBy, selectedCompanies, isClientMode]);

  const fetchProfiles = useCallback(async (pageNum: number, append: boolean = false) => {
    // Fetch profiles when NOT in pro mode (i.e., client or pro-in-client-mode)
    if (isAuthLoading || isPro) return;

    // Prevent duplicate fetches
    if (profilesFetchingRef.current) return;
    profilesFetchingRef.current = true;

    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
      if (minRating > 0) params.append('minRating', minRating.toString());
      if (priceRange[0] > 0) params.append('minPrice', priceRange[0].toString());
      if (priceRange[1] < 1000) params.append('maxPrice', priceRange[1].toString());
      if (sortBy) params.append('sort', sortBy);
      if (selectedCompanies.length > 0) params.append('companyIds', selectedCompanies.join(','));
      params.append('page', pageNum.toString());
      params.append('limit', '12');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pro-profiles?${params}`);
      if (response.ok) {
        const result = await response.json();
        if (append) {
          setResults(prev => [...prev, ...result.data]);
        } else {
          setResults(result.data);
        }
        setHasMore(result.pagination.hasMore);
        setTotalCount(result.pagination.total);

        // Initialize like states from server data
        const likeStatesFromServer: Record<string, { isLiked: boolean; likeCount: number }> = {};
        result.data.forEach((profile: any) => {
          if (profile._id) {
            likeStatesFromServer[profile._id] = {
              isLiked: profile.isLiked || false,
              likeCount: profile.likeCount || 0,
            };
          }
        });
        initializeLikeStates(likeStatesFromServer);
      } else {
        // Stop pagination on error response
        setHasMore(false);
        if (!append) {
          setResults([]);
          setTotalCount(0);
        }
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
      // Stop pagination on network error
      setHasMore(false);
      if (pageNum === 1) {
        setResults([]);
        setTotalCount(0);
      }
    } finally {
      profilesFetchingRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
      if (pageNum === 1) {
        setTimeout(() => setInitialLoadComplete(true), 500);
      }
    }
  }, [searchQuery, selectedCategory, selectedSubcategory, minRating, priceRange, sortBy, selectedCompanies, isAuthLoading, isPro, initializeLikeStates]);

  // Handle like toggle for pro profiles
  const handleProLike = async (profileId: string) => {
    if (!isAuthenticated) return;

    const currentState = likeStates[profileId] || { isLiked: false, likeCount: 0 };
    const newState = await toggleLike(LikeTargetType.PRO_PROFILE, profileId, currentState);

    // Update local results state
    setResults((prev) =>
      prev.map((profile) =>
        profile._id === profileId
          ? { ...profile, isLiked: newState.isLiked, likeCount: newState.likeCount }
          : profile
      )
    );
  };

  useEffect(() => {
    // Fetch profiles when NOT in pro mode
    if (isAuthLoading || isPro) return;
    fetchProfiles(1, false);
  }, [fetchProfiles, isAuthLoading, isPro, isClientMode]);

  useEffect(() => {
    if (isPro || !initialLoadComplete) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setPage(prev => {
            const nextPage = prev + 1;
            fetchProfiles(nextPage, true);
            return nextPage;
          });
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, isLoading, isLoadingMore, isPro, fetchProfiles, initialLoadComplete]);

  useEffect(() => {
    if (!isPro) return;
    setJobsPage(1);
    setJobs([]);
    setJobsHasMore(true);
    setJobsInitialLoadComplete(false);
  }, [searchQuery, selectedBudgetType, sortBy, isPro, userCategories, propertyTypeFilter, clientTypeFilter, budgetMinFilter, budgetMaxFilter, proposalMinFilter, proposalMaxFilter, dateFilter]);

  const fetchJobs = useCallback(async (pageNum: number, append: boolean = false) => {
    if (isAuthLoading || !isPro) return;

    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMoreJobs(true);
    }

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (userCategories.length > 0) {
        params.append('categories', userCategories.join(','));
      }
      if (selectedBudgetType !== 'all') {
        params.append('budgetType', selectedBudgetType);
      }

      if (propertyTypeFilter !== 'all') {
        params.append('propertyType', propertyTypeFilter);
      }
      if (clientTypeFilter !== 'all') {
        params.append('clientType', clientTypeFilter);
      }
      if (budgetMinFilter) {
        params.append('budgetMin', budgetMinFilter);
      }
      if (budgetMaxFilter) {
        params.append('budgetMax', budgetMaxFilter);
      }
      if (proposalMinFilter) {
        params.append('proposalCountMin', proposalMinFilter);
      }
      if (proposalMaxFilter) {
        params.append('proposalCountMax', proposalMaxFilter);
      }
      if (dateFilter !== 'all') {
        const now = new Date();
        let createdAfter: Date | null = null;
        if (dateFilter === 'today') {
          createdAfter = new Date(now.setHours(0, 0, 0, 0));
        } else if (dateFilter === 'week') {
          createdAfter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateFilter === 'month') {
          createdAfter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        if (createdAfter) {
          params.append('createdAfter', createdAfter.toISOString());
        }
      }

      params.append('page', pageNum.toString());
      params.append('limit', '6');
      params.append('sort', sortBy);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs?${params}`);
      if (response.ok) {
        const result = await response.json();
        let jobsData = result.data || result;

        if (selectedBudgetType !== 'all' && Array.isArray(jobsData)) {
          jobsData = jobsData.filter((job: Job) => job.budgetType === selectedBudgetType);
        }

        if (append) {
          setJobs(prev => [...prev, ...jobsData]);
        } else {
          setJobs(jobsData);
        }

        if (result.pagination) {
          setJobsHasMore(result.pagination.hasMore);
          setTotalJobsCount(result.pagination.total);
        } else {
          setJobsHasMore(false);
          setTotalJobsCount(jobsData.length);
        }
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMoreJobs(false);
      if (pageNum === 1) {
        setTimeout(() => setJobsInitialLoadComplete(true), 300);
      }
    }
  }, [searchQuery, selectedBudgetType, sortBy, isPro, userCategories, isAuthLoading, propertyTypeFilter, clientTypeFilter, budgetMinFilter, budgetMaxFilter, proposalMinFilter, proposalMaxFilter, dateFilter]);

  useEffect(() => {
    // Only fetch jobs when in pro mode (not client mode)
    if (isAuthLoading || !isPro) return;
    fetchJobs(1, false);
  }, [fetchJobs, isAuthLoading, isPro, isClientMode]);

  useEffect(() => {
    if (!isPro || !jobsInitialLoadComplete || activeProTab !== 'jobs') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && jobsHasMore && !isLoading && !isLoadingMoreJobs) {
          setJobsPage(prev => {
            const nextPage = prev + 1;
            fetchJobs(nextPage, true);
            return nextPage;
          });
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentLoader = jobsLoaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [jobsHasMore, isLoading, isLoadingMoreJobs, isPro, fetchJobs, jobsInitialLoadComplete, activeProTab]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setPriceRange([0, 1000]);
    setMinRating(0);
    setSelectedBudgetType('all');
    setSearchQuery('');
    setSelectedCompanies([]);
    setPropertyTypeFilter('all');
    setClientTypeFilter('all');
    setBudgetMinFilter('');
    setBudgetMaxFilter('');
    setProposalMinFilter('');
    setProposalMaxFilter('');
    setDateFilter('all');

    // Clear localStorage
    localStorage.removeItem('browse_searchQuery');
    localStorage.removeItem('browse_category');
    localStorage.removeItem('browse_subcategory');
    localStorage.removeItem('browse_sortBy');

    // Clear URL params
    window.history.replaceState({}, '', window.location.pathname);
  };

  const hasActiveFilters = propertyTypeFilter !== 'all' || clientTypeFilter !== 'all' || budgetMinFilter || budgetMaxFilter || proposalMinFilter || proposalMaxFilter || dateFilter !== 'all';

  const toggleCompany = (companyId: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const formatBudget = (job: Job) => {
    if (job.budgetType === 'fixed' && job.budgetAmount) {
      return `₾${job.budgetAmount.toLocaleString()}`;
    } else if (job.budgetType === 'per_sqm' && job.pricePerUnit) {
      const total = job.areaSize ? job.pricePerUnit * job.areaSize : null;
      if (total) {
        return `₾${total.toLocaleString()}`;
      }
      return `₾${job.pricePerUnit}/${t('postJob.sqm')}`;
    } else if (job.budgetType === 'range') {
      if (job.budgetMin && job.budgetMax) {
        return `₾${job.budgetMin.toLocaleString()} - ₾${job.budgetMax.toLocaleString()}`;
      }
      return t('jobs.negotiable');
    } else if (job.budgetType === 'negotiable') {
      return t('jobs.negotiable');
    }
    return t('jobs.notSpecified');
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return t('jobs.justNow');
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${t('jobs.minutesAgo')}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${t('jobs.hoursAgo')}`;
    return `${Math.floor(seconds / 86400)}${t('jobs.daysAgo')}`;
  };

  const proposalStats = useMemo(() => {
    const pending = proposals.filter(p => p.status === 'pending').length;
    const accepted = proposals.filter(p => p.status === 'accepted').length;
    const rejected = proposals.filter(p => p.status === 'rejected').length;
    return { total: proposals.length, pending, accepted, rejected };
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    if (proposalFilter === 'all') return proposals;
    return proposals.filter(p => p.status === proposalFilter);
  }, [proposals, proposalFilter]);

  const activeJobs = useMemo(() => {
    return proposals.filter(p => p.status === 'accepted' && p.jobId?.status === 'in_progress');
  }, [proposals]);

  const displayCount = isPro ? totalJobsCount : totalCount;

  if (isAuthLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <Header />

      {/* Pro Dashboard */}
      {isPro && (
        <div className="relative min-h-[calc(100vh-64px)]">
          {/* Premium architectural background with floating design elements */}
          <ArchitecturalBackground />
          <BrowseDecorations />

          {/* Navigation Bar */}
          <div className="sticky top-16 z-40 border-b" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-subtle)' }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between h-14 gap-2">
                {/* Tabs - scrollable on mobile */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
                  {[
                    { key: 'jobs', label: 'სამუშაოები', count: totalJobsCount || jobs.length },
                    { key: 'proposals', label: 'წინადადებები', count: proposalStats.pending },
                    { key: 'active', label: 'აქტიური', count: activeJobs.length },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveProTab(tab.key as any)}
                      className={`relative px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap touch-manipulation ${
                        activeProTab === tab.key
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        {tab.label}
                        {tab.count > 0 && (
                          <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                            activeProTab === tab.key
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </span>
                      {activeProTab === tab.key && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>

                {/* View toggle & Sort - Only show for Jobs tab */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {activeProTab === 'jobs' && (
                    <>
                      <div className="hidden sm:block w-48">
                        <Select
                          value={sortBy}
                          onChange={setSortBy}
                          size="sm"
                          variant="minimal"
                          options={[
                            { value: 'newest', label: 'უახლესი', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                            { value: 'budget-high', label: 'ბიუჯეტი ↓', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg> },
                            { value: 'budget-low', label: 'ბიუჯეტი ↑', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg> },
                            { value: 'proposals-low', label: 'ნაკლები წინადადება', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
                          ]}
                        />
                      </div>
                      <div className="flex items-center p-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                        <button
                          onClick={() => {
                            setProViewMode('list');
                            storage.setProViewMode('list');
                          }}
                          className={`p-2 sm:p-1.5 rounded-md transition-all touch-manipulation ${proViewMode === 'list' ? 'bg-white dark:bg-dark-elevated shadow-sm' : ''}`}
                        >
                          <svg className="w-4 h-4" style={{ color: proViewMode === 'list' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setProViewMode('grid');
                            storage.setProViewMode('grid');
                          }}
                          className={`p-2 sm:p-1.5 rounded-md transition-all touch-manipulation ${proViewMode === 'grid' ? 'bg-white dark:bg-dark-elevated shadow-sm' : ''}`}
                        >
                          <svg className="w-4 h-4" style={{ color: proViewMode === 'grid' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
            {/* Jobs Tab */}
            {activeProTab === 'jobs' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Search & Filters */}
                <div className="flex gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="სამუშაოს ძებნა..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 sm:pl-11 pr-4 py-3 rounded-xl border text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-3 sm:px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all touch-manipulation ${
                      showFilters || hasActiveFilters
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : ''
                    }`}
                    style={!showFilters && !hasActiveFilters ? {
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-secondary)'
                    } : {}}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="hidden sm:inline">ფილტრები</span>
                  </button>
                </div>

                {/* Mobile Sort Dropdown - visible only on mobile */}
                <div className="sm:hidden">
                  <Select
                    value={sortBy}
                    onChange={setSortBy}
                    size="sm"
                    options={[
                      { value: 'newest', label: 'უახლესი', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                      { value: 'budget-high', label: 'ბიუჯეტი ↓', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg> },
                      { value: 'budget-low', label: 'ბიუჯეტი ↑', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg> },
                      { value: 'proposals-low', label: 'ნაკლები წინადადება', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
                    ]}
                  />
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                  <div className="rounded-xl border p-4 sm:p-5" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-tertiary)' }}>ქონების ტიპი</label>
                        <Select
                          value={propertyTypeFilter}
                          onChange={setPropertyTypeFilter}
                          size="sm"
                          options={[
                            { value: 'all', label: 'ყველა', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
                            { value: 'apartment', label: 'ბინა', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
                            { value: 'house', label: 'სახლი', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
                            { value: 'office', label: 'ოფისი', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-tertiary)' }}>მაძიებელის ტიპი</label>
                        <Select
                          value={clientTypeFilter}
                          onChange={setClientTypeFilter}
                          size="sm"
                          options={[
                            { value: 'all', label: 'ნებისმიერი', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
                            { value: 'individual', label: 'კერძო', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
                            { value: 'organization', label: 'კომპანია', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-tertiary)' }}>თარიღი</label>
                        <Select
                          value={dateFilter}
                          onChange={setDateFilter}
                          size="sm"
                          options={[
                            { value: 'all', label: 'ნებისმიერი', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
                            { value: 'today', label: 'დღეს', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                            { value: 'week', label: '7 დღე', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
                            { value: 'month', label: '30 დღე', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-tertiary)' }}>ბიუჯეტი (მინ)</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="₾ მინ"
                          value={budgetMinFilter}
                          onChange={(e) => setBudgetMinFilter(e.target.value)}
                          className="w-full px-3 py-2.5 sm:py-2 rounded-lg border text-base sm:text-sm"
                          style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-tertiary)' }}>ბიუჯეტი (მაქს)</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="₾ მაქს"
                          value={budgetMaxFilter}
                          onChange={(e) => setBudgetMaxFilter(e.target.value)}
                          className="w-full px-3 py-2.5 sm:py-2 rounded-lg border text-base sm:text-sm"
                          style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-tertiary)' }}>წინადადებები (მაქს)</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="მაგ. 5"
                          value={proposalMaxFilter}
                          onChange={(e) => setProposalMaxFilter(e.target.value)}
                          className="w-full px-3 py-2.5 sm:py-2 rounded-lg border text-base sm:text-sm"
                          style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-primary)' }}
                        />
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <div className="mt-4 pt-4 border-t flex justify-end" style={{ borderColor: 'var(--color-border-subtle)' }}>
                        <button onClick={clearFilters} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
                          გასუფთავება
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Jobs Grid/List */}
                {isLoading ? (
                  <div className={proViewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5' : 'space-y-3 sm:space-y-4'}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                        <div className="aspect-[4/3] rounded-t-2xl" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                        <div className="p-3 sm:p-4">
                          <div className="h-5 rounded-lg w-3/4 mb-3" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                          <div className="h-4 rounded-lg w-1/2" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : jobs.length > 0 ? (
                  <div className={proViewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5' : 'space-y-3 sm:space-y-4'}>
                    {jobs.map((job) => (
                      <JobCard
                        key={job._id}
                        job={job}
                        variant={proViewMode === 'grid' ? 'compact' : 'list'}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState isPro={isPro} onClear={clearFilters} userCategories={userCategories} />
                )}

                {/* Infinite scroll loader */}
                {jobs.length > 0 && (
                  <div ref={jobsLoaderRef} className="py-8">
                    {isLoadingMoreJobs && (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>იტვირთება...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Proposals Tab */}
            {activeProTab === 'proposals' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Filter pills - scrollable on mobile */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
                  {[
                    { key: 'all', label: 'ყველა' },
                    { key: 'pending', label: 'მოლოდინში' },
                    { key: 'accepted', label: 'მიღებული' },
                    { key: 'rejected', label: 'უარყოფილი' }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setProposalFilter(filter.key as any)}
                      className={`px-3 py-2 sm:py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap touch-manipulation ${
                        proposalFilter === filter.key
                          ? 'bg-emerald-500 text-white'
                          : ''
                      }`}
                      style={proposalFilter !== filter.key ? {
                        backgroundColor: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-secondary)'
                      } : {}}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Proposals list */}
                {isLoadingProposals ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="rounded-xl border p-3 sm:p-4 animate-pulse" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
                        <div className="h-5 rounded-lg w-2/3 mb-2" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                        <div className="h-4 rounded-lg w-1/3" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                      </div>
                    ))}
                  </div>
                ) : filteredProposals.length > 0 ? (
                  <div className="space-y-3">
                    {filteredProposals.map((proposal) => (
                      <Link
                        key={proposal._id}
                        href={`/jobs/${proposal.jobId?._id}`}
                        className="group block rounded-xl border p-3 sm:p-4 hover:border-emerald-500/30 transition-all active:scale-[0.99]"
                        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 sm:truncate" style={{ color: 'var(--color-text-primary)' }}>
                                {proposal.jobId?.title}
                              </h3>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-md flex-shrink-0 ${
                                proposal.status === 'pending' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                                proposal.status === 'accepted' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                                'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                              }`}>
                                {proposal.status === 'pending' ? 'მოლოდინში' : proposal.status === 'accepted' ? 'მიღებული' : 'უარყოფილი'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                              <span>{proposal.jobId?.clientId?.name}</span>
                              <span className="hidden sm:inline">·</span>
                              <span>{proposal.jobId?.location}</span>
                              <span className="hidden sm:inline">·</span>
                              <span>{getTimeAgo(proposal.createdAt)}</span>
                            </div>
                          </div>
                          <div className="font-semibold text-right sm:text-left" style={{ color: 'var(--color-text-primary)' }}>
                            ₾{proposal.proposedPrice?.toLocaleString()}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                      <svg className="w-7 h-7" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm mb-3" style={{ color: 'var(--color-text-tertiary)' }}>წინადადებები არ არის</p>
                    <button onClick={() => setActiveProTab('jobs')} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
                      სამუშაოების ნახვა
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Active Jobs Tab */}
            {activeProTab === 'active' && (
              <div className="space-y-4 sm:space-y-6">
                {activeJobs.length > 0 ? (
                  <div className="space-y-3">
                    {activeJobs.map((proposal) => (
                      <Link
                        key={proposal._id}
                        href={`/jobs/${proposal.jobId?._id}`}
                        className="group block rounded-xl border p-3 sm:p-4 hover:border-emerald-500/30 transition-all active:scale-[0.99]"
                        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                              <h3 className="font-medium line-clamp-2 sm:truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                                {proposal.jobId?.title}
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                              <span>{proposal.jobId?.clientId?.name}</span>
                              <span className="hidden sm:inline">·</span>
                              <span>{proposal.jobId?.location}</span>
                            </div>
                          </div>
                          <div className="font-semibold text-right sm:text-left" style={{ color: 'var(--color-text-primary)' }}>
                            ₾{proposal.proposedPrice?.toLocaleString()}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                      <svg className="w-7 h-7" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm mb-3" style={{ color: 'var(--color-text-tertiary)' }}>აქტიური სამუშაოები არ არის</p>
                    <button onClick={() => setActiveProTab('jobs')} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
                      სამუშაოების ძებნა
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Client View */}
      {!isPro && (
        <div className="relative min-h-[calc(100vh-64px)]">
          {/* Premium architectural background with floating design elements */}
          <ArchitecturalBackground />
          <BrowseDecorations />

          <div className="max-w-6xl mx-auto px-4 sm:px-5 py-4 sm:py-8 relative z-10">
            {/* Hero Section - Compact on mobile */}
            <div className="mb-4 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div>
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {activeClientTab === 'professionals'
                      ? (t('browse.findSpecialist') || 'იპოვე სპეციალისტი')
                      : (locale === 'ka' ? 'აღმოაჩინე ნამუშევრები' : 'Discover Work')}
                  </h1>
                  <p className="text-xs sm:text-base hidden sm:block" style={{ color: 'var(--color-text-secondary)' }}>
                    {activeClientTab === 'professionals'
                      ? (t('browse.subtitle') || 'აღმოაჩინე გამოცდილი პროფესიონალები შენი პროექტისთვის')
                      : (locale === 'ka' ? 'დაათვალიერე დასრულებული პროექტები და პორტფოლიოები' : 'Browse completed projects and portfolios')}
                  </p>
                </div>

                {/* Quick Action Button - Category pill style (unselected) */}
                {user && (user.role === 'client' || (user.role === 'pro' && isClientMode)) && (
                  <Link
                    href="/my-jobs"
                    className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-250 ease-out border hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-secondary)',
                      borderColor: 'var(--color-border)',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    {/* Folder icon */}
                    <svg
                      className="w-[18px] h-[18px] flex-shrink-0"
                      style={{ color: '#0d6355' }}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M3 8C3 6.89543 3.89543 6 5 6H9L11 8H19C20.1046 8 21 8.89543 21 10V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V8Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 14H15"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="whitespace-nowrap">
                      {locale === 'ka' ? 'განცხადებები' : 'My Jobs'}
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Categories Section - shared between both tabs */}
            <div className="mb-3 sm:mb-5">
              <CategorySection
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setSelectedSubcategory(null);
                }}
                selectedSubcategory={selectedSubcategory}
                onSelectSubcategory={setSelectedSubcategory}
              />
            </div>

            {/* Tab Switcher - Below categories, full width */}
            <div className="mb-4 sm:mb-8">
              <BrowseTabSwitcher
                activeTab={activeClientTab}
                onTabChange={handleTabChange}
              />
            </div>

            {/* Professionals Tab Content */}
            {activeClientTab === 'professionals' && (
              <>
                {/* Search & Filters Bar */}
                <div className="flex flex-col gap-3 mb-5 sm:mb-6">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder={t('browse.searchPlaceholder') || 'სპეციალისტის ძებნა...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-12 pl-10 sm:pl-11 pr-4 rounded-xl border text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]/50 transition-all"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>

                  {/* Rating Filter Pills & Clear - horizontal scroll on mobile */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
                      <span className="text-xs font-medium px-1 sm:px-2 whitespace-nowrap flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                        {t('browse.rating') || 'რეიტინგი'}:
                      </span>
                      {[0, 4, 4.5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMinRating(rating)}
                          className={`h-9 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap touch-manipulation ${
                            minRating === rating
                              ? 'bg-[var(--color-accent)] text-white'
                              : ''
                          }`}
                          style={minRating !== rating ? {
                            backgroundColor: 'var(--color-bg-tertiary)',
                            color: 'var(--color-text-secondary)'
                          } : {}}
                        >
                          {rating === 0 ? (t('browse.all') || 'ყველა') : `${rating}+`}
                        </button>
                      ))}
                    </div>

                    {/* Clear Filters - Terracotta/Red color for visibility */}
                    {(selectedCategory || selectedSubcategory || minRating > 0 || searchQuery) && (
                      <button
                        onClick={clearFilters}
                        className="h-9 px-3 sm:px-4 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 flex-shrink-0 touch-manipulation bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="hidden sm:inline">{t('browse.clearFilters') || 'გასუფთავება'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Results Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-5 gap-2">
                  <p className="text-xs sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{totalCount}</span> {t('browse.specialists') || 'სპეციალისტი'}
                    {selectedCategory && (
                      <span className="inline-block ml-2 px-2 py-0.5 rounded-md text-xs" style={{ backgroundColor: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
                        {(() => {
                          const cat = CATEGORIES.find(c => c.key === selectedCategory);
                          return locale === 'ka' ? (cat?.nameKa || selectedCategory) : (cat?.name || selectedCategory);
                        })()}
                      </span>
                    )}
                    {selectedSubcategory && (
                      <span className="inline-block ml-1 px-2 py-0.5 rounded-md text-xs" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                        {(() => {
                          const cat = CATEGORIES.find(c => c.key === selectedCategory);
                          const sub = cat?.subcategories?.find(s => s.key === selectedSubcategory);
                          return locale === 'ka' ? (sub?.nameKa || selectedSubcategory) : (sub?.name || selectedSubcategory);
                        })()}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-28 sm:w-44">
                      <Select
                        value={sortBy}
                        onChange={setSortBy}
                        size="sm"
                        options={[
                          { value: 'recommended', label: locale === 'ka' ? 'რეკომენდ.' : 'Recommend.', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
                          { value: 'rating', label: locale === 'ka' ? 'რეიტინგი' : 'Rating', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> },
                          { value: 'newest', label: locale === 'ka' ? 'უახლესი' : 'Newest', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                        ]}
                      />
                    </div>
                    {/* View Mode Toggle */}
                    <div className="hidden sm:flex items-center p-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                      <button
                        onClick={() => {
                          setViewMode('list');
                          storage.setBrowseViewMode('list');
                        }}
                        className={`p-1.5 rounded-md transition-all touch-manipulation ${viewMode === 'list' ? 'bg-white dark:bg-dark-elevated shadow-sm' : ''}`}
                      >
                        <svg className="w-4 h-4" style={{ color: viewMode === 'list' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('grid');
                          storage.setBrowseViewMode('grid');
                        }}
                        className={`p-1.5 rounded-md transition-all touch-manipulation ${viewMode === 'grid' ? 'bg-white dark:bg-dark-elevated shadow-sm' : ''}`}
                      >
                        <svg className="w-4 h-4" style={{ color: viewMode === 'grid' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Results Grid */}
                {isLoading ? (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5' : 'space-y-3 sm:space-y-4'}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="rounded-2xl border p-4 sm:p-5 animate-pulse" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
                        <div className="flex items-center gap-3 sm:gap-4 mb-4">
                          <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                          <div className="flex-1">
                            <div className="h-5 rounded-lg w-3/4 mb-2" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                            <div className="h-4 rounded-lg w-1/2" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                          </div>
                        </div>
                        <div className="h-4 rounded-lg w-full mb-2" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                        <div className="h-4 rounded-lg w-2/3" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                      </div>
                    ))}
                  </div>
                ) : results.length > 0 ? (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5' : 'space-y-3 sm:space-y-4'}>
                    {results.map((profile, index) => (
                      <div
                        key={profile._id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
                      >
                        <ProCard
                          profile={{
                            ...profile,
                            isLiked: likeStates[profile._id]?.isLiked ?? profile.isLiked,
                            likeCount: likeStates[profile._id]?.likeCount ?? profile.likeCount,
                          }}
                          onLike={() => handleProLike(profile._id)}
                          showLikeButton={true}
                          variant={viewMode === 'grid' ? 'compact' : 'horizontal'}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState isPro={isPro} onClear={clearFilters} userCategories={userCategories} />
                )}

                {/* Infinite scroll loader */}
                <div ref={loaderRef} className="py-10">
                  {isLoadingMore && (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{t('common.loading') || 'იტვირთება...'}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Feed Tab Content */}
            {activeClientTab === 'feed' && (
              <FeedSection
                key={`feed-${feedResetKey}`}
                selectedCategory={selectedCategory}
              />
            )}
          </div>
        </div>
      )}

      {/* Floating Post Job Button - Show for clients and pros in client mode */}
      {user && (user.role === 'client' || (user.role === 'pro' && isClientMode)) && (
        <Link
          href="/post-job"
          className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex items-center justify-center gap-2 h-12 sm:h-11 w-12 sm:w-auto sm:px-5 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-emerald-500/30 transition-all hover:scale-105 touch-manipulation"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="hidden sm:inline font-medium text-sm">{t('menu.postJob')}</span>
        </Link>
      )}
    </div>
  );
}

function EmptyState({ isPro, onClear, userCategories = [] }: { isPro: boolean; onClear: () => void; userCategories?: string[] }) {
  if (isPro) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
          <svg className="w-8 h-8" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
          {userCategories.length > 0 ? 'სამუშაოები ვერ მოიძებნა' : 'პროფილი არ არის შევსებული'}
        </h3>
        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
          {userCategories.length > 0
            ? 'სცადეთ ფილტრების შეცვლა ან შემოხედეთ მოგვიანებით.'
            : 'დაამატეთ უნარები და კატეგორიები შესაბამისი სამუშაოების სანახავად.'
          }
        </p>
        <Link
          href="/pro/profile-setup"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all"
        >
          {userCategories.length > 0 ? 'უნარების განახლება' : 'პროფილის შევსება'}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
        <svg className="w-8 h-8" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
        სპეციალისტები ვერ მოიძებნა
      </h3>
      <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
        სცადეთ ფილტრების შეცვლა ან საძიებო სიტყვის განახლება.
      </p>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium border transition-all hover:border-emerald-500/50"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
      >
        ფილტრების გასუფთავება
      </button>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
