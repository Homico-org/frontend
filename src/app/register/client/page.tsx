'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRegistration } from '@/components/register/hooks';
import { StepAccount } from '@/components/register/steps';
import LanguageSelector from '@/components/common/LanguageSelector';
import { OTPInput } from '@/components/ui/OTPInput';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

function ClientRegisterContent() {
  const reg = useRegistration({ initialUserType: 'client', skipTypeSelection: true });
  const { t } = useLanguage();
  const router = useRouter();

  if (reg.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <LoadingSpinner size="xl" variant="border" color="#C4735B" />
      </div>
    );
  }

  // OTP Verification overlay
  if (reg.showVerification) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAF9]">
        <header className="px-3 sm:px-4 py-3 sm:py-4 flex items-center">
          <button
            onClick={() => reg.setShowVerification(false)}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('common.back')}</span>
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 pb-8">
          <Card className="w-full max-w-sm p-5 sm:p-6 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#C4735B]/10 to-[#C4735B]/5 flex items-center justify-center">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#C4735B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 mb-1">
              {t('register.verification')}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mb-5 sm:mb-6">
              {reg.locale === 'ka'
                ? `კოდი გამოგზავნილია ${reg.formData.phone}-ზე`
                : `Code sent to ${reg.formData.phone}`
              }
            </p>

            {reg.error && (
              <Alert variant="error" size="sm" className="mb-4 text-left">
                {reg.error}
              </Alert>
            )}

            <OTPInput
              length={4}
              value={reg.phoneOtp.join('')}
              onChange={(value) => reg.setPhoneOtp(value.split(''))}
              onComplete={(code) => reg.verifyOtp(code)}
            />

            <div className="mt-4 sm:mt-5 flex items-center justify-center">
              {reg.resendTimer > 0 ? (
                <span className="text-xs sm:text-sm text-neutral-400">
                  {reg.locale === 'ka' ? `ხელახლა გაგზავნა ${reg.resendTimer} წმ` : `Resend in ${reg.resendTimer}s`}
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => reg.sendOtp()}
                  disabled={reg.isLoading}
                  className="text-xs sm:text-sm"
                >
                  {t('register.resendCode')}
                </Button>
              )}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-lg mx-auto px-3 sm:px-4">
          <div className="h-12 sm:h-14 flex items-center justify-between">
            <button
              onClick={() => router.push('/register')}
              className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">{t('common.back')}</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSelector variant="compact" />
              <Link
                href="/help"
                className="hidden sm:block text-xs text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                {t('common.help')}
              </Link>
              <Link
                href="/help"
                className="sm:hidden w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
              >
                <HelpCircle className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-4 sm:py-6">
        <div className="max-w-lg mx-auto px-3 sm:px-4">
          <StepAccount
            locale={reg.locale}
            userType="client"
            authMethod={reg.authMethod}
            setAuthMethod={reg.setAuthMethod}
            formData={reg.formData}
            handleInputChange={reg.handleInputChange}
            error={reg.error}
            isLoading={reg.isLoading}
            repeatPassword={reg.repeatPassword}
            setRepeatPassword={reg.setRepeatPassword}
            showPassword={reg.showPassword}
            setShowPassword={reg.setShowPassword}
            showRepeatPassword={reg.showRepeatPassword}
            setShowRepeatPassword={reg.setShowRepeatPassword}
            agreedToTerms={reg.agreedToTerms}
            setAgreedToTerms={reg.setAgreedToTerms}
            phoneCountry={reg.phoneCountry}
            setPhoneCountry={reg.setPhoneCountry}
            showCountryDropdown={reg.showCountryDropdown}
            setShowCountryDropdown={reg.setShowCountryDropdown}
            verificationChannel={reg.verificationChannel}
            setVerificationChannel={reg.setVerificationChannel}
            avatarPreview={null}
            avatarUploading={false}
            uploadedAvatarUrl={null}
            avatarInputRef={{ current: null }}
            handleAvatarSelect={() => {}}
            removeAvatar={() => {}}
            canProceed={reg.canProceedFromAccount()}
            onNext={reg.handleNext}
            onSwitchType={() => router.push('/register')}
          />
        </div>
      </main>
    </div>
  );
}

export default function ClientRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <LoadingSpinner size="xl" variant="border" color="#C4735B" />
        </div>
      }
    >
      <ClientRegisterContent />
    </Suspense>
  );
}
