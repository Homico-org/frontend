'use client';

import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage, countries, CountryCode } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('GE');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

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
      <div className="w-full max-w-[440px] bg-white rounded-[20px] shadow-xl overflow-hidden">
        {/* Content */}
        <div className="px-10 pt-12 pb-10">
          {/* Key Icon in Circle */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-[#F9E4DE] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#C47B65]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-[26px] font-bold text-center text-neutral-900 mb-2">
            {locale === 'ka' ? 'პაროლის აღდგენა' : 'Forgot Password'}
          </h2>

          {/* Subtitle */}
          <p className="text-center text-neutral-500 text-[15px] mb-8">
            {locale === 'ka' ? 'შეიყვანეთ თქვენი ტელეფონის ნომერი კოდის მისაღებად.' : 'Enter your phone number to receive a reset code.'}
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
            {/* Phone Input with Country Selector */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                {locale === 'ka' ? 'ტელეფონის ნომერი' : 'Phone Number'}
              </label>
              <div className="flex gap-2">
                {/* Country Selector */}
                <div className="relative" ref={countryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="h-[52px] px-3 bg-[#F5F5F5] rounded-xl flex items-center gap-2 hover:bg-neutral-200 transition-colors"
                  >
                    <span className="text-lg">{countries[phoneCountry].flag}</span>
                    <span className="text-sm font-medium text-neutral-600">{countries[phoneCountry].phonePrefix}</span>
                    <svg className={`w-4 h-4 text-neutral-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-neutral-100 py-1 z-50 max-h-60 overflow-y-auto">
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
                          <span className="text-lg">{countries[code].flag}</span>
                          <span className="text-sm font-medium text-neutral-700 flex-1 text-left">{countries[code].name}</span>
                          <span className="text-xs text-neutral-500">{countries[code].phonePrefix}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone Input */}
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                  className="flex-1 h-[52px] px-4 bg-[#F5F5F5] border-0 rounded-xl text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C47B65]/30 transition-all"
                  placeholder={countries[phoneCountry].placeholder}
                  autoComplete="tel"
                  autoFocus
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !phone}
              className="w-full h-[52px] bg-[#C47B65] hover:bg-[#B36A55] text-white font-semibold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {locale === 'ka' ? 'იგზავნება...' : 'Sending...'}
                </span>
              ) : (
                <span>{locale === 'ka' ? 'კოდის გაგზავნა' : 'Send Reset Code'}</span>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-neutral-200"></div>
            <span className="px-4 text-sm text-neutral-400">OR</span>
            <div className="flex-1 h-px bg-neutral-200"></div>
          </div>

          {/* Back to Login Link */}
          <p className="text-center text-[15px] text-neutral-600">
            {locale === 'ka' ? 'გახსოვს პაროლი?' : 'Remember your password?'}{' '}
            <button
              onClick={() => {
                router.push('/');
                setTimeout(() => openLoginModal(), 100);
              }}
              className="font-semibold text-[#C47B65] hover:text-[#B36A55] transition-colors"
            >
              {locale === 'ka' ? 'შესვლა' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
