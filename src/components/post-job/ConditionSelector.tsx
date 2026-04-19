'use client';

import { Hammer, PaintBucket, Sparkles, HardHat, Wrench, Check } from 'lucide-react';
import { ReactNode } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";

export type PropertyCondition = 'shell' | 'black-frame' | 'needs-renovation' | 'partial-renovation' | 'good';

export interface ConditionSelectorProps {
  value: PropertyCondition | '';
  onChange: (value: PropertyCondition) => void;
  locale?: 'en' | 'ka' | 'ru';
  className?: string;
  /** Category to customize options displayed */
  category?: string;
}

interface ConditionOption {
  value: PropertyCondition;
  labelEn: string;
  labelKa: string;
  descEn: string;
  descKa: string;
  icon: ReactNode;
}

const allConditions: ConditionOption[] = [
  {
    value: 'shell',
    labelEn: 'Shell / White Frame',
    labelKa: 'თეთრი კარკასი',
    descEn: 'Bare walls, no finishing',
    descKa: 'შიშველი კედლები, მოპირკეთება არ არის',
    icon: <HardHat className="w-5 h-5" />,
  },
  {
    value: 'black-frame',
    labelEn: 'Black Frame',
    labelKa: 'შავი კარკასი',
    descEn: 'Basic utilities, unfinished',
    descKa: 'ძირითადი კომუნიკაციები, დაუმთავრებელი',
    icon: <Wrench className="w-5 h-5" />,
  },
  {
    value: 'needs-renovation',
    labelEn: 'Needs Full Renovation',
    labelKa: 'სრული რემონტი სჭირდება',
    descEn: 'Old finish, complete redo needed',
    descKa: 'ძველი მოპირკეთება, სრული განახლება სჭირდება',
    icon: <Hammer className="w-5 h-5" />,
  },
  {
    value: 'partial-renovation',
    labelEn: 'Partial Renovation',
    labelKa: 'ნაწილობრივი რემონტი',
    descEn: 'Some areas need work',
    descKa: 'ზოგიერთი ზონა საჭიროებს სამუშაოს',
    icon: <PaintBucket className="w-5 h-5" />,
  },
  {
    value: 'good',
    labelEn: 'Good Condition',
    labelKa: 'კარგ მდგომარეობაში',
    descEn: 'Minor updates or additions',
    descKa: 'მცირე განახლებები ან დამატებები',
    icon: <Sparkles className="w-5 h-5" />,
  },
];

// Categories that should show condition selector
export const categoriesNeedingCondition = ['interior-design', 'design', 'architecture', 'craftsmen'];

// Get relevant conditions based on category
const getConditionsForCategory = (category?: string): ConditionOption[] => {
  // All categories get all options for now, but we can customize later
  return allConditions;
};

export default function ConditionSelector({
  value,
  onChange,
  className = '',
  category,
}: ConditionSelectorProps) {
  const { pick } = useLanguage();
  const conditions = getConditionsForCategory(category);

  return (
    <div className={`space-y-2 sm:space-y-3 ${className}`}>
      {conditions.map((condition) => (
        <button
          key={condition.value}
          type="button"
          onClick={() => onChange(condition.value)}
          className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
            value === condition.value
              ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/5 shadow-sm'
              : 'border-[var(--hm-border)] hover:border-[var(--hm-border-strong)] hover:bg-[var(--hm-bg-tertiary)]'
          }`}
        >
          <div
            className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
              value === condition.value
                ? 'bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]'
                : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
            }`}
          >
            {condition.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm sm:text-base font-semibold ${
                value === condition.value
                  ? 'text-[var(--hm-brand-500)]'
                  : 'text-[var(--hm-fg-primary)]'
              }`}
            >
              {pick({ en: condition.labelEn, ka: condition.labelKa })}
            </p>
            <p className="text-sm text-[var(--hm-fg-muted)] mt-0.5">
              {pick({ en: condition.descEn, ka: condition.descKa })}
            </p>
          </div>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              value === condition.value
                ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]'
                : 'border-[var(--hm-border-strong)]'
            }`}
          >
            {value === condition.value && (
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// Helper to get condition label
export function getConditionLabel(condition: PropertyCondition | string, locale: 'en' | 'ka' | 'ru'): string {
  const found = allConditions.find((c) => c.value === condition);
  if (!found) return condition;
  return locale === 'ka' ? found.labelKa : found.labelEn;
}
