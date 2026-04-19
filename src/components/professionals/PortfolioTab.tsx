'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Check, Edit3, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import PortfolioCard, { EmptyPortfolio, PortfolioProject } from './PortfolioCard';

export interface PortfolioTabProps {
  /** List of portfolio projects */
  projects: PortfolioProject[];
  /** Handler when a project is clicked */
  onProjectClick?: (project: { images: string[]; videos?: string[]; beforeAfter?: { before: string; after: string }[]; title: string; currentIndex: number }) => void;
  /** Locale for translations */
  locale?: 'en' | 'ka' | 'ru';
  /** Is current user viewing their own profile */
  isOwner?: boolean;
  /** Handler to add new project */
  onAddProject?: () => void;
  /** Handler to edit a project */
  onEditProject?: (project: PortfolioProject) => void;
  /** Handler to delete a project */
  onDeleteProject?: (projectId: string) => void;
}

export default function PortfolioTab({
  projects,
  onProjectClick,
  locale = 'en',
  isOwner = false,
  onAddProject,
  onEditProject,
  onDeleteProject,
}: PortfolioTabProps) {
  // Track which image index each card is previewing
  const [activeIndexes, setActiveIndexes] = useState<Record<string, number>>({});

  const { t } = useLanguage();

  if (projects.length === 0) {
    return (
      <div className="animate-in fade-in duration-300">
        {isOwner ? (
          <div className="bg-[var(--hm-bg-elevated)] rounded-2xl p-8 shadow-sm border-2 border-dashed border-[var(--hm-border)]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 mx-auto mb-4 flex items-center justify-center">
                <Plus className="w-8 h-8 text-[var(--hm-warning-500)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--hm-fg-primary)] mb-2">
                {t('professional.addYourFirstProject')}
              </h3>
              <p className="text-sm text-[var(--hm-fg-muted)] mb-4 max-w-sm mx-auto">
                {t('professional.showcaseYourBestWorkTo')}
              </p>
              <Button onClick={onAddProject} leftIcon={<Plus className="w-4 h-4" />}>
                {t('professional.addProject')}
              </Button>
            </div>
          </div>
        ) : (
          <EmptyPortfolio locale={locale} />
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 space-y-4">
      {/* Owner: Add Project Button */}
      {isOwner && (
        <div className="flex justify-end">
          <Button 
            onClick={onAddProject} 
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('professional.addProject')}
          </Button>
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {projects.map((project) => (
          <motion.div
            key={project.id}
            className="relative group"
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.97 },
              show: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <PortfolioCard
              project={project}
              locale={locale}
              onClick={(imageIndex) => {
                onProjectClick?.({
                  images: project.images || [],
                  videos: (project as { videos?: string[] }).videos || [],
                  beforeAfter: project.beforeAfter,
                  title: project.title,
                  currentIndex: imageIndex ?? activeIndexes[project.id] ?? 0,
                });
              }}
            />
            
            {/* Owner Actions - Only for editable projects (not from Homico completed jobs) */}
            {isOwner && project.isEditable !== false && (
              <div className="absolute top-3 right-3 flex gap-2 z-50">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEditProject?.(project);
                  }}
                  className="w-8 h-8 rounded-full bg-white/95 shadow-lg border border-[var(--hm-border)] flex items-center justify-center text-[var(--hm-fg-secondary)] hover:text-[var(--hm-brand-500)] hover:border-[var(--hm-brand-500)] hover:scale-110 transition-all"
                  title={t('common.edit')}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteProject?.(project.id);
                  }}
                  className="w-8 h-8 rounded-full bg-white/95 shadow-lg border border-[var(--hm-border)] flex items-center justify-center text-[var(--hm-fg-secondary)] hover:text-[var(--hm-error-500)] hover:border-[var(--hm-error-500)] hover:scale-110 transition-all"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            {/* Homico Badge for non-editable projects */}
            {isOwner && project.isEditable === false && (
              <div className="absolute top-3 right-3 z-50">
                <div className="px-2.5 py-1 rounded-full bg-[var(--hm-success-500)]/90 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wide shadow-lg flex items-center gap-1">
                  <Check className="w-3 h-3" strokeWidth={3} />
                  Homico
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

