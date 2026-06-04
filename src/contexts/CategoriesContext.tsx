'use client';

import api from '@/lib/api';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Types matching the backend schema
export interface SubSubcategory {
  key: string;
  name: string;
  nameKa: string;
  icon?: string;
  keywords: string[];
  sortOrder: number;
  isActive: boolean;
}

export interface CatalogUnitOption {
  id?: string; // Stable permanent identifier — save selections by id
  key: string;
  unit: string;
  label: { en: string; ka: string; ru: string };
  defaultPrice: number;
  maxPrice?: number;
}

export type CatalogPricingModel = 'fixed' | 'range' | 'from' | 'quote';
export type CatalogServiceType =
  | 'installation'
  | 'repair'
  | 'maintenance'
  | 'consultation'
  | 'emergency'
  | 'recurring';

export interface CatalogServiceItem {
  id?: string; // Stable permanent identifier — save selections by id
  key: string;
  name: string;
  nameKa: string;
  nameRu?: string;
  // Backward compat — primary unit (from unitOptions[0])
  basePrice: number;
  maxPrice?: number;
  unit: string;
  unitName: string;
  unitNameKa: string;
  // Multi-unit pricing options
  unitOptions?: CatalogUnitOption[];
  // Optional flexibility fields (added 2026-05). All optional and
  // backward-compatible — old documents resolve them to undefined.
  description?: { en: string; ka: string; ru: string };
  priceRange?: { min: number; typical?: number; max: number };
  pricingModel?: CatalogPricingModel;
  serviceType?: CatalogServiceType;
  estimatedDurationMin?: number;
  estimatedDurationMax?: number;
  tags?: string[];
  imageUrl?: string;
}

export interface Subcategory {
  id?: string; // Stable permanent identifier — save selections by id
  key: string;
  name: string;
  nameKa: string;
  icon?: string;
  keywords: string[];
  sortOrder: number;
  isActive: boolean;
  children: SubSubcategory[];
  services?: CatalogServiceItem[];
  priceRange?: { min: number; max?: number };
  // Optional flexibility (added 2026-05)
  imageUrl?: string;
  tags?: string[];
}

export interface Category {
  id: string; // Stable permanent identifier — save selections by id
  key: string;
  name: string;
  nameKa: string;
  description?: string;
  descriptionKa?: string;
  icon?: string;
  keywords: string[];
  isActive: boolean;
  sortOrder: number;
  subcategories: Subcategory[];
  // Brand color per category (e.g. "#3B82F6" for plumbing). Drives icon
  // backplates and accent strips throughout the UI.
  color?: string;
  minPrice?: number;
  // Optional flexibility (added 2026-05)
  imageUrl?: string;
  tags?: string[];
}

// Raw category from API (before transformation)
interface RawCategory {
  _id?: string;
  id?: string;
  key: string;
  name: string;
  nameKa?: string;
  description?: string;
  descriptionKa?: string;
  icon?: string;
  keywords: string[];
  isActive: boolean;
  sortOrder: number;
  subcategories?: RawSubcategory[];
  color?: string;
  minPrice?: number;
  imageUrl?: string;
  tags?: string[];
}

interface RawSubcategory {
  _id?: string;
  id?: string;
  key: string;
  name: string;
  nameKa?: string;
  description?: string;
  descriptionKa?: string;
  keywords?: string[];
  isActive?: boolean;
  sortOrder?: number;
  icon?: string;
  children?: SubSubcategory[];
  services?: CatalogServiceItem[];
  priceRange?: { min: number; max?: number };
  imageUrl?: string;
  tags?: string[];
}

// Transform raw subcategory to frontend format
function transformSubcategory(sub: RawSubcategory): Subcategory {
  return {
    id: sub.id,
    key: sub.key,
    name: sub.name,
    nameKa: sub.nameKa || sub.name,
    icon: sub.icon,
    keywords: sub.keywords || [],
    sortOrder: sub.sortOrder ?? 0,
    isActive: sub.isActive ?? true,
    children: sub.children || [],
    services: sub.services || [],
    priceRange: sub.priceRange,
    imageUrl: sub.imageUrl,
    tags: sub.tags,
  };
}

// Transform backend response to frontend format
function transformCategory(cat: RawCategory): Category {
  return {
    id: cat.id || cat._id || cat.key, // Prefer stable catalog id over Mongo _id
    key: cat.key,
    name: cat.name,
    nameKa: cat.nameKa || cat.name,
    description: cat.description,
    descriptionKa: cat.descriptionKa,
    icon: cat.icon,
    keywords: cat.keywords || [],
    isActive: cat.isActive ?? true,
    sortOrder: cat.sortOrder ?? 0,
    subcategories: (cat.subcategories || []).map(transformSubcategory),
    color: cat.color,
    minPrice: cat.minPrice,
    imageUrl: cat.imageUrl,
    tags: cat.tags,
  };
}

export interface FlatCategoryItem {
  key: string;
  name: string;
  nameKa: string;
  type: 'category' | 'subcategory' | 'subsubcategory';
  parentKey?: string;
  parentSubKey?: string;
  icon?: string;
}

interface CategoriesContextType {
  categories: Category[];
  flatCategories: FlatCategoryItem[];
  loading: boolean;
  error: string | null;
  getCategoryByKey: (key: string) => Category | undefined;
  getSubcategoriesForCategory: (categoryKey: string) => Subcategory[];
  getSubSubcategoriesForSubcategory: (categoryKey: string, subcategoryKey: string) => SubSubcategory[];
  getCategoryName: (key: string, locale: 'en' | 'ka' | 'ru') => string;
  getSubcategoryName: (categoryKey: string, subcategoryKey: string, locale: 'en' | 'ka' | 'ru') => string;
  refetch: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

/**
 * Cache the fetched catalog in localStorage so refreshes hydrate
 * synchronously with the localized names. Before this, every page
 * load flashed raw snake_case keys (`bathroom_install`,
 * `water_heater`) for ~300-800ms while the `/service-catalog`
 * request was in flight.
 *
 * Versioning: bump CACHE_VERSION whenever the Category /
 * Subcategory / CatalogServiceItem shapes change so we don't
 * deserialize stale-shaped data. TTL guards against catalog edits
 * propagating: after 7 days we refetch fresh even if the user keeps
 * the same browser.
 */
const CACHE_KEY = 'homi:catalog:v1';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CachedCatalog {
  categories: Category[];
  flatCategories: FlatCategoryItem[];
  timestamp: number;
}

function readCachedCatalog(): CachedCatalog | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedCatalog;
    if (!parsed.timestamp || Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedCatalog(categories: Category[], flatCategories: FlatCategoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedCatalog = {
      categories,
      flatCategories,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Quota or private-mode lockouts - dropping the write is fine;
    // the next visit just pays the network cost again.
  }
}

export function CategoriesProvider({ children }: { children: ReactNode }) {
  // Initial state must match what the server renders. Reading
  // localStorage in a useState initializer would give the client a
  // populated array on first paint while the server rendered empty
  // ones, causing a hydration mismatch (any consumer that gates
  // a section on `categories.length` would render differently on
  // each side). The cache is replayed in the effect below instead,
  // before the network fetch resolves, so the visible flicker is
  // limited to one paint.
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<FlatCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to prevent duplicate fetches (React Strict Mode)
  const fetchedRef = React.useRef(false);

  // Hydrate from the localStorage cache after mount. Same data the
  // useState initializer used to read; just moved out of the
  // synchronous render path to keep server / client output identical.
  useEffect(() => {
    const cached = readCachedCatalog();
    if (cached) {
      setCategories(cached.categories);
      setFlatCategories(cached.flatCategories);
      if (cached.categories.length > 0) setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setError(null);

      const [categoriesRes, flatRes] = await Promise.all([
        api.get(`/service-catalog/as-categories`),
        api.get<FlatCategoryItem[]>('/service-catalog/as-categories/flat'),
      ]);

      const transformed = categoriesRes.data.map(transformCategory);
      setCategories(transformed);
      setFlatCategories(flatRes.data);
      writeCachedCatalog(transformed, flatRes.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      const error = err as { message?: string };
      setError(error.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prevent duplicate fetch in React Strict Mode
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchCategories();
  }, [fetchCategories]);

  const getCategoryByKey = useCallback((key: string): Category | undefined => {
    return categories.find(cat => cat.key === key);
  }, [categories]);

  const getSubcategoriesForCategory = useCallback((categoryKey: string): Subcategory[] => {
    const category = getCategoryByKey(categoryKey);
    return category?.subcategories || [];
  }, [getCategoryByKey]);

  const getSubSubcategoriesForSubcategory = useCallback(
    (categoryKey: string, subcategoryKey: string): SubSubcategory[] => {
      const subcategories = getSubcategoriesForCategory(categoryKey);
      const subcategory = subcategories.find(sub => sub.key === subcategoryKey);
      return subcategory?.children || [];
    },
    [getSubcategoriesForCategory]
  );

  const getCategoryName = useCallback((key: string, locale: 'en' | 'ka' | 'ru'): string => {
    const category = getCategoryByKey(key);
    if (!category) return key;
    return locale === 'ka' ? category.nameKa : category.name;
  }, [getCategoryByKey]);

  const getSubcategoryName = useCallback(
    (categoryKey: string, subcategoryKey: string, locale: 'en' | 'ka' | 'ru'): string => {
      const subcategories = getSubcategoriesForCategory(categoryKey);
      const subcategory = subcategories.find(sub => sub.key === subcategoryKey);
      if (!subcategory) return subcategoryKey;
      return locale === 'ka' ? subcategory.nameKa : subcategory.name;
    },
    [getSubcategoriesForCategory]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    categories,
    flatCategories,
    loading,
    error,
    getCategoryByKey,
    getSubcategoriesForCategory,
    getSubSubcategoriesForSubcategory,
    getCategoryName,
    getSubcategoryName,
    refetch: fetchCategories,
  }), [categories, flatCategories, loading, error, getCategoryByKey, getSubcategoriesForCategory, getSubSubcategoriesForSubcategory, getCategoryName, getSubcategoryName, fetchCategories]);

  return (
    <CategoriesContext.Provider value={contextValue}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}
