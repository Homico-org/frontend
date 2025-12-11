'use client';

import Header from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Employee {
  _id: string;
  name: string;
  jobTitle?: string;
  avatar?: string;
}

interface CompanyJob {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  location?: string;
  address?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  estimatedDuration?: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  quotedPrice?: number;
  finalPrice?: number;
  currency?: string;
  assignedEmployees?: Employee[];
  leadEmployee?: Employee;
  tags?: string[];
  createdAt: string;
}

export default function CompanyJobsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const router = useRouter();

  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, hasMore: false });
  const [filter, setFilter] = useState({ status: '', priority: '' });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openLoginModal('/company/jobs');
    }
    if (!authLoading && user?.role !== 'company') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router, openLoginModal]);

  useEffect(() => {
    if (!authLoading && user?.role === 'company') {
      fetchJobs();
    }
  }, [authLoading, user, filter]);

  const fetchJobs = async (page = 1) => {
    try {
      setIsLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (filter.status) params.append('status', filter.status);

      const res = await fetch(`${API_URL}/companies/my/company/jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setJobs(data.data || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, hasMore: false });
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'assigned': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-indigo-100 text-indigo-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-neutral-100 text-neutral-600';
      case 'medium': return 'bg-blue-100 text-blue-600';
      case 'high': return 'bg-amber-100 text-amber-600';
      case 'urgent': return 'bg-red-100 text-red-600';
      default: return 'bg-neutral-100 text-neutral-600';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg">
      <Header />

      <main className="container-custom py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Jobs</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage your company's jobs and assignments</p>
          </div>
          <Link
            href="/company/jobs/new"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 ease-out flex items-center gap-2 self-start"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Job
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setFilter({ ...filter, status: '' })}
            className={`bg-white dark:bg-dark-card rounded-xl border p-4 text-left transition-all duration-200 ease-out ${!filter.status ? 'border-blue-500 ring-2 ring-blue-100' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'}`}
          >
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{pagination.total || jobs.length}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">All Jobs</div>
          </button>
          <button
            onClick={() => setFilter({ ...filter, status: 'pending' })}
            className={`bg-white dark:bg-dark-card rounded-xl border p-4 text-left transition-all duration-200 ease-out ${filter.status === 'pending' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'}`}
          >
            <div className="text-2xl font-bold text-amber-600">{jobs.filter(j => j.status === 'pending').length}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Pending</div>
          </button>
          <button
            onClick={() => setFilter({ ...filter, status: 'assigned' })}
            className={`bg-white dark:bg-dark-card rounded-xl border p-4 text-left transition-all duration-200 ease-out ${filter.status === 'assigned' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'}`}
          >
            <div className="text-2xl font-bold text-blue-600">{jobs.filter(j => j.status === 'assigned').length}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Assigned</div>
          </button>
          <button
            onClick={() => setFilter({ ...filter, status: 'in_progress' })}
            className={`bg-white dark:bg-dark-card rounded-xl border p-4 text-left transition-all duration-200 ease-out ${filter.status === 'in_progress' ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'}`}
          >
            <div className="text-2xl font-bold text-indigo-600">{jobs.filter(j => j.status === 'in_progress').length}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">In Progress</div>
          </button>
          <button
            onClick={() => setFilter({ ...filter, status: 'completed' })}
            className={`bg-white dark:bg-dark-card rounded-xl border p-4 text-left transition-all duration-200 ease-out ${filter.status === 'completed' ? 'border-[#D2691E] ring-2 ring-[#D2691E]/10' : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'}`}
          >
            <div className="text-2xl font-bold text-[#D2691E]">{jobs.filter(j => j.status === 'completed').length}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Completed</div>
          </button>
        </div>

        {/* Jobs List */}
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border overflow-hidden">
          {jobs.length > 0 ? (
            <div className="divide-y divide-neutral-100 dark:border-dark-border">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  href={`/company/jobs/${job._id}`}
                  className="block p-5 hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-all duration-200 ease-out"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-50 truncate">{job.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(job.priority)}`}>
                          {job.priority}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {job.clientName && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {job.clientName}
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location}
                          </span>
                        )}
                        {job.scheduledDate && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(job.scheduledDate)}
                            {job.scheduledTime && ` at ${job.scheduledTime}`}
                          </span>
                        )}
                        {job.estimatedDuration && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {job.estimatedDuration}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Assigned Team */}
                      {job.assignedEmployees && job.assignedEmployees.length > 0 && (
                        <div className="flex -space-x-2">
                          {job.assignedEmployees.slice(0, 3).map((emp) => (
                            <div
                              key={emp._id}
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                              title={emp.name}
                            >
                              {emp.name?.charAt(0)}
                            </div>
                          ))}
                          {job.assignedEmployees.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-neutral-200 border-2 border-white flex items-center justify-center text-neutral-600 text-xs font-medium">
                              +{job.assignedEmployees.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Price */}
                      {(job.quotedPrice || job.finalPrice) && (
                        <div className="text-right">
                          <div className="font-semibold text-neutral-900 dark:text-neutral-50">
                            {(job.finalPrice || job.quotedPrice)?.toLocaleString()} {job.currency || 'GEL'}
                          </div>
                          {job.finalPrice && job.quotedPrice && job.finalPrice !== job.quotedPrice && (
                            <div className="text-sm text-neutral-400 line-through">
                              {job.quotedPrice.toLocaleString()} {job.currency || 'GEL'}
                            </div>
                          )}
                        </div>
                      )}

                      <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Tags */}
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {job.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-neutral-100 dark:bg-dark-elevated text-neutral-500 dark:text-neutral-400 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
              <svg className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mb-4">No jobs found</p>
              <Link
                href="/company/jobs/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all duration-200 ease-out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Job
              </Link>
            </div>
          )}

          {/* Pagination */}
          {pagination.hasMore && (
            <div className="p-4 border-t border-neutral-100 dark:border-dark-border text-center">
              <button
                onClick={() => fetchJobs(pagination.page + 1)}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
