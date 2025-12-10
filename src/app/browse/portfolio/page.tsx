"use client";

import FeedSection from "@/components/browse/FeedSection";
import { useBrowseContext } from "@/contexts/BrowseContext";

export default function PortfolioPage() {
  const { selectedCategory } = useBrowseContext();

  return <FeedSection selectedCategory={selectedCategory} />;
}
