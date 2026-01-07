"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { ACCENT_COLOR } from "@/constants/theme";

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
  variant = "illustrated",
  size = "md",
}: EmptyStateProps) {
  const { locale } = useLanguage();

  const displayTitle = locale === "ka" && titleKa ? titleKa : title;
  const displayDescription = locale === "ka" && descriptionKa ? descriptionKa : description;
  const displayActionLabel = locale === "ka" && actionLabelKa ? actionLabelKa : actionLabel;

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "py-12 px-4",
      iconContainer: "w-16 h-16 rounded-xl",
      iconSize: "w-7 h-7",
      title: "text-base",
      description: "text-sm max-w-xs",
      button: "px-4 py-2 text-sm",
      floatingDot1: "w-4 h-4 -top-1 -right-1",
      floatingDot2: "w-3 h-3 -bottom-1 -left-2",
    },
    md: {
      container: "py-16 px-4",
      iconContainer: "w-24 h-24 rounded-2xl",
      iconSize: "w-10 h-10",
      title: "text-lg",
      description: "text-sm max-w-sm",
      button: "px-5 py-2.5 text-sm",
      floatingDot1: "w-5 h-5 -top-1.5 -right-1.5",
      floatingDot2: "w-3.5 h-3.5 -bottom-1 -left-2.5",
    },
    lg: {
      container: "py-24 px-4",
      iconContainer: "w-32 h-32 rounded-3xl",
      iconSize: "w-12 h-12",
      title: "text-xl",
      description: "text-base max-w-md",
      button: "px-6 py-3 text-sm",
      floatingDot1: "w-6 h-6 -top-2 -right-2",
      floatingDot2: "w-4 h-4 -bottom-1 -left-3",
    },
  };

  const config = sizeConfig[size];

  const ActionButton = () => {
    if (!displayActionLabel) return null;

    const buttonClasses = `inline-flex items-center justify-center ${config.button} font-medium text-white rounded-xl transition-all duration-200 hover:opacity-90`;
    const buttonStyle = { backgroundColor: ACCENT_COLOR };

    if (actionHref) {
      return (
        <Link href={actionHref} className={buttonClasses} style={buttonStyle}>
          {displayActionLabel}
        </Link>
      );
    }

    if (onAction) {
      return (
        <button onClick={onAction} className={buttonClasses} style={buttonStyle}>
          {displayActionLabel}
        </button>
      );
    }

    return null;
  };

  // Simple variant - just icon and text
  if (variant === "simple") {
    return (
      <div className={`flex flex-col items-center justify-center ${config.container} text-center`}>
        <div
          className={`${config.iconContainer} flex items-center justify-center mb-4`}
          style={{ backgroundColor: `${ACCENT_COLOR}10` }}
        >
          <Icon className={`${config.iconSize}`} style={{ color: ACCENT_COLOR }} />
        </div>
        <h3 className={`${config.title} font-semibold text-neutral-900 dark:text-white mb-2`}>
          {displayTitle}
        </h3>
        <p className={`${config.description} text-neutral-500 dark:text-neutral-400 mb-6`}>
          {displayDescription}
        </p>
        <ActionButton />
      </div>
    );
  }

  // Illustrated variant - with floating elements
  return (
    <div className={`flex flex-col items-center justify-center ${config.container}`}>
      {/* Illustration container */}
      <div className="relative mb-6">
        {/* Main icon container with gradient background */}
        <div
          className={`${config.iconContainer} flex items-center justify-center relative overflow-hidden -rotate-3`}
          style={{
            background: `linear-gradient(135deg, ${ACCENT_COLOR}15, ${ACCENT_COLOR}05)`,
          }}
        >
          {/* Abstract decorative shapes */}
          <div
            className="absolute top-3 left-3 w-6 h-6 rounded-lg rotate-12 opacity-30"
            style={{ backgroundColor: ACCENT_COLOR }}
          />
          <div
            className="absolute bottom-4 right-3 w-4 h-4 rounded-full opacity-20"
            style={{ backgroundColor: ACCENT_COLOR }}
          />

          {/* Main icon */}
          <Icon
            className={`${config.iconSize} relative z-10`}
            style={{ color: `${ACCENT_COLOR}80` }}
          />
        </div>

        {/* Floating decorative dots */}
        <div
          className={`absolute ${config.floatingDot1} rounded-full animate-pulse`}
          style={{ backgroundColor: `${ACCENT_COLOR}25` }}
        />
        <div
          className={`absolute ${config.floatingDot2} rounded-full animate-pulse`}
          style={{
            backgroundColor: `${ACCENT_COLOR}15`,
            animationDelay: "0.5s",
          }}
        />
      </div>

      {/* Text content */}
      <h3 className={`${config.title} font-semibold text-neutral-900 dark:text-white mb-2 text-center`}>
        {displayTitle}
      </h3>
      <p className={`${config.description} text-neutral-500 dark:text-neutral-400 text-center mb-6`}>
        {displayDescription}
      </p>

      <ActionButton />
    </div>
  );
}
