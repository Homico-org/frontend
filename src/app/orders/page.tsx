'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import EmptyState from '@/components/common/EmptyState';
import { Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ClientOrdersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== 'client' && user?.role !== 'admin'))) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--hm-bg-page)] flex items-center justify-center">
        <LoadingSpinner size="xl" color="var(--hm-brand-500)" />
      </div>
    );
  }

  const stats = [
    { label: t('orders.totalOrders'), value: '0', icon: Package, color: 'bg-[var(--hm-n-800)]' },
    { label: t('orders.inProgress'), value: '0', icon: Clock, color: 'bg-[var(--hm-brand-400)]' },
    { label: t('orders.completed'), value: '0', icon: CheckCircle, color: 'bg-primary-500' },
    { label: t('orders.requiresAction'), value: '0', icon: AlertCircle, color: 'bg-[var(--hm-brand-500)]' },
  ];

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)] py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)]">
            {t('orders.myOrders')}
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-[var(--hm-fg-muted)]">
            {t('orders.trackYourOngoingAndCompleted')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[var(--hm-bg-elevated)] rounded-xl sm:rounded-2xl border border-[var(--hm-border-subtle)] shadow-card p-3 sm:p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-2 sm:p-3 rounded-lg sm:rounded-xl`}>
                  <stat.icon className="h-4 sm:h-6 w-4 sm:w-6 text-white" />
                </div>
                <div className="ml-2.5 sm:ml-4">
                  <p className="text-xs sm:text-sm text-[var(--hm-fg-muted)]">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-semibold text-[var(--hm-fg-primary)]">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        <div className="bg-[var(--hm-bg-elevated)] rounded-xl sm:rounded-2xl border border-[var(--hm-border-subtle)] shadow-card">
          <EmptyState
            icon={Package}
            title="No orders yet"
            titleKa="შეკვეთები ჯერ არ არის"
            description="Post a job and accept proposals to create orders"
            descriptionKa="გამოაქვეყნე სამუშაო და მიიღე შეთავაზებები შეკვეთების შესაქმნელად"
            actionLabel="Post a Job"
            actionLabelKa="სამუშაოს გამოქვეყნება"
            actionHref="/post-job"
            variant="illustrated"
            size="md"
          />
        </div>
      </div>
    </div>
  );
}
