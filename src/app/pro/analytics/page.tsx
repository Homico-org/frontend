'use client';

import { useEffect, useMemo, useState } from 'react';
import AuthGuard from '@/components/common/AuthGuard';
import EmptyState from '@/components/common/EmptyState';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import type { Proposal } from '@/types/shared';
import { BarChart3, CheckCircle, MessageSquare, Send, Star } from 'lucide-react';

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
}

function ProAnalyticsPageContent() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    (async () => {
      try {
        const [proposalsRes, reviewsRes] = await Promise.all([
          api.get('/jobs/my-proposals/list', { signal: controller.signal }),
          api
            .get('/reviews/stats/my', { signal: controller.signal })
            .catch(() => null),
        ]);
        setProposals(Array.isArray(proposalsRes.data) ? proposalsRes.data : []);
        if (reviewsRes?.data) setReviewStats(reviewsRes.data as ReviewStats);
      } catch (err) {
        const e = err as { name?: string; code?: string };
        if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return;
      } finally {
        setIsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [user?.id]);

  const metrics = useMemo(() => {
    const total = proposals.length;
    const completed = proposals.filter(
      (p) => p.status === 'completed' || p.projectTracking?.currentStage === 'completed',
    ).length;
    const accepted = proposals.filter((p) =>
      ['accepted', 'in_progress', 'completed'].includes(p.status as string),
    ).length;
    const decided = proposals.filter((p) =>
      ['accepted', 'in_progress', 'completed', 'rejected'].includes(p.status as string),
    ).length;
    const acceptanceRate = decided > 0 ? Math.round((accepted / decided) * 100) : 0;
    return {
      total,
      completed,
      acceptanceRate,
    };
  }, [proposals]);

  const formatRating = (n: number) =>
    n.toLocaleString(locale === 'en' ? 'en-US' : locale === 'ru' ? 'ru-RU' : 'ka-GE', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const hasNoData =
    !isLoading &&
    metrics.total === 0 &&
    metrics.completed === 0 &&
    (reviewStats?.totalReviews ?? 0) === 0;

  const stats: {
    label: string;
    value: string | number;
    icon: typeof BarChart3;
    variant: React.ComponentProps<typeof IconBadge>['variant'];
  }[] = [
    {
      label: t('analytics.completedJobs'),
      value: metrics.completed,
      icon: CheckCircle,
      variant: 'success',
    },
    {
      label: t('analytics.proposalsSent'),
      value: metrics.total,
      icon: Send,
      variant: 'accent',
    },
    {
      label: t('analytics.acceptanceRate'),
      value: `${metrics.acceptanceRate}%`,
      icon: MessageSquare,
      variant: 'info',
    },
    {
      label: t('analytics.averageRating'),
      value: reviewStats?.totalReviews
        ? formatRating(reviewStats.averageRating)
        : '-',
      icon: Star,
      variant: 'warning',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)] py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)]">
            {t('analytics.analytics')}
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-[var(--hm-fg-muted)]">
            {t('analytics.understandYourPerformanceAndGrowth')}
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
                    {isLoading ? <Skeleton className="h-6 w-10" /> : stat.value}
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
        ) : hasNoData ? (
          <Card variant="elevated" size="lg">
            <EmptyState
              icon={BarChart3}
              title={t('analytics.noActivityYet')}
              description={t('analytics.noActivityYetBody')}
              actionLabel={t('professional.findJobs')}
              actionHref="/jobs"
              variant="illustrated"
              size="md"
            />
          </Card>
        ) : (
          <Card variant="elevated" size="lg">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--hm-fg-primary)] mb-3 sm:mb-4">
              {t('analytics.performanceOverview')}
            </h3>
            <div className="h-32 sm:h-40 flex items-center justify-center border border-dashed border-[var(--hm-border)] rounded-xl px-4">
              <div className="text-center">
                <BarChart3 className="h-8 sm:h-10 w-8 sm:w-10 text-[var(--hm-fg-muted)] mx-auto mb-2" />
                <p className="text-sm text-[var(--hm-fg-muted)] max-w-md">
                  {t('analytics.trendsComingSoon')}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ProAnalyticsPage() {
  return (
    <AuthGuard allowedRoles={['pro', 'admin']}>
      <ProAnalyticsPageContent />
    </AuthGuard>
  );
}
