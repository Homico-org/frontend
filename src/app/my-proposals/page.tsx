'use client';

import AppBackground from '@/components/common/AppBackground';
import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import Header, { HeaderSpacer } from '@/components/common/Header';
import PollsTab from '@/components/polls/PollsTab';
import ProjectChat from '@/components/projects/ProjectChat';
import ProjectWorkspace from '@/components/projects/ProjectWorkspace';
import { ConfirmModal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Briefcase,
  Building2,
  CheckCheck,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Play,
  Search,
  Send,
  Timer,
  X,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type ProposalStatus = 'pending' | 'in_discussion' | 'accepted' | 'rejected' | 'withdrawn' | 'completed';

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budgetType: string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
  pricePerUnit?: number;
  deadline?: string;
  status: string;
  images: string[];
  media: { type: string; url: string }[];
  proposalCount: number;
  viewCount: number;
  createdAt: string;
  clientId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    city?: string;
    phone?: string;
    accountType?: string;
    companyName?: string;
  };
}

interface ProjectTracking {
  _id: string;
  currentStage: 'hired' | 'started' | 'in_progress' | 'review' | 'completed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
}

interface Proposal {
  _id: string;
  jobId: Job;
  coverLetter: string;
  proposedPrice: number;
  estimatedDuration: number;
  estimatedDurationUnit: string;
  status: 'pending' | 'in_discussion' | 'accepted' | 'rejected' | 'withdrawn' | 'completed';
  contactRevealed: boolean;
  conversationId?: string;
  clientRespondedAt?: string;
  acceptedAt?: string;
  rejectionNote?: string;
  unreadMessageCount?: number;
  createdAt: string;
  projectTracking?: ProjectTracking;
}

function MyProposalsPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale: language } = useLanguage();
  const toast = useToast();
  const router = useRouter();

  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus>('accepted');
  const [searchQuery, setSearchQuery] = useState('');
  const [withdrawModalId, setWithdrawModalId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [startingProjectId, setStartingProjectId] = useState<string | null>(null);

  const hasFetched = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const stats = {
    total: allProposals.length,
    pending: allProposals.filter(p => p.status === 'pending').length,
    inDiscussion: allProposals.filter(p => p.status === 'in_discussion').length,
    accepted: allProposals.filter(p => p.status === 'accepted').length,
    completed: allProposals.filter(p => p.status === 'completed').length,
    rejected: allProposals.filter(p => p.status === 'rejected').length,
    withdrawn: allProposals.filter(p => p.status === 'withdrawn').length,
  };

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== 'pro' && user?.role !== 'admin'))) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchAllProposals = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      const response = await api.get('/jobs/my-proposals/list');
      const data = Array.isArray(response.data) ? response.data : [];
      setAllProposals(data);
      setProposals(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch proposals:', err);
      setError(err.response?.data?.message || 'Failed to load proposals');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'pro' || user?.role === 'admin') && !hasFetched.current) {
      hasFetched.current = true;
      fetchAllProposals();

      // Mark proposal updates as viewed when pro visits this page
      api.post('/jobs/counters/mark-proposal-updates-viewed').catch(() => {
        // Silently ignore errors
      });
    }
  }, [isAuthenticated, user, fetchAllProposals]);

  useEffect(() => {
    if (isInitialLoading) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const applyFilters = () => {
      setIsContentLoading(true);

      let filtered = [...allProposals];

      filtered = filtered.filter(p => p.status === statusFilter);

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filtered = filtered.filter(p => {
          const job = p.jobId;
          return job?.title?.toLowerCase().includes(searchLower) ||
            job?.category?.toLowerCase().includes(searchLower) ||
            job?.location?.toLowerCase().includes(searchLower);
        });
      }

      setProposals(filtered);
      setIsContentLoading(false);
    };

    if (searchQuery) {
      debounceRef.current = setTimeout(applyFilters, 300);
    } else {
      applyFilters();
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [statusFilter, searchQuery, allProposals, isInitialLoading]);

  const handleWithdraw = async () => {
    if (!withdrawModalId) return;

    setIsWithdrawing(true);
    try {
      await api.post(`/jobs/proposals/${withdrawModalId}/withdraw`);
      const updateProposal = (p: Proposal) =>
        p._id === withdrawModalId ? { ...p, status: 'withdrawn' as const } : p;
      setAllProposals(prev => prev.map(updateProposal));
      setProposals(prev => prev.map(updateProposal));
      setWithdrawModalId(null);
      toast.success(
        language === 'ka' ? 'შეთავაზება გაუქმდა' : 'Proposal withdrawn',
        language === 'ka' ? 'თქვენი შეთავაზება წარმატებით გაუქმდა' : 'Your proposal has been withdrawn'
      );
    } catch (err: any) {
      toast.error(
        language === 'ka' ? 'შეცდომა' : 'Error',
        err.response?.data?.message || 'Failed to withdraw proposal'
      );
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleStartProject = async (jobId: string) => {
    setStartingProjectId(jobId);
    try {
      await api.patch(`/jobs/projects/${jobId}/stage`, { stage: 'started' });

      // Update local state
      const updateProposal = (p: Proposal) => {
        if (p.jobId._id === jobId && p.projectTracking) {
          return {
            ...p,
            projectTracking: {
              ...p.projectTracking,
              currentStage: 'started' as const,
              startedAt: new Date().toISOString(),
            }
          };
        }
        return p;
      };
      setAllProposals(prev => prev.map(updateProposal));
      setProposals(prev => prev.map(updateProposal));

      toast.success(
        language === 'ka' ? 'პროექტი დაიწყო' : 'Project started',
        language === 'ka' ? 'კლიენტი მიიღებს შეტყობინებას' : 'Client will be notified'
      );
    } catch (err: any) {
      toast.error(
        language === 'ka' ? 'შეცდომა' : 'Error',
        err.response?.data?.message || 'Failed to start project'
      );
    } finally {
      setStartingProjectId(null);
    }
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

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return language === 'ka' ? 'დღეს' : 'Today';
    if (diffDays === 1) return language === 'ka' ? 'გუშინ' : 'Yesterday';
    if (diffDays < 7) return language === 'ka' ? `${diffDays} დღის წინ` : `${diffDays}d ago`;
    if (diffDays < 30) return language === 'ka' ? `${Math.floor(diffDays / 7)} კვირის წინ` : `${Math.floor(diffDays / 7)}w ago`;
    return formatDate(date);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; labelKa: string; icon: any; color: string; bg: string; border: string }> = {
      pending: {
        label: 'Pending',
        labelKa: 'მოლოდინში',
        icon: Clock,
        color: '#D97706',
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.2)'
      },
      in_discussion: {
        label: 'In Discussion',
        labelKa: 'მიმოწერაში',
        icon: MessageSquare,
        color: '#2563EB',
        bg: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(59, 130, 246, 0.2)'
      },
      accepted: {
        label: 'Accepted',
        labelKa: 'მიღებული',
        icon: CheckCircle,
        color: '#059669',
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.2)'
      },
      completed: {
        label: 'Completed',
        labelKa: 'დასრულებული',
        icon: CheckCheck,
        color: '#059669',
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.2)'
      },
      rejected: {
        label: 'Rejected',
        labelKa: 'უარყოფილი',
        icon: XCircle,
        color: '#DC2626',
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.2)'
      },
      withdrawn: {
        label: 'Withdrawn',
        labelKa: 'გაუქმებული',
        icon: Ban,
        color: '#6B7280',
        bg: 'rgba(107, 114, 128, 0.1)',
        border: 'rgba(107, 114, 128, 0.2)'
      }
    };
    return configs[status] || configs.pending;
  };

  // Loading State
  if (authLoading || isInitialLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <AppBackground />
        <Header />
        <HeaderSpacer />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#E07B4F] to-[#D26B3F] opacity-20 animate-pulse" />
              <div className="absolute inset-2 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center">
                <Send className="w-6 h-6 text-[#E07B4F] animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-2xl border-2 border-[#E07B4F]/30 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <p className="text-[var(--color-text-secondary)] font-medium">
              {language === 'ka' ? 'იტვირთება...' : 'Loading proposals...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <AppBackground />
        <Header />
        <HeaderSpacer />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              {language === 'ka' ? 'შეცდომა' : 'Error'}
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6">{error}</p>
            <button
              onClick={fetchAllProposals}
              className="px-6 py-3 rounded-xl bg-[#E07B4F] text-white font-medium hover:bg-[#D26B3F] transition-all"
            >
              {language === 'ka' ? 'ხელახლა ცდა' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filterTabs = [
    { key: 'accepted', label: language === 'ka' ? 'მიღებული' : 'Won', count: stats.accepted, icon: CheckCircle },
    { key: 'pending', label: language === 'ka' ? 'მოლოდინში' : 'Pending', count: stats.pending, icon: Clock },
    { key: 'completed', label: language === 'ka' ? 'დასრულებული' : 'Completed', count: stats.completed, icon: CheckCheck },
    { key: 'rejected', label: language === 'ka' ? 'უარყოფილი' : 'Declined', count: stats.rejected, icon: XCircle },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <AppBackground />
      <Header />
      <HeaderSpacer />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        {/* Hero Section */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button
              onClick={() => router.back()}
              className="mt-0.5 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:border-[#E07B4F]/30 hover:bg-[#E07B4F]/5 transition-all group"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-text-secondary)] group-hover:text-[#E07B4F] transition-colors" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                {language === 'ka' ? 'ჩემი შეთავაზებები' : 'My Proposals'}
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1 hidden sm:block">
                {language === 'ka'
                  ? 'თვალყური ადევნე შენს შეთავაზებებს'
                  : 'Track and manage your submitted proposals'}
              </p>
            </div>
          </div>

          {/* Quick Link to My Jobs - Mobile Only */}
          <Link
            href="/my-jobs"
            className="sm:hidden flex items-center justify-between p-3 mb-4 rounded-xl bg-gradient-to-r from-[#E07B4F]/10 to-[#E07B4F]/5 border border-[#E07B4F]/20 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#E07B4F]/20 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-[#E07B4F]" />
              </div>
              <div>
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {language === 'ka' ? 'ჩემი სამუშაოები' : 'My Jobs'}
                </span>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {language === 'ka' ? 'განთავსებული განცხადებები' : 'Your posted jobs'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#E07B4F]" />
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border)] p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
            {/* Filter Tabs - Horizontally Scrollable on Mobile */}
            <div className="flex-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
              <div className="flex gap-2 min-w-max pb-1 sm:pb-0 sm:flex-wrap">
                {filterTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = statusFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key as ProposalStatus)}
                      className={`
                        inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0
                        ${isActive
                          ? 'bg-[#E07B4F] text-white shadow-lg shadow-[#E07B4F]/25'
                          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[#E07B4F]/10 hover:text-[#E07B4F]'
                        }
                      `}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{tab.label}</span>
                      <span className={`
                        px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold
                        ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--color-bg-muted)] text-[var(--color-text-tertiary)]'}
                      `}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search */}
            <div className="relative lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder={language === 'ka' ? 'ძებნა...' : 'Search proposals...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F]/30 focus:ring-2 focus:ring-[#E07B4F]/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Proposals List */}
        {isContentLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#E07B4F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : proposals.length === 0 ? (
          <EmptyState
            icon={Send}
            title={stats.total === 0 ? "No proposals yet" : "No matching proposals"}
            titleKa={stats.total === 0 ? "შეთავაზებები ჯერ არ არის" : "შედეგი ვერ მოიძებნა"}
            description={stats.total === 0 ? "Find jobs that match your skills and submit proposals" : "Try adjusting your filters"}
            descriptionKa={stats.total === 0 ? "მოძებნე შენთვის შესაფერისი სამუშაო და გაგზავნე შეთავაზება" : "სცადე ფილტრების შეცვლა"}
            actionLabel={stats.total === 0 ? "Browse Jobs" : undefined}
            actionLabelKa={stats.total === 0 ? "სამუშაოების ნახვა" : undefined}
            actionHref={stats.total === 0 ? "/browse/jobs" : undefined}
            variant="illustrated"
            size="md"
          />
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {proposals.map((proposal, index) => {
              const job = proposal.jobId;
              if (!job || typeof job === 'string') return null;

              const statusConfig = getStatusConfig(proposal.status);
              const StatusIcon = statusConfig.icon;
              const isClient = job.clientId?.accountType === 'organization';
              const hasUnread = (proposal.unreadMessageCount ?? 0) > 0;
              const isAccepted = proposal.status === 'accepted';
              const isCompleted = proposal.status === 'completed';
              const isPending = proposal.status === 'pending';

              // For accepted proposals - show as active project workspace
              if (isAccepted || isCompleted) {
                return (
                  <div
                    key={proposal._id}
                    className="group bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border)] overflow-hidden transition-all duration-300 hover:shadow-lg"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Compact Header with Status */}
                    <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/30">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#E07B4F]/10 text-[#E07B4F]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {language === 'ka' ? 'მიღებული' : 'Accepted'}
                      </span>
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        {formatRelativeTime(proposal.createdAt)}
                      </span>
                    </div>

                    {/* Main Content - Two Column Layout on Desktop */}
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:gap-6">
                        {/* Left: Job Info */}
                        <div className="flex-1 min-w-0 mb-4 lg:mb-0">
                          {/* Job Title */}
                          <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] leading-snug mb-3">
                            {job.title}
                          </h3>

                          {/* Client Row */}
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar
                              src={job.clientId?.avatar}
                              name={job.clientId?.name || 'Client'}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                {job.clientId?.name}
                              </p>
                              {isClient && job.clientId?.companyName && (
                                <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {job.clientId.companyName}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Meta: Location & Budget */}
                          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 opacity-60" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium text-[#E07B4F]">
                              <DollarSign className="w-4 h-4" />
                              {formatBudget(job)}
                            </span>
                          </div>
                        </div>

                        {/* Right: Your Proposal Summary */}
                        <div className="lg:w-64 flex-shrink-0">
                          <div className="rounded-xl p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
                              {language === 'ka' ? 'შენი შეთავაზება' : 'Your Proposal'}
                            </p>
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-2xl font-bold text-[#E07B4F]">
                                ₾{proposal.proposedPrice?.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {proposal.estimatedDuration}{' '}
                              {proposal.estimatedDurationUnit === 'days'
                                ? (language === 'ka' ? 'დღე' : 'days')
                                : proposal.estimatedDurationUnit === 'weeks'
                                ? (language === 'ka' ? 'კვირა' : 'weeks')
                                : (language === 'ka' ? 'თვე' : 'months')}
                            </p>
                            <p className="text-xs text-[var(--color-text-tertiary)] mt-2 line-clamp-2 italic">
                              &ldquo;{proposal.coverLetter}&rdquo;
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar - Communication & Project Focused */}
                    <div className="px-4 sm:px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/20">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Start Project */}
                        {proposal.projectTracking?.currentStage === 'hired' && (
                          <button
                            onClick={() => handleStartProject(job._id)}
                            disabled={startingProjectId === job._id}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#E07B4F] text-white hover:bg-[#D26B3F] disabled:opacity-50 transition-all"
                          >
                            {startingProjectId === job._id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            {language === 'ka' ? 'დაწყება' : 'Start'}
                          </button>
                        )}

                        {/* Started Badge */}
                        {proposal.projectTracking && proposal.projectTracking.currentStage !== 'hired' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#E07B4F]/10 text-[#E07B4F]">
                            <Play className="w-3.5 h-3.5" />
                            {language === 'ka' ? 'დაწყებული' : 'Started'}
                          </span>
                        )}

                        {/* View Job Details - Primary */}
                        <Link
                          href={`/jobs/${job._id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {language === 'ka' ? 'სამუშაო' : 'Job Details'}
                        </Link>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Contact Actions - Right Side */}
                        {proposal.contactRevealed && job.clientId && (
                          <div className="flex items-center gap-2">
                            {job.clientId.phone && (
                              <a
                                href={`tel:${job.clientId.phone}`}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[#E07B4F] hover:text-[#E07B4F] transition-all"
                              >
                                <Phone className="w-4 h-4" />
                                <span className="hidden sm:inline">{job.clientId.phone}</span>
                              </a>
                            )}
                            {job.clientId.email && (
                              <a
                                href={`mailto:${job.clientId.email}`}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[#E07B4F] hover:text-[#E07B4F] transition-all"
                              >
                                <Mail className="w-4 h-4" />
                                <span className="hidden sm:inline">{language === 'ka' ? 'ემაილი' : 'Email'}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Polls Section - Pro can create/manage polls */}
                    <PollsTab
                      jobId={job._id}
                      isPro={true}
                      isClient={false}
                      userId={user?.id}
                      locale={language}
                    />

                    {/* Project Workspace - Materials & Resources */}
                    <ProjectWorkspace
                      jobId={job._id}
                      locale={language}
                      isClient={false}
                    />

                    {/* Project Chat - Expandable Section */}
                    <ProjectChat
                      jobId={job._id}
                      locale={language}
                      isClient={false}
                    />
                  </div>
                );
              }

              // For pending/rejected/other statuses - simpler card
              return (
                <div
                  key={proposal._id}
                  className="group bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border)] overflow-hidden transition-all duration-300 hover:border-[#E07B4F]/20 hover:shadow-lg"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/30">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{
                        backgroundColor: statusConfig.bg,
                        color: statusConfig.color,
                        border: `1px solid ${statusConfig.border}`
                      }}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {language === 'ka' ? statusConfig.labelKa : statusConfig.label}
                    </span>
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {formatRelativeTime(proposal.createdAt)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    {/* Job Title */}
                    <Link href={`/jobs/${job._id}`} className="block group/title mb-3">
                      <h3 className="text-lg font-bold text-[var(--color-text-primary)] leading-snug line-clamp-2 group-hover/title:text-[#E07B4F] transition-colors">
                        {job.title}
                      </h3>
                    </Link>

                    {/* Client + Meta */}
                    <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-[var(--color-text-secondary)]">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={job.clientId?.avatar}
                          name={job.clientId?.name || 'Client'}
                          size="xs"
                        />
                        <span>{job.clientId?.name}</span>
                      </div>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 opacity-60" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-[#E07B4F]">
                        <DollarSign className="w-3.5 h-3.5" />
                        {formatBudget(job)}
                      </span>
                    </div>

                    {/* Your Proposal */}
                    <div className="rounded-xl p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#E07B4F]">
                          {language === 'ka' ? 'შენი შეთავაზება' : 'Your Proposal'}
                        </p>
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {formatDate(proposal.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-xl font-bold text-[#E07B4F]">
                          ₾{proposal.proposedPrice?.toLocaleString()}
                        </span>
                        <span className="text-sm text-[var(--color-text-tertiary)] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {proposal.estimatedDuration}{' '}
                          {proposal.estimatedDurationUnit === 'days'
                            ? (language === 'ka' ? 'დღე' : 'days')
                            : proposal.estimatedDurationUnit === 'weeks'
                            ? (language === 'ka' ? 'კვირა' : 'weeks')
                            : (language === 'ka' ? 'თვე' : 'months')}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-text-tertiary)] line-clamp-2 italic">
                        &ldquo;{proposal.coverLetter}&rdquo;
                      </p>
                    </div>

                    {/* Rejection Note */}
                    {proposal.status === 'rejected' && proposal.rejectionNote && (
                      <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                        <p className="text-xs text-red-600 dark:text-red-400">
                          <strong>{language === 'ka' ? 'მიზეზი:' : 'Reason:'}</strong> {proposal.rejectionNote}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-4 sm:px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/20">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${job._id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {language === 'ka' ? 'სამუშაო' : 'View Job'}
                      </Link>

                      {isPending && (
                        <button
                          onClick={() => setWithdrawModalId(proposal._id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        >
                          <X className="w-4 h-4" />
                          {language === 'ka' ? 'გაუქმება' : 'Withdraw'}
                        </button>
                      )}

                      {hasUnread && (
                        <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500 text-white animate-pulse">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {proposal.unreadMessageCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Withdraw Modal */}
      <ConfirmModal
        isOpen={!!withdrawModalId}
        onClose={() => setWithdrawModalId(null)}
        onConfirm={handleWithdraw}
        title={language === 'ka' ? 'შეთავაზების გაუქმება' : 'Withdraw Proposal'}
        description={language === 'ka'
          ? 'დარწმუნებული ხარ? ეს მოქმედება ვერ გაუქმდება.'
          : 'Are you sure? This action cannot be undone.'}
        icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
        variant="danger"
        cancelLabel={language === 'ka' ? 'გაუქმება' : 'Cancel'}
        confirmLabel={language === 'ka' ? 'დადასტურება' : 'Confirm'}
        isLoading={isWithdrawing}
        loadingLabel={language === 'ka' ? 'მიმდინარეობს...' : 'Withdrawing...'}
      />
    </div>
  );
}

export default function MyProposalsPage() {
  return (
    <AuthGuard allowedRoles={['pro', 'admin']}>
      <MyProposalsPageContent />
    </AuthGuard>
  );
}
