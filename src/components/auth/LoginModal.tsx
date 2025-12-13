'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface DemoAccount {
  email: string;
  role: string;
  name: string;
}

export default function LoginModal() {
  const router = useRouter();
  const { login } = useAuth();
  const { isLoginModalOpen, closeLoginModal, redirectPath, clearRedirectPath } = useAuthModal();
  const { t, locale } = useLanguage();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
    const fetchDemoAccounts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/demo-accounts`);
        if (response.ok) setDemoAccounts(await response.json());
      } catch (err) { console.error('Failed to fetch demo accounts:', err); }
    };
    if (isLoginModalOpen) fetchDemoAccounts();
  }, [isLoginModalOpen]);

  useEffect(() => {
    if (!isLoginModalOpen) {
      setFormData({ identifier: '', password: '' });
      setError('');
      setShowPassword(false);
      setFocusedField(null);
    }
  }, [isLoginModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      login(data.access_token, data.user);
      closeLoginModal();

      if (redirectPath) {
        router.push(redirectPath);
        clearRedirectPath();
      } else if (data.user.role === 'company') {
        router.push('/company/jobs');
      } else if (data.user.role === 'admin') {
        router.push('/admin');
      }
    } catch (err: any) {
      const errorMessage = err.message || '';
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
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeLoginModal}
      />

      <div
        className={`relative w-full max-w-[440px] transition-all duration-500 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div
          className="auth-modal-premium relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeLoginModal}
            className="auth-close-btn"
          >
            <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="auth-esc-badge hidden sm:block">
            ESC
          </div>

          <div className="relative px-8 sm:px-10 pt-16 pb-8 sm:pb-10 z-10">
            <div className="text-center mb-8">
              <div className="auth-icon-premium mx-auto mb-5">
                <svg className="w-8 h-8 text-[#D2691E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                {locale === 'ka' ? 'კეთილი იყოს შენი დაბრუნება' : 'Welcome back'}
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {locale === 'ka' ? 'შედი შენს ანგარიშზე' : 'Sign in to your account'}
              </p>
            </div>

            {error && (
              <div className="auth-error mb-6">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400 flex-1">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-identifier" className="auth-label">
                  {locale === 'ka' ? 'ტელეფონი ან ელ-ფოსტა' : 'Phone or Email'}
                </label>
                <div className="relative">
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    onFocus={() => setFocusedField('identifier')}
                    onBlur={() => setFocusedField(null)}
                    className={`auth-input-premium ${focusedField === 'identifier' ? 'focused' : ''}`}
                    placeholder="+995 555 123 456"
                    style={{
                      borderColor: focusedField === 'identifier' ? '#D2691E' : undefined,
                      boxShadow: focusedField === 'identifier' ? '0 0 0 4px rgba(210, 105, 30, 0.12), 0 4px 12px -4px rgba(210, 105, 30, 0.15)' : undefined,
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-200" style={{ color: focusedField === 'identifier' ? '#D2691E' : 'var(--color-text-muted)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="auth-label">
                  {locale === 'ka' ? 'პაროლი' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`auth-input-premium ${focusedField === 'password' ? 'focused' : ''}`}
                    placeholder="••••••••"
                    style={{
                      borderColor: focusedField === 'password' ? '#D2691E' : undefined,
                      boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(210, 105, 30, 0.12), 0 4px 12px -4px rgba(210, 105, 30, 0.15)' : undefined,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70"
                    style={{ color: focusedField === 'password' ? '#D2691E' : 'var(--color-text-muted)' }}
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

              <div className="flex justify-end">
                <Link href="/forgot-password" onClick={closeLoginModal} className="auth-link text-sm">
                  {locale === 'ka' ? 'დაგავიწყდა პაროლი?' : 'Forgot password?'}
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="auth-btn-premium w-full"
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
                  <span className="flex items-center justify-center gap-2">
                    {locale === 'ka' ? 'შესვლა' : 'Sign in'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span className="auth-divider-text">
                {locale === 'ka' ? 'ან' : 'or'}
              </span>
            </div>

            <div className="text-center mb-6">
              <p className="text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>
                {locale === 'ka' ? 'არ გაქვს ანგარიში?' : "Don't have an account?"}{' '}
                <Link href="/register" onClick={closeLoginModal} className="auth-link">
                  {locale === 'ka' ? 'დარეგისტრირდი' : 'Sign up'}
                </Link>
              </p>
            </div>

            {demoAccounts.length > 0 && (
              <div className="auth-demo-section">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    {locale === 'ka' ? 'დემო ანგარიშები' : 'Demo Accounts'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {demoAccounts.filter(a => a.role === 'client' || a.role === 'pro').slice(0, 4).map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => setFormData({ identifier: account.email, password: 'demo123' })}
                      className="auth-demo-btn group"
                    >
                      <span className="capitalize">{account.role}</span>
                      <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#D2691E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
