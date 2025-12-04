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
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      // Redirect based on user role
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
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-forest-800 via-forest-700 to-forest-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(80,200,120,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(80,200,120,0.1),transparent_50%)]" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <span className="text-3xl font-serif font-semibold text-white">Homico</span>
            <span className="w-2.5 h-2.5 rounded-full bg-primary-400"></span>
          </Link>

          <h1 className="text-4xl font-serif font-medium text-white mb-6 leading-tight">
            {t('auth.welcomeBack')}
          </h1>
          <p className="text-lg text-white/70 max-w-md leading-relaxed">
            {t('auth.signInToAccount')}
          </p>

          {/* Decorative elements */}
          <div className="mt-16 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              ))}
            </div>
            <div>
              <p className="text-white/90 font-medium">10,000+</p>
              <p className="text-sm text-white/50">{t('landing.stats.professionals')}</p>
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

          {/* Card */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-luxury dark:shadow-none p-8 md:p-10">
            <div className="text-center mb-8 lg:text-left">
              <h2 className="text-2xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-2">{t('auth.welcomeBack')}</h2>
              <p className="text-neutral-500 dark:text-neutral-400">{t('auth.signInToAccount')}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-terracotta-50 border border-terracotta-200 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-terracotta-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-terracotta-700">{error}</p>
                </div>
                <button onClick={() => setError('')} className="text-terracotta-400 hover:text-terracotta-600 transition-all duration-200 ease-out">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-2">
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input pr-12"
                    placeholder="Enter your password"
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
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end">
                <Link href="/forgot-password" className="text-sm text-forest-800 dark:text-primary-400 hover:text-terracotta-500 font-medium transition-all duration-200 ease-out">
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary py-3.5"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('auth.signingIn')}
                  </span>
                ) : (
                  t('auth.signIn')
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-dark-border">
              <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                {t('auth.noAccount')}{' '}
                <Link href="/register" className="text-forest-800 dark:text-primary-400 hover:text-terracotta-500 font-semibold transition-all duration-200 ease-out">
                  {t('nav.signUp')}
                </Link>
              </p>
            </div>
          </div>

          {/* Demo Accounts */}
          {demoAccounts.length > 0 && (
            <div className="mt-6 bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-400/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-forest-800 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-400">{t('auth.demoAccounts')}</p>
              </div>
              <div className="space-y-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => setFormData({ email: account.email, password: 'demo123' })}
                    className="w-full flex items-center justify-between text-sm bg-cream-50 dark:bg-dark-elevated hover:bg-cream-100 dark:hover:bg-dark-border rounded-xl px-4 py-3 border border-neutral-100 dark:border-dark-border hover:border-primary-200 transition-all duration-200 cursor-pointer text-left group"
                  >
                    <span className="text-neutral-500 dark:text-neutral-400 capitalize font-medium">{account.role}</span>
                    <span className="text-forest-800 dark:text-primary-400 font-mono text-xs group-hover:text-terracotta-500 transition-all duration-200 ease-out">{account.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
