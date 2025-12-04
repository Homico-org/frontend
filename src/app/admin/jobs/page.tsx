'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Briefcase, Search, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function AdminJobsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
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
    { label: t('admin.totalJobs'), value: '0', icon: Briefcase, color: 'bg-blue-500' },
    { label: t('admin.jobsPage.pendingReview'), value: '0', icon: Clock, color: 'bg-yellow-500' },
    { label: t('admin.jobsPage.approved'), value: '0', icon: CheckCircle, color: 'bg-green-500' },
    { label: t('admin.jobsPage.flagged'), value: '0', icon: AlertTriangle, color: 'bg-red-500' },
  ];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">{t('admin.jobsPage.title')}</h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t('admin.jobsPage.subtitle')}</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="text-sm text-forest-800 dark:text-primary-400 hover:text-terracotta-500 font-medium transition-all duration-200 ease-out"
          >
            ← {t('admin.backToDashboard')}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder={t('admin.jobsPage.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-dark-border dark:bg-dark-bg dark:text-neutral-50 rounded-xl focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all duration-200 ease-out"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-neutral-200 dark:border-dark-border dark:bg-dark-bg dark:text-neutral-50 rounded-xl focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 transition-all duration-200 ease-out"
            >
              <option value="all">{t('admin.jobsPage.allStatus')}</option>
              <option value="pending">{t('admin.jobsPage.pendingReview')}</option>
              <option value="approved">{t('admin.jobsPage.approved')}</option>
              <option value="flagged">{t('admin.jobsPage.flagged')}</option>
              <option value="rejected">{t('admin.jobsPage.rejected')}</option>
            </select>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-100 dark:divide-dark-border">
            <thead className="bg-neutral-50 dark:bg-dark-bg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('admin.jobsPage.tableJob')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('admin.jobsPage.tableClient')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('admin.jobsPage.tableCategory')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('admin.jobsPage.tableStatus')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('admin.jobsPage.tablePosted')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {t('admin.jobsPage.tableActions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-neutral-100 dark:divide-dark-border">
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Briefcase className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400">{t('admin.jobsPage.noJobsFound')}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
