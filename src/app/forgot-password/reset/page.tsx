'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Progress } from '@/components/ui/progress';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPasswordStrength, passwordsMatch } from '@/utils/validationUtils';
import { Check, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    try {
      const storedPhone = typeof window !== 'undefined' ? sessionStorage.getItem('resetPhone') : null;
      if (!storedPhone) {
        router.push('/forgot-password');
        return;
      }
      setPhone(storedPhone);
    } catch {
      // sessionStorage might be unavailable (private browsing, etc.)
      router.push('/forgot-password');
    }
  }, [router]);

  const passwordStrengthData = getPasswordStrength(password, locale);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordStrengthData.isValid) {
      setError(t('forgotPassword.passwordMustBeAtLeast'));
      return;
    }

    const matchResult = passwordsMatch(password, confirmPassword, locale);
    if (!matchResult.isValid) {
      setError(matchResult.error || '');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('forgotPassword.resetFailed'));
      }

      // Clear session storage
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('resetPhone');
        }
      } catch {
        // Ignore sessionStorage errors
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('forgotPassword.resetFailed');
      if (errorMessage.includes('session expired') || errorMessage.includes('verify your phone')) {
        setError(t('forgotPassword.sessionExpiredPleaseStartOver'));
        setTimeout(() => {
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('resetPhone');
            }
          } catch {
            // Ignore sessionStorage errors
          }
          router.push('/forgot-password');
        }, 2000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success State
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-neutral-500/50 flex items-center justify-center p-4">
        <Card variant="glass" size="xl" className="w-full max-w-[440px] shadow-xl">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <IconBadge icon={Check} variant="success" size="xl" />
          </div>

          {/* Title */}
          <h2 className="text-[26px] font-bold text-center text-neutral-900 dark:text-white mb-2">
            {t('forgotPassword.passwordReset')}
          </h2>

          {/* Subtitle */}
          <p className="text-center text-neutral-500 dark:text-neutral-400 text-[15px] mb-8">
            {t('forgotPassword.yourPasswordHasBeenSuccessfully')}
          </p>

          {/* Sign In Button */}
          <Button
            onClick={() => {
              router.push('/');
              setTimeout(() => openLoginModal(), 100);
            }}
            size="lg"
            className="w-full"
          >
            {t('forgotPassword.signIn')}
          </Button>
        </Card>
      </div>
    );
  }

  // Determine password strength indicator variant
  const getProgressVariant = () => {
    if (passwordStrengthData.strength <= 2) return 'danger';
    if (passwordStrengthData.strength <= 3) return 'warning';
    return 'success';
  };

  return (
    <div className="min-h-screen bg-neutral-500/50 flex items-center justify-center p-4">
      <Card variant="glass" size="xl" className="w-full max-w-[440px] shadow-xl">
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <IconBadge icon={Lock} variant="accent" size="xl" />
        </div>

        {/* Title */}
        <h2 className="text-[26px] font-bold text-center text-neutral-900 dark:text-white mb-2">
          {t('forgotPassword.newPassword')}
        </h2>

        {/* Subtitle */}
        <p className="text-center text-neutral-500 dark:text-neutral-400 text-[15px] mb-8">
          {t('forgotPassword.enterANewPasswordFor')}
        </p>

        {/* Error Message */}
        {error && (
          <Alert variant="error" size="sm" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <PasswordInput
              label={locale === 'ka' ? 'ახალი პაროლი' : 'New Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('forgotPassword.enterNewPassword')}
              size="lg"
              autoComplete="new-password"
              autoFocus
            />

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-3 flex items-center gap-2">
                <Progress
                  value={(passwordStrengthData.strength / 5) * 100}
                  size="sm"
                  indicatorVariant={getProgressVariant()}
                  className="flex-1"
                />
                <span
                  className="text-xs font-medium whitespace-nowrap"
                  style={{ color: passwordStrengthData.color }}
                >
                  {passwordStrengthData.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <PasswordInput
              label={t('forgotPassword.confirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('forgotPassword.confirmNewPassword')}
              size="lg"
              autoComplete="new-password"
              variant={confirmPassword && password !== confirmPassword ? 'error' : 'default'}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-2 text-xs text-red-500">{t('forgotPassword.passwordsDoNotMatch')}</p>
            )}
            {confirmPassword && password === confirmPassword && password.length > 0 && (
              <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
                <Check className="w-4 h-4" />
                {t('forgotPassword.passwordsMatch')}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!password || !confirmPassword || password !== confirmPassword}
            loading={isLoading}
            size="lg"
            className="w-full"
          >
            {t('forgotPassword.resetPassword')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
