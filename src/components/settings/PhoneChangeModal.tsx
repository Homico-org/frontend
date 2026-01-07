'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OTPInput } from '@/components/ui/OTPInput';
import PhoneInput, { CountryCode } from '@/components/ui/PhoneInput';
import { countries } from '@/contexts/LanguageContext';
import { Check, CheckCircle2, ChevronRight, Phone, Send, X } from 'lucide-react';
import { useState } from 'react';

interface PhoneChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhone: string;
  locale: string;
  onSuccess: (newPhone: string) => void;
}

export default function PhoneChangeModal({
  isOpen,
  onClose,
  currentPhone,
  locale,
  onSuccess,
}: PhoneChangeModalProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [newPhone, setNewPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState({ code: '+995', flag: '🇬🇪' });
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const fullPhone = phoneCountry.code + newPhone;

  const handleSendOtp = async () => {
    if (!newPhone || newPhone.length < 6) {
      setError(locale === 'ka' ? 'შეიყვანეთ სწორი ნომერი' : 'Enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/phone/change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: fullPhone }),
      });

      if (res.ok) {
        setStep('otp');
      } else {
        const data = await res.json();
        setError(data.message || (locale === 'ka' ? 'კოდის გაგზავნა ვერ მოხერხდა' : 'Failed to send code'));
      }
    } catch {
      setError(locale === 'ka' ? 'კავშირის შეცდომა' : 'Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 4) return;

    setIsLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/phone/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: fullPhone, code: otpCode }),
      });

      if (res.ok) {
        setStep('success');
        onSuccess(fullPhone);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.message || (locale === 'ka' ? 'არასწორი კოდი' : 'Invalid code'));
      }
    } catch {
      setError(locale === 'ka' ? 'კავშირის შეცდომა' : 'Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      await fetch(`${API_URL}/users/phone/change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: fullPhone }),
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleClose = () => {
    setStep('phone');
    setNewPhone('');
    setOtpCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => step === 'phone' && handleClose()}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#E07B4F]/10">
                <Phone className="w-5 h-5 text-[#E07B4F]" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {step === 'success'
                    ? (locale === 'ka' ? 'წარმატებით შეიცვალა!' : 'Successfully Updated!')
                    : step === 'otp'
                      ? (locale === 'ka' ? 'დაადასტურე ნომერი' : 'Verify Phone')
                      : (locale === 'ka' ? 'ნომრის შეცვლა' : 'Change Phone')}
                </h3>
                {step === 'otp' && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {locale === 'ka' ? `კოდი გაიგზავნა ${fullPhone}-ზე` : `Code sent to ${fullPhone}`}
                  </p>
                )}
              </div>
            </div>
            {step !== 'success' && (
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {step === 'success' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {locale === 'ka'
                  ? 'თქვენი ნომერი წარმატებით განახლდა'
                  : 'Your phone number has been updated successfully'}
              </p>
            </div>
          ) : step === 'otp' ? (
            <div className="space-y-4">
              {error && (
                <Alert variant="error" size="sm">
                  {error}
                </Alert>
              )}

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {locale === 'ka' ? '4-ნიშნა კოდი' : '4-digit code'}
                </label>
                <OTPInput
                  length={4}
                  value={otpCode}
                  onChange={setOtpCode}
                  onComplete={handleVerifyOtp}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={isSendingOtp}
                  leftIcon={isSendingOtp ? <LoadingSpinner size="sm" color="#E07B4F" /> : <Send className="w-4 h-4" />}
                >
                  {locale === 'ka' ? 'ხელახლა გაგზავნა' : 'Resend code'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep('phone');
                    setOtpCode('');
                  }}
                >
                  {locale === 'ka' ? 'ნომრის შეცვლა' : 'Change number'}
                </Button>
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={isLoading || otpCode.length !== 4}
                loading={isLoading}
                className="w-full"
                leftIcon={<Check className="w-4 h-4" />}
              >
                {locale === 'ka' ? 'დადასტურება' : 'Verify'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {locale === 'ka'
                  ? 'შეიყვანე ახალი ნომერი. ვერიფიკაციის კოდი გაიგზავნება SMS-ით.'
                  : 'Enter your new phone number. A verification code will be sent via SMS.'}
              </p>

              {currentPhone && (
                <div className="p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                  <Phone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {locale === 'ka' ? 'მიმდინარე ნომერი' : 'Current number'}
                    </p>
                    <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {currentPhone}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="error" size="sm">
                  {error}
                </Alert>
              )}

              <PhoneInput
                value={newPhone}
                onChange={setNewPhone}
                country={phoneCountry.code as CountryCode}
                onCountryChange={(country: CountryCode) => setPhoneCountry({ code: country, flag: countries[country].flag })}
                placeholder={locale === 'ka' ? 'ახალი ნომერი' : 'New phone number'}
              />

              <Button
                onClick={handleSendOtp}
                disabled={isLoading || !newPhone}
                loading={isLoading}
                className="w-full"
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                {locale === 'ka' ? 'გაგრძელება' : 'Continue'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

