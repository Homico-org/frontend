'use client';

import { useProRegistration } from './hooks/useProRegistration';
import { StepPhone, StepProfile } from './steps';
import AvatarCropper from '@/components/common/AvatarCropper';
import Header from '@/components/common/Header';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { StepperBars } from '@/components/ui/Stepper';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft } from 'lucide-react';

// Two visible steps now — services + the celebration step were dropped.
// On profile completion the hook redirects straight into /pro/profile-setup
// where services (with pricing) are collected as part of the structured
// 5-step setup wizard.
const STEP_CONFIG = {
  phone: { index: 0, titleKey: 'register.verifyPhone' },
  profile: { index: 1, titleKey: 'register.yourProfile' },
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
              total={Object.keys(STEP_CONFIG).length}
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
