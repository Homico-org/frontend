'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import Header, { HeaderSpacer } from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  Clock,
  Edit3,
  MessageSquare,
  Trash2,
  FileText,
  ChevronRight,
  X,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

// Terracotta accent - matching design
const ACCENT_COLOR = '#C4735B';

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  skills: string[];
  location: string;
  budgetType: string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  images: string[];
  media: { type: string; url: string }[];
  proposalCount: number;
  viewCount: number;
  createdAt: string;
  deadline?: string;
  hiredPro?: {
    _id: string;
    userId: { _id: string; name: string; avatar?: string };
    avatar?: string;
    title?: string;
  };
  // New proposals with avatars
  recentProposals?: Array<{
    _id: string;
    proId: { avatar?: string; name: string };
  }>;
}

type StatusFilter = 'all' | 'open' | 'hired' | 'closed';

// Category display names
const CATEGORY_LABELS: Record<string, { en: string; ka: string }> = {
  renovation: { en: 'Renovation', ka: 'რემონტი' },
  'interior-design': { en: 'Interior Design', ka: 'ინტერიერის დიზაინი' },
  plumbing: { en: 'Plumbing', ka: 'სანტექნიკა' },
  electrical: { en: 'Electrical', ka: 'ელექტრობა' },
  cleaning: { en: 'Cleaning', ka: 'დასუფთავება' },
  landscaping: { en: 'Landscaping', ka: 'ლანდშაფტი' },
  painting: { en: 'Painting', ka: 'შეღებვა' },
  flooring: { en: 'Flooring', ka: 'იატაკი' },
  tiling: { en: 'Tiling', ka: 'მოპირკეთება' },
  design: { en: 'Design', ka: 'დიზაინი' },
  designer: { en: 'Designer', ka: 'დიზაინერი' },
  'deep-clean': { en: 'Deep Clean', ka: 'ღრმა წმენდა' },
};

function getTimeAgo(dateStr: string, locale: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (locale === 'ka') {
    if (diffMins < 60) return `${diffMins} წუთის წინ`;
    if (diffHours < 24) return `${diffHours} საათის წინ`;
    if (diffDays < 7) return `${diffDays} დღის წინ`;
    if (diffWeeks < 4) return `${diffWeeks} კვირის წინ`;
    return `Posted ${diffDays} days ago`;
  }

  if (diffMins < 60) return `Posted ${diffMins} minutes ago`;
  if (diffHours < 24) return `Posted ${diffHours} hours ago`;
  if (diffDays < 7) return `Posted ${diffDays} days ago`;
  if (diffWeeks < 4) return `Posted ${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  return `Posted ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
}

function MyJobsPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const toast = useToast();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [deleteModalJob, setDeleteModalJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchMyJobs = useCallback(async (status: StatusFilter, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setIsInitialLoading(true);
      } else {
        setIsFilterLoading(true);
      }
      const params = status !== 'all' ? `?status=${status}` : '';
      const response = await api.get(`/jobs/my-jobs${params}`);
      setJobs(response.data);
    } catch (err: any) {
      console.error('Failed to fetch jobs:', err);
      toast.error(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        locale === 'ka' ? 'პროექტების ჩატვირთვა ვერ მოხერხდა' : 'Failed to load projects'
      );
    } finally {
      setIsInitialLoading(false);
      setIsFilterLoading(false);
    }
  }, [locale, toast]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated && isInitialLoading) {
      fetchMyJobs(statusFilter, true);
    }
  }, [isAuthenticated]);

  // Filter change
  useEffect(() => {
    if (isAuthenticated && !isInitialLoading) {
      fetchMyJobs(statusFilter, false);
    }
  }, [statusFilter]);

  // Delete job handler
  const handleDeleteJob = async () => {
    if (!deleteModalJob) return;

    const jobId = deleteModalJob._id;

    try {
      setDeletingJobId(jobId);
      await api.delete(`/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j._id !== jobId));
      toast.success(
        locale === 'ka' ? 'წარმატება' : 'Success',
        locale === 'ka' ? 'პროექტი წაიშალა' : 'Job deleted successfully'
      );
      setDeleteModalJob(null);
    } catch (err) {
      toast.error(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        locale === 'ka' ? 'წაშლა ვერ მოხერხდა' : 'Failed to delete job'
      );
    } finally {
      setDeletingJobId(null);
    }
  };


  // Get category label
  const getCategoryLabel = (category: string) => {
    const label = CATEGORY_LABELS[category];
    return label ? label[locale as 'en' | 'ka'] : category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Initial loading skeleton
  if (authLoading || isInitialLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Header />
        <HeaderSpacer />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="w-32 h-8 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse mb-2" />
          <div className="w-64 h-5 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse mb-8" />
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-24 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-44 bg-neutral-50 dark:bg-neutral-900 rounded-2xl animate-pulse border border-neutral-100 dark:border-neutral-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      {/* ==================== HEADER ==================== */}
      <Header />
      <HeaderSpacer />

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* ==================== PAGE TITLE ZONE ==================== */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
            {locale === 'ka' ? 'ჩემი პროექტები' : 'My Jobs'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {locale === 'ka'
              ? 'მართე შენი აქტიური მოთხოვნები და შეთავაზებები.'
              : 'Manage your active listings and proposals.'}
          </p>
        </div>

        {/* ==================== TABS FILTER ZONE ==================== */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { key: 'all' as StatusFilter, label: locale === 'ka' ? 'ყველა' : 'All Jobs' },
            { key: 'open' as StatusFilter, label: locale === 'ka' ? 'ღია' : 'Open' },
            { key: 'hired' as StatusFilter, label: locale === 'ka' ? 'დაქირავებული' : 'Hired' },
            { key: 'closed' as StatusFilter, label: locale === 'ka' ? 'დახურული' : 'Closed' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              disabled={isFilterLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50 ${
                statusFilter === tab.key
                  ? 'text-white shadow-sm'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
              style={statusFilter === tab.key ? { backgroundColor: ACCENT_COLOR } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ==================== JOB CARDS ZONE ==================== */}
        {isFilterLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-44 bg-neutral-50 dark:bg-neutral-900 rounded-2xl animate-pulse border border-neutral-100 dark:border-neutral-800" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <FileText className="w-7 h-7 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              {locale === 'ka' ? 'პროექტები არ მოიძებნა' : 'No jobs found'}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              {statusFilter === 'all'
                ? (locale === 'ka' ? 'შექმენი პირველი პროექტი და დაიწყე შეთავაზებების მიღება' : 'Create your first project and start receiving proposals')
                : (locale === 'ka' ? 'ამ ფილტრით პროექტები ვერ მოიძებნა' : 'No jobs found with this filter')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const firstImage = job.media?.[0]?.url || job.images?.[0];
              const isHired = job.status === 'in_progress';
              const isOpen = job.status === 'open';
              const isClosed = job.status === 'completed' || job.status === 'cancelled';

              return (
                <div
                  key={job._id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 transition-shadow hover:shadow-lg"
                >
                  <div className="flex">
                    {/* ===== IMAGE SECTION ===== */}
                    <div className="relative w-64 flex-shrink-0 bg-neutral-100 dark:bg-neutral-800">
                      {firstImage ? (
                        <img
                          src={storage.getFileUrl(firstImage)}
                          alt=""
                          className="w-full h-full object-cover"
                          style={{ minHeight: '180px' }}
                        />
                      ) : (
                        <div className="w-full h-full min-h-[180px] flex items-center justify-center">
                          <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        {isOpen && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm text-green-700 dark:text-green-400 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            {locale === 'ka' ? 'ღია' : 'Open'}
                          </span>
                        )}
                        {isHired && (
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                            style={{ backgroundColor: ACCENT_COLOR }}
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {locale === 'ka' ? 'დაქირავებული' : 'Hired'}
                          </span>
                        )}
                        {isClosed && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-200/95 dark:bg-neutral-700/95 backdrop-blur-sm text-neutral-600 dark:text-neutral-300 shadow-sm">
                            {locale === 'ka' ? 'დახურული' : 'Closed'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ===== CONTENT SECTION ===== */}
                    <div className="flex-1 p-5 flex flex-col">
                      <div className="flex items-start justify-between flex-1">
                        <div className="flex-1">
                          {/* Category Tags & Time */}
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="text-[11px] font-semibold uppercase tracking-wider"
                              style={{ color: ACCENT_COLOR }}
                            >
                              {getCategoryLabel(job.category)}
                              {job.subcategory && ` • ${getCategoryLabel(job.subcategory)}`}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                              <Clock className="w-3 h-3" />
                              {getTimeAgo(job.createdAt, locale)}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-2">
                            {job.title}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                            {job.description}
                          </p>
                        </div>

                        {/* Action Icons - Top Right */}
                        <div className="flex items-center gap-1 ml-4">
                          {isOpen && (
                            <>
                              <Link
                                href={`/post-job?edit=${job._id}`}
                                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => setDeleteModalJob(job)}
                                disabled={deletingJobId === job._id}
                                className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isHired && (
                            <Link
                              href={`/jobs/${job._id}`}
                              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* ===== FOOTER SECTION ===== */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        {/* Left: Proposals or Hired Pro */}
                        <div className="flex items-center gap-3">
                          {isOpen && job.proposalCount > 0 && (
                            <>
                              {/* Stacked Avatars */}
                              <div className="flex -space-x-2">
                                {[...Array(Math.min(job.proposalCount, 3))].map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 border-2 border-white dark:border-neutral-900 overflow-hidden"
                                  >
                                    {job.recentProposals?.[i]?.proId?.avatar ? (
                                      <img
                                        src={storage.getFileUrl(job.recentProposals[i].proId.avatar!)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs font-medium text-neutral-500">
                                        {i + 1}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <span style={{ color: ACCENT_COLOR }} className="text-sm font-medium">
                                {job.proposalCount} {locale === 'ka' ? 'ახალი შეთავაზება' : 'New Proposals'}
                              </span>
                            </>
                          )}
                          {isOpen && job.proposalCount === 0 && (
                            <span className="flex items-center gap-2 text-sm text-neutral-400">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              {locale === 'ka' ? 'ელოდება პირველ შეთავაზებას...' : 'Awaiting first proposal...'}
                            </span>
                          )}
                          {isHired && job.hiredPro && (
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={job.hiredPro.userId?.avatar || job.hiredPro.avatar}
                                name={job.hiredPro.userId?.name || 'Pro'}
                                size="sm"
                                className="w-8 h-8"
                              />
                              <div>
                                <span
                                  className="text-[10px] font-semibold uppercase tracking-wider block"
                                  style={{ color: ACCENT_COLOR }}
                                >
                                  {locale === 'ka' ? 'დაქირავებული პრო' : 'HIRED PRO'}
                                </span>
                                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                  {job.hiredPro.userId?.name || 'Professional'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right: Action Button */}
                        <div>
                          {isOpen && job.proposalCount > 0 && (
                            <Link
                              href={`/my-jobs/${job._id}/proposals`}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800"
                              style={{ borderColor: ACCENT_COLOR, color: ACCENT_COLOR }}
                            >
                              {locale === 'ka' ? 'შეთავაზებების ნახვა' : 'View Proposals'}
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          )}
                          {isOpen && job.proposalCount === 0 && (
                            <Link
                              href={`/jobs/${job._id}`}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                            >
                              {locale === 'ka' ? 'დეტალები' : 'View Details'}
                            </Link>
                          )}
                          {isHired && (
                            <Link
                              href={`/messages?job=${job._id}`}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                            >
                              <MessageSquare className="w-4 h-4" />
                              {locale === 'ka' ? 'მესიჯი პროს' : 'Message Pro'}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {deleteModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deletingJobId && setDeleteModalJob(null)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {locale === 'ka' ? 'პროექტის წაშლა' : 'Delete Job'}
                </h3>
              </div>
              <button
                onClick={() => !deletingJobId && setDeleteModalJob(null)}
                disabled={!!deletingJobId}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                {locale === 'ka'
                  ? 'ნამდვილად გსურთ ამ პროექტის წაშლა? ეს მოქმედება შეუქცევადია.'
                  : 'Are you sure you want to delete this job? This action cannot be undone.'}
              </p>

              {/* Job preview */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                <p className="font-medium text-neutral-900 dark:text-white text-sm">
                  {deleteModalJob.title}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  {deleteModalJob.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30">
              <button
                onClick={() => setDeleteModalJob(null)}
                disabled={!!deletingJobId}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteJob}
                disabled={!!deletingJobId}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingJobId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {locale === 'ka' ? 'იშლება...' : 'Deleting...'}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {locale === 'ka' ? 'წაშლა' : 'Delete'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyJobsPage() {
  return (
    <AuthGuard allowedRoles={['client', 'pro', 'company', 'admin']}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: ACCENT_COLOR }} />
        </div>
      }>
        <MyJobsPageContent />
      </Suspense>
    </AuthGuard>
  );
}
