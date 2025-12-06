'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DemoAccount {
  email: string;
  role: string;
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { t, locale } = useLanguage();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'company') {
        router.replace('/company/jobs');
      } else if (user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/browse');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchDemoAccounts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/demo-accounts`);
        if (response.ok) {
          const data = await response.json();
          setDemoAccounts(data);
        }
      } catch (err) {
        console.error('Failed to fetch demo accounts:', err);
      }
    };
    fetchDemoAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data.access_token, data.user);

      if (data.user.role === 'company') {
        router.push('/company/jobs');
      } else if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/browse');
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

  if (authLoading || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-200 dark:border-emerald-800 border-t-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Left Panel - Visual */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
          }}
        />

        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Floating shapes */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-32 right-10 w-48 h-48 rounded-full bg-emerald-300/10 blur-2xl" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all duration-300">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
              </svg>
            </div>
            <span className="text-2xl font-semibold text-white tracking-tight">Homico</span>
          </Link>

          {/* Middle content */}
          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-semibold text-white leading-tight mb-6">
              {locale === 'ka' ? 'შენი სახლის' : 'Your home'}
              <br />
              <span className="text-emerald-200">{locale === 'ka' ? 'გარდაქმნა' : 'transformation'}</span>
              <br />
              {locale === 'ka' ? 'იწყება აქ' : 'starts here'}
            </h1>
            <p className="text-lg text-white/70 leading-relaxed">
              {locale === 'ka'
                ? 'შეუერთდი ათასობით პროფესიონალს და მომხმარებელს, რომლებიც ქმნიან თავიანთ ოცნების სახლებს.'
                : 'Join thousands of professionals and homeowners creating their dream spaces.'}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-bold text-white">10K+</p>
              <p className="text-sm text-white/60">{locale === 'ka' ? 'პროფესიონალი' : 'Professionals'}</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-3xl font-bold text-white">50K+</p>
              <p className="text-sm text-white/60">{locale === 'ka' ? 'პროექტი' : 'Projects'}</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="text-3xl font-bold text-white">4.9</p>
              <p className="text-sm text-white/60">{locale === 'ka' ? 'რეიტინგი' : 'Rating'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
              </svg>
            </div>
            <span className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Homico</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {locale === 'ka' ? 'შესვლა' : 'Sign in'}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {locale === 'ka' ? 'გააგრძელე იქიდან, სადაც შეჩერდი' : 'Continue where you left off'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-6 p-4 rounded-xl flex items-start gap-3 border animate-shake"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.2)',
              }}
            >
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400 flex-1">{error}</p>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone Field */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {locale === 'ka' ? 'ტელეფონი ან ელ-ფოსტა' : 'Phone or Email'}
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  onFocus={() => setFocusedField('identifier')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3.5 rounded-xl text-base transition-all duration-200 outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: `2px solid ${focusedField === 'identifier' ? '#10b981' : 'var(--color-border)'}`,
                    color: 'var(--color-text-primary)',
                    boxShadow: focusedField === 'identifier' ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
                  }}
                  placeholder="+995 555 123 456"
                />
                <div
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: focusedField === 'identifier' ? '#10b981' : 'var(--color-text-muted)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {locale === 'ka' ? 'პაროლი' : 'Password'}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3.5 pr-12 rounded-xl text-base transition-all duration-200 outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: `2px solid ${focusedField === 'password' ? '#10b981' : 'var(--color-border)'}`,
                    color: 'var(--color-text-primary)',
                    boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70"
                  style={{ color: focusedField === 'password' ? '#10b981' : 'var(--color-text-muted)' }}
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

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                {locale === 'ka' ? 'დაგავიწყდა პაროლი?' : 'Forgot password?'}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl text-white font-semibold text-base transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              }}
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
                locale === 'ka' ? 'შესვლა' : 'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--color-border)' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-muted)' }}>
                {locale === 'ka' ? 'ან' : 'or'}
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {locale === 'ka' ? 'არ გაქვს ანგარიში?' : "Don't have an account?"}{' '}
              <Link
                href="/register"
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                {locale === 'ka' ? 'დარეგისტრირდი' : 'Sign up'}
              </Link>
            </p>
          </div>

          {/* Demo Accounts */}
          {demoAccounts.length > 0 && (
            <div
              className="mt-8 p-5 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {locale === 'ka' ? 'დემო ანგარიშები' : 'Demo Accounts'}
                </p>
              </div>
              <div className="space-y-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => setFormData({ identifier: account.email, password: 'demo123' })}
                    className="w-full flex items-center justify-between text-sm rounded-lg px-4 py-3 border transition-all duration-200 group hover:border-emerald-300 dark:hover:border-emerald-700"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <span className="capitalize font-medium" style={{ color: 'var(--color-text-secondary)' }}>{account.role}</span>
                    <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 group-hover:underline">{account.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
