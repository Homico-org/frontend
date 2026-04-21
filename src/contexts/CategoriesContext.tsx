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

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<FlatCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to prevent duplicate fetches (React Strict Mode)
  const fetchedRef = React.useRef(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesRes, flatRes] = await Promise.all([
        api.get(`/service-catalog/as-categories`),
        api.get<FlatCategoryItem[]>('/service-catalog/as-categories/flat'),
      ]);

      setCategories(categoriesRes.data.map(transformCategory));
      setFlatCategories(flatRes.data);
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
