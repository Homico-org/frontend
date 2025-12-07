'use client';

import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { openLoginModal } = useAuthModal();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('resetEmail');
    const storedCode = sessionStorage.getItem('resetCode');
    if (!storedEmail || !storedCode) {
      router.push('/forgot-password');
      return;
    }
    setEmail(storedEmail);
    setCode(storedCode);
  }, [router]);

  const passwordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getStrengthColor = () => {
    const strength = passwordStrength();
    if (strength <= 1) return 'bg-terracotta-500';
    if (strength <= 2) return 'bg-amber-500';
    if (strength <= 3) return 'bg-primary-400';
    return 'bg-primary-500';
  };

  const getStrengthText = () => {
    const strength = passwordStrength();
    if (strength <= 1) return t('forgotPassword.strengthWeak');
    if (strength <= 2) return t('forgotPassword.strengthFair');
    if (strength <= 3) return t('forgotPassword.strengthGood');
    return t('forgotPassword.strengthStrong');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('forgotPassword.passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsNotMatch'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('forgotPassword.resetFailed'));
      }

      // Clear session storage
      sessionStorage.removeItem('resetEmail');
      sessionStorage.removeItem('resetCode');

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || t('forgotPassword.resetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-luxury dark:shadow-none p-8 md:p-10 text-center">
            {/* Success Animation */}
            <div className="mb-6 relative">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary-400/20 dark:bg-primary-400/10 flex items-center justify-center animate-scale-in">
                <svg className="w-10 h-10 text-primary-500 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute -inset-4 bg-primary-400/10 rounded-full blur-2xl -z-10 animate-pulse-soft" />
            </div>

            <h2 className="text-2xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-2">
              {t('forgotPassword.successTitle')}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8">
              {t('forgotPassword.successMessage')}
            </p>

            <button
              onClick={() => openLoginModal()}
              className="w-full btn btn-primary py-3.5 flex items-center justify-center gap-2 group"
            >
              {t('forgotPassword.goToLogin')}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-forest-800 via-forest-700 to-forest-800 relative overflow-hidden">
        {/* Animated background patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(80,200,120,0.2),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(80,200,120,0.15),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_60%)]" />

        {/* Floating geometric elements */}
        <div className="absolute top-32 left-20 w-24 h-24 border border-white/10 rounded-full animate-float" />
        <div className="absolute bottom-24 right-16 w-28 h-28 border border-primary-400/20 rounded-2xl rotate-45 animate-float animation-delay-400" />
        <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-primary-400/10 rounded-lg rotate-12 animate-pulse-soft" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link href="/" className="flex items-center gap-2 mb-12 group">
            <span className="text-3xl font-serif font-semibold text-white group-hover:text-primary-300 transition-colors duration-300">Homico</span>
            <span className="w-2.5 h-2.5 rounded-full bg-primary-400 group-hover:scale-125 transition-transform duration-300"></span>
          </Link>

          {/* Lock icon with glow effect */}
          <div className="mb-8 relative">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
              <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="absolute -inset-1 bg-primary-400/20 rounded-2xl blur-xl -z-10 animate-pulse-soft" />
          </div>

          <h1 className="text-4xl font-serif font-medium text-white mb-4 leading-tight">
            {t('forgotPassword.createNewPassword')}
          </h1>
          <p className="text-lg text-white/70 max-w-md leading-relaxed mb-8">
            {t('forgotPassword.createPasswordSubtitle')}
          </p>

          {/* Steps indicator */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-400/30 text-primary-400 flex items-center justify-center text-sm font-semibold">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/60 text-sm">{t('forgotPassword.stepEmail')}</span>
            </div>
            <div className="w-8 h-px bg-primary-400/50" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-400/30 text-primary-400 flex items-center justify-center text-sm font-semibold">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/60 text-sm">{t('forgotPassword.stepVerify')}</span>
            </div>
            <div className="w-8 h-px bg-primary-400/50" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-400 text-forest-900 flex items-center justify-center text-sm font-semibold">3</div>
              <span className="text-white/90 text-sm font-medium">{t('forgotPassword.stepReset')}</span>
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
            <div className="w-8 h-1.5 rounded-full bg-forest-800/30 dark:bg-primary-400/30" />
            <div className="w-8 h-1.5 rounded-full bg-forest-800/30 dark:bg-primary-400/30" />
            <div className="w-8 h-1.5 rounded-full bg-forest-800 dark:bg-primary-400" />
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-luxury dark:shadow-none p-8 md:p-10">
            <div className="text-center mb-8 lg:text-left">
              <div className="lg:hidden w-16 h-16 mx-auto mb-4 rounded-2xl bg-forest-800/10 dark:bg-primary-400/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-forest-800 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                {t('forgotPassword.setNewPassword')}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400">
                {t('forgotPassword.setNewPasswordDesc')}
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

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-2">
                  {t('forgotPassword.newPassword')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-12 pr-12"
                    placeholder={t('forgotPassword.enterNewPassword')}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-forest-800 dark:hover:text-primary-400 transition-all duration-200 ease-out"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-3 animate-fade-in">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-dark-border rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                          style={{ width: `${(passwordStrength() / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${passwordStrength() >= 3 ? 'text-primary-500' : 'text-neutral-500'}`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">
                      {t('forgotPassword.passwordHint')}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-2">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`input pl-12 pr-12 ${confirmPassword && password !== confirmPassword ? 'border-terracotta-400 focus:border-terracotta-400 focus:ring-terracotta-400/20' : ''}`}
                    placeholder={t('forgotPassword.confirmNewPassword')}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-forest-800 dark:hover:text-primary-400 transition-all duration-200 ease-out"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-2 text-xs text-terracotta-500">{t('auth.passwordsNotMatch')}</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="mt-2 text-xs text-primary-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('forgotPassword.passwordsMatch')}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                className="w-full btn btn-primary py-3.5 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                <span className={`flex items-center justify-center gap-2 transition-all duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                  {t('forgotPassword.resetPassword')}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
          </div>
        </div>
      </div>
    </div>
  );
}
