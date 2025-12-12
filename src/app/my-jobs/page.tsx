'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import Header from '@/components/common/Header';
import AppBackground from '@/components/common/AppBackground';
import Card, { CardImage, CardContent, CardBadge, CardFooter } from '@/components/common/Card';
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
  ChevronDown,
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
  AlertCircle,
  Sparkles
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
  const { locale: language } = useLanguage();
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

  const canAccessMyJobs = user?.role === 'client' || user?.role === 'pro';
  const hasFetched = useRef(false);

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
    if (isAuthenticated && canAccessMyJobs && !hasFetched.current) {
      hasFetched.current = true;
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
        <div className="relative z-20 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-[var(--color-accent)] animate-pulse" />
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-2xl border-2 border-[var(--color-accent)]/20 border-t-[var(--color-accent)] animate-spin" />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
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
        <div className="relative z-20 flex items-center justify-center min-h-[60vh] p-4">
          <div className="rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-xl p-8 sm:p-12 text-center max-w-md w-full">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {language === 'ka' ? 'დაფიქსირდა შეცდომა' : 'Something went wrong'}
            </h2>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
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

      <main className="relative z-20 pt-14 sm:pt-14 pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Inline header - matching browse layout style */}
          <div className="pt-1 pb-2 sm:pb-3">
            {/* Title Row */}
            <div className="flex items-center justify-between gap-3 mb-2 sm:mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => router.push('/browse')}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-accent)]/10 transition-colors"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                    {language === 'ka' ? 'ჩემი განცხადებები' : 'My Jobs'}
                  </h1>
                  <p className="text-xs sm:text-sm mt-0.5 opacity-70 line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {language === 'ka'
                      ? `${stats.total} განცხადება სულ`
                      : `${stats.total} jobs total`}
                  </p>
                </div>
              </div>

              <Button href="/post-job" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                {language === 'ka' ? 'ახალი' : 'New Job'}
              </Button>
            </div>

            {/* Filter tabs - matching browse style */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {[
                { label: language === 'ka' ? 'სულ' : 'All', value: stats.total, filter: 'all' as StatusFilter },
                { label: language === 'ka' ? 'ღია' : 'Open', value: stats.open, filter: 'open' as StatusFilter },
                { label: language === 'ka' ? 'მიმდინარე' : 'Active', value: stats.inProgress, filter: 'in_progress' as StatusFilter },
                { label: language === 'ka' ? 'დასრულებული' : 'Done', value: stats.completed, filter: 'completed' as StatusFilter },
              ].map((stat) => {
                const isActive = statusFilter === stat.filter;
                return (
                  <button
                    key={stat.filter}
                    onClick={() => setStatusFilter(stat.filter)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)]/5 border border-transparent'
                    }`}
                  >
                    <span>{stat.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isActive ? 'bg-[var(--color-accent)]/20' : 'bg-black/5 dark:bg-white/10'
                    }`}>
                      {stat.value}
                    </span>
                  </button>
                );
              })}

              {/* Search inline */}
              <div className="relative ml-auto pl-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                <input
                  type="text"
                  placeholder={language === 'ka' ? 'ძებნა...' : 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 sm:w-40 pl-8 pr-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-transparent text-xs placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent)]/30 transition-all"
                  style={{ color: 'var(--color-text-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="h-px mb-2 sm:mb-3 opacity-50" style={{ backgroundColor: 'var(--color-border)' }} />

          {/* Jobs List */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-[var(--color-accent)]/10 mx-auto mb-5 flex items-center justify-center">
                <Briefcase className="w-10 h-10 text-[var(--color-accent)]" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {jobs.length === 0
                  ? (language === 'ka' ? 'ჯერ არ გაქვს განცხადება' : 'No jobs posted yet')
                  : (language === 'ka' ? 'შედეგი ვერ მოიძებნა' : 'No matching jobs')}
              </h3>
              <p className="max-w-sm mx-auto text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                {jobs.length === 0
                  ? (language === 'ka'
                      ? 'შექმენი პირველი პროექტი და დაიწყე პროფესიონალებისგან შეთავაზებების მიღება'
                      : 'Create your first project and start receiving proposals')
                  : (language === 'ka'
                      ? 'სცადე ფილტრების შეცვლა'
                      : 'Try adjusting your filters')}
              </p>
              {jobs.length === 0 && (
                <Button href="/post-job" icon={<Sparkles className="w-4 h-4" />}>
                  {language === 'ka' ? 'პირველი განცხადება' : 'Post Your First Job'}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
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
                  <Card
                    key={job._id}
                    variant="elevated"
                    hover="lift"
                    className={`group ${
                      job.status === 'open'
                        ? 'ring-2 ring-[#D2691E]/30 ring-offset-1 ring-offset-[#FFFDF9] dark:ring-offset-[#1c1917]'
                        : ''
                    }`}
                  >
                    <div className={`flex flex-col ${hasMedia ? 'lg:flex-row' : ''}`}>
                      {/* Media Section */}
                      {hasMedia && (
                        <div className="relative lg:w-72 flex-shrink-0">
                          <CardImage aspectRatio="16/10" overlay="gradient" className="h-48 lg:h-full lg:min-h-[220px]">
                            <img
                              src={storage.getFileUrl(allMedia[0].url)}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {allMedia.length > 1 && (
                              <CardBadge position="bottom-left" variant="glass" color="neutral">
                                {allMedia.length} {language === 'ka' ? 'ფოტო' : 'photos'}
                              </CardBadge>
                            )}
                          </CardImage>
                        </div>
                      )}

                      {/* Content Section */}
                      <CardContent spacing="relaxed" className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Status Badge */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                job.status === 'open' ? 'bg-[#D2691E]/15 text-[#D2691E]' :
                                job.status === 'in_progress' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                                job.status === 'completed' ? 'bg-[#D2691E]/10 text-[#D2691E]/80' :
                                'bg-neutral-500/15 text-neutral-500'
                              }`}>
                                {job.status === 'open' && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                )}
                                <StatusIcon className="w-3 h-3" />
                                {getStatusLabel(job.status)}
                              </span>
                              {job.proposalCount > 0 && (
                                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-[#D2691E]/10 text-[#D2691E]">
                                  {job.proposalCount} {language === 'ka' ? 'შეთავაზება' : 'proposals'}
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <Link href={`/jobs/${job._id}`} className="block group/title">
                              <h3 className="text-lg font-semibold leading-snug line-clamp-2 transition-colors text-[var(--color-text-primary)] group-hover/title:text-[#D2691E]">
                                {job.title}
                              </h3>
                            </Link>

                            {/* Meta info */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-sm text-[var(--color-text-secondary)]">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#D2691E]/60" />
                                {job.location}
                              </span>
                              <span className="flex items-center gap-1.5 font-semibold text-[#D2691E]">
                                {formatBudget(job)}
                              </span>
                              <span className="flex items-center gap-1.5 opacity-60">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(job.createdAt)}
                              </span>
                            </div>

                            {/* Description */}
                            {job.description && (
                              <p className="mt-3 text-sm line-clamp-2 leading-relaxed text-[var(--color-text-tertiary)]">
                                {job.description}
                              </p>
                            )}
                          </div>

                          {/* Actions Menu */}
                          <div className="relative flex-shrink-0">
                            <button
                              onClick={() => setActionMenuJobId(actionMenuJobId === job._id ? null : job._id)}
                              className="p-2 rounded-xl hover:bg-[#D2691E]/10 transition-all text-[var(--color-text-tertiary)]"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>

                            {actionMenuJobId === job._id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActionMenuJobId(null)} />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-bg-elevated)] rounded-xl border border-[#E8D5C4]/40 dark:border-[#3d2f24]/40 shadow-xl z-50 overflow-hidden py-1">
                                  <Link
                                    href={`/jobs/${job._id}`}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[#D2691E]/5 transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                    {language === 'ka' ? 'დეტალები' : 'View Details'}
                                  </Link>
                                  <Link
                                    href={`/post-job?edit=${job._id}`}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[#D2691E]/5 transition-colors"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    {language === 'ka' ? 'რედაქტირება' : 'Edit Job'}
                                  </Link>
                                  <div className="mx-3 my-1 border-t border-[#E8D5C4]/40 dark:border-[#3d2f24]/40" />
                                  <button
                                    onClick={() => openDeleteModal(job._id)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    {language === 'ka' ? 'წაშლა' : 'Delete'}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </div>

                    {/* Stats & Proposals Row - Using CardFooter */}
                    <CardFooter className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-tertiary)]">
                        <Eye className="w-4 h-4" />
                        <span>{job.viewCount} {language === 'ka' ? 'ნახვა' : 'views'}</span>
                      </div>

                      <div className="w-px h-4 bg-[#E8D5C4]/40 dark:bg-[#3d2f24]/40" />

                      {/* Proposals button */}
                      <button
                        onClick={() => fetchProposalsForJob(job._id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                          job.proposalCount > 0
                            ? 'bg-[#D2691E] text-white shadow-sm hover:shadow-md'
                            : 'bg-[#D2691E]/5 border border-[#E8D5C4]/40 dark:border-[#3d2f24]/40 text-[var(--color-text-secondary)] hover:border-[#D2691E]/30'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span>
                          {job.proposalCount} {language === 'ka' ? 'შეთავაზება' : 'proposals'}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {pendingProposals > 0 && (
                        <span className="relative flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                          {pendingProposals} {language === 'ka' ? 'ახალი' : 'new'}
                        </span>
                      )}

                      <Link
                        href={`/jobs/${job._id}`}
                        className="ml-auto hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#D2691E] hover:underline"
                      >
                        {language === 'ka' ? 'სრულად' : 'View details'}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </CardFooter>

                    {/* Loading Proposals */}
                    {loadingProposals === job._id && (
                      <div className="px-5 pb-5">
                        <div className="flex items-center justify-center py-10 rounded-xl bg-[#D2691E]/5 border border-[#E8D5C4]/40 dark:border-[#3d2f24]/40">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-[#D2691E]/20 border-t-[#D2691E] animate-spin" />
                            <span className="text-sm text-[var(--color-text-secondary)]">
                              {language === 'ka' ? 'შეთავაზებები იტვირთება...' : 'Loading proposals...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expanded Proposals */}
                    {isExpanded && proposals.length > 0 && (
                      <div className="px-5 pb-5 border-t border-[#E8D5C4]/40 dark:border-[#3d2f24]/40 bg-[#D2691E]/[0.02]">
                        <div className="pt-5">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
                              <Users className="w-4 h-4 text-[#D2691E]" />
                              {language === 'ka' ? 'შეთავაზებები' : 'Proposals'}
                              <span className="font-normal text-[var(--color-text-tertiary)]">({proposals.length})</span>
                            </h4>
                          </div>

                          <div className="space-y-3">
                            {proposals.map((proposal) => (
                              <div
                                key={proposal._id}
                                className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[#E8D5C4]/40 dark:border-[#3d2f24]/40 transition-all hover:border-[#D2691E]/30 hover:shadow-sm"
                              >
                                <div className="flex flex-col sm:flex-row gap-4">
                                  {/* Pro Info */}
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="relative flex-shrink-0">
                                      <Avatar
                                        src={proposal.proProfileId?.userId?.avatar}
                                        name={proposal.proProfileId?.userId?.name || 'Pro'}
                                        size="md"
                                      />
                                      {proposal.proProfileId?.avgRating > 0 && (
                                        <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold shadow">
                                          <Star className="w-2.5 h-2.5 fill-current" />
                                          {proposal.proProfileId.avgRating.toFixed(1)}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <Link
                                          href={`/professionals/${proposal.proProfileId?._id}`}
                                          className="font-semibold text-[var(--color-text-primary)] hover:text-[#D2691E] transition-colors"
                                        >
                                          {proposal.proProfileId?.userId?.name || 'Professional'}
                                        </Link>
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                          proposal.status === 'pending' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                                          proposal.status === 'accepted' ? 'bg-[#D2691E]/15 text-[#D2691E]' :
                                          proposal.status === 'rejected' ? 'bg-red-500/15 text-red-600 dark:text-red-400' :
                                          'bg-neutral-500/15 text-neutral-500'
                                        }`}>
                                          {getProposalStatusLabel(proposal.status)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-[var(--color-text-tertiary)]">
                                        {proposal.proProfileId?.title || 'Professional'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Price */}
                                  <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0.5">
                                    <p className="text-xl font-bold text-[#D2691E]">
                                      ₾{proposal.proposedPrice?.toLocaleString() || 'N/A'}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-tertiary)]">
                                      {proposal.estimatedDuration} {proposal.estimatedDurationUnit === 'days' ? (language === 'ka' ? 'დღე' : 'days') : proposal.estimatedDurationUnit === 'weeks' ? (language === 'ka' ? 'კვირა' : 'weeks') : (language === 'ka' ? 'თვე' : 'months')}
                                    </p>
                                  </div>
                                </div>

                                {/* Cover Letter */}
                                <div className="mt-3 p-3 rounded-lg bg-[#D2691E]/5 border border-[#E8D5C4]/30 dark:border-[#3d2f24]/30 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                                  "{proposal.coverLetter}"
                                </div>

                                {/* Contact Info */}
                                {proposal.contactRevealed && proposal.proProfileId?.userId && (
                                  <div className="mt-3 p-3 rounded-lg bg-[#D2691E]/10 border border-[#D2691E]/20">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Check className="w-4 h-4 text-[#D2691E]" />
                                      <p className="text-sm font-semibold text-[#D2691E]">
                                        {language === 'ka' ? 'საკონტაქტო' : 'Contact Info'}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-[#D2691E]">
                                      <a href={`mailto:${proposal.proProfileId.userId.email}`} className="flex items-center gap-1.5 hover:underline">
                                        <Mail className="w-3.5 h-3.5" />
                                        {proposal.proProfileId.userId.email}
                                      </a>
                                      {proposal.proProfileId.userId.phone && (
                                        <a href={`tel:${proposal.proProfileId.userId.phone}`} className="flex items-center gap-1.5 hover:underline">
                                          <Phone className="w-3.5 h-3.5" />
                                          {proposal.proProfileId.userId.phone}
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                {proposal.status === 'pending' && (
                                  <div className="flex flex-wrap items-center gap-2 mt-4">
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
                                        {language === 'ka' ? 'კონტაქტი' : 'Contact'}
                                      </Button>
                                    )}
                                    <Link
                                      href={`/professionals/${proposal.proProfileId?._id}`}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#D2691E] hover:underline"
                                    >
                                      {language === 'ka' ? 'პროფილი' : 'Profile'}
                                      <ExternalLink className="w-3 h-3" />
                                    </Link>
                                  </div>
                                )}

                                {proposal.status === 'accepted' && (
                                  <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <Button
                                      href={`/messages?pro=${proposal.proProfileId?._id}`}
                                      size="sm"
                                      icon={<MessageCircle className="w-4 h-4" />}
                                    >
                                      {language === 'ka' ? 'მესიჯი' : 'Message'}
                                    </Button>
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
                      <div className="px-5 pb-5">
                        <div className="text-center py-10 rounded-xl bg-[#D2691E]/5 border border-[#E8D5C4]/40 dark:border-[#3d2f24]/40">
                          <div className="w-12 h-12 rounded-xl bg-[#D2691E]/10 mx-auto mb-3 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-[#D2691E]/60" />
                          </div>
                          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                            {language === 'ka' ? 'შეთავაზებები ჯერ არ მიგიღიათ' : 'No proposals yet'}
                          </p>
                          <p className="text-xs mt-1 text-[var(--color-text-tertiary)]">
                            {language === 'ka' ? 'პროფესიონალები მალე დაგიკავშირდებიან' : 'Professionals will reach out soon'}
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Delete Modal */}
      {deleteModalJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDeleteModal} />

          <div className="relative w-full max-w-md bg-[var(--color-bg-elevated)] rounded-2xl border shadow-2xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {language === 'ka' ? 'სამუშაოს წაშლა' : 'Delete Job'}
                  </h3>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                    {language === 'ka' ? 'ეს მოქმედება შეუქცევადია' : 'This action cannot be undone'}
                  </p>
                </div>
                <button
                  onClick={closeDeleteModal}
                  className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {language === 'ka' ? 'გთხოვთ, მიუთითეთ წაშლის მიზეზი:' : 'Please select a reason:'}
              </p>

              <div className="space-y-2">
                {DELETE_REASONS.map((reason) => (
                  <label
                    key={reason.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      deleteReason === reason.id
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/30'
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
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      deleteReason === reason.id ? 'border-red-500 bg-red-500' : 'border-[var(--color-border)]'
                    }`}>
                      {deleteReason === reason.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={`text-sm ${deleteReason === reason.id ? 'text-red-600 dark:text-red-400 font-medium' : ''}`} style={deleteReason !== reason.id ? { color: 'var(--color-text-secondary)' } : {}}>
                      {language === 'ka' ? reason.label : reason.labelEn}
                    </span>
                  </label>
                ))}
              </div>

              {deleteReason === 'other' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={language === 'ka' ? 'დაწერეთ მიზეზი...' : 'Specify your reason...'}
                  className="w-full mt-3 px-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border text-sm placeholder:text-[var(--color-text-tertiary)] resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  rows={3}
                />
              )}
            </div>

            <div className="p-4 pt-0 flex gap-3">
              <Button variant="outline" onClick={closeDeleteModal} fullWidth>
                {language === 'ka' ? 'გაუქმება' : 'Cancel'}
              </Button>
              <button
                onClick={handleDeleteJob}
                disabled={!deleteReason || isDeleting}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                  !deleteReason || isDeleting
                    ? 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg'
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
