'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { ClipboardEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

const inputVariants = cva(
  'text-center font-mono font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        sm: 'w-10 h-10 text-lg',
        md: 'w-12 h-12 text-xl',
        lg: 'w-14 h-14 text-2xl',
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

export interface OTPInputProps extends VariantProps<typeof inputVariants> {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
}

/**
 * OTP/PIN input with auto-advance and paste support
 */
export function OTPInput({
  length = 4,
  value = '',
  onChange,
  onComplete,
  autoFocus = true,
  disabled = false,
  error,
  label,
  size = 'md',
  variant = 'default',
  className,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [localValue, setLocalValue] = useState<string[]>(
    value.split('').slice(0, length).concat(Array(length).fill('')).slice(0, length)
  );

  // Sync with external value
  useEffect(() => {
    const newValue = value.split('').slice(0, length);
    setLocalValue(newValue.concat(Array(length - newValue.length).fill('')));
  }, [value, length]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const actualVariant = error ? 'error' : variant;

  const handleChange = (index: number, inputValue: string) => {
    if (disabled) return;

    // Only allow digits
    const digit = inputValue.replace(/\D/g, '').slice(-1);

    const newValue = [...localValue];
    newValue[index] = digit;
    setLocalValue(newValue);

    const combinedValue = newValue.join('');
    onChange?.(combinedValue);

    // Auto-advance to next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete - all slots filled with digits
    const isComplete = newValue.every(v => v !== '');
    if (isComplete && combinedValue.length === length) {
      onComplete?.(combinedValue);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      if (!localValue[index] && index > 0) {
        // If current input is empty, move to previous
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newValue = [...localValue];
        newValue[index] = '';
        setLocalValue(newValue);
        onChange?.(newValue.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

    if (pastedData) {
      const newValue = pastedData.split('').concat(Array(length).fill('')).slice(0, length);
      setLocalValue(newValue);
      onChange?.(newValue.join(''));

      // Focus the next empty input or the last one
      const nextEmptyIndex = newValue.findIndex((v) => !v);
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[length - 1]?.focus();
        if (pastedData.length === length) {
          onComplete?.(pastedData);
        }
      }
    }
  };

  const handleFocus = (index: number) => {
    // Select the input content on focus
    inputRefs.current[index]?.select();
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          className="block text-sm font-medium mb-3 text-center"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {label}
        </label>
      )}
      <div className="flex justify-center gap-2">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={localValue[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            className={cn(inputVariants({ size, variant: actualVariant }))}
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              borderColor: error ? undefined : 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}

export default OTPInput;
