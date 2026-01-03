"use client";

import { Input } from "@/components/ui/input";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

interface CategoriesStepProps {
  selectedCategories: string[];
  selectedSubcategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onSubcategoriesChange: (subcategories: string[]) => void;
  customServices?: string[];
  onCustomServicesChange?: (services: string[]) => void;
}

// Category icons - same as register page
const categoryIcons: Record<string, React.ReactNode> = {
  "interior-design": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  "architecture": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  "craftsmen": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  "home-care": (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
};

export default function CategoriesStep({
  selectedCategories,
  selectedSubcategories,
  onCategoriesChange,
  onSubcategoriesChange,
  customServices = [],
  onCustomServicesChange,
}: CategoriesStepProps) {
  const { locale } = useLanguage();
  const { categories } = useCategories();
  const [newCustomService, setNewCustomService] = useState("");

  const handleCategoryToggle = (categoryKey: string) => {
    if (selectedCategories.includes(categoryKey)) {
      // Remove category and its subcategories
      onCategoriesChange(selectedCategories.filter(c => c !== categoryKey));
      const category = categories.find(c => c.key === categoryKey);
      if (category) {
        const categorySubKeys = category.subcategories.map(s => s.key);
        onSubcategoriesChange(selectedSubcategories.filter(s => !categorySubKeys.includes(s)));
      }
    } else if (selectedCategories.length < 4) {
      onCategoriesChange([...selectedCategories, categoryKey]);
    }
  };

  const handleSubcategoryToggle = (subcategoryKey: string) => {
    if (selectedSubcategories.includes(subcategoryKey)) {
      onSubcategoriesChange(selectedSubcategories.filter(s => s !== subcategoryKey));
    } else if (selectedSubcategories.length < 10) {
      onSubcategoriesChange([...selectedSubcategories, subcategoryKey]);
    }
  };

  const handleAddCustomService = () => {
    if (newCustomService.trim() && customServices.length < 5 && onCustomServicesChange) {
      onCustomServicesChange([...customServices, newCustomService.trim()]);
      setNewCustomService("");
    }
  };

  const handleRemoveCustomService = (index: number) => {
    if (onCustomServicesChange) {
      onCustomServicesChange(customServices.filter((_, i) => i !== index));
    }
  };

  // Get all subcategories from selected categories
  const availableSubcategories = selectedCategories.flatMap(catKey => {
    const category = categories.find(c => c.key === catKey);
    return category?.subcategories || [];
  });

  return (
    <div className="space-y-4">
      {/* Main Categories */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 mb-2">
          1. {locale === "ka" ? "კატეგორია" : "Category"} <span className="text-[#C4735B]">*</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.key);
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => handleCategoryToggle(category.key)}
                className={`relative p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#C4735B] bg-[#C4735B]/5'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#C4735B] flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                  isSelected ? 'bg-[#C4735B] text-white' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {categoryIcons[category.key] || (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xs font-medium text-neutral-900 line-clamp-1">
                  {locale === "ka" ? category.nameKa : category.name}
                </h3>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcategories / Skills */}
      {selectedCategories.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-900">
              2. {locale === "ka" ? "უნარები" : "Skills"}
            </h2>
            {selectedSubcategories.length > 0 && (
              <span className="text-xs text-[#C4735B] font-medium">
                {selectedSubcategories.length} {locale === "ka" ? "არჩეული" : "selected"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availableSubcategories.map((subcategory) => {
              const isSelected = selectedSubcategories.includes(subcategory.key);
              return (
                <button
                  key={subcategory.key}
                  type="button"
                  onClick={() => handleSubcategoryToggle(subcategory.key)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-[#C4735B] text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {locale === "ka" ? subcategory.nameKa : subcategory.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Services - Same as register page */}
      {selectedCategories.length > 0 && onCustomServicesChange && (
        <div className="p-4 rounded-xl bg-white border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#C4735B]/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              3. {locale === "ka" ? "სერვისები" : "Services"}
              <span className="text-neutral-400 font-normal text-[10px]">({locale === "ka" ? "არასავალდებულო" : "optional"})</span>
            </h2>
            {customServices.length > 0 && (
              <span className="text-xs text-[#C4735B] font-medium">
                {customServices.length}/5
              </span>
            )}
          </div>

          <p className="text-xs text-neutral-500 mb-3">
            {locale === "ka"
              ? "ჩაწერე რა სერვისებს სთავაზობ კლიენტებს (მაქს. 5)"
              : "Write what services you offer to clients (max 5)"}
          </p>

          {/* Added custom services */}
          {customServices.length > 0 && (
            <div className="space-y-2 mb-3">
              {customServices.map((service, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-[#C4735B]/5 border border-[#C4735B]/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C4735B] flex-shrink-0" />
                  <span className="flex-1 text-sm text-neutral-900">{service}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomService(index)}
                    className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new service input */}
          {customServices.length < 5 && (
            <div className="flex gap-2">
              <Input
                type="text"
                value={newCustomService}
                onChange={(e) => setNewCustomService(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCustomService.trim()) {
                    e.preventDefault();
                    handleAddCustomService();
                  }
                }}
                placeholder={locale === "ka" ? "მაგ: ინტერიერის დიზაინი" : "e.g: Interior design"}
                inputSize="sm"
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleAddCustomService}
                disabled={!newCustomService.trim()}
                className="px-3 py-2 rounded-lg bg-[#C4735B] text-white text-sm font-medium hover:bg-[#A85D47] disabled:bg-neutral-200 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
