'use client';

import { useProRegistration } from './hooks/useProRegistration';
import { StepPhone, StepProfile, StepSelectServices, StepComplete } from './steps';
import AvatarCropper from '@/components/common/AvatarCropper';
import LanguageSelector from '@/components/common/LanguageSelector';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/Alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const STEP_CONFIG = {
  phone: { index: 0, titleEn: 'Verify Phone', titleKa: 'ტელეფონის ვერიფიკაცია', titleRu: 'Подтверждение телефона' },
  profile: { index: 1, titleEn: 'Your Profile', titleKa: 'თქვენი პროფილი', titleRu: 'Ваш профиль' },
  services: { index: 2, titleEn: 'Your Services', titleKa: 'თქვენი სერვისები', titleRu: 'Ваши услуги' },
  complete: { index: 3, titleEn: 'Complete', titleKa: 'დასრულება', titleRu: 'Завершено' },
};

interface ProRegistrationProps {
  onSwitchToClient: () => void;
}

export default function ProRegistration({ onSwitchToClient }: ProRegistrationProps) {
  const reg = useProRegistration();
  const { t, locale } = useLanguage();

  const currentStepConfig = STEP_CONFIG[reg.currentStep];
  const totalSteps = Object.keys(STEP_CONFIG).length - 1; // Exclude 'complete'
  const progressPercent = ((currentStepConfig.index) / totalSteps) * 100;

  const getStepTitle = () => {
    if (locale === 'ka') return currentStepConfig.titleKa;
    if (locale === 'ru') return currentStepConfig.titleRu;
    return currentStepConfig.titleEn;
  };

  // Show avatar cropper modal
  if (reg.showAvatarCropper && reg.rawAvatarImage) {
    return (
      <AvatarCropper
        image={reg.rawAvatarImage}
        onCropComplete={reg.handleCroppedAvatar}
        onCancel={reg.handleCropCancel}
        locale={locale}
      />
    );
  }

  // Complete screen - full screen success
  if (reg.currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FBF9F7] via-[#FAF8F5] to-[#F5F0EC] flex items-center justify-center p-3 sm:p-4">
        <StepComplete
          fullName={reg.fullName}
          avatarPreview={reg.avatarPreview}
          city={reg.city}
          selectedServices={reg.selectedServices}
          onGoToProfile={reg.onGoToProfile}
          onGoToDashboard={reg.onGoToDashboard}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      {/* Header - Mobile optimized */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-lg mx-auto px-3 sm:px-4">
          {/* Top row */}
          <div className="h-12 sm:h-14 flex items-center justify-between">
            {/* Back / Logo */}
            {reg.currentStep !== 'phone' ? (
              <button
                onClick={reg.handleBack}
                className="flex items-center gap-1.5 sm:gap-2 text-neutral-500 hover:text-neutral-900 transition-colors -ml-1 p-1"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">{t('common.back')}</span>
              </button>
            ) : (
              <Link href="/" className="flex items-center">
                <span className="flex items-center gap-2">
                  <Image src="/favicon.png" alt="Homico" width={24} height={24} className="h-6 w-6 rounded-[7px]" />
                  <span className="text-base font-semibold tracking-wide text-neutral-900 dark:text-white">
                    Homico
                  </span>
                </span>
              </Link>
            )}

            {/* Language & Help */}
            <div className="flex items-center gap-2">
              <LanguageSelector variant="compact" />
              <Link
                href="/help"
                className="hidden sm:block text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
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

          {/* Progress - Compact on mobile */}
          <div className="pb-2.5 sm:pb-3">
            <div className="flex items-center justify-between mb-1 sm:mb-1.5">
              <span className="text-[9px] sm:text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                {currentStepConfig.index + 1}/{totalSteps}
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-[#C4735B] uppercase tracking-wider">
                {getStepTitle()}
              </span>
            </div>
            <Progress value={progressPercent} size="sm" indicatorVariant="gradient" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 px-3 sm:px-4 py-4 sm:py-6 max-w-lg mx-auto w-full">
          {/* Error Alert */}
          {reg.error && (
            <Alert
              variant="error"
              size="sm"
              className="mb-4"
              dismissible
              onDismiss={() => reg.setError('')}
            >
              {reg.error}
            </Alert>
          )}

          {/* Step Content */}
          {reg.currentStep === 'phone' && (
            <StepPhone
              phone={reg.phone}
              onPhoneChange={reg.setPhone}
              phoneCountry={reg.phoneCountry}
              onCountryChange={reg.setPhoneCountry}
              verificationChannel={reg.verificationChannel}
              onChannelChange={reg.setVerificationChannel}
              showOtp={reg.showOtp}
              otp={reg.otp}
              onOtpChange={reg.setOtp}
              onOtpComplete={reg.verifyOtp}
              onSendCode={reg.sendOtp}
              onBack={() => reg.setShowOtp(false)}
              resendTimer={reg.resendTimer}
              onResend={reg.sendOtp}
              isLoading={reg.isLoading}
              error={reg.error}
            />
          )}

          {reg.currentStep === 'profile' && (
            <StepProfile
              fullName={reg.fullName}
              onNameChange={reg.setFullName}
              city={reg.city}
              onCityChange={reg.setCity}
              password={reg.password}
              onPasswordChange={reg.setPassword}
              confirmPassword={reg.confirmPassword}
              onConfirmPasswordChange={reg.setConfirmPassword}
              phoneCountry={reg.phoneCountry}
              avatarPreview={reg.avatarPreview}
              avatarUploading={reg.avatarUploading}
              onAvatarSelect={reg.handleAvatarSelect}
              onAvatarRemove={reg.handleAvatarRemove}
              onNext={reg.handleNext}
              canProceed={reg.canProceedFromProfile()}
              isLoading={reg.isLoading}
            />
          )}

          {reg.currentStep === 'services' && (
            <div className="space-y-4 sm:space-y-6">
              <StepSelectServices
                selectedServices={reg.selectedServices}
                onServicesChange={reg.setSelectedServices}
              />

              {/* Continue Button for Services Step */}
              <button
                onClick={reg.handleNext}
                disabled={reg.selectedServices.length === 0 || reg.isLoading}
                className="w-full py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#C4735B] hover:bg-[#A85D47] active:scale-[0.98]"
              >
                {reg.isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('common.loading')}
                  </span>
                ) : (
                  t('common.continue')
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer - Switch to Client */}
        {reg.currentStep === 'phone' && !reg.showOtp && (
          <div className="py-3 sm:py-4 text-center border-t border-neutral-100 px-3 sm:px-4">
            <button
              onClick={onSwitchToClient}
              className="text-xs sm:text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              {t('register.lookingForPro')}{' '}
              <span className="font-medium text-[#C4735B]">{t('register.registerAsClient')}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
