'use client';

import ServicesPricingStep from '@/components/pro/steps/ServicesPricingStep';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';

export default function ProfileSetupServicesPage() {
  const { selectedSubcategoriesWithPricing, setSelectedSubcategoriesWithPricing } =
    useProfileSetup();

  return (
    <div className="space-y-4">
      <ServicesPricingStep
        selectedSubcategories={selectedSubcategoriesWithPricing}
        onSelectedSubcategoriesChange={setSelectedSubcategoriesWithPricing}
      />
    </div>
  );
}
