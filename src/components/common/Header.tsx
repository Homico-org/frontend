"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { CountBadge } from "@/components/ui/badge";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { Bell, Briefcase, Building2, ChevronRight, ExternalLink, LayoutGrid, LogIn, LogOut, Menu, Plus, Search, Shield, SlidersHorizontal, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/hooks/useTracker";
import Avatar from "./Avatar";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";

export default function Header({ fixed = true }: { fixed?: boolean }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { flatCategories } = useCategories();
  const { t, pick } = useLanguage();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(
    () => setShowDropdown(false),
    showDropdown,
  );
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Check active routes for navigation highlighting
  const isNotificationsActive = pathname === "/notifications";

  const homeHref = !isAuthenticated
    ? "/"
    : user?.role === "pro" || user?.role === "admin"
      ? "/jobs"
      : "/portfolio";

  // Helper to get subcategory name from flat categories
  const getSubcategoryDisplayName = useCallback(
    (key: string): string => {
      const item = flatCategories.find(
        (c) =>
          c.key === key &&
          (c.type === "subcategory" || c.type === "subsubcategory"),
      );
      if (!item) return key;
      return pick({ en: item.name, ka: item.nameKa });
    },
    [flatCategories, pick],
  );

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileMenu]);

  // Handle ESC key to close dropdown and mobile menu
  const handleEscKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
      setShowMobileMenu(false);
    }
  }, []);

  useEffect(() => {
    if (showDropdown || showMobileMenu) {
      document.addEventListener("keydown", handleEscKey);
    }
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showDropdown, showMobileMenu, handleEscKey]);

  return (
    <header className={`${fixed ? "fixed top-0 left-0 right-0" : "relative"} z-50 h-14`} style={{ borderBottom: '1px solid var(--hm-border)', backgroundColor: 'var(--hm-bg-elevated)' }}>
      <div className="h-full max-w-[1800px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Wordmark */}
        <Link href={homeHref} className="flex items-center flex-shrink-0">
          <span className="text-[22px] font-semibold tracking-[-0.02em]" style={{ fontFamily: 'var(--hm-font-display)', color: 'var(--hm-fg-primary)' }}>
            Homico
          </span>
        </Link>

        {/* Right side - Actions + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0">
          {/* Theme + Language - hidden on mobile when logged out (shown in burger menu) */}
          <div className={!isAuthenticated ? "hidden sm:flex items-center gap-1.5 sm:gap-2" : "flex items-center gap-1.5 sm:gap-2"}>
            <ThemeToggle />
            <LanguageSelector variant="icon" />
          </div>

          {isLoading ? (
            <Skeleton className="w-9 h-9 rounded-xl" />
          ) : isAuthenticated && user ? (
            <>
              {/* Notification Bell */}
              <Link
                href="/notifications"
                onClick={() => trackEvent('nav_click', 'notifications')}
                className="relative flex items-center justify-center w-9 h-9 transition-colors hover:bg-[var(--hm-bg-tertiary)]"
                style={isNotificationsActive ? { color: 'var(--hm-brand-500)' } : { color: 'var(--hm-fg-secondary)' }}
              >
                <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />
                <CountBadge
                  count={unreadCount}
                  className="absolute -top-1.5 -right-1.5 ring-2 ring-[var(--hm-bg-elevated)]"
                />
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-0 hover:bg-transparent"
                >
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    size="sm"
                    rounded="xl"
                    className="w-9 h-9 ring-2 ring-[var(--hm-border)] hover:ring-[var(--hm-border-strong)] transition-all duration-300"
                  />
                </Button>

                {showDropdown && (
                  <div
                    className="absolute right-0 top-full mt-2 w-72 rounded-xl overflow-hidden z-[70] animate-scale-in"
                    style={{
                      backgroundColor: 'var(--hm-bg-elevated)',
                      border: '1px solid var(--hm-border)',
                      boxShadow: 'var(--hm-shadow-lg)',
                    }}
                  >
                    {/* User Info Header */}
                    {user.role === "pro" ? (
                      <Link
                        href={`/professionals/${user.id}`}
                        className="block px-4 py-3 relative overflow-hidden hover:opacity-90 transition-opacity"
                        style={{
                          background: 'linear-gradient(135deg, var(--hm-brand-500) 0%, var(--hm-brand-700) 100%)',
                        }}
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <Avatar
                            src={user.avatar}
                            name={user.name}
                            size="md"
                            rounded="xl"
                            className="w-11 h-11"
                            style={{
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-white truncate">
                                {user.name}
                              </p>
                              <ExternalLink className="w-3 h-3 text-white/70" />
                            </div>
                            <p className="text-xs text-white/80 truncate">
                              {user.email}
                            </p>
                            {user.selectedSubcategories &&
                              null /* category badges removed from dropdown */}
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div
                        className="px-4 py-3 relative overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, var(--hm-brand-500) 0%, var(--hm-brand-700) 100%)',
                        }}
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <Avatar
                            src={user.avatar}
                            name={user.name}
                            size="md"
                            rounded="xl"
                            className="w-11 h-11"
                            style={{
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-white/80 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Menu Items */}
                    <div className="py-2">
                      {/* Pro-specific items */}
                      {user.role === "pro" && (
                        <>
                          {/* Premium Plans - dev only for now */}
                          {process.env.NODE_ENV === "development" && (
                            <Link
                              href="/pro/premium"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 mx-2 rounded-xl"
                              style={{
                                background: `linear-gradient(135deg, ${ACCENT_COLOR}12 0%, ${ACCENT_COLOR}08 100%)`,
                                border: `1px solid ${ACCENT_COLOR}25`,
                              }}
                              onClick={() => setShowDropdown(false)}
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                  background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #D13C14 100%)`,
                                }}
                              >
                                <Shield className="w-4 h-4 text-white" strokeWidth={1.5} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span
                                  className="font-semibold block"
                                  style={{ color: ACCENT_COLOR }}
                                >
                                  {t("header.premiumPlans")}
                                </span>
                                <span
                                  className="text-[10px]"
                                  style={{ color: `${ACCENT_COLOR}99` }}
                                >
                                  {t("header.boostVisibility")}
                                </span>
                              </div>
                            </Link>
                          )}
                        </>
                      )}

                      {/* Client-specific items */}
                      {user.role === "client" && (
                        <Link
                          href="/become-pro"
                          className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 mx-2 rounded-xl"
                          style={{
                            background: `linear-gradient(135deg, ${ACCENT_COLOR}15 0%, ${ACCENT_COLOR}08 100%)`,
                            border: `1px solid ${ACCENT_COLOR}20`,
                          }}
                          onClick={() => setShowDropdown(false)}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: ACCENT_COLOR }}
                          >
                            <Briefcase className="w-4 h-4 text-white" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span
                              className="font-semibold block"
                              style={{ color: ACCENT_COLOR }}
                            >
                              {t("header.becomePro")}
                            </span>
                            <span className="text-[10px] text-[var(--hm-fg-muted)]">
                              {t("header.startEarning")}
                            </span>
                          </div>
                        </Link>
                      )}

                      {/* Admin panel */}
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          className="group flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)] transition-all duration-200"
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--hm-bg-tertiary)]">
                            <LayoutGrid
                              className="w-4 h-4"
                              style={{ color: ACCENT_COLOR }}
                              strokeWidth={1.5}
                            />
                          </div>
                          <span>{t("header.adminPanel")}</span>
                        </Link>
                      )}

                      {/* Settings */}
                      <Link
                        href="/settings"
                        className="group flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)] transition-all duration-200"
                        onClick={() => { setShowDropdown(false); trackEvent('nav_click', 'settings'); }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--hm-bg-tertiary)]">
                          <SlidersHorizontal
                            className="w-4 h-4"
                            style={{ color: ACCENT_COLOR }}
                            strokeWidth={1.5}
                          />
                        </div>
                        <span>{t("common.settings")}</span>
                      </Link>

                      <div className="my-2 mx-4 h-px bg-[var(--hm-border-subtle)]" />

                      {/* Logout */}
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="group flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)] justify-start h-auto rounded-none"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--hm-bg-tertiary)]">
                          <LogOut
                            className="w-4 h-4"
                            style={{ color: ACCENT_COLOR }}
                            strokeWidth={1.5}
                          />
                        </div>
                        <span>{t("header.signOut")}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Desktop: Login/Register buttons with text */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { openLoginModal(); trackEvent('nav_click', 'login'); }}
                >
                  {t("common.login")}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/register" onClick={() => trackEvent('nav_click', 'register')}>{t("header.signUp")}</Link>
                </Button>
              </div>

              {/* Tablet: Icon buttons */}
              <div className="hidden sm:flex md:hidden items-center gap-1">
                <Button
                  variant="secondary"
                  size="icon-sm"
                  onClick={() => { openLoginModal(); trackEvent('nav_click', 'login'); }}
                  title={t("common.login")}
                >
                  <LogIn className="w-4 h-4" />
                </Button>
                <Button size="icon-sm" asChild title={t("header.signUp")}>
                  <Link href="/register" onClick={() => trackEvent('nav_click', 'register')}>
                    <UserPlus className="w-4 h-4" />
                  </Link>
                </Button>
              </div>

              {/* Mobile: Hamburger menu */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowMobileMenu(true)}
                className="sm:hidden"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-[var(--hm-fg-secondary)]" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && !isAuthenticated && (
        <div className="fixed inset-0 z-[100] sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 animate-fade-in"
            style={{ backgroundColor: 'rgba(21,17,12,0.55)' }}
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Slide-in Panel */}
          <div
            ref={mobileMenuRef}
            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[320px] shadow-2xl animate-slide-in-right"
            style={{
              backgroundColor: 'var(--hm-bg-elevated)',
              animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--hm-border-subtle)' }}>
              <div className="flex items-center gap-3">
                <span className="text-[18px] font-semibold tracking-[-0.02em]" style={{ fontFamily: 'var(--hm-font-display)', color: 'var(--hm-fg-primary)' }}>
                  Homico
                </span>
                <ThemeToggle />
                <LanguageSelector variant="icon" />
              </div>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowMobileMenu(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Menu Content */}
            <div className="flex flex-col p-5 gap-3">
              {/* Welcome text */}
              <div className="mb-4">
                <p className="text-sm text-[var(--hm-fg-muted)]">
                  {t("header.welcomeToHomico")}
                </p>
                <p className="text-xs text-[var(--hm-fg-muted)] mt-1">
                  {t("header.signInOrCreateAn")}
                </p>
              </div>

              {/* Login Button */}
              <Button
                variant="secondary"
                onClick={() => {
                  setShowMobileMenu(false);
                  openLoginModal();
                }}
                className="flex items-center gap-3 w-full px-4 py-3.5 h-auto justify-start"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${ACCENT_COLOR}15` }}
                >
                  <LogIn className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
                </div>
                <div className="flex-1 text-left">
                  <span className="block font-medium text-[var(--hm-fg-primary)]">
                    {t("common.login")}
                  </span>
                  <span className="block text-xs text-[var(--hm-fg-muted)]">
                    {t("header.alreadyHaveAnAccount")}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--hm-fg-muted)]" strokeWidth={2} />
              </Button>

              {/* Register Button */}
              <Link
                href="/register"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: ACCENT_COLOR,
                  boxShadow: `0 4px 14px ${ACCENT_COLOR}40`,
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <span className="block font-medium text-white">
                    {t("header.signUp")}
                  </span>
                  <span className="block text-xs text-white/70">
                    {t("header.createAFreeAccount")}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-white/70" strokeWidth={2} />
              </Link>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[var(--hm-border-subtle)]" />
                <span className="text-xs text-[var(--hm-fg-muted)]">
                  {t("header.or")}
                </span>
                <div className="flex-1 h-px bg-[var(--hm-border-subtle)]" />
              </div>

              {/* Post a Job as Guest - opens login modal */}
              <Button
                variant="outline"
                onClick={() => {
                  setShowMobileMenu(false);
                  openLoginModal();
                }}
                className="flex items-center gap-3 w-full px-4 py-3.5 h-auto rounded-xl border-2 border-dashed border-[var(--hm-border)] hover:border-[var(--hm-border-strong)] active:scale-[0.98] justify-start"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--hm-bg-tertiary)]">
                  <Plus className="w-5 h-5 text-[var(--hm-fg-secondary)]" />
                </div>
                <div className="flex-1 text-left">
                  <span className="block font-medium text-[var(--hm-fg-secondary)] text-left">
                    {t("header.postAJob")}
                  </span>
                  <span className="block text-xs text-[var(--hm-fg-muted)]0 text-left">
                    {t("header.findProfessionals")}
                  </span>
                </div>
              </Button>

              {/* Browse link */}
              <Link
                href={homeHref}
                onClick={() => { setShowMobileMenu(false); trackEvent('nav_click', 'browse'); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[var(--hm-bg-tertiary)]/50 transition-all"
              >
                <Search className="w-5 h-5 text-[var(--hm-fg-muted)]" strokeWidth={1.5} />
                <span className="text-sm text-[var(--hm-fg-secondary)]">
                  {t("header.browseProfessionals")}
                </span>
              </Link>

            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]/50">
              <p className="text-xs text-[var(--hm-fg-muted)] text-center">
                {t("header.findTheBestProfessionalsIn")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </header>
  );
}

// Spacer component to prevent content from going under fixed header
export function HeaderSpacer() {
  return <div className="h-14 flex-shrink-0" style={{ backgroundColor: 'var(--hm-bg-elevated)' }} />;
}
