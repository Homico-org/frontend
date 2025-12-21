'use client';

import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/common/AuthGuard';
import { Image, Plus, Eye } from 'lucide-react';

function ProPortfolioPageContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-neutral-50">Portfolio</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-neutral-500 dark:text-neutral-400">Showcase your best work to attract clients</p>
          </div>
          <button className="inline-flex items-center justify-center px-4 py-2.5 sm:py-3 bg-forest-800 dark:bg-primary-400 dark:text-dark-300 text-white rounded-xl hover:bg-forest-700 transition-all duration-200 ease-out font-medium touch-manipulation">
            <Plus className="h-5 w-5 mr-2" />
            Add Project
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-forest-800 p-2.5 sm:p-3 rounded-lg sm:rounded-xl">
                <Image className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Total Projects</p>
                <p className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-50">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-primary-500 p-2.5 sm:p-3 rounded-lg sm:rounded-xl">
                <Eye className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Total Views</p>
                <p className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-50">0</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-terracotta-500 p-2.5 sm:p-3 rounded-lg sm:rounded-xl">
                <Image className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Categories</p>
                <p className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-50">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-8 sm:p-12 text-center">
          <Image className="h-12 sm:h-16 w-12 sm:w-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">No portfolio items yet</h3>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mb-5 sm:mb-6">Add your best work to showcase your skills and attract more clients</p>
          <button className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 sm:py-3.5 bg-forest-800 dark:bg-primary-400 dark:text-dark-300 text-white rounded-xl hover:bg-forest-700 transition-all duration-200 ease-out font-medium touch-manipulation">
            <Plus className="h-5 w-5 mr-2" />
            Add Your First Project
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProPortfolioPage() {
  return (
    <AuthGuard allowedRoles={['pro', 'admin']}>
      <ProPortfolioPageContent />
    </AuthGuard>
  );
}
