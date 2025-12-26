"use client";

import CategorySubcategorySelector from "@/components/common/CategorySubcategorySelector";
import { useLanguage } from "@/contexts/LanguageContext";

interface CategoriesStepProps {
  selectedCategories: string[];
  selectedSubcategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onSubcategoriesChange: (subcategories: string[]) => void;
}

export default function CategoriesStep({
  selectedCategories,
  selectedSubcategories,
  onCategoriesChange,
  onSubcategoriesChange,
}: CategoriesStepProps) {
  const { locale } = useLanguage();

  const isComplete =
    selectedCategories.length > 0 && selectedSubcategories.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Category Selection Card */}
      <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
              {locale === "ka"
                ? "1. აირჩიე მთავარი კატეგორია"
                : "1. Choose Main Category"}
            </h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {locale === "ka"
                ? "მაქსიმუმ 4 კატეგორია"
                : "Maximum 4 categories"}
            </p>
          </div>
          {selectedCategories.length > 0 && (
            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-[#E07B4F]/10 text-[#E07B4F]">
              {selectedCategories.length}{" "}
              {locale === "ka" ? "არჩეული" : "selected"}
            </span>
          )}
        </div>

        <CategorySubcategorySelector
          selectedCategories={selectedCategories}
          selectedSubcategories={selectedSubcategories}
          onCategoriesChange={onCategoriesChange}
          onSubcategoriesChange={onSubcategoriesChange}
          singleCategoryMode={false}
          maxCategories={4}
          maxSubcategories={10}
        />
      </div>
    </div>
  );
}
