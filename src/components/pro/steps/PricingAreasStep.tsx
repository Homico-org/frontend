"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Check, Globe, MapPin, Search, Plus, X } from "lucide-react";
import { useState } from "react";

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
  const [query, setQuery] = useState("");

  const toggleCity = (city: string) => {
    const newAreas = formData.serviceAreas.includes(city)
      ? formData.serviceAreas.filter((a) => a !== city)
      : [...formData.serviceAreas, city];
    onFormChange({ serviceAreas: newAreas, nationwide: false });
  };

  // Let a pro add ANY location that isn't in the curated list (small towns,
  // villages, neighbourhoods). The curated list only covers high-demand
  // metros, so without this pros literally can't declare where they work.
  const addCustom = () => {
    const value = query.trim();
    if (!value) return;
    if (
      !formData.serviceAreas.some(
        (a) => a.trim().toLowerCase() === value.toLowerCase(),
      )
    ) {
      onFormChange({
        serviceAreas: [...formData.serviceAreas, value],
        nationwide: false,
      });
    }
    setQuery("");
  };

  const handleNationwide = () => {
    onFormChange({
      nationwide: !formData.nationwide,
      serviceAreas: !formData.nationwide ? [] : formData.serviceAreas,
    });
  };

  if (!locationData) return null;

  const regions = locationData.regions;
  const q = query.trim().toLowerCase();

  // Dedup cities across regions, then filter by the search query. A region
  // matches wholesale when its NAME matches; otherwise only its matching
  // cities show. Regions with nothing to show are dropped.
  const seenCities = new Set<string>();
  const filteredRegions = Object.entries(regions)
    .map(([regionName, cities]) => {
      const uniqueCities = cities.filter((city) => {
        if (seenCities.has(city)) return false;
        seenCities.add(city);
        return true;
      });
      const regionMatches = regionName.toLowerCase().includes(q);
      const shown =
        !q || regionMatches
          ? uniqueCities
          : uniqueCities.filter((c) => c.toLowerCase().includes(q));
      return { regionName, shown };
    })
    .filter((r) => r.shown.length > 0);

  const hasResults = filteredRegions.length > 0;
  const alreadySelected = formData.serviceAreas.some(
    (a) => a.trim().toLowerCase() === q,
  );
  // Offer "Add <query>" only when the search found nothing in the curated
  // list and it isn't already selected — that's exactly when a pro needs to
  // add a location the list doesn't know about.
  const showAddCustom = q.length > 0 && !hasResults && !alreadySelected;

  const selectedCount = formData.nationwide
    ? Object.values(regions).flat().length
    : formData.serviceAreas.length;

  return (
    <div className="space-y-4">
      {/* Nationwide toggle */}
      <button
        type="button"
        onClick={handleNationwide}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
          formData.nationwide
            ? "bg-[var(--hm-brand-500)] text-white"
            : "bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-secondary)] border border-[var(--hm-border-subtle)] hover:border-[var(--hm-brand-500)]/30"
        }`}
      >
        <Globe className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">
          {t("common.nationwide")} {locationData.emoji}
        </span>
        {formData.nationwide && <Check className="w-4 h-4" />}
      </button>

      {!formData.nationwide && (
        <>
          {/* Search — filter the curated list or add a custom location */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hm-fg-muted)] pointer-events-none" />
            <input
              type="text"
              value={query}
              maxLength={60}
              aria-label={t("common.searchLocationPlaceholder")}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && showAddCustom) {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder={t("common.searchLocationPlaceholder")}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm bg-[var(--hm-bg-elevated)] border border-[var(--hm-border-subtle)] text-[var(--hm-fg-primary)] placeholder:text-[var(--hm-fg-muted)] focus:outline-none focus:border-[var(--hm-brand-500)]/50"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("common.clearSearch")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Add-custom prompt when the search found nothing curated */}
          {showAddCustom && (
            <button
              type="button"
              onClick={addCustom}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)] border border-dashed border-[var(--hm-brand-500)]/40 hover:bg-[var(--hm-brand-500)]/15 transition-all"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {t("common.add")} “{query.trim()}”
              </span>
            </button>
          )}

          {/* Selected locations — a single place to see/remove everything,
              including custom-added ones that live in no region. */}
          {formData.serviceAreas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {formData.serviceAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleCity(area)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--hm-brand-500)] text-white max-w-[200px]"
                >
                  <span className="truncate">{area}</span>
                  <X className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                </button>
              ))}
            </div>
          )}

          {/* Regions with cities (filtered by the search query) */}
          {hasResults && (
            <div className="space-y-4">
              {filteredRegions.map(({ regionName, shown }) => {
                const regionSelectedCount = shown.filter((c) =>
                  formData.serviceAreas.includes(c),
                ).length;
                const allSelected = regionSelectedCount === shown.length;

                const toggleRegion = () => {
                  if (allSelected) {
                    onFormChange({
                      serviceAreas: formData.serviceAreas.filter(
                        (a) => !shown.includes(a),
                      ),
                    });
                  } else {
                    const newAreas = new Set([
                      ...formData.serviceAreas,
                      ...shown,
                    ]);
                    onFormChange({
                      serviceAreas: [...newAreas],
                      nationwide: false,
                    });
                  }
                };

                return (
                  <div key={regionName}>
                    {/* Region header — clickable to select all shown */}
                    <button
                      type="button"
                      onClick={toggleRegion}
                      className="flex items-center gap-2 mb-2 group"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[var(--hm-brand-500)] shrink-0" />
                      <span className="text-xs font-semibold text-[var(--hm-fg-primary)]">
                        {regionName}
                      </span>
                      {regionSelectedCount > 0 && (
                        <span className="text-[10px] text-[var(--hm-brand-500)] font-medium">
                          {regionSelectedCount}/{shown.length}
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--hm-fg-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                        {allSelected ? t("common.clear") : t("common.all")}
                      </span>
                    </button>

                    {/* City pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {shown.map((city) => {
                        const isSelected =
                          formData.serviceAreas.includes(city);
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => toggleCity(city)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-[var(--hm-brand-500)] text-white"
                                : "bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] border border-[var(--hm-border-subtle)] hover:border-[var(--hm-brand-500)]/30"
                            }`}
                          >
                            {isSelected && (
                              <Check
                                className="w-3 h-3 inline mr-1 -mt-0.5"
                                strokeWidth={2.5}
                              />
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
            <p className="text-xs text-[var(--hm-fg-muted)] text-center">
              {`${selectedCount} ${t("common.cities") || "ქალაქი"}`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
