"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";

// EmptyState previously accepted a `titleKa` / `descriptionKa` /
// `actionLabelKa` side-channel that only worked for ka locale - ru
// users silently fell through to the en value. As of 2026-05 every
// caller passes pre-translated strings via `t("...")`, so the ka
// side-channel was deprecated and removed. Keep new copy strictly
// inside the i18n key chain; do NOT re-introduce the side-channel.

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: "simple" | "illustrated";
  size?: "sm" | "md" | "lg";
}

/**
 * Shared empty-state UI. Grey muted icons read as "something broke"
 * (per NN/g empty-state research) - so this component always renders
 * the icon inside a brand-accent gradient halo instead, framing the
 * state as "nothing yet, here's what to do" rather than an error.
 *
 * Sizes:
 *  - sm: compact, fits inside section bodies (uses w-10 halo)
 *  - md: default, full empty-block at the top level
 *  - lg: hero empty-state with the most breathing room
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  size = "md",
}: EmptyStateProps) {
  // No locale lookup needed - caller is responsible for passing
  // already-translated strings via t("..."). See header comment.
  const displayTitle = title;
  const displayDescription = description;
  const displayActionLabel = actionLabel;

  const sizeCfg = {
    sm: { py: "py-8", halo: "w-12 h-12", icon: "w-5 h-5", glow: "w-20 h-20", title: "text-base", desc: "text-xs" },
    md: { py: "py-12", halo: "w-14 h-14", icon: "w-6 h-6", glow: "w-24 h-24", title: "text-lg", desc: "text-sm" },
    lg: { py: "py-16", halo: "w-16 h-16", icon: "w-7 h-7", glow: "w-28 h-28", title: "text-xl", desc: "text-sm" },
  }[size];

  const ActionButton = () => {
    if (!displayActionLabel) return null;
    const cls =
      "inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:-translate-y-[1px]";
    const style = {
      background:
        "linear-gradient(180deg, var(--hm-brand-500) 0%, var(--hm-brand-600) 100%)",
      boxShadow:
        "0 4px 14px -2px rgba(239,78,36,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
    };
    if (actionHref)
      return (
        <Link href={actionHref} className={cls} style={style}>
          {displayActionLabel}
        </Link>
      );
    if (onAction)
      return (
        <button onClick={onAction} className={cls} style={style}>
          {displayActionLabel}
        </button>
      );
    return null;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center ${sizeCfg.py} px-4 text-center`}
    >
      {/* Icon halo - radial glow behind a gradient-filled circle. Same
          treatment as the pay/return success state, scaled down. Reads
          as "this is the empty state, not an error" at first glance. */}
      <div className="relative mb-4">
        <div
          className={`absolute inset-0 m-auto ${sizeCfg.glow} rounded-full blur-2xl opacity-60`}
          style={{
            background:
              "radial-gradient(circle, rgba(239,78,36,0.30) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className={`relative ${sizeCfg.halo} rounded-full flex items-center justify-center`}
          style={{
            background:
              "linear-gradient(135deg, rgba(239,78,36,0.20) 0%, rgba(239,78,36,0.06) 100%)",
            boxShadow: "inset 0 0 0 1px rgba(239,78,36,0.18)",
          }}
        >
          <Icon className={`${sizeCfg.icon} text-[var(--hm-brand-500)]`} />
        </div>
      </div>
      <h3
        className={`${sizeCfg.title} font-bold text-[var(--hm-fg-primary)] mb-1.5 tracking-tight`}
      >
        {displayTitle}
      </h3>
      <p
        className={`${sizeCfg.desc} text-[var(--hm-fg-muted)] max-w-sm mb-5 leading-relaxed`}
      >
        {displayDescription}
      </p>
      <ActionButton />
    </div>
  );
}
