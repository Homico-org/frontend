'use client';

import { useLanguage } from '@/contexts/LanguageContext';

// Budget filter options
const BUDGET_FILTERS = [
  { key: 'all', name: 'Any Budget', nameKa: 'ნებისმიერი' },
  { key: 'under-500', name: 'Under ₾500', nameKa: '₾500-მდე', max: 500 },
  { key: '500-2000', name: '₾500 - ₾2000', nameKa: '₾500 - ₾2000', min: 500, max: 2000 },
  { key: '2000-5000', name: '₾2000 - ₾5000', nameKa: '₾2000 - ₾5000', min: 2000, max: 5000 },
  { key: 'over-5000', name: 'Over ₾5000', nameKa: '₾5000+', min: 5000 },
];

export { BUDGET_FILTERS };

interface JobsFilterSectionProps {
  selectedBudget: string;
  onSelectBudget: (budget: string) => void;
}

export default function JobsFilterSection({
  selectedBudget,
  onSelectBudget,
}: JobsFilterSectionProps) {
  const { locale } = useLanguage();

  return (
    <div className="w-full">
      {/* Budget Filter - compact styling */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
        <span className="text-[11px] text-[var(--color-text-muted)] mr-1 flex-shrink-0 font-medium">
          {locale === 'ka' ? 'ბიუჯეტი:' : 'Budget:'}
        </span>
        {BUDGET_FILTERS.map((budget) => (
          <button
            key={budget.key}
            onClick={() => onSelectBudget(budget.key)}
            className={`
              px-2 py-1.5 rounded text-[11px] font-medium transition-all duration-150 flex-shrink-0
              ${selectedBudget === budget.key
                ? 'bg-[#E07B4F]/15 text-[#E07B4F]'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[#E07B4F]/5'
              }
            `}
          >
            {locale === 'ka' ? budget.nameKa : budget.name}
          </button>
        ))}
      </div>
    </div>
  );
}
