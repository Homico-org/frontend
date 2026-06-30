'use client';

import { Button } from '@/components/ui/button';
import { OTPInput } from '@/components/ui/OTPInput';
import { PhoneInput } from '@/components/ui/PhoneInput';
import {
  useAttachPhone,
  useGooglePhoneGate,
} from '@/contexts/GooglePhoneGateContext';
import { countries, useLanguage } from '@/contexts/LanguageContext';
import { isValidPhone } from '@/utils/phoneValidation';
import { Shield, Smartphone } from 'lucide-react';

/**
 * Full-screen, non-dismissible "add + verify your phone" screen shown
 * after a Google sign-up. Mounted at the layout level: when the gate is
 * active it renders INSTEAD of the app, so the user can't navigate
 * anywhere until the phone is verified. There is intentionally no close
 * button and no logout — the only exit is completing verification.
 */
export default function GooglePhoneGate() {
  const { isGateActive } = useGooglePhoneGate();
  const { t } = useLanguage();
  const att = useAttachPhone();

  if (!isGateActive) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-4 overflow-y-auto"
      style={{ backgroundColor: 'var(--hm-bg-page)' }}
    >
      <div className="w-full max-w-sm mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--hm-brand-500)]/10 flex items-center justify-center mx-auto mb-4">
            {att.showOtp ? (
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--hm-brand-500)]" />
            ) : (
              <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--hm-brand-500)]" />
            )}
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-[var(--hm-fg-primary)] mb-1 sm:mb-2">
            {att.showOtp
              ? t('auth.googleVerifyPhoneTitle')
              : t('auth.googleAddPhoneTitle')}
          </h1>
          <p className="text-xs sm:text-base text-[var(--hm-fg-muted)]">
            {att.showOtp ? (
              <>
                {t('auth.googleVerifyPhoneSubtitle')}{' '}
                <span className="font-medium text-[var(--hm-fg-primary)] break-all">
                  {countries[att.phoneCountry].phonePrefix}
                  {att.phone}
                </span>
              </>
            ) : (
              t('auth.googleAddPhoneSubtitle')
            )}
          </p>
        </div>

        {/* Error */}
        {att.error && (
          <div className="mb-4 sm:mb-6 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--hm-error-50)] border border-red-100 text-xs sm:text-sm text-[var(--hm-error-500)] text-center">
            {att.error}
          </div>
        )}

        {att.showOtp ? (
          <>
            <div className="mb-4 sm:mb-6">
              <OTPInput
                length={4}
                value={att.otp}
                onChange={att.setOtp}
                onComplete={(code) => att.verifyAndAttach(code)}
              />
            </div>

            <p className="text-[11px] sm:text-xs text-[var(--hm-fg-muted)] text-center mb-4 sm:mb-6 leading-relaxed px-2">
              {t('common.otpMayBeDelayed')}
            </p>

            <div className="text-center">
              {att.resendTimer > 0 ? (
                <p className="text-xs sm:text-sm text-[var(--hm-fg-muted)]">
                  {t('forgotPassword.resendIn')} {att.resendTimer}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={att.sendOtp}
                  disabled={att.isLoading}
                  className="text-xs sm:text-sm font-medium text-[var(--hm-brand-500)] hover:text-[var(--hm-brand-600)] active:scale-95 transition-all p-2 -m-2"
                >
                  {t('register.resendCode')}
                </button>
              )}
            </div>

            {/* Allow editing the number again */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  att.setShowOtp(false);
                  att.setOtp('');
                  att.setError('');
                }}
                className="text-xs sm:text-sm text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)] transition-colors p-1"
              >
                {t('common.back')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 sm:mb-6">
              <PhoneInput
                value={att.phone}
                onChange={att.setPhone}
                country={att.phoneCountry}
                onCountryChange={att.setPhoneCountry}
                placeholder={countries[att.phoneCountry].placeholder}
              />
            </div>

            <Button
              onClick={att.sendOtp}
              disabled={att.isLoading || !isValidPhone(att.phone, att.phoneCountry)}
              loading={att.isLoading}
              className="w-full h-10 sm:h-11 text-sm sm:text-base"
              size="lg"
            >
              {t('register.sendCode')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
