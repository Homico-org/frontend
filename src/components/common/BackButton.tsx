"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { backOrNavigate } from "@/utils/navigationUtils";
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
  const { t, locale } = useLanguage();

  const defaultLabel = t('common.back');
  const displayLabel = label || defaultLabel;

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      backOrNavigate(router, "/browse");
    }
  };

  const baseStyles =
    "group inline-flex items-center gap-2 transition-all duration-300";

  const variantStyles = {
    default: `
      text-sm font-medium
      text-[var(--color-text-secondary)] hover:text-[#E07B4F]
    `,
    minimal: `
      text-sm
      text-[var(--color-text-tertiary)] hover:text-[#E07B4F]
    `,
    filled: `
      text-sm font-medium
      px-3 py-1.5 rounded-lg
      bg-[#E07B4F]/5 hover:bg-[#E07B4F]/10
      text-[#E07B4F]
      border border-[#E07B4F]/10 hover:border-[#E07B4F]/20
    `,
  };

  const iconWrapperStyles = {
    default: `
      w-8 h-8 rounded-xl flex items-center justify-center
      bg-[#E07B4F]/8 border border-[#E07B4F]/12
      group-hover:bg-[#E07B4F]/12 group-hover:border-[#E07B4F]/20
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
          <ArrowLeft className="h-4 w-4 text-[#E07B4F] group-hover:-translate-x-0.5 transition-transform duration-300" />
        </div>
      ) : (
        <ArrowLeft
          className={`h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-300 ${
            variant === "filled" ? "text-[#E07B4F]" : ""
          }`}
        />
      )}
      {showLabel && (
        <span className="transition-colors duration-300">{displayLabel}</span>
      )}
    </button>
  );
}
