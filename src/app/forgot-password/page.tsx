'use client';

import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
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
    } catch (err: unknown) {
      // Check if it's a network error (Failed to fetch)
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage === 'Failed to fetch' || (err instanceof Error && err.name === 'TypeError')) {
        setError(t('forgotPassword.networkError'));
      } else {
        setError(t('forgotPassword.sendFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-500/50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="w-full max-w-[440px] bg-white rounded-[20px] shadow-xl overflow-hidden">
        {/* Content */}
        <div className="px-10 pt-12 pb-10">
          {/* Key Icon in Circle */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-[#F9E4DE] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#C47B65]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-[26px] font-bold text-center text-neutral-900 mb-2">
            {locale === 'ka' ? 'პაროლის აღდგენა' : 'Forgot Password'}
          </h2>

          {/* Subtitle */}
          <p className="text-center text-neutral-500 text-[15px] mb-8">
            {locale === 'ka' ? 'შეიყვანეთ თქვენი ელ-ფოსტა კოდის მისაღებად.' : 'Enter your email to receive a reset code.'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                {locale === 'ka' ? 'ელ-ფოსტა' : 'Email Address'}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[52px] px-4 bg-[#F5F5F5] border-0 rounded-xl text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C47B65]/30 transition-all"
                placeholder="example@homico.com"
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full h-[52px] bg-[#C47B65] hover:bg-[#B36A55] text-white font-semibold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {locale === 'ka' ? 'იგზავნება...' : 'Sending...'}
                </span>
              ) : (
                <span>{locale === 'ka' ? 'კოდის გაგზავნა' : 'Send Reset Code'}</span>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-neutral-200"></div>
            <span className="px-4 text-sm text-neutral-400">OR</span>
            <div className="flex-1 h-px bg-neutral-200"></div>
          </div>

          {/* Back to Login Link */}
          <p className="text-center text-[15px] text-neutral-600">
            {locale === 'ka' ? 'გახსოვს პაროლი?' : 'Remember your password?'}{' '}
            <button
              onClick={() => {
                router.push('/');
                setTimeout(() => openLoginModal(), 100);
              }}
              className="font-semibold text-[#C47B65] hover:text-[#B36A55] transition-colors"
            >
              {locale === 'ka' ? 'შესვლა' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
