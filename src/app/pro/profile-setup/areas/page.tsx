'use client';

import PricingAreasStep from '@/components/pro/steps/PricingAreasStep';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProfileSetupAreasPage() {
  const { t } = useLanguage();
  const { formData, handleFormChange, locationData } = useProfileSetup();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold mb-1" style={{ color: 'var(--hm-fg-primary)' }}>
          {t('common.serviceAreas')}
        </h1>
        <p className="text-sm" style={{ color: 'var(--hm-fg-secondary)' }}>
          {t('common.whereYouWork') || t('becomePro.setYourRatesAndWork')}
        </p>
      </div>

      <PricingAreasStep
        formData={{
          priceRange: { min: 0, max: 0 },
          priceType: 'fixed',
          serviceAreas: formData.serviceAreas,
          nationwide: formData.nationwide,
        }}
        locationData={locationData}
        onFormChange={(updates) => {
          if ('serviceAreas' in updates) {
            handleFormChange({ serviceAreas: updates.serviceAreas });
          }
          if ('nationwide' in updates) {
            handleFormChange({ nationwide: updates.nationwide });
          }
        }}
        servicePricing={[]}
        onServicePricingChange={() => {}}
      />
    </div>
  );
}
