"use client";

import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check } from "lucide-react";

interface PricingStepProps {
  formData: {
    basePrice: string;
    maxPrice: string;
    pricingModel: "hourly" | "daily" | "sqm" | "project_based" | "";
  };
  onFormChange: (updates: Partial<PricingStepProps["formData"]>) => void;
  validation: {
    pricing: boolean;
  };
}

// Custom SVG icons for pricing options - refined and professional
const PricingIcons = {
  hourly: ({ className, isActive }: { className?: string; isActive?: boolean }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Clock face with gradient */}
      <defs>
        <linearGradient id="hourlyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isActive ? "#E07B4F" : "#9CA3AF"} />
          <stop offset="100%" stopColor={isActive ? "#C4735B" : "#6B7280"} />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="13" stroke="url(#hourlyGrad)" strokeWidth="2" fill="none" />
      <circle cx="16" cy="16" r="10" stroke="url(#hourlyGrad)" strokeWidth="1" strokeOpacity="0.3" fill="none" />
      {/* Hour hand */}
      <path d="M16 16L16 9" stroke="url(#hourlyGrad)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Minute hand */}
      <path d="M16 16L22 16" stroke="url(#hourlyGrad)" strokeWidth="2" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="16" cy="16" r="2" fill="url(#hourlyGrad)" />
      {/* Hour markers */}
      <circle cx="16" cy="5" r="1" fill={isActive ? "#E07B4F" : "#9CA3AF"} fillOpacity="0.6" />
      <circle cx="27" cy="16" r="1" fill={isActive ? "#E07B4F" : "#9CA3AF"} fillOpacity="0.6" />
      <circle cx="16" cy="27" r="1" fill={isActive ? "#E07B4F" : "#9CA3AF"} fillOpacity="0.6" />
      <circle cx="5" cy="16" r="1" fill={isActive ? "#E07B4F" : "#9CA3AF"} fillOpacity="0.6" />
    </svg>
  ),
  daily: ({ className, isActive }: { className?: string; isActive?: boolean }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dailyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isActive ? "#E07B4F" : "#9CA3AF"} />
          <stop offset="100%" stopColor={isActive ? "#C4735B" : "#6B7280"} />
        </linearGradient>
      </defs>
      {/* Calendar body */}
      <rect x="4" y="6" width="24" height="22" rx="3" stroke="url(#dailyGrad)" strokeWidth="2" fill="none" />
      {/* Calendar header */}
      <path d="M4 12H28" stroke="url(#dailyGrad)" strokeWidth="2" />
      {/* Calendar hooks */}
      <path d="M10 4V8" stroke="url(#dailyGrad)" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 4V8" stroke="url(#dailyGrad)" strokeWidth="2" strokeLinecap="round" />
      {/* Date highlight - today */}
      <rect x="18" y="16" width="6" height="6" rx="1.5" fill="url(#dailyGrad)" fillOpacity={isActive ? "1" : "0.4"} />
      {/* Date dots */}
      <circle cx="10" cy="17" r="1.5" fill={isActive ? "#E07B4F" : "#9CA3AF"} fillOpacity="0.4" />
      <circle cx="10" cy="23" r="1.5" fill={isActive ? "#E07B4F" : "#9CA3AF"} fillOpacity="0.4" />
      <circle cx="16" cy="17" r="1.5" fill={isActive ? "#E07B4F" : "#9CA3AF"} fillOpacity="0.4" />
    </svg>
  ),
  sqm: ({ className, isActive }: { className?: string; isActive?: boolean }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sqmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isActive ? "#E07B4F" : "#9CA3AF"} />
          <stop offset="100%" stopColor={isActive ? "#C4735B" : "#6B7280"} />
        </linearGradient>
      </defs>
      {/* Floor plan / grid */}
      <rect x="4" y="4" width="24" height="24" rx="2" stroke="url(#sqmGrad)" strokeWidth="2" fill="none" />
      {/* Grid lines */}
      <path d="M4 16H28" stroke="url(#sqmGrad)" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M16 4V28" stroke="url(#sqmGrad)" strokeWidth="1.5" strokeOpacity="0.5" />
      {/* Measurement arrows - horizontal */}
      <path d="M6 10L12 10" stroke="url(#sqmGrad)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 10L8 8M6 10L8 12" stroke="url(#sqmGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10L10 8M12 10L10 12" stroke="url(#sqmGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Measurement arrows - vertical */}
      <path d="M22 20L22 26" stroke="url(#sqmGrad)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 20L20 22M22 20L24 22" stroke="url(#sqmGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 26L20 24M22 26L24 24" stroke="url(#sqmGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* m² text indicator */}
      <text x="20" y="12" fontSize="6" fontWeight="bold" fill={isActive ? "#E07B4F" : "#9CA3AF"}>m²</text>
    </svg>
  ),
  project_based: ({ className, isActive }: { className?: string; isActive?: boolean }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="projectGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isActive ? "#E07B4F" : "#9CA3AF"} />
          <stop offset="100%" stopColor={isActive ? "#C4735B" : "#6B7280"} />
        </linearGradient>
      </defs>
      {/* Clipboard/document base */}
      <rect x="6" y="4" width="20" height="24" rx="2" stroke="url(#projectGrad)" strokeWidth="2" fill="none" />
      {/* Clipboard clip */}
      <path d="M12 4V2C12 1.44772 12.4477 1 13 1H19C19.5523 1 20 1.44772 20 2V4" stroke="url(#projectGrad)" strokeWidth="2" />
      <rect x="11" y="2" width="10" height="4" rx="1" fill={isActive ? "#E07B4F" : "#9CA3AF"} fillOpacity="0.2" stroke="url(#projectGrad)" strokeWidth="1" />
      {/* Task lines with checkmarks */}
      <path d="M10 12H22" stroke="url(#projectGrad)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
      <path d="M10 17H22" stroke="url(#projectGrad)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
      <path d="M10 22H18" stroke="url(#projectGrad)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
      {/* Completion badge */}
      <circle cx="22" cy="22" r="4" fill="url(#projectGrad)" fillOpacity={isActive ? "1" : "0.4"} />
      <path d="M20 22L21.5 23.5L24 20.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const pricingOptions = [
  {
    key: "hourly",
    label: "Hourly",
    labelKa: "საათობრივი",
    suffix: "₾/სთ",
    Icon: PricingIcons.hourly,
  },
  {
    key: "daily",
    label: "Daily",
    labelKa: "დღიური",
    suffix: "₾/დღე",
    Icon: PricingIcons.daily,
  },
  {
    key: "sqm",
    label: "Per m²",
    labelKa: "კვ.მ",
    suffix: "₾/m²",
    Icon: PricingIcons.sqm,
  },
  {
    key: "project_based",
    label: "Per Project",
    labelKa: "პროექტზე",
    suffix: "₾",
    Icon: PricingIcons.project_based,
  },
];

export default function PricingStep({
  formData,
  onFormChange,
  validation,
}: PricingStepProps) {
  const { locale } = useLanguage();

  const selectedOption = pricingOptions.find(
    (o) => o.key === formData.pricingModel
  );
  const suffix = selectedOption?.suffix || "₾";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Pricing Type Selection */}
      <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">
          {locale === "ka" ? "ფასის ტიპი" : "Pricing Type"}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {pricingOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onFormChange({ pricingModel: option.key as typeof formData.pricingModel })}
              className={`
                group relative p-4 rounded-xl border-2 text-left transition-all duration-200
                ${
                  formData.pricingModel === option.key
                    ? "border-[#E07B4F] bg-[#E07B4F]/5"
                    : "border-[var(--color-border-subtle)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]"
                }
              `}
            >
              {formData.pricingModel === option.key && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#E07B4F] flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
              <div className="mb-2">
                <option.Icon
                  className="w-10 h-10 transition-transform duration-200 group-hover:scale-110"
                  isActive={formData.pricingModel === option.key}
                />
              </div>
              <span
                className={`font-medium block ${formData.pricingModel === option.key ? "text-[#E07B4F]" : "text-[var(--color-text-primary)]"}`}
              >
                {locale === "ka" ? option.labelKa : option.label}
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {option.suffix}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--color-text-primary)]">
            {locale === "ka" ? "ფასის დიაპაზონი" : "Price Range"}
          </h3>
          {validation.pricing && (
            <Badge variant="success" size="xs" icon={<Check className="w-3 h-3" />}>
              {locale === "ka" ? "შევსებულია" : "Completed"}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Min Price */}
          <div className="flex-1">
            <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 block">
              {locale === "ka" ? "მინიმალური" : "Starting Price"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E07B4F] font-semibold">
                ₾
              </span>
              <input
                type="number"
                min="1"
                value={formData.basePrice}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || parseFloat(value) >= 0) {
                    onFormChange({ basePrice: value });
                  }
                }}
                className={`
                  w-full pl-10 pr-4 py-3.5 rounded-xl text-lg font-semibold
                  bg-[var(--color-bg-tertiary)] border-2
                  text-[var(--color-text-primary)]
                  placeholder-[var(--color-text-muted)]
                  focus:outline-none transition-all duration-200
                  ${
                    validation.pricing
                      ? "border-emerald-500/30 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
                      : "border-transparent focus:border-[#E07B4F]/50 focus:ring-4 focus:ring-[#E07B4F]/10"
                  }
                `}
                placeholder="50"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="pt-6">
            <span className="text-[var(--color-text-muted)] text-xl">—</span>
          </div>

          {/* Max Price */}
          <div className="flex-1">
            <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 block">
              {locale === "ka" ? "მაქსიმალური" : "Maximum Price"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] font-semibold">
                ₾
              </span>
              <input
                type="number"
                min="1"
                value={formData.maxPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || parseFloat(value) >= 0) {
                    onFormChange({ maxPrice: value });
                  }
                }}
                className="
                  w-full pl-10 pr-4 py-3.5 rounded-xl text-lg font-semibold
                  bg-[var(--color-bg-tertiary)] border-2 border-transparent
                  text-[var(--color-text-primary)]
                  placeholder-[var(--color-text-muted)]
                  focus:outline-none focus:border-[var(--color-border)] focus:ring-4 focus:ring-[var(--color-bg-muted)]
                  transition-all duration-200
                "
                placeholder="200"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {formData.basePrice && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#E07B4F]/5 to-[#E8956A]/5 border border-[#E07B4F]/10">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {locale === "ka" ? "კლიენტები დაინახავენ:" : "Clients will see:"}
            </p>
            <p className="text-xl font-bold text-[#E07B4F] mt-1">
              {formData.basePrice}
              {formData.maxPrice && ` - ${formData.maxPrice}`} {suffix}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
