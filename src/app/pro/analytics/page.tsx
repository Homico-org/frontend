'use client';

import AuthGuard from '@/components/common/AuthGuard';
import EmptyState from '@/components/common/EmptyState';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { BarChart3, Eye, LucideIcon, MousePointer, TrendingUp } from 'lucide-react';

function ProAnalyticsPageContent() {
  const { t, locale } = useLanguage();

  const stats: { label: string; value: string; icon: LucideIcon; variant: 'success' | 'accent' | 'info' | 'warning' }[] = [
    { label: t('analytics.profileViews'), value: '0', icon: Eye, variant: 'success' },
    { label: t('analytics.impressions'), value: '0', icon: BarChart3, variant: 'accent' },
    { label: t('analytics.clickRate'), value: '0%', icon: MousePointer, variant: 'info' },
    { label: t('analytics.conversion'), value: '0%', icon: TrendingUp, variant: 'warning' },
  ];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-neutral-50">
            {t('analytics.analytics')}
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
            {t('analytics.understandYourPerformanceAndGrowth')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} variant="elevated" size="md">
              <div className="flex items-center">
                <IconBadge icon={stat.icon} variant={stat.variant} size="lg" />
                <div className="ml-2.5 sm:ml-4">
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Chart Placeholder */}
        <Card variant="elevated" size="lg" className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-3 sm:mb-4">
            {t('analytics.performanceOverview')}
          </h3>
          <div className="h-48 sm:h-64 flex items-center justify-center border-2 border-dashed border-neutral-200 dark:border-dark-border rounded-xl">
            <div className="text-center px-4">
              <BarChart3 className="h-10 sm:h-12 w-10 sm:w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
              <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
                {t('analytics.chartsWillAppearOnceYou')}
              </p>
            </div>
          </div>
        </Card>

        {/* Empty State */}
        <Card variant="elevated" size="lg">
          <EmptyState
            icon={BarChart3}
            title="No analytics data yet"
            titleKa="ანალიტიკის მონაცემები ჯერ არ არის"
            description="Start completing orders to see your performance metrics"
            descriptionKa="დაიწყე შეკვეთების შესრულება შედეგების სანახავად"
            actionLabel="Find Jobs"
            actionLabelKa="სამუშაოების ძებნა"
            actionHref="/jobs"
            variant="illustrated"
            size="md"
          />
        </Card>
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
