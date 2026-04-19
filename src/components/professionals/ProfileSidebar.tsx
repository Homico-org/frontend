"use client";

import { Badge } from "@/components/ui/badge";
import { ACCENT_COLOR as ACCENT } from "@/constants/theme";
import {
  FileText,
  FolderKanban,
  MessageSquareQuote,
} from "lucide-react";
import React from "react";

export type ProfileSidebarTab = "about" | "portfolio" | "reviews";

interface ProfileSidebarProps {
  activeTab: ProfileSidebarTab;
  onTabChange: (tab: ProfileSidebarTab) => void;
  locale: string;
  portfolioCount?: number;
  reviewsCount?: number;
}

interface SidebarMenuItem {
  key: ProfileSidebarTab;
  icon: React.ReactNode;
  label: string;
  labelKa: string;
  count?: number;
}

export default function ProfileSidebar({
  activeTab,
  onTabChange,
  locale,
  portfolioCount = 0,
  reviewsCount = 0,
}: ProfileSidebarProps) {
  const menuItems: SidebarMenuItem[] = [
    {
      key: "about",
      icon: <FileText className="w-[18px] h-[18px]" />,
      label: "About",
      labelKa: "შესახებ",
    },
    {
      key: "portfolio",
      icon: <FolderKanban className="w-[18px] h-[18px]" />,
      label: "Portfolio",
      labelKa: "ნამუშევრები",
      count: portfolioCount,
    },
    {
      key: "reviews",
      icon: <MessageSquareQuote className="w-[18px] h-[18px]" />,
      label: "Reviews",
      labelKa: "შეფასებები",
      count: reviewsCount,
    },
  ];

  return (
    <nav className="flex flex-col gap-1.5 pt-2">
      {menuItems.map((item) => {
        const isActive = activeTab === item.key;

        return (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={`
              group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl
              font-medium text-[13px] transition-all duration-300 ease-out
              ${isActive
                ? "text-white shadow-lg shadow-[var(--hm-brand-500)]/25"
                : "text-[var(--hm-fg-secondary)] hover:bg-gradient-to-r hover:from-[var(--hm-brand-500)]/5 hover:to-[var(--hm-brand-500)]/10"
              }
            `}
            style={isActive ? {
              background: "linear-gradient(135deg, var(--hm-brand-500) 0%, var(--hm-brand-600) 50%, var(--hm-brand-700) 100%)",
            } : {}}
          >
            {/* Active glow effect */}
            {isActive && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--hm-brand-500)] to-[#A92B08] blur-xl opacity-40 -z-10" />
            )}

            {/* Icon */}
            <span
              className={`transition-all duration-300 ${
                isActive
                  ? "text-white"
                  : "text-[var(--hm-fg-muted)] group-hover:text-[var(--hm-brand-500)] group-hover:scale-110"
              }`}
            >
              {item.icon}
            </span>

            {/* Label */}
            <span className={`flex-1 text-left tracking-wide ${isActive ? "" : "group-hover:text-[var(--hm-fg-primary)]"}`}>
              {locale === "ka" ? item.labelKa : item.label}
            </span>

            {/* Count Badge */}
            {item.count !== undefined && item.count > 0 && (
              <Badge
                variant={isActive ? "secondary" : "outline"}
                size="xs"
                className={`!min-w-[22px] !h-[22px] !px-1.5 !text-[11px] !font-semibold transition-all ${
                  isActive
                    ? "!bg-white/25 !text-white !border-white/20"
                    : "!bg-[var(--hm-bg-tertiary)] !text-[var(--hm-fg-secondary)] group-hover:!bg-[var(--hm-brand-500)]/10 group-hover:!text-[var(--hm-brand-500)] group-hover:!border-[var(--hm-brand-500)]/20"
                }`}
              >
                {item.count > 99 ? "99+" : item.count}
              </Badge>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// Mobile version - premium segmented tabs
export function ProfileSidebarMobile({
  activeTab,
  onTabChange,
  locale,
  portfolioCount = 0,
  reviewsCount = 0,
}: ProfileSidebarProps) {
  const menuItems: SidebarMenuItem[] = [
    {
      key: "about",
      icon: <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
      label: "About",
      labelKa: "შესახებ",
    },
    {
      key: "portfolio",
      icon: <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
      label: "Portfolio",
      labelKa: "ნამუშევრები",
      count: portfolioCount,
    },
    {
      key: "reviews",
      icon: <MessageSquareQuote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
      label: "Reviews",
      labelKa: "შეფასებები",
      count: reviewsCount,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-0.5 sm:p-1 bg-neutral-100/50 rounded-xl sm:rounded-2xl">
      {menuItems.map((item) => {
        const isActive = activeTab === item.key;

        return (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={`
              relative flex flex-col items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl
              font-semibold text-[10px] sm:text-[11px] leading-tight transition-all duration-300 ease-out
              ${isActive
                ? "text-white shadow-lg shadow-[var(--hm-brand-500)]/30"
                : "text-[var(--hm-fg-secondary)] hover:bg-white/50"
              }
            `}
            style={isActive ? {
              background: "linear-gradient(135deg, var(--hm-brand-500) 0%, var(--hm-brand-600) 50%, var(--hm-brand-700) 100%)",
            } : {}}
          >
            <span className={`transition-all duration-300 ${isActive ? "text-white scale-110" : "text-[var(--hm-fg-muted)]"}`}>
              {item.icon}
            </span>
            <span className="text-center px-0.5 tracking-wide">
              {locale === "ka" ? item.labelKa : item.label}
            </span>

            {/* Count Badge */}
            {item.count !== undefined && item.count > 0 && (
              <Badge
                variant={isActive ? "secondary" : "outline"}
                size="xs"
                className={`absolute -top-0.5 -right-0.5 !min-w-[18px] sm:!min-w-[20px] !h-[18px] sm:!h-[20px] !px-1 !text-[9px] sm:!text-[10px] !font-bold transition-all ${
                  isActive
                    ? "!bg-white !text-[var(--hm-brand-500)] !border-white shadow-sm"
                    : "!bg-[var(--hm-n-200)] !text-[var(--hm-fg-secondary)]"
                }`}
              >
                {item.count > 9 ? "9+" : item.count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
