"use client";

import CategorySection from "@/components/browse/CategorySection";
import ContentTypeSwitcher from "@/components/browse/ContentTypeSwitcher";
import JobsFilterSection from "@/components/browse/JobsFilterSection";
import AppBackground from "@/components/common/AppBackground";
import Header from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { BrowseProvider, useBrowseContext } from "@/contexts/BrowseContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ReactNode, useEffect } from "react";
import { Briefcase, Send } from "lucide-react";

function BrowseLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
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

  // Only redirect /browse to the default page based on user role
  // No other automatic redirects - let users navigate freely
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
      return locale === "ka" ? "შესაძლებლობები" : "Job Opportunities";
    }
    if (pathname.includes("/browse/portfolio")) {
      return locale === "ka" ? "ნამუშევრები" : "Portfolio";
    }
    return locale === "ka" ? "პროფესიონალები" : "Professionals";
  };

  const getPageSubtitle = () => {
    if (pathname.includes("/browse/jobs")) {
      return locale === "ka"
        ? "იპოვეთ პროექტები თქვენი უნარებისთვის"
        : "Find projects matching your skills";
    }
    if (pathname.includes("/browse/portfolio")) {
      return locale === "ka"
        ? "დაათვალიერეთ პროფესიონალების საუკეთესო სამუშაოები"
        : "Explore the best work from professionals";
    }
    return locale === "ka"
      ? "იპოვეთ საუკეთესო სპეციალისტები თქვენი პროექტისთვის"
      : "Find the best specialists for your project";
  };

  // Show different filters for different pages
  const isJobsPage = pathname.includes("/browse/jobs");
  const showCategories = !isJobsPage;
  // Show rating filter only for professionals
  const showRatingFilter = pathname.includes("/browse/professionals");

  return (
    <div className="min-h-screen relative">
      <AppBackground />
      <Header />

      <main className="relative z-20 pt-14 sm:pt-14 pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Inline header - compact on mobile */}
          <div className="pt-1 pb-2 sm:pb-3">
            {/* Title Row */}
            <div className="flex items-center justify-between gap-3 mb-2 sm:mb-3">
              <div className="min-w-0">
                <h1
                  className="text-lg sm:text-2xl font-bold tracking-tight"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {getPageTitle()}
                </h1>
                <p
                  className="text-xs sm:text-sm mt-0.5 opacity-70 line-clamp-1"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {getPageSubtitle()}
                </p>
              </div>

              {/* Navigation Links */}
              <div className="flex items-center gap-3">
                {/* My Proposals - for pros */}
                {user?.role === "pro" && (
                  <Link
                    href="/my-proposals"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#D2691E]/10 text-[#D2691E] hover:bg-[#D2691E]/20 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{locale === "ka" ? "შეთავაზებები" : "My Proposals"}</span>
                  </Link>
                )}
                
                {/* My Jobs Link */}
                {user && (user.role === "client" || user.role === "pro") && (
                  <Link
                    href="/my-jobs"
                    className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[#D2691E] transition-colors"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{locale === "ka" ? "ჩემი განცხადებები" : "My Jobs"}</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Content Type Switcher */}
            <div className="mb-2 sm:mb-2.5">
              <ContentTypeSwitcher isPro={isPro} />
            </div>

            {/* Categories - seamless, no extra card */}
            {showCategories && (
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
            )}

            {/* Jobs Budget Filter */}
            {isJobsPage && (
              <JobsFilterSection
                selectedBudget={selectedBudget}
                onSelectBudget={setSelectedBudget}
              />
            )}
          </div>

          {/* Subtle separator before content */}
          <div
            className="h-px mb-2 sm:mb-3 opacity-50"
            style={{ backgroundColor: "var(--color-border)" }}
          />

          {/* Child page content */}
          {children}
        </div>
      </main>
    </div>
  );
}

export default function BrowseLayout({ children }: { children: ReactNode }) {
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
