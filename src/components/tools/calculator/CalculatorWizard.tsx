'use client';

import { useState, useCallback, useMemo } from 'react';
import { Home, Paintbrush, Wrench, Calculator, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { type Room, type WorkCategories, type QualityLevel, type CalculatorStep, DEFAULT_WORK_CATEGORIES } from './types';
import { StepRooms } from './StepRooms';
import { StepMaterials } from './StepMaterials';
import { StepWork } from './StepWork';
import { StepSummary } from './StepSummary';
import { createRoom } from '@/utils/calculator';

interface CalculatorWizardProps {
  t: (key: string) => string;
}

const STEPS: { step: CalculatorStep; icon: typeof Home; key: string }[] = [
  { step: 1, icon: Home, key: 'rooms' },
  { step: 2, icon: Paintbrush, key: 'materials' },
  { step: 3, icon: Wrench, key: 'work' },
  { step: 4, icon: Calculator, key: 'summary' },
];

export function CalculatorWizard({ t }: CalculatorWizardProps) {
  const [currentStep, setCurrentStep] = useState<CalculatorStep>(1);
  const [rooms, setRooms] = useState<Room[]>([createRoom('living')]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [workCategories, setWorkCategories] = useState<WorkCategories>(DEFAULT_WORK_CATEGORIES);
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('standard');
  const [includeMaterials, setIncludeMaterials] = useState(true);

  // Ensure activeRoomId is valid
  const effectiveActiveRoomId = useMemo(() => {
    if (activeRoomId && rooms.find((r) => r.id === activeRoomId)) {
      return activeRoomId;
    }
    return rooms[0]?.id || null;
  }, [activeRoomId, rooms]);

  const totalFloorArea = useMemo(() => {
    return rooms.reduce((sum, room) => sum + room.computed.floorArea, 0);
  }, [rooms]);

  const handleNext = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep((prev: CalculatorStep) => (prev + 1) as CalculatorStep);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev: CalculatorStep) => (prev - 1) as CalculatorStep);
    }
  }, [currentStep]);

  const handleStepClick = useCallback((step: CalculatorStep) => {
    setCurrentStep(step);
  }, []);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return rooms.length > 0 && rooms.every(
          (r) => r.dimensions.length > 0 && r.dimensions.width > 0
        );
      case 2:
        return true; // Materials have defaults
      case 3:
        return true; // Work categories are optional
      case 4:
        return true;
      default:
        return true;
    }
  }, [currentStep, rooms]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepRooms rooms={rooms} onRoomsChange={setRooms} t={t} />;
      case 2:
        return (
          <StepMaterials
            rooms={rooms}
            activeRoomId={effectiveActiveRoomId}
            onRoomsChange={setRooms}
            onActiveRoomChange={setActiveRoomId}
            t={t}
          />
        );
      case 3:
        return (
          <StepWork
            workCategories={workCategories}
            totalFloorArea={totalFloorArea}
            onWorkCategoriesChange={setWorkCategories}
            t={t}
          />
        );
      case 4:
        return (
          <StepSummary
            rooms={rooms}
            workCategories={workCategories}
            qualityLevel={qualityLevel}
            includeMaterials={includeMaterials}
            onQualityLevelChange={setQualityLevel}
            onIncludeMaterialsChange={setIncludeMaterials}
            t={t}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-center">
          {STEPS.map(({ step, icon: Icon, key }, index) => {
            const isActive = currentStep === step;
            const isCompleted = currentStep > step;
            const isClickable = step <= currentStep || (step === currentStep + 1 && canProceed);

            return (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => isClickable && handleStepClick(step)}
                  disabled={!isClickable}
                  className={`flex flex-col items-center gap-1.5 transition-all ${
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-terracotta-500 text-white shadow-lg shadow-terracotta-500/30'
                        : isCompleted
                        ? 'bg-forest-100 dark:bg-forest-900/30 text-forest-600 dark:text-forest-400'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" strokeWidth={2} />
                    ) : (
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block min-w-[60px] text-center ${
                      isActive
                        ? 'text-terracotta-600 dark:text-terracotta-400'
                        : isCompleted
                        ? 'text-forest-600 dark:text-forest-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    {t(`tools.calculator.steps.${key}`)}
                  </span>
                </button>

                {index < STEPS.length - 1 && (
                  <div
                    className={`w-8 sm:w-12 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors ${
                      currentStep > step
                        ? 'bg-forest-400 dark:bg-forest-600'
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">{renderStep()}</div>

      {/* Navigation Buttons */}
      {currentStep < 4 && (
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-5 py-3 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            {t('tools.calculator.back')}
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex items-center gap-2 px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl font-semibold shadow-lg shadow-terracotta-500/25 hover:shadow-terracotta-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {t('tools.calculator.next')}
            <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
