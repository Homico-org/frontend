'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function VerifyResetCodePage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('resetEmail');
    if (!storedEmail) {
      router.push('/forgot-password');
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('forgotPassword.resendFailed'));
      }

      setCanResend(false);
      setCountdown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || t('forgotPassword.resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError(t('forgotPassword.enterFullCode'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('forgotPassword.invalidCode'));
      }

      // Store the verified code and navigate to reset page
      sessionStorage.setItem('resetCode', fullCode);
      router.push('/forgot-password/reset');
    } catch (err: any) {
      setError(err.message || t('forgotPassword.invalidCode'));
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '';

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-forest-800 via-forest-700 to-forest-800 relative overflow-hidden">
        {/* Animated background patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(80,200,120,0.2),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(80,200,120,0.15),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_60%)]" />

        {/* Floating geometric elements */}
        <div className="absolute top-20 right-16 w-28 h-28 border border-white/10 rounded-full animate-float" />
        <div className="absolute bottom-40 left-12 w-20 h-20 border border-primary-400/20 rounded-2xl rotate-45 animate-float animation-delay-300" />
        <div className="absolute top-1/3 right-1/4 w-14 h-14 bg-primary-400/10 rounded-lg rotate-12 animate-pulse-soft" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link href="/" className="flex items-center gap-2 mb-12 group">
            <span className="text-3xl font-serif font-semibold text-white group-hover:text-primary-300 transition-colors duration-300">{locale === 'ka' ? 'ჰომიკო' : 'Homico'}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-primary-400 group-hover:scale-125 transition-transform duration-300"></span>
          </Link>

          {/* Shield icon with glow effect */}
          <div className="mb-8 relative">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
              <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="absolute -inset-1 bg-primary-400/20 rounded-2xl blur-xl -z-10 animate-pulse-soft" />
          </div>

          <h1 className="text-4xl font-serif font-medium text-white mb-4 leading-tight">
            {t('forgotPassword.verifyTitle')}
          </h1>
          <p className="text-lg text-white/70 max-w-md leading-relaxed mb-8">
            {t('forgotPassword.verifySubtitle')}
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
              <div className="w-8 h-8 rounded-full bg-primary-400 text-forest-900 flex items-center justify-center text-sm font-semibold">2</div>
              <span className="text-white/90 text-sm font-medium">{t('forgotPassword.stepVerify')}</span>
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
            <span className="text-2xl font-serif font-semibold text-forest-800 dark:text-primary-400">{locale === 'ka' ? 'ჰომიკო' : 'Homico'}</span>
            <span className="w-2 h-2 rounded-full bg-primary-400"></span>
          </Link>

          {/* Mobile steps indicator */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-1.5 rounded-full bg-forest-800/30 dark:bg-primary-400/30" />
            <div className="w-8 h-1.5 rounded-full bg-forest-800 dark:bg-primary-400" />
            <div className="w-8 h-1.5 rounded-full bg-neutral-200 dark:bg-dark-border" />
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-luxury dark:shadow-none p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="lg:hidden w-16 h-16 mx-auto mb-4 rounded-2xl bg-forest-800/10 dark:bg-primary-400/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-forest-800 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                {t('forgotPassword.checkEmail')}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400">
                {t('forgotPassword.codeSentTo')} <span className="font-medium text-forest-800 dark:text-primary-400">{maskedEmail}</span>
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
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-4 text-center">
                  {t('forgotPassword.enterCode')}
                </label>
                <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-11 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-semibold rounded-xl border-2 border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-elevated text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-forest-800 dark:focus:border-primary-400 focus:ring-2 focus:ring-forest-800/20 dark:focus:ring-primary-400/20 transition-all duration-200"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Timer and Resend */}
              <div className="text-center">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-sm text-forest-800 dark:text-primary-400 hover:text-terracotta-500 font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    {isResending ? t('forgotPassword.resending') : t('forgotPassword.resendCode')}
                  </button>
                ) : (
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">
                    {t('forgotPassword.resendIn')} <span className="font-medium text-forest-800 dark:text-primary-400">{countdown}s</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || code.some(d => !d)}
                className="w-full btn btn-primary py-3.5 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`flex items-center justify-center gap-2 transition-all duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                  {t('forgotPassword.verifyCode')}
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

            {/* Change Email */}
            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-dark-border">
              <button
                onClick={() => {
                  sessionStorage.removeItem('resetEmail');
                  router.push('/forgot-password');
                }}
                className="flex items-center justify-center gap-2 w-full text-sm text-neutral-600 dark:text-neutral-400 hover:text-forest-800 dark:hover:text-primary-400 transition-all duration-200 group"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t('forgotPassword.useAnotherEmail')}
              </button>
            </div>
          </div>

          {/* Help text */}
          <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-500">
            {t('forgotPassword.didntReceive')}{' '}
            <Link href="/help" className="text-forest-800 dark:text-primary-400 hover:underline">
              {t('forgotPassword.checkSpam')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
