'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export interface StepConfig {
  id: string;
  title: string;
  titleKa: string;
  description?: string;
  descriptionKa?: string;
  isComplete: boolean;
  isOptional?: boolean;
}

interface ProfileSetupStepperProps {
  steps: StepConfig[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onBack?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  canProceed?: boolean;
  isLastStep?: boolean;
  isEditMode?: boolean;
}

export default function ProfileSetupStepper({
  steps,
  currentStep,
  onStepChange,
  onBack,
  onNext,
  onSaveDraft,
  onSubmit,
  isLoading = false,
  canProceed = true,
  isLastStep = false,
  isEditMode = false,
}: ProfileSetupStepperProps) {
  const { t, locale } = useLanguage();

  const completedSteps = steps.filter(s => s.isComplete).length;
  const progressPercentage = Math.round((completedSteps / steps.length) * 100);

  const currentStepData = steps[currentStep];

  // Calculate the progress bar segment widths
  const segmentWidth = 100 / steps.length;

  return (
    <>
      {/* Top Progress Header */}
      <div className="sticky top-14 z-40 bg-[var(--hm-bg-page)]/95 backdrop-blur-md border-b border-[var(--hm-border-subtle)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          {/* Step indicator and percentage */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-wider text-[var(--hm-fg-muted)] uppercase">
                {t('common.step')} {currentStep + 1} {t('common.of')} {steps.length}
                {currentStepData?.isOptional && (
                  <span className="ml-2 text-[var(--hm-fg-muted)]">
                    ({t('common.optional')})
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--hm-brand-500)' }}>
                {progressPercentage}%
              </span>
              <span className="text-xs text-[var(--hm-fg-muted)]">
                {locale === 'ka' ? currentStepData?.titleKa : currentStepData?.title}
              </span>
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="relative h-2 bg-[var(--hm-bg-tertiary)] rounded-full overflow-hidden">
            {/* Background segments */}
            <div className="absolute inset-0 flex">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className="h-full"
                  style={{
                    width: `${segmentWidth}%`,
                    borderRight: idx < steps.length - 1 ? '2px solid var(--hm-bg-page)' : 'none'
                  }}
                />
              ))}
            </div>

            {/* Progress fill with gradient */}
            <div
              className="absolute inset-y-0 left-0 transition-all duration-500 ease-out rounded-full"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                background: 'linear-gradient(90deg, var(--hm-brand-500) 0%, var(--hm-brand-300) 100%)'
              }}
            />

            {/* Completed segments overlay */}
            <div className="absolute inset-0 flex">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${segmentWidth}%`,
                    backgroundColor: step.isComplete && idx < currentStep ? 'rgba(224, 123, 79, 0.3)' : 'transparent',
                    borderRight: idx < steps.length - 1 ? '2px solid var(--hm-bg-page)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Step Pills Navigation */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
            {steps.map((step, idx) => {
              const isActive = idx === currentStep;
              const isCompleted = step.isComplete;
              const isClickable = idx <= currentStep || steps.slice(0, idx).every(s => s.isComplete);

              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && onStepChange(idx)}
                  disabled={!isClickable}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                    transition-all duration-200
                    ${isActive
                      ? 'bg-[var(--hm-brand-500)] text-white shadow-md shadow-[var(--hm-brand-500)]/20'
                      : isCompleted
                        ? 'bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/20'
                        : isClickable
                          ? 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-n-200)]'
                          : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] cursor-not-allowed opacity-60'
                    }
                  `}
                >
                  {isCompleted && !isActive ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                      ${isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-muted)]'
                      }
                    `}>
                      {idx + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">
                    {locale === 'ka' ? step.titleKa : step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--hm-bg-elevated)]/95 backdrop-blur-md border-t border-[var(--hm-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            <button
              onClick={onBack}
              disabled={currentStep === 0 || isLoading}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200
                ${currentStep === 0
                  ? 'text-[var(--hm-fg-muted)] cursor-not-allowed'
                  : 'text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] border border-[var(--hm-border)]'
                }
              `}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t('common.back')}</span>
            </button>

            {/* Right side buttons */}
            <div className="flex items-center gap-3">
              {/* Save as Draft - only show on intermediate steps */}
              {onSaveDraft && !isLastStep && (
                <button
                  onClick={onSaveDraft}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] transition-all duration-200"
                >
                  {t('common.saveAsDraft')}
                </button>
              )}

              {/* Next/Submit Button */}
              <button
                onClick={isLastStep ? onSubmit : onNext}
                disabled={!canProceed || isLoading}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                  transition-all duration-200
                  ${canProceed && !isLoading
                    ? 'bg-[var(--hm-brand-500)] hover:bg-[#D13C14] text-white shadow-lg shadow-[var(--hm-brand-500)]/25 hover:shadow-xl hover:shadow-[var(--hm-brand-500)]/30'
                    : 'bg-[var(--hm-n-200)] text-[var(--hm-fg-muted)] cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>{t('common.loading')}</span>
                  </>
                ) : isLastStep ? (
                  <>
                    <span>
                      {isEditMode
                        ? (t('common.saveChanges'))
                        : (t('common.createProfile'))
                      }
                    </span>
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>{t('common.continue')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
