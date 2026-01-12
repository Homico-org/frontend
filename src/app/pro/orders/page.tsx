'use client';

import AuthGuard from '@/components/common/AuthGuard';
import EmptyState from '@/components/common/EmptyState';
import { useLanguage } from '@/contexts/LanguageContext';
import { Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';

function ProOrdersPageContent() {
  const { t, locale } = useLanguage();

  const stats = [
    { label: t('orders.activeOrders'), value: '0', icon: Package, color: 'bg-forest-800' },
    { label: t('common.inProgress'), value: '0', icon: Clock, color: 'bg-terracotta-500' },
    { label: t('common.completed'), value: '0', icon: CheckCircle, color: 'bg-primary-500' },
    { label: t('orders.requiresAction'), value: '0', icon: AlertCircle, color: 'bg-terracotta-400' },
  ];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-neutral-50">
            {t('orders.activeOrders')}
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
            {t('orders.manageYourCurrentOrdersAnd')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-3 sm:p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-2 sm:p-3 rounded-lg sm:rounded-xl`}>
                  <stat.icon className="h-4 sm:h-6 w-4 sm:w-6 text-white" />
                </div>
                <div className="ml-2.5 sm:ml-4">
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none">
          <EmptyState
            icon={Package}
            title="No active orders"
            titleKa="აქტიური შეკვეთები არ არის"
            description="When clients accept your proposals, orders will appear here"
            descriptionKa="როდესაც კლიენტები მიიღებენ თქვენს შეთავაზებებს, შეკვეთები აქ გამოჩნდება"
            actionLabel="Find Jobs"
            actionLabelKa="სამუშაოების ძებნა"
            actionHref="/browse/jobs"
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
