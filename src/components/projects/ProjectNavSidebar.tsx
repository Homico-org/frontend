'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ProjectLite {
  id: string;
  title: string;
  status: string;
  progress?: number;
}

const STATUS_DOT: Record<string, string> = {
  draft: 'var(--hm-border-strong)',
  new: 'var(--hm-brand-500)',
  active: 'var(--hm-brand-500)',
  in_progress: 'var(--hm-brand-500)',
  completed: 'var(--hm-success-500)',
  cancelled: 'var(--hm-fg-muted)',
};

const STATUS_LABEL_KEY: Record<string, string> = {
  draft: 'projects.statusDraft',
  active: 'projects.statusActive',
  in_progress: 'projects.statusInProgress',
  completed: 'projects.statusCompleted',
  cancelled: 'projects.statusCancelled',
};

interface ProjectNavSidebarProps {
  currentId: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function ProjectNavSidebar({
  currentId,
  mobileOpen = false,
  onMobileClose,
}: ProjectNavSidebarProps) {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<ProjectLite[] | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .get('/projects')
      .then((r) => alive && setProjects((r.data as ProjectLite[]) || []))
      .catch(() => alive && setProjects([]));
    return () => {
      alive = false;
    };
  }, []);

  const list = (
    <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
      {projects === null ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="sm" color="var(--hm-brand-500)" />
        </div>
      ) : projects.length === 0 ? (
        <div className="px-3 py-6 text-center">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)] mb-2">
            <Plus className="w-5 h-5" />
          </span>
          <Link
            href="/projects/new"
            className="block text-[13px] font-medium text-[var(--hm-brand-500)] hover:underline"
          >
            {t('projects.createNewProject')}
          </Link>
        </div>
      ) : (
        projects.map((p) => {
          const active = p.id === currentId;
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              onClick={onMobileClose}
              className={cn(
                'block px-3 py-2.5 rounded-xl transition-colors',
                active
                  ? 'bg-[var(--hm-brand-500)]/[0.08]'
                  : 'hover:bg-[var(--hm-bg-tertiary)]',
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      STATUS_DOT[p.status] || 'var(--hm-border-strong)',
                  }}
                />
                <span
                  className={cn(
                    'flex-1 truncate text-[13px]',
                    active
                      ? 'text-[var(--hm-brand-500)] font-semibold'
                      : 'text-[var(--hm-fg-secondary)]',
                  )}
                >
                  {p.title}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 pl-[18px]">
                {STATUS_LABEL_KEY[p.status] && (
                  <span className="text-[11px] text-[var(--hm-fg-muted)] whitespace-nowrap">
                    {t(STATUS_LABEL_KEY[p.status])}
                  </span>
                )}
                <span className="flex-1 h-1 rounded-full bg-[var(--hm-bg-tertiary)] overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-[var(--hm-brand-500)]"
                    style={{ width: `${Math.min(100, p.progress ?? 0)}%` }}
                  />
                </span>
                <span className="text-[11px] text-[var(--hm-fg-muted)] tabular-nums">
                  {p.progress ?? 0}%
                </span>
              </div>
            </Link>
          );
        })
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar - only worth its ~240px when there's more than one
          project to switch between. On a single-project account it's dead
          width, so we hide it and let the content use the full column. The
          mobile drawer (below) stays - it still offers "create new". */}
      {projects && projects.length > 1 && (
        <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 self-start sticky top-[68px] max-h-[calc(100vh-84px)] overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--hm-border-subtle)]">
            <h2 className="text-[14px] font-bold text-[var(--hm-fg-primary)]">
              {t('projects.navProjects')}
            </h2>
            <Link
              href="/projects/new"
              aria-label={t('projects.createNewProject')}
              className="p-1.5 rounded-lg text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </Link>
          </div>
          {list}
        </aside>
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0"
          style={{ zIndex: 'var(--hm-z-modal)' }}
        >
          <div
            className="absolute inset-0 animate-fade-backdrop"
            style={{ backgroundColor: 'rgba(21,17,12,0.55)' }}
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-[80%] max-w-[300px] flex flex-col bg-[var(--hm-bg-page)] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--hm-border-subtle)]">
              <h2 className="text-[15px] font-bold text-[var(--hm-fg-primary)]">
                {t('projects.navProjects')}
              </h2>
              <button
                type="button"
                onClick={onMobileClose}
                aria-label={t('common.close')}
                className="p-2 rounded-lg text-[var(--hm-fg-muted)] hover:bg-[var(--hm-bg-tertiary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {list}
            <Link
              href="/projects/new"
              onClick={onMobileClose}
              className="m-2 flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium text-[var(--hm-brand-500)] border border-[var(--hm-border-subtle)]"
            >
              <Plus className="w-4 h-4" />
              {t('projects.createNewProject')}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
