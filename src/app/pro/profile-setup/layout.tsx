'use client';

import React from 'react';
import AuthGuard from '@/components/common/AuthGuard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProfileSetupProvider, STEP_META, STEP_SLUGS, useProfileSetup, type ProfileSetupStepSlug } from '@/contexts/ProfileSetupContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Image from 'next/image';
import HomicoLogo from '@/components/common/HomicoLogo';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <span className="flex items-center gap-2">
        <HomicoLogo size={28} className="h-7 w-7" />
        <span className="text-[18px] font-semibold tracking-wide text-[var(--hm-fg-primary)]">
          Homico
        </span>
      </span>
    </Link>
  );
}

function ProfileSetupShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Extract slug from pathname: /pro/profile-setup/services → "services"
  const pathParts = pathname.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  const slug = (STEP_SLUGS.includes(lastPart as ProfileSetupStepSlug) ? lastPart : 'about') as ProfileSetupStepSlug;

  const {
    profileLoading,
    currentStepIndex,
    goToStep,
    goNext,
    goBack,
    isSaving,
    canProceedFromStep,
    isLoading,
    isEditMode,
    error,
    showWelcomeBanner,
    dismissWelcomeBanner,
  } = useProfileSetup();

  const { t, locale } = useLanguage();

  const stepIdx = currentStepIndex(slug);
  const isLastStep = slug === 'review';

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--hm-bg-page)' }}>
        <LoadingSpinner size="xl" variant="border" color="var(--hm-brand-500)" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col pb-24 sm:pb-20"
      style={{ backgroundColor: 'var(--hm-bg-page)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: 'var(--hm-bg-elevated)',
          borderColor: 'var(--hm-border-subtle)',
        }}
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="h-12 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium" style={{ color: 'var(--hm-fg-muted)' }}>
                {stepIdx + 1}/{STEP_SLUGS.length}
              </span>
              <Link
                href="/help"
                className="text-xs transition-colors"
                style={{ color: 'var(--hm-fg-secondary)' }}
              >
                {t('common.help')}
              </Link>
            </div>
          </div>

          {/* Step labels + progress bar */}
          <div className="pb-2">
            <div className="flex mb-1.5">
              {STEP_META.map((step, index) => {
                const isCompleted = index < stepIdx;
                const isCurrent = index === stepIdx;
                return (
                  <button
                    key={step.slug}
                    type="button"
                    onClick={() => isCompleted ? goToStep(step.slug) : undefined}
                    disabled={!isCompleted}
                    className={`flex-1 text-center text-[10px] sm:text-[11px] font-medium transition-colors ${
                      isCurrent
                        ? 'text-[var(--hm-brand-500)]'
                        : isCompleted
                        ? 'cursor-pointer hover:text-[var(--hm-brand-500)]'
                        : ''
                    }`}
                    style={
                      !isCurrent && !isCompleted
                        ? { color: 'var(--hm-fg-muted)' }
                        : !isCurrent && isCompleted
                        ? { color: 'var(--hm-fg-secondary)' }
                        : undefined
                    }
                  >
                    <span className="hidden sm:inline">
                      {step.title[locale === 'ka' ? 'ka' : 'en']}
                    </span>
                    <span className="sm:hidden">{index + 1}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-1">
              {STEP_META.map((step, index) => (
                <div
                  key={step.slug}
                  className="flex-1 h-1 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor:
                      index < stepIdx
                        ? 'var(--hm-brand-500)'
                        : index === stepIdx
                        ? 'rgba(239,78,36,0.4)'
                        : 'var(--hm-border-subtle)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-3 sm:py-4 lg:py-6">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Welcome banner — only on first step */}
          {slug === 'about' && (
            <AnimatePresence>
              {showWelcomeBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-4 rounded-xl border overflow-hidden"
                  style={{
                    borderColor: 'rgba(239,78,36,0.19)',
                    background: 'linear-gradient(135deg, rgba(239,78,36,0.05) 0%, rgba(239,78,36,0.025) 100%)',
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-sm font-semibold" style={{ color: 'var(--hm-fg-primary)' }}>
                        {t('register.welcomeBanner')}
                      </p>
                      <button
                        onClick={dismissWelcomeBanner}
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
                        aria-label="Dismiss"
                      >
                        <Check className="w-3.5 h-3.5" style={{ color: 'var(--hm-fg-muted)' }} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                      {[
                        { icon: '🔍', text: t('register.benefit1') },
                        { icon: '💼', text: t('register.benefit2') },
                        { icon: '⭐', text: t('register.benefit3') },
                      ].map((b, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 px-3 py-2 rounded-lg"
                          style={{ background: 'rgba(239,78,36,0.03)', border: '1px solid rgba(239,78,36,0.09)' }}
                        >
                          <span className="text-base leading-none mt-0.5 flex-shrink-0">
                            {b.icon}
                          </span>
                          <span
                            className="text-[11px] leading-snug"
                            style={{ color: 'var(--hm-fg-secondary)' }}
                          >
                            {b.text}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={dismissWelcomeBanner}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: 'var(--hm-brand-500)' }}
                    >
                      {t('register.getStarted')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#dc2626',
              }}
            >
              {error}
            </div>
          )}

          <motion.div
            key={slug}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Fixed footer navigation */}
      <footer
        className="fixed bottom-0 left-0 right-0 backdrop-blur-md border-t shadow-lg shadow-black/5 z-50 safe-area-bottom"
        style={{
          backgroundColor: 'rgba(250,250,247,0.95)',
          borderColor: 'var(--hm-border-subtle)',
        }}
      >
        <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3 relative">
            {stepIdx > 0 ? (
              <button
                onClick={() => goBack(slug)}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 min-h-[44px] rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                style={{
                  color: 'var(--hm-fg-secondary)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hm-bg-tertiary)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">{t('common.back')}</span>
              </button>
            ) : (
              <button
                onClick={() => goBack(slug)}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 min-h-[44px] rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                style={{ color: 'var(--hm-fg-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hm-bg-tertiary)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden sm:inline">{t('common.cancel')}</span>
              </button>
            )}

            <span
              className="hidden sm:block text-xs font-medium absolute left-1/2 -translate-x-1/2 pointer-events-none"
              style={{ color: 'var(--hm-fg-muted)' }}
            >
              {STEP_META[stepIdx]?.title[locale === 'ka' ? 'ka' : 'en']}
            </span>

            <button
              onClick={() => canProceedFromStep(slug) && goNext(slug)}
              disabled={isLoading || isSaving || !canProceedFromStep(slug)}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 min-h-[44px] rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: 'var(--hm-brand-500)',
                color: 'white',
                boxShadow: canProceedFromStep(slug) ? '0 4px 14px rgba(239,78,36,0.25)' : 'none',
              }}
            >
              {isLoading || isSaving ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>{isSaving ? t('common.saving') : t('becomePro.text')}</span>
                </>
              ) : isLastStep ? (
                <>
                  <span>{isEditMode ? t('common.save') : t('becomePro.complete')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span>{t('common.saveAndContinue')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AdminProIdReader({ onChange }: { onChange: (id: string | null) => void }) {
  const searchParams = useSearchParams();
  const proId = searchParams.get('proId');
  React.useEffect(() => { onChange(proId); }, [proId]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function ProfileSetupLayout({ children }: { children: React.ReactNode }) {
  const [adminTargetProId, setAdminTargetProId] = React.useState<string | null>(null);

  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <AdminProIdReader onChange={setAdminTargetProId} />
      </Suspense>
      <ProfileSetupProvider adminTargetProId={adminTargetProId}>
        <ProfileSetupShell>{children}</ProfileSetupShell>
      </ProfileSetupProvider>
    </AuthGuard>
  );
}
