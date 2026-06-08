'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { ChevronDown, ListChecks, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface ProjectLite {
  id?: string;
  _id?: string;
  title: string;
  status?: string;
}

const STATUS_DOT: Record<string, string> = {
  draft: 'var(--hm-n-300)',
  new: 'var(--hm-brand-500)',
  active: 'var(--hm-brand-500)',
  in_progress: 'var(--hm-brand-500)',
  completed: 'var(--hm-success-500)',
  cancelled: 'var(--hm-fg-muted)',
};

interface Props {
  label: string;
  isCollapsed: boolean;
  active: boolean;
}

/**
 * Sidebar "Projects" item as a collapsible tree - expand to see and jump to
 * each project. The whole header row is one toggle (single hover surface).
 * Lazily fetches on first expand; auto-expands on a project page.
 */
export default function SidebarProjectsGroup({
  label,
  isCollapsed,
  active,
}: Props) {
  const pathname = usePathname() || '';
  const { t } = useLanguage();
  const onProjectPage = /\/projects\/[^/]+/.test(pathname);
  const currentId = pathname.match(/\/projects\/([^/]+)/)?.[1];
  const [expanded, setExpanded] = useState(onProjectPage);
  const [projects, setProjects] = useState<ProjectLite[] | null>(null);
  const fetchedRef = useRef(false);

  // Follow the section: expand when entering a project page, collapse when
  // leaving it (e.g. clicking Shop). Manual toggles within a section persist
  // since this only runs when the in/out-of-section flag actually flips.
  useEffect(() => {
    setExpanded(onProjectPage);
  }, [onProjectPage]);

  // Fetch eagerly on mount (not lazily on first expand) so the project
  // count badge is shown immediately, whether the group is collapsed or not.
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    api
      .get('/projects')
      .then((r) => setProjects((r.data as ProjectLite[]) || []))
      .catch(() => setProjects([]));
  }, []);

  // Collapsed rail: just the icon link, no tree.
  if (isCollapsed) {
    return (
      <Link
        href="/projects"
        title={label}
        className={`relative flex items-center justify-center rounded-xl px-2 py-2 text-[12.5px] transition-colors ${
          active
            ? 'bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)]'
            : 'text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]'
        }`}
      >
        <ListChecks
          className="h-[18px] w-[18px] flex-shrink-0"
          strokeWidth={active ? 2.1 : 1.75}
        />
      </Link>
    );
  }

  return (
    <div>
      {/* Header row - one button, one hover surface (icon + label + chevron) */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] transition-colors ${
          active
            ? 'bg-[var(--hm-brand-500)]/[0.10] font-semibold text-[var(--hm-brand-500)]'
            : 'font-medium text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)]'
        }`}
      >
        <ListChecks
          className="h-[18px] w-[18px] flex-shrink-0"
          strokeWidth={active ? 2.1 : 1.75}
        />
        <span className="flex-1 text-left">{label}</span>
        {projects && projects.length > 0 && (
          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--hm-bg-tertiary)] px-1 text-[10px] font-semibold tabular-nums text-[var(--hm-fg-muted)]">
            {projects.length}
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
            expanded ? '' : '-rotate-90'
          } ${active ? 'text-[var(--hm-brand-500)]' : 'text-[var(--hm-fg-muted)]'}`}
        />
      </button>

      {/* Tree - vertical guide rail + project leaves */}
      {expanded && (
        <div className="relative ml-[19px] mt-1 pl-3 before:absolute before:left-0 before:top-0 before:bottom-3 before:w-px before:bg-[var(--hm-border-subtle)]">
          {projects === null ? (
            <div className="space-y-1.5 py-1">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-3 animate-pulse rounded bg-[var(--hm-bg-tertiary)]"
                  style={{ width: i === 0 ? '70%' : '55%' }}
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <span className="block px-2 py-1.5 text-[11px] text-[var(--hm-fg-muted)]">
              {t('projects.sidebarNoProjects')}
            </span>
          ) : (
            <div className="space-y-0.5">
              {projects.map((p) => {
                const id = p.id || p._id || '';
                const isCurrent = currentId === id;
                return (
                  <Link
                    key={id}
                    href={`/projects/${id}`}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors ${
                      isCurrent
                        ? 'bg-[var(--hm-brand-500)]/[0.08] font-semibold text-[var(--hm-brand-500)]'
                        : 'text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]'
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full ring-2 ring-[var(--hm-bg-page)]"
                      style={{
                        backgroundColor:
                          STATUS_DOT[p.status || ''] || 'var(--hm-n-300)',
                      }}
                    />
                    <span className="truncate">{p.title}</span>
                  </Link>
                );
              })}
            </div>
          )}

          <Link
            href="/projects/new"
            className="mt-0.5 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[var(--hm-brand-500)] transition-colors hover:bg-[var(--hm-brand-500)]/[0.06]"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t('projects.newProject')}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
