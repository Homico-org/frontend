'use client';

import { formatNumberWithSpaces, parsePriceInput } from '@/utils/currencyUtils';
import { ACCENT_COLOR } from '@/constants/theme';

import { useLanguage } from "@/contexts/LanguageContext";
export type BudgetType = 'fixed' | 'range' | 'negotiable';

export interface BudgetSelectorProps {
  /** Budget type */
  budgetType: BudgetType;
  /** Change handler for budget type */
  onBudgetTypeChange: (value: BudgetType) => void;
  /** Minimum budget value */
  budgetMin: string;
  /** Change handler for minimum budget */
  onBudgetMinChange: (value: string) => void;
  /** Maximum budget value (for range) */
  budgetMax: string;
  /** Change handler for maximum budget */
  onBudgetMaxChange: (value: string) => void;
  /** Currency symbol */
  currency?: string;
  /** Locale for translations */
  locale?: 'en' | 'ka' | 'ru';
  /** Custom className */
  className?: string;
}

const budgetTypes: {
  value: BudgetType;
  labelEn: string;
  labelKa: string;
}[] = [
  { value: 'fixed', labelEn: 'Fixed', labelKa: 'ფიქსირებული' },
  { value: 'range', labelEn: 'Range', labelKa: 'დიაპაზონი' },
];

export default function BudgetSelector({
  budgetType,
  onBudgetTypeChange,
  budgetMin,
  onBudgetMinChange,
  budgetMax,
  onBudgetMaxChange,
  currency = '₾',
  locale = 'en',
  className = '',
}: BudgetSelectorProps) {
  const { t, pick } = useLanguage();
  const formatNumber = (value: string) => formatNumberWithSpaces(value);
  const parseNumber = (value: string) => parsePriceInput(value);

  return (
    <div className={className}>
      {/* Budget Type Selector — Segmented Control */}
      <div className="flex p-1 rounded-xl bg-[var(--hm-bg-tertiary)] mb-5">
        {budgetTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onBudgetTypeChange(type.value)}
            className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg text-[13px] sm:text-sm font-semibold transition-all ${
              budgetType === type.value
                ? 'bg-[var(--hm-bg-elevated)] text-[var(--hm-brand-500)] shadow-sm'
                : 'text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-secondary)]'
            }`}
          >
            {pick({ en: type.labelEn, ka: type.labelKa })}
          </button>
        ))}
      </div>

      {/* Budget Inputs */}
      {budgetType !== 'negotiable' && (
        <div className={`grid gap-4 ${budgetType === 'range' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--hm-fg-muted)] font-medium text-base">
              {currency}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={formatNumber(budgetMin)}
              onChange={(e) => onBudgetMinChange(parseNumber(e.target.value))}
              placeholder={budgetType === 'range' ? (t('job.min')) : '1'}
              className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--hm-brand-500)]/20 focus:border-[var(--hm-brand-500)] transition-all"
            />
          </div>
          {budgetType === 'range' && (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--hm-fg-muted)] font-medium text-base">
                {currency}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumber(budgetMax)}
                onChange={(e) => onBudgetMaxChange(parseNumber(e.target.value))}
                placeholder={t('job.max')}
                className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--hm-brand-500)]/20 focus:border-[var(--hm-brand-500)] transition-all"
              />
            </div>
          )}
        </div>
      )}

      {budgetType === 'negotiable' && (
        <p className="text-base text-[var(--hm-fg-muted)] text-center py-5">
          {t('job.priceWillBeDeterminedAfter')}
        </p>
      )}
    </div>
  );
}
