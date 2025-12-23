"use client";

import FeedSection from "@/components/browse/FeedSection";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { useState } from "react";

export default function PortfolioPage() {
  const { selectedCategory } = useBrowseContext();
  const [topRatedActive] = useState(false);

  return (
    <FeedSection
      selectedCategory={selectedCategory}
      topRatedActive={topRatedActive}
    />
  );
}
