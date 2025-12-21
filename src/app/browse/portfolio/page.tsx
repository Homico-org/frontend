"use client";

import FeedSection from "@/components/browse/FeedSection";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

// Terracotta accent - matching design
const ACCENT_COLOR = '#C4735B';

export default function PortfolioPage() {
  const { selectedCategory, setSelectedCategory, setSelectedSubcategory } = useBrowseContext();
  const { locale } = useLanguage();
  const [topRatedActive, setTopRatedActive] = useState(false);

  return (
    <div>
      {/* Page Header - Matching design exactly */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          {locale === 'ka' ? 'ტრენდული პორტფოლიოები' : 'Trending Portfolios'}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-base">
          {locale === 'ka'
            ? 'აღმოაჩინე საუკეთესო ნამუშევრები საქართველოს წამყვანი სპეციალისტებისგან.'
            : 'Discover the best works from top professionals in Georgia.'}
        </p>
      </div>

      {/* Feed Content - Grid of cards */}
      <FeedSection
        selectedCategory={selectedCategory}
        topRatedActive={topRatedActive}
      />
    </div>
  );
}
