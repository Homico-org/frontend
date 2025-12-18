"use client";

import BrowseFiltersSidebar from "@/components/browse/BrowseFiltersSidebar";
import JobsFiltersSidebar from "@/components/browse/JobsFiltersSidebar";
import Avatar from "@/components/common/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { BrowseProvider, useBrowseContext } from "@/contexts/BrowseContext";
import { JobsProvider, useJobsContext } from "@/contexts/JobsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Briefcase, FileText, Filter, Hammer, Images, Plus, Search, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useCallback, useEffect, useRef, useState } from "react";

// Muted terracotta accent
const ACCENT_COLOR = '#C4735B';

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
  const { locale } = useLanguage();
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
      <div
        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${isFocused ? 'scale-110' : ''}`}
        style={{ color: isFocused ? ACCENT_COLOR : '#9ca3af' }}
      >
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        value={localSearch}
        onChange={(e) => handleSearchChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={locale === 'ka' ? 'სამუშაოს ძებნა...' : 'Search jobs...'}
        className="w-full pl-12 pr-12 py-3.5 rounded-xl border-0 bg-neutral-50 dark:bg-neutral-800/50 text-base text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:bg-white dark:focus:bg-neutral-800 transition-all duration-300"
        style={{
          boxShadow: isFocused ? `0 0 0 2px ${ACCENT_COLOR}40, 0 4px 12px ${ACCENT_COLOR}10` : 'none',
        }}
      />
      {localSearch && (
        <button
          onClick={() => handleSearchChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ backgroundColor: `${ACCENT_COLOR}20`, color: ACCENT_COLOR }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
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
      <div
        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${isFocused ? 'scale-110' : ''}`}
        style={{ color: isFocused ? ACCENT_COLOR : '#9ca3af' }}
      >
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        value={localSearch}
        onChange={(e) => handleSearchChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-3.5 rounded-xl border-0 bg-neutral-50 dark:bg-neutral-800/50 text-base text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:bg-white dark:focus:bg-neutral-800 transition-all duration-300"
        style={{
          boxShadow: isFocused ? `0 0 0 2px ${ACCENT_COLOR}40, 0 4px 12px ${ACCENT_COLOR}10` : 'none',
        }}
      />
      {localSearch && (
        <button
          onClick={() => handleSearchChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ backgroundColor: `${ACCENT_COLOR}20`, color: ACCENT_COLOR }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// Tab configuration
const TABS = [
  {
    key: 'jobs',
    route: '/browse/jobs',
    label: 'Jobs',
    labelKa: 'სამუშაო',
    icon: Briefcase,
    showFor: 'pro' as const,
  },
  {
    key: 'portfolio',
    route: '/browse/portfolio',
    label: 'Portfolio',
    labelKa: 'პორტფოლიო',
    icon: Images,
    showFor: 'all' as const,
  },
  {
    key: 'professionals',
    route: '/browse/professionals',
    label: 'Professionals',
    labelKa: 'სპეციალისტები',
    icon: Users,
    showFor: 'all' as const,
  },
];

function BrowseLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, t } = useLanguage();
  const { user, isLoading: isAuthLoading, isAuthenticated, logout } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { unreadCount } = useNotifications();
  const [mounted, setMounted] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isPro = user?.role === "pro";
  const isJobsPage = pathname.includes("/browse/jobs");
  const isProfessionalsPage = pathname.includes("/browse/professionals");

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Handle ESC key to close dropdown
  const handleEscKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (showDropdown) {
      document.addEventListener("keydown", handleEscKey);
    }
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showDropdown, handleEscKey]);

  // Determine active tab
  const activeTab = isJobsPage ? 'jobs' : pathname.includes('/browse/portfolio') ? 'portfolio' : 'professionals';

  // Get visible tabs based on user role
  const visibleTabs = TABS.filter(tab => tab.showFor === 'all' || (tab.showFor === 'pro' && isPro));

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
      {/* Header - Matching design exactly */}
      <header className="flex-shrink-0 h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a]">
        <div className="h-full max-w-[1800px] mx-auto px-4 sm:px-6 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: ACCENT_COLOR }}
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L4 9v12h16V9l-8-6zm0 2.5L18 10v9H6v-9l6-4.5z"/>
                <path d="M12 8l-4 3v6h8v-6l-4-3z" fillOpacity="0.5"/>
              </svg>
            </div>
            <span className="font-semibold text-lg text-neutral-900 dark:text-white hidden sm:block">
              ჰომიკო
            </span>
          </Link>

          {/* Center - Spacer */}
          <div className="flex-1" />

          {/* Right side - Actions + Profile */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Pro-specific buttons: My Proposals & My Jobs - Refined pill design */}
            {isPro && (
              <div className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-neutral-100/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50">
                <Link
                  href="/my-proposals"
                  className="group relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-white dark:hover:bg-neutral-700 hover:shadow-sm"
                  style={{ color: ACCENT_COLOR }}
                >
                  <FileText className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span className="relative">
                    {locale === 'ka' ? 'შეთავაზებები' : 'Proposals'}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-[2px] bg-current transition-all duration-300 group-hover:w-full opacity-60" />
                  </span>
                </Link>
                <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600" />
                <Link
                  href="/my-jobs"
                  className="group relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-white dark:hover:bg-neutral-700 hover:shadow-sm"
                  style={{ color: ACCENT_COLOR }}
                >
                  <Hammer className="w-4 h-4 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                  <span className="relative">
                    {locale === 'ka' ? 'სამუშაოები' : 'Jobs'}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-[2px] bg-current transition-all duration-300 group-hover:w-full opacity-60" />
                  </span>
                </Link>
              </div>
            )}

            {/* Post a Job Button */}
            <Link
              href="/post-job"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: ACCENT_COLOR }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">
                {locale === 'ka' ? 'განცხადების დამატება' : 'Post a Job'}
              </span>
            </Link>

            {isAuthLoading ? (
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            ) : isAuthenticated && user ? (
              <>
                {/* Notification Bell - Clean style like design */}
                <Link
                  href="/notifications"
                  className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <svg
                    className="w-5 h-5 text-neutral-600 dark:text-neutral-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </Link>

                {/* Profile Dropdown - with chevron like design */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                  >
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="sm"
                      rounded="full"
                      className="w-10 h-10 ring-2 ring-neutral-100 dark:ring-neutral-800"
                    />
                    <svg
                      className={`w-4 h-4 text-neutral-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDropdown && (
                    <div
                      className="absolute right-0 top-full mt-2 w-72 rounded-xl overflow-hidden z-[70] animate-scale-in"
                      style={{
                        background: 'linear-gradient(145deg, rgba(255, 253, 250, 0.98) 0%, rgba(255, 250, 245, 0.98) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(200, 114, 89, 0.15)',
                        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 8px 16px -8px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {/* User Info Header */}
                      <div
                        className="px-4 py-3 relative overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #B86349 100%)` }}
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <Avatar
                            src={user.avatar}
                            name={user.name}
                            size="md"
                            rounded="xl"
                            className="w-11 h-11"
                            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                            <p className="text-xs text-white/80 truncate">{user.email}</p>
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize mt-1"
                              style={{ background: 'rgba(255, 255, 255, 0.95)', color: ACCENT_COLOR }}
                            >
                              {user.role === "pro" ? "პრო" : user.role === "client" ? "მაძიებელი" : user.role === "company" ? "კომპანია" : user.role === "admin" ? "ადმინი" : user.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {/* Pro-specific items */}
                        {user.role === "pro" && (
                          <>
                            <Link
                              href="/pro/premium"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 mx-2 rounded-xl"
                              style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)', border: '1px solid rgba(139, 92, 246, 0.15)' }}
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)' }}>
                                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3l7 4 7-4v11l-7 4-7-4V3z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v10" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold text-purple-700 block">{locale === 'ka' ? 'პრემიუმ გეგმები' : 'Premium Plans'}</span>
                                <span className="text-[10px] text-purple-600/70">{locale === 'ka' ? 'გაზარდე ხილვადობა' : 'Boost visibility'}</span>
                              </div>
                            </Link>
                            <Link
                              href="/pro/profile-setup"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                                <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <span>{locale === 'ka' ? 'პროფილის რედაქტირება' : 'Profile Setup'}</span>
                            </Link>
                          </>
                        )}

                        {/* Client-specific items */}
                        {user.role === "client" && (
                          <Link
                            href="/become-pro"
                            className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 mx-2 rounded-xl"
                            style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}15 0%, ${ACCENT_COLOR}08 100%)`, border: `1px solid ${ACCENT_COLOR}20` }}
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ACCENT_COLOR }}>
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth="1.5" />
                                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M12 11v6M12 11l2.5 2.5M12 11l-2.5 2.5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold block" style={{ color: ACCENT_COLOR }}>{locale === 'ka' ? 'დასაქმდი' : 'Become Pro'}</span>
                              <span className="text-[10px] text-neutral-500">{locale === 'ka' ? 'დაიწყე შემოსავალი' : 'Start earning'}</span>
                            </div>
                          </Link>
                        )}

                        {/* Admin panel */}
                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                              <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                                <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                                <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                                <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                              </svg>
                            </div>
                            <span>{locale === 'ka' ? 'ადმინ პანელი' : 'Admin Panel'}</span>
                          </Link>
                        )}

                        {/* Company items */}
                        {user.role === "company" && (
                          <>
                            <Link
                              href="/company/jobs"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                                <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M9 7h1M9 11h1M14 7h1M14 11h1M9 21v-4h6v4" />
                                </svg>
                              </div>
                              <span>{t("menu.companyJobs")}</span>
                            </Link>
                            <Link
                              href="/company/employees"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                                <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <circle cx="12" cy="6" r="3" strokeWidth={1.5} />
                                  <circle cx="5" cy="17" r="2.5" strokeWidth={1.5} />
                                  <circle cx="19" cy="17" r="2.5" strokeWidth={1.5} />
                                  <path strokeLinecap="round" strokeWidth={1.5} d="M12 9v3M12 12H5v2.5M12 12h7v2.5" />
                                </svg>
                              </div>
                              <span>{t("menu.team")}</span>
                            </Link>
                          </>
                        )}

                        <div className="my-2 mx-4 h-px bg-neutral-200 dark:bg-neutral-700" />

                        {/* Settings */}
                        <Link
                          href="/settings"
                          className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                            <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeWidth={1.5} d="M4 6h6M14 6h6M4 12h10M18 12h2M4 18h2M10 18h10" />
                              <circle cx="12" cy="6" r="2" strokeWidth={1.5} />
                              <circle cx="16" cy="12" r="2" strokeWidth={1.5} />
                              <circle cx="8" cy="18" r="2" strokeWidth={1.5} />
                            </svg>
                          </div>
                          <span>{t("nav.settings")}</span>
                        </Link>

                        <div className="my-2 mx-4 h-px bg-neutral-200 dark:bg-neutral-700" />

                        {/* Logout */}
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            logout();
                          }}
                          className="group flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                            <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 17l5-5-5-5" />
                              <path strokeLinecap="round" strokeWidth={1.75} d="M21 12H9" />
                            </svg>
                          </div>
                          <span>{t("nav.signOut")}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openLoginModal()}
                  className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors px-3 py-2"
                >
                  {t("nav.login")}
                </button>
                <Link
                  href="/register"
                  className="text-sm font-medium px-3 py-2 rounded-lg border transition-colors"
                  style={{ borderColor: ACCENT_COLOR, color: ACCENT_COLOR }}
                >
                  {t("nav.signUp")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar - Matching design exactly */}
        <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a]">
          {/* BROWSE Label */}
          <div className="px-5 pt-5 pb-2">
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
              {locale === 'ka' ? 'დათვალიერება' : 'Browse'}
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="px-3 pb-4">
            <nav className="space-y-1">
              {visibleTabs.map(tab => {
                const isActive = activeTab === tab.key;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.key}
                    href={tab.route}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? ''
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                    style={isActive ? { backgroundColor: `${ACCENT_COLOR}15`, color: ACCENT_COLOR } : {}}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{locale === 'ka' ? tab.labelKa : tab.label}</span>
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
                showBudgetFilter={true}
              />
            )}
          </div>
        </aside>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-white dark:bg-neutral-950">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className={`max-w-[1600px] mx-auto ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
              {/* Search Bar - Elevated card design */}
              <div className="mb-8">
                <div
                  className="relative p-1 rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT_COLOR}15 0%, ${ACCENT_COLOR}05 50%, transparent 100%)`,
                  }}
                >
                  <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800 p-1">
                    {isJobsPage ? (
                      <JobsSearchInput />
                    ) : isProfessionalsPage ? (
                      <BrowseSearchInput placeholder={locale === 'ka' ? 'სპეციალისტის ძებნა...' : 'Search professionals...'} />
                    ) : (
                      <BrowseSearchInput placeholder={locale === 'ka' ? 'ნამუშევრის ძებნა...' : 'Search portfolio...'} />
                    )}
                  </div>
                </div>
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0a0a0a] border-t border-neutral-200 dark:border-neutral-800 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {visibleTabs.map(tab => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.key}
                href={tab.route}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors ${
                  isActive ? '' : 'text-neutral-400 dark:text-neutral-500'
                }`}
                style={isActive ? { color: ACCENT_COLOR } : {}}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">
                  {locale === 'ka' ? tab.labelKa : tab.label}
                </span>
              </Link>
            );
          })}
          {/* Filter button for mobile */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-2 text-neutral-400 dark:text-neutral-500"
          >
            <Filter className="w-5 h-5" />
            <span className="text-[10px] font-medium">
              {locale === 'ka' ? 'ფილტრი' : 'Filter'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile content padding for bottom bar */}
      <div className="lg:hidden h-16" />

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-[#0a0a0a] shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                {locale === 'ka' ? 'ძებნა და ფილტრები' : 'Search & Filters'}
              </h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            {/* Mobile Pro Quick Actions */}
            {isPro && (
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex gap-2">
                <Link
                  href="/my-proposals"
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  <FileText className="w-4 h-4" />
                  <span>{locale === 'ka' ? 'შეთავაზებები' : 'Proposals'}</span>
                </Link>
                <Link
                  href="/my-jobs"
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  <Hammer className="w-4 h-4" />
                  <span>{locale === 'ka' ? 'სამუშაოები' : 'Jobs'}</span>
                </Link>
              </div>
            )}
            {/* Mobile Search Input */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
              {isJobsPage ? (
                <JobsSearchInput />
              ) : isProfessionalsPage ? (
                <BrowseSearchInput placeholder={locale === 'ka' ? 'სპეციალისტის ძებნა...' : 'Search professionals...'} />
              ) : (
                <BrowseSearchInput placeholder={locale === 'ka' ? 'ნამუშევრის ძებნა...' : 'Search portfolio...'} />
              )}
            </div>
            <div className="overflow-y-auto h-[calc(100%-120px)]">
              {isJobsPage ? (
                <JobsSidebar />
              ) : (
                <BrowseFiltersSidebar
                  showSearch={false}
                  showRatingFilter={isProfessionalsPage}
                  showBudgetFilter={false}
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
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent" style={{ borderColor: ACCENT_COLOR, borderTopColor: 'transparent' }} />
      </div>
    }>
      <BrowseLayoutWithParams>{children}</BrowseLayoutWithParams>
    </Suspense>
  );
}
