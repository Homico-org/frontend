'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useState } from 'react';
import Avatar from './Avatar';

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { t } = useLanguage();
  const { viewMode, toggleViewMode } = useViewMode();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border-subtle transition-colors duration-200">
      <div className="container-custom py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-2xl font-serif font-semibold text-neutral-50 tracking-tight transition-colors duration-200">
              Homico
            </span>
            <span className="w-2 h-2 rounded-full bg-primary-400 group-hover:scale-125 transition-transform duration-200"></span>
          </Link>

          <nav className="flex gap-4 items-center">
            {isLoading ? (
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-dark-card animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* View Mode Toggle for Pro Users */}
                {user.role === 'pro' && (
                  <button
                    onClick={toggleViewMode}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: viewMode === 'client' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                      border: `1px solid ${viewMode === 'client' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`
                    }}
                  >
                    <div className="relative w-8 h-4 rounded-full transition-colors duration-300"
                      style={{ backgroundColor: viewMode === 'client' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(52, 211, 153, 0.3)' }}
                    >
                      <div
                        className="absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 shadow-sm"
                        style={{
                          backgroundColor: viewMode === 'client' ? '#f59e0b' : '#34d399',
                          left: viewMode === 'client' ? '2px' : 'calc(100% - 14px)'
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium transition-colors duration-300"
                      style={{ color: viewMode === 'client' ? '#f59e0b' : '#34d399' }}
                    >
                      {viewMode === 'client' ? 'კლიენტი' : 'სპეციალისტი'}
                    </span>
                  </button>
                )}

                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-3 hover:opacity-90 transition-opacity group"
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
                      <div key={viewMode} className="absolute right-0 top-full mt-3 w-72 bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-luxury dark:shadow-none overflow-hidden z-20 animate-scale-in">
                      {/* User Info Header */}
                      <div className="px-5 py-4 bg-gradient-to-br from-forest-800 to-forest-700 dark:from-dark-elevated dark:to-dark-card">
                        <div className="flex items-center gap-3.5">
                          <Avatar
                            src={user.avatar}
                            name={user.name}
                            size="lg"
                            rounded="xl"
                            className="ring-2 ring-white/20"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                            <p className="text-xs text-white/70 truncate mb-1.5">{user.email}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-400/20 text-primary-300 capitalize">
                                {user.role === 'pro' ? 'პრო' : user.role === 'client' ? 'კლიენტი' : user.role === 'company' ? 'კომპანია' : user.role === 'admin' ? 'ადმინი' : user.role}
                              </span>
                              {user.role === 'pro' && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  viewMode === 'client'
                                    ? 'bg-amber-400/20 text-amber-300'
                                    : 'bg-emerald-400/20 text-emerald-300'
                                }`}>
                                  {viewMode === 'client' ? 'კლიენტი' : 'სპეციალისტი'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {/* Client Menu Items */}
                        {user.role === 'client' && (
                          <>
                            <Link
                              href="/my-jobs"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors">
                                {/* Folder with docs icon */}
                                <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6M9 16h4" />
                                </svg>
                              </div>
                              <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors">{t('menu.myJobs')}</span>
                            </Link>
                            <Link
                              href="/post-job"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-primary-400/10 flex items-center justify-center group-hover:bg-primary-400/20 transition-colors">
                                {/* Plus in circle icon */}
                                <svg className="w-[18px] h-[18px] text-forest-800 dark:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                                  <path strokeLinecap="round" strokeWidth={2} d="M12 8v8M8 12h8" />
                                </svg>
                              </div>
                              <span className="text-forest-800 dark:text-primary-400 font-medium">{t('menu.postJob')}</span>
                            </Link>

                            <div className="border-t border-neutral-100 dark:border-dark-border my-2 mx-4"></div>

                            <Link
                              href="/my-reviews"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-amber-50 dark:group-hover:bg-amber-500/10 transition-colors">
                                {/* Star with sparkle icon */}
                                <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6L12 2z" />
                                  <circle cx="19" cy="5" r="1.5" fill="currentColor" stroke="none" />
                                </svg>
                              </div>
                              <span className="group-hover:text-forest-800 dark:group-hover:text-amber-500 transition-colors">{t('menu.myReviews')}</span>
                            </Link>

                            <div className="border-t border-neutral-100 dark:border-dark-border my-2 mx-4"></div>

                            {/* Become a Pro CTA */}
                            <Link
                              href="/become-pro"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gradient-to-r hover:from-terracotta-50 hover:to-amber-50 dark:hover:from-terracotta-500/10 dark:hover:to-amber-500/10 transition-all"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-terracotta-500 to-amber-500 flex items-center justify-center shadow-md">
                                {/* Rocket/upgrade icon */}
                                <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-terracotta-600 to-amber-600 dark:from-terracotta-400 dark:to-amber-400">
                                  გახდი სპეციალისტი
                                </span>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">შემოსავალი შენი უნარებით</p>
                              </div>
                              <svg className="w-4 h-4 text-terracotta-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </>
                        )}

                        {/* Pro Menu Items - Show based on viewMode */}
                        {user.role === 'pro' && viewMode === 'pro' && (
                          <>
                            <Link
                              href="/pro/proposals"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors">
                                {/* Send/paper plane icon */}
                                <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                </svg>
                              </div>
                              <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors">{t('menu.myProposals')}</span>
                            </Link>
                          </>
                        )}

                        {/* Client Menu Items for Pro Users in Client Mode */}
                        {user.role === 'pro' && viewMode === 'client' && (
                          <>
                            <Link
                              href="/my-jobs"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors">
                                {/* Folder with docs icon */}
                                <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6M9 16h4" />
                                </svg>
                              </div>
                              <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors">{t('menu.myJobs')}</span>
                            </Link>
                          </>
                        )}

                        {/* Company Menu Items */}
                        {user.role === 'company' && (
                          <>
                            <Link
                              href="/company/jobs"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors">
                                {/* Building with briefcase icon */}
                                <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M9 7h1M9 11h1M14 7h1M14 11h1M9 21v-4h6v4" />
                                </svg>
                              </div>
                              <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors">{t('menu.companyJobs')}</span>
                            </Link>
                            <Link
                              href="/company/employees"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors">
                                {/* Team with org chart icon */}
                                <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <circle cx="12" cy="6" r="3" strokeWidth={1.5} />
                                  <circle cx="5" cy="17" r="2.5" strokeWidth={1.5} />
                                  <circle cx="19" cy="17" r="2.5" strokeWidth={1.5} />
                                  <path strokeLinecap="round" strokeWidth={1.5} d="M12 9v3M12 12H5v2.5M12 12h7v2.5" />
                                </svg>
                              </div>
                              <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors">{t('menu.team')}</span>
                            </Link>
                            <Link
                              href="/company/jobs/new"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-primary-400/10 flex items-center justify-center group-hover:bg-primary-400/20 transition-colors">
                                {/* Plus in circle icon */}
                                <svg className="w-[18px] h-[18px] text-forest-800 dark:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                                  <path strokeLinecap="round" strokeWidth={2} d="M12 8v8M8 12h8" />
                                </svg>
                              </div>
                              <span className="text-forest-800 dark:text-primary-400 font-medium">{t('menu.createJob')}</span>
                            </Link>
                          </>
                        )}

                        {/* Admin Menu Items */}
                        {user.role === 'admin' && (
                          <>
                            <Link
                              href="/admin"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors">
                                {/* Dashboard grid icon */}
                                <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                                  <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                                  <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                                  <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth={1.5} />
                                </svg>
                              </div>
                              <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors">{t('menu.panel')}</span>
                            </Link>
                            <Link
                              href="/admin/users"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors">
                                {/* Users with badge icon */}
                                <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <circle cx="9" cy="7" r="3.5" strokeWidth={1.5} />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-1.5a4.5 4.5 0 014.5-4.5h3a4.5 4.5 0 014.5 4.5V21" />
                                  <circle cx="18" cy="8" r="2.5" strokeWidth={1.5} />
                                  <path strokeLinecap="round" strokeWidth={1.5} d="M18 13.5v2" />
                                </svg>
                              </div>
                              <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors">{t('menu.users')}</span>
                            </Link>
                            <Link
                              href="/admin/jobs"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors">
                                {/* Briefcase with checkmark icon */}
                                <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <rect x="3" y="7" width="18" height="13" rx="2" strokeWidth={1.5} />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 13l2 2 4-4" />
                                </svg>
                              </div>
                              <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors">{t('menu.adminJobs')}</span>
                            </Link>
                            <Link
                              href="/admin/reports"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors">
                                {/* Chart with trend icon */}
                                <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3v16a2 2 0 002 2h16" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 14l4-4 3 3 6-6" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 7h3v3" />
                                </svg>
                              </div>
                              <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors">{t('menu.reports')}</span>
                            </Link>
                          </>
                        )}

                        {/* Common Settings Items */}
                        <div className="border-t border-neutral-100 dark:border-dark-border my-2 mx-4"></div>

                        <Link
                          href="/settings"
                          className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors">
                            {/* Sliders/settings icon */}
                            <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeWidth={1.5} d="M4 6h6M14 6h6M4 12h10M18 12h2M4 18h2M10 18h10" />
                              <circle cx="12" cy="6" r="2" strokeWidth={1.5} />
                              <circle cx="16" cy="12" r="2" strokeWidth={1.5} />
                              <circle cx="8" cy="18" r="2" strokeWidth={1.5} />
                            </svg>
                          </div>
                          <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors">{t('nav.settings')}</span>
                        </Link>

                        <Link
                          href="/notifications"
                          className="group flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-cream-100 dark:hover:bg-dark-elevated transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-forest-800/5 dark:group-hover:bg-primary-400/10 transition-colors">
                            {/* Bell with badge icon */}
                            <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.73 21a2 2 0 01-3.46 0" />
                              <circle cx="18" cy="5" r="2.5" fill="currentColor" stroke="none" className="text-primary-400" />
                            </svg>
                          </div>
                          <span className="group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors">{t('menu.notifications')}</span>
                        </Link>

                        <div className="border-t border-neutral-100 dark:border-dark-border my-2 mx-4"></div>

                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            logout();
                          }}
                          className="group flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-terracotta-50 dark:hover:bg-terracotta-500/10 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center group-hover:bg-terracotta-100 dark:group-hover:bg-terracotta-500/20 transition-colors">
                            {/* Door exit icon */}
                            <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400 group-hover:text-terracotta-600 dark:group-hover:text-terracotta-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 17l5-5-5-5" />
                              <path strokeLinecap="round" strokeWidth={1.75} d="M21 12H9" />
                            </svg>
                          </div>
                          <span className="group-hover:text-terracotta-600 dark:group-hover:text-terracotta-400 transition-colors">{t('nav.signOut')}</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-neutral-600 dark:text-neutral-300 hover:text-forest-800 dark:hover:text-primary-400 font-medium transition-colors px-4 py-2"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  className="btn btn-primary"
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
