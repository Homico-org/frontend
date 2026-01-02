'use client';

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
  locale?: 'en' | 'ka';
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
  const formatNumber = (value: string) => {
    if (!value) return '';
    return Number(value).toLocaleString('en-US').replace(/,/g, ' ');
  };

  const parseNumber = (value: string) => {
    return value.replace(/[^\d]/g, '');
  };

  return (
    <div className={className}>
      {/* Budget Type Selector */}
      <div className="flex gap-2 mb-4">
        {budgetTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onBudgetTypeChange(type.value)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
              budgetType === type.value
                ? 'border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            {locale === 'ka' ? type.labelKa : type.labelEn}
          </button>
        ))}
      </div>

      {/* Budget Inputs */}
      {budgetType !== 'negotiable' && (
        <div className={`grid gap-3 ${budgetType === 'range' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
              {currency}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={formatNumber(budgetMin)}
              onChange={(e) => onBudgetMinChange(parseNumber(e.target.value))}
              placeholder={budgetType === 'range' ? (locale === 'ka' ? 'მინ.' : 'Min') : '0'}
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C4735B] transition-all"
            />
          </div>
          {budgetType === 'range' && (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                {currency}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumber(budgetMax)}
                onChange={(e) => onBudgetMaxChange(parseNumber(e.target.value))}
                placeholder={locale === 'ka' ? 'მაქს.' : 'Max'}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C4735B] transition-all"
              />
            </div>
          )}
        </div>
      )}

      {budgetType === 'negotiable' && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
          {locale === 'ka'
            ? 'ფასი შეთანხმებით განისაზღვრება პროფესიონალთან კონსულტაციის შემდეგ'
            : 'Price will be determined after consultation with the professional'}
        </p>
      )}
    </div>
  );
}
