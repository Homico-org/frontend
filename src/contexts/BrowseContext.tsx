"use client";

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface BrowseContextType {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  // Support single subcategory for backward compatibility
  selectedSubcategory: string | null;
  setSelectedSubcategory: (subcategory: string | null) => void;
  // Support multiple subcategories
  selectedSubcategories: string[];
  setSelectedSubcategories: (subcategories: string[]) => void;
  toggleSubcategory: (subcategory: string) => void;
  minRating: number;
  setMinRating: (rating: number) => void;
  selectedBudget: string;
  setSelectedBudget: (budget: string) => void;
  budgetMin: number | null;
  setBudgetMin: (value: number | null) => void;
  budgetMax: number | null;
  setBudgetMax: (value: number | null) => void;
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
  initialSubcategories?: string[];
}

export function BrowseProvider({
  children,
  initialCategory = null,
  initialSubcategory = null,
  initialSubcategories = [],
}: BrowseProviderProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  
  // Initialize subcategories from either single or multiple
  const initialSubcatsArray = initialSubcategories.length > 0 
    ? initialSubcategories 
    : (initialSubcategory ? [initialSubcategory] : []);
  
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(initialSubcatsArray);
  
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedBudget, setSelectedBudget] = useState<string>('all');
  const [budgetMin, setBudgetMin] = useState<number | null>(null);
  const [budgetMax, setBudgetMax] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recommended');

  // URL sync
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync state to URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedCategory) {
      params.set('category', selectedCategory);
    }
    if (selectedSubcategories.length > 0) {
      params.set('subcategories', selectedSubcategories.join(','));
    }
    if (minRating > 0) {
      params.set('minRating', minRating.toString());
    }
    if (budgetMin !== null) {
      params.set('budgetMin', budgetMin.toString());
    }
    if (budgetMax !== null) {
      params.set('budgetMax', budgetMax.toString());
    }
    if (searchQuery) {
      params.set('search', searchQuery);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Only update if URL actually changed
    const currentParams = searchParams.toString();
    if (queryString !== currentParams) {
      router.replace(newUrl, { scroll: false });
    }
  }, [selectedCategory, selectedSubcategories, minRating, budgetMin, budgetMax, searchQuery, pathname, router, searchParams]);

  // For backward compatibility - return first subcategory or null
  const selectedSubcategory = selectedSubcategories.length > 0 ? selectedSubcategories[0] : null;
  
  // For backward compatibility - set single subcategory
  const setSelectedSubcategory = useCallback((subcategory: string | null) => {
    setSelectedSubcategories(subcategory ? [subcategory] : []);
  }, []);

  // Toggle a subcategory in the array
  const toggleSubcategory = useCallback((subcategory: string) => {
    setSelectedSubcategories(prev => {
      if (prev.includes(subcategory)) {
        return prev.filter(s => s !== subcategory);
      } else {
        return [...prev, subcategory];
      }
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedSubcategories([]);
    setMinRating(0);
    setSelectedBudget('common.all');
    setBudgetMin(null);
    setBudgetMax(null);
    setSelectedCity('all');
    setSearchQuery('');
    setSortBy('recommended');
  }, []);

  const hasActiveFilters = selectedCategory !== null ||
    selectedSubcategories.length > 0 ||
    minRating > 0 ||
    selectedBudget !== 'all' ||
    budgetMin !== null ||
    budgetMax !== null ||
    selectedCity !== 'all' ||
    searchQuery !== '';

  return (
    <BrowseContext.Provider
      value={{
        selectedCategory,
        setSelectedCategory,
        selectedSubcategory,
        setSelectedSubcategory,
        selectedSubcategories,
        setSelectedSubcategories,
        toggleSubcategory,
        minRating,
        setMinRating,
        selectedBudget,
        setSelectedBudget,
        budgetMin,
        setBudgetMin,
        budgetMax,
        setBudgetMax,
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
