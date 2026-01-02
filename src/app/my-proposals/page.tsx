'use client';

import AppBackground from '@/components/common/AppBackground';
import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import EmptyState from '@/components/common/EmptyState';
import Header, { HeaderSpacer } from '@/components/common/Header';
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
  Inbox,
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
import { ConfirmModal } from '@/components/ui/Modal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import ProjectChat from '@/components/projects/ProjectChat';

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
          <div className="space-y-3 sm:space-y-4">
            {proposals.map((proposal, index) => {
              const job = proposal.jobId;
              if (!job || typeof job === 'string') return null;

              const statusConfig = getStatusConfig(proposal.status);
              const StatusIcon = statusConfig.icon;
              const allMedia = [
                ...(job.media || []).map(m => ({ url: m.url, type: m.type })),
                ...(job.images || []).filter(img => !job.media?.some(m => m.url === img)).map(url => ({ url, type: 'image' }))
              ];
              const hasMedia = allMedia.length > 0;
              const isClient = job.clientId?.accountType === 'organization';
              const hasUnread = (proposal.unreadMessageCount ?? 0) > 0;

              return (
                <div
                  key={proposal._id}
                  className="group bg-[var(--color-bg-elevated)] rounded-xl sm:rounded-2xl border border-[var(--color-border)] overflow-hidden transition-all duration-300 hover:border-[#E07B4F]/20 hover:shadow-xl hover:shadow-[#E07B4F]/5"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    borderLeftWidth: '3px',
                    borderLeftColor: statusConfig.color
                  }}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Media Thumbnail */}
                    {hasMedia && (
                      <div className="relative w-full sm:w-48 lg:w-56 flex-shrink-0">
                        <div className="relative h-36 sm:h-full sm:min-h-[200px]">
                          <img
                            src={storage.getFileUrl(allMedia[0].url)}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent sm:bg-gradient-to-t sm:from-black/50 sm:via-transparent sm:to-transparent" />

                          {/* Job Status Badge */}
                          <span className={`
                            absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold backdrop-blur-sm
                            ${job.status === 'open'
                              ? 'bg-emerald-500/90 text-white'
                              : 'bg-neutral-600/90 text-white'
                            }
                          `}>
                            {job.status === 'open' ? (language === 'ka' ? 'ღია' : 'Open') : (language === 'ka' ? 'დახურული' : 'Closed')}
                          </span>

                          {/* Mobile: Proposal Status on Image */}
                          <div className="absolute bottom-2 left-2 right-2 sm:hidden">
                            <div className="flex items-center justify-between">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold backdrop-blur-sm"
                                style={{
                                  backgroundColor: `${statusConfig.color}20`,
                                  color: '#fff',
                                  border: `1px solid ${statusConfig.color}40`
                                }}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {language === 'ka' ? statusConfig.labelKa : statusConfig.label}
                              </span>
                              {hasUnread && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-500 text-white shadow-lg shadow-blue-500/30 animate-pulse">
                                  <MessageCircle className="w-3 h-3" />
                                  {proposal.unreadMessageCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-3 sm:p-5">
                      {/* Status Row - Desktop Only (mobile shows on image) */}
                      <div className="hidden sm:flex items-center gap-2 flex-wrap mb-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{
                            backgroundColor: statusConfig.bg,
                            color: statusConfig.color,
                            border: `1px solid ${statusConfig.border}`
                          }}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {language === 'ka' ? statusConfig.labelKa : statusConfig.label}
                        </span>

                        {hasUnread && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-500 text-white shadow-lg shadow-blue-500/30 animate-pulse">
                            <MessageCircle className="w-3 h-3" />
                            {proposal.unreadMessageCount} {language === 'ka' ? 'ახალი' : 'new'}
                          </span>
                        )}

                        {proposal.clientRespondedAt && proposal.status === 'in_discussion' && !hasUnread && (
                          <span className="text-xs font-medium text-blue-600">
                            {language === 'ka' ? 'კლიენტი გიპასუხა!' : 'Client responded!'}
                          </span>
                        )}

                        <span className="ml-auto text-xs text-[var(--color-text-tertiary)]">
                          {formatRelativeTime(proposal.createdAt)}
                        </span>
                      </div>

                      {/* Mobile: Show status if no media */}
                      {!hasMedia && (
                        <div className="flex sm:hidden items-center gap-2 flex-wrap mb-2">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                            style={{
                              backgroundColor: statusConfig.bg,
                              color: statusConfig.color,
                              border: `1px solid ${statusConfig.border}`
                            }}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {language === 'ka' ? statusConfig.labelKa : statusConfig.label}
                          </span>
                          {hasUnread && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-500 text-white">
                              <MessageCircle className="w-3 h-3" />
                              {proposal.unreadMessageCount}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Job Title + Time */}
                      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-0">
                        <Link href={`/jobs/${job._id}`} className="block group/title flex-1 min-w-0">
                          <h3 className="text-sm sm:text-lg font-semibold text-[var(--color-text-primary)] leading-snug line-clamp-2 group-hover/title:text-[#E07B4F] transition-colors">
                            {job.title}
                          </h3>
                        </Link>
                        <span className="sm:hidden text-[10px] text-[var(--color-text-tertiary)] whitespace-nowrap flex-shrink-0">
                          {formatRelativeTime(proposal.createdAt)}
                        </span>
                      </div>

                      {/* Client Info */}
                      <div className="flex items-center gap-2 mt-2 sm:mt-3">
                        <Avatar
                          src={job.clientId?.avatar}
                          name={job.clientId?.name || 'Client'}
                          size="xs"
                        />
                        <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] truncate">
                          {job.clientId?.name}
                        </span>
                        {isClient && job.clientId?.companyName && (
                          <span className="hidden sm:flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-[#E07B4F]/10 text-[#E07B4F]">
                            <Building2 className="w-3 h-3" />
                            {job.clientId.companyName}
                          </span>
                        )}
                      </div>

                      {/* Meta Row */}
                      <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-2 mt-2 sm:mt-3 text-xs sm:text-sm text-[var(--color-text-secondary)]">
                        <span className="flex items-center gap-1 sm:gap-1.5">
                          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E07B4F]/60" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1 sm:gap-1.5 font-semibold text-[#E07B4F]">
                          <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {formatBudget(job)}
                        </span>
                      </div>

                      {/* Your Proposal Box */}
                      <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-[#E07B4F]/5 to-transparent border border-[#E07B4F]/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#E07B4F]">
                            {language === 'ka' ? 'შენი შეთავაზება' : 'Your Proposal'}
                          </span>
                          <span className="hidden sm:inline text-xs text-[var(--color-text-tertiary)]">
                            {formatDate(proposal.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 mb-2">
                          <span className="text-lg sm:text-xl font-bold text-[#E07B4F]">
                            ₾{proposal.proposedPrice?.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-[var(--color-text-secondary)]">
                            <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E07B4F]/50" />
                            {proposal.estimatedDuration} {
                              proposal.estimatedDurationUnit === 'days' ? (language === 'ka' ? 'დღე' : 'days') :
                              proposal.estimatedDurationUnit === 'weeks' ? (language === 'ka' ? 'კვირა' : 'weeks') :
                              (language === 'ka' ? 'თვე' : 'months')
                            }
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--color-text-tertiary)] line-clamp-2 italic">
                          "{proposal.coverLetter}"
                        </p>
                      </div>

                      {/* Rejection Note */}
                      {proposal.status === 'rejected' && proposal.rejectionNote && (
                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                          <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400">
                            <strong>{language === 'ka' ? 'მიზეზი:' : 'Reason:'}</strong> {proposal.rejectionNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-3 py-3 sm:px-5 sm:py-4 bg-[var(--color-bg-tertiary)]/50 border-t border-[var(--color-border)]">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      {/* Primary Actions Row */}
                      <div className="flex items-center gap-2 flex-wrap flex-1">
                        {/* Message Button */}
                        {(proposal.status === 'in_discussion' || proposal.status === 'accepted' || proposal.status === 'completed') && proposal.conversationId && (
                          <Link
                            href={`/messages?conversation=${proposal.conversationId}`}
                            className={`
                              flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all
                              ${hasUnread
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600'
                                : 'bg-[#E07B4F] text-white hover:bg-[#D26B3F]'
                              }
                            `}
                          >
                            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {language === 'ka' ? 'მესიჯი' : 'Message'}
                            {hasUnread && (
                              <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] sm:text-xs font-bold">
                                {proposal.unreadMessageCount}
                              </span>
                            )}
                          </Link>
                        )}

                        {/* Start Project Button - for accepted proposals with hired stage */}
                        {proposal.status === 'accepted' && proposal.projectTracking?.currentStage === 'hired' && (
                          <button
                            onClick={() => handleStartProject(job._id)}
                            disabled={startingProjectId === job._id}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25"
                          >
                            {startingProjectId === job._id ? (
                              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                            {language === 'ka' ? 'დაწყება' : 'Start Project'}
                          </button>
                        )}

                        {/* Project Started Badge */}
                        {proposal.status === 'accepted' && proposal.projectTracking && proposal.projectTracking.currentStage !== 'hired' && (
                          <span className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-emerald-500/10 text-emerald-600">
                            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {language === 'ka' ? 'დაწყებული' : 'Started'}
                          </span>
                        )}

                        {/* Withdraw Button - only for pending */}
                        {proposal.status === 'pending' && (
                          <button
                            onClick={() => setWithdrawModalId(proposal._id)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-all"
                          >
                            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {language === 'ka' ? 'გაუქმება' : 'Withdraw'}
                          </button>
                        )}

                        {/* View Job - Mobile compact */}
                        <Link
                          href={`/jobs/${job._id}`}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] hover:text-[#E07B4F] transition-colors sm:ml-auto"
                        >
                          {language === 'ka' ? 'სამუშაო' : 'View Job'}
                          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Link>
                      </div>

                      {/* Contact Info - if accepted (full width on mobile) */}
                      {proposal.status === 'accepted' && proposal.contactRevealed && job.clientId && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {job.clientId.phone && (
                            <a
                              href={`tel:${job.clientId.phone}`}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all"
                            >
                              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="truncate">{job.clientId.phone}</span>
                            </a>
                          )}
                          {job.clientId.email && (
                            <a
                              href={`mailto:${job.clientId.email}`}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all"
                            >
                              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              {language === 'ka' ? 'ემაილი' : 'Email'}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Chat - for accepted/completed proposals */}
                  {(proposal.status === 'accepted' || proposal.status === 'completed') && (
                    <ProjectChat
                      jobId={job._id}
                      locale={language}
                      isClient={false}
                    />
                  )}
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
