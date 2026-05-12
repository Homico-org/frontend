"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { CountBadge } from "@/components/ui/badge";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useSupportUnread } from "@/hooks/useSupportUnread";
import { Bell, Briefcase, ChevronRight, ExternalLink, HelpCircle, LayoutGrid, LogIn, LogOut, Menu, Plus, Search, Shield, SlidersHorizontal, UserPlus, X } from "lucide-react";
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
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();
  // Support-reply unread count. Polls every 60s + on tab refocus. Used to
  // surface a "support wrote back" indicator on both the Bell area (small
  // dot) and the profile-dropdown Help row (count badge).
  const { count: unreadSupportCount, firstUnreadId: firstUnreadSupportId } = useSupportUnread();
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
  const isHomeActive = pathname === "/";
  const isProfessionalsActive = pathname === "/professionals" || pathname.startsWith("/professionals/");

  // Logo always goes to the landing (`/`) regardless of auth/role — that
  // page is the concierge entry and what we want visitors/pros alike to
  // land on. Pros navigate to `/jobs` via the nav links, not the logo.
  const homeHref = "/";

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
    <header
      className={`${fixed ? "fixed top-0 left-0 right-0" : "relative"} z-50 h-14`}
      style={{
        borderBottom: '1px solid var(--hm-border-subtle)',
        // Theme-aware translucent background. The previous `rgba(255,255,255,0.85)`
        // was hardcoded white and made the header look "inverted" in dark mode -
        // a bright bar sitting on top of the dark page. `color-mix` keeps the
        // frosted feel by blending the elevated surface with transparency, and
        // it picks up whichever theme is active.
        backgroundColor: 'color-mix(in srgb, var(--hm-bg-elevated) 85%, transparent)',
        backdropFilter: 'saturate(180%) blur(12px)',
        WebkitBackdropFilter: 'saturate(180%) blur(12px)',
      }}
    >
      <div className="h-full max-w-[1800px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Wordmark + primary nav */}
        <div className="flex items-center gap-6 min-w-0">
          <Link href={homeHref} className="flex items-center flex-shrink-0 group">
            <span
              className="text-[19px] font-medium tracking-[-0.02em] transition-colors group-hover:text-[var(--hm-brand-500)]"
              style={{
                fontFamily: 'var(--hm-font-display)',
                color: 'var(--hm-fg-primary)',
              }}
            >
              Homico
            </span>
          </Link>

          {/* Primary nav — desktop only. Active route gets a subtle pill bg. */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Primary">
            <Link
              href="/"
              onClick={() => trackEvent('nav_click', 'home')}
              className="inline-flex items-center px-3 h-8 rounded-full text-[13px] font-medium transition-all"
              style={
                isHomeActive
                  ? {
                      color: 'var(--hm-brand-500)',
                      background: 'rgba(239,78,36,0.08)',
                    }
                  : {
                      color: 'var(--hm-fg-secondary)',
                    }
              }
              aria-current={isHomeActive ? 'page' : undefined}
            >
              {t('header.home')}
            </Link>
            <Link
              href="/professionals"
              onClick={() => trackEvent('nav_click', 'professionals')}
              className="inline-flex items-center px-3 h-8 rounded-full text-[13px] font-medium transition-all"
              style={
                isProfessionalsActive
                  ? {
                      color: 'var(--hm-brand-500)',
                      background: 'rgba(239,78,36,0.08)',
                    }
                  : {
                      color: 'var(--hm-fg-secondary)',
                    }
              }
              aria-current={isProfessionalsActive ? 'page' : undefined}
            >
              {t('header.professionals')}
            </Link>
          </nav>
        </div>

        {/* Right side - Actions + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0">
          {/* Theme + Language - hidden on mobile (logged out: burger menu;
              logged in: available in profile dropdown). At 320-374px the
              header would otherwise cram Logo + Theme + Lang + Bell + Avatar
              and the language selector "ქართ" text would overlap the bell. */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
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
                  className="p-0 hover:bg-transparent relative"
                  aria-label={
                    unreadSupportCount > 0
                      ? `Profile menu - ${unreadSupportCount} new support replies`
                      : 'Profile menu'
                  }
                >
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    size="sm"
                    rounded="xl"
                    className="w-9 h-9 ring-2 ring-[var(--hm-border)] hover:ring-[var(--hm-border-strong)] transition-all duration-300"
                  />
                  {/* Compact dot indicator on the avatar when support has
                      replied. Sits without count to keep the avatar clean -
                      the full count lives inside the dropdown next to Help. */}
                  {unreadSupportCount > 0 && (
                    <span
                      className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--hm-bg-elevated)]"
                      style={{ background: 'var(--hm-brand-500)' }}
                      aria-hidden
                    />
                  )}
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

                      {/* Theme + Language - shown only on mobile, since the
                          desktop header surfaces these in the top bar. Keeps
                          the mobile top bar uncluttered (Logo + Bell + Avatar
                          only) while still giving the user a one-tap path to
                          switch language and theme. */}
                      <div className="sm:hidden flex items-center gap-2 px-4 py-2">
                        <ThemeToggle />
                        <LanguageSelector variant="icon" />
                      </div>

                      {/* Help / Support - with unread reply badge when
                          support team has answered a ticket. Tapping deep-
                          links into the first unread ticket so the user gets
                          to the reply in one click. */}
                      <Link
                        href={
                          unreadSupportCount > 0 && firstUnreadSupportId
                            ? `/help/ticket/${firstUnreadSupportId}`
                            : '/help'
                        }
                        className="group flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)] transition-all duration-200 relative"
                        onClick={() => { setShowDropdown(false); trackEvent('nav_click', 'help'); }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--hm-bg-tertiary)] relative">
                          <HelpCircle
                            className="w-4 h-4"
                            style={{ color: ACCENT_COLOR }}
                            strokeWidth={1.5}
                          />
                          {unreadSupportCount > 0 && (
                            <span
                              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-[var(--hm-bg-elevated)]"
                              style={{ background: 'var(--hm-brand-500)', color: '#fff' }}
                            >
                              {unreadSupportCount > 9 ? '9+' : unreadSupportCount}
                            </span>
                          )}
                        </div>
                        <span className="flex-1">{t("help.title") || 'Help'}</span>
                        {unreadSupportCount > 0 && (
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: 'var(--hm-brand-500)' }}
                          >
                            {unreadSupportCount === 1
                              ? t('help.unreadOne') || '1 new reply'
                              : (t('help.unreadMany') || '{count} new replies').replace('{count}', String(unreadSupportCount))}
                          </span>
                        )}
                      </Link>

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
              {/* Desktop: Login + Sign up + "Become a pro" outlined CTA on the right rail */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { openLoginModal(); trackEvent('nav_click', 'login'); }}
                >
                  {t("common.login")}
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/register" onClick={() => trackEvent('nav_click', 'register')}>{t("header.signUp")}</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/become-pro" onClick={() => trackEvent('nav_click', 'become_pro')}>{t("header.becomePro")}</Link>
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

    </header>
  );
}

// Spacer component to prevent content from going under fixed header
export function HeaderSpacer() {
  return <div className="h-12 flex-shrink-0" style={{ backgroundColor: 'var(--hm-bg-elevated)' }} />;
}
