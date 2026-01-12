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

// Modern outlined icons for pricing options
const PricingIcons = {
  hourly: ({ className, isActive }: { className?: string; isActive?: boolean }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={isActive ? "#C4735B" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  daily: ({ className, isActive }: { className?: string; isActive?: boolean }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={isActive ? "#C4735B" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <rect x="14" y="14" width="4" height="4" rx="0.5" fill={isActive ? "#C4735B" : "currentColor"} fillOpacity="0.2" />
    </svg>
  ),
  sqm: ({ className, isActive }: { className?: string; isActive?: boolean }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={isActive ? "#C4735B" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 12h18" strokeOpacity="0.4" />
      <path d="M12 3v18" strokeOpacity="0.4" />
      <path d="M7 8h4M7 8l1.5-1.5M7 8l1.5 1.5M11 8l-1.5-1.5M11 8l-1.5 1.5" strokeWidth="1.25" />
      <text x="13" y="18" fontSize="6" fontWeight="600" fill={isActive ? "#C4735B" : "currentColor"} stroke="none">m²</text>
    </svg>
  ),
  project_based: ({ className, isActive }: { className?: string; isActive?: boolean }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={isActive ? "#C4735B" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12l2 2 4-4" />
      <line x1="9" y1="17" x2="15" y2="17" strokeOpacity="0.5" />
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
  const { t, locale } = useLanguage();

  const selectedOption = pricingOptions.find(
    (o) => o.key === formData.pricingModel
  );
  const suffix = selectedOption?.suffix || "₾";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Pricing Type Selection */}
      <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">
          {t('common.pricingType')}
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
            {t('common.priceRange')}
          </h3>
          {validation.pricing && (
            <Badge variant="success" size="xs" icon={<Check className="w-3 h-3" />}>
              {t('common.completed')}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Min Price */}
          <div className="flex-1">
            <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 block">
              {t('common.startingPrice')}
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
              {t('common.maximumPrice')}
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
              {t('common.clientsWillSee')}
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
