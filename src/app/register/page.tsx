'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRegistration } from '@/components/register/hooks';
import { StepAccount } from '@/components/register/steps';
import UserTypeSelector from '@/components/register/UserTypeSelector';
import ProRegistration from '@/components/register/ProRegistration';
import LanguageSelector from '@/components/common/LanguageSelector';
import { OTPInput } from '@/components/ui/OTPInput';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, HelpCircle } from 'lucide-react';

// Logo component
function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <span className="flex items-center gap-2">
        <Image src="/favicon.png" alt="Homico" width={28} height={28} className="h-7 w-7 rounded-[8px]" />
        <span className="text-[18px] font-semibold tracking-wide text-neutral-900 dark:text-white">
          Homico
        </span>
      </span>
    </Link>
  );
}

function RegisterContent() {
  const reg = useRegistration();
  const { t } = useLanguage();

  // Show loading while auth is checking
  if (reg.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <LoadingSpinner size="xl" variant="border" color="#C4735B" />
      </div>
    );
  }

  // Type selection screen
  if (reg.showTypeSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FBF9F7] via-[#FAF8F5] to-[#F5F0EC] flex flex-col">
        {/* Header - Mobile optimized */}
        <header className="px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="compact" />
            <Link
              href="/help"
              className="hidden sm:block text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              {t('common.help')}
            </Link>
            <Link
              href="/help"
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => reg.openLoginModal()}
              className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
            >
              {t('register.logIn')}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
          <div className="w-full max-w-3xl">
            {/* Title - Mobile optimized */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 mb-1 sm:mb-2">
                {t('register.joinHomico')}
              </h1>
              <p className="text-sm sm:text-base text-neutral-500">
                {t('register.chooseHowYouWantTo')}
              </p>
            </div>

            <UserTypeSelector
              onSelect={(type) => {
                reg.setUserType(type);
                reg.setShowTypeSelection(false);
              }}
              locale={reg.locale as 'en' | 'ka' | 'ru'}
            />
          </div>
        </main>
      </div>
    );
  }

  // OTP Verification overlay
  if (reg.showVerification) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAF9]">
        {/* Header with back button */}
        <header className="px-3 sm:px-4 py-3 sm:py-4 flex items-center">
          <button
            onClick={() => reg.setShowVerification(false)}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('common.back')}</span>
          </button>
        </header>

        {/* OTP Form - Centered */}
        <main className="flex-1 flex items-center justify-center px-4 pb-8">
          <Card className="w-full max-w-sm p-5 sm:p-6 text-center">
            {/* Icon */}
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

  // Client registration - simplified single-step
  if (reg.userType === 'client') {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
        {/* Header - Mobile optimized */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-neutral-100">
          <div className="max-w-lg mx-auto px-3 sm:px-4">
            <div className="h-12 sm:h-14 flex items-center justify-between">
              {/* Back button */}
              <button
                onClick={() => reg.setShowTypeSelection(true)}
                className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">{t('common.back')}</span>
              </button>

              {/* Right side */}
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

        {/* Main Content */}
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
              onSwitchType={() => reg.setShowTypeSelection(true)}
            />
          </div>
        </main>
      </div>
    );
  }

  // Pro registration - new simplified flow
  return (
    <ProRegistration
      onSwitchToClient={() => reg.setShowTypeSelection(true)}
    />
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <LoadingSpinner size="xl" variant="border" color="#C4735B" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
