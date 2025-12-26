"use client";

import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Briefcase,
  DollarSign,
  MapPin,
  Pencil,
  User
} from "lucide-react";

interface ReviewStepProps {
  formData: {
    bio: string;
    yearsExperience: string;
    avatar: string;
    basePrice: string;
    maxPrice: string;
    pricingModel: string;
    serviceAreas: string[];
    nationwide: boolean;
  };
  selectedCategories: string[];
  selectedSubcategories: string[];
  avatarPreview: string | null;
  locationData: {
    nationwide: string;
  } | null;
  onEditStep: (step: number) => void;
  isEditMode?: boolean;
}

export default function ReviewStep({
  formData,
  selectedCategories,
  selectedSubcategories,
  avatarPreview,
  locationData,
  onEditStep,
  isEditMode = false,
}: ReviewStepProps) {
  const { locale } = useLanguage();
  const { getCategoryByKey, categories } = useCategories();

  // Helper to find subcategory by key across all categories
  const getSubcategoryByKey = (subKey: string) => {
    for (const cat of categories) {
      const sub = cat.subcategories?.find((s) => s.key === subKey);
      if (sub) return sub;
    }
    return undefined;
  };

  const getPricingSuffix = () => {
    switch (formData.pricingModel) {
      case "hourly":
        return locale === "ka" ? "₾/სთ" : "₾/hr";
      case "daily":
        return locale === "ka" ? "₾/დღე" : "₾/day";
      case "sqm":
        return "₾/m²";
      default:
        return "₾";
    }
  };

  const getPricingLabel = () => {
    switch (formData.pricingModel) {
      case "hourly":
        return locale === "ka" ? "საათობრივი" : "Hourly";
      case "daily":
        return locale === "ka" ? "დღიური" : "Daily";
      case "sqm":
        return locale === "ka" ? "კვადრატულ მეტრზე" : "Per square meter";
      case "project_based":
        return locale === "ka" ? "პროექტზე" : "Per project";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Profile Preview Card */}
      <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        {/* About Section */}
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <User className="w-4 h-4 text-[#E07B4F]" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {locale === "ka" ? "შენს შესახებ" : "About"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(0)}
              className="flex items-center gap-1.5 text-sm text-[#E07B4F] hover:text-[#D26B3F] font-medium transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              {locale === "ka" ? "რედაქტირება" : "Edit"}
            </button>
          </div>

          <div className="flex items-start gap-4">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt=""
                className="w-16 h-16 rounded-xl object-cover shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[var(--color-bg-muted)] flex items-center justify-center">
                <User className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {formData.yearsExperience || "0"}{" "}
                  {locale === "ka" ? "წლის გამოცდილება" : "years experience"}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3">
                {formData.bio ||
                  (locale === "ka" ? "არ არის დამატებული" : "Not added")}
              </p>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <Briefcase className="w-4 h-4 text-[#E07B4F]" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {locale === "ka" ? "სერვისები" : "Services"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="flex items-center gap-1.5 text-sm text-[#E07B4F] hover:text-[#D26B3F] font-medium transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              {locale === "ka" ? "რედაქტირება" : "Edit"}
            </button>
          </div>

          {/* Categories */}
          <div className="mb-4">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-2">
              {locale === "ka" ? "კატეგორიები" : "Categories"}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((catKey) => {
                const cat = getCategoryByKey(catKey);
                return (
                  <span
                    key={catKey}
                    className="px-3 py-1.5 rounded-lg bg-[#E07B4F]/10 text-[#E07B4F] text-sm font-medium"
                  >
                    {locale === "ka" ? cat?.nameKa : cat?.name}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Subcategories */}
          {selectedSubcategories.length > 0 && (
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)] mb-2">
                {locale === "ka" ? "უნარები" : "Skills"}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedSubcategories.slice(0, 6).map((subKey) => {
                  const sub = getSubcategoryByKey(subKey);
                  return (
                    <span
                      key={subKey}
                      className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-sm"
                    >
                      {locale === "ka" ? sub?.nameKa : sub?.name}
                    </span>
                  );
                })}
                {selectedSubcategories.length > 6 && (
                  <span className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] text-sm">
                    +{selectedSubcategories.length - 6}{" "}
                    {locale === "ka" ? "სხვა" : "more"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Section */}
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <DollarSign className="w-4 h-4 text-[#E07B4F]" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {locale === "ka" ? "ფასები" : "Pricing"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="flex items-center gap-1.5 text-sm text-[#E07B4F] hover:text-[#D26B3F] font-medium transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              {locale === "ka" ? "რედაქტირება" : "Edit"}
            </button>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-[var(--color-text-primary)]">
              {formData.basePrice || "0"}
              {formData.maxPrice && ` - ${formData.maxPrice}`}
            </span>
            <span className="text-[var(--color-text-secondary)]">
              {getPricingSuffix()}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            {getPricingLabel()}
          </p>
        </div>

        {/* Location Section */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <MapPin className="w-4 h-4 text-[#E07B4F]" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {locale === "ka" ? "მომსახურების ზონა" : "Service Area"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="flex items-center gap-1.5 text-sm text-[#E07B4F] hover:text-[#D26B3F] font-medium transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              {locale === "ka" ? "რედაქტირება" : "Edit"}
            </button>
          </div>

          {formData.nationwide ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">🇬🇪</span>
              <span className="font-medium text-[var(--color-text-primary)]">
                {locationData?.nationwide || "Nationwide"}
              </span>
            </div>
          ) : formData.serviceAreas.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.serviceAreas.slice(0, 5).map((area) => (
                <span
                  key={area}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-sm"
                >
                  {area}
                </span>
              ))}
              {formData.serviceAreas.length > 5 && (
                <span className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] text-sm">
                  +{formData.serviceAreas.length - 5}{" "}
                  {locale === "ka" ? "სხვა" : "more"}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[var(--color-text-muted)]">
              {locale === "ka" ? "არ არის არჩეული" : "None selected"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
