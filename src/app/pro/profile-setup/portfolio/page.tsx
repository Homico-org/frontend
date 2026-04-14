'use client';

import ProjectsStep from '@/components/pro/steps/ProjectsStep';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProfileSetupPortfolioPage() {
  const { t, locale } = useLanguage();
  const { portfolioProjects, setPortfolioProjects } = useProfileSetup();

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('becomePro.portfolio')}
          </h1>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {locale === 'ka' ? 'არასავალდებულო' : 'Optional'}
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {locale === 'ka'
            ? 'დაამატე შენი ნამუშევრები. შეგიძლია მოგვიანებითაც დაამატო პროფილიდან.'
            : 'Add your work samples. You can also add them later from your profile.'}
        </p>
      </div>

      <ProjectsStep
        projects={portfolioProjects}
        onChange={setPortfolioProjects}
        maxProjects={20}
        maxVisibleInBrowse={6}
      />
    </div>
  );
}
