"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Check, Globe, MapPin } from "lucide-react";

interface ServiceAreasStepProps {
  formData: {
    serviceAreas: string[];
    nationwide: boolean;
  };
  locationData: {
    country: string;
    nationwide: string;
    regions: Record<string, string[]>;
    emoji: string;
  } | null;
  onFormChange: (updates: Partial<ServiceAreasStepProps["formData"]>) => void;
  validation: {
    serviceAreas: boolean;
  };
}

export default function ServiceAreasStep({
  formData,
  locationData,
  onFormChange,
  validation,
}: ServiceAreasStepProps) {
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
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Nationwide Option */}
      {locationData && (
        <button
          type="button"
          onClick={handleNationwideToggle}
          className={`
            w-full p-6 rounded-2xl border-2 text-left transition-all duration-200
            ${
              formData.nationwide
                ? "border-[#E07B4F] bg-gradient-to-r from-[#E07B4F]/5 to-[#E8956A]/5"
                : "border-[var(--color-border-subtle)] hover:border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
            }
          `}
        >
          <div className="flex items-start gap-4">
            <div
              className={`
              w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl
              ${formData.nationwide ? "bg-[#E07B4F]/10" : "bg-[var(--color-bg-tertiary)]"}
            `}
            >
              <Globe
                className={`w-6 h-6 ${formData.nationwide ? "text-[#E07B4F]" : "text-[var(--color-text-tertiary)]"}`}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={`font-semibold ${formData.nationwide ? "text-[#E07B4F]" : "text-[var(--color-text-primary)]"}`}
                >
                  მთელი ქვეყნის მასშტაბით
                </h3>
                <span className="text-lg">{locationData.emoji}</span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('common.serveClientsAcrossTheEntire')}
              </p>
            </div>
            <div
              className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
              ${
                formData.nationwide
                  ? "border-[#E07B4F] bg-[#E07B4F]"
                  : "border-[var(--color-border)]"
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
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
          <span className="text-sm text-[var(--color-text-muted)] px-2">
            {t('common.orSelectCities')}
          </span>
          <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
        </div>
      )}

      {/* Regions and Cities */}
      {locationData && !formData.nationwide && (
        <div className="space-y-6">
          {Object.entries(locationData.regions).map(([regionName, cities]) => (
            <div
              key={regionName}
              className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-5 shadow-sm"
            >
              <h4 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E07B4F]" />
                {regionName}
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
                        px-4 py-2 rounded-xl text-sm font-medium
                        transition-all duration-200
                        ${
                          isSelected
                            ? "bg-[#E07B4F] text-white shadow-md shadow-[#E07B4F]/20"
                            : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
                        }
                      `}
                    >
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      )}
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
