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
      icon: <FileText className="w-5 h-5" />,
      label: "About",
      labelKa: "შესახებ",
    },
    {
      key: "portfolio",
      icon: <FolderKanban className="w-5 h-5" />,
      label: "Portfolio",
      labelKa: "ნამუშევრები",
      count: portfolioCount,
    },
    {
      key: "reviews",
      icon: <MessageSquareQuote className="w-5 h-5" />,
      label: "Reviews",
      labelKa: "შეფასებები",
      count: reviewsCount,
    },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {menuItems.map((item) => {
        const isActive = activeTab === item.key;

        return (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={`
              group relative flex items-center gap-3 px-4 py-3 rounded-xl
              font-medium text-sm transition-all duration-200
              ${isActive
                ? "text-white shadow-md"
                : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }
            `}
            style={isActive ? { backgroundColor: ACCENT } : {}}
          >
            {/* Active indicator */}
            {isActive && (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                style={{ backgroundColor: "white" }}
              />
            )}

            {/* Icon */}
            <span
              className={`transition-colors ${
                isActive
                  ? "text-white"
                  : `group-hover:text-[${ACCENT}]`
              }`}
            >
              {item.icon}
            </span>

            {/* Label */}
            <span className="flex-1 text-left">
              {locale === "ka" ? item.labelKa : item.label}
            </span>

            {/* Count Badge */}
            {item.count !== undefined && item.count > 0 && (
              <Badge
                variant={isActive ? "secondary" : "outline"}
                size="xs"
                className={`!min-w-[20px] !h-[20px] !px-1.5 ${isActive ? "!bg-white/20 !text-white" : ""}`}
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

// Mobile version - wrapped segmented tabs (no horizontal scroll)
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
    <div className="grid grid-cols-3 gap-2">
      {menuItems.map((item) => {
        const isActive = activeTab === item.key;

        return (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={`
              relative flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-2xl
              font-semibold text-[12px] leading-tight transition-all duration-200
              ${isActive
                ? "text-white shadow-md"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }
            `}
            style={isActive ? { backgroundColor: ACCENT } : {}}
          >
            <span className={`${isActive ? "text-white" : "text-neutral-600 dark:text-neutral-300"}`}>
              {item.icon}
            </span>
            <span className="text-center px-1">
              {locale === "ka" ? item.labelKa : item.label}
            </span>

            {/* Count Badge */}
            {item.count !== undefined && item.count > 0 && (
              <Badge
                variant={isActive ? "secondary" : "outline"}
                size="xs"
                className={`absolute -top-1 -right-1 !min-w-[18px] !h-[18px] !px-1 ${isActive ? "!bg-white/20 !text-white !border-white/20" : ""}`}
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
