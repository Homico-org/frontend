'use client';

import { Zap, Calendar, Clock, CalendarRange } from 'lucide-react';
import { ReactNode } from 'react';

export type Timing = 'asap' | 'this_week' | 'this_month' | 'flexible';

export interface TimingSelectorProps {
  /** Currently selected timing */
  value: Timing;
  /** Change handler */
  onChange: (value: Timing) => void;
  /** Locale for translations */
  locale?: 'en' | 'ka';
  /** Custom className */
  className?: string;
}

const timingOptions: {
  value: Timing;
  labelEn: string;
  labelKa: string;
  icon: ReactNode;
}[] = [
  { value: 'asap', labelEn: 'ASAP', labelKa: 'სასწრაფოდ', icon: <Zap className="w-4 h-4" /> },
  { value: 'this_week', labelEn: 'This Week', labelKa: 'ამ კვირას', icon: <Calendar className="w-4 h-4" /> },
  { value: 'this_month', labelEn: 'This Month', labelKa: 'ამ თვეში', icon: <CalendarRange className="w-4 h-4" /> },
  { value: 'flexible', labelEn: 'Flexible', labelKa: 'მოქნილი', icon: <Clock className="w-4 h-4" /> },
];

export default function TimingSelector({
  value,
  onChange,
  locale = 'en',
  className = '',
}: TimingSelectorProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${className}`}>
      {timingOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
            value === option.value
              ? 'border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]'
              : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600'
          }`}
        >
          {option.icon}
          <span>{locale === 'ka' ? option.labelKa : option.labelEn}</span>
        </button>
      ))}
    </div>
  );
}
