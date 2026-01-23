'use client';

import { Calculator } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { CalculatorWizard } from '@/components/tools/calculator';

export default function CalculatorPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#0a0a0a] pb-8">
      {/* Page Header */}
      <PageHeader
        icon={Calculator}
        iconVariant="accent"
        title={t('tools.calculator.title')}
        subtitle={t('tools.calculator.subtitle')}
        backHref="/tools"
        backLabel={t('tools.back')}
      />

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <CalculatorWizard t={t} />
        </div>
      </div>
    </div>
  );
}
