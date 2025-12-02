'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Briefcase, Flag, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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
    { label: 'Total Users', value: '0', icon: Users, color: 'bg-forest-800', change: '+0%' },
    { label: 'Total Jobs', value: '0', icon: Briefcase, color: 'bg-primary-500', change: '+0%' },
    { label: 'Open Reports', value: '0', icon: Flag, color: 'bg-terracotta-500', change: '0' },
    { label: 'Revenue', value: '₾0', icon: DollarSign, color: 'bg-terracotta-400', change: '+0%' },
  ];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-medium text-neutral-900 dark:text-neutral-50">Admin Dashboard</h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">Overview of platform metrics and activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 mt-1">{stat.value}</p>
                  <p className="text-xs text-primary-600 mt-1">{stat.change} vs last month</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => router.push('/admin/users')}
            className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-6 text-left hover:shadow-elevated hover:border-neutral-200 transition-all duration-200 ease-out"
          >
            <Users className="h-8 w-8 text-forest-800 mb-3" />
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Manage Users</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">View and manage user accounts</p>
          </button>
          <button
            onClick={() => router.push('/admin/jobs')}
            className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-6 text-left hover:shadow-elevated hover:border-neutral-200 transition-all duration-200 ease-out"
          >
            <Briefcase className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Manage Jobs</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Review and moderate job posts</p>
          </button>
          <button
            onClick={() => router.push('/admin/reports')}
            className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-6 text-left hover:shadow-elevated hover:border-neutral-200 transition-all duration-200 ease-out"
          >
            <Flag className="h-8 w-8 text-terracotta-500 mb-3" />
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Reports</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Handle user reports and issues</p>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Recent Users</h3>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">No recent users</p>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Pending Reports</h3>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">No pending reports</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
