'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/common/AuthGuard';
import EmptyState from '@/components/common/EmptyState';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import type { Job, Proposal } from '@/types/shared';
import { AlertCircle, CheckCircle, Clock, Package } from 'lucide-react';

type ProposalWithJob = Omit<Proposal, 'jobId'> & { jobId: Job };

const ACTIVE_STATUSES = new Set(['accepted', 'in_progress', 'started', 'review', 'hired']);
const REQUIRES_ACTION_STATUSES = new Set(['shortlisted', 'in_discussion']);

function ProOrdersPageContent() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [proposals, setProposals] = useState<ProposalWithJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await api.get('/jobs/my-proposals/list', {
          signal: controller.signal,
        });
        const data = Array.isArray(res.data) ? res.data : [];
        setProposals(data as ProposalWithJob[]);
      } catch (err) {
        const e = err as { name?: string; code?: string };
        if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return;
      } finally {
        setIsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [user?.id]);

  const counts = useMemo(() => {
    let active = 0;
    let inProgress = 0;
    let completed = 0;
    let requiresAction = 0;
    for (const p of proposals) {
      const stage = p.projectTracking?.currentStage;
      const status = p.status;
      if (status === 'completed' || stage === 'completed') {
        completed += 1;
      } else if (ACTIVE_STATUSES.has(status)) {
        if (stage === 'in_progress' || stage === 'started' || stage === 'review') {
          inProgress += 1;
        } else {
          active += 1;
        }
      }
      if (REQUIRES_ACTION_STATUSES.has(status)) {
        requiresAction += 1;
      }
    }
    return { active, inProgress, completed, requiresAction };
  }, [proposals]);

  const recent = useMemo(() => {
    return [...proposals]
      .filter((p) => p.status !== 'rejected' && p.status !== 'withdrawn')
      .sort((a, b) => {
        const aT = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bT = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bT - aT;
      })
      .slice(0, 5);
  }, [proposals]);

  const statusVariant = (status: string): React.ComponentProps<typeof StatusPill>['variant'] => {
    if (status === 'completed') return 'completed';
    if (status === 'accepted' || status === 'in_progress' || status === 'started') return 'verified';
    if (status === 'shortlisted' || status === 'in_discussion') return 'urgent';
    return 'pending';
  };

  const statusLabel = (status: string): string => {
    const key = `status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  const stats: {
    label: string;
    value: number;
    icon: typeof Package;
    variant: React.ComponentProps<typeof IconBadge>['variant'];
  }[] = [
    { label: t('orders.activeOrders'), value: counts.active, icon: Package, variant: 'neutral' },
    { label: t('common.inProgress'), value: counts.inProgress, icon: Clock, variant: 'accent' },
    { label: t('common.completed'), value: counts.completed, icon: CheckCircle, variant: 'success' },
    {
      label: t('orders.requiresAction'),
      value: counts.requiresAction,
      icon: AlertCircle,
      variant: 'warning',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)] py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)]">
            {t('orders.activeOrders')}
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-[var(--hm-fg-muted)]">
            {t('orders.manageYourCurrentOrdersAnd')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} variant="elevated" size="md">
              <div className="flex items-center">
                <IconBadge icon={stat.icon} variant={stat.variant} size="lg" />
                <div className="ml-2.5 sm:ml-4">
                  <p className="text-xs sm:text-sm text-[var(--hm-fg-muted)]">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-semibold text-[var(--hm-fg-primary)]">
                    {isLoading ? <Skeleton className="h-6 w-8" /> : stat.value}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : recent.length === 0 ? (
          <Card variant="elevated" size="lg">
            <EmptyState
              icon={Package}
              title={t('professional.noActiveOrders')}
              description={t('professional.noActiveOrdersBody')}
              actionLabel={t('professional.findJobs')}
              actionHref="/jobs"
              variant="illustrated"
              size="md"
            />
          </Card>
        ) : (
          <Card variant="elevated" size="md" className="overflow-hidden p-0">
            <ul className="divide-y divide-[var(--hm-border-subtle)]">
              {recent.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/jobs/${typeof p.jobId === 'string' ? p.jobId : p.jobId.id}`}
                    className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-[var(--hm-fg-primary)] line-clamp-1">
                        {p.jobId.title || t('common.untitled')}
                      </p>
                      {p.jobId.location && (
                        <p className="mt-0.5 text-xs text-[var(--hm-fg-muted)] line-clamp-1">
                          {p.jobId.location}
                        </p>
                      )}
                    </div>
                    <StatusPill
                      variant={statusVariant(p.status)}
                      label={statusLabel(p.status)}
                    />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="px-4 sm:px-6 py-3 border-t border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]/40">
              <Link
                href="/my-work"
                className="text-sm font-medium text-[var(--hm-brand-500)] hover:text-[var(--hm-brand-700)]"
              >
                {t('common.viewAll')} →
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ProOrdersPage() {
  return (
    <AuthGuard allowedRoles={['pro', 'admin']}>
      <ProOrdersPageContent />
    </AuthGuard>
  );
}
