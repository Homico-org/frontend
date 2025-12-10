"use client";

import CategorySection from "@/components/browse/CategorySection";
import ContentTypeSwitcher from "@/components/browse/ContentTypeSwitcher";
import Header from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { BrowseProvider, useBrowseContext } from "@/contexts/BrowseContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect } from "react";

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

  // Don't show categories for jobs page
  const showCategories = !pathname.includes("/browse/jobs");
  // Show rating filter only for professionals
  const showRatingFilter = pathname.includes("/browse/professionals");

  return (
    <div className="min-h-screen relative bg-[var(--color-bg-primary)]">
      <Header />

      <main className="relative z-20 pt-14 sm:pt-16 pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Inline header - compact on mobile */}
          <div className="pt-2 pb-3 sm:pb-5">
            {/* Title + Tabs Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className="min-w-0">
                <h1
                  className="text-xl sm:text-3xl font-bold tracking-tight"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {getPageTitle()}
                </h1>
                <p
                  className="text-xs sm:text-sm mt-0.5 sm:mt-1 opacity-70 line-clamp-1"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {getPageSubtitle()}
                </p>
              </div>
            </div>

            {/* Content Type Switcher */}
            <div className="mb-3 sm:mb-4">
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
          </div>

          {/* Subtle separator before content */}
          <div
            className="h-px mb-3 sm:mb-5 opacity-50"
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
