"use client";

import { Check } from "lucide-react";
import { ReactNode } from "react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  children?: ReactNode;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}

export default function Checkbox({
  checked,
  onChange,
  label,
  children,
  size = "md",
  disabled = false,
  className = "",
}: CheckboxProps) {
  const isSm = size === "sm";

  return (
    <label
      className={`inline-flex items-start gap-2 cursor-pointer select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => { e.preventDefault(); if (!disabled) onChange(!checked); }}
        className={`flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-150 mt-px ${
          isSm ? "w-4 h-4" : "w-[18px] h-[18px]"
        } ${
          checked
            ? "border-[#C4735B] bg-[#C4735B] shadow-sm"
            : "border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:border-[#C4735B]/50"
        }`}
      >
        {checked && (
          <Check
            className={`text-white ${isSm ? "w-2.5 h-2.5" : "w-3 h-3"}`}
            strokeWidth={3}
          />
        )}
      </button>
      {(label || children) && (
        <span
          className={`${isSm ? "text-xs" : "text-sm"} ${
            checked
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-600 dark:text-neutral-400"
          }`}
        >
          {children || label}
        </span>
      )}
    </label>
  );
}
