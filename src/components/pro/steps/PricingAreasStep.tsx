"use client";

import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertCircle,
  Banknote,
  Check,
  DollarSign,
  FolderKanban,
  Globe,
  Handshake,
  MapPin,
} from "lucide-react";

interface PricingAreasStepProps {
  formData: {
    priceRange: { min: number; max: number };
    priceType: "byAgreement" | "fixed" | "range";
    serviceAreas: string[];
    nationwide: boolean;
  };
  locationData: {
    country: string;
    nationwide: string;
    nationwideKa?: string;
    nationwideEn?: string;
    regions: Record<string, string[]>;
    cityMapping?: Record<string, string>;
    emoji: string;
  } | null;
  onFormChange: (updates: Partial<PricingAreasStepProps["formData"]>) => void;
}

// Price Type Selector
function PriceTypeSelector({
  value,
  onChange,
  locale,
}: {
  value: "byAgreement" | "fixed" | "range";
  onChange: (type: "byAgreement" | "fixed" | "range") => void;
  locale: string;
}) {
  const { t } = useLanguage();
  const types = [
    {
      id: "fixed" as const,
      label: t("common.fixed"),
      icon: Banknote,
      description: t("common.onetimePrice"),
    },
    {
      id: "range" as const,
      label: t("common.perProject"),
      icon: FolderKanban,
      description: t("common.priceRange"),
    },
    {
      id: "byAgreement" as const,
      label: t("common.negotiable"),
      icon: Handshake,
      description: t("common.negotiable"),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {types.map((type) => {
        const Icon = type.icon;
        const isSelected = value === type.id;
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={`
              relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all duration-300 group
              ${
                isSelected
                  ? "bg-gradient-to-br from-[#C4735B] to-[#A85D48] text-white shadow-lg shadow-[#C4735B]/25"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] border border-[var(--color-border-subtle)] hover:border-[#C4735B]/30"
              }
            `}
          >
            {/* Icon container with animation */}
            <div
              className={`
              w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
              ${
                isSelected
                  ? "bg-white/20"
                  : "bg-[var(--color-bg-muted)] group-hover:bg-[#C4735B]/10 group-hover:scale-105"
              }
            `}
            >
              <Icon
                className={`w-4 h-4 transition-colors duration-300 ${isSelected ? "text-white" : "text-[var(--color-text-muted)] group-hover:text-[#C4735B]"}`}
              />
            </div>

            {/* Label */}
            <span className="text-xs font-semibold leading-tight">
              {type.label}
            </span>

            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center">
                <Check className="w-3 h-3 text-[#C4735B]" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function PricingAreasStep({
  formData,
  locationData,
  onFormChange,
}: PricingAreasStepProps) {
  const { t, locale } = useLanguage();

  const toggleServiceArea = (area: string) => {
    const newAreas = formData.serviceAreas.includes(area)
      ? formData.serviceAreas.filter((a) => a !== area)
      : [...formData.serviceAreas, area];
    onFormChange({ serviceAreas: newAreas });
  };

  const handleNationwideToggle = () => {
    onFormChange({
      nationwide: !formData.nationwide,
      serviceAreas: !formData.nationwide ? [] : formData.serviceAreas,
    });
  };

  return (
    <div className="space-y-6">
      {/* Pricing Section */}
      <div className="bg-[var(--color-bg-elevated)] rounded-2xl border-2 border-[var(--color-border-subtle)] p-4 sm:p-6 shadow-sm transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#C4735B]" />
            <span className="font-semibold text-[var(--color-text-primary)]">
              {t("common.pricing")}
            </span>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">
            {t("common.serviceCostRange")}
          </span>
        </div>

        <div className="space-y-4">
          {/* Price Type - Compact */}
          <PriceTypeSelector
            value={formData.priceType}
            onChange={(type) => onFormChange({ priceType: type })}
            locale={locale}
          />

          {/* Price Inputs - Conditional based on price type */}
          {formData.priceType === "byAgreement" ? (
            /* By Agreement - Modern styled placeholder */
            <div className="p-4 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-elevated)] shadow-sm flex items-center justify-center mx-auto mb-2">
                <Handshake
                  className="w-5 h-5 text-[#C4735B]"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] font-medium">
                {t("common.priceWillBeDeterminedBy")}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {t("common.flexiblePricing")}
              </p>
            </div>
          ) : formData.priceType === "fixed" ? (
            /* Fixed Price - Single input */
            <div className="flex-1">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={
                  formData.priceRange.min > 0
                    ? formData.priceRange.min.toString()
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  const numValue = parseInt(value) || 0;
                  onFormChange({
                    priceRange: {
                      min: numValue,
                      max: numValue,
                    },
                  });
                }}
                placeholder={t("common.price")}
                inputSize="default"
                leftIcon={<span className="text-sm">₾</span>}
                className="bg-white dark:bg-neutral-900"
              />
            </div>
          ) : (
            /* Range inputs */
            <div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={
                      formData.priceRange.min > 0
                        ? formData.priceRange.min.toString()
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      const numValue = parseInt(value) || 0;
                      onFormChange({
                        priceRange: {
                          ...formData.priceRange,
                          min: numValue,
                        },
                      });
                    }}
                    placeholder={t("common.min")}
                    inputSize="default"
                    leftIcon={<span className="text-sm">₾</span>}
                    className="bg-white dark:bg-neutral-900"
                  />
                </div>
                <span className="text-neutral-400 text-sm font-medium">—</span>
                <div className="flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={
                      formData.priceRange.max > 0
                        ? formData.priceRange.max.toString()
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      const numValue = parseInt(value) || 0;
                      onFormChange({
                        priceRange: {
                          ...formData.priceRange,
                          max: numValue,
                        },
                      });
                    }}
                    placeholder={t("common.max")}
                    inputSize="default"
                    leftIcon={<span className="text-sm">₾</span>}
                    className="bg-white dark:bg-neutral-900"
                  />
                </div>
              </div>
              {formData.priceRange.min > 0 && formData.priceRange.max > 0 && formData.priceRange.max < formData.priceRange.min && (
                <div className="flex items-center gap-1.5 mt-2 text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-medium">
                    {locale === "ka"
                      ? "მაქსიმალური ფასი მინიმალურზე ნაკლებია"
                      : "Maximum price must be greater than minimum"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Service Areas Section */}
      <div className="bg-[var(--color-bg-elevated)] rounded-2xl border-2 border-[var(--color-border-subtle)] p-4 sm:p-6 shadow-sm transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#C4735B]" />
            <span className="font-semibold text-[var(--color-text-primary)]">
              {t("common.serviceAreas")}
            </span>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">
            {t("common.whereYouWork")}
          </span>
        </div>

        {/* Nationwide Option - Modern Design */}
        {locationData && (
          <button
            type="button"
            onClick={handleNationwideToggle}
            className={`
              relative w-full p-4 rounded-xl border-2 text-left transition-all duration-300 mb-4 group overflow-hidden
              ${
                formData.nationwide
                  ? "border-[#C4735B] bg-gradient-to-r from-[#C4735B]/10 via-[#E8956A]/5 to-[#C4735B]/10 shadow-lg shadow-[#C4735B]/10"
                  : "border-[var(--color-border-subtle)] hover:border-[#C4735B]/40 bg-[var(--color-bg-tertiary)] hover:shadow-md"
              }
            `}
          >
            {/* Shine effect on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="relative flex items-center gap-3">
              <div
                className={`
                relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300
                ${
                  formData.nationwide
                    ? "bg-gradient-to-br from-[#C4735B] to-[#A85D48] shadow-lg shadow-[#C4735B]/25"
                    : "bg-[var(--color-bg-tertiary)] group-hover:bg-[#C4735B]/10 group-hover:scale-105"
                }
              `}
              >
                <Globe
                  className={`w-5 h-5 transition-all duration-300 ${formData.nationwide ? "text-white" : "text-[var(--color-text-muted)] group-hover:text-[#C4735B]"}`}
                  strokeWidth={1.5}
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold transition-colors duration-300 ${formData.nationwide ? "text-[#C4735B]" : "text-[var(--color-text-primary)] group-hover:text-[#C4735B]"}`}
                  >
                    {t("common.nationwide")}
                  </span>
                  <span className="text-lg">{locationData.emoji}</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {t("common.serviceInAllRegions")}
                </p>
              </div>

              {/* Selection indicator */}
              <div
                className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300
                ${
                  formData.nationwide
                    ? "border-[#C4735B] bg-[#C4735B] scale-110"
                    : "border-[var(--color-border-subtle)] group-hover:border-[#C4735B]/50"
                }
              `}
              >
                {formData.nationwide && (
                  <Check className="w-3.5 h-3.5 text-white" />
                )}
              </div>
            </div>
          </button>
        )}

        {/* Divider */}
        {locationData && !formData.nationwide && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
            <span className="text-[10px] text-[var(--color-text-muted)] px-2">
              {t("common.orSelectCities")}
            </span>
            <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
          </div>
        )}

        {/* Regions and Cities - Modern Design */}
        {locationData && !formData.nationwide && (
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent">
            {Object.entries(locationData.regions).map(
              ([regionName, cities]) => (
                <div key={regionName} className="group/region">
                  <h4 className="font-semibold text-[var(--color-text-primary)] text-xs mb-2.5 flex items-center gap-2 sticky top-0 bg-[var(--color-bg-elevated)] py-1.5 z-10">
                    <div className="w-5 h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center">
                      <MapPin
                        className="w-3 h-3 text-[#C4735B]"
                        strokeWidth={2}
                      />
                    </div>
                    {regionName}
                    <span className="text-[10px] text-[var(--color-text-muted)] font-normal ml-auto">
                      {cities.length} {t("common.cities")}
                    </span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((city) => {
                      const isSelected = formData.serviceAreas.includes(city);
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => toggleServiceArea(city)}
                          className={`
                            relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 group/city
                            ${
                              isSelected
                                ? "bg-gradient-to-r from-[#C4735B] to-[#A85D48] text-white shadow-md shadow-[#C4735B]/25 scale-105"
                                : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[#C4735B]/10 hover:text-[#C4735B] border border-[var(--color-border-subtle)] hover:border-[#C4735B]/30"
                            }
                          `}
                        >
                          {isSelected && (
                            <Check
                              className="w-3 h-3 inline mr-1.5 -mt-0.5"
                              strokeWidth={2.5}
                            />
                          )}
                          {city}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Selection summary - Modern Design */}
        {(formData.nationwide || formData.serviceAreas.length > 0) && (
          <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#C4735B]/5 to-[#E8956A]/5 border border-[#C4735B]/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#C4735B]/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#C4735B]" strokeWidth={2} />
                </div>
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                  {t("common.selectedAreas")}
                </span>
              </div>
              <span className="text-sm font-bold text-[#C4735B] px-3 py-1 rounded-full bg-[#C4735B]/10">
                {formData.nationwide
                  ? t("common.nationwide")
                  : `${formData.serviceAreas.length} ${locale === "ka" ? "ქალაქი" : "cities"}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
