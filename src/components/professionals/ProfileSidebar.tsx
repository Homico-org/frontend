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
                ? "text-white shadow-lg shadow-[#C4735B]/25"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-gradient-to-r hover:from-[#C4735B]/5 hover:to-[#C4735B]/10 dark:hover:from-[#C4735B]/10 dark:hover:to-[#C4735B]/5"
              }
            `}
            style={isActive ? {
              background: "linear-gradient(135deg, #C4735B 0%, #B5624A 50%, #A85D4A 100%)",
            } : {}}
          >
            {/* Active glow effect */}
            {isActive && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#C4735B] to-[#A85D4A] blur-xl opacity-40 -z-10" />
            )}

            {/* Icon */}
            <span
              className={`transition-all duration-300 ${
                isActive
                  ? "text-white"
                  : "text-neutral-500 dark:text-neutral-400 group-hover:text-[#C4735B] group-hover:scale-110"
              }`}
            >
              {item.icon}
            </span>

            {/* Label */}
            <span className={`flex-1 text-left tracking-wide ${isActive ? "" : "group-hover:text-neutral-900 dark:group-hover:text-neutral-100"}`}>
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
                    : "!bg-neutral-100 dark:!bg-neutral-800 !text-neutral-600 dark:!text-neutral-300 group-hover:!bg-[#C4735B]/10 group-hover:!text-[#C4735B] group-hover:!border-[#C4735B]/20"
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
      icon: <FileText className="w-4 h-4" />,
      label: "About",
      labelKa: "შესახებ",
    },
    {
      key: "portfolio",
      icon: <FolderKanban className="w-4 h-4" />,
      label: "Portfolio",
      labelKa: "ნამუშევრები",
      count: portfolioCount,
    },
    {
      key: "reviews",
      icon: <MessageSquareQuote className="w-4 h-4" />,
      label: "Reviews",
      labelKa: "შეფასებები",
      count: reviewsCount,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100/80 dark:bg-neutral-800/50 rounded-2xl">
      {menuItems.map((item) => {
        const isActive = activeTab === item.key;

        return (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={`
              relative flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl
              font-semibold text-[11px] leading-tight transition-all duration-300 ease-out
              ${isActive
                ? "text-white shadow-lg shadow-[#C4735B]/30"
                : "text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50"
              }
            `}
            style={isActive ? {
              background: "linear-gradient(135deg, #C4735B 0%, #B5624A 50%, #A85D4A 100%)",
            } : {}}
          >
            <span className={`transition-all duration-300 ${isActive ? "text-white scale-110" : "text-neutral-500 dark:text-neutral-400"}`}>
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
                className={`absolute -top-0.5 -right-0.5 !min-w-[20px] !h-[20px] !px-1 !text-[10px] !font-bold transition-all ${
                  isActive
                    ? "!bg-white !text-[#C4735B] !border-white shadow-sm"
                    : "!bg-neutral-200 dark:!bg-neutral-700 !text-neutral-600 dark:!text-neutral-300"
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
