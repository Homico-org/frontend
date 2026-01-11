'use client';

import { Button } from '@/components/ui/button';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import PortfolioCard, { EmptyPortfolio, PortfolioProject } from './PortfolioCard';

export interface PortfolioTabProps {
  /** List of portfolio projects */
  projects: PortfolioProject[];
  /** Handler when a project is clicked */
  onProjectClick?: (project: { images: string[]; videos?: string[]; title: string; currentIndex: number }) => void;
  /** Locale for translations */
  locale?: 'en' | 'ka';
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

  if (projects.length === 0) {
    return (
      <div className="animate-in fade-in duration-300">
        {isOwner ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 shadow-sm border-2 border-dashed border-neutral-200 dark:border-neutral-700">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 mx-auto mb-4 flex items-center justify-center">
                <Plus className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                {locale === 'ka' ? 'დაამატეთ თქვენი პირველი პროექტი' : 'Add Your First Project'}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 max-w-sm mx-auto">
                {locale === 'ka' 
                  ? 'აჩვენეთ თქვენი საუკეთესო სამუშაოები კლიენტებს' 
                  : 'Showcase your best work to potential clients'}
              </p>
              <Button onClick={onAddProject} leftIcon={<Plus className="w-4 h-4" />}>
                {locale === 'ka' ? 'პროექტის დამატება' : 'Add Project'}
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
            {locale === 'ka' ? 'პროექტის დამატება' : 'Add Project'}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => (
          <div key={project.id} className="relative group">
            <PortfolioCard
              project={project}
              locale={locale}
              onClick={(imageIndex) => {
                onProjectClick?.({
                  images: project.images,
                  videos: (project as { videos?: string[] }).videos || [],
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
                  className="w-8 h-8 rounded-full bg-white/95 dark:bg-neutral-800/95 shadow-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-[#C4735B] hover:border-[#C4735B] hover:scale-110 transition-all"
                  title={locale === 'ka' ? 'რედაქტირება' : 'Edit'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteProject?.(project.id);
                  }}
                  className="w-8 h-8 rounded-full bg-white/95 dark:bg-neutral-800/95 shadow-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-red-500 hover:border-red-500 hover:scale-110 transition-all"
                  title={locale === 'ka' ? 'წაშლა' : 'Delete'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            {/* Homico Badge for non-editable projects */}
            {isOwner && project.isEditable === false && (
              <div className="absolute top-3 right-3 z-50">
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wide shadow-lg flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Homico
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

