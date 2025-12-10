"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if on register page to redirect to browse after login
  const isOnRegisterPage = pathname === '/register';

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      // Use setTimeout to avoid immediate closure from the same click that opened it
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Handle ESC key to close dropdown
  const handleEscKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (showDropdown) {
      document.addEventListener("keydown", handleEscKey);
    }
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showDropdown, handleEscKey]);

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300"
      style={{
        backgroundColor: "var(--color-bg-primary-transparent)",
        borderColor: "var(--color-border-subtle)",
      }}
    >
      <div className="container-custom py-3 sm:py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/browse"
            className="group flex items-center gap-2 touch-manipulation"
          >
            <span
              className="text-xl sm:text-2xl font-serif font-semibold tracking-tight transition-colors duration-200"
              style={{ color: "var(--color-text-primary)" }}
            >
              {locale === "ka" ? "ჰომიკო" : "Homico"}
            </span>
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform duration-200"></span>
          </Link>

          <nav className="flex gap-4 items-center">
            {isLoading ? (
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-dark-card animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Post Job Button for Client and Pro Users */}
                {(user.role === "client" || user.role === "pro") && (
                  <Link
                    href="/post-job"
                    className="flex items-center justify-center gap-1.5 sm:gap-2 w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.97]"
                    style={{
                      backgroundColor: "var(--color-accent)",
                      color: "#ffffff",
                      boxShadow: "0 2px 8px var(--color-accent-soft)",
                    }}
                  >
                    <svg
                      className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="hidden sm:inline whitespace-nowrap">
                      {locale === "ka" ? "განცხადება" : "Post Job"}
                    </span>
                  </Link>
                )}

                {/* Become Pro Button for Client Users - Hidden on mobile */}
                {user.role === "client" && (
                  <Link
                    href="/become-pro"
                    className="hidden sm:flex group items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.97] relative overflow-hidden"
                    style={{
                      transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                      background: "linear-gradient(135deg, #0d6355 0%, #0a4f44 100%)",
                      color: "#ffffff",
                      boxShadow: "0 2px 8px rgba(13, 99, 85, 0.25), 0 1px 2px rgba(13, 99, 85, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {/* Subtle shine effect on hover */}
                    <span
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                        transform: "translateX(-100%)",
                        animation: "none",
                      }}
                    />

                    {/* Briefcase with arrow up icon - career growth */}
                    <svg
                      className="w-[18px] h-[18px] flex-shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <rect
                        x="2"
                        y="7"
                        width="20"
                        height="14"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path
                        d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 11v6M12 11l2.5 2.5M12 11l-2.5 2.5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-transform duration-300 origin-center group-hover:-translate-y-0.5"
                      />
                    </svg>

                    <span className="whitespace-nowrap relative z-10 tracking-wide">დასაქმდი</span>

                    {/* Subtle pulse indicator */}
                    <span className="relative flex h-2 w-2 ml-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white/60"></span>
                    </span>
                  </Link>
                )}

                {/* Notification Bell - Compact on mobile */}
                <Link
                  href="/notifications"
                  className="relative group flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-300"
                  style={{
                    background: "rgba(0, 0, 0, 0.03)",
                  }}
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300"
                    style={{ color: "var(--color-text-tertiary)" }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13.73 21a2 2 0 01-3.46 0"
                    />
                  </svg>
                  {/* Notification Badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 text-[9px] sm:text-[10px] font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg shadow-red-500/30 animate-pulse">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center hover:opacity-90 transition-opacity group touch-manipulation"
                  >
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="sm"
                      rounded="xl"
                      className="w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-neutral-100 dark:ring-dark-border group-hover:ring-primary-300 transition-all duration-300"
                    />
                  </button>

                  {showDropdown && (
                    <div
                      className="absolute right-0 top-full mt-2 sm:mt-3 w-[calc(100vw-24px)] sm:w-72 max-w-[280px] sm:max-w-72 bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-luxury dark:shadow-none overflow-hidden z-[70] animate-scale-in max-h-[calc(100vh-80px)] overflow-y-auto"
                    >
                        {/* User Info Header */}
                        <div
                          className="px-3 sm:px-5 py-3 sm:py-4"
                          style={{
                            background: "linear-gradient(135deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 85%, #000) 100%)"
                          }}
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3.5">
                            <Avatar
                              src={user.avatar}
                              name={user.name}
                              size="md"
                              rounded="xl"
                              className="ring-2 ring-white/20 w-10 h-10 sm:w-12 sm:h-12"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-white truncate">
                                {user.name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-white/70 truncate mb-1 sm:mb-1.5">
                                {user.email}
                              </p>
                              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                                {user.uid && (
                                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-white/10 text-white/80">
                                    ID: {user.uid}
                                  </span>
                                )}
                                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-primary-400/20 text-primary-300 capitalize">
                                  {user.role === "pro"
                                    ? "პრო"
                                    : user.role === "client"
                                      ? "მაძიებელი"
                                      : user.role === "company"
                                        ? "კომპანია"
                                        : user.role === "admin"
                                          ? "ადმინი"
                                          : user.role}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1.5 sm:py-2">
                          {/* Company Menu Items */}
                          {user.role === "company" && (
                            <>
                              <Link
                                href="/company/jobs"
                                className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                                onClick={() => setShowDropdown(false)}
                              >
                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors flex-shrink-0">
                                  {/* Building with briefcase icon */}
                                  <svg
                                    className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M3 21h18M9 7h1M9 11h1M14 7h1M14 11h1M9 21v-4h6v4"
                                    />
                                  </svg>
                                </div>
                                <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors truncate">
                                  {t("menu.companyJobs")}
                                </span>
                              </Link>
                              <Link
                                href="/company/employees"
                                className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                                onClick={() => setShowDropdown(false)}
                              >
                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors flex-shrink-0">
                                  {/* Team with org chart icon */}
                                  <svg
                                    className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                  >
                                    <circle
                                      cx="12"
                                      cy="6"
                                      r="3"
                                      strokeWidth={1.5}
                                    />
                                    <circle
                                      cx="5"
                                      cy="17"
                                      r="2.5"
                                      strokeWidth={1.5}
                                    />
                                    <circle
                                      cx="19"
                                      cy="17"
                                      r="2.5"
                                      strokeWidth={1.5}
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeWidth={1.5}
                                      d="M12 9v3M12 12H5v2.5M12 12h7v2.5"
                                    />
                                  </svg>
                                </div>
                                <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors truncate">
                                  {t("menu.team")}
                                </span>
                              </Link>
                              <Link
                                href="/company/jobs/new"
                                className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                                onClick={() => setShowDropdown(false)}
                              >
                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-primary-400/10 flex items-center justify-center group-hover:bg-primary-400/20 transition-colors flex-shrink-0">
                                  {/* Plus in circle icon */}
                                  <svg
                                    className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-forest-800 dark:text-primary-400"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                  >
                                    <circle
                                      cx="12"
                                      cy="12"
                                      r="9"
                                      strokeWidth={1.5}
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeWidth={2}
                                      d="M12 8v8M8 12h8"
                                    />
                                  </svg>
                                </div>
                                <span className="text-forest-800 dark:text-primary-400 font-medium truncate">
                                  {t("menu.createJob")}
                                </span>
                              </Link>
                            </>
                          )}

                          {/* Admin Menu Items - Only Panel */}
                          {user.role === "admin" && (
                            <Link
                              href="/admin"
                              className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors flex-shrink-0">
                                {/* Dashboard grid icon */}
                                <svg
                                  className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <rect
                                    x="3"
                                    y="3"
                                    width="7"
                                    height="7"
                                    rx="1.5"
                                    strokeWidth={1.5}
                                  />
                                  <rect
                                    x="14"
                                    y="3"
                                    width="7"
                                    height="7"
                                    rx="1.5"
                                    strokeWidth={1.5}
                                  />
                                  <rect
                                    x="3"
                                    y="14"
                                    width="7"
                                    height="7"
                                    rx="1.5"
                                    strokeWidth={1.5}
                                  />
                                  <rect
                                    x="14"
                                    y="14"
                                    width="7"
                                    height="7"
                                    rx="1.5"
                                    strokeWidth={1.5}
                                  />
                                </svg>
                              </div>
                              <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors truncate">
                                პანელი
                              </span>
                            </Link>
                          )}

                          {/* Common Settings Items - Divider only for non-admin or after admin panel */}
                          {(user.role === "company" ||
                            user.role === "admin") && (
                            <div className="border-t border-neutral-100 dark:border-dark-border my-1.5 sm:my-2 mx-3 sm:mx-4"></div>
                          )}

                          <Link
                            href="/settings"
                            className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors flex-shrink-0">
                              {/* Sliders/settings icon */}
                              <svg
                                className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeWidth={1.5}
                                  d="M4 6h6M14 6h6M4 12h10M18 12h2M4 18h2M10 18h10"
                                />
                                <circle
                                  cx="12"
                                  cy="6"
                                  r="2"
                                  strokeWidth={1.5}
                                />
                                <circle
                                  cx="16"
                                  cy="12"
                                  r="2"
                                  strokeWidth={1.5}
                                />
                                <circle
                                  cx="8"
                                  cy="18"
                                  r="2"
                                  strokeWidth={1.5}
                                />
                              </svg>
                            </div>
                            <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors truncate">
                              {t("nav.settings")}
                            </span>
                          </Link>

                          <Link
                            href="/notifications"
                            className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors flex-shrink-0">
                              {/* Bell with badge icon */}
                              <svg
                                className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M13.73 21a2 2 0 01-3.46 0"
                                />
                                <circle
                                  cx="18"
                                  cy="5"
                                  r="2.5"
                                  fill="currentColor"
                                  stroke="none"
                                  className="text-primary-400"
                                />
                              </svg>
                            </div>
                            <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors truncate">
                              {t("menu.notifications")}
                            </span>
                          </Link>

                          <div className="border-t border-neutral-100 dark:border-dark-border my-1.5 sm:my-2 mx-3 sm:mx-4"></div>

                          <button
                            onClick={() => {
                              setShowDropdown(false);
                              logout();
                            }}
                            className="group flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-terracotta-50 dark:hover:bg-terracotta-500/10 transition-colors"
                          >
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-terracotta-100 dark:group-hover:bg-terracotta-500/20 transition-colors flex-shrink-0">
                              {/* Door exit icon */}
                              <svg
                                className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-terracotta-600 dark:group-hover:text-terracotta-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.75}
                                  d="M16 17l5-5-5-5"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeWidth={1.75}
                                  d="M21 12H9"
                                />
                              </svg>
                            </div>
                            <span className="group-hover:text-terracotta-600 dark:group-hover:text-terracotta-400 transition-colors truncate">
                              {t("nav.signOut")}
                            </span>
                          </button>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => openLoginModal(isOnRegisterPage ? '/browse' : undefined)}
                  className="font-medium transition-colors px-3 sm:px-4 py-2 text-sm sm:text-base touch-manipulation"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {t("nav.login")}
                </button>
                <Link
                  href="/register"
                  className="bg-emerald-500/[0.06] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium p-5 px-3 sm:px-4 py-2 rounded-full hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-colors"
                >
                  <span className="relative z-10 tracking-wide">
                    {t("nav.signUp")}
                  </span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
