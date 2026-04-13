"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Check, Globe, MapPin } from "lucide-react";

export interface ServicePriceEntry {
  serviceKey: string;
  subcategoryKey: string;
  categoryKey: string;
  label: string;
  unit: string;
  unitLabel: string;
  basePrice: number;
  price: number;
  isActive: boolean;
}

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
  subcategoryKey?: string;
  servicePricing: ServicePriceEntry[];
  onServicePricingChange: (pricing: ServicePriceEntry[]) => void;
}

export default function PricingAreasStep({
  formData,
  locationData,
  onFormChange,
}: PricingAreasStepProps) {
  const { t } = useLanguage();

  const toggleCity = (city: string) => {
    const newAreas = formData.serviceAreas.includes(city)
      ? formData.serviceAreas.filter((a) => a !== city)
      : [...formData.serviceAreas, city];
    onFormChange({ serviceAreas: newAreas, nationwide: false });
  };

  const handleNationwide = () => {
    onFormChange({
      nationwide: !formData.nationwide,
      serviceAreas: !formData.nationwide ? [] : formData.serviceAreas,
    });
  };

  if (!locationData) return null;

  const regions = locationData.regions;
  const selectedCount = formData.nationwide
    ? Object.values(regions).flat().length
    : formData.serviceAreas.length;

  // Deduplicate cities across regions
  const seenCities = new Set<string>();

  return (
    <div className="space-y-4">
      {/* Nationwide toggle */}
      <button
        type="button"
        onClick={handleNationwide}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
          formData.nationwide
            ? "bg-[#C4735B] text-white"
            : "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] hover:border-[#C4735B]/30"
        }`}
      >
        <Globe className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">
          {t("common.nationwide")} {locationData.emoji}
        </span>
        {formData.nationwide && <Check className="w-4 h-4" />}
      </button>

      {/* Regions with cities */}
      {!formData.nationwide && (
        <div className="space-y-4">
          {Object.entries(regions).map(([regionName, cities]) => {
            // Deduplicate: skip cities we've already shown in another region
            const uniqueCities = cities.filter((city) => {
              if (seenCities.has(city)) return false;
              seenCities.add(city);
              return true;
            });
            if (uniqueCities.length === 0) return null;

            const regionSelectedCount = uniqueCities.filter((c) =>
              formData.serviceAreas.includes(c)
            ).length;
            const allSelected = regionSelectedCount === uniqueCities.length;

            const toggleRegion = () => {
              if (allSelected) {
                onFormChange({
                  serviceAreas: formData.serviceAreas.filter(
                    (a) => !uniqueCities.includes(a)
                  ),
                });
              } else {
                const newAreas = new Set([...formData.serviceAreas, ...uniqueCities]);
                onFormChange({ serviceAreas: [...newAreas], nationwide: false });
              }
            };

            return (
              <div key={regionName}>
                {/* Region header — clickable to select all */}
                <button
                  type="button"
                  onClick={toggleRegion}
                  className="flex items-center gap-2 mb-2 group"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#C4735B] shrink-0" />
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {regionName}
                  </span>
                  {regionSelectedCount > 0 && (
                    <span className="text-[10px] text-[#C4735B] font-medium">
                      {regionSelectedCount}/{uniqueCities.length}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                    {allSelected ? t("common.clear") : t("common.all")}
                  </span>
                </button>

                {/* City pills */}
                <div className="flex flex-wrap gap-1.5">
                  {uniqueCities.map((city) => {
                    const isSelected = formData.serviceAreas.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleCity(city)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-[#C4735B] text-white"
                            : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] hover:border-[#C4735B]/30"
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 inline mr-1 -mt-0.5" strokeWidth={2.5} />
                        )}
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selection summary */}
      {selectedCount > 0 && (
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          {formData.nationwide
            ? t("common.nationwide")
            : `${selectedCount} ${t("common.cities") || "ქალაქი"}`}
        </p>
      )}
    </div>
  );
}
