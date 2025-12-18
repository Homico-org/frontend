"use client";

import FeedSection from "@/components/browse/FeedSection";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star, X } from "lucide-react";
import { useState } from "react";

// Terracotta accent - matching design
const ACCENT_COLOR = '#C4735B';

// Quick filter options matching design exactly
const QUICK_FILTERS = [
  { key: 'top-rated', label: 'Top Rated', labelKa: 'რეიტინგით', hasIcon: true },
  { key: 'renovation', label: 'Renovation', labelKa: 'რემონტი', hasIcon: false },
  { key: 'cleaning', label: 'Cleaning', labelKa: 'დასუფთავება', hasIcon: false },
  { key: 'plumbing', label: 'Plumbing', labelKa: 'სანტექნიკა', hasIcon: false },
  { key: 'landscaping', label: 'Landscaping', labelKa: 'ლანდშაფტი', hasIcon: false },
];

export default function PortfolioPage() {
  const { selectedCategory, setSelectedCategory, setSelectedSubcategory } = useBrowseContext();
  const { locale } = useLanguage();
  const [topRatedActive, setTopRatedActive] = useState(false);

  const toggleFilter = (key: string) => {
    if (key === 'top-rated') {
      setTopRatedActive(!topRatedActive);
    } else {
      if (selectedCategory === key) {
        setSelectedCategory(null);
        setSelectedSubcategory(null);
      } else {
        setSelectedCategory(key);
        setSelectedSubcategory(null);
      }
    }
  };

  return (
    <div>
      {/* Page Header - Matching design exactly */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 italic">
          {locale === 'ka' ? 'ტრენდული პორტფოლიოები' : 'Trending Portfolios'}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-base">
          {locale === 'ka'
            ? 'აღმოაჩინე საუკეთესო ნამუშევრები საქართველოს წამყვანი სპეციალისტებისგან.'
            : 'Discover the best works from top professionals in Georgia.'}
        </p>
      </div>

      {/* Quick Filter Pills - Matching design exactly */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {QUICK_FILTERS.map(filter => {
          const isActive = filter.key === 'top-rated'
            ? topRatedActive
            : selectedCategory === filter.key;

          return (
            <button
              key={filter.key}
              onClick={() => toggleFilter(filter.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'text-white'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-sm'
              }`}
              style={isActive ? { backgroundColor: ACCENT_COLOR } : {}}
            >
              {filter.hasIcon && (
                <Star className="w-4 h-4" fill={isActive ? 'currentColor' : 'none'} />
              )}
              <span>{locale === 'ka' ? filter.labelKa : filter.label}</span>
              {isActive && (
                <X className="w-3.5 h-3.5 ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feed Content - Grid of cards */}
      <FeedSection
        selectedCategory={selectedCategory}
        topRatedActive={topRatedActive}
      />
    </div>
  );
}
