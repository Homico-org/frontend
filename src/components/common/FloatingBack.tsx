"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { backOrNavigate, defaultBackFallback } from "@/utils/navigationUtils";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FloatingBackProps {
  /**
   * Pixels of scroll before the chip appears. Default 400 - past
   * one viewport on a phone, well past the page header on desktop.
   */
  threshold?: number;
  /**
   * Explicit href. Mirrors `BackButton.href` - takes precedence over
   * the role-aware fallback when set.
   */
  href?: string;
  /**
   * Where to send the user if there's no in-app history. Defaults to
   * `defaultBackFallback(user)`.
   */
  fallbackHref?: string;
  /**
   * Hide the chip entirely. Useful for pages that already render
   * their own sticky back affordance (e.g. job-detail's compact
   * status bar) so we don't double up.
   */
  disabled?: boolean;
}

/**
 * Tiny back chip that fades in once the user has scrolled past
 * `threshold`. Sits in the bottom-left corner above the mobile
 * bottom-nav (or pinned to the viewport corner on desktop) so users
 * on long detail pages don't have to scroll back up to find the
 * header back arrow.
 *
 * Render once at the top of any long page that's worth the chip
 * (job detail, professional detail, settings sub-pages, etc.).
 */
export default function FloatingBack({
  threshold = 400,
  href,
  fallbackHref,
  disabled,
}: FloatingBackProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setVisible(window.scrollY > threshold);
    };

    // Set initial state synchronously so SSR -> client hydration
    // doesn't flash the chip in the wrong state.
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [disabled, threshold]);

  if (disabled) return null;

  const handleClick = () => {
    if (href) {
      router.push(href);
      return;
    }
    const fallback = fallbackHref ?? defaultBackFallback(user);
    backOrNavigate(router, fallback);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("common.back")}
      // Bottom-left so it never interferes with the chat / feedback
      // FABs anchored bottom-right. On mobile, lifted above the
      // 58px bottom-nav + safe-area inset. On desktop, sits in the
      // corner of the viewport.
      className={`fixed left-3 lg:left-6 z-40 flex items-center gap-1.5 px-3 h-10 rounded-full bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)] shadow-lg text-sm font-medium text-[var(--hm-fg-secondary)] hover:text-[var(--hm-brand-500)] hover:border-[var(--hm-brand-500)]/40 transition-all duration-200 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-2 pointer-events-none"
      }`}
      style={{
        bottom: "calc(58px + env(safe-area-inset-bottom) + 16px)",
      }}
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="hidden sm:inline">{t("common.back")}</span>
    </button>
  );
}
