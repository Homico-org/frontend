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

// Logo component
function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <Image src="/icon.svg" alt="Homico" width={120} height={30} className="h-7 w-auto" />
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
        <header className="p-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <LanguageSelector variant="compact" />
            <Link href="/help" className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors">
              {t('common.help')}
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => reg.openLoginModal()}
            >
              {t('register.logIn')}
            </Button>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-3xl text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
              {t('register.joinHomico')}
            </h1>
            <p className="text-neutral-500 mb-8">
              {t('register.chooseHowYouWantTo')}
            </p>
            
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] px-4">
        <Card className="w-full max-w-md p-6 text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            {t('register.verification')}
              </h2>
          <p className="text-sm text-neutral-500 mb-6">
            {reg.locale === 'ka' 
              ? `კოდი გამოგზავნილია ${reg.formData.phone}-ზე`
              : `Code sent to ${reg.formData.phone}`
            }
          </p>
          
          {reg.error && (
                  <Alert variant="error" size="sm" className="mb-4">
              {reg.error}
                  </Alert>
                )}

          <OTPInput
            length={4}
            value={reg.phoneOtp.join('')}
            onChange={(value) => reg.setPhoneOtp(value.split(''))}
            onComplete={(code) => reg.verifyOtp(code)}
          />
          
          <div className="mt-4 flex items-center justify-center gap-2">
            {reg.resendTimer > 0 ? (
              <span className="text-sm text-neutral-400">
                {reg.locale === 'ka' ? `ხელახლა გაგზავნა ${reg.resendTimer} წმ` : `Resend in ${reg.resendTimer}s`}
                    </span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reg.sendOtp()}
                disabled={reg.isLoading}
              >
                {t('register.resendCode')}
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => reg.setShowVerification(false)}
          >
            {reg.locale === 'ka' ? '← უკან' : '← Back'}
          </Button>
        </Card>
      </div>
    );
  }

  // Client registration - simplified single-step
  if (reg.userType === 'client') {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
        <header className="p-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <LanguageSelector variant="compact" />
            <Link href="/help" className="text-xs text-neutral-600 hover:text-neutral-900">
              {t('common.help')}
            </Link>
          </div>
        </header>

        <main className="flex-1 py-4 lg:py-6">
          <div className="max-w-lg mx-auto px-4">
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
