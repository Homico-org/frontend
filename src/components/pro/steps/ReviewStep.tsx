"use client";

import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Briefcase,
  DollarSign,
  Facebook,
  Globe,
  Images,
  Instagram,
  Linkedin,
  Link2,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  User
} from "lucide-react";
import { PortfolioProject } from "./ProjectsStep";

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
    // Social links
    whatsapp?: string;
    telegram?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    website?: string;
  };
  selectedCategories: string[];
  selectedSubcategories: string[];
  avatarPreview: string | null;
  locationData: {
    nationwide: string;
  } | null;
  onEditStep: (step: number) => void;
  isEditMode?: boolean;
  portfolioProjects?: PortfolioProject[];
}

export default function ReviewStep({
  formData,
  selectedCategories,
  selectedSubcategories,
  avatarPreview,
  locationData,
  onEditStep,
  isEditMode = false,
  portfolioProjects = [],
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
      case "from":
        return "₾";
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
      case "from":
        return locale === "ka" ? "ფიქსირებული" : "Fixed price";
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

          {/* Social Links (if any) */}
          {(formData.whatsapp || formData.telegram || formData.instagram || formData.facebook || formData.linkedin || formData.website) && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
              <p className="text-xs text-[var(--color-text-tertiary)] mb-2">
                {locale === "ka" ? "სოციალური ბმულები" : "Social Links"}
              </p>
              <div className="flex flex-wrap gap-2">
                {formData.whatsapp && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-600 text-xs">
                    <Phone className="w-3 h-3" />
                    WhatsApp
                  </span>
                )}
                {formData.telegram && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-500 text-xs">
                    <MessageCircle className="w-3 h-3" />
                    Telegram
                  </span>
                )}
                {formData.instagram && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-50 text-pink-500 text-xs">
                    <Instagram className="w-3 h-3" />
                    Instagram
                  </span>
                )}
                {formData.facebook && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs">
                    <Facebook className="w-3 h-3" />
                    Facebook
                  </span>
                )}
                {formData.linkedin && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs">
                    <Linkedin className="w-3 h-3" />
                    LinkedIn
                  </span>
                )}
                {formData.website && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-600 text-xs">
                    <Globe className="w-3 h-3" />
                    {locale === "ka" ? "ვებსაიტი" : "Website"}
                  </span>
                )}
              </div>
            </div>
          )}
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

        {/* Portfolio Section */}
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <Images className="w-4 h-4 text-[#E07B4F]" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {locale === "ka" ? "პორტფოლიო" : "Portfolio"}
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

          {portfolioProjects.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {portfolioProjects.slice(0, 6).map((project, idx) => {
                const hasImages = project.images && project.images.length > 0;
                const hasVideos = project.videos && project.videos.length > 0;
                const hasBeforeAfter = project.beforeAfterPairs && project.beforeAfterPairs.length > 0;
                const totalMedia = (project.images?.length || 0) + (project.videos?.length || 0) + (project.beforeAfterPairs?.length || 0);

                return (
                  <div key={project.id || idx} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)]">
                    {hasImages ? (
                      <img
                        src={project.images[0]}
                        alt={project.title || `Project ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : hasVideos ? (
                      <>
                        <video
                          src={project.videos![0]}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        {/* Play icon overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/80 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : hasBeforeAfter ? (
                      <div className="w-full h-full flex">
                        <div className="w-1/2 h-full relative">
                          <img
                            src={project.beforeAfterPairs![0].beforeImage}
                            alt="Before"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] font-medium bg-black/60 text-white rounded">
                            {locale === "ka" ? "მანამდე" : "Before"}
                          </span>
                        </div>
                        <div className="w-1/2 h-full relative">
                          <img
                            src={project.beforeAfterPairs![0].afterImage}
                            alt="After"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/80 text-white rounded">
                            {locale === "ka" ? "შემდეგ" : "After"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Images className="w-8 h-8 text-[var(--color-text-muted)]" />
                      </div>
                    )}
                    {/* Media count badge */}
                    {totalMedia > 1 && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                        {totalMedia}
                      </div>
                    )}
                    {project.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-xs text-white font-medium truncate">{project.title}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <span className="text-[var(--color-text-muted)]">
              {locale === "ka" ? "პროექტები არ არის დამატებული" : "No projects added"}
            </span>
          )}
          {portfolioProjects.length > 6 && (
            <p className="text-sm text-[var(--color-text-tertiary)] mt-3">
              +{portfolioProjects.length - 6} {locale === "ka" ? "სხვა პროექტი" : "more projects"}
            </p>
          )}
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
              onClick={() => onEditStep(2)}
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
