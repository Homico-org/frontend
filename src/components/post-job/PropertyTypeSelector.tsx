'use client';

import { Building, Building2, Factory, HelpCircle, Home } from 'lucide-react';
import { ReactNode } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";

export type PropertyType = 'apartment' | 'office' | 'building' | 'house' | 'other';

export interface PropertyTypeSelectorProps {
  /** Currently selected property type */
  value: PropertyType;
  /** Change handler */
  onChange: (value: PropertyType) => void;
  /** Locale for translations */
  locale?: 'en' | 'ka' | 'ru';
  /** Custom className */
  className?: string;
}

const propertyTypes: {
  value: PropertyType;
  labelEn: string;
  labelKa: string;
  icon: ReactNode;
}[] = [
  { value: 'apartment', labelEn: 'Apartment', labelKa: 'ბინა', icon: <Building2 className="w-6 h-6" /> },
  { value: 'house', labelEn: 'House', labelKa: 'სახლი', icon: <Home className="w-6 h-6" /> },
  { value: 'office', labelEn: 'Office', labelKa: 'ოფისი', icon: <Building className="w-6 h-6" /> },
  { value: 'building', labelEn: 'Building', labelKa: 'შენობა', icon: <Factory className="w-6 h-6" /> },
  { value: 'other', labelEn: 'Other', labelKa: 'სხვა', icon: <HelpCircle className="w-6 h-6" /> },
];

export default function PropertyTypeSelector({
  value,
  onChange,
  className = '',
}: PropertyTypeSelectorProps) {
  const { pick } = useLanguage();
  return (
    <div className={`grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 ${className}`}>
      {propertyTypes.map((type) => {
        const selected = value === type.value;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`flex flex-col items-center gap-1.5 sm:gap-2 py-3 px-2 sm:p-4 rounded-xl transition-all duration-150 ${
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
            {type.icon}
            <span className="text-xs sm:text-sm font-medium leading-tight text-center">
              {pick({ en: type.labelEn, ka: type.labelKa })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
