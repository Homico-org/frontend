'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRegistration, PRO_STEPS } from '@/components/register/hooks';
import { StepAccount, StepCategory, StepServices, StepReview } from '@/components/register/steps';
import UserTypeSelector from '@/components/register/UserTypeSelector';
import AvatarCropper from '@/components/common/AvatarCropper';
import { OTPInput } from '@/components/ui/OTPInput';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
            <Link href="/help" className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors">
              {reg.locale === 'ka' ? 'დახმარება' : 'Help'}
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => reg.openLoginModal()}
            >
              {reg.locale === 'ka' ? 'შესვლა' : 'Log In'}
            </Button>
              </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-3xl text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
              {reg.locale === 'ka' ? 'გაწევრიანდი Homico-ში' : 'Join Homico'}
            </h1>
            <p className="text-neutral-500 mb-8">
              {reg.locale === 'ka' ? 'აირჩიე როგორ გინდა გამოიყენო პლატფორმა' : 'Choose how you want to use the platform'}
            </p>
            
            <UserTypeSelector
              value={null}
              onChange={(type) => {
                reg.setUserType(type);
                reg.setShowTypeSelection(false);
              }}
              locale={reg.locale as 'en' | 'ka'}
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
            {reg.locale === 'ka' ? 'ვერიფიკაცია' : 'Verification'}
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
            onComplete={(code) => reg.googleUser ? reg.verifyGoogleOtp(code) : reg.verifyOtp(code)}
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
                {reg.locale === 'ka' ? 'ხელახლა გაგზავნა' : 'Resend Code'}
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
          <Link href="/help" className="text-xs text-neutral-600 hover:text-neutral-900">
            {reg.locale === 'ka' ? 'დახმარება' : 'Help'}
              </Link>
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
              handleGoogleSuccess={reg.handleGoogleSuccess}
              handleGoogleError={reg.handleGoogleError}
              canProceed={reg.canProceedFromAccount()}
              onNext={reg.handleNext}
              onSwitchType={() => reg.setShowTypeSelection(true)}
            />
          </div>
        </main>
      </div>
    );
  }

  // Pro registration - multi-step wizard
  return (
    <>
      {/* Avatar Cropper Modal */}
      {reg.showAvatarCropper && reg.rawAvatarImage && (
        <AvatarCropper
          image={reg.rawAvatarImage}
          onCropComplete={reg.handleCroppedAvatar}
          onCancel={reg.handleCropCancel}
          locale={reg.locale}
        />
      )}

      <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      {/* Header with progress */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-12 flex items-center justify-between">
            <Logo />
              <Link href="/help" className="text-xs text-neutral-600 hover:text-neutral-900">
                {reg.locale === 'ka' ? 'დახმარება' : 'Help'}
            </Link>
          </div>

          {/* Progress bar */}
          <div className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                  {reg.locale === 'ka' 
                    ? `${reg.getCurrentStepIndex() + 1}/${PRO_STEPS.length}` 
                    : `STEP ${reg.getCurrentStepIndex() + 1}/${PRO_STEPS.length}`
                  }
              </span>
              <span className="text-[10px] font-medium text-[#C4735B]">
                  {PRO_STEPS[reg.getCurrentStepIndex()].title[reg.locale === 'ka' ? 'ka' : 'en']}
              </span>
            </div>
              <Progress value={reg.getProgressPercentage()} size="sm" indicatorVariant="gradient" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-4 lg:py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {reg.error && (
              <Alert variant="error" size="sm" className="mb-4" dismissible onDismiss={() => reg.setError('')}>
                {reg.error}
            </Alert>
          )}

            {/* Step 1: Account */}
            {reg.currentStep === 'account' && (
              <StepAccount
                locale={reg.locale}
                userType="pro"
                authMethod={reg.authMethod}
                setAuthMethod={reg.setAuthMethod}
                formData={reg.formData}
                handleInputChange={reg.handleInputChange}
                error=""
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
                avatarPreview={reg.avatarPreview}
                avatarUploading={reg.avatarUploading}
                uploadedAvatarUrl={reg.uploadedAvatarUrl}
                avatarInputRef={reg.avatarInputRef}
                handleAvatarSelect={reg.handleAvatarSelect}
                removeAvatar={reg.removeAvatar}
                handleGoogleSuccess={reg.handleGoogleSuccess}
                handleGoogleError={reg.handleGoogleError}
                canProceed={reg.canProceedFromAccount()}
                onNext={reg.handleNext}
                onSwitchType={() => reg.setUserType('client')}
                showFooter={false}
              />
            )}

            {/* Step 2: Category */}
            {reg.currentStep === 'category' && (
              <StepCategory
                locale={reg.locale}
                categories={reg.categories}
                formData={reg.formData}
                handleCategoryToggle={reg.handleCategoryToggle}
                handleSubcategoryToggle={reg.handleSubcategoryToggle}
                customServices={reg.customServices}
                setCustomServices={reg.setCustomServices}
                newCustomService={reg.newCustomService}
                setNewCustomService={reg.setNewCustomService}
              />
            )}

            {/* Step 3: Services/Portfolio */}
            {reg.currentStep === 'services' && (
              <StepServices
                locale={reg.locale}
                portfolioProjects={reg.portfolioProjects}
                addPortfolioProject={reg.addPortfolioProject}
                updatePortfolioProject={reg.updatePortfolioProject}
                removePortfolioProject={reg.removePortfolioProject}
                handleProjectImageUpload={reg.handleProjectImageUpload}
                removeProjectImage={reg.removeProjectImage}
                handleProjectVideoUpload={reg.handleProjectVideoUpload}
                removeProjectVideo={reg.removeProjectVideo}
                handleBeforeAfterUpload={reg.handleBeforeAfterUpload}
                removeBeforeAfterPair={reg.removeBeforeAfterPair}
              />
            )}

            {/* Step 4: Review */}
            {reg.currentStep === 'review' && (
              <StepReview
                locale={reg.locale}
                formData={reg.formData}
                categories={reg.categories}
                avatarPreview={reg.avatarPreview}
                portfolioProjects={reg.portfolioProjects}
                customServices={reg.customServices}
                phoneCountry={reg.phoneCountry}
                goToStep={reg.goToStep}
              />
          )}
        </div>
      </main>

      {/* Footer with navigation */}
      <footer className="sticky bottom-0 bg-white border-t border-neutral-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
              {reg.getCurrentStepIndex() > 0 ? (
                <Button
                  variant="ghost"
                  onClick={reg.handleBack}
                >
                  ← {reg.locale === 'ka' ? 'უკან' : 'Back'}
                </Button>
            ) : (
              <div />
            )}

              <Button
                onClick={reg.handleNext}
              disabled={
                  reg.isLoading ||
                  (reg.currentStep === 'account' && !reg.canProceedFromAccount()) ||
                  (reg.currentStep === 'category' && !reg.canProceedFromCategory()) ||
                  (reg.currentStep === 'services' && !reg.canProceedFromServices())
                }
                loading={reg.isLoading}
              >
                {reg.currentStep === 'review' 
                  ? (reg.locale === 'ka' ? 'დასრულება ✓' : 'Complete ✓')
                  : (reg.locale === 'ka' ? 'გაგრძელება →' : 'Continue →')
                }
              </Button>
          </div>
        </div>
      </footer>
    </div>
    </>
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
