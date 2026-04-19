'use client';

import { FilterPills } from '@/components/ui/FilterPills';
import { useLanguage } from '@/contexts/LanguageContext';

// Budget filter options
const BUDGET_FILTERS = [
  { key: 'all', name: 'Any Budget', nameKa: 'ნებისმიერი', nameRu: 'Любой' },
  { key: 'under-500', name: 'Under ₾500', nameKa: '₾500-მდე', nameRu: 'До ₾500', max: 500 },
  { key: '500-2000', name: '₾500 - ₾2000', nameKa: '₾500 - ₾2000', nameRu: '₾500 - ₾2000', min: 500, max: 2000 },
  { key: '2000-5000', name: '₾2000 - ₾5000', nameKa: '₾2000 - ₾5000', nameRu: '₾2000 - ₾5000', min: 2000, max: 5000 },
  { key: 'over-5000', name: 'Over ₾5000', nameKa: '₾5000+', nameRu: 'Больше ₾5000', min: 5000 },
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
  const { t, pick } = useLanguage();

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
          options={BUDGET_FILTERS.map((b) => ({
            key: b.key,
            label: pick({ en: b.name, ka: b.nameKa, ru: b.nameRu }),
          }))}
        />
      </div>
    </div>
  );
}
