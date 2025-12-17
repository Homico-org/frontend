"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import Button, { ButtonIcons } from "./Button";

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
        backgroundColor: "var(--color-bg-header)",
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
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#E07B4F] group-hover:scale-125 transition-transform duration-200"></span>
          </Link>

          <nav className="flex gap-4 items-center">
            {isLoading ? (
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-dark-card animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Post Job Button for Client and Pro Users */}
                {(user.role === "client" || user.role === "pro") && (
                  <>
                    {/* Mobile: Icon-only button */}
                    <Button
                      href="/post-job"
                      variant="primary"
                      size="sm"
                      icon={<ButtonIcons.Plus />}
                      className="sm:hidden !w-9 !h-9 !p-0 !gap-0"
                    >
                      <span className="sr-only">{locale === "ka" ? "განცხადება" : "Post Job"}</span>
                    </Button>
                    {/* Desktop: Full button */}
                    <Button
                      href="/post-job"
                      variant="primary"
                      size="md"
                      icon={<ButtonIcons.Plus />}
                      className="hidden sm:inline-flex"
                    >
                      {locale === "ka" ? "განცხადება" : "Post Job"}
                    </Button>
                  </>
                )}

                {/* Become Pro Button for Client Users - Hidden on mobile */}
                {user.role === "client" && (
                  <Link
                    href="/become-pro"
                    className="hidden sm:flex group items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.97] relative overflow-hidden"
                    style={{
                      transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                      backgroundColor: "#E07B4F",
                      color: "#ffffff",
                      boxShadow: "0 2px 8px rgba(210, 105, 30, 0.3)",
                    }}
                  >

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
                      className="absolute right-0 top-full mt-2 sm:mt-3 w-[calc(100vw-24px)] sm:w-72 max-w-[280px] sm:max-w-72 rounded-xl sm:rounded-2xl overflow-hidden z-[70] animate-scale-in max-h-[calc(100vh-80px)] overflow-y-auto"
                      style={{
                        background: 'linear-gradient(145deg, rgba(255, 253, 250, 0.95) 0%, rgba(255, 250, 245, 0.98) 100%)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(200, 114, 89, 0.15)',
                        boxShadow: '0 20px 40px -12px rgba(200, 114, 89, 0.2), 0 8px 16px -8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                      }}
                    >
                        {/* User Info Header - Terracotta gradient */}
                        <div
                          className="px-3 sm:px-5 py-3 sm:py-4 relative overflow-hidden"
                          style={{
                            background: "linear-gradient(135deg, #C87259 0%, #B86349 50%, #A85A42 100%)"
                          }}
                        >
                          {/* Decorative pattern overlay */}
                          <div
                            className="absolute inset-0 opacity-10"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='white'/%3E%3C/svg%3E")`,
                              backgroundSize: '20px 20px',
                            }}
                          />
                          <div className="flex items-center gap-2.5 sm:gap-3.5 relative z-10">
                            <div className="relative">
                              <Avatar
                                src={user.avatar}
                                name={user.name}
                                size="md"
                                rounded="xl"
                                className="w-10 h-10 sm:w-12 sm:h-12"
                                style={{
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255, 255, 255, 0.2)',
                                }}
                              />
                              {/* Online indicator */}
                              <div
                                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#C87259]"
                                style={{ background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-white truncate drop-shadow-sm">
                                {user.name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-white/80 truncate mb-1 sm:mb-1.5">
                                {user.email}
                              </p>
                              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                                {user.uid && (
                                  <span
                                    className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium text-white/90"
                                    style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(4px)' }}
                                  >
                                    ID: {user.uid}
                                  </span>
                                )}
                                <span
                                  className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold capitalize"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    color: '#B86349',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                  }}
                                >
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
                                className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200"
                                style={{ color: 'var(--color-text-secondary)' }}
                                onClick={() => setShowDropdown(false)}
                              >
                                <div
                                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 group-hover:scale-105"
                                  style={{
                                    background: 'rgba(200, 114, 89, 0.08)',
                                    border: '1px solid rgba(200, 114, 89, 0.1)',
                                  }}
                                >
                                  <svg
                                    className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-colors duration-200"
                                    style={{ color: '#C87259' }}
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
                                <span className="group-hover:text-[#C87259] transition-colors truncate">
                                  {t("menu.companyJobs")}
                                </span>
                              </Link>
                              <Link
                                href="/company/employees"
                                className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200"
                                style={{ color: 'var(--color-text-secondary)' }}
                                onClick={() => setShowDropdown(false)}
                              >
                                <div
                                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 group-hover:scale-105"
                                  style={{
                                    background: 'rgba(200, 114, 89, 0.08)',
                                    border: '1px solid rgba(200, 114, 89, 0.1)',
                                  }}
                                >
                                  <svg
                                    className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-colors duration-200"
                                    style={{ color: '#C87259' }}
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
                                <span className="group-hover:text-[#C87259] transition-colors truncate">
                                  {t("menu.team")}
                                </span>
                              </Link>
                              <Link
                                href="/company/jobs/new"
                                className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200"
                                onClick={() => setShowDropdown(false)}
                              >
                                <div
                                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 group-hover:scale-105"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(200, 114, 89, 0.15) 0%, rgba(200, 114, 89, 0.1) 100%)',
                                    border: '1px solid rgba(200, 114, 89, 0.2)',
                                  }}
                                >
                                  <svg
                                    className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
                                    style={{ color: '#C87259' }}
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
                                <span className="font-medium truncate" style={{ color: '#C87259' }}>
                                  {t("menu.createJob")}
                                </span>
                              </Link>
                            </>
                          )}

                          {/* Admin Menu Items - Only Panel */}
                          {user.role === "admin" && (
                            <Link
                              href="/admin"
                              className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200"
                              style={{ color: 'var(--color-text-secondary)' }}
                              onClick={() => setShowDropdown(false)}
                            >
                              <div
                                className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 group-hover:scale-105"
                                style={{
                                  background: 'rgba(200, 114, 89, 0.08)',
                                  border: '1px solid rgba(200, 114, 89, 0.1)',
                                }}
                              >
                                <svg
                                  className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
                                  style={{ color: '#C87259' }}
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
                              <span className="group-hover:text-[#C87259] transition-colors truncate">
                                პანელი
                              </span>
                            </Link>
                          )}

                          {/* Pro Menu Items */}
                          {user.role === "pro" && (
                            <>
                              {/* Premium Plans Link - Special styling */}
                              <Link
                                href="/pro/premium"
                                className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 mx-2 rounded-xl"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)',
                                  border: '1px solid rgba(139, 92, 246, 0.15)',
                                }}
                                onClick={() => setShowDropdown(false)}
                              >
                                <div
                                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 group-hover:scale-105"
                                  style={{
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                                  }}
                                >
                                  <svg
                                    className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3l7 4 7-4v11l-7 4-7-4V3z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v10" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold text-purple-700 dark:text-purple-400 truncate block">
                                    {locale === 'ka' ? 'პრემიუმ გეგმები' : 'Premium Plans'}
                                  </span>
                                  <span className="text-[10px] text-purple-600/70 dark:text-purple-400/70">
                                    {locale === 'ka' ? 'გაზარდე ხილვადობა' : 'Boost visibility'}
                                  </span>
                                </div>
                                <svg
                                  className="w-4 h-4 text-purple-500 group-hover:translate-x-0.5 transition-transform"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>

                              <Link
                                href="/pro/profile-setup"
                                className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200"
                                style={{ color: 'var(--color-text-secondary)' }}
                                onClick={() => setShowDropdown(false)}
                              >
                                <div
                                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 group-hover:scale-105"
                                  style={{
                                    background: 'rgba(200, 114, 89, 0.08)',
                                    border: '1px solid rgba(200, 114, 89, 0.1)',
                                  }}
                                >
                                  <svg
                                    className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
                                    style={{ color: '#C87259' }}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <span className="group-hover:text-[#C87259] transition-colors truncate">
                                  {locale === 'ka' ? 'პროფილის რედაქტირება' : 'Profile Setup'}
                                </span>
                              </Link>
                            </>
                          )}

                          {/* Common Settings Items - Divider only for non-admin or after admin panel */}
                          {(user.role === "company" ||
                            user.role === "admin" ||
                            user.role === "pro") && (
                            <div
                              className="my-1.5 sm:my-2 mx-3 sm:mx-4 h-px"
                              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(200, 114, 89, 0.2) 50%, transparent 100%)' }}
                            />
                          )}

                          <Link
                            href="/settings"
                            className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200"
                            style={{ color: 'var(--color-text-secondary)' }}
                            onClick={() => setShowDropdown(false)}
                          >
                            <div
                              className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 group-hover:scale-105"
                              style={{
                                background: 'rgba(200, 114, 89, 0.08)',
                                border: '1px solid rgba(200, 114, 89, 0.1)',
                              }}
                            >
                              <svg
                                className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
                                style={{ color: '#C87259' }}
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
                            <span className="group-hover:text-[#C87259] transition-colors truncate">
                              {t("nav.settings")}
                            </span>
                          </Link>

                          <Link
                            href="/notifications"
                            className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200"
                            style={{ color: 'var(--color-text-secondary)' }}
                            onClick={() => setShowDropdown(false)}
                          >
                            <div
                              className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 group-hover:scale-105 relative"
                              style={{
                                background: 'rgba(200, 114, 89, 0.08)',
                                border: '1px solid rgba(200, 114, 89, 0.1)',
                              }}
                            >
                              <svg
                                className="w-4 h-4 sm:w-[18px] sm:h-[18px]"
                                style={{ color: '#C87259' }}
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
                              {/* Notification dot */}
                              {unreadCount > 0 && (
                                <div
                                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                                  style={{ background: '#C87259', boxShadow: '0 0 0 2px rgba(255, 253, 250, 0.95)' }}
                                />
                              )}
                            </div>
                            <span className="group-hover:text-[#C87259] transition-colors truncate">
                              {t("menu.notifications")}
                            </span>
                            {unreadCount > 0 && (
                              <span
                                className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: 'linear-gradient(135deg, #C87259 0%, #B86349 100%)',
                                  color: 'white',
                                }}
                              >
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            )}
                          </Link>

                          <div
                            className="my-1.5 sm:my-2 mx-3 sm:mx-4 h-px"
                            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(200, 114, 89, 0.2) 50%, transparent 100%)' }}
                          />

                          <button
                            onClick={() => {
                              setShowDropdown(false);
                              logout();
                            }}
                            className="group flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <div
                              className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 group-hover:scale-105"
                              style={{
                                background: 'rgba(200, 114, 89, 0.08)',
                                border: '1px solid rgba(200, 114, 89, 0.1)',
                              }}
                            >
                              <svg
                                className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-colors"
                                style={{ color: '#C87259' }}
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
                            <span className="group-hover:text-[#C87259] transition-colors truncate">
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
                  className="bg-[#E07B4F]/[0.06] border border-[#E07B4F]/30 text-[#E07B4F] dark:text-[#E8956A] font-medium px-3 sm:px-4 py-2 rounded-full hover:bg-[#E07B4F]/10 hover:border-[#E07B4F]/50 transition-colors"
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
