'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Globe, Check } from 'lucide-react';

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
  onFormChange: (updates: Partial<ServiceAreasStepProps['formData']>) => void;
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
  const { locale } = useLanguage();

  const toggleServiceArea = (area: string) => {
    const newAreas = formData.serviceAreas.includes(area)
      ? formData.serviceAreas.filter(a => a !== area)
      : [...formData.serviceAreas, area];
    onFormChange({ serviceAreas: newAreas });
  };

  const handleNationwideToggle = () => {
    onFormChange({
      nationwide: !formData.nationwide,
      serviceAreas: !formData.nationwide ? [] : formData.serviceAreas
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E07B4F]/10 text-[#E07B4F] text-sm font-medium mb-4">
          <MapPin className="w-4 h-4" />
          {locale === 'ka' ? 'ლოკაცია' : 'Location'}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          {locale === 'ka' ? 'სად მუშაობ?' : 'Where do you work?'}
        </h2>
        <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
          {locale === 'ka'
            ? 'აირჩიე ტერიტორიები სადაც შეგიძლია მომსახურების გაწევა'
            : 'Select the areas where you can provide your services'}
        </p>
      </div>

      {/* Nationwide Option */}
      {locationData && (
        <button
          type="button"
          onClick={handleNationwideToggle}
          className={`
            w-full p-6 rounded-2xl border-2 text-left transition-all duration-200
            ${formData.nationwide
              ? 'border-[#E07B4F] bg-gradient-to-r from-[#E07B4F]/5 to-[#E8956A]/5'
              : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border)] bg-[var(--color-bg-elevated)]'
            }
          `}
        >
          <div className="flex items-start gap-4">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl
              ${formData.nationwide ? 'bg-[#E07B4F]/10' : 'bg-[var(--color-bg-tertiary)]'}
            `}>
              <Globe className={`w-6 h-6 ${formData.nationwide ? 'text-[#E07B4F]' : 'text-[var(--color-text-tertiary)]'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-semibold ${formData.nationwide ? 'text-[#E07B4F]' : 'text-[var(--color-text-primary)]'}`}>
                  {locationData.nationwide}
                </h3>
                <span className="text-lg">{locationData.emoji}</span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {locale === 'ka'
                  ? 'მომსახურება მთელი ქვეყნის მასშტაბით'
                  : 'Serve clients across the entire country'}
              </p>
            </div>
            <div className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
              ${formData.nationwide
                ? 'border-[#E07B4F] bg-[#E07B4F]'
                : 'border-[var(--color-border)]'
              }
            `}>
              {formData.nationwide && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
          </div>
        </button>
      )}

      {/* Divider */}
      {locationData && !formData.nationwide && (
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
          <span className="text-sm text-[var(--color-text-muted)] px-2">
            {locale === 'ka' ? 'ან აირჩიე ქალაქები' : 'Or select cities'}
          </span>
          <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
        </div>
      )}

      {/* Regions and Cities */}
      {locationData && !formData.nationwide && (
        <div className="space-y-6">
          {Object.entries(locationData.regions).map(([regionName, cities]) => (
            <div key={regionName} className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-5 shadow-sm">
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
                        ${isSelected
                          ? 'bg-[#E07B4F] text-white shadow-md shadow-[#E07B4F]/20'
                          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]'
                        }
                      `}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Areas Summary */}
      {!formData.nationwide && formData.serviceAreas.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5 rounded-2xl p-5 border border-emerald-200/50 dark:border-emerald-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                {formData.serviceAreas.length} {locale === 'ka' ? 'ქალაქი არჩეულია' : `cit${formData.serviceAreas.length > 1 ? 'ies' : 'y'} selected`}
              </h4>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                {formData.serviceAreas.slice(0, 5).join(', ')}
                {formData.serviceAreas.length > 5 && ` +${formData.serviceAreas.length - 5} ${locale === 'ka' ? 'სხვა' : 'more'}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-r from-[#E07B4F]/5 to-[#E8956A]/5 rounded-2xl p-5 border border-[#E07B4F]/10">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-[#E07B4F]/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#E07B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-[#E07B4F] mb-1">
              {locale === 'ka' ? 'რატომ არის მნიშვნელოვანი?' : 'Why is this important?'}
            </h4>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {locale === 'ka'
                ? 'კლიენტები ხედავენ მხოლოდ პროფესიონალებს რომლებიც მათ არეალში მუშაობენ. მეტი ტერიტორია = მეტი პოტენციური კლიენტი.'
                : 'Clients only see professionals who work in their area. More territories = more potential clients.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
