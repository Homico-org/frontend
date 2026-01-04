'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import Header, { HeaderSpacer } from '@/components/common/Header';
import MobileBottomNav from '@/components/common/MobileBottomNav';
import ProjectTrackerCard, { ProjectStage } from '@/components/projects/ProjectTrackerCard';
import { ConfirmModal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useCategoryLabels } from '@/hooks/useCategoryLabels';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  FileText,
  RefreshCw,
  Send,
  Trash2,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

// Terracotta accent - matching design
const ACCENT_COLOR = '#C4735B';

interface ProjectTracking {
  _id: string;
  jobId: string;
  clientId: { _id: string; name: string; avatar?: string };
  proId: { _id: string; name: string; avatar?: string; phone?: string; title?: string };
  currentStage: ProjectStage;
  progress: number;
  hiredAt: string;
  startedAt?: string;
  expectedEndDate?: string;
  completedAt?: string;
  comments: Array<{
    userId: string;
    userName: string;
    userAvatar?: string;
    userRole: 'client' | 'pro';
    content: string;
    createdAt: string;
  }>;
  attachments: Array<{
    uploadedBy: string;
    uploaderName: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
    description?: string;
    uploadedAt: string;
  }>;
  agreedPrice?: number;
  estimatedDuration?: number;
  estimatedDurationUnit?: string;
}

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
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  images: string[];
  media: { type: string; url: string }[];
  proposalCount: number;
  shortlistedCount?: number;
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
  // Project tracking data for in_progress jobs
  projectTracking?: ProjectTracking;
}

type StatusFilter = 'all' | 'open' | 'hired' | 'closed' | 'expired';

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
  const { getCategoryLabel, locale } = useCategoryLabels();
  const toast = useToast();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [deleteModalJob, setDeleteModalJob] = useState<Job | null>(null);
  const [renewingJobId, setRenewingJobId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
      const jobsData = response.data;

      // Fetch project tracking data for in_progress jobs
      const jobsWithTracking = await Promise.all(
        jobsData.map(async (job: Job) => {
          if (job.status === 'in_progress') {
            try {
              const trackingResponse = await api.get(`/jobs/projects/${job._id}`);
              return { ...job, projectTracking: trackingResponse.data.project };
            } catch {
              // If no project tracking exists, return job as-is
              return job;
            }
          }
          return job;
        })
      );

      setJobs(jobsWithTracking);
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

  // Mark proposals on each job as viewed when clicking "View Proposals"
  const handleViewProposals = async (jobId: string) => {
    try {
      await api.post(`/jobs/counters/mark-proposals-viewed/${jobId}`);
    } catch {
      // Silently ignore errors
    }
  };

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

  // Renew expired job handler
  const handleRenewJob = async (jobId: string) => {
    try {
      setRenewingJobId(jobId);
      await api.post(`/jobs/${jobId}/renew`);

      // Update job in local state to open status
      setJobs(prev => prev.map(j =>
        j._id === jobId ? { ...j, status: 'open' as const } : j
      ));

      toast.success(
        locale === 'ka' ? 'წარმატება' : 'Success',
        locale === 'ka' ? 'პროექტი განახლდა 30 დღით' : 'Job renewed for 30 days'
      );
    } catch (err) {
      toast.error(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        locale === 'ka' ? 'განახლება ვერ მოხერხდა' : 'Failed to renew job'
      );
    } finally {
      setRenewingJobId(null);
    }
  };

  // Initial loading skeleton
  if (authLoading || isInitialLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Header />
        <HeaderSpacer />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="w-32 h-8 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse mb-2" />
          <div className="w-64 h-5 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse mb-6" />
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-20 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse flex-shrink-0" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 sm:h-44 bg-neutral-50 dark:bg-neutral-900 rounded-2xl animate-pulse border border-neutral-100 dark:border-neutral-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col font-body">
      {/* Font imports */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

        .font-display {
          font-family: 'Playfair Display', Georgia, serif;
        }
        .font-body {
          font-family: 'DM Sans', system-ui, sans-serif;
        }
      `}</style>

      {/* ==================== HEADER ==================== */}
      <Header />
      <HeaderSpacer />

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* ==================== PAGE HEADER WITH BACK BUTTON ==================== */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="mt-0.5 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-display font-semibold text-neutral-900 dark:text-white">
                {locale === 'ka' ? 'ჩემი განცხადებები' : 'My Jobs'}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 hidden sm:block">
                {locale === 'ka'
                  ? 'მართე შენი აქტიური მოთხოვნები და შეთავაზებები.'
                  : 'Manage your active listings and proposals.'}
              </p>
            </div>
          </div>

        </div>

        {/* ==================== TABS FILTER ZONE ==================== */}
        {(() => {
          const tabs = [
            { key: 'all' as StatusFilter, label: locale === 'ka' ? 'ყველა' : 'All' },
            { key: 'open' as StatusFilter, label: locale === 'ka' ? 'აქტიური' : 'Active' },
            { key: 'hired' as StatusFilter, label: locale === 'ka' ? 'დაქირავებული' : 'Hired' },
            { key: 'closed' as StatusFilter, label: locale === 'ka' ? 'დახურული' : 'Closed' },
            { key: 'expired' as StatusFilter, label: locale === 'ka' ? 'ვადაგასული' : 'Expired' },
          ];
          const activeTab = tabs.find(t => t.key === statusFilter) || tabs[0];

          return (
            <>
              {/* Mobile: Collapsible Accordion */}
              <div className="sm:hidden mb-4">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  disabled={isFilterLoading}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {locale === 'ka' ? 'ფილტრი:' : 'Filter:'}
                    </span>
                    <span
                      className="text-sm font-medium px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: ACCENT_COLOR }}
                    >
                      {activeTab.label}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isFilterOpen && (
                  <div className="mt-2 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
                    {tabs.map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setStatusFilter(tab.key);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          statusFilter === tab.key
                            ? 'text-white'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        style={statusFilter === tab.key ? { backgroundColor: ACCENT_COLOR } : {}}
                      >
                        {tab.label}
                        {statusFilter === tab.key && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop: Pill Tabs */}
              <div className="hidden sm:flex items-center gap-2 mb-6">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    disabled={isFilterLoading}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50 ${
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
            </>
          );
        })()}

        {/* ==================== JOB CARDS ZONE ==================== */}
        {isFilterLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 sm:h-44 bg-neutral-50 dark:bg-neutral-900 rounded-2xl animate-pulse border border-neutral-100 dark:border-neutral-800" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={statusFilter === 'all' ? "No jobs yet" : "No jobs found"}
            titleKa={statusFilter === 'all' ? "პროექტები ჯერ არ არის" : "პროექტები არ მოიძებნა"}
            description={statusFilter === 'all' ? "Create your first project and start receiving proposals" : "No jobs found with this filter"}
            descriptionKa={statusFilter === 'all' ? "შექმენი პირველი პროექტი და დაიწყე შეთავაზებების მიღება" : "ამ ფილტრით პროექტები ვერ მოიძებნა"}
            actionLabel={statusFilter === 'all' ? "Post a Job" : undefined}
            actionLabelKa={statusFilter === 'all' ? "სამუშაოს გამოქვეყნება" : undefined}
            actionHref={statusFilter === 'all' ? "/post-job" : undefined}
            variant="illustrated"
            size="md"
          />
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const firstImage = job.media?.[0]?.url || job.images?.[0];
              const isHired = job.status === 'in_progress';
              const hasShortlisted = (job.shortlistedCount || 0) > 0;
              const isOpen = job.status === 'open' && !hasShortlisted;
              const isShortlisted = job.status === 'open' && hasShortlisted;
              const isClosed = job.status === 'completed' || job.status === 'cancelled';
              const isExpired = job.status === 'expired';

              // Show ProjectTrackerCard for in_progress jobs with tracking data
              if (isHired && job.projectTracking) {
                return (
                  <ProjectTrackerCard
                    key={job._id}
                    job={job}
                    project={job.projectTracking}
                    isClient={true}
                    locale={locale}
                    onRefresh={() => fetchMyJobs(statusFilter, false)}
                  />
                );
              }

              return (
                <div
                  key={job._id}
                  onClick={() => router.push(`/jobs/${job._id}`)}
                  className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 transition-shadow hover:shadow-lg cursor-pointer"
                >
                  {/* Mobile: Vertical Stack Layout */}
                  <div className="flex flex-col sm:flex-row">
                    {/* ===== IMAGE SECTION ===== */}
                    <div className="relative w-full sm:w-48 lg:w-64 flex-shrink-0 bg-neutral-100 dark:bg-neutral-800">
                      {firstImage ? (
                        <img
                          src={storage.getFileUrl(firstImage)}
                          alt=""
                          className="w-full h-40 sm:h-full object-cover"
                          style={{ minHeight: '160px' }}
                        />
                      ) : (
                        <div className="w-full h-40 sm:h-full min-h-[160px] flex items-center justify-center">
                          <FileText className="w-10 h-10 text-neutral-300 dark:text-neutral-700" />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        {isOpen && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm text-green-700 dark:text-green-400 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {locale === 'ka' ? 'ღია' : 'Open'}
                          </span>
                        )}
                        {isShortlisted && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100/95 dark:bg-blue-900/50 backdrop-blur-sm text-blue-700 dark:text-blue-400 shadow-sm">
                            <Users className="w-3 h-3" />
                            {locale === 'ka' ? 'შორტლისტი' : 'Shortlisted'} ({job.shortlistedCount})
                          </span>
                        )}
                        {isHired && (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                            style={{ backgroundColor: ACCENT_COLOR }}
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {locale === 'ka' ? 'დაქირავებული' : 'Hired'}
                          </span>
                        )}
                        {isClosed && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-200/95 dark:bg-neutral-700/95 backdrop-blur-sm text-neutral-600 dark:text-neutral-300 shadow-sm">
                            {locale === 'ka' ? 'დახურული' : 'Closed'}
                          </span>
                        )}
                        {isExpired && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100/95 dark:bg-amber-900/50 backdrop-blur-sm text-amber-700 dark:text-amber-400 shadow-sm">
                            <Clock className="w-3 h-3" />
                            {locale === 'ka' ? 'ვადაგასული' : 'Expired'}
                          </span>
                        )}
                      </div>

                      {/* Mobile: Action buttons overlay */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 sm:hidden">
                        {/* Only show edit/delete when job is open (no shortlist, no pro hired) */}
                        {isOpen && (
                          <>
                            <Link
                              href={`/post-job?edit=${job._id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm text-neutral-600 hover:text-neutral-900 shadow-sm"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteModalJob(job); }}
                              disabled={deletingJobId === job._id}
                              className="p-2 rounded-lg bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm text-neutral-400 hover:text-red-500 shadow-sm disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {isExpired && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRenewJob(job._id); }}
                            disabled={renewingJobId === job._id}
                            className="p-2 rounded-lg bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm text-amber-600 hover:text-amber-700 shadow-sm disabled:opacity-50"
                          >
                            {renewingJobId === job._id ? (
                              <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ===== CONTENT SECTION ===== */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col">
                      <div className="flex items-start justify-between flex-1">
                        <div className="flex-1 min-w-0">
                          {/* Category Tags & Time */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span
                              className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider"
                              style={{ color: ACCENT_COLOR }}
                            >
                              {getCategoryLabel(job.category)}
                              {(job.subcategory || job.skills?.[0]) && ` • ${getCategoryLabel(job.subcategory || job.skills[0])}`}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-neutral-400">
                              <Clock className="w-3 h-3" />
                              {getTimeAgo(job.createdAt, locale)}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-sm sm:text-base font-display font-semibold text-neutral-900 dark:text-white mb-2 line-clamp-2">
                            {job.title}
                          </h3>

                          {/* Description - Hidden on very small screens */}
                          <p className="hidden sm:block text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                            {job.description}
                          </p>
                        </div>

                        {/* Action Icons - Top Right - Desktop only */}
                        <div className="hidden sm:flex items-center gap-1 ml-4">
                          {/* Only show edit/delete when job is open (no shortlist, no pro hired) */}
                          {isOpen && (
                            <>
                              <Link
                                href={`/post-job?edit=${job._id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteModalJob(job); }}
                                disabled={deletingJobId === job._id}
                                className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isExpired && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRenewJob(job._id); }}
                              disabled={renewingJobId === job._id}
                              className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                              title={locale === 'ka' ? 'განახლება' : 'Renew'}
                            >
                              {renewingJobId === job._id ? (
                                <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ===== FOOTER SECTION ===== */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 gap-3">
                        {/* Left: Proposals or Hired Pro */}
                        <div className="flex items-center gap-3">
                          {isOpen && job.proposalCount > 0 && (
                            <>
                              {/* Stacked Avatars */}
                              <div className="flex -space-x-2">
                                {[...Array(Math.min(job.proposalCount, 3))].map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 border-2 border-white dark:border-neutral-900 overflow-hidden"
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
                              <span style={{ color: ACCENT_COLOR }} className="text-xs sm:text-sm font-medium">
                                {job.proposalCount} {locale === 'ka' ? 'შეთავაზება' : 'Proposals'}
                              </span>
                            </>
                          )}
                          {isOpen && job.proposalCount === 0 && (
                            <span className="flex items-center gap-2 text-xs sm:text-sm text-neutral-400">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              {locale === 'ka' ? 'ელოდება შეთავაზებას...' : 'Awaiting proposals...'}
                            </span>
                          )}
                          {isHired && job.hiredPro && (
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={job.hiredPro.userId?.avatar || job.hiredPro.avatar}
                                name={job.hiredPro.userId?.name || 'Pro'}
                                size="sm"
                                className="w-7 h-7 sm:w-8 sm:h-8"
                              />
                              <div>
                                <span
                                  className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider block"
                                  style={{ color: ACCENT_COLOR }}
                                >
                                  {locale === 'ka' ? 'დაქირავებული' : 'HIRED'}
                                </span>
                                <span className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white">
                                  {job.hiredPro.userId?.name || 'Professional'}
                                </span>
                              </div>
                            </div>
                          )}
                          {isExpired && (
                            <span className="flex items-center gap-2 text-xs sm:text-sm text-amber-600 dark:text-amber-500">
                              <Clock className="w-4 h-4" />
                              {locale === 'ka' ? 'ვადა ამოიწურა - განაახლეთ კვლავ გასააქტიურებლად' : 'Expired - renew to reactivate'}
                            </span>
                          )}
                        </div>

                        {/* Right: Action Button */}
                        <div className="flex-shrink-0">
                          {isOpen && job.proposalCount > 0 && (
                            <Link
                              href={`/my-jobs/${job._id}/proposals`}
                              onClick={(e) => { e.stopPropagation(); handleViewProposals(job._id); }}
                              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800"
                              style={{ borderColor: ACCENT_COLOR, color: ACCENT_COLOR }}
                            >
                              {locale === 'ka' ? 'შეთავაზებების ნახვა' : 'View Proposals'}
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          )}
                          {isExpired && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRenewJob(job._id); }}
                              disabled={renewingJobId === job._id}
                              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition-all disabled:opacity-50"
                            >
                              {renewingJobId === job._id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  {locale === 'ka' ? 'მიმდინარეობს...' : 'Renewing...'}
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4" />
                                  {locale === 'ka' ? 'განახლება 30 დღით' : 'Renew for 30 days'}
                                </>
                              )}
                            </button>
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
      <ConfirmModal
        isOpen={!!deleteModalJob}
        onClose={() => !deletingJobId && setDeleteModalJob(null)}
        onConfirm={handleDeleteJob}
        title={locale === 'ka' ? 'პროექტის წაშლა' : 'Delete Job'}
        description={locale === 'ka'
          ? 'ნამდვილად გსურთ ამ პროექტის წაშლა? ეს მოქმედება შეუქცევადია.'
          : 'Are you sure you want to delete this job? This action cannot be undone.'}
        icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
        variant="danger"
        cancelLabel={locale === 'ka' ? 'გაუქმება' : 'Cancel'}
        confirmLabel={locale === 'ka' ? 'წაშლა' : 'Delete'}
        isLoading={!!deletingJobId}
        loadingLabel={locale === 'ka' ? 'იშლება...' : 'Deleting...'}
        confirmIcon={<Trash2 className="w-4 h-4" />}
      >
        {/* Job preview */}
        {deleteModalJob && (
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 sm:p-4 mb-4">
            <p className="font-medium text-neutral-900 dark:text-white text-sm">
              {deleteModalJob.title}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
              {deleteModalJob.description}
            </p>
          </div>
        )}
      </ConfirmModal>

      {/* Hide scrollbar utility */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
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
