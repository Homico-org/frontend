'use client';

import { useProRegistration } from './hooks/useProRegistration';
import { StepPhone, StepProfile, StepSelectServices, StepComplete } from './steps';
import AvatarCropper from '@/components/common/AvatarCropper';
import Header from '@/components/common/Header';
import StepIndicator from './StepIndicator';
import { Alert } from '@/components/ui/Alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-[var(--hm-bg-elevated)] via-[var(--hm-bg-page)] to-[var(--hm-bg-tertiary)] flex items-center justify-center p-3 sm:p-4">
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
    <div className="min-h-screen bg-[var(--hm-bg-page)] flex flex-col">
      <Header fixed={false} />

      {/* Registration sub-bar: back button + stepper */}
      <div className="sticky top-0 z-40 border-b border-[var(--hm-border-subtle)]" style={{ backgroundColor: 'var(--hm-bg-elevated)' }}>
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 relative flex items-center">
          {reg.currentStep !== 'phone' && (
            <button
              onClick={reg.handleBack}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)] transition-colors p-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-medium">{t('common.back')}</span>
            </button>
          )}

          <div className="flex-1 flex justify-center">
            <StepIndicator
              size="sm"
              steps={Object.entries(STEP_CONFIG)
                .filter(([k]) => k !== 'complete')
                .map(([k, c]) => ({
                  id: k,
                  title: locale === 'ka' ? c.titleKa : locale === 'ru' ? c.titleRu : c.titleEn,
                }))}
              currentStep={reg.currentStep}
            />
          </div>
        </div>
      </div>

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
                className="w-full py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)] active:scale-[0.98]"
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
          <div className="py-3 sm:py-4 text-center border-t border-[var(--hm-border-subtle)] px-3 sm:px-4">
            <button
              onClick={onSwitchToClient}
              className="text-xs sm:text-sm text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)] transition-colors"
            >
              {t('register.lookingForPro')}{' '}
              <span className="font-medium text-[var(--hm-brand-500)]">{t('register.registerAsClient')}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
