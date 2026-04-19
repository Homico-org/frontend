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
      backOrNavigate(router, "/portfolio");
    }
  };

  const baseStyles =
    "group inline-flex items-center gap-2 transition-all duration-300";

  const variantStyles = {
    default: `
      text-sm font-medium
      text-[var(--hm-fg-secondary)] hover:text-[var(--hm-brand-500)]
    `,
    minimal: `
      text-sm
      text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)]
    `,
    filled: `
      text-sm font-medium
      px-3 py-1.5 rounded-lg
      bg-[var(--hm-brand-500)]/5 hover:bg-[var(--hm-brand-500)]/10
      text-[var(--hm-brand-500)]
      border border-[var(--hm-brand-500)]/10 hover:border-[var(--hm-brand-500)]/20
    `,
  };

  const iconWrapperStyles = {
    default: `
      w-8 h-8 rounded-xl flex items-center justify-center
      bg-[var(--hm-brand-500)]/8 border border-[var(--hm-brand-500)]/12
      group-hover:bg-[var(--hm-brand-500)]/12 group-hover:border-[var(--hm-brand-500)]/20
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
          <ArrowLeft className="h-4 w-4 text-[var(--hm-brand-500)] group-hover:-translate-x-0.5 transition-transform duration-300" />
        </div>
      ) : (
        <ArrowLeft
          className={`h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-300 ${
            variant === "filled" ? "text-[var(--hm-brand-500)]" : ""
          }`}
        />
      )}
      {showLabel && (
        <span className="transition-colors duration-300">{displayLabel}</span>
      )}
    </button>
  );
}
