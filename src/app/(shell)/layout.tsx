"use client";

import { CategoryIcon } from "@/components/categories";
import Header from "@/components/common/Header";
import MobileBottomNav from "@/components/common/MobileBottomNav";
import SidebarProjectsGroup from "@/components/layout/SidebarProjectsGroup";
import SidebarShopGroup from "@/components/layout/SidebarShopGroup";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { features } from "@/config/features";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { BrowseProvider, useBrowseContext } from "@/contexts/BrowseContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { JobsProvider, useJobsContext } from "@/contexts/JobsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAiServiceSearch } from "@/hooks/useAiServiceSearch";
import { getCategoryLabelStatic } from "@/hooks/useCategoryLabels";
import { useCountryLink } from "@/hooks/useCountry";
import api from "@/lib/api";
import { stripCountryPrefix } from "@/utils/countryLink";
import {
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Facebook,
  FileText,
  Hammer,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Mail,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShoppingBag,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Sidebar width constants
const SIDEBAR_EXPANDED_WIDTH = 256; // 16rem
const SIDEBAR_COLLAPSED_WIDTH = 56;

type TabShowFor = "all" | "pro" | "client" | "auth";

type TabKey =
  | "my-space"
  | "my-jobs"
  | "projects"
  | "shop"
  | "bookings"
  | "jobs"
  | "professionals"
  | "tools";

// `countryScoped: true` flags tabs that live under `/{country}/...` and
// should be wrapped in `cl(...)` before being passed to <Link href>. The
// raw route stays bare so the active-tab matcher (which compares against
// the country-stripped pathname) doesn't need a special case.
const TABS: Array<{
  key: TabKey;
  route: string;
  countryScoped?: boolean;
  label: string;
  labelKa: string;
  labelRu: string;
  icon: typeof Briefcase;
  showFor: TabShowFor;
}> = [
  {
    key: "my-space",
    route: "/my-space",
    label: "Dashboard",
    labelKa: "მთავარი",
    labelRu: "Панель управления",
    icon: LayoutDashboard,
    showFor: "pro" as const,
  },
  {
    key: "my-jobs",
    route: "/my-jobs",
    label: "My Jobs",
    labelKa: "ჩემი განცხადებები",
    labelRu: "Мои заказы",
    icon: Hammer,
    showFor: "client" as const,
  },
  {
    key: "projects",
    route: "/projects",
    label: "Projects",
    labelKa: "პროექტები",
    labelRu: "Проекты",
    icon: ListChecks,
    showFor: "auth" as const,
  },
  {
    key: "shop",
    route: "/shop",
    label: "Shop",
    labelKa: "მაღაზია",
    labelRu: "Магазин",
    icon: ShoppingBag,
    showFor: "all" as const,
  },
  {
    key: "bookings",
    route: "/bookings",
    label: "Bookings",
    labelKa: "ჯავშნები",
    labelRu: "Бронирования",
    icon: Calendar,
    showFor: "auth" as const,
  },
  {
    key: "jobs",
    route: "/jobs",
    countryScoped: true,
    label: "Find work",
    labelKa: "სამუშაოს პოვნა",
    labelRu: "Найти работу",
    icon: Briefcase,
    // The work feed is where PROS find jobs. Clients seeing both "Find work"
    // and "My Jobs" was the single biggest nav confusion - hide it from
    // clients (and anon, who'd otherwise land on a near-empty feed).
    showFor: "pro" as const,
  },
  {
    key: "professionals",
    route: "/professionals",
    countryScoped: true,
    label: "Find a pro",
    labelKa: "ხელოსნის პოვნა",
    labelRu: "Найти мастера",
    icon: Users,
    showFor: "all" as const,
  },
  {
    key: "tools",
    route: "/tools",
    label: "AI Plan",
    labelKa: "AI დაგეგმვა",
    labelRu: "AI Планирование",
    icon: Wrench,
    showFor: "all" as const,
  },
];

// AI search now uses the shared `useAiServiceSearch` hook
// (hooks/useAiServiceSearch.ts). The previous inline implementation
// in this file diverged from the shared hook on debounce (500 vs 600),
// minQueryLength (2 vs 3) and caching strategy, which meant the same
// query behaved differently in the global header vs the post-job
// picker vs the pro register flow. Single source of truth now.

function AiSearchIndicator({ isSearching }: { isSearching: boolean }) {
  if (!isSearching) return null;
  return (
    <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1">
      <Loader2 className="w-3.5 h-3.5 text-[var(--hm-brand-500)] animate-spin" />
    </div>
  );
}

function JobsSearchInput() {
  const { t } = useLanguage();
  const { filters, setFilters } = useJobsContext();
  const [localSearch, setLocalSearch] = useState(filters.searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Action-driven shared hook. `aiResults` is null until the first
  // request resolves; we coerce to [] for the empty/auto-apply check
  // below. `aiSearch(value)` is called from handleSearchChange so the
  // hook stays in sync with what the user is typing.
  const { aiResults, aiLoading, search: aiSearch } = useAiServiceSearch();
  const isSearching = aiLoading;

  // Auto-apply AI category match
  useEffect(() => {
    if (aiResults && aiResults.length > 0) {
      const match = aiResults[0];
      if (match.key !== filters.subcategory) {
        setFilters({
          ...filters,
          category: match.category,
          subcategory: match.key,
        });
      }
    }
  }, [aiResults]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLocalSearch(filters.searchQuery);
  }, [filters.searchQuery]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    aiSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ ...filters, searchQuery: value });
    }, 300);
  };

  return (
    <div className="relative w-full">
      <div
        className={`relative flex items-center w-full h-9 rounded-xl border transition-all ${
          isFocused
            ? "border-[var(--hm-brand-500)]/40 ring-2 ring-[var(--hm-brand-500)]/10"
            : "border-[var(--hm-border)]"
        } bg-[var(--hm-bg-elevated)]`}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--hm-fg-muted)]">
          <Search className="w-[18px] h-[18px]" />
        </div>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t("browse.searchJobs")}
          className="flex-1 h-9 pr-8 bg-transparent text-[13px] text-[var(--hm-fg-primary)] placeholder-neutral-400 focus:outline-none pl-10"
        />
        <AiSearchIndicator isSearching={isSearching} />
        {localSearch ? (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center hover:bg-[var(--hm-bg-tertiary)] transition-colors"
            aria-label={t("common.clearSearch")}
          >
            <X className="w-3.5 h-3.5 text-[var(--hm-fg-muted)]" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function BrowseSearchInput({ placeholder }: { placeholder: string }) {
  const { t } = useLanguage();
  const {
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    setSelectedSubcategories,
  } = useBrowseContext();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Shared hook (see JobsSearchInput above for the same pattern).
  const { aiResults, aiLoading, search: aiSearch } = useAiServiceSearch();
  const isSearching = aiLoading;

  // Auto-apply AI category match
  useEffect(() => {
    if (aiResults && aiResults.length > 0) {
      const match = aiResults[0];
      setSelectedCategory(match.category);
      setSelectedSubcategories([match.key]);
    }
  }, [aiResults]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    aiSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  };

  return (
    <div className="relative w-full">
      <div
        className={`relative flex items-center w-full h-9 rounded-xl border transition-all ${
          isFocused
            ? "border-[var(--hm-brand-500)]/40 ring-2 ring-[var(--hm-brand-500)]/10"
            : "border-[var(--hm-border)]"
        } bg-[var(--hm-bg-elevated)]`}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--hm-fg-muted)]">
          <Search className="w-[18px] h-[18px]" />
        </div>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 h-9 pr-8 bg-transparent text-[13px] text-[var(--hm-fg-primary)] placeholder-neutral-400 focus:outline-none pl-10"
        />
        <AiSearchIndicator isSearching={isSearching} />
        {localSearch ? (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center hover:bg-[var(--hm-bg-tertiary)] transition-colors"
            aria-label={t("common.clearSearch")}
          >
            <X className="w-3.5 h-3.5 text-[var(--hm-fg-muted)]" />
          </button>
        ) : null}
      </div>
    </div>
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

// Sidebar categories for Browse pages (professionals, portfolio)
function BrowseSidebarCategories({ isCollapsed }: { isCollapsed: boolean }) {
  const { locale } = useLanguage();
  const { categories, getSubcategoriesForCategory } = useCategories();
  const {
    selectedCategory,
    setSelectedCategory,
    selectedSubcategories,
    toggleSubcategory,
    setSelectedSubcategories,
  } = useBrowseContext();

  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (selectedSubcategories.length > 0) {
      const toExpand: string[] = [];
      for (const subKey of selectedSubcategories) {
        for (const cat of categories) {
          if (
            getSubcategoriesForCategory(cat.key).some((s) => s.key === subKey)
          ) {
            if (!toExpand.includes(cat.key)) toExpand.push(cat.key);
            break;
          }
        }
      }
      if (toExpand.length > 0) {
        setExpandedCategories((prev) => {
          const next = { ...prev };
          toExpand.forEach((k) => {
            next[k] = true;
          });
          return next;
        });
      }
    } else if (selectedCategory) {
      setExpandedCategories((prev) =>
        prev[selectedCategory] ? prev : { ...prev, [selectedCategory]: true },
      );
    }
  }, [
    selectedCategory,
    selectedSubcategories,
    categories,
    getSubcategoriesForCategory,
  ]);

  const hasActive = selectedSubcategories.length > 0;

  const handleSubToggle = (_catKey: string, subKey: string) => {
    toggleSubcategory(subKey);
    // Always clear selectedCategory - it's no longer needed with multi-select
    setSelectedCategory(null);
  };

  const handleClear = () => {
    setSelectedCategory(null);
    setSelectedSubcategories([]);
  };

  return (
    <SidebarCategoriesUI
      isCollapsed={isCollapsed}
      categories={categories}
      getSubcategoriesForCategory={getSubcategoriesForCategory}
      locale={locale}
      expandedCategories={expandedCategories}
      setExpandedCategories={setExpandedCategories}
      hasActive={hasActive}
      onClear={handleClear}
      isCategoryActive={(catKey) =>
        selectedSubcategories.some((s) =>
          getSubcategoriesForCategory(catKey).some((sub) => sub.key === s),
        )
      }
      isSubSelected={(subKey) => selectedSubcategories.includes(subKey)}
      onCategoryClick={(catKey) => {
        setExpandedCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
      }}
      onSubClick={handleSubToggle}
    />
  );
}

// Sidebar categories for Jobs page
function JobsSidebarCategories({ isCollapsed }: { isCollapsed: boolean }) {
  const { locale } = useLanguage();
  const { categories, getSubcategoriesForCategory } = useCategories();
  const { filters, setFilters } = useJobsContext();

  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (filters.subcategory) {
      for (const cat of categories) {
        if (
          getSubcategoriesForCategory(cat.key).some(
            (s) => s.key === filters.subcategory,
          )
        ) {
          setExpandedCategories((prev) => ({ ...prev, [cat.key]: true }));
          break;
        }
      }
    } else if (filters.category) {
      setExpandedCategories((prev) =>
        prev[filters.category!] ? prev : { ...prev, [filters.category!]: true },
      );
    }
  }, [
    filters.category,
    filters.subcategory,
    categories,
    getSubcategoriesForCategory,
  ]);

  const subs = filters.subcategories || [];
  const hasActive = subs.length > 0;

  return (
    <SidebarCategoriesUI
      isCollapsed={isCollapsed}
      categories={categories}
      getSubcategoriesForCategory={getSubcategoriesForCategory}
      locale={locale}
      expandedCategories={expandedCategories}
      setExpandedCategories={setExpandedCategories}
      hasActive={hasActive}
      onClear={() =>
        setFilters({
          ...filters,
          category: null,
          subcategory: null,
          subcategories: [],
        })
      }
      isCategoryActive={(catKey) =>
        subs.some((s) =>
          getSubcategoriesForCategory(catKey).some((sub) => sub.key === s),
        )
      }
      isSubSelected={(subKey) => subs.includes(subKey)}
      onCategoryClick={(catKey) => {
        setExpandedCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
      }}
      onSubClick={(_catKey, subKey) => {
        const newSubs = subs.includes(subKey)
          ? subs.filter((s) => s !== subKey)
          : [...subs, subKey];
        setFilters({
          ...filters,
          category: null,
          subcategory: newSubs[0] || null,
          subcategories: newSubs,
        });
      }}
    />
  );
}

// Shared UI for sidebar categories
function SidebarCategoriesUI({
  isCollapsed,
  categories,
  getSubcategoriesForCategory,
  locale,
  expandedCategories,
  setExpandedCategories,
  hasActive,
  onClear,
  isCategoryActive,
  isSubSelected,
  onCategoryClick,
  onSubClick,
}: {
  isCollapsed: boolean;
  categories: { key: string; name: string; nameKa: string }[];
  getSubcategoriesForCategory: (
    key: string,
  ) => { key: string; name: string; nameKa: string }[];
  locale: string;
  expandedCategories: Record<string, boolean>;
  setExpandedCategories: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  hasActive: boolean;
  onClear: () => void;
  isCategoryActive: (catKey: string) => boolean;
  isSubSelected: (subKey: string) => boolean;
  onCategoryClick: (catKey: string) => void;
  onSubClick: (catKey: string, subKey: string) => void;
}) {
  const { t, pick } = useLanguage();

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        {categories.map((cat) => {
          const active = isCategoryActive(cat.key);
          return (
            <button
              key={cat.key}
              onClick={() => onCategoryClick(cat.key)}
              className={`w-9 h-9 flex items-center justify-center transition-all ${
                active ? "" : "hover:bg-[var(--hm-bg-tertiary)]"
              }`}
              style={
                active
                  ? {
                      backgroundColor: "var(--hm-brand-50)",
                      color: "var(--hm-brand-700)",
                    }
                  : {}
              }
              title={getCategoryLabelStatic(cat.key, locale)}
            >
              <CategoryIcon type={cat.key} className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {hasActive && (
        <div className="flex justify-end px-1 mb-1">
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-[10px] font-medium text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-secondary)] transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            {t("browse.clearAll")}
          </button>
        </div>
      )}
      {categories.map((cat) => {
        const catKey = cat.key;
        const active = isCategoryActive(catKey);
        const subcategories = getSubcategoriesForCategory(catKey);
        const isExpanded = expandedCategories[catKey] ?? false;
        const label =
          pick({ en: cat.name, ka: cat.nameKa }) ||
          getCategoryLabelStatic(catKey, locale);
        const hasSelectedSub = subcategories.some((s) => isSubSelected(s.key));

        return (
          <div key={catKey}>
            <button
              onClick={() => onCategoryClick(catKey)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left group ${
                active || hasSelectedSub
                  ? "bg-[var(--hm-brand-500)]/10"
                  : "hover:bg-[var(--hm-bg-tertiary)]/50"
              }`}
            >
              <span
                className="transition-transform duration-200 group-hover:scale-110 flex-shrink-0"
                style={{
                  color: active || hasSelectedSub ? ACCENT_COLOR : undefined,
                }}
              >
                <CategoryIcon type={catKey} className="w-4 h-4" />
              </span>
              <span
                className={`text-[12px] flex-1 truncate transition-colors ${
                  active || hasSelectedSub
                    ? "font-semibold text-[var(--hm-fg-primary)]"
                    : "text-[var(--hm-fg-secondary)] group-hover:text-[var(--hm-fg-primary)]"
                }`}
              >
                {label}
              </span>
              {subcategories.length > 0 && (
                <ChevronDown
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCategories((prev) => ({
                      ...prev,
                      [catKey]: !prev[catKey],
                    }));
                  }}
                  className={`w-3 h-3 text-[var(--hm-fg-muted)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer hover:text-[var(--hm-fg-secondary)] flex-shrink-0 ${
                    isExpanded ? "rotate-180" : "rotate-0"
                  }`}
                />
              )}
            </button>

            {subcategories.length > 0 && isExpanded && (
              <div className="ml-5 mt-0.5 space-y-0.5 pb-0.5">
                {subcategories.map((sub) => {
                  const selected = isSubSelected(sub.key);
                  const subLabel =
                    pick({ en: sub.name, ka: sub.nameKa }) ||
                    getCategoryLabelStatic(sub.key, locale);
                  return (
                    <button
                      key={sub.key}
                      onClick={() => onSubClick(catKey, sub.key)}
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-left transition-all ${
                        selected
                          ? "bg-[var(--hm-brand-500)]/10"
                          : "hover:bg-[var(--hm-bg-tertiary)]/50"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded border-[1.5px] flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                          selected
                            ? "border-transparent"
                            : "border-[var(--hm-border-strong)]"
                        }`}
                        style={
                          selected
                            ? { backgroundColor: "var(--hm-brand-500)" }
                            : {}
                        }
                      >
                        {selected && (
                          <Check
                            className="w-2 h-2 text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <span
                        className={`text-[11px] truncate transition-colors ${
                          selected
                            ? "font-medium text-[var(--hm-fg-primary)]"
                            : "text-[var(--hm-fg-muted)]"
                        }`}
                      >
                        {subLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t, pick } = useLanguage();
  const { user } = useAuth();
  const cl = useCountryLink();
  const [mounted, setMounted] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const { isCollapsed, toggleSidebar, isHydrated } = useSidebarState();

  const isPro = user?.role === "pro" || user?.role === "admin";
  const isClient = user?.role === "client";
  const isAuthenticated = !!user;
  const [pendingBookingCount, setPendingBookingCount] = useState(0);

  // Fetch pending booking count for badge
  useEffect(() => {
    if (!isAuthenticated || !features.bookings) return;
    api
      .get("/bookings/my/pending-count")
      .then((res) => setPendingBookingCount(res.data?.count || 0))
      .catch(() => {});
  }, [isAuthenticated, pathname]);

  // Country-scoped routes live under `/{country}/...` after middleware
  // redirect, so the raw pathname for the Jobs tab is `/ge/jobs` not
  // `/jobs`. Strip the prefix once so every startsWith check below works
  // identically on bare and country-prefixed URLs.
  const localPath = stripCountryPrefix(pathname);

  const isMySpacePage = localPath.startsWith("/my-space");
  const isJobsPage = localPath.startsWith("/jobs");
  const isProfessionalsPage = localPath.startsWith("/professionals");
  const isPortfolioPage = localPath.startsWith("/portfolio"); // redirects to /professionals
  const isToolsPage = localPath === "/tools";
  const isToolsSubpage =
    localPath.startsWith("/tools/") && localPath !== "/tools";

  const isSettingsPage = localPath.startsWith("/settings");
  const isMyWorkPage = localPath.startsWith("/my-work");
  const isMyJobsPage = localPath.startsWith("/my-jobs");
  const isBookingsPage = localPath.startsWith("/bookings");
  const isProjectsPage = localPath.startsWith("/projects");
  // /shop renders its own header + search (CatalogSearch), so suppress the
  // shell's secondary header row and browse filter bar - same as projects.
  const isShopPage = localPath.startsWith("/shop");
  // /orders has its own page header; suppress the browse chrome too.
  const isOrdersPage = localPath.startsWith("/orders");

  const activeTab: TabKey | null = isMySpacePage
    ? "my-space"
    : isMyJobsPage
      ? "my-jobs"
      : isProjectsPage
        ? "projects"
        : isShopPage || isOrdersPage
          ? "shop"
          : isBookingsPage
            ? "bookings"
            : isJobsPage
              ? "jobs"
              : isProfessionalsPage || isPortfolioPage
                ? "professionals"
                : isToolsPage || isToolsSubpage
                  ? "tools"
                  : null;

  const visibleTabs = TABS.filter((tab) => {
    if (tab.key === "bookings" && !features.bookings) return false;
    if (tab.showFor === "all") return true;
    if (tab.showFor === "auth") return isAuthenticated;
    if (tab.showFor === "pro") return isPro;
    if (tab.showFor === "client") return isClient;
    return false;
  });

  const pageHeader = useMemo(() => {
    if (isMySpacePage) {
      return {
        icon: LayoutDashboard,
        title: t("mySpace.title"),
        subtitle: t("mySpace.subtitle"),
      };
    }
    if (isMyWorkPage) {
      return {
        icon: FileText,
        title: t("job.myWork"),
        subtitle: t("job.myWorkSubtitle"),
      };
    }
    if (isMyJobsPage) {
      return {
        icon: Hammer,
        title: t("job.myJobs"),
        subtitle: t("job.myJobsSubtitle"),
      };
    }
    if (isJobsPage) {
      return {
        icon: Briefcase,
        title: t("browse.jobs"),
        subtitle: t("browse.jobsSubtitle"),
      };
    }
    if (isProfessionalsPage || isPortfolioPage) {
      return {
        icon: Users,
        title: t("browse.professionals"),
        subtitle: t("browse.professionalsSubtitle"),
      };
    }
    if (isBookingsPage) {
      return {
        icon: Calendar,
        title: t("booking.title"),
        subtitle: t("booking.subtitle"),
      };
    }
    if (localPath.startsWith("/tools")) {
      return {
        icon: Wrench,
        title: t("tools.home.title"),
        subtitle: t("tools.home.subtitle"),
      };
    }
    return { icon: Users, title: t("browse.title"), subtitle: undefined };
  }, [
    isMySpacePage,
    isJobsPage,
    isPortfolioPage,
    isProfessionalsPage,
    isMyJobsPage,
    isMyWorkPage,
    isBookingsPage,
    localPath,
    t,
  ]);

  const HeaderIcon = pageHeader.icon;

  const showHeaderRow =
    !isToolsSubpage &&
    !isMySpacePage &&
    !isSettingsPage &&
    !isProjectsPage &&
    !isShopPage &&
    !isOrdersPage;
  const showSearchFilters =
    !isToolsSubpage &&
    !isToolsPage &&
    !isMyJobsPage &&
    !isMyWorkPage &&
    !isMySpacePage &&
    !isSettingsPage &&
    !isBookingsPage &&
    !isProjectsPage &&
    !isShopPage &&
    !isOrdersPage;

  useEffect(() => setMounted(true), []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--hm-bg-page)] max-w-full">
      <Header fixed={false} showNav={false} />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className="hidden lg:flex flex-col flex-shrink-0 border-r transition-all duration-300 ease-in-out relative"
          style={{
            borderColor: "var(--hm-border)",
            backgroundColor: "var(--hm-bg-page)",
            width: isHydrated
              ? isCollapsed
                ? SIDEBAR_COLLAPSED_WIDTH
                : SIDEBAR_EXPANDED_WIDTH
              : SIDEBAR_EXPANDED_WIDTH,
          }}
        >
          {/* Post Job - top of sidebar */}
          <div
            className={`pt-3 pb-1.5 flex-shrink-0 ${isCollapsed ? "px-2" : "px-3"}`}
          >
            <Link
              href="/post-job"
              className={`group flex items-center justify-center border transition-all mb-2 ${
                isCollapsed ? "w-9 h-9 mx-auto" : "w-full gap-2 py-1.5"
              } hover:shadow-md`}
              style={{
                borderColor: "var(--hm-brand-500)",
                backgroundColor: "var(--hm-brand-500)",
                color: "#fff",
              }}
              title={isCollapsed ? t("browse.postAJob") : undefined}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hm-brand-600)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hm-brand-500)";
              }}
            >
              <Plus className="w-4 h-4 flex-shrink-0 transition-transform group-hover:rotate-90" />
              {!isCollapsed && (
                <span className="text-[13px] font-semibold">
                  {t("browse.postAJob")}
                </span>
              )}
            </Link>

            {!isCollapsed && (
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--hm-fg-muted)] px-2 pt-3 pb-2">
                {t("nav.sectionWork")}
              </div>
            )}
            <nav className={`space-y-0.5 ${isCollapsed ? "px-1.5" : "px-2"}`}>
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const Icon = tab.icon;
                // Projects renders as a collapsible tree of the user's projects.
                if (tab.key === "projects") {
                  return (
                    <SidebarProjectsGroup
                      key="projects"
                      label={pick({
                        en: tab.label,
                        ka: tab.labelKa,
                        ru: tab.labelRu,
                      })}
                      isCollapsed={isCollapsed}
                      active={isActive}
                    />
                  );
                }
                // Shop is a collapsible group: Catalog, Orders, ...
                if (tab.key === "shop") {
                  return (
                    <SidebarShopGroup
                      key="shop"
                      label={pick({
                        en: tab.label,
                        ka: tab.labelKa,
                        ru: tab.labelRu,
                      })}
                      isCollapsed={isCollapsed}
                      active={isActive}
                    />
                  );
                }
                return (
                  <Link
                    key={tab.key}
                    href={tab.route}
                    className={`group relative flex items-center rounded-xl text-[12.5px] transition-colors ${
                      isCollapsed
                        ? "justify-center px-2 py-2"
                        : "gap-2.5 px-2.5 py-2"
                    } ${
                      isActive
                        ? "bg-[var(--hm-brand-500)]/[0.10] font-semibold text-[var(--hm-brand-500)]"
                        : "font-medium text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)]"
                    }`}
                    title={
                      isCollapsed
                        ? pick({
                            en: tab.label,
                            ka: tab.labelKa,
                            ru: tab.labelRu,
                          })
                        : undefined
                    }
                  >
                    <Icon
                      className="w-[18px] h-[18px] flex-shrink-0"
                      strokeWidth={isActive ? 2.1 : 1.75}
                    />
                    {!isCollapsed && (
                      <span className="flex-1">
                        {pick({
                          en: tab.label,
                          ka: tab.labelKa,
                          ru: tab.labelRu,
                        })}
                      </span>
                    )}
                    {tab.key === "bookings" &&
                      pendingBookingCount > 0 &&
                      (isCollapsed ? (
                        <span className="absolute -top-0.5 -right-0.5 bg-[var(--hm-brand-500)] text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-0.5 shadow-sm">
                          {pendingBookingCount}
                        </span>
                      ) : (
                        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--hm-brand-500)] px-1 text-[10px] font-bold tabular-nums text-white">
                          {pendingBookingCount}
                        </span>
                      ))}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Categories removed from sidebar - handled by filter bar on both pages */}

          {/* Footer area (My pages + Support + Social) */}
          <div className={`mt-auto pb-4 ${isCollapsed ? "px-2" : "px-3"}`}>
            {isAuthenticated &&
              (() => {
                const settingsActive = pathname.startsWith("/settings");
                return (
                  <div className="pt-3 border-t border-[var(--hm-border-subtle)] space-y-0.5">
                    {!isCollapsed && (
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--hm-fg-muted)] px-2 pt-1 pb-2">
                        {t("nav.sectionAccount")}
                      </div>
                    )}
                    <Link
                      href="/settings"
                      className={`flex items-center rounded-xl text-[12.5px] transition-colors ${
                        isCollapsed
                          ? "justify-center px-2 py-2"
                          : "gap-2.5 px-2.5 py-2"
                      } ${
                        settingsActive
                          ? "bg-[var(--hm-brand-500)]/[0.10] font-semibold text-[var(--hm-brand-500)]"
                          : "font-medium text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)]"
                      }`}
                      title={isCollapsed ? t("settings.title") : undefined}
                    >
                      <Settings
                        className="w-[18px] h-[18px]"
                        strokeWidth={settingsActive ? 2.1 : 1.75}
                      />
                      {!isCollapsed && <span>{t("settings.title")}</span>}
                    </Link>
                  </div>
                );
              })()}

            <div
              className={`${
                isAuthenticated ? "mt-3 pt-3" : "pt-3"
              } border-t border-[var(--hm-border-subtle)] space-y-1`}
            >
              {isCollapsed ? (
                <div className="flex flex-col items-center gap-1.5">
                  <Link
                    href="/help"
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                    title={t("help.categories.support")}
                  >
                    <HelpCircle
                      className="w-4 h-4"
                      style={{ color: ACCENT_COLOR }}
                    />
                  </Link>
                  <a
                    href="mailto:contact@homico.co"
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                    aria-label="Email support"
                    title="contact@homico.co"
                  >
                    <Mail className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61585402505170"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                    aria-label="Facebook"
                    title="Facebook"
                  >
                    <Facebook
                      className="w-4 h-4"
                      style={{ color: ACCENT_COLOR }}
                    />
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 px-1">
                  <Link
                    href="/help"
                    className="inline-flex items-center gap-2 text-xs font-medium text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)] transition-colors"
                  >
                    <HelpCircle
                      className="w-4 h-4"
                      style={{ color: ACCENT_COLOR }}
                    />
                    <span>{t("help.categories.support")}</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <a
                      href="mailto:contact@homico.co"
                      className="w-8 h-8 rounded-lg border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] flex items-center justify-center hover:bg-[var(--hm-bg-page)] transition-colors"
                      aria-label="Email support"
                      title="contact@homico.co"
                    >
                      <Mail
                        className="w-4 h-4"
                        style={{ color: ACCENT_COLOR }}
                      />
                    </a>
                    <a
                      href="https://www.facebook.com/profile.php?id=61585402505170"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] flex items-center justify-center hover:bg-[var(--hm-bg-page)] transition-colors"
                      aria-label="Facebook"
                      title="Facebook"
                    >
                      <Facebook
                        className="w-4 h-4"
                        style={{ color: ACCENT_COLOR }}
                      />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)] shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight
                className="w-3.5 h-3.5"
                style={{ color: ACCENT_COLOR }}
              />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 text-[var(--hm-fg-muted)]" />
            )}
          </button>
        </aside>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-[var(--hm-bg-elevated)]">
          {/* Mobile Header Row & Search. Title bumped from text-sm
              (was effectively invisible as a "page title") to
              text-base/text-lg with a colored icon block so each list
              page actually feels framed. Audits read past the previous
              version as if no header existed at all. */}
          <div className="lg:hidden">
            {showHeaderRow && (
              <div className="px-3 pt-3.5 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)]/10 flex items-center justify-center flex-shrink-0">
                    <HeaderIcon className="w-4 h-4 text-[var(--hm-brand-500)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-[15px] font-semibold text-[var(--hm-fg-primary)] truncate leading-tight">
                      {pageHeader.title}
                    </h1>
                    {pageHeader.subtitle && (
                      <p className="text-[11px] text-[var(--hm-fg-muted)] truncate leading-snug">
                        {pageHeader.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showSearchFilters && (
              <div className="px-3 pt-2 pb-3">
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
            )}
          </div>

          <div className={isMySpacePage ? "" : "p-1.5 sm:p-2 lg:p-3"}>
            <div
              className={`${isMySpacePage ? "" : "max-w-[1600px] mx-auto"} ${mounted ? "animate-fade-in" : "opacity-0"}`}
            >
              {showHeaderRow && (
                <div className="hidden lg:block mb-4 sm:mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--hm-brand-500)]/10 flex items-center justify-center flex-shrink-0">
                      <HeaderIcon className="w-5 h-5 text-[var(--hm-brand-500)]" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-xl font-semibold text-[var(--hm-fg-primary)] leading-tight">
                        {pageHeader.title}
                      </h1>
                      {pageHeader.subtitle && (
                        <p className="text-sm text-[var(--hm-fg-muted)] mt-0.5">
                          {pageHeader.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {showSearchFilters && !isJobsPage && !isProfessionalsPage && (
                <div className="hidden lg:block mb-4 sm:mb-5">
                  <div className="max-w-xl">
                    <BrowseSearchInput
                      placeholder={t("browse.searchPortfolio")}
                    />
                  </div>
                </div>
              )}

              {children}
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />

      {/* Mobile Categories Panel */}
      {/* Categories moved to filter bar - mobile panel removed */}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
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
        <div className="h-screen flex items-center justify-center bg-[var(--hm-bg-page)]">
          <LoadingSpinner size="lg" color={ACCENT_COLOR} />
        </div>
      }
    >
      <ShellLayoutWithParams>{children}</ShellLayoutWithParams>
    </Suspense>
  );
}
