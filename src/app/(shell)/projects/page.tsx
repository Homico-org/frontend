'use client';

import RecentlyDeletedModal from '@/components/projects/RecentlyDeletedModal';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { FolderOpen, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * `/projects` has no list page of its own - it auto-opens the first project
 * (the detail page carries the project switcher), or shows an empty
 * placeholder when there are no projects yet.
 */
export default function ProjectsIndexPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [empty, setEmpty] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .get('/projects')
      .then((r) => {
        if (cancelled) return;
        const list: Array<{ id?: string; _id?: string }> = r.data || [];
        const first = list[0];
        const pid = first?.id || first?._id;
        if (pid) router.replace(`/projects/${pid}`);
        else setEmpty(true);
      })
      .catch(() => {
        if (!cancelled) setEmpty(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, router]);

  if (empty) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)]">
          <FolderOpen className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-[20px] font-bold text-[var(--hm-fg-primary)]">
            {t('projects.listTitle')}
          </h1>
          <p className="mx-auto mt-1 max-w-sm text-[14px] text-[var(--hm-fg-muted)]">
            {t('projects.listEmpty')}
          </p>
        </div>
        <Button asChild leftIcon={<Plus className="h-4 w-4" />}>
          <Link href="/projects/new">{t('projects.newProject')}</Link>
        </Button>
        <button
          type="button"
          onClick={() => setTrashOpen(true)}
          className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-fg-secondary)]"
        >
          <Trash2 className="h-4 w-4" />
          {t('projects.recentlyDeleted')}
        </button>
        <RecentlyDeletedModal
          isOpen={trashOpen}
          onClose={() => setTrashOpen(false)}
          onRestored={(id) => router.push(`/projects/${id}`)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
    </div>
  );
}
