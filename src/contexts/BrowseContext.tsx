"use client";

import { createContext, useContext, ReactNode, useState, useCallback } from "react";

interface BrowseContextType {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedSubcategory: string | null;
  setSelectedSubcategory: (subcategory: string | null) => void;
  minRating: number;
  setMinRating: (rating: number) => void;
  selectedBudget: string;
  setSelectedBudget: (budget: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
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
  const [selectedCity, setSelectedCity] = useState<string>('tbilisi');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recommended');

  const clearAllFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setMinRating(0);
    setSelectedBudget('all');
    setSelectedCity('tbilisi');
    setSearchQuery('');
    setSortBy('recommended');
  }, []);

  const hasActiveFilters = selectedCategory !== null ||
    selectedSubcategory !== null ||
    minRating > 0 ||
    selectedBudget !== 'all' ||
    selectedCity !== 'tbilisi' ||
    searchQuery !== '';

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
        selectedCity,
        setSelectedCity,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        clearAllFilters,
        hasActiveFilters,
      }}
    >
      {children}
    </BrowseContext.Provider>
  );
}
