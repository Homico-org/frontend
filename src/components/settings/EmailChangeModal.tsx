'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OTPInput } from '@/components/ui/OTPInput';
import { validateEmail } from '@/utils/validationUtils';
import { Check, CheckCircle2, ChevronRight, Mail, Send, X } from 'lucide-react';
import { useState } from 'react';

import { useLanguage } from "@/contexts/LanguageContext";
interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  locale: string;
  onSuccess: (newEmail: string) => void;
}

export default function EmailChangeModal({
  isOpen,
  onClose,
  currentEmail,
  locale,
  onSuccess,
}: EmailChangeModalProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');

  const { t } = useLanguage();
  const [newEmail, setNewEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const handleSendOtp = async () => {
    if (!validateEmail(newEmail)) {
      setError(t('settings.invalidEmailFormat'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      // Step 1: Set pending email
      const addRes = await fetch(`${API_URL}/users/add-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });

      if (!addRes.ok) {
        const data = await addRes.json();
        setError(data.message || (t('settings.failedToAddEmail')));
        return;
      }

      // Step 2: Send OTP to the new email
      const otpRes = await fetch(`${API_URL}/verification/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: newEmail, type: 'email' }),
      });

      if (otpRes.ok) {
        setStep('otp');
      } else {
        const data = await otpRes.json();
        setError(data.message || (t('settings.failedToSendCode')));
      }
    } catch {
      setError(t('settings.connectionError'));
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

      // Step 1: Verify the OTP code
      const verifyRes = await fetch(`${API_URL}/verification/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: newEmail, code: otpCode, type: 'email' }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setError(data.message || (t('settings.invalidCode')));
        return;
      }

      // Step 2: Confirm the email change
      const confirmRes = await fetch(`${API_URL}/users/verify-email-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (confirmRes.ok) {
        setStep('success');
        onSuccess(newEmail);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        const data = await confirmRes.json();
        setError(data.message || (t('settings.failedToConfirmEmail')));
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

      await fetch(`${API_URL}/verification/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: newEmail, type: 'email' }),
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setNewEmail('');
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
        onClick={() => step === 'email' && handleClose()}
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
                <Mail className="w-5 h-5 text-[#E07B4F]" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {step === 'success'
                    ? (t('settings.successfullyUpdated'))
                    : step === 'otp'
                      ? (t('settings.verifyEmail'))
                      : currentEmail
                        ? (t('settings.changeEmail'))
                        : (t('settings.addEmail'))}
                </h3>
                {step === 'otp' && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {locale === 'ka' ? `კოდი გაიგზავნა ${newEmail}-ზე` : `Code sent to ${newEmail}`}
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
                {t('settings.yourEmailHasBeenUpdated')}
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
                  {t('settings.4digitCode')}
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
                  {t('settings.resendCode')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep('email');
                    setOtpCode('');
                  }}
                >
                  {t('settings.changeEmail')}
                </Button>
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={isLoading || otpCode.length !== 4}
                loading={isLoading}
                className="w-full"
                leftIcon={<Check className="w-4 h-4" />}
              >
                {t('settings.verify')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {currentEmail
                  ? (t('settings.enterYourNewEmailA'))
                  : (t('settings.addYourEmailToReceive'))}
              </p>

              {currentEmail && (
                <div className="p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                  <Mail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {t('settings.currentEmail')}
                    </p>
                    <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {currentEmail}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="error" size="sm">
                  {error}
                </Alert>
              )}

              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t('settings.enterYourEmail')}
                autoFocus
              />

              <Button
                onClick={handleSendOtp}
                disabled={isLoading || !newEmail}
                loading={isLoading}
                className="w-full"
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                {t('common.continue')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

