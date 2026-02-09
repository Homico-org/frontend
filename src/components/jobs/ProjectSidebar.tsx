"use client";

import { Badge } from "@/components/ui/badge";
import { ACCENT_COLOR as ACCENT } from "@/constants/theme";
import {
  BarChart3,
  FileText,
  FolderOpen,
  History,
  MessageCircle,
} from "lucide-react";
import React from "react";

import { useLanguage } from "@/contexts/LanguageContext";
export type ProjectSidebarTab = "details" | "chat" | "polls" | "resources" | "history";

interface ProjectSidebarProps {
  activeTab: ProjectSidebarTab;
  onTabChange: (tab: ProjectSidebarTab) => void;
  locale: string;
  unreadChatCount?: number;
  unreadPollsCount?: number;
  unreadResourcesCount?: number;
  isProjectStarted?: boolean;
  isCompleted?: boolean;
}

interface SidebarMenuItem {
  key: ProjectSidebarTab;
  icon: React.ReactNode;
  label: string;
  labelKa: string;
  badge?: number;
  disabled?: boolean;
}

export default function ProjectSidebar({
  activeTab,
  onTabChange,
  locale,
  unreadChatCount = 0,
  unreadPollsCount = 0,
  unreadResourcesCount = 0,
  isProjectStarted = true,
  isCompleted = false,
}: ProjectSidebarProps) {
  const { t } = useLanguage();
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
      disabled: !isProjectStarted || isCompleted,
    },
    {
      key: "polls",
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Polls",
      labelKa: "გამოკითხვები",
      badge: unreadPollsCount,
      disabled: !isProjectStarted || isCompleted,
    },
    {
      key: "resources",
      icon: <FolderOpen className="w-5 h-5" />,
      label: "Resources",
      labelKa: "მასალები",
      badge: unreadResourcesCount,
      disabled: !isProjectStarted || isCompleted,
    },
    {
      key: "history",
      icon: <History className="w-5 h-5" />,
      label: "History",
      labelKa: "ისტორია",
      disabled: !isProjectStarted,
    },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {menuItems.map((item) => {
        const isActive = activeTab === item.key;
        const isDisabled = item.disabled;

        return (
          <button
            key={item.key}
            onClick={() => !isDisabled && onTabChange(item.key)}
            disabled={isDisabled}
            className={`
              group relative flex items-center gap-3 px-4 py-3 rounded-xl
              font-medium text-sm transition-all duration-200
              ${isDisabled
                ? "opacity-50 cursor-not-allowed text-neutral-400 dark:text-neutral-500"
                : isActive
                  ? "text-white shadow-md"
                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }
            `}
            style={isActive && !isDisabled ? { backgroundColor: ACCENT } : {}}
          >
            {/* Active indicator */}
            {isActive && !isDisabled && (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                style={{ backgroundColor: "white" }}
              />
            )}

            {/* Icon */}
            <span
              className={`transition-colors ${
                isActive && !isDisabled
                  ? "text-white"
                  : isDisabled
                    ? ""
                    : `group-hover:text-[${ACCENT}]`
              }`}
              style={!isActive && !isDisabled ? { color: isActive ? "white" : undefined } : {}}
            >
              {item.icon}
            </span>

            {/* Label */}
            <span className="flex-1 text-left">
              {locale === "ka" ? item.labelKa : item.label}
            </span>

            {/* Badge */}
            {item.badge !== undefined && item.badge > 0 && !isDisabled && (
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

      {/* Helper text for disabled items */}
      {!isProjectStarted && (
        <p className="px-4 py-2 text-xs text-neutral-400 dark:text-neutral-500 italic">
          {t('job.chatPollsResourcesAvailableAfter')}
        </p>
      )}
    </nav>
  );
}

// Mobile version - horizontal scrollable tabs
export function ProjectSidebarMobile({
  activeTab,
  onTabChange,
  locale,
  unreadChatCount = 0,
  unreadPollsCount = 0,
  unreadResourcesCount = 0,
  isProjectStarted = true,
  isCompleted = false,
}: ProjectSidebarProps) {
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
      disabled: !isProjectStarted || isCompleted,
    },
    {
      key: "polls",
      icon: <BarChart3 className="w-4 h-4" />,
      label: "Polls",
      labelKa: "გამოკითხვები",
      badge: unreadPollsCount,
      disabled: !isProjectStarted || isCompleted,
    },
    {
      key: "resources",
      icon: <FolderOpen className="w-4 h-4" />,
      label: "Resources",
      labelKa: "მასალები",
      badge: unreadResourcesCount,
      disabled: !isProjectStarted || isCompleted,
    },
    {
      key: "history",
      icon: <History className="w-4 h-4" />,
      label: "History",
      labelKa: "ისტორია",
      disabled: !isProjectStarted,
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {menuItems.map((item) => {
        const isActive = activeTab === item.key;
        const isDisabled = item.disabled;

        return (
          <button
            key={item.key}
            onClick={() => !isDisabled && onTabChange(item.key)}
            disabled={isDisabled}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 rounded-full
              font-medium text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0
              ${isDisabled
                ? "opacity-40 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                : isActive
                  ? "text-white shadow-md"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }
            `}
            style={isActive && !isDisabled ? { backgroundColor: ACCENT } : {}}
          >
            {item.icon}
            <span>{locale === "ka" ? item.labelKa : item.label}</span>

            {/* Badge */}
            {item.badge !== undefined && item.badge > 0 && !isDisabled && (
              <Badge
                variant={isActive ? "secondary" : "danger"}
                size="xs"
                className={`!min-w-[18px] !h-[18px] !px-1 ${isActive ? "!bg-white/20 !text-white" : ""}`}
              >
                {item.badge > 9 ? "9+" : item.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
