'use client';

import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { openLoginModal } = useAuthModal();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('forgotPassword.sendFailed'));
      }

      // Store email for the next step and navigate
      sessionStorage.setItem('resetEmail', email);
      router.push('/forgot-password/verify');
    } catch (err: any) {
      // Check if it's a network error (Failed to fetch)
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError(t('forgotPassword.networkError'));
      } else {
        setError(t('forgotPassword.sendFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-forest-800 via-forest-700 to-forest-800 relative overflow-hidden">
        {/* Animated background patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(80,200,120,0.2),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(80,200,120,0.15),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_60%)]" />

        {/* Floating geometric elements */}
        <div className="absolute top-20 left-10 w-32 h-32 border border-white/10 rounded-full animate-float" />
        <div className="absolute bottom-32 right-20 w-24 h-24 border border-primary-400/20 rounded-2xl rotate-45 animate-float animation-delay-200" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary-400/10 rounded-lg rotate-12 animate-pulse-soft" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link href="/" className="flex items-center gap-2 mb-12 group">
            <span className="text-3xl font-serif font-semibold text-white group-hover:text-primary-300 transition-colors duration-300">Homico</span>
            <span className="w-2.5 h-2.5 rounded-full bg-primary-400 group-hover:scale-125 transition-transform duration-300"></span>
          </Link>

          {/* Key icon with glow effect */}
          <div className="mb-8 relative">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
              <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div className="absolute -inset-1 bg-primary-400/20 rounded-2xl blur-xl -z-10 animate-pulse-soft" />
          </div>

          <h1 className="text-4xl font-serif font-medium text-white mb-4 leading-tight">
            {t('forgotPassword.heroTitle')}
          </h1>
          <p className="text-lg text-white/70 max-w-md leading-relaxed mb-8">
            {t('forgotPassword.heroSubtitle')}
          </p>

          {/* Steps indicator */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-400 text-forest-900 flex items-center justify-center text-sm font-semibold">1</div>
              <span className="text-white/90 text-sm font-medium">{t('forgotPassword.stepEmail')}</span>
            </div>
            <div className="w-8 h-px bg-white/30" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 text-white/60 flex items-center justify-center text-sm font-medium">2</div>
              <span className="text-white/50 text-sm">{t('forgotPassword.stepVerify')}</span>
            </div>
            <div className="w-8 h-px bg-white/30" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 text-white/60 flex items-center justify-center text-sm font-medium">3</div>
              <span className="text-white/50 text-sm">{t('forgotPassword.stepReset')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <span className="text-2xl font-serif font-semibold text-forest-800 dark:text-primary-400">Homico</span>
            <span className="w-2 h-2 rounded-full bg-primary-400"></span>
          </Link>

          {/* Mobile steps indicator */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-1.5 rounded-full bg-forest-800 dark:bg-primary-400" />
            <div className="w-8 h-1.5 rounded-full bg-neutral-200 dark:bg-dark-border" />
            <div className="w-8 h-1.5 rounded-full bg-neutral-200 dark:bg-dark-border" />
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-luxury dark:shadow-none p-8 md:p-10">
            <div className="text-center mb-8 lg:text-left">
              <div className="lg:hidden w-16 h-16 mx-auto mb-4 rounded-2xl bg-forest-800/10 dark:bg-primary-400/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-forest-800 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                {t('forgotPassword.title')}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400">
                {t('forgotPassword.subtitle')}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-terracotta-50 dark:bg-terracotta-500/10 border border-terracotta-200 dark:border-terracotta-500/30 rounded-xl flex items-start gap-3 animate-scale-in">
                <svg className="w-5 h-5 text-terracotta-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-terracotta-700 dark:text-terracotta-400">{error}</p>
                </div>
                <button onClick={() => setError('')} className="text-terracotta-400 hover:text-terracotta-600 transition-all duration-200 ease-out">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-2">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-12"
                    placeholder="email@gmail.com"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
                  {t('forgotPassword.emailHint')}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full btn btn-primary py-3.5 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`flex items-center justify-center gap-2 transition-all duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                  {t('forgotPassword.sendCode')}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
                {isLoading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-dark-border">
              <button
                onClick={() => openLoginModal()}
                className="flex items-center justify-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-forest-800 dark:hover:text-primary-400 transition-all duration-200 group w-full"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t('forgotPassword.backToLogin')}
              </button>
            </div>
          </div>

          {/* Help text */}
          <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-500">
            {t('forgotPassword.needHelp')}{' '}
            <Link href="/help" className="text-forest-800 dark:text-primary-400 hover:underline">
              {t('forgotPassword.contactSupport')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
