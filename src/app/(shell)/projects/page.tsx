'use client';

import ClientActivationCard from '@/components/dashboard/ClientActivationCard';
import RecentlyDeletedModal from '@/components/projects/RecentlyDeletedModal';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';
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
  // A load failure must NOT masquerade as "no projects" - that reads like data
  // loss to a user who actually has projects. Distinct error state + retry.
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [trashOpen, setTrashOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadError(false);
    setEmpty(false);
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
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, router, reloadKey]);

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 px-4 py-16">
        <p className="font-display text-[20px] font-bold italic text-[var(--hm-fg-primary)]">
          {t('projects.loadErrorTitle')}
        </p>
        <p className="max-w-md text-[14px] text-[var(--hm-fg-muted)]">
          {t('projects.loadErrorHint')}
        </p>
        <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
          {t('common.tryAgain')}
        </Button>
      </div>
    );
  }

  if (empty) {
    // A client with no projects gets the richer activation hero (create a
    // project OR post a job) instead of the bare placeholder - this is one of
    // the surfaces a fresh client actually reaches. Pros keep the plain state.
    if (user?.role === 'client') {
      return (
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <ClientActivationCard ignoreJobs />
          <button
            type="button"
            onClick={() => setTrashOpen(true)}
            className="mt-2 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-fg-secondary)]"
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
      <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-5 px-4 py-16">
        <div>
          <h1 className="font-display text-[22px] font-bold italic text-[var(--hm-fg-primary)]">
            {t('projects.listTitle')}
          </h1>
          <p className="mt-2 max-w-md text-[14px] text-[var(--hm-fg-muted)]">
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
