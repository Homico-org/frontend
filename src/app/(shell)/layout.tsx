"use client";

import BrowseFiltersSidebar from "@/components/browse/BrowseFiltersSidebar";
import JobsFiltersSidebar from "@/components/browse/JobsFiltersSidebar";
import Header, { HeaderSpacer } from "@/components/common/Header";
import MobileBottomNav from "@/components/common/MobileBottomNav";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { BrowseProvider, useBrowseContext } from "@/contexts/BrowseContext";
import { JobsProvider, useJobsContext } from "@/contexts/JobsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Facebook,
  FileText,
  Filter,
  Hammer,
  HelpCircle,
  Images,
  Mail,
  Plus,
  Search,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useEffect, useMemo, useRef, useState } from "react";

// Sidebar width constants
const SIDEBAR_EXPANDED_WIDTH = 256; // 16rem
const SIDEBAR_COLLAPSED_WIDTH = 56;

type TabShowFor = "all" | "pro" | "client" | "auth";

type TabKey = "jobs" | "portfolio" | "professionals";

const TABS: Array<{
  key: TabKey;
  route: string;
  label: string;
  labelKa: string;
  labelRu: string;
  icon: typeof Briefcase;
  showFor: TabShowFor;
}> = [
  {
    key: "jobs",
    route: "/jobs",
    label: "Jobs",
    labelKa: "სამუშაო",
    labelRu: "Работы",
    icon: Briefcase,
    showFor: "pro" as const,
  },
  {
    key: "portfolio",
    route: "/portfolio",
    label: "Portfolio",
    labelKa: "ნამუშევრები",
    labelRu: "Портфолио",
    icon: Images,
    showFor: "all" as const,
  },
  {
    key: "professionals",
    route: "/professionals",
    label: "Professionals",
    labelKa: "სპეციალისტები",
    labelRu: "Специалисты",
    icon: Users,
    showFor: "all" as const,
  },
];

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

function useBrowseFilterCount(includeProOnlyFilters: boolean) {
  const {
    selectedCategory,
    selectedSubcategories,
    minRating,
    budgetMin,
    budgetMax,
    selectedCity,
    selectedBudget,
  } = useBrowseContext();

  let count = 0;
  if (selectedSubcategories.length > 0) {
    count += selectedSubcategories.length;
  } else if (selectedCategory) {
    count++;
  }
  if (includeProOnlyFilters && minRating > 0) count++;
  if (includeProOnlyFilters && (budgetMin !== null || budgetMax !== null)) count++;
  if (selectedCity && selectedCity !== "all") count++;
  if (
    selectedBudget &&
    selectedBudget !== "all" &&
    selectedBudget !== "common.all"
  )
    count++;
  return count;
}

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
    <div className="relative w-full">
      <div
        className={`relative flex items-center w-full h-11 rounded-xl border transition-all ${
          isFocused
            ? "border-[#C4735B]/40 ring-2 ring-[#C4735B]/10"
            : "border-neutral-200 dark:border-neutral-800"
        } bg-white dark:bg-neutral-900`}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
          <Search className="w-[18px] h-[18px]" />
        </div>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t("browse.searchJobs")}
          className="flex-1 h-10 pr-9 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none pl-10"
        />
        {localSearch ? (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

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
    <div className="relative w-full">
      <div
        className={`relative flex items-center w-full h-11 rounded-xl border transition-all ${
          isFocused
            ? "border-[#C4735B]/40 ring-2 ring-[#C4735B]/10"
            : "border-neutral-200 dark:border-neutral-800"
        } bg-white dark:bg-neutral-900`}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
          <Search className="w-[18px] h-[18px]" />
        </div>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 h-10 pr-9 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none pl-10"
        />
        {localSearch ? (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MobileFilterButton({
  onClick,
  filterCount,
}: {
  onClick: () => void;
  filterCount: number;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-10 h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
      style={filterCount > 0 ? { borderColor: ACCENT_COLOR, color: ACCENT_COLOR } : {}}
      aria-label="Open filters"
      title="Filters"
    >
      <Filter className="w-4 h-4" />
      {filterCount > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full border-2 border-white dark:border-neutral-950"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          {filterCount}
        </span>
      )}
    </button>
  );
}

function DesktopFilterButton({
  isActive,
  onToggle,
  filterCount,
  label,
}: {
  isActive: boolean;
  onToggle: () => void;
  filterCount: number;
  label: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative flex items-center gap-2 px-3 h-11 rounded-xl border transition-colors ${
        isActive
          ? "border-[#C4735B]/40 bg-[#C4735B]/5"
          : filterCount > 0
            ? "border-[#C4735B]/40 bg-[#C4735B]/5"
            : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
      }`}
      style={isActive || filterCount > 0 ? { color: ACCENT_COLOR } : {}}
    >
      <Filter className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
      {filterCount > 0 ? (
        <span
          className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white rounded-full"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          {filterCount}
        </span>
      ) : (
        <ChevronRight className="w-4 h-4 opacity-60" />
      )}
    </button>
  );
}

function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("shellSidebarCollapsed");
      if (stored === "1") setIsCollapsed(true);
    } catch {
      // ignore
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("shellSidebarCollapsed", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return { isCollapsed, toggleSidebar, isHydrated };
}

function ShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFiltersOverlay, setShowFiltersOverlay] = useState(false);
  const { isCollapsed, toggleSidebar, isHydrated } = useSidebarState();

  const isPro = user?.role === "pro" || user?.role === "admin";
  const isClient = user?.role === "client";
  const isAuthenticated = !!user;

  const isJobsPage = pathname.startsWith("/jobs");
  const isProfessionalsPage = pathname.startsWith("/professionals");
  const isPortfolioPage = pathname.startsWith("/portfolio");
  const isToolsPage = pathname === "/tools";
  const isToolsSubpage = pathname.startsWith("/tools/") && pathname !== "/tools";

  const isMyWorkPage = pathname.startsWith("/my-work");
  const isMyJobsPage = pathname.startsWith("/my-jobs");

  const activeTab: TabKey | null = isJobsPage
    ? "jobs"
    : isPortfolioPage
      ? "portfolio"
      : isProfessionalsPage
        ? "professionals"
        : isMyWorkPage || isMyJobsPage || pathname.startsWith("/settings") || pathname.startsWith("/tools")
          ? null
          : "portfolio";

  const visibleTabs = TABS.filter((tab) => {
    if (tab.showFor === "all") return true;
    if (tab.showFor === "auth") return isAuthenticated;
    if (tab.showFor === "pro") return isPro;
    if (tab.showFor === "client") return isClient;
    return false;
  });

  const pageHeader = useMemo(() => {
    if (isMyWorkPage) {
      return { icon: FileText, title: t("job.myWork"), subtitle: t("job.myWorkSubtitle") };
    }
    if (isMyJobsPage) {
      return { icon: Hammer, title: t("job.myJobs"), subtitle: t("job.myJobsSubtitle") };
    }
    if (isJobsPage) {
      return { icon: Briefcase, title: t("browse.jobs"), subtitle: t("browse.jobsSubtitle") };
    }
    if (isPortfolioPage) {
      return { icon: Images, title: t("browse.portfolio"), subtitle: t("browse.portfolioSubtitle") };
    }
    if (isProfessionalsPage) {
      return { icon: Users, title: t("browse.professionals"), subtitle: t("browse.professionalsSubtitle") };
    }
    if (pathname.startsWith("/tools")) {
      return { icon: Wrench, title: t("tools.home.title"), subtitle: t("tools.home.subtitle") };
    }
    return { icon: Users, title: t("browse.title"), subtitle: undefined };
  }, [isJobsPage, isPortfolioPage, isProfessionalsPage, isMyJobsPage, isMyWorkPage, pathname, t]);

  const HeaderIcon = pageHeader.icon;

  const showHeaderRow = !isToolsSubpage; // tool subpages already have their own PageHeader
  const showSearchFilters = !isToolsSubpage && !isToolsPage && !isMyJobsPage && !isMyWorkPage;

  const jobsFilterCount = useJobsFilterCount();
  const browseFilterCount = useBrowseFilterCount(isProfessionalsPage);
  const filterCount = isJobsPage ? jobsFilterCount : browseFilterCount;

  useEffect(() => setMounted(true), []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#fafafa] dark:bg-[#0a0a0a] max-w-full">
      <Header />
      <HeaderSpacer />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className="hidden lg:flex flex-col flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] transition-all duration-300 ease-in-out relative"
          style={{
            width: isHydrated
              ? isCollapsed
                ? SIDEBAR_COLLAPSED_WIDTH
                : SIDEBAR_EXPANDED_WIDTH
              : SIDEBAR_EXPANDED_WIDTH,
          }}
        >
          <div className={`pt-4 pb-3 ${isCollapsed ? "px-2" : "px-3"}`}>
            <nav className="space-y-1">
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.key}
                    href={tab.route}
                    className={`flex items-center text-sm font-medium transition-all ${
                      isCollapsed ? "justify-center px-2 py-2.5 rounded-xl" : "gap-3 px-3 py-2.5 rounded-xl"
                    } ${
                      isActive
                        ? "text-white shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                    style={isActive ? { backgroundColor: ACCENT_COLOR } : {}}
                    title={isCollapsed ? (locale === "ka" ? tab.labelKa : locale === "ru" ? tab.labelRu : tab.label) : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span>
                        {locale === "ka" ? tab.labelKa : locale === "ru" ? tab.labelRu : tab.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Post Job — visually separated */}
          <div className={`pb-3 ${isCollapsed ? "px-2" : "px-3"}`}>
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
              <Link
                href="/post-job"
                className={`group flex items-center justify-center border-2 border-dashed transition-all ${
                  isCollapsed
                    ? "w-10 h-10 rounded-xl mx-auto"
                    : "w-full gap-2 py-2.5 rounded-xl"
                } hover:border-solid hover:shadow-md`}
                style={{
                  borderColor: ACCENT_COLOR,
                  color: ACCENT_COLOR,
                }}
                title={isCollapsed ? t("browse.postAJob") : undefined}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = ACCENT_COLOR;
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = ACCENT_COLOR;
                }}
              >
                <Plus className="w-4 h-4 flex-shrink-0 transition-transform group-hover:rotate-90" />
                {!isCollapsed && <span className="text-sm font-semibold">{t("browse.postAJob")}</span>}
              </Link>
            </div>
          </div>

          {/* Footer area (My pages + Support + Social) */}
          <div className={`mt-auto pb-4 ${isCollapsed ? "px-2" : "px-3"}`}>
            {isAuthenticated && (
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5">
                {isPro && (
                  <Link
                    href="/my-work"
                    className={`flex items-center text-sm font-medium transition-all border ${
                      isCollapsed
                        ? "justify-center px-2 py-2.5 rounded-xl"
                        : "gap-3 px-3 py-2.5 rounded-xl"
                    } ${
                      pathname.startsWith("/my-work")
                        ? "border-[#C4735B]/30 shadow-sm"
                        : "border-neutral-200/80 dark:border-neutral-700/60 hover:border-[#C4735B]/30"
                    }`}
                    style={
                      pathname.startsWith("/my-work")
                        ? { backgroundColor: `${ACCENT_COLOR}12`, color: ACCENT_COLOR }
                        : { backgroundColor: 'rgba(249,248,247,0.6)' }
                    }
                    title={isCollapsed ? t("header.myWork") : undefined}
                  >
                    <FileText className="w-4.5 h-4.5" style={pathname.startsWith("/my-work") ? { color: ACCENT_COLOR } : { color: '#9ca3af' }} />
                    {!isCollapsed && (
                      <span className={pathname.startsWith("/my-work") ? "" : "text-neutral-700 dark:text-neutral-300"}>
                        {t("header.myWork")}
                      </span>
                    )}
                  </Link>
                )}

                <Link
                  href="/my-jobs"
                  className={`flex items-center text-sm font-medium transition-all border ${
                    isCollapsed
                      ? "justify-center px-2 py-2.5 rounded-xl"
                      : "gap-3 px-3 py-2.5 rounded-xl"
                  } ${
                    pathname.startsWith("/my-jobs")
                      ? "border-[#C4735B]/30 shadow-sm"
                      : "border-neutral-200/80 dark:border-neutral-700/60 hover:border-[#C4735B]/30"
                  }`}
                  style={
                    pathname.startsWith("/my-jobs")
                      ? { backgroundColor: `${ACCENT_COLOR}12`, color: ACCENT_COLOR }
                      : { backgroundColor: 'rgba(249,248,247,0.6)' }
                  }
                  title={isCollapsed ? t("header.myJobs") : undefined}
                >
                  <Hammer className="w-4.5 h-4.5" style={pathname.startsWith("/my-jobs") ? { color: ACCENT_COLOR } : { color: '#9ca3af' }} />
                  {!isCollapsed && (
                    <span className={pathname.startsWith("/my-jobs") ? "" : "text-neutral-700 dark:text-neutral-300"}>
                      {t("header.myJobs")}
                    </span>
                  )}
                </Link>

                <Link
                  href="/settings"
                  className={`flex items-center text-sm font-medium transition-all ${
                    isCollapsed
                      ? "justify-center px-2 py-2.5 rounded-xl"
                      : "gap-3 px-3 py-2.5 rounded-xl"
                  } ${
                    pathname.startsWith("/settings")
                      ? "text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                  style={
                    pathname.startsWith("/settings")
                      ? { backgroundColor: ACCENT_COLOR }
                      : {}
                  }
                  title={isCollapsed ? t("settings.title") : undefined}
                >
                  <Settings className="w-5 h-5" />
                  {!isCollapsed && <span>{t("settings.title")}</span>}
                </Link>
              </div>
            )}

            <div
              className={`${
                isAuthenticated ? "mt-3 pt-3" : "pt-3"
              } border-t border-neutral-100 dark:border-neutral-800 space-y-1`}
            >
              {isCollapsed ? (
                <div className="flex flex-col items-center gap-1.5">
                  <Link
                    href="/help"
                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    title={t("help.categories.support")}
                  >
                    <HelpCircle className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                  </Link>
                  <a
                    href="mailto:info@homico.ge"
                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    aria-label="Email support"
                    title="info@homico.ge"
                  >
                    <Mail className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61585402505170"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    aria-label="Facebook"
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 px-1">
                  <Link
                    href="/help"
                    className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                    <span>{t("help.categories.support")}</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <a
                      href="mailto:info@homico.ge"
                      className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                      aria-label="Email support"
                      title="info@homico.ge"
                    >
                      <Mail className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                    </a>
                    <a
                      href="https://www.facebook.com/profile.php?id=61585402505170"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                      aria-label="Facebook"
                      title="Facebook"
                    >
                      <Facebook className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" style={{ color: ACCENT_COLOR }} />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 text-neutral-500" />
            )}
          </button>
        </aside>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-white dark:bg-neutral-950">
          {/* Mobile Sticky Tabs - only show when logged in */}
          {isAuthenticated && <div className="lg:hidden sticky top-0 z-20 bg-white dark:bg-neutral-950">
            <div className="flex items-stretch border-b border-neutral-200 dark:border-neutral-800">
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.key}
                    href={tab.route}
                    className={`flex items-center justify-center gap-1.5 flex-1 py-3 text-xs font-semibold whitespace-nowrap transition-colors relative ${
                      isActive
                        ? "text-[#C4735B]"
                        : "text-neutral-400 dark:text-neutral-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>
                      {locale === "ka" ? tab.labelKa : locale === "ru" ? tab.labelRu : tab.label}
                    </span>
                    <span
                      className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full transition-colors"
                      style={{ backgroundColor: isActive ? ACCENT_COLOR : 'transparent' }}
                    />
                  </Link>
                );
              })}
            </div>
          </div>}

          {/* Mobile Header Row & Search (below sticky tabs) */}
          <div className="lg:hidden">
            {showHeaderRow && (
              <div className="px-3 pt-3 pb-1">
                <div className="flex items-start gap-2">
                  <HeaderIcon className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h1 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                      {pageHeader.title}
                    </h1>
                    {pageHeader.subtitle && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {pageHeader.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showSearchFilters && (
              <div className="flex items-center gap-2 px-3 pt-2 pb-3">
                <div className="flex-1">
                  {isJobsPage ? (
                    <JobsSearchInput />
                  ) : isProfessionalsPage ? (
                    <BrowseSearchInput placeholder={t("browse.searchProfessionals")} />
                  ) : (
                    <BrowseSearchInput placeholder={t("browse.searchPortfolio")} />
                  )}
                </div>
                <MobileFilterButton
                  onClick={() => setShowMobileFilters(true)}
                  filterCount={filterCount}
                />
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 lg:p-6">
            <div className={`max-w-[1600px] mx-auto ${mounted ? "animate-fade-in" : "opacity-0"}`}>
              {showHeaderRow && (
                <PageHeader
                  icon={pageHeader.icon}
                  title={pageHeader.title}
                  subtitle={pageHeader.subtitle}
                  bordered={false}
                  variant="transparent"
                  containerClassName="px-0 py-0"
                  contentClassName="max-w-none"
                  className="hidden lg:block mb-4 sm:mb-5"
                />
              )}

              {showSearchFilters && (
                <div className="hidden lg:block mb-4 sm:mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-xl">
                      {isJobsPage ? (
                        <JobsSearchInput />
                      ) : isProfessionalsPage ? (
                        <BrowseSearchInput placeholder={t("browse.searchProfessionals")} />
                      ) : (
                        <BrowseSearchInput placeholder={t("browse.searchPortfolio")} />
                      )}
                    </div>
                    <div className="relative">
                      <DesktopFilterButton
                        isActive={showFiltersOverlay}
                        onToggle={() => setShowFiltersOverlay(!showFiltersOverlay)}
                        filterCount={filterCount}
                        label={t("common.filters")}
                      />
                      {showFiltersOverlay && (
                        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 z-50 overflow-hidden">
                          <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-800">
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
                              {t("common.filters")}
                            </h3>
                            <button
                              onClick={() => setShowFiltersOverlay(false)}
                              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                              <X className="w-4 h-4 text-neutral-500" />
                            </button>
                          </div>
                          <div className="max-h-[50vh] overflow-y-auto">
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
                      )}
                    </div>
                  </div>
                  {showFiltersOverlay && (
                    <div className="fixed inset-0 z-40" onClick={() => setShowFiltersOverlay(false)} />
                  )}
                </div>
              )}

              {children}
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />

      {showMobileFilters && showSearchFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[80vw] bg-white dark:bg-[#0a0a0a] shadow-2xl">
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
            <div className="h-[calc(100%-52px)] min-h-0">
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

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function ShellLayoutWithParams({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();

  return (
    <JobsProvider>
      <BrowseProvider
        initialCategory={searchParams.get("category")}
        initialSubcategory={searchParams.get("subcategory")}
        initialSubcategories={
          searchParams.get("subcategories")?.split(",").filter(Boolean) || []
        }
      >
        <ShellContent>{children}</ShellContent>
      </BrowseProvider>
    </JobsProvider>
  );
}

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
          <LoadingSpinner size="lg" color={ACCENT_COLOR} />
        </div>
      }
    >
      <ShellLayoutWithParams>{children}</ShellLayoutWithParams>
    </Suspense>
  );
}

