'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function VerifyResetCodePage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedPhone = sessionStorage.getItem('resetPhone');
    if (!storedPhone) {
      router.push('/forgot-password');
      return;
    }
    setPhone(storedPhone);
    // Focus first input
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [router]);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    inputRefs.current[Math.min(pastedData.length, 3)]?.focus();
  };

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
      setCode(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('forgotPassword.resendFailed');
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
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
        body: JSON.stringify({ phone, code: fullCode }),
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
      setCode(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Mask phone number - show first few and last 2 digits
  const maskedPhone = phone ? phone.replace(/^(\+\d{1,3})(\d{2,3})(.*)(\d{2})$/, '$1 $2*** ***$4') : '';

  return (
    <div className="min-h-screen bg-neutral-500/50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="w-full max-w-[440px] bg-white rounded-[20px] shadow-xl overflow-hidden">
        {/* Content */}
        <div className="px-10 pt-12 pb-10">
          {/* Shield Icon in Circle */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-[#F9E4DE] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#C47B65]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-[26px] font-bold text-center text-neutral-900 mb-2">
            {locale === 'ka' ? 'კოდის დადასტურება' : 'Verify Code'}
          </h2>

          {/* Subtitle */}
          <p className="text-center text-neutral-500 text-[15px] mb-8">
            {locale === 'ka' ? 'კოდი გაგზავნილია' : 'Code sent to'}{' '}
            <span className="font-medium text-neutral-700">{maskedPhone}</span>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-4 text-center">
                {locale === 'ka' ? 'შეიყვანეთ 4-ნიშნა კოდი' : 'Enter 4-digit code'}
              </label>
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-semibold rounded-xl bg-[#F5F5F5] border-0 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#C47B65]/30 transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Timer and Resend */}
            <div className="text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-sm text-[#C47B65] hover:text-[#B36A55] font-medium transition-colors disabled:opacity-50"
                >
                  {isResending
                    ? (locale === 'ka' ? 'იგზავნება...' : 'Resending...')
                    : (locale === 'ka' ? 'კოდის ხელახლა გაგზავნა' : 'Resend Code')}
                </button>
              ) : (
                <p className="text-sm text-neutral-500">
                  {locale === 'ka' ? 'ხელახლა გაგზავნა' : 'Resend in'}{' '}
                  <span className="font-medium text-[#C47B65]">{countdown}s</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || code.some(d => !d)}
              className="w-full h-[52px] bg-[#C47B65] hover:bg-[#B36A55] text-white font-semibold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {locale === 'ka' ? 'მოწმდება...' : 'Verifying...'}
                </span>
              ) : (
                <span>{locale === 'ka' ? 'კოდის დადასტურება' : 'Verify Code'}</span>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-neutral-200"></div>
            <span className="px-4 text-sm text-neutral-400">OR</span>
            <div className="flex-1 h-px bg-neutral-200"></div>
          </div>

          {/* Change Phone Link */}
          <p className="text-center text-[15px] text-neutral-600">
            {locale === 'ka' ? 'სხვა ნომერი?' : 'Wrong number?'}{' '}
            <button
              onClick={() => {
                sessionStorage.removeItem('resetPhone');
                router.push('/forgot-password');
              }}
              className="font-semibold text-[#C47B65] hover:text-[#B36A55] transition-colors"
            >
              {locale === 'ka' ? 'შეცვლა' : 'Change Number'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
