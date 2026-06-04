"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { backOrNavigate, defaultBackFallback } from "@/utils/navigationUtils";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  /** Custom href to navigate to instead of going back */
  href?: string;
  /**
   * Custom click handler. Takes precedence over `href` / `fallbackHref`.
   * Use for step-back actions inside multi-step flows where back is
   * a state toggle, not a navigation.
   */
  onClick?: () => void;
  /**
   * Path used if `href`/`onClick` are not provided and there's no in-app
   * history to go back to. Defaults to a role-aware home (`/admin`,
   * `/my-space`, `/professionals`, or `/` for logged-out users).
   */
  fallbackHref?: string;
  /** Custom label (defaults to "Back" / "უკან") */
  label?: string;
  /** Whether to show the label text */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /**
   * Button variant style.
   * - `minimal` (recommended): discreet text + arrow, no chip
   * - `filled`: brand-tinted pill for CTA-style back actions
   * - `default` (legacy): boxed icon chip. New code should use `minimal`.
   */
  variant?: "default" | "minimal" | "filled";
}

export default function BackButton({
  href,
  onClick,
  fallbackHref,
  label,
  showLabel = true,
  className = "",
  variant = "default",
}: BackButtonProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();

  const displayLabel = label || t("common.back");

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (href) {
      router.push(href);
      return;
    }
    const fallback = fallbackHref ?? defaultBackFallback(user);
    backOrNavigate(router, fallback);
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
      type="button"
      onClick={handleClick}
      aria-label={displayLabel}
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
