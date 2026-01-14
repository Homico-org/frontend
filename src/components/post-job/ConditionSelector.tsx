'use client';

import { Hammer, PaintBucket, Sparkles, HardHat, Wrench } from 'lucide-react';
import { ReactNode } from 'react';

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
  locale = 'en',
  className = '',
  category,
}: ConditionSelectorProps) {
  const conditions = getConditionsForCategory(category);

  return (
    <div className={`space-y-3 ${className}`}>
      {conditions.map((condition) => (
        <button
          key={condition.value}
          type="button"
          onClick={() => onChange(condition.value)}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
            value === condition.value
              ? 'border-[#C4735B] bg-[#C4735B]/5 shadow-sm'
              : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
              value === condition.value
                ? 'bg-[#C4735B]/10 text-[#C4735B]'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
            }`}
          >
            {condition.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-base font-semibold ${
                value === condition.value
                  ? 'text-[#C4735B]'
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}
            >
              {locale === 'ka' ? condition.labelKa : condition.labelEn}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {locale === 'ka' ? condition.descKa : condition.descEn}
            </p>
          </div>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              value === condition.value
                ? 'border-[#C4735B] bg-[#C4735B]'
                : 'border-neutral-300 dark:border-neutral-600'
            }`}
          >
            {value === condition.value && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
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
