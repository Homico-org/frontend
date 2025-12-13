'use client';

import AppBackground from '@/components/common/AppBackground';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import Header from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Mail,
  MapPin,
  MessageCircle,
  MoreVertical,
  Phone,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Timer,
  Trash2,
  Users,
  X,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  status: 'pending' | 'in_discussion' | 'accepted' | 'rejected' | 'withdrawn' | 'completed';
  contactRevealed: boolean;
  conversationId?: string;
  clientRespondedAt?: string;
  createdAt: string;
}

type StatusFilter = 'all' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
type ProposalFilter = 'all' | 'pending' | 'in_discussion' | 'accepted' | 'rejected';

// Helper to check if a job is expired (deadline has passed and job is still open)
const isJobExpired = (job: Job): boolean => {
  if (!job.deadline || job.status !== 'open') return false;
  const deadline = new Date(job.deadline);
  const now = new Date();
  return deadline < now;
};

export default function MyJobsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale: language } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposalsByJob, setProposalsByJob] = useState<Record<string, Proposal[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [loadingProposals, setLoadingProposals] = useState<string | null>(null);
  const [actionMenuJobId, setActionMenuJobId] = useState<string | null>(null);
  const [proposalFilter, setProposalFilter] = useState<ProposalFilter>('all');

  // Delete modal state
  const [deleteModalJobId, setDeleteModalJobId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Renew modal state
  const [renewModalJobId, setRenewModalJobId] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  // Chat modal state
  const [chatModalProposal, setChatModalProposal] = useState<Proposal | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Reject modal state
  const [rejectModalProposal, setRejectModalProposal] = useState<Proposal | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const canAccessMyJobs = user?.role === 'client' || user?.role === 'pro';
  const hasFetched = useRef(false);
  const jobCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hasScrolledToExpanded = useRef(false);

  // Read expanded job from URL on mount
  useEffect(() => {
    const expandedParam = searchParams.get('expanded');
    if (expandedParam) {
      setExpandedJobId(expandedParam);
    }
  }, [searchParams]);

  // Update URL when expanded job changes
  const updateExpandedInUrl = useCallback((jobId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (jobId) {
      params.set('expanded', jobId);
    } else {
      params.delete('expanded');
    }
    router.replace(`/my-jobs?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

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

  // Auto-fetch proposals when expanded from URL
  useEffect(() => {
    if (expandedJobId && !proposalsByJob[expandedJobId] && !loadingProposals) {
      fetchProposalsForJob(expandedJobId, true);
    }
  }, [expandedJobId, proposalsByJob, loadingProposals]);

  // Scroll to expanded job card when page loads with expanded param
  useEffect(() => {
    if (expandedJobId && !isLoading && !hasScrolledToExpanded.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const cardElement = jobCardRefs.current.get(expandedJobId);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          hasScrolledToExpanded.current = true;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [expandedJobId, isLoading]);

  const fetchProposalsForJob = async (jobId: string, fromUrl = false) => {
    const cachedProposals = proposalsByJob[jobId];

    // If clicking same expanded card, collapse it
    if (!fromUrl && expandedJobId === jobId) {
      setExpandedJobId(null);
      updateExpandedInUrl(null);
      return;
    }

    // If we have cached proposals, just expand
    if (cachedProposals) {
      setExpandedJobId(jobId);
      updateExpandedInUrl(jobId);
      setProposalFilter('all'); // Reset filter when opening new
      return;
    }

    try {
      setLoadingProposals(jobId);
      const response = await api.get(`/jobs/${jobId}/proposals`);
      const proposals = Array.isArray(response.data) ? response.data : [];
      setProposalsByJob(prev => ({ ...prev, [jobId]: proposals }));
      setExpandedJobId(jobId);
      updateExpandedInUrl(jobId);
      setProposalFilter('all');
    } catch (err: any) {
      console.error('Failed to fetch proposals:', err);
      toast.error(
        language === 'ka' ? 'შეცდომა' : 'Error',
        language === 'ka' ? 'შეთავაზებების ჩატვირთვა ვერ მოხერხდა' : 'Failed to load proposals'
      );
      setProposalsByJob(prev => ({ ...prev, [jobId]: [] }));
      setExpandedJobId(jobId);
      updateExpandedInUrl(jobId);
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
      toast.success(
        language === 'ka' ? 'შეთავაზება მიღებულია' : 'Proposal accepted',
        language === 'ka' ? 'პროფესიონალს ეცნობა' : 'The professional has been notified'
      );
    } catch (err: any) {
      console.error('Failed to accept proposal:', err);
      toast.error(
        language === 'ka' ? 'შეცდომა' : 'Error',
        language === 'ka' ? 'შეთავაზების მიღება ვერ მოხერხდა' : 'Failed to accept proposal'
      );
    }
  };

  const handleStartChat = async () => {
    if (!chatModalProposal || !chatMessage.trim()) return;

    setIsSendingChat(true);
    try {
      const response = await api.post(`/jobs/proposals/${chatModalProposal._id}/start-chat`, {
        message: chatMessage.trim()
      });

      const jobId = chatModalProposal.jobId;
      setProposalsByJob(prev => ({
        ...prev,
        [jobId]: prev[jobId]?.map(p =>
          p._id === chatModalProposal._id
            ? { ...p, status: 'in_discussion', conversationId: response.data.conversation._id }
            : p
        ) || []
      }));

      toast.success(
        language === 'ka' ? 'მესიჯი გაიგზავნა' : 'Message sent',
        language === 'ka' ? 'პროფესიონალი მიიღებს შეტყობინებას' : 'The professional will receive your message'
      );

      setChatModalProposal(null);
      setChatMessage('');

      router.push(`/messages?conversation=${response.data.conversation._id}`);
    } catch (err: any) {
      toast.error(
        language === 'ka' ? 'შეცდომა' : 'Error',
        err.response?.data?.message || 'Failed to start chat'
      );
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleRejectProposal = async () => {
    if (!rejectModalProposal) return;

    setIsRejecting(true);
    try {
      await api.post(`/jobs/proposals/${rejectModalProposal._id}/reject`, {
        reason: rejectReason
      });

      const jobId = rejectModalProposal.jobId;
      setProposalsByJob(prev => ({
        ...prev,
        [jobId]: prev[jobId]?.map(p =>
          p._id === rejectModalProposal._id
            ? { ...p, status: 'rejected' }
            : p
        ) || []
      }));

      toast.success(
        language === 'ka' ? 'შეთავაზება უარყოფილია' : 'Proposal rejected',
        language === 'ka' ? 'პროფესიონალი მიიღებს შეტყობინებას' : 'The professional will be notified'
      );

      setRejectModalProposal(null);
      setRejectReason('');
    } catch (err: any) {
      toast.error(
        language === 'ka' ? 'შეცდომა' : 'Error',
        err.response?.data?.message || 'Failed to reject proposal'
      );
    } finally {
      setIsRejecting(false);
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

  const openRenewModal = (jobId: string) => {
    setRenewModalJobId(jobId);
    setActionMenuJobId(null);
  };

  const closeRenewModal = () => {
    setRenewModalJobId(null);
  };

  const handleRenewJob = async () => {
    if (!renewModalJobId) return;

    setIsRenewing(true);
    try {
      // Renew the job by extending deadline by 30 days
      const newDeadline = new Date();
      newDeadline.setDate(newDeadline.getDate() + 30);

      await api.patch(`/jobs/${renewModalJobId}`, {
        deadline: newDeadline.toISOString()
      });

      // Refresh jobs list
      fetchMyJobs();
      closeRenewModal();
      toast.success(
        language === 'ka' ? 'პროექტი განახლდა' : 'Project renewed',
        language === 'ka' ? 'პროექტის ვადა გაგრძელდა 30 დღით' : 'Project deadline extended by 30 days'
      );
    } catch (err: any) {
      console.error('Failed to renew job:', err);
      toast.error(
        language === 'ka' ? 'შეცდომა' : 'Error',
        language === 'ka' ? 'პროექტის განახლება ვერ მოხერხდა' : 'Failed to renew the project'
      );
    } finally {
      setIsRenewing(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!deleteModalJobId || !deleteReason) return;

    setIsDeleting(true);
    try {
      await api.delete(`/jobs/${deleteModalJobId}`);
      setJobs(prev => prev.filter(job => job._id !== deleteModalJobId));
      if (expandedJobId === deleteModalJobId) {
        setExpandedJobId(null);
        updateExpandedInUrl(null);
      }
      closeDeleteModal();
      toast.success(
        language === 'ka' ? 'პროექტი წაიშალა' : 'Project deleted',
        language === 'ka' ? 'პროექტი წარმატებით წაიშალა' : 'The project has been successfully deleted'
      );
    } catch (err: any) {
      console.error('Failed to delete job:', err);
      toast.error(
        language === 'ka' ? 'შეცდომა' : 'Error',
        language === 'ka' ? 'პროექტის წაშლა ვერ მოხერხდა' : 'Failed to delete the project'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to get effective status (considers expiration)
  const getEffectiveStatus = (job: Job): string => {
    if (isJobExpired(job)) return 'expired';
    return job.status;
  };

  // Filter and search jobs
  const filteredJobs = jobs.filter(job => {
    const effectiveStatus = getEffectiveStatus(job);
    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
    const matchesSearch = searchQuery === '' ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate stats (considering expiration)
  const stats = {
    total: jobs.length,
    expired: jobs.filter(j => isJobExpired(j)).length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  // Filter proposals
  const getFilteredProposals = (proposals: Proposal[]) => {
    if (proposalFilter === 'all') return proposals;
    return proposals.filter(p => p.status === proposalFilter);
  };

  // Get proposal stats for current expanded job
  const getProposalStats = (proposals: Proposal[]) => ({
    total: proposals.length,
    pending: proposals.filter(p => p.status === 'pending').length,
    inDiscussion: proposals.filter(p => p.status === 'in_discussion').length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
  });

  const formatBudget = (job: Job) => {
    if (job.budgetType === 'fixed' && job.budgetAmount) {
      return `${job.budgetAmount.toLocaleString()}`;
    }
    if (job.budgetType === 'range' && job.budgetMin && job.budgetMax) {
      return `${job.budgetMin.toLocaleString()} - ${job.budgetMax.toLocaleString()}`;
    }
    if (job.budgetType === 'per_sqm' && job.pricePerUnit) {
      return `${job.pricePerUnit}/მ²`;
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
        case 'in_discussion': return 'განხილვაში';
        case 'accepted': return 'მიღებული';
        case 'rejected': return 'უარყოფილი';
        case 'withdrawn': return 'გაუქმებული';
        default: return status;
      }
    }
    switch (status) {
      case 'in_discussion': return 'In Discussion';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusLabel = (status: string) => {
    if (language === 'ka') {
      switch (status) {
        case 'open': return 'აქტიური';
        case 'expired': return 'ვადაგასული';
        case 'in_progress': return 'მიმდინარე';
        case 'completed': return 'დასრულებული';
        case 'cancelled': return 'გაუქმებული';
        default: return status;
      }
    }
    switch (status) {
      case 'open': return 'Active';
      case 'expired': return 'Expired';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return Play;
      case 'expired': return Timer;
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
              <div className="myjobs-stat-icon w-16 h-16">
                <Briefcase className="w-8 h-8 text-[#D2691E] animate-pulse" />
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-2xl border-2 border-[#D2691E]/20 border-t-[#D2691E] animate-spin" />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              {language === 'ka' ? 'იტვირთება...' : 'Loading your projects...'}
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
          <div className="myjobs-card p-8 sm:p-12 text-center max-w-md w-full animate-myjobs-scale-in">
            <div className="myjobs-modal-icon danger mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
              {language === 'ka' ? 'დაფიქსირდა შეცდომა' : 'Something went wrong'}
            </h2>
            <p className="mb-6 text-[var(--color-text-secondary)]">{error}</p>
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

      <main className="relative z-20 pt-16 sm:pt-20 pb-20 sm:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header Section */}
          <div className="myjobs-header py-6 sm:py-8 mb-6 animate-myjobs-fade-in" style={{ animationDelay: '0ms' }}>
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.push('/browse')}
                className="mt-1 p-2 rounded-xl hover:bg-[#D2691E]/10 transition-all text-[var(--color-text-tertiary)] hover:text-[#D2691E]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="myjobs-title">
                  {language === 'ka' ? 'ჩემი პროექტები' : 'My Projects'}
                </h1>
                <p className="myjobs-subtitle">
                  {language === 'ka'
                    ? 'მართე შენი განცხადებები და შეთავაზებები'
                    : 'Manage your listings and proposals'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards + Search Row */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6 animate-myjobs-fade-in" style={{ animationDelay: '100ms' }}>
            {/* Stats Cards */}
            <div className="flex-1 grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { key: 'all' as StatusFilter, value: stats.total, label: language === 'ka' ? 'სულ' : 'Total', icon: Briefcase },
                { key: 'expired' as StatusFilter, value: stats.expired, label: language === 'ka' ? 'ვადაგასული' : 'Expired', icon: Timer },
                { key: 'in_progress' as StatusFilter, value: stats.inProgress, label: language === 'ka' ? 'მიმდინარე' : 'Progress', icon: Clock },
                { key: 'completed' as StatusFilter, value: stats.completed, label: language === 'ka' ? 'დასრული' : 'Done', icon: CheckCircle },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <button
                    key={stat.key}
                    onClick={() => setStatusFilter(stat.key)}
                    className={`myjobs-stat-card text-left ${statusFilter === stat.key ? 'active' : ''} ${stat.key === 'expired' && stat.value > 0 ? 'expired' : ''}`}
                  >
                    <div className="myjobs-stat-icon">
                      <Icon className={`w-4 h-4 ${stat.key === 'expired' && stat.value > 0 ? 'text-orange-500' : 'text-[#D2691E]'}`} />
                    </div>
                    <div className={`myjobs-stat-value text-xl sm:text-2xl ${stat.key === 'expired' && stat.value > 0 ? 'text-orange-500' : ''}`}>{stat.value}</div>
                    <div className="myjobs-stat-label text-[10px] sm:text-xs truncate">{stat.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="myjobs-search lg:w-64">
              <Search className="myjobs-search-icon" />
              <input
                type="text"
                placeholder={language === 'ka' ? 'ძებნა...' : 'Search projects...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="myjobs-search-input w-full"
              />
            </div>
          </div>

          {/* Jobs List */}
          {filteredJobs.length === 0 ? (
            <div className="myjobs-empty animate-myjobs-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="myjobs-empty-icon">
                <Briefcase />
              </div>
              <h3 className="myjobs-empty-title">
                {jobs.length === 0
                  ? (language === 'ka' ? 'ჯერ არ გაქვს პროექტი' : 'No projects yet')
                  : (language === 'ka' ? 'შედეგი ვერ მოიძებნა' : 'No matching projects')}
              </h3>
              <p className="myjobs-empty-description">
                {jobs.length === 0
                  ? (language === 'ka'
                      ? 'შექმენი პირველი პროექტი და დაიწყე პროფესიონალებისგან შეთავაზებების მიღება'
                      : 'Create your first project and start receiving proposals from professionals')
                  : (language === 'ka'
                      ? 'სცადე ფილტრების შეცვლა'
                      : 'Try adjusting your filters')}
              </p>
              {jobs.length === 0 && (
                <Button href="/post-job" icon={<Sparkles className="w-4 h-4" />}>
                  {language === 'ka' ? 'პირველი პროექტი' : 'Create First Project'}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job, index) => {
                const proposals = proposalsByJob[job._id] || [];
                const isExpanded = expandedJobId === job._id;
                const filteredProposals = getFilteredProposals(proposals);
                const proposalStats = getProposalStats(proposals);
                const pendingProposals = proposalStats.pending;
                const allMedia = [
                  ...(job.media || []).map(m => ({ url: m.url, type: m.type })),
                  ...(job.images || []).filter(img => !job.media?.some(m => m.url === img)).map(url => ({ url, type: 'image' as const }))
                ];
                const hasMedia = allMedia.length > 0;
                const effectiveStatus = getEffectiveStatus(job);
                const StatusIcon = getStatusIcon(effectiveStatus);
                const jobIsExpired = isJobExpired(job);

                return (
                  <div
                    key={job._id}
                    ref={(el) => {
                      if (el) jobCardRefs.current.set(job._id, el);
                    }}
                    className={`myjobs-card status-${effectiveStatus} animate-myjobs-fade-in group`}
                    style={{ animationDelay: `${200 + index * 50}ms` }}
                  >
                    <div className={`flex flex-col ${hasMedia ? 'lg:flex-row' : ''}`}>
                      {/* Media Section */}
                      {hasMedia && (
                        <Link
                          href={`/jobs/${job._id}`}
                          className="myjobs-card-media w-full lg:w-56 xl:w-64 flex-shrink-0 h-40 lg:h-auto lg:min-h-[180px] rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none"
                        >
                          <img
                            src={storage.getFileUrl(allMedia[0].url)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {allMedia.length > 1 && (
                            <div className="myjobs-card-media-count">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                                  <path d="M21 15l-5-5L5 21" />
                                </svg>
                                {allMedia.length}
                              </span>
                            </div>
                          )}
                        </Link>
                      )}

                      {/* Content Section */}
                      <div className="myjobs-card-content flex-1 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Status Badge Row */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className={`myjobs-status-badge ${effectiveStatus}`}>
                                {effectiveStatus === 'open' && <span className="myjobs-status-indicator" />}
                                <StatusIcon className="w-3 h-3" />
                                {getStatusLabel(effectiveStatus)}
                              </span>
                              {job.proposalCount > 0 && (
                                <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {job.proposalCount}
                                </span>
                              )}
                              {pendingProposals > 0 && isExpanded && (
                                <span className="myjobs-new-badge text-[10px]">
                                  {pendingProposals} {language === 'ka' ? 'ახალი' : 'new'}
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <Link href={`/jobs/${job._id}`}>
                              <h3 className="myjobs-card-title text-base sm:text-lg line-clamp-1">
                                {job.title}
                              </h3>
                            </Link>

                            {/* Meta info */}
                            <div className="myjobs-card-meta text-xs sm:text-sm mt-1.5">
                              <span className="myjobs-card-meta-item">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">{job.location}</span>
                              </span>
                              <span className="myjobs-card-budget text-sm">
                                ₾{formatBudget(job)}
                              </span>
                              <span className="myjobs-card-meta-item opacity-60 hidden sm:flex">
                                <Calendar className="w-3 h-3" />
                                {formatDate(job.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Actions Menu */}
                          <div className="relative flex-shrink-0">
                            <button
                              onClick={() => setActionMenuJobId(actionMenuJobId === job._id ? null : job._id)}
                              className="p-1.5 rounded-lg hover:bg-[#D2691E]/10 transition-all text-[var(--color-text-tertiary)]"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {actionMenuJobId === job._id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActionMenuJobId(null)} />
                                <div className="myjobs-action-menu animate-myjobs-scale-in">
                                  <Link href={`/jobs/${job._id}`} className="myjobs-action-menu-item">
                                    <Eye className="w-4 h-4" />
                                    {language === 'ka' ? 'დეტალები' : 'View'}
                                  </Link>
                                  <Link href={`/post-job?edit=${job._id}`} className="myjobs-action-menu-item">
                                    <Edit3 className="w-4 h-4" />
                                    {language === 'ka' ? 'რედაქტირება' : 'Edit'}
                                  </Link>
                                  {jobIsExpired && (
                                    <button onClick={() => openRenewModal(job._id)} className="myjobs-action-menu-item renew">
                                      <RefreshCw className="w-4 h-4" />
                                      {language === 'ka' ? 'განახლება' : 'Renew'}
                                    </button>
                                  )}
                                  <div className="mx-3 my-1 border-t border-[var(--color-border-subtle)]" />
                                  <button onClick={() => openDeleteModal(job._id)} className="myjobs-action-menu-item danger">
                                    <Trash2 className="w-4 h-4" />
                                    {language === 'ka' ? 'წაშლა' : 'Delete'}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Footer Row - Inline with content */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{job.viewCount}</span>
                          </div>

                          <div className="w-px h-3 bg-[var(--color-border-subtle)]" />

                          {/* Proposals button */}
                          <button
                            onClick={() => fetchProposalsForJob(job._id)}
                            className={`myjobs-proposals-btn text-xs py-1.5 px-3 ${job.proposalCount > 0 ? 'has-proposals' : 'empty'}`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{job.proposalCount}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          <Link
                            href={`/jobs/${job._id}`}
                            className="ml-auto flex items-center gap-1 text-xs font-medium text-[#D2691E] hover:underline"
                          >
                            {language === 'ka' ? 'ვრცლად' : 'Details'}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Loading Proposals */}
                    {loadingProposals === job._id && (
                      <div className="px-5 pb-5">
                        <div className="myjobs-loading">
                          <div className="flex flex-col items-center gap-3">
                            <div className="myjobs-loading-spinner" />
                            <span className="text-sm text-[var(--color-text-secondary)]">
                              {language === 'ka' ? 'იტვირთება...' : 'Loading...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expanded Proposals */}
                    {isExpanded && proposals.length > 0 && (
                      <div className="myjobs-proposals-section animate-myjobs-scale-in">
                        {/* Proposals Header with Filter */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <h4 className="myjobs-proposals-title">
                            <Users className="w-4 h-4" />
                            {language === 'ka' ? 'შეთავაზებები' : 'Proposals'}
                            <span className="font-normal text-[var(--color-text-tertiary)]">
                              ({filteredProposals.length}{proposalFilter !== 'all' ? `/${proposals.length}` : ''})
                            </span>
                          </h4>

                          {/* Proposal Filter Pills */}
                          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                            <Filter className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] flex-shrink-0" />
                            {[
                              { key: 'all' as ProposalFilter, label: language === 'ka' ? 'ყველა' : 'All', count: proposalStats.total },
                              { key: 'pending' as ProposalFilter, label: language === 'ka' ? 'ახალი' : 'New', count: proposalStats.pending },
                              { key: 'in_discussion' as ProposalFilter, label: language === 'ka' ? 'მიმოწერა' : 'Chat', count: proposalStats.inDiscussion },
                              { key: 'accepted' as ProposalFilter, label: language === 'ka' ? 'მიღებული' : 'Accepted', count: proposalStats.accepted },
                            ].filter(f => f.count > 0 || f.key === 'all').map((filter) => (
                              <button
                                key={filter.key}
                                onClick={() => setProposalFilter(filter.key)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all ${
                                  proposalFilter === filter.key
                                    ? 'bg-[#D2691E] text-white'
                                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[#D2691E]/10'
                                }`}
                              >
                                {filter.label}
                                {filter.count > 0 && (
                                  <span className={`px-1 rounded text-[9px] ${
                                    proposalFilter === filter.key ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'
                                  }`}>
                                    {filter.count}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {filteredProposals.length === 0 ? (
                          <div className="text-center py-6 text-sm text-[var(--color-text-tertiary)]">
                            {language === 'ka' ? 'ამ სტატუსით შეთავაზებები არ არის' : 'No proposals with this status'}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {filteredProposals.map((proposal) => (
                              <div key={proposal._id} className="myjobs-proposal-card">
                                <div className="flex flex-col sm:flex-row gap-3">
                                  {/* Pro Info */}
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="myjobs-pro-avatar">
                                      <Avatar
                                        src={proposal.proProfileId?.userId?.avatar}
                                        name={proposal.proProfileId?.userId?.name || 'Pro'}
                                        size="md"
                                      />
                                      {proposal.proProfileId?.avgRating > 0 && (
                                        <div className="myjobs-pro-rating">
                                          <Star className="w-2.5 h-2.5 fill-current" />
                                          {proposal.proProfileId.avgRating.toFixed(1)}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <Link
                                          href={`/professionals/${proposal.proProfileId?._id}`}
                                          className="myjobs-pro-name text-sm"
                                        >
                                          {proposal.proProfileId?.userId?.name || 'Professional'}
                                        </Link>
                                        <span className={`myjobs-proposal-status ${proposal.status}`}>
                                          {getProposalStatusLabel(proposal.status)}
                                        </span>
                                      </div>
                                      <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                                        {proposal.proProfileId?.title || 'Professional'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Price */}
                                  <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0.5">
                                    <p className="myjobs-proposal-price text-lg">
                                      ₾{proposal.proposedPrice?.toLocaleString() || 'N/A'}
                                    </p>
                                    <p className="myjobs-proposal-duration text-[10px]">
                                      {proposal.estimatedDuration} {proposal.estimatedDurationUnit === 'days' ? (language === 'ka' ? 'დღე' : 'days') : proposal.estimatedDurationUnit === 'weeks' ? (language === 'ka' ? 'კვ.' : 'wk') : (language === 'ka' ? 'თვე' : 'mo')}
                                    </p>
                                  </div>
                                </div>

                                {/* Cover Letter */}
                                <div className="myjobs-cover-letter text-xs mt-3">
                                  "{proposal.coverLetter.length > 200 ? proposal.coverLetter.slice(0, 200) + '...' : proposal.coverLetter}"
                                </div>

                                {/* Contact Info */}
                                {proposal.contactRevealed && proposal.proProfileId?.userId && (
                                  <div className="myjobs-contact-revealed mt-3">
                                    <div className="myjobs-contact-revealed-badge text-xs">
                                      <Check className="w-3.5 h-3.5" />
                                      {language === 'ka' ? 'საკონტაქტო' : 'Contact'}
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs">
                                      <a href={`mailto:${proposal.proProfileId.userId.email}`} className="myjobs-contact-link">
                                        <Mail className="w-3 h-3" />
                                        {proposal.proProfileId.userId.email}
                                      </a>
                                      {proposal.proProfileId.userId.phone && (
                                        <a href={`tel:${proposal.proProfileId.userId.phone}`} className="myjobs-contact-link">
                                          <Phone className="w-3 h-3" />
                                          {proposal.proProfileId.userId.phone}
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                {(proposal.status === 'pending' || proposal.status === 'in_discussion') && (
                                  <div className="myjobs-proposal-actions text-xs">
                                    {proposal.status === 'pending' && (
                                      <button onClick={() => setChatModalProposal(proposal)} className="myjobs-action-btn outline py-1.5 px-2.5">
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        {language === 'ka' ? 'მესიჯი' : 'Message'}
                                      </button>
                                    )}

                                    {proposal.status === 'in_discussion' && proposal.conversationId && (
                                      <Link href={`/messages?conversation=${proposal.conversationId}`} className="myjobs-action-btn primary py-1.5 px-2.5">
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        {language === 'ka' ? 'ჩატი' : 'Chat'}
                                      </Link>
                                    )}

                                    <button onClick={() => handleAcceptProposal(proposal._id, job._id)} className="myjobs-action-btn success py-1.5 px-2.5">
                                      <Check className="w-3.5 h-3.5" />
                                      {language === 'ka' ? 'მიღება' : 'Accept'}
                                    </button>

                                    <button onClick={() => setRejectModalProposal(proposal)} className="myjobs-action-btn danger py-1.5 px-2.5">
                                      <X className="w-3.5 h-3.5" />
                                    </button>

                                    <Link
                                      href={`/professionals/${proposal.proProfileId?._id}`}
                                      className="ml-auto text-xs font-medium text-[#D2691E] hover:underline flex items-center gap-1"
                                    >
                                      {language === 'ka' ? 'პროფილი' : 'Profile'}
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </Link>
                                  </div>
                                )}

                                {(proposal.status === 'accepted' || proposal.status === 'completed') && (
                                  <div className="myjobs-proposal-actions text-xs">
                                    <Link
                                      href={proposal.conversationId ? `/messages?conversation=${proposal.conversationId}` : `/messages?pro=${proposal.proProfileId?._id}`}
                                      className="myjobs-action-btn primary py-1.5 px-2.5"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      {language === 'ka' ? 'მესიჯი' : 'Message'}
                                    </Link>
                                    <Link
                                      href={`/professionals/${proposal.proProfileId?._id}`}
                                      className="ml-auto text-xs font-medium text-[#D2691E] hover:underline flex items-center gap-1"
                                    >
                                      {language === 'ka' ? 'პროფილი' : 'Profile'}
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </Link>
                                  </div>
                                )}

                                {proposal.status === 'rejected' && (
                                  <div className="mt-2 text-[10px] text-[var(--color-text-tertiary)] italic">
                                    {language === 'ka' ? 'უარყოფილი' : 'Rejected'}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Empty proposals */}
                    {isExpanded && proposals.length === 0 && !loadingProposals && (
                      <div className="px-5 pb-5">
                        <div className="myjobs-proposals-empty">
                          <div className="myjobs-proposals-empty-icon">
                            <FileText />
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Delete Modal */}
      {deleteModalJobId && (
        <div className="myjobs-modal-overlay">
          <div className="myjobs-modal-backdrop" onClick={closeDeleteModal} />
          <div className="myjobs-modal animate-myjobs-scale-in">
            <div className="myjobs-modal-header">
              <div className="myjobs-modal-icon danger">
                <Trash2 />
              </div>
              <div className="flex-1">
                <h3 className="myjobs-modal-title">
                  {language === 'ka' ? 'პროექტის წაშლა' : 'Delete Project'}
                </h3>
                <p className="myjobs-modal-subtitle">
                  {language === 'ka' ? 'ეს მოქმედება შეუქცევადია' : 'This action cannot be undone'}
                </p>
              </div>
              <button onClick={closeDeleteModal} className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-tertiary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="myjobs-modal-content">
              <p className="text-sm mb-4 text-[var(--color-text-secondary)]">
                {language === 'ka' ? 'გთხოვთ, მიუთითეთ წაშლის მიზეზი:' : 'Please select a reason:'}
              </p>

              <div className="space-y-2">
                {DELETE_REASONS.map((reason) => (
                  <label key={reason.id} className={`myjobs-radio-option ${deleteReason === reason.id ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="deleteReason"
                      value={reason.id}
                      checked={deleteReason === reason.id}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      className="sr-only"
                    />
                    <div className="myjobs-radio-circle">
                      {deleteReason === reason.id && <div className="myjobs-radio-dot" />}
                    </div>
                    <span className={`text-sm ${deleteReason === reason.id ? 'text-red-600 dark:text-red-400 font-medium' : 'text-[var(--color-text-secondary)]'}`}>
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
                  className="myjobs-textarea mt-3"
                  rows={3}
                />
              )}
            </div>

            <div className="myjobs-modal-footer">
              <button onClick={closeDeleteModal} className="myjobs-btn outline flex-1">
                {language === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button onClick={handleDeleteJob} disabled={!deleteReason || isDeleting} className="myjobs-btn danger flex-1">
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

      {/* Start Chat Modal */}
      {chatModalProposal && (
        <div className="myjobs-modal-overlay">
          <div className="myjobs-modal-backdrop" onClick={() => setChatModalProposal(null)} />
          <div className="myjobs-modal max-w-lg animate-myjobs-scale-in">
            <div className="myjobs-modal-header">
              <div className="myjobs-modal-icon primary">
                <MessageCircle />
              </div>
              <div className="flex-1">
                <h3 className="myjobs-modal-title">
                  {language === 'ka' ? 'მესიჯის გაგზავნა' : 'Send Message'}
                </h3>
                <p className="myjobs-modal-subtitle">
                  {chatModalProposal.proProfileId?.userId?.name || 'Professional'}
                </p>
              </div>
              <button onClick={() => setChatModalProposal(null)} className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-tertiary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="myjobs-modal-content">
              <div className="myjobs-proposal-card mb-4 p-3">
                <div className="flex items-center gap-3">
                  <Avatar src={chatModalProposal.proProfileId?.userId?.avatar} name={chatModalProposal.proProfileId?.userId?.name || 'Pro'} size="sm" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-[var(--color-text-primary)]">{chatModalProposal.proProfileId?.userId?.name}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{chatModalProposal.proProfileId?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#D2691E]">₾{chatModalProposal.proposedPrice?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
                  {language === 'ka' ? 'შენი მესიჯი' : 'Your message'}
                </label>
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={language === 'ka' ? 'დაწერე მესიჯი...' : 'Write a message...'}
                  className="myjobs-textarea"
                  rows={4}
                />
              </div>
            </div>

            <div className="myjobs-modal-footer">
              <button onClick={() => setChatModalProposal(null)} className="myjobs-btn outline flex-1">
                {language === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button onClick={handleStartChat} disabled={!chatMessage.trim() || isSendingChat} className="myjobs-btn primary flex-1">
                {isSendingChat ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {language === 'ka' ? 'იგზავნება...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    {language === 'ka' ? 'გაგზავნა' : 'Send'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Proposal Modal */}
      {rejectModalProposal && (
        <div className="myjobs-modal-overlay">
          <div className="myjobs-modal-backdrop" onClick={() => setRejectModalProposal(null)} />
          <div className="myjobs-modal animate-myjobs-scale-in">
            <div className="myjobs-modal-header">
              <div className="myjobs-modal-icon danger">
                <XCircle />
              </div>
              <div className="flex-1">
                <h3 className="myjobs-modal-title">
                  {language === 'ka' ? 'შეთავაზების უარყოფა' : 'Reject Proposal'}
                </h3>
                <p className="myjobs-modal-subtitle">
                  {rejectModalProposal.proProfileId?.userId?.name || 'Professional'}
                </p>
              </div>
              <button onClick={() => setRejectModalProposal(null)} className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-tertiary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="myjobs-modal-content">
              <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
                {language === 'ka' ? 'მიზეზი (არასავალდებულო)' : 'Reason (optional)'}
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={language === 'ka' ? 'მაგ: ფასი არ შეესაბამება ბიუჯეტს...' : 'e.g., The price does not match my budget...'}
                className="myjobs-textarea"
                rows={3}
              />
            </div>

            <div className="myjobs-modal-footer">
              <button onClick={() => setRejectModalProposal(null)} className="myjobs-btn outline flex-1">
                {language === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button onClick={handleRejectProposal} disabled={isRejecting} className="myjobs-btn danger flex-1">
                {isRejecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {language === 'ka' ? 'მიმდინარეობს...' : 'Rejecting...'}
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    {language === 'ka' ? 'უარყოფა' : 'Reject'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Job Modal */}
      {renewModalJobId && (
        <div className="myjobs-modal-overlay">
          <div className="myjobs-modal-backdrop" onClick={closeRenewModal} />
          <div className="myjobs-modal animate-myjobs-scale-in">
            <div className="myjobs-modal-header">
              <div className="myjobs-modal-icon renew">
                <RefreshCw />
              </div>
              <div className="flex-1">
                <h3 className="myjobs-modal-title">
                  {language === 'ka' ? 'პროექტის განახლება' : 'Renew Project'}
                </h3>
                <p className="myjobs-modal-subtitle">
                  {language === 'ka' ? 'ვადა გაგრძელდება 30 დღით' : 'Deadline will be extended by 30 days'}
                </p>
              </div>
              <button onClick={closeRenewModal} className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-tertiary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="myjobs-modal-content">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                  <Timer className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {language === 'ka' ? 'პროექტის ვადა ამოიწურა' : 'Project deadline has expired'}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                    {language === 'ka'
                      ? 'განახლების შემდეგ პროექტი ხელახლა გამოჩნდება პროფესიონალებისთვის'
                      : 'After renewal, the project will be visible to professionals again'}
                  </p>
                </div>
              </div>
            </div>

            <div className="myjobs-modal-footer">
              <button onClick={closeRenewModal} className="myjobs-btn outline flex-1">
                {language === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button onClick={handleRenewJob} disabled={isRenewing} className="myjobs-btn renew flex-1">
                {isRenewing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {language === 'ka' ? 'მიმდინარეობს...' : 'Renewing...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    {language === 'ka' ? 'განახლება' : 'Renew'}
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
