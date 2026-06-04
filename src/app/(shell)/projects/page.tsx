'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { ListChecks, MapPin, Plus, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface ProjectListItem {
  id?: string;
  _id?: string;
  title: string;
  location?: string;
  status?: string;
  progress?: number;
  coverImage?: string;
  photos?: string[];
  engagements?: { id: string }[];
  scopeItems?: { id: string }[];
  budgetMax?: number;
}

const statusVariant = (
  s?: string,
): 'secondary' | 'info' | 'success' | 'warning' => {
  if (s === 'completed') return 'success';
  if (s === 'draft') return 'secondary';
  if (s === 'on_hold' || s === 'paused') return 'warning';
  return 'info';
};

const fmtGel = (n: number) =>
  `${Math.round(n).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

export default function ProjectsListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[] | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get('/projects')
      .then((r) => setProjects(r.data || []))
      .catch(() => setProjects([]));
  }, [user]);

  const loading = authLoading || projects === null;

  // Distinct statuses present, for the filter pills (only worth showing
  // once there are several projects spanning more than one status).
  const statuses = useMemo(
    () =>
      Array.from(
        new Set((projects ?? []).map((p) => p.status).filter(Boolean)),
      ) as string[],
    [projects],
  );
  const showFilter = (projects?.length ?? 0) > 1 && statuses.length > 1;
  const visible = (projects ?? []).filter(
    (p) => filter === 'all' || p.status === filter,
  );

  return (
    <div className="w-full pb-10">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--hm-fg-primary)]">
            {t('projects.listTitle')}
          </h1>
          <p className="text-[13px] text-[var(--hm-fg-muted)] mt-0.5">
            {t('projects.listSubtitle')}
          </p>
        </div>
        <Button asChild leftIcon={<Plus className="w-4 h-4" />}>
          <Link href="/projects/new">{t('projects.newProject')}</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
        </div>
      ) : projects.length === 0 ? (
        <Card
          variant="elevated"
          className="p-10 flex flex-col items-center text-center gap-3"
        >
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)]">
            <ListChecks className="w-6 h-6" />
          </span>
          <p className="text-[14px] text-[var(--hm-fg-muted)] max-w-sm">
            {t('projects.listEmpty')}
          </p>
          <Button asChild leftIcon={<Plus className="w-4 h-4" />}>
            <Link href="/projects/new">{t('projects.newProject')}</Link>
          </Button>
        </Card>
      ) : (
        <>
          {showFilter && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {['all', ...statuses].map((s) => {
                const active = filter === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter(s)}
                    className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
                      active
                        ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/[0.08] text-[var(--hm-brand-500)]'
                        : 'border-[var(--hm-border-subtle)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-brand-500)]/40'
                    }`}
                  >
                    {s === 'all' ? t('common.all') : t(`status.${s}`)}
                  </button>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p) => {
            const pid = p.id || p._id;
            const cover = p.coverImage || p.photos?.[0];
            const progress = Math.min(100, Math.max(0, p.progress ?? 0));
            return (
              <Link
                key={pid}
                href={`/projects/${pid}`}
                className="group rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] overflow-hidden hover:border-[var(--hm-brand-500)]/40 hover:shadow-md transition-all"
              >
                <div className="h-32 bg-[var(--hm-bg-tertiary)] overflow-hidden">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={storage.getOptimizedImageUrl(cover, {
                        width: 480,
                        height: 256,
                      })}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--hm-fg-muted)]">
                      <ListChecks className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-[var(--hm-fg-primary)] min-w-0 truncate">
                      {p.title}
                    </h3>
                    {p.status && (
                      <Badge variant={statusVariant(p.status)} size="sm">
                        {t(`status.${p.status}`)}
                      </Badge>
                    )}
                  </div>
                  {p.location && (
                    <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-[var(--hm-fg-muted)] truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </p>
                  )}
                  {progress > 0 && (
                    <div className="mt-3 h-1.5 rounded-full bg-[var(--hm-bg-tertiary)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--hm-brand-500)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-[var(--hm-fg-muted)]">
                    {!!p.engagements?.length && (
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {t('projects.teamCount', { count: p.engagements.length })}
                      </span>
                    )}
                    {!!p.scopeItems?.length && (
                      <span className="inline-flex items-center gap-1.5">
                        <ListChecks className="w-3.5 h-3.5" />
                        {p.scopeItems.length}
                      </span>
                    )}
                    {!!p.budgetMax && (
                      <span className="inline-flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5" />
                        {fmtGel(p.budgetMax)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}
