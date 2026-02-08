'use client';

import { Button } from '@/components/ui/button';
import { OTPInput } from '@/components/ui/OTPInput';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { CountryCode, useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, MessageCircle, Shield, Smartphone } from 'lucide-react';
import type { VerificationChannel } from '../hooks/useRegistration';

interface StepPhoneProps {
  phone: string;
  onPhoneChange: (value: string) => void;
  phoneCountry: CountryCode;
  onCountryChange: (code: CountryCode) => void;
  verificationChannel: VerificationChannel;
  onChannelChange: (channel: VerificationChannel) => void;
  showOtp: boolean;
  otp: string;
  onOtpChange: (value: string) => void;
  onOtpComplete: (code: string) => void;
  onSendCode: () => void;
  onBack: () => void;
  resendTimer: number;
  onResend: () => void;
  isLoading: boolean;
  error?: string;
}

export default function StepPhone({
  phone,
  onPhoneChange,
  phoneCountry,
  onCountryChange,
  verificationChannel,
  onChannelChange,
  showOtp,
  otp,
  onOtpChange,
  onOtpComplete,
  onSendCode,
  onBack,
  resendTimer,
  onResend,
  isLoading,
  error,
}: StepPhoneProps) {
  const { t } = useLanguage();

  // OTP verification screen
  if (showOtp) {
    return (
      <div className="w-full max-w-sm mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-5 sm:mb-8 -ml-1 p-1"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {t('common.back')}
        </button>

        {/* Header */}
        <div className="text-center mb-5 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#C4735B]/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-[#C4735B]" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">
            {t('register.verification')}
          </h1>
          <p className="text-xs sm:text-base text-neutral-500">
            {t('register.codeSentTo')} <span className="font-medium text-neutral-900 break-all">{phone}</span>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 sm:mb-6 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-red-50 border border-red-100 text-xs sm:text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        {/* OTP Input */}
        <div className="mb-4 sm:mb-6">
          <OTPInput
            length={4}
            value={otp}
            onChange={onOtpChange}
            onComplete={onOtpComplete}
          />
        </div>

        {/* Delay hint */}
        <p className="text-[11px] sm:text-xs text-neutral-400 text-center mb-4 sm:mb-6 leading-relaxed px-2">
          {t('common.otpMayBeDelayed')}
        </p>

        {/* Resend */}
        <div className="text-center">
          {resendTimer > 0 ? (
            <p className="text-xs sm:text-sm text-neutral-400">
              {t('forgotPassword.resendIn')} {resendTimer}s
            </p>
          ) : (
            <button
              onClick={onResend}
              disabled={isLoading}
              className="text-xs sm:text-sm font-medium text-[#C4735B] hover:text-[#A85D47] active:scale-95 transition-all p-2 -m-2"
            >
              {t('register.resendCode')}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Phone input screen
  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="text-center mb-5 sm:mb-8">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#C4735B]/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-[#C4735B]" />
        </div>
        <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">
          {t('register.phoneNumber')}
        </h1>
        <p className="text-xs sm:text-base text-neutral-500">
          {t('register.enterPhoneToVerify')}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 sm:mb-6 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-red-50 border border-red-100 text-xs sm:text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Phone Input */}
      <div className="mb-4 sm:mb-6">
        <PhoneInput
          value={phone}
          onChange={onPhoneChange}
          country={phoneCountry}
          onCountryChange={onCountryChange}
        />
      </div>

      {/* Channel Selection */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          type="button"
          onClick={() => onChannelChange('sms')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl border-2 text-sm font-medium transition-all active:scale-[0.98] ${
            verificationChannel === 'sms'
              ? 'border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]'
              : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          SMS
        </button>
        <button
          type="button"
          onClick={() => onChannelChange('whatsapp')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl border-2 text-sm font-medium transition-all active:scale-[0.98] ${
            verificationChannel === 'whatsapp'
              ? 'border-[#25D366] bg-[#25D366]/5 text-[#25D366]'
              : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          WhatsApp
        </button>
      </div>

      {/* Send Code Button */}
      <Button
        onClick={onSendCode}
        disabled={isLoading || phone.length < 9}
        loading={isLoading}
        className="w-full h-10 sm:h-11 text-sm sm:text-base"
        size="lg"
      >
        {t('register.sendCode')}
      </Button>
    </div>
  );
}
