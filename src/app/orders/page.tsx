'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ClientOrdersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'client')) {
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
    { label: 'Total Orders', value: '0', icon: Package, color: 'bg-forest-800' },
    { label: 'In Progress', value: '0', icon: Clock, color: 'bg-terracotta-400' },
    { label: 'Completed', value: '0', icon: CheckCircle, color: 'bg-primary-500' },
    { label: 'Requires Action', value: '0', icon: AlertCircle, color: 'bg-terracotta-500' },
  ];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-medium text-neutral-900 dark:text-neutral-50">My Orders</h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">Track your ongoing and completed orders</p>
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

        {/* Empty State */}
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-12 text-center">
          <Package className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">No orders yet</h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">Post a job and accept proposals to create orders</p>
          <button
            onClick={() => router.push('/post-job')}
            className="inline-flex items-center px-6 py-3.5 bg-forest-800 dark:bg-primary-400 dark:text-dark-300 text-white rounded-xl hover:bg-forest-700 transition-all duration-200 ease-out font-medium"
          >
            Post a Job
          </button>
        </div>
      </div>
    </div>
  );
}
