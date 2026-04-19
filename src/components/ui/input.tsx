'use client';

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
/**
 * Homico Design System — Input
 * No border-radius (architectural). Focus: brand 3px glow.
 * Padding: 12px 14px. Font: 15px.
 */
const inputVariants = cva(
  "flex w-full text-[var(--hm-fg-primary)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--hm-fg-muted)] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)] focus:outline-none focus:border-[var(--hm-brand-500)] focus:ring-[3px] focus:ring-[var(--hm-brand-100)]",
        filled:
          "bg-[var(--hm-bg-tertiary)] border border-transparent focus:outline-none focus:border-[var(--hm-brand-500)] focus:ring-[3px] focus:ring-[var(--hm-brand-100)] focus:bg-[var(--hm-bg-elevated)]",
        ghost:
          "bg-transparent border-b border-[var(--hm-border-subtle)] rounded-none focus:outline-none focus:border-[var(--hm-brand-500)]",
        premium:
          "bg-[var(--hm-bg-elevated)] border border-[var(--hm-brand-200)] focus:outline-none focus:border-[var(--hm-brand-500)] focus:ring-[3px] focus:ring-[var(--hm-brand-100)]",
      },
      inputSize: {
        sm: "h-8 px-3 py-1.5 text-xs",
        default: "h-10 px-4 py-2 text-[15px]",
        lg: "h-12 px-4 py-3 text-[15px]",
        xl: "h-14 px-5 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, leftIcon, rightIcon, error, success, min, onChange, ...props }, ref) => {
    // Hide number spinners when rightIcon is present to prevent overlap
    const hideSpinners = type === 'number' && rightIcon;

    // For number inputs, default min to 0 to prevent negative values
    const numberMin = type === 'number' ? (min !== undefined ? Number(min) : 0) : undefined;

    // Handle change to prevent negative values for number inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === 'number') {
        const value = e.target.value;
        // Allow empty string for clearing
        if (value === '') {
          onChange?.(e);
          return;
        }
        // Prevent negative values
        const numValue = parseFloat(value);
        const minValue = numberMin ?? 0;
        if (!isNaN(numValue) && numValue < minValue) {
          e.target.value = String(minValue);
        }
      }
      onChange?.(e);
    };

    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--hm-fg-muted)]">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          min={numberMin}
          className={cn(
            inputVariants({ variant, inputSize }),
            leftIcon && "pl-10",
            rightIcon && "pr-12",
            error && "border-[var(--hm-error-500)] focus:border-[var(--hm-error-500)] focus:ring-red-500/15",
            success && "border-[var(--hm-success-500)] focus:border-[var(--hm-success-500)] focus:ring-emerald-500/15",
            hideSpinners && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            className
          )}
          ref={ref}
          onChange={handleChange}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--hm-fg-muted)]">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// ============================================================================
// Textarea Component
// ============================================================================

const textareaVariants = cva(
  "flex w-full text-[var(--hm-fg-primary)] placeholder:text-[var(--hm-fg-muted)] disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)] focus:outline-none focus:border-[var(--hm-brand-500)] focus:ring-[3px] focus:ring-[var(--hm-brand-100)]",
        filled:
          "bg-[var(--hm-bg-tertiary)] border border-transparent focus:outline-none focus:border-[var(--hm-brand-500)] focus:ring-[3px] focus:ring-[var(--hm-brand-100)] focus:bg-[var(--hm-bg-elevated)]",
        ghost:
          "bg-transparent border-b border-[var(--hm-border-subtle)] rounded-none focus:outline-none focus:border-[var(--hm-brand-500)]",
        premium:
          "bg-[var(--hm-bg-elevated)] border border-[var(--hm-brand-200)] focus:outline-none focus:border-[var(--hm-brand-500)] focus:ring-[3px] focus:ring-[var(--hm-brand-100)]",
      },
      textareaSize: {
        sm: "min-h-[80px] px-3 py-2 text-xs",
        default: "min-h-[100px] px-4 py-3 text-[15px]",
        lg: "min-h-[120px] px-5 py-4 text-base",
        xl: "min-h-[150px] px-6 py-5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      textareaSize: "default",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: boolean;
  success?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, textareaSize, error, success, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          textareaVariants({ variant, textareaSize }),
          error && "border-[var(--hm-error-500)] focus:border-[var(--hm-error-500)] focus:ring-red-500/15",
          success && "border-[var(--hm-success-500)] focus:border-[var(--hm-success-500)] focus:ring-emerald-500/15",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

// ============================================================================
// Label Component
// ============================================================================

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  optional?: boolean;
  hint?: string;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, optional, hint, ...props }, ref) => {
    const { t } = useLanguage();
    const optionalText = t('common.optional');
    
    return (
      <div className="flex items-center justify-between mb-2">
        <label
          ref={ref}
          className={cn(
            "text-sm font-medium text-[var(--hm-fg-secondary)] flex items-center gap-2",
            className
          )}
          {...props}
        >
          {children}
          {required && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-[var(--hm-warning-500)]/15 text-[var(--hm-warning-500)] border border-[var(--hm-warning-500)]/20">
              *
            </span>
          )}
          {optional && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
              {optionalText}
            </span>
          )}
        </label>
        {hint && (
          <span className="text-xs text-[var(--hm-fg-muted)]">{hint}</span>
        )}
      </div>
    )
  }
)
Label.displayName = "Label"

// ============================================================================
// Form Group Component (combines label, input, and helper text)
// ============================================================================

interface FormGroupProps {
  label?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  success?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

const FormGroup = ({
  label,
  required,
  optional,
  hint,
  error,
  success,
  helperText,
  children,
  className,
}: FormGroupProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label required={required} optional={optional} hint={hint}>
          {label}
        </Label>
      )}
      {children}
      {(error || success || helperText) && (
        <p className={cn(
          "text-xs",
          error && "text-[var(--hm-error-500)]",
          success && "text-[var(--hm-success-500)]",
          !error && !success && "text-[var(--hm-fg-muted)]"
        )}>
          {error || success || helperText}
        </p>
      )}
    </div>
  )
}

export { FormGroup, Input, inputVariants, Label, Textarea, textareaVariants };

