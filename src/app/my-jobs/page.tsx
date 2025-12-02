'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import Avatar from '@/components/common/Avatar';
import {
  Briefcase,
  Clock,
  CheckCircle,
  Plus,
  MapPin,
  Calendar,
  Users,
  Eye,
  ChevronRight,
  ChevronLeft,
  FileText,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  MoreVertical,
  Trash2,
  Edit3,
  Pause,
  Play,
  DollarSign,
  ArrowUpRight,
  ArrowLeft,
  Layers,
  TrendingUp,
  MessageSquare,
  X
} from 'lucide-react';
import Link from 'next/link';

// Delete reasons for Georgian users
const DELETE_REASONS = [
  { id: 'found_pro', label: 'პროფესიონალი უკვე ვიპოვე', labelEn: 'Already found a professional' },
  { id: 'project_cancelled', label: 'პროექტი გაუქმდა', labelEn: 'Project cancelled' },
  { id: 'budget_changed', label: 'ბიუჯეტი შეიცვალა', labelEn: 'Budget changed' },
  { id: 'wrong_info', label: 'არასწორი ინფორმაცია დავამატე', labelEn: 'Wrong information posted' },
  { id: 'no_responses', label: 'არავინ დაინტერესდა', labelEn: 'No responses received' },
  { id: 'other', label: 'სხვა მიზეზი', labelEn: 'Other reason' },
];

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  location: string;
  areaSize?: number;
  sizeUnit?: string;
  roomCount?: number;
  budgetType: string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
  pricePerUnit?: number;
  deadline?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  images: string[];
  media: MediaItem[];
  proposalCount: number;
  viewCount: number;
  createdAt: string;
}

interface ProProfile {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  title: string;
  avgRating: number;
  totalReviews: number;
  completedJobs?: number;
  yearsExperience?: number;
}

interface Proposal {
  _id: string;
  jobId: string;
  proId: string;
  proProfileId: ProProfile;
  coverLetter: string;
  proposedPrice: number;
  estimatedDuration: number;
  estimatedDurationUnit: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  contactRevealed: boolean;
  createdAt: string;
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'completed' | 'cancelled';

export default function MyJobsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale: language } = useLanguage();
  const { viewMode } = useViewMode();
  const toast = useToast();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposalsByJob, setProposalsByJob] = useState<Record<string, Proposal[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [loadingProposals, setLoadingProposals] = useState<string | null>(null);
  const [actionMenuJobId, setActionMenuJobId] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalJobId, setDeleteModalJobId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Allow clients and pro users in client mode
  const canAccessMyJobs = user?.role === 'client' || (user?.role === 'pro' && viewMode === 'client');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !canAccessMyJobs)) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, canAccessMyJobs, router]);

  const fetchMyJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/jobs/my-jobs');
      setJobs(response.data);
    } catch (err: any) {
      console.error('Failed to fetch jobs:', err);
      setError(err.response?.data?.message || 'Failed to load your jobs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && canAccessMyJobs) {
      fetchMyJobs();
    }
  }, [isAuthenticated, canAccessMyJobs, fetchMyJobs]);

  const fetchProposalsForJob = async (jobId: string) => {
    if (proposalsByJob[jobId]) {
      setExpandedJobId(expandedJobId === jobId ? null : jobId);
      return;
    }

    try {
      setLoadingProposals(jobId);
      const response = await api.get(`/jobs/${jobId}/proposals`);
      setProposalsByJob(prev => ({ ...prev, [jobId]: response.data }));
      setExpandedJobId(jobId);
    } catch (err: any) {
      console.error('Failed to fetch proposals:', err);
    } finally {
      setLoadingProposals(null);
    }
  };

  const handleAcceptProposal = async (proposalId: string, jobId: string) => {
    try {
      await api.post(`/jobs/proposals/${proposalId}/accept`);
      // Refresh proposals for this job
      const response = await api.get(`/jobs/${jobId}/proposals`);
      setProposalsByJob(prev => ({ ...prev, [jobId]: response.data }));
      // Also refresh jobs list to update status
      fetchMyJobs();
    } catch (err: any) {
      console.error('Failed to accept proposal:', err);
    }
  };

  const handleRevealContact = async (proposalId: string, jobId: string) => {
    try {
      await api.post(`/jobs/proposals/${proposalId}/reveal-contact`);
      // Refresh proposals for this job
      const response = await api.get(`/jobs/${jobId}/proposals`);
      setProposalsByJob(prev => ({ ...prev, [jobId]: response.data }));
    } catch (err: any) {
      console.error('Failed to reveal contact:', err);
    }
  };

  const openDeleteModal = (jobId: string) => {
    setDeleteModalJobId(jobId);
    setDeleteReason('');
    setCustomReason('');
    setActionMenuJobId(null);
  };

  const closeDeleteModal = () => {
    setDeleteModalJobId(null);
    setDeleteReason('');
    setCustomReason('');
  };

  const handleDeleteJob = async () => {
    if (!deleteModalJobId || !deleteReason) return;

    setIsDeleting(true);
    try {
      await api.delete(`/jobs/${deleteModalJobId}`);
      setJobs(prev => prev.filter(job => job._id !== deleteModalJobId));
      closeDeleteModal();
      toast.success(
        language === 'ka' ? 'სამუშაო წაიშალა' : 'Job deleted',
        language === 'ka' ? 'სამუშაო წარმატებით წაიშალა' : 'The job has been successfully deleted'
      );
    } catch (err: any) {
      console.error('Failed to delete job:', err);
      toast.error(
        language === 'ka' ? 'შეცდომა' : 'Error',
        language === 'ka' ? 'სამუშაოს წაშლა ვერ მოხერხდა' : 'Failed to delete the job'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and search jobs
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesSearch = searchQuery === '' ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate stats
  const stats = {
    total: jobs.length,
    open: jobs.filter(j => j.status === 'open').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    totalProposals: jobs.reduce((sum, j) => sum + j.proposalCount, 0),
    totalViews: jobs.reduce((sum, j) => sum + j.viewCount, 0),
  };

  const formatBudget = (job: Job) => {
    if (job.budgetType === 'fixed' && job.budgetAmount) {
      return `₾${job.budgetAmount.toLocaleString()}`;
    }
    if (job.budgetType === 'range' && job.budgetMin && job.budgetMax) {
      return `₾${job.budgetMin.toLocaleString()} - ₾${job.budgetMax.toLocaleString()}`;
    }
    if (job.budgetType === 'per_sqm' && job.pricePerUnit) {
      return `₾${job.pricePerUnit}/მ²`;
    }
    return language === 'ka' ? 'შეთანხმებით' : 'Negotiable';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProposalStatusLabel = (status: string) => {
    if (language === 'ka') {
      switch (status) {
        case 'pending': return 'მოლოდინში';
        case 'accepted': return 'მიღებული';
        case 'rejected': return 'უარყოფილი';
        case 'withdrawn': return 'გაუქმებული';
        default: return status;
      }
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'completed': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-neutral-50 text-neutral-700 border-neutral-200';
    }
  };

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700';
      case 'accepted': return 'bg-emerald-50 text-emerald-700';
      case 'rejected': return 'bg-rose-50 text-rose-700';
      case 'withdrawn': return 'bg-neutral-100 text-neutral-500';
      default: return 'bg-neutral-50 text-neutral-600';
    }
  };

  const getStatusLabel = (status: string) => {
    if (language === 'ka') {
      switch (status) {
        case 'open': return 'ღია';
        case 'in_progress': return 'მიმდინარე';
        case 'completed': return 'დასრულებული';
        case 'cancelled': return 'გაუქმებული';
        default: return status;
      }
    }
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-[3px] border-neutral-200 dark:border-neutral-700"></div>
            <div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-transparent border-t-forest-600 dark:border-t-primary-400 animate-spin"></div>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'იტვირთება...' : 'Loading your jobs...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center p-8 rounded-2xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">{language === 'ka' ? 'დაფიქსირდა შეცდომა' : 'Something went wrong'}</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">{error}</p>
          <button
            onClick={fetchMyJobs}
            className="px-4 py-2 bg-forest-600 dark:bg-primary-500 text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            {language === 'ka' ? 'თავიდან ცდა' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header Section */}
      <div className="border-b" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {language === 'ka' ? 'უკან' : 'Back'}
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-neutral-50">
                {language === 'ka' ? 'ჩემი სამუშაოები' : 'My Jobs'}
              </h1>
              <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                {language === 'ka' ? 'მართე შენი განცხადებები და ნახე პროფესიონალების შეთავაზებები' : 'Manage your job postings and review proposals from professionals'}
              </p>
            </div>
            <Link
              href="/post-job"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-forest-600 dark:bg-primary-500 text-white rounded-xl hover:bg-forest-700 dark:hover:bg-primary-600 transition-colors font-medium shadow-sm"
            >
              <Plus className="h-5 w-5" />
              {language === 'ka' ? 'ახალი განცხადება' : 'Post New Job'}
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-8">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-forest-100 dark:bg-forest-900/30">
                  <Layers className="h-5 w-5 text-forest-600 dark:text-forest-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stats.total}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'სულ' : 'Total Jobs'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Play className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stats.open}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'ღია' : 'Open'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stats.inProgress}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'მიმდინარე' : 'In Progress'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30">
                  <CheckCircle className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stats.completed}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'დასრულებული' : 'Completed'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stats.totalProposals}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'შეთავაზება' : 'Proposals'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                  <Eye className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stats.totalViews}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'ნახვა' : 'Views'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'open', 'in_progress', 'completed', 'cancelled'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-forest-600 dark:bg-primary-500 text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                style={statusFilter !== status ? { backgroundColor: 'var(--color-bg-secondary)' } : {}}
              >
                {status === 'all'
                  ? (language === 'ka' ? 'ყველა' : 'All')
                  : getStatusLabel(status)}
                {status !== 'all' && (
                  <span className="ml-1.5 text-xs opacity-75">
                    ({jobs.filter(j => j.status === status).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder={language === 'ka' ? 'სამუშაოების ძიება...' : 'Search jobs...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 dark:focus:ring-primary-500 transition-shadow"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredJobs.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">
              {jobs.length === 0
                ? (language === 'ka' ? 'სამუშაოები ჯერ არ დამატებულა' : 'No jobs posted yet')
                : (language === 'ka' ? 'შესაბამისი სამუშაო ვერ მოიძებნა' : 'No matching jobs')}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
              {jobs.length === 0
                ? (language === 'ka' ? 'შექმენი პირველი განცხადება და დაიწყე შეთავაზებების მიღება' : 'Create your first job posting to start receiving proposals from skilled professionals')
                : (language === 'ka' ? 'სცადე ფილტრების ან ძიების შეცვლა' : 'Try adjusting your filters or search query')}
            </p>
            {jobs.length === 0 && (
              <Link
                href="/post-job"
                className="inline-flex items-center gap-2 px-6 py-3 bg-forest-600 dark:bg-primary-500 text-white rounded-xl hover:bg-forest-700 dark:hover:bg-primary-600 transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                {language === 'ka' ? 'პირველი განცხადება' : 'Post Your First Job'}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const proposals = proposalsByJob[job._id] || [];
              const isExpanded = expandedJobId === job._id;
              const pendingProposals = proposals.filter(p => p.status === 'pending').length;

              return (
                <div
                  key={job._id}
                  className="rounded-2xl transition-shadow hover:shadow-md"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                >
                  {/* Job Header */}
                  <div className="p-5 sm:p-6">
                    {/* Media Gallery Preview */}
                    {(job.media?.length > 0 || job.images?.length > 0) && (
                      <div className="mb-4 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6">
                        <div className="flex gap-1 overflow-hidden rounded-t-2xl">
                          {(() => {
                            const allMedia = [
                              ...(job.media || []).map(m => ({ url: m.url, type: m.type })),
                              ...(job.images || []).filter(img => !job.media?.some(m => m.url === img)).map(url => ({ url, type: 'image' as const }))
                            ];
                            const displayMedia = allMedia.slice(0, 4);
                            const remainingCount = allMedia.length - 4;

                            return displayMedia.map((media, idx) => (
                              <div
                                key={idx}
                                className={`relative overflow-hidden ${
                                  displayMedia.length === 1 ? 'w-full h-48' :
                                  displayMedia.length === 2 ? 'w-1/2 h-40' :
                                  displayMedia.length === 3 ? (idx === 0 ? 'w-1/2 h-40' : 'w-1/4 h-40') :
                                  idx === 0 ? 'w-1/2 h-40' : 'w-1/6 h-40'
                                }`}
                              >
                                <img
                                  src={storage.getFileUrl(media.url)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                {media.type === 'video' && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <Play className="w-8 h-8 text-white" />
                                  </div>
                                )}
                                {idx === displayMedia.length - 1 && remainingCount > 0 && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <span className="text-white font-semibold text-lg">+{remainingCount}</span>
                                  </div>
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      {/* Job Image/Icon - only show if no media gallery */}
                      {!job.media?.length && !job.images?.length && (
                        <div className="hidden sm:block flex-shrink-0">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-forest-100 to-forest-50 dark:from-forest-900/30 dark:to-forest-900/10 flex items-center justify-center">
                            <Briefcase className="h-7 w-7 text-forest-600 dark:text-forest-400" />
                          </div>
                        </div>
                      )}

                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/jobs/${job._id}`}
                                className="text-lg font-medium text-neutral-900 dark:text-neutral-50 hover:text-forest-600 dark:hover:text-primary-400 transition-colors line-clamp-1"
                              >
                                {job.title}
                              </Link>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                                {getStatusLabel(job.status)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3.5 w-3.5" />
                                {formatBudget(job)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(job.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Actions Menu */}
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuJobId(actionMenuJobId === job._id ? null : job._id)}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                              <MoreVertical className="h-5 w-5 text-neutral-400" />
                            </button>
                            {actionMenuJobId === job._id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setActionMenuJobId(null)}
                                />
                                <div
                                  className="fixed sm:absolute right-4 sm:right-0 bottom-4 sm:bottom-auto sm:top-full sm:mt-1 w-[calc(100%-2rem)] sm:w-52 rounded-xl shadow-xl z-50 overflow-hidden"
                                  style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                                >
                                  <div className="py-2">
                                    <Link
                                      href={`/jobs/${job._id}`}
                                      className="flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    >
                                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      {language === 'ka' ? 'დეტალების ნახვა' : 'View Details'}
                                    </Link>
                                    <Link
                                      href={`/post-job?edit=${job._id}`}
                                      className="flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    >
                                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                      {language === 'ka' ? 'რედაქტირება' : 'Edit Job'}
                                    </Link>
                                    <div className="border-t border-neutral-100 dark:border-neutral-800 my-1 mx-3" />
                                    <button
                                      onClick={() => openDeleteModal(job._id)}
                                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                    >
                                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      {language === 'ka' ? 'წაშლა' : 'Delete Job'}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Job Stats Row */}
                        <div className="flex flex-wrap items-center gap-3 mt-4">
                          <div className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                            <Eye className="h-4 w-4 text-neutral-400" />
                            <span className="text-neutral-600 dark:text-neutral-400">{job.viewCount} {language === 'ka' ? 'ნახვა' : 'views'}</span>
                          </div>
                          <button
                            onClick={() => fetchProposalsForJob(job._id)}
                            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all ${
                              job.proposalCount > 0
                                ? 'bg-forest-600 dark:bg-primary-500 text-white hover:bg-forest-700 dark:hover:bg-primary-600 shadow-sm'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                            }`}
                          >
                            <FileText className="h-4 w-4" />
                            <span>{job.proposalCount} {language === 'ka' ? 'შეთავაზება' : (job.proposalCount !== 1 ? 'proposals' : 'proposal')}</span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                          {pendingProposals > 0 && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse">
                              {pendingProposals} {language === 'ka' ? 'ახალი' : 'new'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Proposals Section */}
                  {loadingProposals === job._id && (
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-center py-8" style={{ backgroundColor: 'var(--color-bg-primary)', borderRadius: '12px' }}>
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-300 border-t-forest-600 dark:border-neutral-600 dark:border-t-primary-400"></div>
                        <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'შეთავაზებები იტვირთება...' : 'Loading proposals...'}</span>
                      </div>
                    </div>
                  )}

                  {isExpanded && proposals.length > 0 && (
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                      <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4">
                          {language === 'ka' ? 'შეთავაზებები' : 'Proposals'} ({proposals.length})
                        </h4>
                        <div className="space-y-3">
                          {proposals.map((proposal) => (
                            <div
                              key={proposal._id}
                              className="p-4 rounded-xl"
                              style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
                            >
                              <div className="flex items-start gap-4">
                                {/* Pro Avatar */}
                                <div className="flex-shrink-0">
                                  <Avatar
                                    src={proposal.proProfileId?.userId?.avatar}
                                    name={proposal.proProfileId?.userId?.name || (language === 'ka' ? 'პროფესიონალი' : 'Professional')}
                                    size="md"
                                  />
                                </div>

                                {/* Proposal Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <Link
                                          href={`/professionals/${proposal.proProfileId?._id}`}
                                          className="font-medium text-neutral-900 dark:text-neutral-50 hover:text-forest-600 dark:hover:text-primary-400 transition-colors"
                                        >
                                          {proposal.proProfileId?.userId?.name || (language === 'ka' ? 'პროფესიონალი' : 'Professional')}
                                        </Link>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getProposalStatusColor(proposal.status)}`}>
                                          {getProposalStatusLabel(proposal.status)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {proposal.proProfileId?.title || (language === 'ka' ? 'პროფესიონალი' : 'Professional')}
                                      </p>
                                      {proposal.proProfileId?.avgRating > 0 && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <span className="text-amber-500">★</span>
                                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                            {proposal.proProfileId.avgRating.toFixed(1)} ({proposal.proProfileId.totalReviews} {language === 'ka' ? 'შეფასება' : 'reviews'})
                                          </span>
                                          {proposal.proProfileId.completedJobs && proposal.proProfileId.completedJobs > 0 && (
                                            <span className="text-sm text-neutral-500 dark:text-neutral-500 ml-2">
                                              · {proposal.proProfileId.completedJobs} {language === 'ka' ? 'პროექტი' : 'jobs'}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div className="text-right">
                                      <p className="text-lg font-semibold text-forest-600 dark:text-primary-400">
                                        ₾{proposal.proposedPrice?.toLocaleString() || 'N/A'}
                                      </p>
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {proposal.estimatedDuration} {(() => {
                                          const unit = proposal.estimatedDurationUnit || 'days';
                                          if (language === 'ka') {
                                            switch (unit) {
                                              case 'days': return 'დღე';
                                              case 'weeks': return 'კვირა';
                                              case 'months': return 'თვე';
                                              default: return unit;
                                            }
                                          }
                                          return unit;
                                        })()}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Cover Letter Preview */}
                                  <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                    {proposal.coverLetter}
                                  </p>

                                  {/* Contact Info (if revealed) */}
                                  {proposal.contactRevealed && proposal.proProfileId?.userId && (
                                    <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1">{language === 'ka' ? 'საკონტაქტო ინფორმაცია' : 'Contact Information'}</p>
                                      <p className="text-sm text-emerald-700 dark:text-emerald-400">
                                        {proposal.proProfileId.userId.email}
                                        {proposal.proProfileId.userId.phone && ` • ${proposal.proProfileId.userId.phone}`}
                                      </p>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  {proposal.status === 'pending' && (
                                    <div className="flex flex-wrap items-center gap-2 mt-4">
                                      <button
                                        onClick={() => handleAcceptProposal(proposal._id, job._id)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-forest-600 dark:bg-primary-500 text-white rounded-lg hover:bg-forest-700 dark:hover:bg-primary-600 transition-colors"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        {language === 'ka' ? 'მიღება' : 'Accept'}
                                      </button>
                                      {!proposal.contactRevealed && (
                                        <button
                                          onClick={() => handleRevealContact(proposal._id, job._id)}
                                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                                          style={{
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border)',
                                            color: 'var(--color-text-primary)'
                                          }}
                                        >
                                          <Eye className="h-4 w-4" />
                                          {language === 'ka' ? 'კონტაქტის ნახვა' : 'Reveal Contact'}
                                        </button>
                                      )}
                                      <Link
                                        href={`/professionals/${proposal.proProfileId?._id}`}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-forest-600 dark:text-primary-400 hover:underline"
                                      >
                                        {language === 'ka' ? 'პროფილის ნახვა' : 'View Profile'}
                                        <ArrowUpRight className="h-4 w-4" />
                                      </Link>
                                    </div>
                                  )}

                                  {proposal.status === 'accepted' && (
                                    <div className="flex items-center gap-2 mt-4">
                                      <Link
                                        href={`/messages?pro=${proposal.proProfileId?._id}`}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-forest-600 dark:bg-primary-500 text-white rounded-lg hover:bg-forest-700 dark:hover:bg-primary-600 transition-colors"
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                        {language === 'ka' ? 'მესიჯი' : 'Message'}
                                      </Link>
                                      <Link
                                        href={`/professionals/${proposal.proProfileId?._id}`}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-forest-600 dark:text-primary-400 hover:underline"
                                      >
                                        {language === 'ka' ? 'პროფილის ნახვა' : 'View Profile'}
                                        <ArrowUpRight className="h-4 w-4" />
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {isExpanded && proposals.length === 0 && !loadingProposals && (
                    <div className="px-6 pb-6">
                      <div
                        className="text-center py-8 rounded-xl"
                        style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
                      >
                        <FileText className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {language === 'ka' ? 'შეთავაზებები ჯერ არ მიგიღიათ' : 'No proposals received yet'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                      {language === 'ka' ? 'სამუშაოს წაშლა' : 'Delete Job'}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {language === 'ka' ? 'ეს მოქმედება შეუქცევადია' : 'This action cannot be undone'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDeleteModal}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                {language === 'ka'
                  ? 'გთხოვთ, მიუთითეთ წაშლის მიზეზი, რომ გავაუმჯობესოთ ჩვენი სერვისი:'
                  : 'Please tell us why you\'re deleting this job to help us improve:'}
              </p>

              {/* Reason Options */}
              <div className="space-y-2">
                {DELETE_REASONS.map((reason) => (
                  <label
                    key={reason.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      deleteReason === reason.id
                        ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-transparent'
                    }`}
                    style={{ border: '1px solid', borderColor: deleteReason === reason.id ? undefined : 'var(--color-border)' }}
                  >
                    <input
                      type="radio"
                      name="deleteReason"
                      value={reason.id}
                      checked={deleteReason === reason.id}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      deleteReason === reason.id
                        ? 'border-rose-500 bg-rose-500'
                        : 'border-neutral-300 dark:border-neutral-600'
                    }`}>
                      {deleteReason === reason.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      deleteReason === reason.id
                        ? 'text-rose-700 dark:text-rose-300 font-medium'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}>
                      {language === 'ka' ? reason.label : reason.labelEn}
                    </span>
                  </label>
                ))}
              </div>

              {/* Custom reason text area */}
              {deleteReason === 'other' && (
                <div className="mt-3">
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder={language === 'ka' ? 'დაწერეთ თქვენი მიზეზი...' : 'Please specify your reason...'}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                {language === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteJob}
                disabled={!deleteReason || isDeleting}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-2 ${
                  !deleteReason || isDeleting
                    ? 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600'
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {language === 'ka' ? 'იშლება...' : 'Deleting...'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {language === 'ka' ? 'წაშლა' : 'Delete'}
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
