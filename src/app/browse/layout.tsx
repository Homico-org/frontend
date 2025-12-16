"use client";

import BrowseFiltersSidebar from "@/components/browse/BrowseFiltersSidebar";
import ContentTypeSwitcher from "@/components/browse/ContentTypeSwitcher";
import Header from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { BrowseProvider } from "@/contexts/BrowseContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Briefcase, Filter, Send, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useEffect, useState } from "react";

function BrowseLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const isPro = user?.role === "pro";
  const isJobsPage = pathname.includes("/browse/jobs");
  const isProfessionalsPage = pathname.includes("/browse/professionals");

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
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--color-bg-base)] max-w-full">
      <Header />

      {/* Fixed Top Bar - Search + Tabs + Actions */}
      <div className="flex-shrink-0 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]">
        <div className="px-4 sm:px-6 py-2.5">
          <div className={`flex items-center justify-between gap-4 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
            {/* Left Section - Filter Toggle (mobile only) */}
            <div className="flex items-center gap-3 min-w-[100px]">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{locale === 'ka' ? 'ფილტრი' : 'Filter'}</span>
              </button>
            </div>

            {/* Centered Tabs */}
            <div className="flex justify-center">
              <ContentTypeSwitcher isPro={isPro} />
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-2 justify-end min-w-[100px]">
              {user?.role === "pro" && (
                <Link
                  href="/my-proposals"
                  className="browse-btn-compact browse-btn-primary"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{locale === "ka" ? "შეთავაზებები" : "Proposals"}</span>
                </Link>
              )}
              {user && (user.role === "client" || user.role === "pro") && (
                <Link
                  href="/my-jobs"
                  className="browse-btn-compact browse-btn-secondary"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{locale === "ka" ? "პროექტები" : "Jobs"}</span>
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar - Fixed Filters (Desktop) */}
        <aside className="hidden lg:block w-60 flex-shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] overflow-hidden">
          <BrowseFiltersSidebar
            showSearch={isProfessionalsPage}
            showRatingFilter={isProfessionalsPage}
            showBudgetFilter={isJobsPage}
          />
        </aside>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 browse-scroll-container">
          <div className="p-4 sm:p-6">
            <div className={`max-w-[1400px] mx-auto ${mounted ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '50ms' }}>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--color-bg-base)] shadow-xl animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)]">
              <h3 className="font-semibold text-[var(--color-text-primary)]">
                {locale === 'ka' ? 'ფილტრები' : 'Filters'}
              </h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
            <BrowseFiltersSidebar
              showSearch={isProfessionalsPage}
              showRatingFilter={isProfessionalsPage}
              showBudgetFilter={isJobsPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BrowseLayoutWithParams({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();

  return (
    <BrowseProvider
      initialCategory={searchParams.get("category")}
      initialSubcategory={searchParams.get("subcategory")}
    >
      <BrowseLayoutContent>{children}</BrowseLayoutContent>
    </BrowseProvider>
  );
}

export default function BrowseLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#E07B4F] border-t-transparent"></div>
      </div>
    }>
      <BrowseLayoutWithParams>{children}</BrowseLayoutWithParams>
    </Suspense>
  );
}
