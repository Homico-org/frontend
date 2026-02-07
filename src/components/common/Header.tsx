"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { Locale, useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { ExternalLink, LogIn, Menu, Plus, UserPlus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import LanguageSelector from "./LanguageSelector";

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { flatCategories } = useCategories();
  const { t, locale } = useLanguage();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setShowDropdown(false), showDropdown);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Check active routes for navigation highlighting
  const isNotificationsActive = pathname === '/notifications';

  const homeHref = !isAuthenticated
    ? "/"
    : user?.role === "pro" || user?.role === "admin"
      ? "/jobs"
      : "/portfolio";

  // Helper to get subcategory name from flat categories
  const getSubcategoryDisplayName = useCallback((key: string): string => {
    const item = flatCategories.find(c => c.key === key && (c.type === 'subcategory' || c.type === 'subsubcategory'));
    if (!item) return key;
    return locale === 'ka' ? item.nameKa : item.name;
  }, [flatCategories, locale]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
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
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a]">
      <div className="h-full max-w-[1800px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href={homeHref} className="flex items-center flex-shrink-0">
          <span className="flex items-center gap-2">
            <Image
              src="/favicon.png"
              alt="Homico"
              width={28}
              height={28}
              className="h-7 w-7 rounded-[8px]"
              priority
            />
            <span className="hidden sm:inline text-[18px] font-semibold tracking-wide text-neutral-900 dark:text-white">
              Homico
            </span>
          </span>
        </Link>

        {/* Right side - Actions + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0">
          {/* Language Selector - hidden on mobile when logged out (shown in burger menu) */}
          <div className={!isAuthenticated ? 'hidden sm:block' : ''}>
            <LanguageSelector variant="icon" />
          </div>

          {isLoading ? (
            <Skeleton className="w-9 h-9 rounded-xl" />
          ) : isAuthenticated && user ? (
            <>
              {/* Notification Bell */}
              <Link
                href="/notifications"
                className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                  isNotificationsActive
                    ? 'bg-neutral-200 dark:bg-neutral-700 ring-2 ring-offset-1'
                    : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
                style={isNotificationsActive ? { '--tw-ring-color': ACCENT_COLOR } as React.CSSProperties : {}}
              >
                <svg
                  className={`w-4 h-4 ${isNotificationsActive ? '' : 'text-neutral-600 dark:text-neutral-400'}`}
                  style={isNotificationsActive ? { color: ACCENT_COLOR } : {}}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-neutral-900">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
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
                    className="w-9 h-9 ring-2 ring-neutral-200 dark:ring-neutral-700 hover:ring-neutral-300 dark:hover:ring-neutral-600 transition-all duration-300"
                  />
                </Button>

                {showDropdown && (
                  <div
                    className="absolute right-0 top-full mt-2 w-72 rounded-xl overflow-hidden z-[70] animate-scale-in"
                    style={{
                      background: 'linear-gradient(145deg, rgba(255, 253, 250, 0.98) 0%, rgba(255, 250, 245, 0.98) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(200, 114, 89, 0.15)',
                      boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 8px 16px -8px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {/* User Info Header */}
                    {user.role === "pro" ? (
                      <Link
                        href={`/professionals/${user.id}`}
                        className="block px-4 py-3 relative overflow-hidden hover:opacity-90 transition-opacity"
                        style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #B86349 100%)` }}
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <Avatar
                            src={user.avatar}
                            name={user.name}
                            size="md"
                            rounded="xl"
                            className="w-11 h-11"
                            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                              <ExternalLink className="w-3 h-3 text-white/70" />
                            </div>
                            <p className="text-xs text-white/80 truncate">{user.email}</p>
                            {user.selectedSubcategories && user.selectedSubcategories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {user.selectedSubcategories.slice(0, 2).map((subKey) => (
                                  <span
                                    key={subKey}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium"
                                    style={{ background: 'rgba(255, 255, 255, 0.9)', color: ACCENT_COLOR }}
                                  >
                                    {getSubcategoryDisplayName(subKey)}
                                  </span>
                                ))}
                                {user.selectedSubcategories.length > 2 && (
                                  <span
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium"
                                    style={{ background: 'rgba(255, 255, 255, 0.7)', color: ACCENT_COLOR }}
                                  >
                                    +{user.selectedSubcategories.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div
                        className="px-4 py-3 relative overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #B86349 100%)` }}
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <Avatar
                            src={user.avatar}
                            name={user.name}
                            size="md"
                            rounded="xl"
                            className="w-11 h-11"
                            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                            <p className="text-xs text-white/80 truncate">{user.email}</p>
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
                          {process.env.NODE_ENV === 'development' && (
                            <Link
                              href="/pro/premium"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 mx-2 rounded-xl"
                              style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}12 0%, ${ACCENT_COLOR}08 100%)`, border: `1px solid ${ACCENT_COLOR}25` }}
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #B8654D 100%)` }}>
                                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3l7 4 7-4v11l-7 4-7-4V3z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v10" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold block" style={{ color: ACCENT_COLOR }}>{t('header.premiumPlans')}</span>
                                <span className="text-[10px]" style={{ color: `${ACCENT_COLOR}99` }}>{t('header.boostVisibility')}</span>
                              </div>
                            </Link>
                          )}
                          <Link
                            href="/pro/profile-setup"
                            className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                              <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <span>{t('header.profileSetup')}</span>
                          </Link>
                        </>
                      )}

                      {/* Client-specific items */}
                      {user.role === "client" && (
                        <Link
                          href="/become-pro"
                          className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 mx-2 rounded-xl"
                          style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}15 0%, ${ACCENT_COLOR}08 100%)`, border: `1px solid ${ACCENT_COLOR}20` }}
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ACCENT_COLOR }}>
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth="1.5" />
                              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeWidth="1.5" strokeLinecap="round" />
                              <path d="M12 11v6M12 11l2.5 2.5M12 11l-2.5 2.5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold block" style={{ color: ACCENT_COLOR }}>{t('header.becomePro')}</span>
                            <span className="text-[10px] text-neutral-500">{t('header.startEarning')}</span>
                          </div>
                        </Link>
                      )}

                      {/* Admin panel */}
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                            <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                              <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                              <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                              <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                            </svg>
                          </div>
                          <span>{t('header.adminPanel')}</span>
                        </Link>
                      )}

                      {/* Company items */}
                      {user.role === "company" && (
                        <>
                          <Link
                            href="/company/dashboard"
                            className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 mx-2 rounded-xl"
                            style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}12 0%, ${ACCENT_COLOR}08 100%)`, border: `1px solid ${ACCENT_COLOR}25` }}
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #B8654D 100%)` }}>
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="3" width="7" height="9" rx="1.5" strokeWidth={1.5} />
                                <rect x="14" y="3" width="7" height="5" rx="1.5" strokeWidth={1.5} />
                                <rect x="14" y="12" width="7" height="9" rx="1.5" strokeWidth={1.5} />
                                <rect x="3" y="16" width="7" height="5" rx="1.5" strokeWidth={1.5} />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold block" style={{ color: ACCENT_COLOR }}>{t('header.dashboard')}</span>
                              <span className="text-[10px]" style={{ color: `${ACCENT_COLOR}99` }}>{t('header.companyOverview')}</span>
                            </div>
                          </Link>
                          <Link
                            href="/company/jobs"
                            className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                              <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M9 7h1M9 11h1M14 7h1M14 11h1M9 21v-4h6v4" />
                              </svg>
                            </div>
                            <span>{t('header.jobs')}</span>
                          </Link>
                          <Link
                            href="/company/proposals"
                            className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                              <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <span>{t('header.proposals')}</span>
                          </Link>
                          <Link
                            href="/company/employees"
                            className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                              <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="6" r="3" strokeWidth={1.5} />
                                <circle cx="5" cy="17" r="2.5" strokeWidth={1.5} />
                                <circle cx="19" cy="17" r="2.5" strokeWidth={1.5} />
                                <path strokeLinecap="round" strokeWidth={1.5} d="M12 9v3M12 12H5v2.5M12 12h7v2.5" />
                              </svg>
                            </div>
                            <span>{t('header.employees')}</span>
                          </Link>
                          <Link
                            href="/company/settings"
                            className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                              <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <span>{t('common.settings')}</span>
                          </Link>
                        </>
                      )}

                      <div className="my-2 mx-4 h-px bg-neutral-200 dark:bg-neutral-700" />

                      {/* Settings */}
                      <Link
                        href="/settings"
                        className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                          <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeWidth={1.5} d="M4 6h6M14 6h6M4 12h10M18 12h2M4 18h2M10 18h10" />
                            <circle cx="12" cy="6" r="2" strokeWidth={1.5} />
                            <circle cx="16" cy="12" r="2" strokeWidth={1.5} />
                            <circle cx="8" cy="18" r="2" strokeWidth={1.5} />
                          </svg>
                        </div>
                        <span>{t("common.settings")}</span>
                      </Link>

                      <div className="my-2 mx-4 h-px bg-neutral-200 dark:bg-neutral-700" />

                      {/* Logout */}
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="group flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 justify-start h-auto rounded-none"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                          <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 17l5-5-5-5" />
                            <path strokeLinecap="round" strokeWidth={1.75} d="M21 12H9" />
                          </svg>
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
                  onClick={() => openLoginModal()}
                >
                  {t("common.login")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href="/register">
                    {t("header.signUp")}
                  </Link>
                </Button>
              </div>

              {/* Tablet: Icon buttons */}
              <div className="hidden sm:flex md:hidden items-center gap-1">
                <Button
                  variant="secondary"
                  size="icon-sm"
                  onClick={() => openLoginModal()}
                  title={t("common.login")}
                >
                  <LogIn className="w-4 h-4" />
                </Button>
                <Button
                  size="icon-sm"
                  asChild
                  title={t("header.signUp")}
                >
                  <Link href="/register">
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
                <Menu className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Slide-in Panel */}
          <div
            ref={mobileMenuRef}
            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white dark:bg-neutral-900 shadow-2xl animate-slide-in-right"
            style={{
              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <Image
                  src="/favicon.png"
                  alt="Homico"
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-[8px]"
                />
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
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('header.welcomeToHomico')}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                  {t('header.signInOrCreateAn')}
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
                  <span className="block font-medium text-neutral-900 dark:text-white">
                    {t("common.login")}
                  </span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                    {t('header.alreadyHaveAnAccount')}
                  </span>
                </div>
                <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>

              {/* Register Button */}
              <Link
                href="/register"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: ACCENT_COLOR,
                  boxShadow: `0 4px 14px ${ACCENT_COLOR}40`
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
                    {t('header.createAFreeAccount')}
                  </span>
                </div>
                <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  {t('header.or')}
                </span>
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
              </div>

              {/* Post a Job as Guest - opens login modal */}
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  openLoginModal();
                }}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                  <Plus className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div className="flex-1 text-left">
                  <span className="block font-medium text-neutral-700 dark:text-neutral-300 text-left">
                    {t('header.postAJob')}
                  </span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-500 text-left">
                    {t('header.findProfessionals')}
                  </span>
                </div>
              </button>

              {/* Browse link */}
              <Link
                href={homeHref}
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all"
              >
                <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t('header.browseProfessionals')}
                </span>
              </Link>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
                {t('header.findTheBestProfessionalsIn')}
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
          from { opacity: 0; }
          to { opacity: 1; }
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
  return <div className="h-14 flex-shrink-0" />;
}
