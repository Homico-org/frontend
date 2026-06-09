"use client";

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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
  // Show only Homico Partners (the bookable pros).
  partnersOnly: boolean;
  setPartnersOnly: (value: boolean) => void;
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

/**
 * Read every browse filter the URL knows about. Returning a partial
 * object lets the provider mount-effect fall back to props/defaults
 * for fields the URL doesn't carry.
 */
function readFiltersFromParams(params: URLSearchParams) {
  const subcatRaw = params.get("subcategories");
  return {
    category: params.get("category"),
    subcategories: subcatRaw ? subcatRaw.split(",").filter(Boolean) : null,
    minRating: params.has("minRating") ? Number(params.get("minRating")) || 0 : null,
    budgetMin: params.has("budgetMin") ? Number(params.get("budgetMin")) : null,
    budgetMax: params.has("budgetMax") ? Number(params.get("budgetMax")) : null,
    selectedBudget: params.get("budget"),
    selectedCity: params.get("city"),
    searchQuery: params.get("search"),
    sortBy: params.get("sort"),
    partnersOnly: params.has("partnersOnly"),
  };
}

export function BrowseProvider({
  children,
  initialCategory = null,
  initialSubcategory = null,
  initialSubcategories = [],
}: BrowseProviderProps) {
  // Initial values: URL wins over props wins over defaults. Reading
  // `useSearchParams` (instead of `window.location.search`) keeps the
  // initial state identical on server and client - reading `window`
  // synchronously here used to give the server an empty filter set
  // while the client first-painted with the deeplinked filters,
  // triggering hydration mismatches on any UI that gated on these
  // values.
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialFromUrl = searchParams
    ? readFiltersFromParams(new URLSearchParams(searchParams.toString()))
    : null;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialFromUrl?.category ?? initialCategory,
  );

  const propSubcats =
    initialSubcategories.length > 0
      ? initialSubcategories
      : initialSubcategory
        ? [initialSubcategory]
        : [];
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    initialFromUrl?.subcategories ?? propSubcats,
  );

  const [minRating, setMinRating] = useState<number>(initialFromUrl?.minRating ?? 0);
  const [selectedBudget, setSelectedBudget] = useState<string>(initialFromUrl?.selectedBudget ?? "all");
  const [budgetMin, setBudgetMin] = useState<number | null>(initialFromUrl?.budgetMin ?? null);
  const [budgetMax, setBudgetMax] = useState<number | null>(initialFromUrl?.budgetMax ?? null);
  const [selectedCity, setSelectedCity] = useState<string>(initialFromUrl?.selectedCity ?? "all");
  const [searchQuery, setSearchQuery] = useState<string>(initialFromUrl?.searchQuery ?? "");
  const [sortBy, setSortBy] = useState<string>(initialFromUrl?.sortBy ?? "recommended");
  const [partnersOnly, setPartnersOnly] = useState<boolean>(initialFromUrl?.partnersOnly ?? false);

  // Sync state to URL when filters change. Every browse-list-shaped
  // page should be deep-linkable: paste the URL into a new tab and
  // see the same results. Only writes for /professionals - JobsContext
  // owns the /jobs URL.
  useEffect(() => {
    if (!pathname.includes("/professionals")) return;

    const params = new URLSearchParams();

    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedSubcategories.length > 0) params.set("subcategories", selectedSubcategories.join(","));
    if (minRating > 0) params.set("minRating", minRating.toString());
    if (selectedBudget && selectedBudget !== "all") params.set("budget", selectedBudget);
    if (budgetMin !== null) params.set("budgetMin", budgetMin.toString());
    if (budgetMax !== null) params.set("budgetMax", budgetMax.toString());
    if (selectedCity && selectedCity !== "all") params.set("city", selectedCity);
    if (searchQuery) params.set("search", searchQuery);
    if (sortBy && sortBy !== "recommended") params.set("sort", sortBy);
    if (partnersOnly) params.set("partnersOnly", "true");

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Use replaceState directly to avoid Next.js router re-render
    // loops. The router would re-run server components, which re-mount
    // the BrowseProvider, which resets state. Native History API
    // sidesteps all that.
    if (typeof window !== "undefined") {
      const currentUrl = window.location.pathname + window.location.search;
      if (currentUrl !== targetUrl) {
        window.history.replaceState(null, "", targetUrl);
      }
    }
  }, [
    selectedCategory,
    selectedSubcategories,
    minRating,
    selectedBudget,
    budgetMin,
    budgetMax,
    selectedCity,
    searchQuery,
    sortBy,
    partnersOnly,
    pathname,
  ]);

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
    setSelectedBudget("all");
    setBudgetMin(null);
    setBudgetMax(null);
    setSelectedCity("all");
    setSearchQuery("");
    setSortBy("recommended");
    setPartnersOnly(false);
  }, []);

  const hasActiveFilters =
    selectedCategory !== null ||
    selectedSubcategories.length > 0 ||
    minRating > 0 ||
    selectedBudget !== "all" ||
    budgetMin !== null ||
    budgetMax !== null ||
    selectedCity !== "all" ||
    searchQuery !== "" ||
    partnersOnly ||
    (sortBy !== "" && sortBy !== "recommended");

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
        partnersOnly,
        setPartnersOnly,
        clearAllFilters,
        hasActiveFilters,
      }}
    >
      {children}
    </BrowseContext.Provider>
  );
}
