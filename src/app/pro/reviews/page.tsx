'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Star, TrendingUp, MessageSquare } from 'lucide-react';

export default function ProReviewsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'pro')) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-800 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-neutral-50">Reviews</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-neutral-500 dark:text-neutral-400">See what clients are saying about your work</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-terracotta-400 p-2.5 sm:p-3 rounded-lg sm:rounded-xl">
                <Star className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Average Rating</p>
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
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Total Reviews</p>
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
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Response Rate</p>
                <p className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-50">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-8 sm:p-12 text-center">
          <Star className="h-12 sm:h-16 w-12 sm:w-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">No reviews yet</h3>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mb-5 sm:mb-6">Complete orders and deliver great work to receive reviews from clients</p>
          <button
            onClick={() => router.push('/browse')}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 sm:py-3.5 bg-forest-800 dark:bg-primary-400 dark:text-dark-300 text-white rounded-xl hover:bg-forest-700 transition-all duration-200 ease-out font-medium touch-manipulation"
          >
            Find Jobs
          </button>
        </div>
      </div>
    </div>
  );
}
