'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Eye, MousePointer, TrendingUp } from 'lucide-react';

export default function ProAnalyticsPage() {
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

  const stats = [
    { label: 'Profile Views', value: '0', icon: Eye, color: 'bg-forest-800' },
    { label: 'Impressions', value: '0', icon: BarChart3, color: 'bg-terracotta-500' },
    { label: 'Click Rate', value: '0%', icon: MousePointer, color: 'bg-primary-500' },
    { label: 'Conversion', value: '0%', icon: TrendingUp, color: 'bg-terracotta-400' },
  ];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-neutral-50">Analytics</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-neutral-500 dark:text-neutral-400">Understand your performance and growth</p>
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

        {/* Chart Placeholder */}
        <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-4 sm:p-8 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-3 sm:mb-4">Performance Overview</h3>
          <div className="h-48 sm:h-64 flex items-center justify-center border-2 border-dashed border-neutral-200 dark:border-dark-border rounded-xl">
            <div className="text-center px-4">
              <BarChart3 className="h-10 sm:h-12 w-10 sm:w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
              <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400">Charts will appear once you have data</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-8 sm:p-12 text-center">
          <BarChart3 className="h-12 sm:h-16 w-12 sm:w-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">No analytics data yet</h3>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mb-5 sm:mb-6">Start completing orders to see your performance metrics</p>
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
