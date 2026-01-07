'use client';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import CategoryIcon from './CategoryIcon';

interface Category {
  key: string;
  name: string;
  nameKa: string;
  icon?: string;
  subcategories: Array<{
    key: string;
    name: string;
    nameKa: string;
  }>;
}

interface CategorySelectorProps {
  // Selection mode
  mode?: 'single' | 'multi';
  
  // For single mode
  selectedCategory?: string;
  selectedSubcategory?: string;
  onCategoryChange?: (categoryKey: string) => void;
  onSubcategoryChange?: (subcategoryKey: string) => void;
  
  // For multi mode
  selectedCategories?: string[];
  selectedSubcategories?: string[];
  onCategoriesChange?: (categoryKeys: string[]) => void;
  onSubcategoriesChange?: (subcategoryKeys: string[]) => void;
  
  // Limits
  maxCategories?: number;
  maxSubcategories?: number;
  
  // UI options
  showSearch?: boolean;
  showSubcategorySearch?: boolean;
  compact?: boolean;
  columns?: 2 | 3 | 4;
  
  // Labels
  categoryLabel?: string;
  subcategoryLabel?: string;
}

export default function CategorySelector({
  mode = 'single',
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  selectedCategories = [],
  selectedSubcategories = [],
  onCategoriesChange,
  onSubcategoriesChange,
  maxCategories = 4,
  maxSubcategories = 10,
  showSearch = false,
  showSubcategorySearch = true,
  compact = false,
  columns = 4,
}: CategorySelectorProps) {
  const { locale } = useLanguage();
  const { categories, loading } = useCategories();
  const [subcategorySearch, setSubcategorySearch] = useState('');

  // Normalize to arrays for internal handling
  const selected = mode === 'single' 
    ? (selectedCategory ? [selectedCategory] : [])
    : selectedCategories;
  
  const selectedSubs = mode === 'single'
    ? (selectedSubcategory ? [selectedSubcategory] : [])
    : selectedSubcategories;

  const handleCategoryClick = (categoryKey: string) => {
    if (mode === 'single') {
      // Single mode: toggle or select
      if (selectedCategory === categoryKey) {
        onCategoryChange?.('');
        onSubcategoryChange?.('');
      } else {
        onCategoryChange?.(categoryKey);
        onSubcategoryChange?.('');
      }
    } else {
      // Multi mode: add/remove from array
      const isSelected = selected.includes(categoryKey);
      if (isSelected) {
        // Remove category and its subcategories
        const newCategories = selected.filter(c => c !== categoryKey);
        onCategoriesChange?.(newCategories);
        
        // Remove subcategories of this category
        const categoryData = categories.find(c => c.key === categoryKey);
        if (categoryData) {
          const subKeys = categoryData.subcategories.map(s => s.key);
          const newSubs = selectedSubs.filter(s => !subKeys.includes(s));
          onSubcategoriesChange?.(newSubs);
        }
      } else if (selected.length < maxCategories) {
        onCategoriesChange?.([...selected, categoryKey]);
      }
    }
    setSubcategorySearch('');
  };

  const handleSubcategoryClick = (subcategoryKey: string, categoryKey: string) => {
    if (mode === 'single') {
      if (selectedSubcategory === subcategoryKey) {
        onSubcategoryChange?.('');
      } else {
        onSubcategoryChange?.(subcategoryKey);
      }
    } else {
      const isSelected = selectedSubs.includes(subcategoryKey);
      if (isSelected) {
        onSubcategoriesChange?.(selectedSubs.filter(s => s !== subcategoryKey));
      } else if (selectedSubs.length < maxSubcategories) {
        // Also ensure the parent category is selected
        if (!selected.includes(categoryKey)) {
          onCategoriesChange?.([...selected, categoryKey]);
        }
        onSubcategoriesChange?.([...selectedSubs, subcategoryKey]);
      }
    }
  };

  // Get category data for selected category(ies)
  const getSelectedCategoryData = () => {
    if (mode === 'single' && selectedCategory) {
      return categories.find(c => c.key === selectedCategory);
    }
    return null;
  };

  const selectedCategoryData = getSelectedCategoryData();

  // Filter subcategories by search
  const getFilteredSubcategories = (category: Category) => {
    if (!subcategorySearch.trim()) return category.subcategories;
    const query = subcategorySearch.toLowerCase();
    return category.subcategories.filter(
      sub => sub.name.toLowerCase().includes(query) || sub.nameKa.toLowerCase().includes(query)
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 rounded-xl bg-neutral-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };

  return (
    <div className="space-y-4">
      {/* Category Cards Grid */}
      <div className={`grid ${gridCols[columns]} gap-2.5`}>
        {categories.map((category) => {
          const isSelected = selected.includes(category.key);
          const isDisabled = !isSelected && mode === 'multi' && selected.length >= maxCategories;
          
          return (
            <button
              key={category.key}
              onClick={() => !isDisabled && handleCategoryClick(category.key)}
              disabled={isDisabled}
              className={`relative p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                isSelected
                  ? 'border-[#C4735B] bg-[#C4735B]/5 shadow-sm'
                  : isDisabled
                    ? 'border-neutral-100 bg-neutral-50 opacity-50 cursor-not-allowed'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2 transition-colors ${
                isSelected ? 'bg-[#C4735B] text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                <CategoryIcon type={category.icon || category.key} className="w-5 h-5" />
              </div>
              <h3 className={`text-xs font-medium transition-colors ${
                isSelected ? 'text-[#C4735B]' : 'text-neutral-700'
              }`}>
                {locale === 'ka' ? category.nameKa : category.name}
              </h3>
              
              {/* Selection indicator for multi mode */}
              {mode === 'multi' && isSelected && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#C4735B] flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Subcategories Panel - Single Mode */}
      {mode === 'single' && selectedCategory && selectedCategoryData && (
        <div className="bg-white rounded-xl border border-neutral-200 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#C4735B]/10 flex items-center justify-center">
                <CategoryIcon type={selectedCategoryData.icon || selectedCategoryData.key} className="w-3.5 h-3.5 text-[#C4735B]" />
              </div>
              <span className="font-medium text-sm text-neutral-900">
                {locale === 'ka' ? 'სერვისი' : 'Service'} <span className="text-[#C4735B]">*</span>
              </span>
            </div>
            {showSubcategorySearch && (
              <div className="relative">
                <Input
                  value={subcategorySearch}
                  onChange={(e) => setSubcategorySearch(e.target.value)}
                  placeholder={locale === 'ka' ? 'ძებნა...' : 'Search...'}
                  className="pl-8 pr-3 py-1.5 w-36 h-8 text-xs"
                  leftIcon={<Search className="w-3.5 h-3.5" />}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {getFilteredSubcategories(selectedCategoryData).map((sub) => {
              const isSubSelected = selectedSubcategory === sub.key;
              return (
                <button
                  key={sub.key}
                  onClick={() => handleSubcategoryClick(sub.key, selectedCategoryData.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSubSelected
                      ? 'bg-[#C4735B] text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {locale === 'ka' ? sub.nameKa : sub.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Subcategories Panel - Multi Mode */}
      {mode === 'multi' && selected.length > 0 && (
        <div className="space-y-3">
          {selected.map(categoryKey => {
            const categoryData = categories.find(c => c.key === categoryKey);
            if (!categoryData) return null;
            
            return (
              <div key={categoryKey} className="bg-white rounded-xl border border-neutral-200 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#C4735B]/10 flex items-center justify-center">
                      <CategoryIcon type={categoryData.icon || categoryData.key} className="w-3.5 h-3.5 text-[#C4735B]" />
                    </div>
                    <span className="font-medium text-sm text-neutral-900">
                      {locale === 'ka' ? categoryData.nameKa : categoryData.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCategoryClick(categoryKey)}
                    className="p-1 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {categoryData.subcategories.map((sub) => {
                    const isSubSelected = selectedSubs.includes(sub.key);
                    return (
                      <button
                        key={sub.key}
                        onClick={() => handleSubcategoryClick(sub.key, categoryKey)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSubSelected
                            ? 'bg-[#C4735B] text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {locale === 'ka' ? sub.nameKa : sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected count for multi mode */}
      {mode === 'multi' && (
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>
            {locale === 'ka' 
              ? `არჩეული კატეგორიები: ${selected.length}/${maxCategories}`
              : `Selected categories: ${selected.length}/${maxCategories}`}
          </span>
          <span>
            {locale === 'ka'
              ? `არჩეული სერვისები: ${selectedSubs.length}/${maxSubcategories}`
              : `Selected services: ${selectedSubs.length}/${maxSubcategories}`}
          </span>
        </div>
      )}
    </div>
  );
}

export type { CategorySelectorProps };

