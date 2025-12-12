"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  /** Custom href to navigate to instead of going back */
  href?: string;
  /** Custom label (defaults to "Back" / "უკან") */
  label?: string;
  /** Whether to show the label text */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Button variant style */
  variant?: "default" | "minimal" | "filled";
}

export default function BackButton({
  href,
  label,
  showLabel = true,
  className = "",
  variant = "default",
}: BackButtonProps) {
  const router = useRouter();
  const { locale } = useLanguage();

  const defaultLabel = locale === "ka" ? "უკან" : "Back";
  const displayLabel = label || defaultLabel;

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  const baseStyles =
    "group inline-flex items-center gap-2 transition-all duration-300";

  const variantStyles = {
    default: `
      text-sm font-medium
      text-[var(--color-text-secondary)] hover:text-[#D2691E]
    `,
    minimal: `
      text-sm
      text-[var(--color-text-tertiary)] hover:text-[#D2691E]
    `,
    filled: `
      text-sm font-medium
      px-3 py-1.5 rounded-lg
      bg-[#D2691E]/5 hover:bg-[#D2691E]/10
      text-[#D2691E]
      border border-[#D2691E]/10 hover:border-[#D2691E]/20
    `,
  };

  const iconWrapperStyles = {
    default: `
      w-8 h-8 rounded-xl flex items-center justify-center
      bg-[#D2691E]/8 border border-[#D2691E]/12
      group-hover:bg-[#D2691E]/12 group-hover:border-[#D2691E]/20
      group-hover:scale-105
      transition-all duration-300
    `,
    minimal: `
      flex items-center justify-center
    `,
    filled: `
      flex items-center justify-center
    `,
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {variant === "default" ? (
        <div className={iconWrapperStyles[variant]}>
          <ArrowLeft className="h-4 w-4 text-[#D2691E] group-hover:-translate-x-0.5 transition-transform duration-300" />
        </div>
      ) : (
        <ArrowLeft
          className={`h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-300 ${
            variant === "filled" ? "text-[#D2691E]" : ""
          }`}
        />
      )}
      {showLabel && (
        <span className="transition-colors duration-300">{displayLabel}</span>
      )}
    </button>
  );
}
