'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { IconBadge } from '@/components/ui/IconBadge';
import { FormGroup, Label } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { countries, CountryCode, useLanguage } from '@/contexts/LanguageContext';
import { AnalyticsEvent, useAnalytics } from '@/hooks/useAnalytics';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function LoginModal() {
  const router = useRouter();
  const { login } = useAuth();
  const { isLoginModalOpen, closeLoginModal, redirectPath, clearRedirectPath } = useAuthModal();
  const { t, locale } = useLanguage();
  const { trackEvent } = useAnalytics();

  // Form state - initialize from localStorage for returning users
  const [phone, setPhone] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastLoginPhone') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lastLoginCountry') as CountryCode | null;
      if (saved && countries[saved]) return saved;
    }
    return 'GE';
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      setPassword('');
      setError('');
    }
  }, [isLoginModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const identifier = `${countries[phoneCountry].phonePrefix}${phone.replace(/\s/g, '')}`;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      // Save credentials for next login
      try {
        localStorage.setItem('lastLoginPhone', phone);
        localStorage.setItem('lastLoginCountry', phoneCountry);
      } catch {
        // Ignore localStorage errors
      }

      login(data.access_token, data.user);
      trackEvent(AnalyticsEvent.LOGIN, { userRole: data.user.role, authMethod: 'mobile' });
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
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeLoginModal}
        />

        {/* Modal Container */}
        <div
          className={`relative w-full max-w-[380px] transition-all duration-400 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Modal Card */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <Button
              onClick={closeLoginModal}
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 w-8 h-8 rounded-full z-10"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>

            {/* Content */}
            <div className="px-6 pt-8 pb-6">
              {/* Header */}
              <div className="text-center mb-5">
                <IconBadge
                  icon={Lock}
                  size="lg"
                  variant="accent"
                  className="mx-auto mb-3"
                />
                <h2 className="text-lg font-bold text-neutral-900">
                  {t('auth.welcomeBack')}
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {locale === 'ka' ? 'შეიყვანეთ თქვენი მობილურის ნომერი' : 'Enter your mobile number to sign in'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="error" size="sm" className="mb-4">
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <FormGroup>
                  <Label>
                    {t('auth.phoneNumber')}
                  </Label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    country={phoneCountry}
                    onCountryChange={setPhoneCountry}
                    placeholder={countries[phoneCountry].placeholder}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>
                    {t('common.password')}
                  </Label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.enterYourPassword')}
                    required
                  />
                </FormGroup>

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    onClick={closeLoginModal}
                    className="text-xs font-medium text-[#E07B4F] hover:text-[#C4735B] transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  loading={isLoading}
                  className="w-full"
                >
                  {t('auth.signIn')}
                </Button>
              </form>

              {/* Sign Up Link */}
              <p className="text-center text-xs text-neutral-500 mt-4">
                {locale === 'ka' ? 'არ გაქვს ანგარიში?' : "Don't have an account?"}{' '}
                <Link
                  href="/register"
                  onClick={closeLoginModal}
                  className="font-semibold text-[#E07B4F] hover:text-[#C4735B] transition-colors"
                >
                  {t('auth.signUp')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
