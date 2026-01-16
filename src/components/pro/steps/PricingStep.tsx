"use client";

import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check } from "lucide-react";

interface PricingStepProps {
  formData: {
    basePrice: string;
    maxPrice: string;
    pricingModel: "fixed" | "range" | "byAgreement" | "";
  };
  onFormChange: (updates: Partial<PricingStepProps["formData"]>) => void;
  validation: {
    pricing: boolean;
  };
}

// Modern outlined icons for pricing options
const PricingIcons = {
  fixed: ({
    className,
    isActive,
  }: {
    className?: string;
    isActive?: boolean;
  }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={isActive ? "#C4735B" : "currentColor"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v20" strokeOpacity="0.25" />
      <path d="M7 7h7a3 3 0 010 6H10a3 3 0 000 6h7" />
    </svg>
  ),
  range: ({
    className,
    isActive,
  }: {
    className?: string;
    isActive?: boolean;
  }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={isActive ? "#C4735B" : "currentColor"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h16" />
      <path d="M7 9l-3 3 3 3" />
      <path d="M17 9l3 3-3 3" />
    </svg>
  ),
  byAgreement: ({
    className,
    isActive,
  }: {
    className?: string;
    isActive?: boolean;
  }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={isActive ? "#C4735B" : "currentColor"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 12l2 2 4-4" />
      <path d="M14 12l2 2 4-4" />
      <path d="M2 7h8M2 17h8" strokeOpacity="0.4" />
    </svg>
  ),
};

const pricingOptions = [
  {
    key: "fixed",
    label: "Fixed",
    labelKa: "ფიქსირებული",
    suffix: "₾",
    Icon: PricingIcons.fixed,
  },
  {
    key: "range",
    label: "Range",
    labelKa: "დიაპაზონი",
    suffix: "₾",
    Icon: PricingIcons.range,
  },
  {
    key: "byAgreement",
    label: "By Agreement",
    labelKa: "შეთანხმებით",
    suffix: "",
    Icon: PricingIcons.byAgreement,
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
          {t("common.pricingType")}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {pricingOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() =>
                onFormChange({
                  pricingModel: option.key as typeof formData.pricingModel,
                })
              }
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

      {/* Price */}
      <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--color-text-primary)]">
            {t("common.priceRange")}
          </h3>
          {validation.pricing && (
            <Badge
              variant="success"
              size="xs"
              icon={<Check className="w-3 h-3" />}
            >
              {t("common.completed")}
            </Badge>
          )}
        </div>

        {formData.pricingModel === "byAgreement" ? (
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)] p-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t("common.negotiable")}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              {t("common.negotiable")}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {/* Min Price */}
            <div className="flex-1">
              <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 block">
                {formData.pricingModel === "range"
                  ? t("common.startingPrice")
                  : t("common.price")}
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
                    if (value === "" || parseFloat(value) >= 0) {
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
                  placeholder="100"
                />
              </div>
            </div>

            {/* Divider */}
            {formData.pricingModel === "range" && (
              <div className="pt-6">
                <span className="text-[var(--color-text-muted)] text-xl">
                  —
                </span>
              </div>
            )}

            {/* Max Price */}
            {formData.pricingModel === "range" && (
              <div className="flex-1">
                <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 block">
                  {t("common.maximumPrice")}
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
                      if (value === "" || parseFloat(value) >= 0) {
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
                    placeholder="300"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {(formData.basePrice || formData.pricingModel === "byAgreement") && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#E07B4F]/5 to-[#E8956A]/5 border border-[#E07B4F]/10">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t("common.clientsWillSee")}
            </p>
            <p className="text-xl font-bold text-[#E07B4F] mt-1">
              {formData.pricingModel === "byAgreement"
                ? t("common.negotiable")
                : `${formData.basePrice}${formData.pricingModel === "range" && formData.maxPrice ? ` - ${formData.maxPrice}` : ""} ${suffix}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
