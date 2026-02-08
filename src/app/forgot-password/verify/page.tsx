'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { OTPInput } from '@/components/ui/OTPInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function VerifyResetCodePage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

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

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

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
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('forgotPassword.resendFailed'));
      }

      setCanResend(false);
      setCountdown(60);
      setCode('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('forgotPassword.resendFailed');
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 4) {
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
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('forgotPassword.invalidCode'));
      }

      // Navigate to reset page (phone is already in sessionStorage)
      router.push('/forgot-password/reset');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('forgotPassword.invalidCode');
      setError(errorMessage);
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  // Mask phone number - show first few and last 2 digits
  const maskedPhone = phone ? phone.replace(/^(\+\d{1,3})(\d{2,3})(.*)(\d{2})$/, '$1 $2*** ***$4') : '';

  return (
    <div className="min-h-screen bg-neutral-500/50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <Card variant="glass" size="xl" className="w-full max-w-[440px] shadow-xl">
        {/* Shield Icon */}
        <div className="flex justify-center mb-6">
          <IconBadge icon={ShieldCheck} variant="accent" size="xl" />
        </div>

        {/* Title */}
        <h2 className="text-[26px] font-bold text-center text-neutral-900 dark:text-white mb-2">
          {t('forgotPassword.verifyCode')}
        </h2>

        {/* Subtitle */}
        <p className="text-center text-neutral-500 dark:text-neutral-400 text-[15px] mb-8">
          {t('forgotPassword.codeSentTo')}{' '}
          <span className="font-medium text-neutral-700 dark:text-neutral-300">{maskedPhone}</span>
        </p>

        {/* Error Message */}
        {error && (
          <Alert variant="error" size="sm" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input */}
          <OTPInput
            label={t('forgotPassword.enter4digitCode')}
            length={4}
            value={code}
            onChange={setCode}
            size="lg"
            autoFocus
          />

          {/* Delay hint */}
          <p className="text-xs text-neutral-400 text-center leading-relaxed">
            {t('common.otpMayBeDelayed')}
          </p>

          {/* Timer and Resend */}
          <div className="text-center">
            {canResend ? (
              <Button
                type="button"
                variant="link"
                onClick={handleResend}
                disabled={isResending}
                className="p-0 h-auto"
              >
                {isResending
                  ? (t('forgotPassword.resending'))
                  : (t('forgotPassword.resendCode'))}
              </Button>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('forgotPassword.resendIn')}{' '}
                <span className="font-medium text-[#C47B65]">{countdown}s</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={code.length !== 4}
            loading={isLoading}
            size="lg"
            className="w-full"
          >
            {locale === 'ka' ? 'კოდის დადასტურება' : 'Verify Code'}
          </Button>
        </form>

        {/* OR Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
          <span className="px-4 text-sm text-neutral-400">OR</span>
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* Change Phone Link */}
        <p className="text-center text-[15px] text-neutral-600 dark:text-neutral-400">
          {t('forgotPassword.wrongNumber')}{' '}
          <Button
            variant="link"
            onClick={() => {
              try {
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('resetPhone');
                }
              } catch {
                // Ignore sessionStorage errors
              }
              router.push('/forgot-password');
            }}
            className="p-0 h-auto font-semibold"
          >
            {t('forgotPassword.changeNumber')}
          </Button>
        </p>
      </Card>
    </div>
  );
}
