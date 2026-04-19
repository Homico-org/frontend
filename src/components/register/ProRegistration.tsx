'use client';

import { useProRegistration } from './hooks/useProRegistration';
import { StepPhone, StepProfile, StepSelectServices, StepComplete } from './steps';
import AvatarCropper from '@/components/common/AvatarCropper';
import Header from '@/components/common/Header';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { StepperBars } from '@/components/ui/Stepper';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft } from 'lucide-react';

const STEP_CONFIG = {
  phone: { index: 0, titleKey: 'register.verifyPhone' },
  profile: { index: 1, titleKey: 'register.yourProfile' },
  services: { index: 2, titleKey: 'register.yourServices' },
  complete: { index: 3, titleKey: 'register.complete' },
} as const;

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
            <Button
              variant="ghost"
              size="sm"
              onClick={reg.handleBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 !h-auto !px-1 !py-1 !text-xs !font-medium text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
            >
              {t('common.back')}
            </Button>
          )}

          <div className="flex-1 max-w-xs mx-auto">
            <StepperBars
              total={Object.keys(STEP_CONFIG).length - 1}
              currentIndex={STEP_CONFIG[reg.currentStep as keyof typeof STEP_CONFIG]?.index ?? 0}
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
              <Button
                onClick={reg.handleNext}
                disabled={reg.selectedServices.length === 0 || reg.isLoading}
                loading={reg.isLoading}
                size="lg"
                className="w-full"
              >
                {reg.isLoading ? t('common.loading') : t('common.continue')}
              </Button>
            </div>
          )}
        </div>

        {/* Footer - Switch to Client */}
        {reg.currentStep === 'phone' && !reg.showOtp && (
          <div className="py-3 sm:py-4 text-center border-t border-[var(--hm-border-subtle)] px-3 sm:px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSwitchToClient}
              className="!h-auto !px-2 !py-1 !text-xs sm:!text-sm !font-normal text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
            >
              {t('register.lookingForPro')}{' '}
              <span className="font-medium text-[var(--hm-brand-500)]">{t('register.registerAsClient')}</span>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
