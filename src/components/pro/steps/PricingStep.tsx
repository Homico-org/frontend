'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface PricingStepProps {
  formData: {
    basePrice: string;
    maxPrice: string;
    pricingModel: 'hourly' | 'daily' | 'sqm' | 'project_based' | '';
  };
  onFormChange: (updates: Partial<PricingStepProps['formData']>) => void;
  validation: {
    pricing: boolean;
  };
}

const pricingOptions = [
  { key: 'hourly', label: 'Hourly', labelKa: 'საათობრივი', suffix: '₾/სთ', icon: '⏱️' },
  { key: 'daily', label: 'Daily', labelKa: 'დღიური', suffix: '₾/დღე', icon: '📅' },
  { key: 'sqm', label: 'Per m²', labelKa: 'კვ.მ', suffix: '₾/m²', icon: '📐' },
  { key: 'project_based', label: 'Per Project', labelKa: 'პროექტზე', suffix: '₾', icon: '📋' },
];

export default function PricingStep({
  formData,
  onFormChange,
  validation,
}: PricingStepProps) {
  const { locale } = useLanguage();

  const selectedOption = pricingOptions.find(o => o.key === formData.pricingModel);
  const suffix = selectedOption?.suffix || '₾';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E07B4F]/10 text-[#E07B4F] text-sm font-medium mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {locale === 'ka' ? 'ფასები' : 'Pricing'}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          {locale === 'ka' ? 'განსაზღვრე შენი ფასები' : 'Set your prices'}
        </h2>
        <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
          {locale === 'ka'
            ? 'აირჩიე ფასის ტიპი და დააყენე შენი დიაპაზონი'
            : 'Choose your pricing type and set your rate range'}
        </p>
      </div>

      {/* Pricing Type Selection */}
      <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">
          {locale === 'ka' ? 'ფასის ტიპი' : 'Pricing Type'}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {pricingOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onFormChange({ pricingModel: option.key as any })}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all duration-200
                ${formData.pricingModel === option.key
                  ? 'border-[#E07B4F] bg-[#E07B4F]/5'
                  : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]'
                }
              `}
            >
              {formData.pricingModel === option.key && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#E07B4F] flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <span className="text-2xl mb-2 block">{option.icon}</span>
              <span className={`font-medium block ${formData.pricingModel === option.key ? 'text-[#E07B4F]' : 'text-[var(--color-text-primary)]'}`}>
                {locale === 'ka' ? option.labelKa : option.label}
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">{option.suffix}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--color-text-primary)]">
            {locale === 'ka' ? 'ფასის დიაპაზონი' : 'Price Range'}
          </h3>
          {validation.pricing && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {locale === 'ka' ? 'შევსებულია' : 'Completed'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Min Price */}
          <div className="flex-1">
            <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 block">
              {locale === 'ka' ? 'მინიმალური' : 'Starting Price'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E07B4F] font-semibold">₾</span>
              <input
                type="number"
                min="1"
                value={formData.basePrice}
                onChange={(e) => onFormChange({ basePrice: e.target.value })}
                className={`
                  w-full pl-10 pr-4 py-3.5 rounded-xl text-lg font-semibold
                  bg-[var(--color-bg-tertiary)] border-2
                  text-[var(--color-text-primary)]
                  placeholder-[var(--color-text-muted)]
                  focus:outline-none transition-all duration-200
                  ${validation.pricing
                    ? 'border-emerald-500/30 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10'
                    : 'border-transparent focus:border-[#E07B4F]/50 focus:ring-4 focus:ring-[#E07B4F]/10'
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
              {locale === 'ka' ? 'მაქსიმალური' : 'Maximum Price'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] font-semibold">₾</span>
              <input
                type="number"
                min="1"
                value={formData.maxPrice}
                onChange={(e) => onFormChange({ maxPrice: e.target.value })}
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
              {locale === 'ka' ? 'კლიენტები დაინახავენ:' : 'Clients will see:'}
            </p>
            <p className="text-xl font-bold text-[#E07B4F] mt-1">
              {formData.basePrice}{formData.maxPrice && ` - ${formData.maxPrice}`} {suffix}
            </p>
          </div>
        )}
      </div>

      {/* Pricing Tips */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 rounded-2xl p-5 border border-amber-200/50 dark:border-amber-500/20">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
              {locale === 'ka' ? 'ფასების რჩევები' : 'Pricing Tips'}
            </h4>
            <ul className="text-sm text-amber-700/80 dark:text-amber-400/80 space-y-1.5 mt-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                {locale === 'ka'
                  ? 'შეისწავლე კონკურენტების ფასები'
                  : 'Research competitor pricing in your area'}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                {locale === 'ka'
                  ? 'დაიწყე კონკურენტუნარიანი ფასით და გაზარდე რეიტინგის მატებასთან ერთად'
                  : 'Start competitive and increase as you build ratings'}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                {locale === 'ka'
                  ? 'ფასების დიაპაზონი მოქნილობას გაძლევს პროექტების მიხედვით'
                  : 'Price ranges give you flexibility for different projects'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
