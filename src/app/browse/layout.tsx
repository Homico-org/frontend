"use client";

import BrowseFiltersSidebar from "@/components/browse/BrowseFiltersSidebar";
import JobsFiltersSidebar from "@/components/browse/JobsFiltersSidebar";
import Header, { HeaderSpacer } from "@/components/common/Header";
import MobileBottomNav from "@/components/common/MobileBottomNav";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { BrowseProvider, useBrowseContext } from "@/contexts/BrowseContext";
import { JobsProvider, useJobsContext } from "@/contexts/JobsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Briefcase,
  Filter,
  Images,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useEffect, useRef, useState } from "react";

function JobsSidebar() {
  const { filters, setFilters, savedJobIds } = useJobsContext();
  return (
    <JobsFiltersSidebar
      filters={filters}
      onFiltersChange={setFilters}
      savedCount={savedJobIds.size}
    />
  );
}

// Search input for Jobs tab
function JobsSearchInput() {
  const { t } = useLanguage();
  const { filters, setFilters } = useJobsContext();
  const [localSearch, setLocalSearch] = useState(filters.searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setLocalSearch(filters.searchQuery);
  }, [filters.searchQuery]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ ...filters, searchQuery: value });
    }, 300);
  };

  return (
    <div className="relative group">
      {/* Animated gradient border */}
      <div
        className={`absolute -inset-[1px] rounded-lg transition-opacity duration-300 ${isFocused ? "opacity-100" : "opacity-0"}`}
        style={{
          background: `linear-gradient(135deg, ${ACCENT_COLOR}, #E07B4F, ${ACCENT_COLOR})`,
          backgroundSize: "200% 200%",
          animation: isFocused ? "gradient-shift 3s ease infinite" : "none",
        }}
      />
      <div
        className={`relative flex items-center bg-white dark:bg-neutral-900 rounded-lg border transition-all duration-300 ${isFocused ? "border-transparent" : "border-neutral-200/80 dark:border-neutral-700/50"}`}
      >
        <div
          className={`flex items-center justify-center w-9 h-9 ml-0.5 rounded-md transition-all duration-300 ${isFocused ? "scale-105" : ""}`}
          style={{
            backgroundColor: isFocused ? `${ACCENT_COLOR}15` : "transparent",
            color: isFocused ? ACCENT_COLOR : "#9ca3af",
          }}
        >
          <Search className="w-[18px] h-[18px]" />
        </div>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t("browse.searchJobs")}
          className="flex-1 h-10 pr-9 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
        />
        {localSearch ? (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: `${ACCENT_COLOR}15`,
              color: ACCENT_COLOR,
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
            <kbd className="text-[10px] font-medium text-neutral-400">⌘K</kbd>
          </div>
        )}
      </div>
    </div>
  );
}

// Search input for Portfolio/Professionals tabs
function BrowseSearchInput({ placeholder }: { placeholder: string }) {
  const { searchQuery, setSearchQuery } = useBrowseContext();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  };

  return (
    <div className="relative group">
      {/* Animated gradient border */}
      <div
        className={`absolute -inset-[1px] rounded-lg transition-opacity duration-300 ${isFocused ? "opacity-100" : "opacity-0"}`}
        style={{
          background: `linear-gradient(135deg, ${ACCENT_COLOR}, #E07B4F, ${ACCENT_COLOR})`,
          backgroundSize: "200% 200%",
          animation: isFocused ? "gradient-shift 3s ease infinite" : "none",
        }}
      />
      <div
        className={`relative flex items-center bg-white dark:bg-neutral-900 rounded-lg border transition-all duration-300 ${isFocused ? "border-transparent" : "border-neutral-200/80 dark:border-neutral-700/50"}`}
      >
        <div
          className={`flex items-center justify-center w-9 h-9 ml-0.5 rounded-md transition-all duration-300 ${isFocused ? "scale-105" : ""}`}
          style={{
            backgroundColor: isFocused ? `${ACCENT_COLOR}15` : "transparent",
            color: isFocused ? ACCENT_COLOR : "#9ca3af",
          }}
        >
          <Search className="w-[18px] h-[18px]" />
        </div>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 h-10 pr-9 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
        />
        {localSearch ? (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: `${ACCENT_COLOR}15`,
              color: ACCENT_COLOR,
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
            <kbd className="text-[10px] font-medium text-neutral-400">⌘K</kbd>
          </div>
        )}
      </div>
    </div>
  );
}

// Tab configuration
const TABS = [
  {
    key: "jobs",
    route: "/browse/jobs",
    label: "Jobs",
    labelKa: "სამუშაო",
    labelRu: "Работы",
    icon: Briefcase,
    showFor: "pro" as const,
  },
  {
    key: "portfolio",
    route: "/browse/portfolio",
    label: "Portfolio",
    labelKa: "ნამუშევრები",
    labelRu: "Портфолио",
    icon: Images,
    showFor: "all" as const,
  },
  {
    key: "professionals",
    route: "/browse/professionals",
    label: "Professionals",
    labelKa: "სპეციალისტები",
    labelRu: "Специалисты",
    icon: Users,
    showFor: "all" as const,
  },
];

// Helper to count active filters for Jobs
function useJobsFilterCount() {
  const { filters } = useJobsContext();
  let count = 0;
  if (filters.category) count++;
  if (filters.subcategory) count++;
  if (filters.budgetMin !== null) count++;
  if (filters.budgetMax !== null) count++;
  if (filters.propertyType && filters.propertyType !== "all") count++;
  if (filters.location && filters.location !== "all") count++;
  if (filters.deadline && filters.deadline !== "all") count++;
  if (filters.showFavoritesOnly) count++;
  return count;
}

// Helper to count active filters for Browse (Portfolio/Professionals)
function useBrowseFilterCount(includeProOnlyFilters: boolean) {
  const {
    selectedCategory,
    selectedSubcategory,
    minRating,
    budgetMin,
    budgetMax,
    selectedCity,
    selectedBudget,
  } = useBrowseContext();
  let count = 0;
  // Count category/subcategory as one filter (subcategory implies category)
  if (selectedSubcategory) {
    count++;
  } else if (selectedCategory) {
    count++;
  }
  if (includeProOnlyFilters && minRating > 0) count++;
  if (includeProOnlyFilters && (budgetMin !== null || budgetMax !== null)) count++; // Count budget range as one filter
  if (selectedCity && selectedCity !== "tbilisi") count++;
  if (selectedBudget && selectedBudget !== "all") count++;
  return count;
}

// Filter button with badge
function FilterButton({
  onClick,
  filterCount,
}: {
  onClick: () => void;
  filterCount: number;
}) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
      style={
        filterCount > 0
          ? { borderColor: ACCENT_COLOR, color: ACCENT_COLOR }
          : {}
      }
    >
      <Filter className="w-5 h-5" />
      {filterCount > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          {filterCount}
        </span>
      )}
    </button>
  );
}

// Wrapper components to access context for filter count
function JobsFilterButton({ onClick }: { onClick: () => void }) {
  const filterCount = useJobsFilterCount();
  return <FilterButton onClick={onClick} filterCount={filterCount} />;
}

function BrowseFilterButton({
  onClick,
  includeProOnlyFilters,
}: {
  onClick: () => void;
  includeProOnlyFilters: boolean;
}) {
  const filterCount = useBrowseFilterCount(includeProOnlyFilters);
  return <FilterButton onClick={onClick} filterCount={filterCount} />;
}

function BrowseLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const isPro = user?.role === "pro" || user?.role === "admin";
  const isJobsPage = pathname.includes("/browse/jobs");
  const isProfessionalsPage = pathname.includes("/browse/professionals");

  // Determine active tab
  const activeTab = isJobsPage
    ? "jobs"
    : pathname.includes("/browse/portfolio")
      ? "portfolio"
      : "professionals";

  // Get visible tabs based on user role
  const visibleTabs = TABS.filter(
    (tab) => tab.showFor === "all" || (tab.showFor === "pro" && isPro)
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only redirect /browse to the default page based on user role
  useEffect(() => {
    if (pathname === "/browse" && !isAuthLoading) {
      if (isPro) {
        router.replace("/browse/jobs");
      } else {
        router.replace("/browse/portfolio");
      }
    }
  }, [pathname, router, isPro, isAuthLoading]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#fafafa] dark:bg-[#0a0a0a] max-w-full">
      {/* Header */}
      <Header />
      <HeaderSpacer />

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar - Matching design exactly */}
        <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a]">
          {/* Post a Job Button */}
          <div className="px-3 pt-4 pb-2">
            <Link
              href="/post-job"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: ACCENT_COLOR }}
            >
              <Plus className="w-4 h-4" />
              <span>{t("browse.postAJob")}</span>
            </Link>
          </div>

          {/* BROWSE Label */}
          <div className="px-5 pt-3 pb-2">
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
              {t("browse.browse")}
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="px-3 pb-4">
            <nav className="space-y-1">
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.key}
                    href={tab.route}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? ""
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: `${ACCENT_COLOR}15`,
                            color: ACCENT_COLOR,
                          }
                        : {}
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>
                      {locale === "ka"
                        ? tab.labelKa
                        : locale === "ru"
                          ? tab.labelRu
                          : tab.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Filters Section */}
          <div className="flex-1 overflow-y-auto border-t border-neutral-100 dark:border-neutral-800">
            {isJobsPage ? (
              <JobsSidebar />
            ) : (
              <BrowseFiltersSidebar
                showSearch={false}
                showRatingFilter={isProfessionalsPage}
                showBudgetFilter={isProfessionalsPage}
              />
            )}
          </div>
        </aside>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-white dark:bg-neutral-950">
          {/* Mobile Sticky Search Bar */}
          <div className="lg:hidden sticky top-0 z-20 bg-white dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                {isJobsPage ? (
                  <JobsSearchInput />
                ) : isProfessionalsPage ? (
                  <BrowseSearchInput
                    placeholder={t("browse.searchProfessionals")}
                  />
                ) : (
                  <BrowseSearchInput
                    placeholder={t("browse.searchPortfolio")}
                  />
                )}
              </div>
              {/* Mobile Filter Button with Badge */}
              {isJobsPage ? (
                <JobsFilterButton onClick={() => setShowMobileFilters(true)} />
              ) : (
                <BrowseFilterButton
                  onClick={() => setShowMobileFilters(true)}
                  includeProOnlyFilters={isProfessionalsPage}
                />
              )}
            </div>
          </div>

          <div className="p-3 sm:p-4 lg:p-6">
            <div
              className={`max-w-[1600px] mx-auto ${mounted ? "animate-fade-in" : "opacity-0"}`}
            >
              {/* Desktop Search Bar - not sticky */}
              <div className="hidden lg:block mb-4 sm:mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 max-w-xl">
                    {isJobsPage ? (
                      <JobsSearchInput />
                    ) : isProfessionalsPage ? (
                      <BrowseSearchInput
                        placeholder={t("browse.searchProfessionals")}
                      />
                    ) : (
                      <BrowseSearchInput
                        placeholder={t("browse.searchPortfolio")}
                      />
                    )}
                  </div>
                </div>
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[80vw] bg-white dark:bg-[#0a0a0a] shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
                {t("common.filters")}
              </h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100%-52px)]">
              {isJobsPage ? (
                <JobsSidebar />
              ) : (
                <BrowseFiltersSidebar
                  showSearch={false}
                  showRatingFilter={isProfessionalsPage}
                  showBudgetFilter={isProfessionalsPage}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BrowseLayoutWithParams({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isJobsPage = pathname.includes("/browse/jobs");

  const content = (
    <BrowseProvider
      initialCategory={searchParams.get("category")}
      initialSubcategory={searchParams.get("subcategory")}
    >
      <BrowseLayoutContent>{children}</BrowseLayoutContent>
    </BrowseProvider>
  );

  // Wrap with JobsProvider if on jobs page
  if (isJobsPage) {
    return <JobsProvider>{content}</JobsProvider>;
  }

  return content;
}

export default function BrowseLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
          <LoadingSpinner size="lg" color={ACCENT_COLOR} />
        </div>
      }
    >
      <BrowseLayoutWithParams>{children}</BrowseLayoutWithParams>
    </Suspense>
  );
}
