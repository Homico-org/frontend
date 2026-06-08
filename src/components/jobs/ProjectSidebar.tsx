"use client";

import { Badge } from "@/components/ui/badge";
import { ACCENT_COLOR as ACCENT } from "@/constants/theme";
import {
  BarChart3,
  FileText,
  History,
  MessageCircle,
} from "lucide-react";
import React from "react";

import { useLanguage } from "@/contexts/LanguageContext";
export type ProjectSidebarTab = "details" | "chat" | "polls" | "history";

interface ProjectSidebarProps {
  activeTab: ProjectSidebarTab;
  onTabChange: (tab: ProjectSidebarTab) => void;
  locale: string;
  unreadChatCount?: number;
  unreadPollsCount?: number;
}

interface SidebarMenuItem {
  key: ProjectSidebarTab;
  icon: React.ReactNode;
  label: string;
  labelKa: string;
  badge?: number;
}

export default function ProjectSidebar({
  activeTab,
  onTabChange,
  unreadChatCount = 0,
  unreadPollsCount = 0,
}: ProjectSidebarProps) {
  const { pick } = useLanguage();
  const menuItems: SidebarMenuItem[] = [
    {
      key: "details",
      icon: <FileText className="w-5 h-5" />,
      label: "Details",
      labelKa: "დეტალები",
    },
    {
      key: "chat",
      icon: <MessageCircle className="w-5 h-5" />,
      label: "Chat",
      labelKa: "ჩატი",
      badge: unreadChatCount,
    },
    {
      key: "polls",
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Polls",
      labelKa: "გამოკითხვები",
      badge: unreadPollsCount,
    },
    {
      key: "history",
      icon: <History className="w-5 h-5" />,
      label: "History",
      labelKa: "ისტორია",
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
                : "text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]"
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
                isActive ? "text-white" : `group-hover:text-[${ACCENT}]`
              }`}
            >
              {item.icon}
            </span>

            {/* Label */}
            <span className="flex-1 text-left">
              {pick({ en: item.label, ka: item.labelKa })}
            </span>

            {/* Badge */}
            {item.badge !== undefined && item.badge > 0 && (
              <Badge
                variant={isActive ? "secondary" : "danger"}
                size="xs"
                className={`!min-w-[20px] !h-[20px] !px-1.5 ${isActive ? "!bg-white/20 !text-white" : ""}`}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// Mobile version - horizontal scrollable tabs
export function ProjectSidebarMobile({
  activeTab,
  onTabChange,
  unreadChatCount = 0,
  unreadPollsCount = 0,
}: ProjectSidebarProps) {
  const { pick } = useLanguage();
  const menuItems: SidebarMenuItem[] = [
    {
      key: "details",
      icon: <FileText className="w-4 h-4" />,
      label: "Details",
      labelKa: "დეტალები",
    },
    {
      key: "chat",
      icon: <MessageCircle className="w-4 h-4" />,
      label: "Chat",
      labelKa: "ჩატი",
      badge: unreadChatCount,
    },
    {
      key: "polls",
      icon: <BarChart3 className="w-4 h-4" />,
      label: "Polls",
      labelKa: "გამოკითხვები",
      badge: unreadPollsCount,
    },
    {
      key: "history",
      icon: <History className="w-4 h-4" />,
      label: "History",
      labelKa: "ისტორია",
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {menuItems.map((item) => {
        const isActive = activeTab === item.key;

        return (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 rounded-full
              font-medium text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0
              ${isActive
                ? "text-white shadow-md"
                : "bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-border)]"
              }
            `}
            style={isActive ? { backgroundColor: ACCENT } : {}}
          >
            {item.icon}
            <span>{pick({ en: item.label, ka: item.labelKa })}</span>

            {/* Badge */}
            {item.badge !== undefined && item.badge > 0 && (
              <Badge
                variant={isActive ? "secondary" : "danger"}
                size="xs"
                className={`!min-w-[18px] !h-[18px] !px-1 ${isActive ? "!bg-white/20 !text-white" : ""}`}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
