"use client";

import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { Banknote, Check, DollarSign, FolderKanban, Globe, Handshake, MapPin } from "lucide-react";

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
      id: "fixed" as const,
      label: locale === "ka" ? "ფიქსირებული" : "Fixed",
      icon: Banknote,
      description: locale === "ka" ? "ერთჯერადი ფასი" : "One-time price",
    },
    {
      id: "project" as const,
      label: locale === "ka" ? "პროექტით" : "Per Project",
      icon: FolderKanban,
      description: locale === "ka" ? "ფასის დიაპაზონი" : "Price range",
    },
    {
      id: "hourly" as const,
      label: locale === "ka" ? "შეთანხმებით" : "By Agreement",
      icon: Handshake,
      description: locale === "ka" ? "მოლაპარაკებით" : "Negotiable",
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
              ${isSelected
                ? "bg-gradient-to-br from-[#C4735B] to-[#A85D48] text-white shadow-lg shadow-[#C4735B]/25"
                : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200 hover:border-[#C4735B]/30"
              }
            `}
          >
            {/* Icon container with animation */}
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
              ${isSelected 
                ? "bg-white/20" 
                : "bg-neutral-100 group-hover:bg-[#C4735B]/10 group-hover:scale-105"
              }
            `}>
              <Icon className={`w-4 h-4 transition-colors duration-300 ${isSelected ? "text-white" : "text-neutral-500 group-hover:text-[#C4735B]"}`} />
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
  const { locale } = useLanguage();

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
      {/* Pricing Section - Modern Design */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <DollarSign className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            {/* Decorative ring */}
            <div className="absolute -inset-1 rounded-xl border-2 border-emerald-500/20 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-sm">
              {locale === "ka" ? "ფასები" : "Pricing"}
            </h3>
            <p className="text-xs text-neutral-500">
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

          {/* Price Inputs - Conditional based on price type */}
          {formData.priceType === "hourly" ? (
            /* By Agreement - Modern styled placeholder */
            <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100/50 border border-neutral-200/50 text-center">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mx-auto mb-2">
                <Handshake className="w-5 h-5 text-[#C4735B]" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-neutral-600 font-medium">
                {locale === "ka"
                  ? "ფასი განისაზღვრება კლიენტთან შეთანხმებით"
                  : "Price will be determined by agreement with client"}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {locale === "ka"
                  ? "მოქნილი ფასწარმოქმნა"
                  : "Flexible pricing"}
              </p>
            </div>
          ) : formData.priceType === "fixed" ? (
            /* Fixed Price - Single input */
            <div className="flex-1">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.priceRange.min > 0 ? formData.priceRange.min.toString() : ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const numValue = parseInt(value) || 0;
                  onFormChange({
                    priceRange: {
                      min: numValue,
                      max: numValue,
                    },
                  });
                }}
                placeholder={locale === "ka" ? "ფასი" : "Price"}
                variant="filled"
                inputSize="default"
                leftIcon={<span className="text-sm">₾</span>}
              />
            </div>
          ) : (
            /* Per Project - Range inputs */
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.priceRange.min > 0 ? formData.priceRange.min.toString() : ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    const numValue = parseInt(value) || 0;
                    onFormChange({
                      priceRange: {
                        ...formData.priceRange,
                        min: numValue,
                      },
                    });
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
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.priceRange.max > 0 ? formData.priceRange.max.toString() : ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    const numValue = parseInt(value) || 0;
                    onFormChange({
                      priceRange: {
                        ...formData.priceRange,
                        max: numValue,
                      },
                    });
                  }}
                  placeholder={locale === "ka" ? "მაქს" : "Max"}
                  variant="filled"
                  inputSize="default"
                  leftIcon={<span className="text-sm">₾</span>}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service Areas Section - Modern Design */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C4735B] to-[#A85D48] flex items-center justify-center shadow-lg shadow-[#C4735B]/20">
              <MapPin className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            {/* Decorative ring */}
            <div className="absolute -inset-1 rounded-xl border-2 border-[#C4735B]/20 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-sm">
              {locale === "ka" ? "მომსახურების ზონები" : "Service Areas"}
            </h3>
            <p className="text-xs text-neutral-500">
              {locale === "ka" ? "სად მუშაობ" : "Where you work"}
            </p>
          </div>
        </div>

        {/* Nationwide Option - Modern Design */}
        {locationData && (
          <button
            type="button"
            onClick={handleNationwideToggle}
            className={`
              relative w-full p-4 rounded-xl border-2 text-left transition-all duration-300 mb-4 group overflow-hidden
              ${formData.nationwide
                ? "border-[#C4735B] bg-gradient-to-r from-[#C4735B]/10 via-[#E8956A]/5 to-[#C4735B]/10 shadow-lg shadow-[#C4735B]/10"
                : "border-neutral-200 hover:border-[#C4735B]/40 bg-gradient-to-br from-neutral-50 to-white hover:shadow-md"
              }
            `}
          >
            {/* Shine effect on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            
            <div className="relative flex items-center gap-3">
              <div className={`
                relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300
                ${formData.nationwide 
                  ? "bg-gradient-to-br from-[#C4735B] to-[#A85D48] shadow-lg shadow-[#C4735B]/25" 
                  : "bg-neutral-100 group-hover:bg-[#C4735B]/10 group-hover:scale-105"
                }
              `}>
                <Globe className={`w-5 h-5 transition-all duration-300 ${formData.nationwide ? "text-white" : "text-neutral-400 group-hover:text-[#C4735B]"}`} strokeWidth={1.5} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold transition-colors duration-300 ${formData.nationwide ? "text-[#C4735B]" : "text-neutral-700 group-hover:text-[#C4735B]"}`}>
                    {locale === "ka" ? "მთელი ქვეყნის მასშტაბით" : "Nationwide"}
                  </span>
                  <span className="text-lg">{locationData.emoji}</span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {locale === "ka" ? "მომსახურება ყველა რეგიონში" : "Service in all regions"}
                </p>
              </div>
              
              {/* Selection indicator */}
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300
                ${formData.nationwide
                  ? "border-[#C4735B] bg-[#C4735B] scale-110"
                  : "border-neutral-300 group-hover:border-[#C4735B]/50"
                }
              `}>
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
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-[10px] text-neutral-400 px-2">
              {locale === "ka" ? "ან აირჩიე ქალაქები" : "Or select cities"}
            </span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>
        )}

        {/* Regions and Cities - Modern Design */}
        {locationData && !formData.nationwide && (
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent">
            {Object.entries(locationData.regions).map(
              ([regionName, cities]) => (
                <div key={regionName} className="group/region">
                  <h4 className="font-semibold text-neutral-800 text-xs mb-2.5 flex items-center gap-2 sticky top-0 bg-white py-1.5 z-10">
                    <div className="w-5 h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-[#C4735B]" strokeWidth={2} />
                    </div>
                    {regionName}
                    <span className="text-[10px] text-neutral-400 font-normal ml-auto">
                      {cities.length} {locale === "ka" ? "ქალაქი" : "cities"}
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
                            ${isSelected
                              ? "bg-gradient-to-r from-[#C4735B] to-[#A85D48] text-white shadow-md shadow-[#C4735B]/25 scale-105"
                              : "bg-neutral-50 text-neutral-600 hover:bg-[#C4735B]/10 hover:text-[#C4735B] border border-neutral-200 hover:border-[#C4735B]/30"
                            }
                          `}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 inline mr-1.5 -mt-0.5" strokeWidth={2.5} />
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
          <div className="mt-5 pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#C4735B]/5 to-[#E8956A]/5 border border-[#C4735B]/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#C4735B]/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#C4735B]" strokeWidth={2} />
                </div>
                <span className="text-xs text-neutral-600 font-medium">
                  {locale === "ka" ? "არჩეული ზონები" : "Selected areas"}
                </span>
              </div>
              <span className="text-sm font-bold text-[#C4735B] px-3 py-1 rounded-full bg-[#C4735B]/10">
                {formData.nationwide
                  ? locale === "ka"
                    ? "🇬🇪 მთელი ქვეყანა"
                    : "🇬🇪 Nationwide"
                  : `${formData.serviceAreas.length} ${locale === "ka" ? "ქალაქი" : "cities"}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
