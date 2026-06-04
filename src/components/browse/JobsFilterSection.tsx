'use client';

import { FilterPills } from '@/components/ui/FilterPills';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketplaceCountry } from '@/hooks/useCountry';
import { currencySymbol } from '@/utils/currency';

// Budget brackets - nominal numbers, currency symbol resolved per
// marketplace at render time so the same component works in /us, /il,
// /fr without separate constant tables.
const BUDGET_BRACKETS = [
  { key: 'all', min: null as number | null, max: null as number | null },
  { key: 'under-500', min: null, max: 500 },
  { key: '500-2000', min: 500, max: 2000 },
  { key: '2000-5000', min: 2000, max: 5000 },
  { key: 'over-5000', min: 5000, max: null },
];

interface JobsFilterSectionProps {
  selectedBudget: string;
  onSelectBudget: (budget: string) => void;
}

export default function JobsFilterSection({
  selectedBudget,
  onSelectBudget,
}: JobsFilterSectionProps) {
  const { t } = useLanguage();
  const country = useMarketplaceCountry();
  const sym = currencySymbol({ country });

  const labelFor = (b: { key: string; min: number | null; max: number | null }): string => {
    if (b.key === 'all') return t('browse.anyBudget');
    if (b.min == null && b.max != null) return `< ${sym}${b.max}`;
    if (b.min != null && b.max == null) return `${sym}${b.min}+`;
    if (b.min != null && b.max != null) return `${sym}${b.min} - ${sym}${b.max}`;
    return b.key;
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[var(--hm-fg-muted)] flex-shrink-0 font-medium">
          {t('common.budget')}
        </span>
        <FilterPills
          size="sm"
          activeVariant="terracotta"
          value={selectedBudget}
          onChange={onSelectBudget}
          options={BUDGET_BRACKETS.map((b) => ({ key: b.key, label: labelFor(b) }))}
        />
      </div>
    </div>
  );
}
