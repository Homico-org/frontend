"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { FileText, Hammer, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";

// Muted terracotta accent
const ACCENT_COLOR = '#C4735B';

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const { unreadCount } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
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
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a]">
      <div className="h-full max-w-[1800px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/browse" className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: ACCENT_COLOR }}
          >
            <span className="text-white font-bold text-sm">ჰ</span>
          </div>
          <span className="font-semibold text-neutral-900 dark:text-white hidden sm:block">
            ჰომიკო
          </span>
        </Link>

        {/* Right side - Actions + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pro-specific buttons: My Proposals & My Jobs */}
          {user?.role === "pro" && (
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50">
              <Link
                href="/my-proposals"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:bg-white dark:hover:bg-neutral-700"
                style={{ color: ACCENT_COLOR }}
              >
                <FileText className="w-4 h-4" />
                <span>{locale === 'ka' ? 'შეთავაზებები' : 'Proposals'}</span>
              </Link>
              <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600" />
              <Link
                href="/my-jobs"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:bg-white dark:hover:bg-neutral-700"
                style={{ color: ACCENT_COLOR }}
              >
                <Hammer className="w-4 h-4" />
                <span>{locale === 'ka' ? 'სამუშაოები' : 'Jobs'}</span>
              </Link>
            </div>
          )}

          {/* Post a Job Button */}
          <Link
            href="/post-job"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: ACCENT_COLOR }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">
              {locale === 'ka' ? 'განცხადების დამატება' : 'Post a Job'}
            </span>
          </Link>

          {isLoading ? (
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ) : isAuthenticated && user ? (
            <>
              {/* Notification Bell */}
              <Link
                href="/notifications"
                className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                <svg
                  className="w-4 h-4 text-neutral-600 dark:text-neutral-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center hover:opacity-90 transition-opacity"
                >
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    size="sm"
                    rounded="xl"
                    className="w-9 h-9 ring-2 ring-neutral-200 dark:ring-neutral-700 hover:ring-neutral-300 dark:hover:ring-neutral-600 transition-all duration-300"
                  />
                </button>

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
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize mt-1"
                            style={{ background: 'rgba(255, 255, 255, 0.95)', color: ACCENT_COLOR }}
                          >
                            {user.role === "pro" ? "პრო" : user.role === "client" ? "მაძიებელი" : user.role === "company" ? "კომპანია" : user.role === "admin" ? "ადმინი" : user.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {/* Pro-specific items */}
                      {user.role === "pro" && (
                        <>
                          <Link
                            href="/pro/premium"
                            className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 mx-2 rounded-xl"
                            style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)', border: '1px solid rgba(139, 92, 246, 0.15)' }}
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)' }}>
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3l7 4 7-4v11l-7 4-7-4V3z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v10" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-purple-700 block">{locale === 'ka' ? 'პრემიუმ გეგმები' : 'Premium Plans'}</span>
                              <span className="text-[10px] text-purple-600/70">{locale === 'ka' ? 'გაზარდე ხილვადობა' : 'Boost visibility'}</span>
                            </div>
                          </Link>
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
                            <span>{locale === 'ka' ? 'პროფილის რედაქტირება' : 'Profile Setup'}</span>
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
                            <span className="font-semibold block" style={{ color: ACCENT_COLOR }}>{locale === 'ka' ? 'დასაქმდი' : 'Become Pro'}</span>
                            <span className="text-[10px] text-neutral-500">{locale === 'ka' ? 'დაიწყე შემოსავალი' : 'Start earning'}</span>
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
                          <span>{locale === 'ka' ? 'ადმინ პანელი' : 'Admin Panel'}</span>
                        </Link>
                      )}

                      {/* Company items */}
                      {user.role === "company" && (
                        <>
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
                            <span>{t("menu.companyJobs")}</span>
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
                            <span>{t("menu.team")}</span>
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
                        <span>{t("nav.settings")}</span>
                      </Link>

                      <div className="my-2 mx-4 h-px bg-neutral-200 dark:bg-neutral-700" />

                      {/* Logout */}
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="group flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 transition-all duration-200"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100">
                          <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 17l5-5-5-5" />
                            <path strokeLinecap="round" strokeWidth={1.75} d="M21 12H9" />
                          </svg>
                        </div>
                        <span>{t("nav.signOut")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openLoginModal()}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors px-3 py-2"
              >
                {t("nav.login")}
              </button>
              <Link
                href="/register"
                className="text-sm font-medium px-3 py-2 rounded-lg border transition-colors"
                style={{ borderColor: ACCENT_COLOR, color: ACCENT_COLOR }}
              >
                {t("nav.signUp")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Spacer component to prevent content from going under fixed header
export function HeaderSpacer() {
  return <div className="h-14 flex-shrink-0" />;
}
