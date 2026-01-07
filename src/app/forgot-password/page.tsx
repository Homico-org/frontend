'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { countries, CountryCode, useLanguage } from '@/contexts/LanguageContext';
import { Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('GE');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || phone.length < 5) {
      setError(locale === 'ka' ? 'გთხოვთ შეიყვანოთ სწორი ტელეფონის ნომერი' : 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);

    const fullPhone = `${countries[phoneCountry].phonePrefix}${phone.replace(/\s/g, '')}`;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('forgotPassword.sendFailed'));
      }

      // Store phone for the next step and navigate
      sessionStorage.setItem('resetPhone', fullPhone);
      router.push('/forgot-password/verify');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage === 'Failed to fetch' || (err instanceof Error && err.name === 'TypeError')) {
        setError(t('forgotPassword.networkError'));
      } else if (errorMessage.includes('No account found')) {
        setError(locale === 'ka' ? 'ამ ნომრით ანგარიში ვერ მოიძებნა' : 'No account found with this phone number');
      } else if (errorMessage.includes('region')) {
        setError(locale === 'ka' ? 'SMS ვერიფიკაცია ამ რეგიონისთვის მიუწვდომელია' : 'SMS verification is not available for this region');
      } else {
        setError(errorMessage || t('forgotPassword.sendFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-500/50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <Card variant="glass" size="xl" className="w-full max-w-[440px] shadow-xl">
        {/* Key Icon */}
        <div className="flex justify-center mb-6">
          <IconBadge icon={Key} variant="accent" size="xl" />
        </div>

        {/* Title */}
        <h2 className="text-[26px] font-bold text-center text-neutral-900 dark:text-white mb-2">
          {locale === 'ka' ? 'პაროლის აღდგენა' : 'Forgot Password'}
        </h2>

        {/* Subtitle */}
        <p className="text-center text-neutral-500 dark:text-neutral-400 text-[15px] mb-8">
          {locale === 'ka' ? 'შეიყვანეთ თქვენი ტელეფონის ნომერი კოდის მისაღებად.' : 'Enter your phone number to receive a reset code.'}
        </p>

        {/* Error Message */}
        {error && (
          <Alert variant="error" size="sm" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Phone Input with Country Selector */}
          <PhoneInput
            label={locale === 'ka' ? 'ტელეფონის ნომერი' : 'Phone Number'}
            value={phone}
            onChange={setPhone}
            country={phoneCountry}
            onCountryChange={setPhoneCountry}
            size="lg"
            autoFocus
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!phone}
            loading={isLoading}
            size="lg"
            className="w-full"
          >
            {locale === 'ka' ? 'კოდის გაგზავნა' : 'Send Reset Code'}
          </Button>
        </form>

        {/* OR Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
          <span className="px-4 text-sm text-neutral-400">OR</span>
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
        </div>

        {/* Back to Login Link */}
        <p className="text-center text-[15px] text-neutral-600 dark:text-neutral-400">
          {locale === 'ka' ? 'გახსოვს პაროლი?' : 'Remember your password?'}{' '}
          <Button
            variant="link"
            onClick={() => {
              router.push('/');
              setTimeout(() => openLoginModal(), 100);
            }}
            className="p-0 h-auto font-semibold"
          >
            {locale === 'ka' ? 'შესვლა' : 'Sign In'}
          </Button>
        </p>
      </Card>
    </div>
  );
}
