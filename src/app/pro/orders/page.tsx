'use client';

import AuthGuard from '@/components/common/AuthGuard';
import EmptyState from '@/components/common/EmptyState';
import { useLanguage } from '@/contexts/LanguageContext';
import { Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';

function ProOrdersPageContent() {
  const { t, locale } = useLanguage();

  const stats = [
    { label: t('orders.activeOrders'), value: '0', icon: Package, color: 'bg-[var(--hm-n-800)]' },
    { label: t('common.inProgress'), value: '0', icon: Clock, color: 'bg-[var(--hm-brand-500)]' },
    { label: t('common.completed'), value: '0', icon: CheckCircle, color: 'bg-primary-500' },
    { label: t('orders.requiresAction'), value: '0', icon: AlertCircle, color: 'bg-[var(--hm-brand-400)]' },
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
            title="No active orders"
            titleKa="აქტიური შეკვეთები არ არის"
            description="When clients accept your proposals, orders will appear here"
            descriptionKa="როდესაც კლიენტები მიიღებენ თქვენს შეთავაზებებს, შეკვეთები აქ გამოჩნდება"
            actionLabel="Find Jobs"
            actionLabelKa="სამუშაოების ძებნა"
            actionHref="/jobs"
            variant="illustrated"
            size="md"
          />
        </div>
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
