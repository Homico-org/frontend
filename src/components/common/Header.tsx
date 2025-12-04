'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import Link from 'next/link';
import { useState } from 'react';
import Avatar from './Avatar';

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { t } = useLanguage();
  const { viewMode, toggleViewMode } = useViewMode();
  const { unreadCount } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border-subtle transition-colors duration-200">
      <div className="container-custom py-3 sm:py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2 touch-manipulation">
            <span className="text-xl sm:text-2xl font-serif font-semibold text-neutral-50 tracking-tight transition-colors duration-200">
              Homico
            </span>
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-primary-400 group-hover:scale-125 transition-transform duration-200"></span>
          </Link>

          <nav className="flex gap-4 items-center">
            {isLoading ? (
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-dark-card animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* Become Pro Button for Client Users - Glassmorphism Style */}
                {user.role === 'client' && (
                  <Link
                    href="/become-pro"
                    className="group relative flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl overflow-hidden touch-manipulation transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {/* Hover glow effect */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
                        boxShadow: '0 8px 32px -4px rgba(251, 191, 36, 0.2)',
                      }}
                    />

                    {/* Icon container with gradient */}
                    <div className="relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-all duration-300 group-hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
                      }}
                    >
                      {/* Rocket/upgrade icon */}
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2C12 2 9.5 6.5 9.5 11.5C9.5 14.5 10.5 16.5 12 18C13.5 16.5 14.5 14.5 14.5 11.5C14.5 6.5 12 2 12 2Z"
                          fill="currentColor"
                          className="group-hover:animate-pulse"
                        />
                        <path
                          d="M7 14C5.5 15 5 17 5 17L7 19C7 19 9 18.5 10 17"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M17 14C18.5 15 19 17 19 17L17 19C17 19 15 18.5 14 17"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <circle cx="12" cy="22" r="1.5" fill="currentColor" className="opacity-60" />
                      </svg>
                    </div>

                    {/* Text with gradient on hover */}
                    <span className="text-xs sm:text-sm font-medium relative z-10 transition-all duration-300 text-neutral-300 group-hover:text-amber-400">
                      გახდი სპეცი
                    </span>

                    {/* Animated border on hover */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                      }}
                    />
                  </Link>
                )}

                {/* View Mode Toggle for Pro Users */}
                {user.role === 'pro' && (
                  <button
                    onClick={toggleViewMode}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full transition-all duration-300 touch-manipulation"
                    style={{
                      backgroundColor: viewMode === 'client' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                      border: `1px solid ${viewMode === 'client' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`
                    }}
                  >
                    <div className="relative w-7 sm:w-8 h-3.5 sm:h-4 rounded-full transition-colors duration-300"
                      style={{ backgroundColor: viewMode === 'client' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(52, 211, 153, 0.3)' }}
                    >
                      <div
                        className="absolute top-0.5 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full transition-all duration-300 shadow-sm"
                        style={{
                          backgroundColor: viewMode === 'client' ? '#f59e0b' : '#34d399',
                          left: viewMode === 'client' ? '2px' : 'calc(100% - 12px)'
                        }}
                      />
                    </div>
                    <span className="hidden sm:inline text-xs font-medium transition-colors duration-300"
                      style={{ color: viewMode === 'client' ? '#f59e0b' : '#34d399' }}
                    >
                      {viewMode === 'client' ? 'მაძიებელი' : 'სპეციალისტი'}
                    </span>
                  </button>
                )}

                {/* Notification Bell */}
                <Link
                  href="/notifications"
                  className="relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:bg-white/10"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <svg
                    className="w-5 h-5 text-neutral-400 group-hover:text-primary-400 transition-colors duration-300"
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
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-full shadow-lg shadow-red-500/30 animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      boxShadow: '0 0 20px rgba(52, 211, 153, 0.15)',
                    }}
                  />
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-3 hover:opacity-90 transition-opacity group touch-manipulation"
                  >
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="md"
                      rounded="xl"
                      className="ring-2 ring-neutral-100 dark:ring-dark-border group-hover:ring-primary-300 transition-all duration-300"
                    />
                  </button>

                  {showDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                      ></div>
                      <div key={viewMode} className="absolute right-0 top-full mt-2 sm:mt-3 w-[calc(100vw-24px)] sm:w-72 max-w-[280px] sm:max-w-72 bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-luxury dark:shadow-none overflow-hidden z-20 animate-scale-in max-h-[calc(100vh-80px)] overflow-y-auto">
                      {/* User Info Header */}
                      <div className="px-3 sm:px-5 py-3 sm:py-4 bg-gradient-to-br from-forest-800 to-forest-700 dark:from-dark-elevated dark:to-dark-card">
                        <div className="flex items-center gap-2.5 sm:gap-3.5">
                          <Avatar
                            src={user.avatar}
                            name={user.name}
                            size="md"
                            rounded="xl"
                            className="ring-2 ring-white/20 w-10 h-10 sm:w-12 sm:h-12"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-white truncate">{user.name}</p>
                            <p className="text-[10px] sm:text-xs text-white/70 truncate mb-1 sm:mb-1.5">{user.email}</p>
                            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-primary-400/20 text-primary-300 capitalize">
                                {user.role === 'pro' ? 'პრო' : user.role === 'client' ? 'მაძიებელი' : user.role === 'company' ? 'კომპანია' : user.role === 'admin' ? 'ადმინი' : user.role}
                              </span>
                              {user.role === 'pro' && (
                                <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                                  viewMode === 'client'
                                    ? 'bg-amber-400/20 text-amber-300'
                                    : 'bg-emerald-400/20 text-emerald-300'
                                }`}>
                                  {viewMode === 'client' ? 'მაძიებელი' : 'სპეცი.'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1.5 sm:py-2">

                        {/* Company Menu Items */}
                        {user.role === 'company' && (
                          <>
                            <Link
                              href="/company/jobs"
                              className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors flex-shrink-0">
                                {/* Building with briefcase icon */}
                                <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M9 7h1M9 11h1M14 7h1M14 11h1M9 21v-4h6v4" />
                                </svg>
                              </div>
                              <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors truncate">{t('menu.companyJobs')}</span>
                            </Link>
                            <Link
                              href="/company/employees"
                              className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors flex-shrink-0">
                                {/* Team with org chart icon */}
                                <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <circle cx="12" cy="6" r="3" strokeWidth={1.5} />
                                  <circle cx="5" cy="17" r="2.5" strokeWidth={1.5} />
                                  <circle cx="19" cy="17" r="2.5" strokeWidth={1.5} />
                                  <path strokeLinecap="round" strokeWidth={1.5} d="M12 9v3M12 12H5v2.5M12 12h7v2.5" />
                                </svg>
                              </div>
                              <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors truncate">{t('menu.team')}</span>
                            </Link>
                            <Link
                              href="/company/jobs/new"
                              className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-primary-400/10 flex items-center justify-center group-hover:bg-primary-400/20 transition-colors flex-shrink-0">
                                {/* Plus in circle icon */}
                                <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-forest-800 dark:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                                  <path strokeLinecap="round" strokeWidth={2} d="M12 8v8M8 12h8" />
                                </svg>
                              </div>
                              <span className="text-forest-800 dark:text-primary-400 font-medium truncate">{t('menu.createJob')}</span>
                            </Link>
                          </>
                        )}

                        {/* Admin Menu Items - Only Panel */}
                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors flex-shrink-0">
                              {/* Dashboard grid icon */}
                              <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                                <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                                <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                                <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                              </svg>
                            </div>
                            <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors truncate">პანელი</span>
                          </Link>
                        )}

                        {/* Common Settings Items - Divider only for non-admin or after admin panel */}
                        {(user.role === 'company' || user.role === 'admin') && (
                          <div className="border-t border-neutral-100 dark:border-dark-border my-1.5 sm:my-2 mx-3 sm:mx-4"></div>
                        )}

                        <Link
                          href="/settings"
                          className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors flex-shrink-0">
                            {/* Sliders/settings icon */}
                            <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeWidth={1.5} d="M4 6h6M14 6h6M4 12h10M18 12h2M4 18h2M10 18h10" />
                              <circle cx="12" cy="6" r="2" strokeWidth={1.5} />
                              <circle cx="16" cy="12" r="2" strokeWidth={1.5} />
                              <circle cx="8" cy="18" r="2" strokeWidth={1.5} />
                            </svg>
                          </div>
                          <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors truncate">{t('nav.settings')}</span>
                        </Link>

                        <Link
                          href="/notifications"
                          className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors flex-shrink-0">
                            {/* Bell with badge icon */}
                            <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.73 21a2 2 0 01-3.46 0" />
                              <circle cx="18" cy="5" r="2.5" fill="currentColor" stroke="none" className="text-primary-400" />
                            </svg>
                          </div>
                          <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors truncate">{t('menu.notifications')}</span>
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
                            <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-terracotta-600 dark:group-hover:text-terracotta-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 17l5-5-5-5" />
                              <path strokeLinecap="round" strokeWidth={1.75} d="M21 12H9" />
                            </svg>
                          </div>
                          <span className="group-hover:text-terracotta-600 dark:group-hover:text-terracotta-400 transition-colors truncate">{t('nav.signOut')}</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/login"
                  className="text-neutral-600 dark:text-neutral-300 hover:text-forest-800 dark:hover:text-primary-400 font-medium transition-colors px-3 sm:px-4 py-2 text-sm sm:text-base touch-manipulation"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  className="btn btn-primary text-sm sm:text-base px-4 sm:px-5 py-2 sm:py-2.5 touch-manipulation"
                >
                  {t('nav.signUp')}
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
