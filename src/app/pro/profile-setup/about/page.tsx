'use client';

import AboutStep from '@/components/pro/steps/AboutStep';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProfileSetupAboutPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    formData,
    avatarPreview,
    handleFormChange,
    handleAvatarCropped,
    customServices,
    setCustomServices,
    validation,
  } = useProfileSetup();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {t('becomePro.aboutYou')}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {t('becomePro.fillInYourBasicInformation')}
        </p>
      </div>

      <AboutStep
        formData={{
          bio: formData.bio,
          yearsExperience: '',
          avatar: formData.avatar,
          whatsapp: formData.whatsapp,
          telegram: formData.telegram,
          instagram: formData.instagram,
          facebook: formData.facebook,
          linkedin: formData.linkedin,
          website: formData.website,
        }}
        avatarPreview={avatarPreview}
        onFormChange={handleFormChange}
        onAvatarCropped={handleAvatarCropped}
        validation={{
          avatar: validation.avatar,
          bio: validation.bio,
          experience: true,
        }}
        hideExperience
        customServices={customServices}
        onCustomServicesChange={setCustomServices}
        subcategoryKey={user?.selectedSubcategories?.[0]}
      />
    </div>
  );
}
