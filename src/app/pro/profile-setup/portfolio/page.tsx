'use client';

import ProjectsStep from '@/components/pro/steps/ProjectsStep';
import { useProfileSetup } from '@/contexts/ProfileSetupContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProfileSetupPortfolioPage() {
  const { t, pick } = useLanguage();
  const { portfolioProjects, setPortfolioProjects } = useProfileSetup();

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--hm-fg-primary)' }}>
            {t('becomePro.portfolio')}
          </h1>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--hm-bg-tertiary)',
              color: 'var(--hm-fg-muted)',
            }}
          >
            {t('common.optional')}
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--hm-fg-secondary)' }}>
          {pick({
            en: 'Add your work samples. You can also add them later from your profile.',
            ka: 'დაამატე შენი ნამუშევრები. შეგიძლია მოგვიანებითაც დაამატო პროფილიდან.',
          })}
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
