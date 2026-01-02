'use client';

import { Home, Building2, Building, Factory, HelpCircle } from 'lucide-react';
import { ReactNode } from 'react';

export type PropertyType = 'apartment' | 'office' | 'building' | 'house' | 'other';

export interface PropertyTypeSelectorProps {
  /** Currently selected property type */
  value: PropertyType;
  /** Change handler */
  onChange: (value: PropertyType) => void;
  /** Locale for translations */
  locale?: 'en' | 'ka';
  /** Custom className */
  className?: string;
}

const propertyTypes: {
  value: PropertyType;
  labelEn: string;
  labelKa: string;
  icon: ReactNode;
}[] = [
  { value: 'apartment', labelEn: 'Apartment', labelKa: 'ბინა', icon: <Building2 className="w-5 h-5" /> },
  { value: 'house', labelEn: 'House', labelKa: 'სახლი', icon: <Home className="w-5 h-5" /> },
  { value: 'office', labelEn: 'Office', labelKa: 'ოფისი', icon: <Building className="w-5 h-5" /> },
  { value: 'building', labelEn: 'Building', labelKa: 'შენობა', icon: <Factory className="w-5 h-5" /> },
  { value: 'other', labelEn: 'Other', labelKa: 'სხვა', icon: <HelpCircle className="w-5 h-5" /> },
];

export default function PropertyTypeSelector({
  value,
  onChange,
  locale = 'en',
  className = '',
}: PropertyTypeSelectorProps) {
  return (
    <div className={`grid grid-cols-5 gap-2 ${className}`}>
      {propertyTypes.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onChange(type.value)}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
            value === type.value
              ? 'border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]'
              : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600'
          }`}
        >
          {type.icon}
          <span className="text-xs font-medium">
            {locale === 'ka' ? type.labelKa : type.labelEn}
          </span>
        </button>
      ))}
    </div>
  );
}
