'use client';

import { useState, useEffect, useCallback, forwardRef, InputHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { countries } from '@/contexts/LanguageContext';
import { useClickOutside } from '@/hooks/useClickOutside';

export type CountryCode = keyof typeof countries;

const inputVariants = cva(
  'w-full rounded-xl transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-3 text-base',
        lg: 'px-5 py-4 text-lg',
      },
      variant: {
        default: 'border focus:ring-[#C4735B]/50 focus:border-[#C4735B]',
        error: 'border border-red-300 focus:ring-red-500/50 focus:border-red-500',
        success: 'border border-green-300 focus:ring-green-500/50 focus:border-green-500',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const selectorPadding = {
  sm: 'pl-20',
  md: 'pl-24',
  lg: 'pl-28',
};

export interface PhoneInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'>,
    VariantProps<typeof inputVariants> {
  value?: string;
  onChange?: (value: string) => void;
  onCountryChange?: (country: CountryCode) => void;
  country?: CountryCode;
  label?: string;
  error?: string;
  hint?: string;
  showIcon?: boolean;
}

/**
 * Phone input with country code selector
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      size = 'md',
      variant = 'default',
      value = '',
      onChange,
      onCountryChange,
      country = 'GE',
      label,
      error,
      hint,
      disabled,
      showIcon = true,
      ...props
    },
    ref
  ) => {
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(country);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
    const triggerRef = useClickOutside<HTMLDivElement>(() => setShowDropdown(false), showDropdown);
    const dropdownRef = useClickOutside<HTMLDivElement>(() => setShowDropdown(false), showDropdown);

    const actualVariant = error ? 'error' : variant;
    const countryData = countries[selectedCountry];

    // Sync with external country prop
    useEffect(() => {
      setSelectedCountry(country);
    }, [country]);

    // Calculate dropdown position relative to viewport
    const updatePosition = useCallback(() => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }, [triggerRef]);

    useEffect(() => {
      if (showDropdown) {
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
          window.removeEventListener('scroll', updatePosition, true);
          window.removeEventListener('resize', updatePosition);
        };
      }
    }, [showDropdown, updatePosition]);

    const handleCountrySelect = (code: CountryCode) => {
      setSelectedCountry(code);
      onCountryChange?.(code);
      setShowDropdown(false);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = e.target.value.replace(/\D/g, '');
      onChange?.(cleaned);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {label}
          </label>
        )}
        <div className="relative" ref={triggerRef}>
          {/* Country selector */}
          <button
            type="button"
            onClick={() => !disabled && setShowDropdown(!showDropdown)}
            disabled={disabled}
            className={cn(
              'absolute left-0 top-0 bottom-0 flex items-center gap-1 px-3 border-r transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-l-xl disabled:opacity-50 disabled:cursor-not-allowed',
              showDropdown && 'bg-neutral-50 dark:bg-neutral-800'
            )}
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span className="text-lg">{countryData.flag}</span>
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {countryData.phonePrefix}
            </span>
            <ChevronDown
              className={cn(
                'w-3 h-3 text-neutral-400 transition-transform duration-200',
                showDropdown && 'rotate-180'
              )}
            />
          </button>

          {/* Phone input */}
          <input
            ref={ref}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={value}
            onChange={handlePhoneChange}
            disabled={disabled}
            placeholder={countryData.placeholder}
            className={cn(
              inputVariants({ size, variant: actualVariant }),
              selectorPadding[size || 'md'],
              className
            )}
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: error ? undefined : 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            {...props}
          />

          {/* Country dropdown — rendered in portal */}
          {showDropdown && dropdownPos && createPortal(
            <div
              ref={dropdownRef}
              className="fixed w-64 max-h-64 overflow-y-auto rounded-xl shadow-2xl border z-[200] animate-scale-in"
              style={{
                top: dropdownPos.top,
                left: dropdownPos.left,
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="p-1">
                {(Object.keys(countries) as CountryCode[]).map((code) => {
                  const data = countries[code];
                  const isSelected = selectedCountry === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleCountrySelect(code)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors',
                        isSelected
                          ? 'bg-[#C4735B]/10'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      )}
                    >
                      <span className="text-xl">{data.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {data.name}
                        </p>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {data.phonePrefix}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#C4735B] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-neutral-500">{hint}</p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput;
