'use client';

import AuthGuard from '@/components/common/AuthGuard';
import EmptyState from '@/components/common/EmptyState';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, TrendingUp, MessageSquare } from 'lucide-react';

function ProReviewsPageContent() {
  const { t, locale } = useLanguage();

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-neutral-50">
            {t('common.reviews')}
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
            {t('reviews.seeWhatClientsAreSaying')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-terracotta-400 p-2.5 sm:p-3 rounded-lg sm:rounded-xl">
                <Star className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  {t('reviews.averageRating')}
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-50">-</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-forest-800 p-2.5 sm:p-3 rounded-lg sm:rounded-xl">
                <MessageSquare className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  {t('reviews.totalReviews')}
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-50">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-primary-500 p-2.5 sm:p-3 rounded-lg sm:rounded-xl">
                <TrendingUp className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  {t('reviews.responseRate')}
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-50">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none">
          <EmptyState
            icon={Star}
            title="No reviews yet"
            titleKa="შეფასებები ჯერ არ არის"
            description="Complete orders and deliver great work to receive reviews from clients"
            descriptionKa="შეასრულე შეკვეთები და მიიღე შეფასებები კლიენტებისგან"
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

export default function ProReviewsPage() {
  return (
    <AuthGuard allowedRoles={['pro', 'admin']}>
      <ProReviewsPageContent />
    </AuthGuard>
  );
}
