'use client';

import { Zap, Calendar, Clock, CalendarRange } from 'lucide-react';
import { ReactNode } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";

export type Timing = 'asap' | 'this_week' | 'this_month' | 'flexible';

export interface TimingSelectorProps {
  /** Currently selected timing */
  value: Timing;
  /** Change handler */
  onChange: (value: Timing) => void;
  /** Locale for translations */
  locale?: 'en' | 'ka' | 'ru';
  /** Custom className */
  className?: string;
}

const timingOptions: {
  value: Timing;
  labelEn: string;
  labelKa: string;
  icon: ReactNode;
}[] = [
  { value: 'asap', labelEn: 'ASAP', labelKa: 'სასწრაფოდ', icon: <Zap className="w-5 h-5" /> },
  { value: 'this_week', labelEn: 'This Week', labelKa: 'ამ კვირას', icon: <Calendar className="w-5 h-5" /> },
  { value: 'this_month', labelEn: 'This Month', labelKa: 'ამ თვეში', icon: <CalendarRange className="w-5 h-5" /> },
  { value: 'flexible', labelEn: 'Flexible', labelKa: 'მოქნილი', icon: <Clock className="w-5 h-5" /> },
];

export default function TimingSelector({
  value,
  onChange,
  className = '',
}: TimingSelectorProps) {
  const { pick } = useLanguage();
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 ${className}`}>
      {timingOptions.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex items-center justify-center gap-2 sm:gap-2.5 py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl text-[13px] sm:text-sm font-medium transition-all duration-150 ${
              selected ? '-translate-y-[1px]' : 'hover:-translate-y-[1px] hover:shadow-md'
            }`}
            style={
              selected
                ? {
                    background:
                      'linear-gradient(180deg, rgba(239,78,36,0.12) 0%, rgba(239,78,36,0.04) 100%)',
                    border: '1px solid rgba(239,78,36,0.45)',
                    color: 'var(--hm-brand-500)',
                    boxShadow:
                      '0 4px 10px -2px rgba(239,78,36,0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
                  }
                : {
                    backgroundColor: 'var(--hm-bg-elevated)',
                    border: '1px solid var(--hm-border-subtle)',
                    color: 'var(--hm-fg-secondary)',
                    boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
                  }
            }
            aria-pressed={selected}
          >
            {option.icon}
            <span>{pick({ en: option.labelEn, ka: option.labelKa })}</span>
          </button>
        );
      })}
    </div>
  );
}
