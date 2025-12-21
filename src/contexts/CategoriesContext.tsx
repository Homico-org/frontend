'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '@/lib/api';

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

export interface Subcategory {
  key: string;
  name: string;
  nameKa: string;
  icon?: string;
  keywords: string[];
  sortOrder: number;
  isActive: boolean;
  children: SubSubcategory[];
}

export interface Category {
  _id: string;
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
  getCategoryName: (key: string, locale: 'en' | 'ka') => string;
  getSubcategoryName: (categoryKey: string, subcategoryKey: string, locale: 'en' | 'ka') => string;
  refetch: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<FlatCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesRes, flatRes] = await Promise.all([
        api.get<Category[]>('/categories'),
        api.get<FlatCategoryItem[]>('/categories/flat'),
      ]);

      setCategories(categoriesRes.data);
      setFlatCategories(flatRes.data);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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

  const getCategoryName = useCallback((key: string, locale: 'en' | 'ka'): string => {
    const category = getCategoryByKey(key);
    if (!category) return key;
    return locale === 'ka' ? category.nameKa : category.name;
  }, [getCategoryByKey]);

  const getSubcategoryName = useCallback(
    (categoryKey: string, subcategoryKey: string, locale: 'en' | 'ka'): string => {
      const subcategories = getSubcategoriesForCategory(categoryKey);
      const subcategory = subcategories.find(sub => sub.key === subcategoryKey);
      if (!subcategory) return subcategoryKey;
      return locale === 'ka' ? subcategory.nameKa : subcategory.name;
    },
    [getSubcategoriesForCategory]
  );

  return (
    <CategoriesContext.Provider
      value={{
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
      }}
    >
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
