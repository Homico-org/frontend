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
  { value: 'negotiable', labelEn: 'Negotiable', labelKa: 'შეთანხმებით' },
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
  const { t } = useLanguage();
  const formatNumber = (value: string) => formatNumberWithSpaces(value);
  const parseNumber = (value: string) => parsePriceInput(value);

  return (
    <div className={className}>
      {/* Budget Type Selector */}
      <div className="flex gap-3 mb-5">
        {budgetTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onBudgetTypeChange(type.value)}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
              budgetType === type.value
                ? 'border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B] shadow-sm'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {locale === 'ka' ? type.labelKa : type.labelEn}
          </button>
        ))}
      </div>

      {/* Budget Inputs */}
      {budgetType !== 'negotiable' && (
        <div className={`grid gap-4 ${budgetType === 'range' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium text-base">
              {currency}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={formatNumber(budgetMin)}
              onChange={(e) => onBudgetMinChange(parseNumber(e.target.value))}
              placeholder={budgetType === 'range' ? (t('job.min')) : '1'}
              className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-[#C4735B]/20 focus:border-[#C4735B] transition-all"
            />
          </div>
          {budgetType === 'range' && (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium text-base">
                {currency}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumber(budgetMax)}
                onChange={(e) => onBudgetMaxChange(parseNumber(e.target.value))}
                placeholder={t('job.max')}
                className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-[#C4735B]/20 focus:border-[#C4735B] transition-all"
              />
            </div>
          )}
        </div>
      )}

      {budgetType === 'negotiable' && (
        <p className="text-base text-neutral-500 dark:text-neutral-400 text-center py-5">
          {t('job.priceWillBeDeterminedAfter')}
        </p>
      )}
    </div>
  );
}
