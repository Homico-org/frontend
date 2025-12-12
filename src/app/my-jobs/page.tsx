'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import AppBackground from '@/components/common/AppBackground';
import Header from '@/components/common/Header';
import Link from 'next/link';
import {
  Briefcase,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Calendar,
  MoreVertical,
  Trash2,
  Edit3,
  ChevronRight,
  Search,
  Plus,
  ArrowLeft,
  Play,
  Users,
  Star,
  Mail,
  Phone,
  Check,
  MessageCircle,
  ExternalLink,
  X,
  AlertCircle
} from 'lucide-react';

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

  // Allow clients and pro users to access My Jobs
  const canAccessMyJobs = user?.role === 'client' || user?.role === 'pro';

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
      const response = await api.get(`/jobs/${jobId}/proposals`);
      setProposalsByJob(prev => ({ ...prev, [jobId]: response.data }));
      fetchMyJobs();
    } catch (err: any) {
      console.error('Failed to accept proposal:', err);
    }
  };

  const handleRevealContact = async (proposalId: string, jobId: string) => {
    try {
      await api.post(`/jobs/proposals/${proposalId}/reveal-contact`);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return Play;
      case 'in_progress': return Clock;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Briefcase;
    }
  };

  // Loading State
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen relative">
        <AppBackground />
        <Header />
        <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-terracotta-100 dark:bg-terracotta-500/20 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-terracotta-500 animate-pulse" />
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-2xl border-2 border-terracotta-200 dark:border-terracotta-500/30 border-t-terracotta-500 animate-spin" />
            </div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {language === 'ka' ? 'იტვირთება...' : 'Loading your jobs...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen relative">
        <AppBackground />
        <Header />
        <div className="relative z-10 flex items-center justify-center min-h-[60vh] p-4">
          <div className="rounded-2xl border-2 border-terracotta-200 dark:border-terracotta-500/30 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md shadow-card p-8 sm:p-12 text-center max-w-md w-full">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              {language === 'ka' ? 'დაფიქსირდა შეცდომა' : 'Something went wrong'}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">{error}</p>
            <Button onClick={fetchMyJobs}>
              {language === 'ka' ? 'თავიდან ცდა' : 'Try Again'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AppBackground />
      <Header />

      <main className="relative z-10 pt-6 sm:pt-10 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            {/* Back Navigation */}
            <button
              onClick={() => router.push('/browse')}
              className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4 hover:text-terracotta-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              {language === 'ka' ? 'მთავარი' : 'Back to Browse'}
            </button>

            {/* Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                  {language === 'ka' ? 'ჩემი განცხადებები' : 'My Jobs'}
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {language === 'ka'
                    ? 'მართე შენი პროექტები და ნახე შემოსული შეთავაზებები'
                    : 'Manage your projects and review incoming proposals'}
                </p>
              </div>

              {/* Post New Job Button */}
              <Button
                href="/post-job"
                size="md"
                icon={<Plus className="w-4 h-4" />}
              >
                {language === 'ka' ? 'ახალი განცხადება' : 'Post New Job'}
              </Button>
            </div>
          </div>

          {/* Stats Grid - Clickable filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: language === 'ka' ? 'სულ' : 'Total', value: stats.total, icon: Briefcase, filter: 'all' as StatusFilter },
              { label: language === 'ka' ? 'ღია' : 'Open', value: stats.open, icon: Play, filter: 'open' as StatusFilter },
              { label: language === 'ka' ? 'მიმდინარე' : 'In Progress', value: stats.inProgress, icon: Clock, filter: 'in_progress' as StatusFilter },
              { label: language === 'ka' ? 'დასრულებული' : 'Completed', value: stats.completed, icon: CheckCircle, filter: 'completed' as StatusFilter },
            ].map((stat) => {
              const isActive = statusFilter === stat.filter;
              return (
                <button
                  key={stat.label}
                  onClick={() => setStatusFilter(stat.filter)}
                  className={`group text-left rounded-2xl p-4 transition-all duration-200 border-2 backdrop-blur-sm ${
                    isActive
                      ? 'border-terracotta-500 bg-terracotta-500/10 shadow-lg scale-[1.02]'
                      : 'border-terracotta-200 dark:border-terracotta-500/30 bg-transparent hover:border-terracotta-400 dark:hover:border-terracotta-500/50 hover:bg-terracotta-500/5 hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${isActive ? 'bg-terracotta-500' : 'bg-terracotta-500/20'} p-2.5 rounded-xl transition-all group-hover:scale-110 ${isActive ? '' : 'group-hover:bg-terracotta-500/30'}`}>
                      <stat.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-terracotta-500'}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${isActive ? 'text-terracotta-600 dark:text-terracotta-400' : 'text-neutral-900 dark:text-neutral-50'}`}>
                        {stat.value}
                      </p>
                      <p className={`text-xs font-medium ${isActive ? 'text-terracotta-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="mt-6 mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-terracotta-400" />
              <input
                type="text"
                placeholder={language === 'ka' ? 'მოძებნე განცხადება...' : 'Search jobs...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-full bg-transparent backdrop-blur-sm border-2 border-terracotta-200 dark:border-terracotta-500/30 text-neutral-900 dark:text-neutral-50 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500/30 focus:border-terracotta-500 transition-all"
              />
            </div>
          </div>

          {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          /* Empty State */
          <div className="rounded-3xl border-2 border-terracotta-200 dark:border-terracotta-500/30 bg-transparent backdrop-blur-sm p-12 sm:p-16 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-terracotta mx-auto mb-8 flex items-center justify-center shadow-lg">
              <Briefcase className="w-12 h-12 text-white" />
            </div>

            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
              {jobs.length === 0
                ? (language === 'ka' ? 'ჯერ არ გაქვს განცხადება' : 'No jobs posted yet')
                : (language === 'ka' ? 'შედეგი ვერ მოიძებნა' : 'No matching jobs')}
            </h3>

            <p className="max-w-md mx-auto text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
              {jobs.length === 0
                ? (language === 'ka'
                    ? 'შექმენი პირველი პროექტი და დაიწყე პროფესიონალებისგან შეთავაზებების მიღება'
                    : 'Create your first project and start receiving proposals from skilled professionals')
                : (language === 'ka'
                    ? 'სცადე ფილტრების შეცვლა ან ახალი საძიებო სიტყვა'
                    : 'Try adjusting your filters or search with different keywords')}
            </p>

            {jobs.length === 0 && (
              <Button href="/post-job" size="lg" icon={<Plus className="w-5 h-5" />}>
                {language === 'ka' ? 'პირველი განცხადება' : 'Post Your First Job'}
              </Button>
            )}
          </div>
        ) : (
          /* Jobs Grid */
          <div className="space-y-5">
            {filteredJobs.map((job) => {
              const proposals = proposalsByJob[job._id] || [];
              const isExpanded = expandedJobId === job._id;
              const pendingProposals = proposals.filter(p => p.status === 'pending').length;
              const allMedia = [
                ...(job.media || []).map(m => ({ url: m.url, type: m.type })),
                ...(job.images || []).filter(img => !job.media?.some(m => m.url === img)).map(url => ({ url, type: 'image' as const }))
              ];
              const hasMedia = allMedia.length > 0;
              const StatusIcon = getStatusIcon(job.status);

              return (
                <div
                  key={job._id}
                  className="group rounded-2xl border-2 border-terracotta-200 dark:border-terracotta-500/30 bg-transparent backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-terracotta-400 dark:hover:border-terracotta-500/50 hover:shadow-lg hover:bg-terracotta-500/5"
                >
                  <div className={`flex flex-col ${hasMedia ? 'lg:flex-row' : ''}`}>
                    {/* Media Section */}
                    {hasMedia && (
                      <div className="relative lg:w-80 flex-shrink-0">
                        <div className="relative h-52 lg:h-full lg:min-h-[260px] overflow-hidden">
                          <img
                            src={storage.getFileUrl(allMedia[0].url)}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/5" />

                          {/* Media count */}
                          {allMedia.length > 1 && (
                            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                              {allMedia.length} {language === 'ka' ? 'ფოტო' : 'photos'}
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="absolute top-4 right-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg ${
                              job.status === 'open' ? 'bg-terracotta-500/95 text-white' :
                              job.status === 'in_progress' ? 'bg-amber-500/95 text-white' :
                              job.status === 'completed' ? 'bg-primary-500/95 text-white' :
                              'bg-neutral-500/95 text-white'
                            }`}>
                              {job.status === 'open' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              )}
                              <StatusIcon className="w-3.5 h-3.5" />
                              {getStatusLabel(job.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Content Section */}
                    <div className="flex-1 p-6 lg:p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Status badge for cards without media */}
                          {!hasMedia && (
                            <div className="mb-3">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                                job.status === 'open' ? 'bg-terracotta-100 dark:bg-terracotta-500/20 text-terracotta-600 dark:text-terracotta-400' :
                                job.status === 'in_progress' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                                job.status === 'completed' ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400' :
                                'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                              }`}>
                                {job.status === 'open' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 animate-pulse" />
                                )}
                                <StatusIcon className="w-3.5 h-3.5" />
                                {getStatusLabel(job.status)}
                              </span>
                            </div>
                          )}

                          {/* Title */}
                          <Link href={`/jobs/${job._id}`} className="block group/title">
                            <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-50 leading-snug line-clamp-2 transition-colors group-hover/title:text-terracotta-500">
                              {job.title}
                            </h3>
                          </Link>

                          {/* Meta info */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-terracotta-400" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1.5 font-semibold text-terracotta-600 dark:text-terracotta-400">
                              {formatBudget(job)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-terracotta-300" />
                              {formatDate(job.createdAt)}
                            </span>
                          </div>

                          {/* Description */}
                          {job.description && (
                            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                              {job.description}
                            </p>
                          )}
                        </div>

                        {/* Actions Menu */}
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() => setActionMenuJobId(actionMenuJobId === job._id ? null : job._id)}
                            className="p-2.5 rounded-xl text-terracotta-400 hover:text-terracotta-600 dark:hover:text-terracotta-300 hover:bg-terracotta-50 dark:hover:bg-terracotta-500/10 transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {actionMenuJobId === job._id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActionMenuJobId(null)} />
                              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-dark-elevated rounded-xl border border-terracotta-200 dark:border-terracotta-500/30 shadow-xl z-50 overflow-hidden py-2">
                                <Link
                                  href={`/jobs/${job._id}`}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-terracotta-50 dark:hover:bg-terracotta-500/10 transition-colors"
                                >
                                  <Eye className="w-4 h-4 text-terracotta-400" />
                                  {language === 'ka' ? 'დეტალების ნახვა' : 'View Details'}
                                </Link>
                                <Link
                                  href={`/post-job?edit=${job._id}`}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-terracotta-50 dark:hover:bg-terracotta-500/10 transition-colors"
                                >
                                  <Edit3 className="w-4 h-4 text-terracotta-400" />
                                  {language === 'ka' ? 'რედაქტირება' : 'Edit Job'}
                                </Link>
                                <div className="mx-3 my-1 border-t border-terracotta-100 dark:border-terracotta-500/20" />
                                <button
                                  onClick={() => openDeleteModal(job._id)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {language === 'ka' ? 'წაშლა' : 'Delete Job'}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Stats & Proposals Row */}
                      <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-terracotta-100 dark:border-terracotta-500/20">
                        {/* Views */}
                        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                          <Eye className="w-4 h-4 text-terracotta-400" />
                          <span className="font-medium">{job.viewCount}</span>
                          <span className="hidden sm:inline">{language === 'ka' ? 'ნახვა' : 'views'}</span>
                        </div>

                        <div className="w-px h-5 bg-terracotta-200 dark:bg-terracotta-500/30" />

                        {/* Proposals button */}
                        <button
                          onClick={() => fetchProposalsForJob(job._id)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                            job.proposalCount > 0
                              ? 'bg-terracotta-500 text-white shadow-md hover:shadow-lg hover:bg-terracotta-600'
                              : 'bg-terracotta-100 dark:bg-terracotta-500/20 text-terracotta-500 dark:text-terracotta-400'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          <span>
                            {job.proposalCount} {language === 'ka' ? 'შეთავაზება' : (job.proposalCount !== 1 ? 'proposals' : 'proposal')}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>

                        {/* New proposals badge */}
                        {pendingProposals > 0 && (
                          <span className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-terracotta-400 text-white shadow-md">
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-terracotta-300 rounded-full animate-ping" />
                            {pendingProposals} {language === 'ka' ? 'ახალი' : 'new'}
                          </span>
                        )}

                        {/* View link */}
                        <Link
                          href={`/jobs/${job._id}`}
                          className="ml-auto hidden sm:flex items-center gap-1.5 text-sm font-medium text-terracotta-500 hover:text-terracotta-600 transition-colors"
                        >
                          {language === 'ka' ? 'სრულად' : 'View details'}
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Loading Proposals */}
                  {loadingProposals === job._id && (
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-center py-12 rounded-xl bg-transparent border border-terracotta-200 dark:border-terracotta-500/30">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 rounded-full border-2 border-terracotta-200 border-t-terracotta-500 animate-spin" />
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">
                            {language === 'ka' ? 'შეთავაზებები იტვირთება...' : 'Loading proposals...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded Proposals */}
                  {isExpanded && proposals.length > 0 && (
                    <div className="px-6 pb-6">
                      <div className="pt-5 border-t border-terracotta-100 dark:border-terracotta-500/20">
                        <div className="flex items-center justify-between mb-5">
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                            <Users className="w-4 h-4 text-terracotta-500" />
                            {language === 'ka' ? 'შეთავაზებები' : 'Proposals'}
                            <span className="font-normal text-neutral-400">({proposals.length})</span>
                          </h4>
                        </div>

                        <div className="grid gap-4">
                          {proposals.map((proposal) => (
                            <div
                              key={proposal._id}
                              className="group/proposal p-5 rounded-xl bg-transparent border border-terracotta-200 dark:border-terracotta-500/30 transition-all duration-300 hover:border-terracotta-400 dark:hover:border-terracotta-500/50 hover:shadow-md hover:bg-terracotta-500/5"
                            >
                              <div className="flex flex-col sm:flex-row gap-4">
                                {/* Pro Info */}
                                <div className="flex items-start gap-4 flex-1">
                                  <div className="relative flex-shrink-0">
                                    <Avatar
                                      src={proposal.proProfileId?.userId?.avatar}
                                      name={proposal.proProfileId?.userId?.name || (language === 'ka' ? 'პროფესიონალი' : 'Professional')}
                                      size="lg"
                                      className="ring-2 ring-white dark:ring-dark-card shadow-md"
                                    />
                                    {proposal.proProfileId?.avgRating > 0 && (
                                      <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-terracotta-400 text-white text-[10px] font-bold shadow">
                                        <Star className="w-2.5 h-2.5 fill-current" />
                                        <span>{proposal.proProfileId.avgRating.toFixed(1)}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap mb-1">
                                      <Link
                                        href={`/professionals/${proposal.proProfileId?._id}`}
                                        className="font-semibold text-neutral-900 dark:text-neutral-50 hover:text-terracotta-500 transition-colors"
                                      >
                                        {proposal.proProfileId?.userId?.name || (language === 'ka' ? 'პროფესიონალი' : 'Professional')}
                                      </Link>
                                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                        proposal.status === 'pending' ? 'bg-terracotta-200 dark:bg-terracotta-500/30 text-terracotta-700 dark:text-terracotta-300' :
                                        proposal.status === 'accepted' ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400' :
                                        proposal.status === 'rejected' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' :
                                        'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                                      }`}>
                                        {getProposalStatusLabel(proposal.status)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                      {proposal.proProfileId?.title || (language === 'ka' ? 'პროფესიონალი' : 'Professional')}
                                    </p>
                                    {proposal.proProfileId?.completedJobs && proposal.proProfileId.completedJobs > 0 && (
                                      <p className="text-xs text-terracotta-400 mt-1">
                                        {proposal.proProfileId.completedJobs} {language === 'ka' ? 'დასრულებული პროექტი' : 'completed projects'}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Price & Duration */}
                                <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-1 sm:text-right">
                                  <p className="text-xl font-bold text-terracotta-500">
                                    ₾{proposal.proposedPrice?.toLocaleString() || 'N/A'}
                                  </p>
                                  <p className="text-xs text-terracotta-400">
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

                              {/* Cover Letter */}
                              <div className="mt-4 p-4 rounded-xl bg-transparent border border-terracotta-200 dark:border-terracotta-500/30 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                "{proposal.coverLetter}"
                              </div>

                              {/* Contact Info (if revealed) */}
                              {proposal.contactRevealed && proposal.proProfileId?.userId && (
                                <div className="mt-4 p-4 rounded-xl bg-terracotta-100 dark:bg-terracotta-500/20 border border-terracotta-300 dark:border-terracotta-500/40">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Check className="w-4 h-4 text-terracotta-600 dark:text-terracotta-400" />
                                    <p className="text-sm font-bold text-terracotta-700 dark:text-terracotta-300">
                                      {language === 'ka' ? 'საკონტაქტო ინფორმაცია' : 'Contact Information'}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-sm text-terracotta-700 dark:text-terracotta-300">
                                    <a href={`mailto:${proposal.proProfileId.userId.email}`} className="flex items-center gap-2 hover:underline">
                                      <Mail className="w-4 h-4" />
                                      {proposal.proProfileId.userId.email}
                                    </a>
                                    {proposal.proProfileId.userId.phone && (
                                      <a href={`tel:${proposal.proProfileId.userId.phone}`} className="flex items-center gap-2 hover:underline">
                                        <Phone className="w-4 h-4" />
                                        {proposal.proProfileId.userId.phone}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              {proposal.status === 'pending' && (
                                <div className="flex flex-wrap items-center gap-3 mt-5">
                                  <Button
                                    onClick={() => handleAcceptProposal(proposal._id, job._id)}
                                    size="sm"
                                    icon={<Check className="w-4 h-4" />}
                                  >
                                    {language === 'ka' ? 'მიღება' : 'Accept'}
                                  </Button>
                                  {!proposal.contactRevealed && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRevealContact(proposal._id, job._id)}
                                      icon={<Eye className="w-4 h-4" />}
                                    >
                                      {language === 'ka' ? 'კონტაქტის ნახვა' : 'Reveal Contact'}
                                    </Button>
                                  )}
                                  <Link
                                    href={`/professionals/${proposal.proProfileId?._id}`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-terracotta-500 hover:underline"
                                  >
                                    {language === 'ka' ? 'პროფილი' : 'View Profile'}
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              )}

                              {proposal.status === 'accepted' && (
                                <div className="flex flex-wrap items-center gap-3 mt-5">
                                  <Button
                                    href={`/messages?pro=${proposal.proProfileId?._id}`}
                                    size="sm"
                                    icon={<MessageCircle className="w-4 h-4" />}
                                  >
                                    {language === 'ka' ? 'მესიჯი' : 'Message'}
                                  </Button>
                                  <Link
                                    href={`/professionals/${proposal.proProfileId?._id}`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-terracotta-500 hover:underline"
                                  >
                                    {language === 'ka' ? 'პროფილი' : 'View Profile'}
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty proposals */}
                  {isExpanded && proposals.length === 0 && !loadingProposals && (
                    <div className="px-6 pb-6">
                      <div className="text-center py-12 rounded-xl bg-transparent border border-terracotta-200 dark:border-terracotta-500/30">
                        <div className="w-14 h-14 rounded-xl bg-terracotta-100 dark:bg-terracotta-500/20 mx-auto mb-4 flex items-center justify-center">
                          <FileText className="w-7 h-7 text-terracotta-400" />
                        </div>
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                          {language === 'ka' ? 'შეთავაზებები ჯერ არ მიგიღიათ' : 'No proposals received yet'}
                        </p>
                        <p className="text-xs text-terracotta-400 mt-1">
                          {language === 'ka' ? 'პროფესიონალები მალე დაგიკავშირდებიან' : 'Professionals will reach out soon'}
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
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDeleteModal} />

          <div className="relative w-full max-w-md bg-white/95 dark:bg-dark-card/95 backdrop-blur-xl rounded-2xl border-2 border-terracotta-200 dark:border-terracotta-500/30 shadow-2xl overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-500" />
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
                  className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                {language === 'ka'
                  ? 'გთხოვთ, მიუთითეთ წაშლის მიზეზი:'
                  : 'Please tell us why you\'re deleting this job:'}
              </p>

              <div className="space-y-2">
                {DELETE_REASONS.map((reason) => (
                  <label
                    key={reason.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      deleteReason === reason.id
                        ? 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30'
                        : 'border-terracotta-100 dark:border-terracotta-500/20 hover:border-terracotta-300 dark:hover:border-terracotta-500/40'
                    }`}
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
                        ? 'border-red-500 bg-red-500'
                        : 'border-terracotta-300 dark:border-terracotta-500/50'
                    }`}>
                      {deleteReason === reason.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      deleteReason === reason.id
                        ? 'text-red-700 dark:text-red-300 font-medium'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`}>
                      {language === 'ka' ? reason.label : reason.labelEn}
                    </span>
                  </label>
                ))}
              </div>

              {deleteReason === 'other' && (
                <div className="mt-3">
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder={language === 'ka' ? 'დაწერეთ თქვენი მიზეზი...' : 'Please specify your reason...'}
                    className="w-full px-4 py-3 rounded-xl bg-transparent border border-terracotta-200 dark:border-terracotta-500/30 text-neutral-900 dark:text-neutral-50 text-sm placeholder:text-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-terracotta-500/30 focus:border-terracotta-500"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 flex gap-3">
              <Button
                variant="outline"
                onClick={closeDeleteModal}
                fullWidth
              >
                {language === 'ka' ? 'გაუქმება' : 'Cancel'}
              </Button>
              <button
                onClick={handleDeleteJob}
                disabled={!deleteReason || isDeleting}
                className={`flex-1 px-4 py-3 rounded-full text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                  !deleteReason || isDeleting
                    ? 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {language === 'ka' ? 'იშლება...' : 'Deleting...'}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
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
