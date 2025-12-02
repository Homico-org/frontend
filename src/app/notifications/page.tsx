'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Bell, Check, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filters = [
    { key: 'all', label: t('notifications.filters.all') },
    { key: 'unread', label: t('notifications.filters.unread') },
    { key: 'orders', label: t('notifications.filters.orders') },
    { key: 'messages', label: t('notifications.filters.messages') },
    { key: 'proposals', label: t('notifications.filters.proposals') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-50 mb-6 transition-all duration-200 ease-out"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('notifications.back')}
        </button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-50">{t('notifications.title')}</h1>
            <p className="mt-2 text-gray-600 dark:text-neutral-400">{t('notifications.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center px-4 py-2 text-sm text-gray-700 dark:text-neutral-400 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-elevated transition-all duration-200 ease-out">
              <Check className="h-4 w-4 mr-2" />
              {t('notifications.markAllRead')}
            </button>
            <button className="inline-flex items-center px-4 py-2 text-sm text-red-600 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-lg hover:bg-red-50 dark:hover:bg-dark-elevated transition-all duration-200 ease-out">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('notifications.clearAll')}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {filters.map((filter, index) => (
            <button
              key={filter.key}
              className={`px-4 py-2 text-sm rounded-full transition-all duration-200 ease-out ${
                index === 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-dark-card text-gray-700 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-dark-elevated'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none p-12 text-center">
          <Bell className="h-16 w-16 text-gray-300 dark:text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-50 mb-2">{t('notifications.empty.title')}</h3>
          <p className="text-gray-500 dark:text-neutral-400">{t('notifications.empty.description')}</p>
        </div>
      </div>
    </div>
  );
}
