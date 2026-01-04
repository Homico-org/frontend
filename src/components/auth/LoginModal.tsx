'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage, countries, CountryCode } from '@/contexts/LanguageContext';
import { AnalyticsEvent, useAnalytics } from '@/hooks/useAnalytics';
import GoogleSignInButton, { GoogleUserData } from './GoogleSignInButton';
import { Tabs, Tab } from '@/components/ui/Tabs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';


// Auth method types
type AuthMethod = 'google' | 'mobile' | 'email';

export default function LoginModal() {
  const router = useRouter();
  const { login } = useAuth();
  const { isLoginModalOpen, closeLoginModal, redirectPath, clearRedirectPath } = useAuthModal();
  const { t, locale } = useLanguage();
  const { trackEvent } = useAnalytics();

  // Auth method tab state - initialize from saved registration method if available
  const [activeTab, setActiveTab] = useState<AuthMethod>(() => {
    if (typeof window !== 'undefined') {
      const savedMethod = localStorage.getItem('homi_last_auth_method') as AuthMethod | null;
      if (savedMethod && ['google', 'mobile', 'email'].includes(savedMethod)) {
        return savedMethod;
      }
    }
    return 'google';
  });

  // Saved registration info for indicator
  const [savedAuthMethod, setSavedAuthMethod] = useState<AuthMethod | null>(null);
  const [savedAuthIdentifier, setSavedAuthIdentifier] = useState<string | null>(null);

  // Form state - initialize from localStorage for returning users
  const [phone, setPhone] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastLoginPhone') || '';
    }
    return '';
  });
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastLoginEmail') || '';
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
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Google OAuth state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const countryDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close country dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isLoginModalOpen) {
      // Don't clear phone/email/country - keep them for next login
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [isLoginModalOpen]);

  // Load saved auth method from localStorage on mount
  useEffect(() => {
    const method = localStorage.getItem('homi_last_auth_method') as AuthMethod | null;
    const identifier = localStorage.getItem('homi_last_auth_identifier');
    if (method && ['google', 'mobile', 'email'].includes(method)) {
      setSavedAuthMethod(method);
      setSavedAuthIdentifier(identifier);
    }
  }, []);

  // Handle Google Sign In success from GoogleSignInButton component
  const handleGoogleSuccess = useCallback(async (userData: GoogleUserData) => {
    setIsGoogleLoading(true);
    setError('');

    try {
      // Try to login/register with Google - the backend handles both cases
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: userData.googleId,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          // For login, we don't need phone - backend will check if user exists
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If user doesn't exist and needs to register with phone
        // data.message can be a string or array of validation errors
        const messageStr = Array.isArray(data.message) ? data.message.join(' ') : data.message;
        if (res.status === 400 && (messageStr?.toLowerCase().includes('phone') || messageStr?.toLowerCase().includes('register'))) {
          // Redirect to register page silently - don't show error
          setIsGoogleLoading(false);
          closeLoginModal();
          router.push('/register');
          return;
        }
        throw new Error(messageStr || 'Google login failed');
      }

      login(data.access_token, data.user);
      trackEvent(AnalyticsEvent.LOGIN, { userRole: data.user.role, authMethod: 'google' });
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
      if (errorMessage.includes('not found') || errorMessage.includes('not registered')) {
        setError(locale === 'ka' ? 'ანგარიში ვერ მოიძებნა. გთხოვთ დარეგისტრირდეთ.' : 'Account not found. Please register first.');
      } else {
        setError(locale === 'ka' ? 'Google-ით შესვლა ვერ მოხერხდა' : 'Failed to sign in with Google');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [locale, login, trackEvent, closeLoginModal, redirectPath, router, clearRedirectPath]);

  // Handle Google Sign In error
  const handleGoogleError = useCallback((errorMsg: string) => {
    console.error('Google Sign In Error:', errorMsg);
    setError(locale === 'ka' ? 'Google-ით შესვლა ვერ მოხერხდა' : 'Failed to sign in with Google');
  }, [locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Build identifier based on active tab
    const identifier = activeTab === 'email'
      ? email
      : `${countries[phoneCountry].phonePrefix}${phone.replace(/\s/g, '')}`;

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
        if (activeTab === 'email') {
          localStorage.setItem('lastLoginEmail', email);
        } else {
          localStorage.setItem('lastLoginPhone', phone);
          localStorage.setItem('lastLoginCountry', phoneCountry);
        }
      } catch {
        // Ignore localStorage errors
      }

      login(data.access_token, data.user);
      trackEvent(AnalyticsEvent.LOGIN, { userRole: data.user.role, authMethod: activeTab });
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

  // Format phone input
  const handlePhoneChange = (value: string) => {
    // Only allow digits and spaces
    const cleaned = value.replace(/[^\d\s]/g, '');
    setPhone(cleaned);
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
            <button
              onClick={closeLoginModal}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-all z-10"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="px-6 pt-8 pb-6">
              {/* Header */}
              <div className="text-center mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E07B4F] to-[#C4735B] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#E07B4F]/20">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-neutral-900">
                  {locale === 'ka' ? 'შესვლა' : 'Welcome back'}
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {locale === 'ka' ? 'აირჩიეთ შესვლის მეთოდი' : 'Choose your login method'}
                </p>
              </div>

              {/* Auth Method Tabs */}
              <Tabs
                tabs={[
                  {
                    id: 'google',
                    label: 'Google',
                    icon: (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    ),
                    badge: savedAuthMethod === 'google' ? '✓' : undefined,
                  },
                  {
                    id: 'mobile',
                    label: locale === 'ka' ? 'მობილური' : 'Mobile',
                    shortLabel: locale === 'ka' ? 'ტელ.' : 'Phone',
                    icon: (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    ),
                    badge: savedAuthMethod === 'mobile' ? '✓' : undefined,
                  },
                  {
                    id: 'email',
                    label: locale === 'ka' ? 'ელ-ფოსტა' : 'Email',
                    shortLabel: 'Email',
                    icon: (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    ),
                    badge: savedAuthMethod === 'email' ? '✓' : undefined,
                  },
                ]}
                activeTab={activeTab}
                onChange={(tabId) => setActiveTab(tabId as AuthMethod)}
                variant="pills"
                size="sm"
                fullWidth
                compact
                className="mb-4"
              />

              {/* Saved auth method indicator */}
              {savedAuthMethod && savedAuthIdentifier && (
                <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-emerald-700">
                    {locale === 'ka'
                      ? `დარეგისტრირებული ხართ ${savedAuthMethod === 'google' ? 'Google' : savedAuthMethod === 'mobile' ? 'მობილურით' : 'Email'}-ით`
                      : `You registered with ${savedAuthMethod === 'google' ? 'Google' : savedAuthMethod === 'mobile' ? 'Mobile' : 'Email'}`}
                    {savedAuthIdentifier && (
                      <span className="font-medium"> ({savedAuthIdentifier.length > 20 ? savedAuthIdentifier.slice(0, 20) + '...' : savedAuthIdentifier})</span>
                    )}
                  </p>
                </div>
              )}

              {/* Info Message */}
              {!savedAuthMethod && (
                <p className="text-xs text-neutral-500 text-center mb-4">
                  {locale === 'ka' ? 'შედით იმავე მეთოდით რომლითაც დარეგისტრირდით' : 'Login with the same method you registered with'}
                </p>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              {/* Google Tab Content */}
              {activeTab === 'google' && (
                <div className="space-y-4">
                  <GoogleSignInButton
                    buttonKey="login-modal"
                    text="signin_with"
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    isActive={activeTab === 'google' && isLoginModalOpen}
                    loadingText={locale === 'ka' ? 'იტვირთება...' : 'Loading...'}
                  />
                  {isGoogleLoading && (
                    <div className="flex justify-center">
                      <svg className="animate-spin h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Tab Content */}
              {activeTab === 'mobile' && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="login-phone" className="block text-xs font-medium text-neutral-600 mb-1.5">
                      {locale === 'ka' ? 'ტელეფონის ნომერი' : 'Phone Number'}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative" ref={countryDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="h-11 px-2.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-1.5 hover:bg-neutral-100 transition-colors"
                        >
                          <span className="text-base">{countries[phoneCountry].flag}</span>
                          <span className="text-xs font-medium text-neutral-600">{countries[phoneCountry].phonePrefix}</span>
                          <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showCountryDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-neutral-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                            {(Object.keys(countries) as CountryCode[]).map((code) => (
                              <button
                                key={code}
                                type="button"
                                onClick={() => {
                                  setPhoneCountry(code);
                                  setShowCountryDropdown(false);
                                }}
                                className={`w-full px-3 py-2 flex items-center gap-2.5 hover:bg-neutral-50 transition-colors ${phoneCountry === code ? 'bg-[#FEF6F3]' : ''}`}
                              >
                                <span className="text-base">{countries[code].flag}</span>
                                <span className="text-sm font-medium text-neutral-700 flex-1 text-left">{countries[code].name}</span>
                                <span className="text-xs text-neutral-500">{countries[code].phonePrefix}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        id="login-phone"
                        type="tel"
                        inputMode="numeric"
                        required
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="flex-1 h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E07B4F]/20 focus:border-[#E07B4F]/50 transition-all text-sm"
                        placeholder={countries[phoneCountry].placeholder}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="login-password-mobile" className="block text-xs font-medium text-neutral-600 mb-1.5">
                      {locale === 'ka' ? 'პაროლი' : 'Password'}
                    </label>
                    <div className="relative">
                      <input
                        id="login-password-mobile"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 px-3 pr-10 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E07B4F]/20 focus:border-[#E07B4F]/50 transition-all text-sm"
                        placeholder={locale === 'ka' ? 'შეიყვანეთ პაროლი' : 'Enter your password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      onClick={closeLoginModal}
                      className="text-xs font-medium text-[#E07B4F] hover:text-[#C4735B] transition-colors"
                    >
                      {locale === 'ka' ? 'დაგავიწყდა პაროლი?' : 'Forgot Password?'}
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-gradient-to-r from-[#E07B4F] to-[#C4735B] hover:from-[#D06A3E] hover:to-[#B3624A] text-white font-semibold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#E07B4F]/20 hover:shadow-[#E07B4F]/30 text-sm"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {locale === 'ka' ? 'შესვლა...' : 'Signing in...'}
                      </span>
                    ) : (
                      <span>{locale === 'ka' ? 'შესვლა' : 'Sign In'}</span>
                    )}
                  </button>
                </form>
              )}

              {/* Email Tab Content */}
              {activeTab === 'email' && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="login-email" className="block text-xs font-medium text-neutral-600 mb-1.5">
                      {locale === 'ka' ? 'ელ-ფოსტა' : 'Email'}
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E07B4F]/20 focus:border-[#E07B4F]/50 transition-all text-sm"
                      placeholder={locale === 'ka' ? 'შეიყვანეთ ელ-ფოსტა' : 'Enter your email'}
                    />
                  </div>

                  <div>
                    <label htmlFor="login-password-email" className="block text-xs font-medium text-neutral-600 mb-1.5">
                      {locale === 'ka' ? 'პაროლი' : 'Password'}
                    </label>
                    <div className="relative">
                      <input
                        id="login-password-email"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 px-3 pr-10 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E07B4F]/20 focus:border-[#E07B4F]/50 transition-all text-sm"
                        placeholder={locale === 'ka' ? 'შეიყვანეთ პაროლი' : 'Enter your password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      onClick={closeLoginModal}
                      className="text-xs font-medium text-[#E07B4F] hover:text-[#C4735B] transition-colors"
                    >
                      {locale === 'ka' ? 'დაგავიწყდა პაროლი?' : 'Forgot Password?'}
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-gradient-to-r from-[#E07B4F] to-[#C4735B] hover:from-[#D06A3E] hover:to-[#B3624A] text-white font-semibold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#E07B4F]/20 hover:shadow-[#E07B4F]/30 text-sm"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {locale === 'ka' ? 'შესვლა...' : 'Signing in...'}
                      </span>
                    ) : (
                      <span>{locale === 'ka' ? 'შესვლა' : 'Sign In'}</span>
                    )}
                  </button>
                </form>
              )}

              {/* Sign Up Link */}
              <p className="text-center text-xs text-neutral-500 mt-4">
                {locale === 'ka' ? 'არ გაქვს ანგარიში?' : "Don't have an account?"}{' '}
                <Link
                  href="/register"
                  onClick={closeLoginModal}
                  className="font-semibold text-[#E07B4F] hover:text-[#C4735B] transition-colors"
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
