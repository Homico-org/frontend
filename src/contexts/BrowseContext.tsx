"use client";

import { createContext, useContext, ReactNode, useState } from "react";

interface BrowseContextType {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedSubcategory: string | null;
  setSelectedSubcategory: (subcategory: string | null) => void;
  minRating: number;
  setMinRating: (rating: number) => void;
  selectedBudget: string;
  setSelectedBudget: (budget: string) => void;
}

const BrowseContext = createContext<BrowseContextType | null>(null);

export function useBrowseContext() {
  const context = useContext(BrowseContext);
  if (!context) {
    throw new Error("useBrowseContext must be used within BrowseProvider");
  }
  return context;
}

interface BrowseProviderProps {
  children: ReactNode;
  initialCategory?: string | null;
  initialSubcategory?: string | null;
}

export function BrowseProvider({
  children,
  initialCategory = null,
  initialSubcategory = null,
}: BrowseProviderProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(initialSubcategory);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedBudget, setSelectedBudget] = useState<string>('all');

  return (
    <BrowseContext.Provider
      value={{
        selectedCategory,
        setSelectedCategory,
        selectedSubcategory,
        setSelectedSubcategory,
        minRating,
        setMinRating,
        selectedBudget,
        setSelectedBudget,
      }}
    >
      {children}
    </BrowseContext.Provider>
  );
}
