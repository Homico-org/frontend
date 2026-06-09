'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { storage } from '@/services/storage';
import { Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ProjectLite {
  id: string;
  title: string;
  status: string;
  progress?: number;
  coverImage?: string;
  photos?: string[];
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
  // The current project's section tabs. When provided, they render as a
  // vertical sub-nav nested under the active project (replacing the page's
  // horizontal tab bar on desktop).
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function ProjectNavSidebar({
  currentId,
  tabs,
  activeTab,
  onTabChange,
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
        // Skeleton rows - reserve the layout so content doesn't jump when the
        // project list resolves (it loads after the page content).
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-2.5 px-2.5 py-2.5">
            <span className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-[var(--hm-bg-tertiary)]" />
            <div className="flex-1 space-y-1.5 py-1">
              <span className="block h-3 w-3/4 animate-pulse rounded bg-[var(--hm-bg-tertiary)]" />
              <span className="block h-2 w-1/2 animate-pulse rounded bg-[var(--hm-bg-tertiary)]" />
            </div>
          </div>
        ))
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
          const cover = p.coverImage || p.photos?.[0];
          const pct = Math.min(100, Math.max(0, p.progress ?? 0));
          const dot = STATUS_DOT[p.status] || 'var(--hm-border-strong)';
          return (
            <div key={p.id} className="relative">
            {/* Active accent bar */}
            {active && (
              <span
                aria-hidden
                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[var(--hm-brand-500)]"
              />
            )}
            <Link
              href={`/projects/${p.id}`}
              onClick={active ? undefined : onMobileClose}
              className={cn(
                'group flex gap-2.5 px-2.5 py-2.5 rounded-xl transition-colors',
                active
                  ? 'bg-[var(--hm-brand-500)]/[0.07]'
                  : 'hover:bg-[var(--hm-bg-tertiary)]',
              )}
            >
              {/* Cover thumbnail with status corner dot */}
              <span className="relative h-9 w-9 shrink-0">
                <span className="block h-9 w-9 overflow-hidden rounded-lg bg-[var(--hm-bg-tertiary)]">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={storage.getOptimizedImageUrl(cover, 'avatar')}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-[var(--hm-brand-500)]/[0.10] text-[15px] font-bold text-[var(--hm-brand-500)]">
                      {p.title.trim().charAt(0) || '?'}
                    </span>
                  )}
                </span>
                <span
                  aria-hidden
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--hm-bg-elevated)]"
                  style={{ backgroundColor: dot }}
                />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex-1 truncate text-[13px]',
                      active
                        ? 'font-semibold text-[var(--hm-brand-500)]'
                        : 'font-medium text-[var(--hm-fg-secondary)]',
                    )}
                  >
                    {p.title}
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-[var(--hm-fg-muted)]">
                    {pct}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  {STATUS_LABEL_KEY[p.status] && (
                    <span className="whitespace-nowrap text-[11px] text-[var(--hm-fg-muted)]">
                      {t(STATUS_LABEL_KEY[p.status])}
                    </span>
                  )}
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--hm-bg-tertiary)]">
                    <span
                      className="block h-full rounded-full bg-[var(--hm-brand-500)] transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                </div>
              </div>
            </Link>
            {/* Section tabs nested under the active project */}
            {active && tabs && tabs.length > 0 && onTabChange && (
              <div className="mb-1.5 ml-[18px] mt-1 space-y-0.5 border-l border-[var(--hm-border-subtle)] pl-2.5">
                {tabs.map((tb) => {
                  const on = tb.id === activeTab;
                  return (
                    <button
                      key={tb.id}
                      type="button"
                      onClick={() => {
                        onTabChange(tb.id);
                        onMobileClose?.();
                      }}
                      className={cn(
                        'block w-full rounded-lg px-3 py-1.5 text-left text-[13px] transition-colors',
                        on
                          ? 'bg-[var(--hm-brand-500)]/[0.06] font-semibold text-[var(--hm-brand-500)]'
                          : 'text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]',
                      )}
                    >
                      {tb.label}
                    </button>
                  );
                })}
              </div>
            )}
            </div>
          );
        })
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar - the project switcher rail. Shows whenever the
          account has at least one project (the current one), so it's a stable
          left nav with quick "create new" + switch between projects. */}
      {(projects === null || projects.length >= 1) && (
        <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 self-start sticky top-[68px] max-h-[calc(100vh-84px)] overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--hm-border-subtle)]">
            <h2 className="flex items-center gap-2 text-[14px] font-bold text-[var(--hm-fg-primary)]">
              {t('projects.navProjects')}
              {projects && (
                <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--hm-bg-tertiary)] px-1 font-mono text-[10px] font-medium tabular-nums text-[var(--hm-fg-muted)]">
                  {projects.length}
                </span>
              )}
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
