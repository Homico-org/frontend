"use client";

import CategorySection from "@/components/browse/CategorySection";
import ContentTypeSwitcher from "@/components/browse/ContentTypeSwitcher";
import JobsFilterSection from "@/components/browse/JobsFilterSection";
import AppBackground from "@/components/common/AppBackground";
import Header from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { BrowseProvider, useBrowseContext } from "@/contexts/BrowseContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Briefcase, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, Suspense, useEffect, useState } from "react";

// Decorative architectural elements
function ArchitecturalDecorations() {
  return (
    <>
      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-8 w-24 h-24 opacity-[0.03] pointer-events-none animate-float-slow">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect x="10" y="10" width="80" height="80" stroke="currentColor" strokeWidth="1" className="text-[#D2691E]" />
          <rect x="25" y="25" width="50" height="50" stroke="currentColor" strokeWidth="1" className="text-[#D2691E]" />
          <line x1="10" y1="10" x2="25" y2="25" stroke="currentColor" strokeWidth="1" className="text-[#D2691E]" />
          <line x1="90" y1="10" x2="75" y2="25" stroke="currentColor" strokeWidth="1" className="text-[#D2691E]" />
          <line x1="10" y1="90" x2="25" y2="75" stroke="currentColor" strokeWidth="1" className="text-[#D2691E]" />
          <line x1="90" y1="90" x2="75" y2="75" stroke="currentColor" strokeWidth="1" className="text-[#D2691E]" />
        </svg>
      </div>

      <div className="absolute top-40 right-12 w-32 h-32 opacity-[0.02] pointer-events-none animate-float-slower">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" className="text-[#D2691E]" />
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" className="text-[#D2691E]" />
          <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="1" className="text-[#D2691E]" />
        </svg>
      </div>

      {/* Blueprint grid overlay */}
      <div className="absolute inset-0 blueprint-grid pointer-events-none" />
    </>
  );
}

function BrowseLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const {
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    minRating,
    setMinRating,
    selectedBudget,
    setSelectedBudget,
  } = useBrowseContext();

  const isPro = user?.role === "pro";

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

  // Determine page title based on route
  const getPageTitle = () => {
    if (pathname.includes("/browse/jobs")) {
      return locale === "ka" ? "სამუშაოები" : "Jobs";
    }
    if (pathname.includes("/browse/portfolio")) {
      return locale === "ka" ? "სხვების პორტფოლიო" : "Other's Portfolio";
    }
    return locale === "ka" ? "სპეციალისტები" : "Professionals";
  };

  const getPageSubtitle = () => {
    if (pathname.includes("/browse/jobs")) {
      return locale === "ka"
        ? "აღმოაჩინე პროექტები შენი უნარებისთვის"
        : "Discover projects that match your expertise";
    }
    if (pathname.includes("/browse/portfolio")) {
      return locale === "ka"
        ? "შთაგონდი საუკეთესო ნამუშევრებით"
        : "Get inspired by exceptional work";
    }
    return locale === "ka"
      ? "იპოვე სრულყოფილი სპეციალისტი შენი პროექტისთვის"
      : "Find the perfect specialist for your project";
  };

  // Show different filters for different pages
  const isJobsPage = pathname.includes("/browse/jobs");
  const showCategories = !isJobsPage;
  const showRatingFilter = pathname.includes("/browse/professionals");

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AppBackground />

      {/* Architectural decorations */}
      <ArchitecturalDecorations />

      <Header />

      <main className="relative z-20 pt-14 sm:pt-14 pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

          {/* Premium Header Section */}
          <div className={`pt-4 sm:pt-6 pb-4 sm:pb-6 ${mounted ? 'animate-title-reveal' : 'opacity-0'}`}>

            {/* Title Row with decorative elements */}
            <div className="flex items-start justify-between gap-4 mb-5 sm:mb-6">
              <div className="min-w-0">
                {/* Main title with architectural styling */}
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="browse-title text-gradient-terracotta">
                    {getPageTitle()}
                  </h1>
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#D2691E]/40 animate-pulse-soft" />
                </div>

                {/* Italic subtitle */}
                <p className="browse-subtitle">
                  {getPageSubtitle()}
                </p>
              </div>

              {/* Navigation Links - Premium styled */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* My Proposals - for pros */}
                {user?.role === "pro" && (
                  <Link
                    href="/my-proposals"
                    className="group flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium
                      bg-gradient-to-r from-[#D2691E]/10 to-[#CD853F]/5
                      text-[#D2691E] hover:from-[#D2691E]/15 hover:to-[#CD853F]/10
                      border border-[#D2691E]/10 hover:border-[#D2691E]/20
                      transition-all duration-300 hover:shadow-md hover:shadow-[#D2691E]/10"
                  >
                    <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    <span className="hidden sm:inline">{locale === "ka" ? "ჩემი შეთავაზებები" : "My Proposals"}</span>
                  </Link>
                )}

                {/* My Jobs Link */}
                {user && (user.role === "client" || user.role === "pro") && (
                  <Link
                    href="/my-jobs"
                    className="group flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium
                      text-[var(--color-text-secondary)] hover:text-[#D2691E]
                      hover:bg-[#D2691E]/5
                      transition-all duration-300"
                  >
                    <Briefcase className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">{locale === "ka" ? "ჩემი პროექტები" : "My Jobs"}</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Content Type Switcher - Full width, premium design */}
            <div className={`mb-5 sm:mb-6 ${mounted ? 'animate-stagger' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
              <ContentTypeSwitcher isPro={isPro} />
            </div>

            {/* Categories Section - with staggered animation */}
            {showCategories && (
              <div className={`${mounted ? 'animate-stagger' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
                <CategorySection
                  selectedCategory={selectedCategory}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    setSelectedSubcategory(null);
                  }}
                  selectedSubcategory={selectedSubcategory}
                  onSelectSubcategory={setSelectedSubcategory}
                  minRating={minRating}
                  onRatingChange={setMinRating}
                  showRatingFilter={showRatingFilter}
                />
              </div>
            )}

            {/* Jobs Budget Filter */}
            {isJobsPage && (
              <div className={`${mounted ? 'animate-stagger' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
                <JobsFilterSection
                  selectedBudget={selectedBudget}
                  onSelectBudget={setSelectedBudget}
                />
              </div>
            )}
          </div>

          {/* Elegant divider with gradient */}
          <div className="relative h-px mb-4 sm:mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D2691E]/20 to-transparent" />
          </div>

          {/* Child page content with fade animation */}
          <div className={`${mounted ? 'animate-stagger' : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
            {children}
          </div>
        </div>
      </main>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D2691E]"></div>
      </div>
    }>
      <BrowseLayoutWithParams>{children}</BrowseLayoutWithParams>
    </Suspense>
  );
}
