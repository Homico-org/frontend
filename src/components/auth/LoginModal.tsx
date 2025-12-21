'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAnalytics, AnalyticsEvent } from '@/hooks/useAnalytics';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function LoginModal() {
  const router = useRouter();
  const { login } = useAuth();
  const { isLoginModalOpen, closeLoginModal, redirectPath, clearRedirectPath } = useAuthModal();
  const { t, locale } = useLanguage();
  const { trackEvent } = useAnalytics();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isLoginModalOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isLoginModalOpen]);

  const handleEscKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') closeLoginModal();
  }, [closeLoginModal]);

  useEffect(() => {
    if (isLoginModalOpen) document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isLoginModalOpen, handleEscKey]);

  useEffect(() => {
    if (!isLoginModalOpen) {
      setFormData({ identifier: '', password: '' });
      setError('');
      setShowPassword(false);
    }
  }, [isLoginModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Auto-add +995 prefix for Georgian phone numbers
    let identifier = formData.identifier.trim();
    if (/^\d{9}$/.test(identifier) && identifier.startsWith('5')) {
      identifier = `+995${identifier}`;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, identifier }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      login(data.access_token, data.user);
      trackEvent(AnalyticsEvent.LOGIN, { userRole: data.user.role });
      closeLoginModal();

      if (redirectPath) {
        router.push(redirectPath);
        clearRedirectPath();
      } else if (data.user.role === 'company') {
        router.push('/company/jobs');
      } else if (data.user.role === 'admin') {
        router.push('/admin');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.toLowerCase().includes('invalid credentials')) {
        setError(t('auth.invalidCredentials'));
      } else {
        setError(t('auth.loginFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop - Dark overlay */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeLoginModal}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full max-w-[440px] transition-all duration-400 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Modal Card */}
        <div
          className="relative bg-white rounded-[20px] shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Top Right */}
          <button
            onClick={closeLoginModal}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="px-10 pt-12 pb-10">
            {/* Lock Icon in Circle */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-[#F9E4DE] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#C47B65]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-[26px] font-bold text-center text-neutral-900 mb-2">
              {locale === 'ka' ? 'კეთილი იყოს შენი დაბრუნება' : 'Welcome Back'}
            </h2>

            {/* Subtitle */}
            <p className="text-center text-neutral-500 text-[15px] mb-8">
              {locale === 'ka' ? 'გთხოვთ შეიყვანოთ თქვენი მონაცემები შესასვლელად.' : 'Please enter your details to sign in.'}
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
              {/* Email/Phone Input */}
              <div>
                <label htmlFor="login-identifier" className="block text-sm font-medium text-neutral-700 mb-2">
                  {locale === 'ka' ? 'ელ-ფოსტა ან ტელეფონი' : 'Email or Phone Number'}
                </label>
                <input
                  id="login-identifier"
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  className="w-full h-[52px] px-4 bg-[#F5F5F5] border-0 rounded-xl text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C47B65]/30 transition-all"
                  placeholder="example@homico.com"
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-neutral-700 mb-2">
                  {locale === 'ka' ? 'პაროლი' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-[52px] px-4 pr-12 bg-[#F5F5F5] border-0 rounded-xl text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C47B65]/30 transition-all"
                    placeholder={locale === 'ka' ? 'შეიყვანეთ პაროლი' : 'Enter your password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
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
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  onClick={closeLoginModal}
                  className="text-sm font-medium text-[#C47B65] hover:text-[#B36A55] transition-colors"
                >
                  {locale === 'ka' ? 'დაგავიწყდა პაროლი?' : 'Forgot Password?'}
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] bg-[#C47B65] hover:bg-[#B36A55] text-white font-semibold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {locale === 'ka' ? 'შესვლა...' : 'Signing in...'}
                  </span>
                ) : (
                  <span>{locale === 'ka' ? 'შესვლა' : 'Login'}</span>
                )}
              </button>
            </form>

            {/* OR Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-neutral-200"></div>
              <span className="px-4 text-sm text-neutral-400">OR</span>
              <div className="flex-1 h-px bg-neutral-200"></div>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-[15px] text-neutral-600">
              {locale === 'ka' ? 'არ გაქვს ანგარიში?' : "Don't have an account?"}{' '}
              <Link
                href="/register"
                onClick={closeLoginModal}
                className="font-semibold text-[#C47B65] hover:text-[#B36A55] transition-colors"
              >
                {locale === 'ka' ? 'დარეგისტრირდი' : 'Sign Up'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
