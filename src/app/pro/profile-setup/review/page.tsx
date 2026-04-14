'use client';

import ReviewStep from '@/components/pro/steps/ReviewStep';
import { useProfileSetup, STEP_SLUGS, type ProfileSetupStepSlug } from '@/contexts/ProfileSetupContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProfileSetupReviewPage() {
  const { t } = useLanguage();
  const {
    formData,
    avatarPreview,
    selectedCategories,
    selectedSubcategories,
    selectedServices,
    selectedSubcategoriesWithPricing,
    customServices,
    portfolioProjects,
    locationData,
    maxExperienceYears,
    isEditMode,
    goToStep,
  } = useProfileSetup();

  const handleEditStep = (stepIndex: number) => {
    const slug = STEP_SLUGS[stepIndex] as ProfileSetupStepSlug | undefined;
    goToStep(slug ?? 'about');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {t('becomePro.review')}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {t('becomePro.reviewYourProfile')}
        </p>
      </div>

      <ReviewStep
        formData={{
          ...formData,
          yearsExperience: maxExperienceYears.toString(),
        }}
        selectedCategories={selectedCategories}
        selectedSubcategories={selectedSubcategories}
        customServices={customServices}
        avatarPreview={avatarPreview}
        locationData={locationData}
        onEditStep={handleEditStep}
        isEditMode={isEditMode}
        portfolioProjects={portfolioProjects}
        selectedServices={selectedServices}
        selectedSubcategoriesWithPricing={selectedSubcategoriesWithPricing}
      />
    </div>
  );
}
