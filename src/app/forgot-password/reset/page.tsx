'use client';

import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
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
    if (strength <= 1) return 'bg-red-400';
    if (strength <= 2) return 'bg-amber-400';
    if (strength <= 3) return 'bg-[#C47B65]';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    const strength = passwordStrength();
    if (strength <= 1) return locale === 'ka' ? 'სუსტი' : 'Weak';
    if (strength <= 2) return locale === 'ka' ? 'საშუალო' : 'Fair';
    if (strength <= 3) return locale === 'ka' ? 'კარგი' : 'Good';
    return locale === 'ka' ? 'ძლიერი' : 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(locale === 'ka' ? 'პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს' : 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError(locale === 'ka' ? 'პაროლები არ ემთხვევა' : 'Passwords do not match');
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('forgotPassword.resetFailed');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Success State
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-neutral-500/50 flex items-center justify-center p-4">
        {/* Modal Card */}
        <div className="w-full max-w-[440px] bg-white rounded-[20px] shadow-xl overflow-hidden">
          {/* Content */}
          <div className="px-10 pt-12 pb-10">
            {/* Success Icon in Circle */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-[26px] font-bold text-center text-neutral-900 mb-2">
              {locale === 'ka' ? 'პაროლი შეიცვალა!' : 'Password Reset!'}
            </h2>

            {/* Subtitle */}
            <p className="text-center text-neutral-500 text-[15px] mb-8">
              {locale === 'ka' ? 'თქვენი პაროლი წარმატებით შეიცვალა. ახლა შეგიძლიათ შეხვიდეთ ანგარიშზე.' : 'Your password has been successfully reset. You can now sign in with your new password.'}
            </p>

            {/* Sign In Button */}
            <button
              onClick={() => {
                router.push('/');
                setTimeout(() => openLoginModal(), 100);
              }}
              className="w-full h-[52px] bg-[#C47B65] hover:bg-[#B36A55] text-white font-semibold rounded-xl transition-colors"
            >
              {locale === 'ka' ? 'შესვლა' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-500/50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="w-full max-w-[440px] bg-white rounded-[20px] shadow-xl overflow-hidden">
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
            {locale === 'ka' ? 'ახალი პაროლი' : 'New Password'}
          </h2>

          {/* Subtitle */}
          <p className="text-center text-neutral-500 text-[15px] mb-8">
            {locale === 'ka' ? 'შეიყვანეთ ახალი პაროლი თქვენი ანგარიშისთვის.' : 'Enter a new password for your account.'}
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
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                {locale === 'ka' ? 'ახალი პაროლი' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[52px] px-4 pr-12 bg-[#F5F5F5] border-0 rounded-xl text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C47B65]/30 transition-all"
                  placeholder={locale === 'ka' ? 'შეიყვანეთ ახალი პაროლი' : 'Enter new password'}
                  autoComplete="new-password"
                  autoFocus
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

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength() / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength() >= 3 ? 'text-[#C47B65]' : 'text-neutral-500'}`}>
                      {getStrengthText()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                {locale === 'ka' ? 'პაროლის დადასტურება' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full h-[52px] px-4 pr-12 bg-[#F5F5F5] border-0 rounded-xl text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 transition-all ${
                    confirmPassword && password !== confirmPassword
                      ? 'ring-2 ring-red-300'
                      : 'focus:ring-[#C47B65]/30'
                  }`}
                  placeholder={locale === 'ka' ? 'გაიმეორეთ პაროლი' : 'Confirm new password'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
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
                <p className="mt-2 text-xs text-red-500">{locale === 'ka' ? 'პაროლები არ ემთხვევა' : 'Passwords do not match'}</p>
              )}
              {confirmPassword && password === confirmPassword && password.length > 0 && (
                <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {locale === 'ka' ? 'პაროლები ემთხვევა' : 'Passwords match'}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
              className="w-full h-[52px] bg-[#C47B65] hover:bg-[#B36A55] text-white font-semibold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {locale === 'ka' ? 'შეცვლა...' : 'Resetting...'}
                </span>
              ) : (
                <span>{locale === 'ka' ? 'პაროლის შეცვლა' : 'Reset Password'}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
