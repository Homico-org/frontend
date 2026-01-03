"use client";

import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, DollarSign, Globe, MapPin } from "lucide-react";

interface PricingAreasStepProps {
  formData: {
    priceRange: { min: number; max: number };
    priceType: "hourly" | "fixed" | "project";
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
  value: "hourly" | "fixed" | "project";
  onChange: (type: "hourly" | "fixed" | "project") => void;
  locale: string;
}) {
  const types = [
    {
      id: "hourly" as const,
      label: locale === "ka" ? "საათობრივი" : "Hourly",
      icon: "⏱",
    },
    {
      id: "fixed" as const,
      label: locale === "ka" ? "ფიქსირებული" : "Fixed",
      icon: "📋",
    },
    {
      id: "project" as const,
      label: locale === "ka" ? "პროექტით" : "Per Project",
      icon: "📦",
    },
  ];

  return (
    <div className="flex gap-2">
      {types.map((type) => (
        <button
          key={type.id}
          type="button"
          onClick={() => onChange(type.id)}
          className={`
            flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200
            ${
              value === type.id
                ? "bg-[#C4735B] text-white shadow-md shadow-[#C4735B]/20"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }
          `}
        >
          <span className="mr-1">{type.icon}</span>
          {type.label}
        </button>
      ))}
    </div>
  );
}

export default function PricingAreasStep({
  formData,
  locationData,
  onFormChange,
}: PricingAreasStepProps) {
  const { locale } = useLanguage();

  const handlePriceChange = (field: "min" | "max", value: string) => {
    const numValue = parseInt(value) || 0;
    onFormChange({
      priceRange: {
        ...formData.priceRange,
        [field]: numValue,
      },
    });
  };

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
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Pricing Section - Compact */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 text-sm">
              {locale === "ka" ? "ფასები" : "Pricing"}
            </h3>
            <p className="text-[10px] text-neutral-500">
              {locale === "ka"
                ? "მომსახურების ღირებულება"
                : "Service cost range"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Price Type - Compact */}
          <PriceTypeSelector
            value={formData.priceType}
            onChange={(type) => onFormChange({ priceType: type })}
            locale={locale}
          />

          {/* Price Range Inputs - Horizontal */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                type="number"
                min={0}
                value={formData.priceRange.min || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || parseFloat(value) >= 0) {
                    handlePriceChange("min", value);
                  }
                }}
                placeholder={locale === "ka" ? "მინ" : "Min"}
                variant="filled"
                inputSize="default"
                leftIcon={<span className="text-sm">₾</span>}
              />
            </div>
            <span className="text-neutral-400 text-sm font-medium">—</span>
            <div className="flex-1">
              <Input
                type="number"
                min={0}
                value={formData.priceRange.max || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || parseFloat(value) >= 0) {
                    handlePriceChange("max", value);
                  }
                }}
                placeholder={locale === "ka" ? "მაქს" : "Max"}
                variant="filled"
                inputSize="default"
                leftIcon={<span className="text-sm">₾</span>}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Service Areas Section */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C4735B]/20 to-[#D4896B]/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-[#C4735B]" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 text-sm">
              {locale === "ka" ? "მომსახურების ზონები" : "Service Areas"}
            </h3>
            <p className="text-[10px] text-neutral-500">
              {locale === "ka" ? "სად მუშაობ" : "Where you work"}
            </p>
          </div>
        </div>

        {/* Nationwide Option */}
        {locationData && (
          <button
            type="button"
            onClick={handleNationwideToggle}
            className={`
              w-full p-3 rounded-xl border-2 text-left transition-all duration-200 mb-4
              ${
                formData.nationwide
                  ? "border-[#C4735B] bg-gradient-to-r from-[#C4735B]/5 to-[#E8956A]/5"
                  : "border-neutral-200 hover:border-neutral-300 bg-neutral-50"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                ${formData.nationwide ? "bg-[#C4735B]/10" : "bg-neutral-200"}
              `}
              >
                <Globe
                  className={`w-4 h-4 ${formData.nationwide ? "text-[#C4735B]" : "text-neutral-400"}`}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${formData.nationwide ? "text-[#C4735B]" : "text-neutral-700"}`}
                  >
                    {locale === "ka" ? "მთელი ქვეყნის მასშტაბით" : "Nationwide"}
                  </span>
                  <span className="text-base">{locationData.emoji}</span>
                </div>
              </div>
              <div
                className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${
                  formData.nationwide
                    ? "border-[#C4735B] bg-[#C4735B]"
                    : "border-neutral-300"
                }
              `}
              >
                {formData.nationwide && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
          </button>
        )}

        {/* Divider */}
        {locationData && !formData.nationwide && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-[10px] text-neutral-400 px-2">
              {locale === "ka" ? "ან აირჩიე ქალაქები" : "Or select cities"}
            </span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>
        )}

        {/* Regions and Cities */}
        {locationData && !formData.nationwide && (
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
            {Object.entries(locationData.regions).map(
              ([regionName, cities]) => (
                <div key={regionName}>
                  <h4 className="font-medium text-neutral-700 text-xs mb-2 flex items-center gap-1.5 sticky top-0 bg-white py-1">
                    <MapPin className="w-3 h-3 text-[#C4735B]" />
                    {regionName}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {cities.map((city) => {
                      const isSelected = formData.serviceAreas.includes(city);
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => toggleServiceArea(city)}
                          className={`
                          px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                          ${
                            isSelected
                              ? "bg-[#C4735B] text-white shadow-sm shadow-[#C4735B]/20"
                              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                          }
                        `}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 inline mr-1 -mt-0.5" />
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

        {/* Selection summary */}
        {(formData.nationwide || formData.serviceAreas.length > 0) && (
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                {locale === "ka" ? "არჩეული:" : "Selected:"}
              </span>
              <span className="text-xs font-semibold text-[#C4735B]">
                {formData.nationwide
                  ? locale === "ka"
                    ? "მთელი ქვეყანა"
                    : "Nationwide"
                  : `${formData.serviceAreas.length} ${locale === "ka" ? "ქალაქი" : "cities"}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
