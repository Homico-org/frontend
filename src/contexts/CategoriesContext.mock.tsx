'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Types matching the real context
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

// Mock categories for Storybook
const mockCategories: Category[] = [
  {
    _id: '1',
    key: 'design',
    name: 'Interior Design',
    nameKa: 'ინტერიერის დიზაინი',
    icon: 'designer',
    isActive: true,
    sortOrder: 1,
    keywords: [],
    subcategories: [
      { key: 'interior', name: 'Interior', nameKa: 'ინტერიერი', isActive: true, sortOrder: 1, keywords: [], children: [] },
      { key: 'residential', name: 'Residential', nameKa: 'საცხოვრებელი', isActive: true, sortOrder: 2, keywords: [], children: [] },
    ],
  },
  {
    _id: '2',
    key: 'architecture',
    name: 'Architecture',
    nameKa: 'არქიტექტურა',
    icon: 'architect',
    isActive: true,
    sortOrder: 2,
    keywords: [],
    subcategories: [],
  },
  {
    _id: '3',
    key: 'craftsmen',
    name: 'Craftsmen',
    nameKa: 'ხელოსნები',
    icon: 'craftsmen',
    isActive: true,
    sortOrder: 3,
    keywords: [],
    subcategories: [
      { key: 'renovation', name: 'Renovation', nameKa: 'რემონტი', isActive: true, sortOrder: 1, keywords: [], children: [] },
      { key: 'plumbing', name: 'Plumbing', nameKa: 'სანტექნიკა', isActive: true, sortOrder: 2, keywords: [], children: [] },
    ],
  },
  {
    _id: '4',
    key: 'homecare',
    name: 'Home Care',
    nameKa: 'სახლის მოვლა',
    icon: 'homecare',
    isActive: true,
    sortOrder: 4,
    keywords: [],
    subcategories: [],
  },
];

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const mockContext: CategoriesContextType = {
    categories: mockCategories,
    flatCategories: [],
    loading: false,
    error: null,
    getCategoryByKey: (key: string) => mockCategories.find(c => c.key === key),
    getSubcategoriesForCategory: (categoryKey: string) => {
      const cat = mockCategories.find(c => c.key === categoryKey);
      return cat?.subcategories || [];
    },
    getSubSubcategoriesForSubcategory: () => [],
    getCategoryName: (key: string, locale: 'en' | 'ka') => {
      const cat = mockCategories.find(c => c.key === key);
      if (!cat) return key;
      return locale === 'ka' ? cat.nameKa : cat.name;
    },
    getSubcategoryName: (categoryKey: string, subcategoryKey: string, locale: 'en' | 'ka') => {
      const cat = mockCategories.find(c => c.key === categoryKey);
      const sub = cat?.subcategories.find(s => s.key === subcategoryKey);
      if (!sub) return subcategoryKey;
      return locale === 'ka' ? sub.nameKa : sub.name;
    },
    refetch: async () => {},
  };

  return (
    <CategoriesContext.Provider value={mockContext}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories(): CategoriesContextType {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    // Return default for Storybook without provider
    return {
      categories: mockCategories,
      flatCategories: [],
      loading: false,
      error: null,
      getCategoryByKey: (key: string) => mockCategories.find(c => c.key === key),
      getSubcategoriesForCategory: (categoryKey: string) => {
        const cat = mockCategories.find(c => c.key === categoryKey);
        return cat?.subcategories || [];
      },
      getSubSubcategoriesForSubcategory: () => [],
      getCategoryName: (key: string) => key,
      getSubcategoryName: (_, subcategoryKey: string) => subcategoryKey,
      refetch: async () => {},
    };
  }
  return context;
}
