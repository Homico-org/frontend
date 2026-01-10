'use client';

import { useState } from 'react';
import PortfolioCard, { EmptyPortfolio, PortfolioProject } from './PortfolioCard';

export interface PortfolioTabProps {
  /** List of portfolio projects */
  projects: PortfolioProject[];
  /** Handler when a project is clicked */
  onProjectClick?: (project: { images: string[]; videos?: string[]; title: string; currentIndex: number }) => void;
  /** Locale for translations */
  locale?: 'en' | 'ka';
}

export default function PortfolioTab({
  projects,
  onProjectClick,
  locale = 'en',
}: PortfolioTabProps) {
  // Track which image index each card is previewing
  const [activeIndexes, setActiveIndexes] = useState<Record<string, number>>({});

  if (projects.length === 0) {
    return (
      <div className="animate-in fade-in duration-300">
        <EmptyPortfolio locale={locale} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => (
          <PortfolioCard
            key={project.id}
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
        ))}
      </div>
    </div>
  );
}

