"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  titleKa?: string;
  description: string;
  descriptionKa?: string;
  actionLabel?: string;
  actionLabelKa?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: "simple" | "illustrated";
  size?: "sm" | "md" | "lg";
}

export default function EmptyState({
  icon: Icon,
  title,
  titleKa,
  description,
  descriptionKa,
  actionLabel,
  actionLabelKa,
  actionHref,
  onAction,
  size = "md",
}: EmptyStateProps) {
  const { locale } = useLanguage();

  const displayTitle = locale === "ka" && titleKa ? titleKa : title;
  const displayDescription = locale === "ka" && descriptionKa ? descriptionKa : description;
  const displayActionLabel = locale === "ka" && actionLabelKa ? actionLabelKa : actionLabel;

  const py = size === "sm" ? "py-8" : size === "lg" ? "py-16" : "py-12";

  const ActionButton = () => {
    if (!displayActionLabel) return null;
    const cls = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C4735B] hover:bg-[#B5624A] transition-colors";
    if (actionHref) return <Link href={actionHref} className={cls}>{displayActionLabel}</Link>;
    if (onAction) return <button onClick={onAction} className={cls}>{displayActionLabel}</button>;
    return null;
  };

  return (
    <div className={`flex flex-col items-center justify-center ${py} px-4 text-center`}>
      <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
      </div>
      <h3 className={`${size === "sm" ? "text-sm" : "text-base"} font-semibold text-neutral-900 dark:text-white mb-1`}>
        {displayTitle}
      </h3>
      <p className={`${size === "sm" ? "text-xs" : "text-sm"} text-neutral-500 dark:text-neutral-400 max-w-xs mb-4`}>
        {displayDescription}
      </p>
      <ActionButton />
    </div>
  );
}
