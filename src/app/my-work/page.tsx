'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import BackButton from '@/components/common/BackButton';
import EmptyState from '@/components/common/EmptyState';
import ProjectTrackerCard from '@/components/projects/ProjectTrackerCard';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { formatBudget } from '@/utils/currencyUtils';
import { formatDateShort, formatTimeAgo } from '@/utils/dateUtils';
import {
  AlertTriangle,
  Ban,
  Briefcase,
  CheckCheck,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  MapPin,
  MessageCircle,
  MessageSquare,
  Play,
  Search,
  X,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type TabType = 'active' | 'proposals' | 'completed';

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

const TERRACOTTA = '#C4735B';

function MyWorkPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale: language } = useLanguage();
  const toast = useToast();
  const router = useRouter();

  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [withdrawModalId, setWithdrawModalId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const hasFetched = useRef(false);
  const socketRef = useRef<Socket | null>(null);

  // Helper functions
  const isProjectCompleted = (p: Proposal) =>
    p.projectTracking?.currentStage === 'completed' || p.status === 'completed';

  const isActiveProject = (p: Proposal) =>
    p.status === 'accepted' && p.projectTracking?.currentStage !== 'completed';

  const isPendingProposal = (p: Proposal) =>
    p.status === 'pending' || p.status === 'in_discussion' || p.status === 'rejected' || p.status === 'withdrawn';

  // Calculate counts
  const counts = {
    active: allProposals.filter(p => isActiveProject(p)).length,
    proposals: allProposals.filter(p => isPendingProposal(p)).length,
    completed: allProposals.filter(p => isProjectCompleted(p)).length,
  };

  // Filter proposals based on active tab and search
  const getFilteredProposals = useCallback(() => {
    let filtered = [...allProposals];

    // Apply tab filter
    if (activeTab === 'active') {
      filtered = filtered.filter(p => isActiveProject(p));
    } else if (activeTab === 'proposals') {
      filtered = filtered.filter(p => isPendingProposal(p));
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(p => isProjectCompleted(p));
    }

    // Apply search
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const job = p.jobId;
        return job?.title?.toLowerCase().includes(searchLower) ||
          job?.category?.toLowerCase().includes(searchLower) ||
          job?.location?.toLowerCase().includes(searchLower);
      });
    }

    return filtered;
  }, [allProposals, activeTab, searchQuery]);

  const filteredProposals = getFilteredProposals();

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
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch proposals:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'pro' || user?.role === 'admin') && !hasFetched.current) {
      hasFetched.current = true;
      fetchAllProposals();

      api.post('/jobs/counters/mark-proposal-updates-viewed').catch(() => {});
    }
  }, [isAuthenticated, user, fetchAllProposals]);

  // WebSocket connection for real-time project stage updates
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const wsUrl = apiUrl.replace(/^http/, "ws");

    socketRef.current = io(`${wsUrl}/chat`, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("[MyWork] WebSocket connected");
    });

    // Listen for project stage updates
    socketRef.current.on("projectStageUpdate", (data: { jobId: string; stage: string; progress: number; project: any }) => {
      console.log("[MyWork] Project stage update:", data);
      // Update the proposal's project tracking data in state
      setAllProposals((prevProposals) =>
        prevProposals.map((proposal) => {
          if (proposal.jobId._id === data.jobId) {
            return {
              ...proposal,
              projectTracking: {
                ...proposal.projectTracking,
                _id: proposal.projectTracking?._id || '',
                currentStage: data.stage as ProjectTracking['currentStage'],
                progress: data.progress,
                startedAt: data.project?.startedAt,
                completedAt: data.project?.completedAt,
              },
            };
          }
          return proposal;
        })
      );
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  const handleWithdraw = async () => {
    if (!withdrawModalId) return;

    setIsWithdrawing(true);
    try {
      await api.post(`/jobs/proposals/${withdrawModalId}/withdraw`);
      setAllProposals(prev => prev.map(p =>
        p._id === withdrawModalId ? { ...p, status: 'withdrawn' as const } : p
      ));
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C4735B] to-[#A85D48] opacity-20 animate-pulse" />
            <div className="absolute inset-2 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-[#C4735B] animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-[#C4735B]/30 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <p className="text-[var(--color-text-secondary)] font-medium">
            {language === 'ka' ? 'იტვირთება...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
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
            className="px-6 py-3 rounded-xl bg-[#C4735B] text-white font-medium hover:bg-[#A85D48] transition-all"
          >
            {language === 'ka' ? 'ხელახლა ცდა' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      key: 'active' as TabType,
      label: language === 'ka' ? 'აქტიური' : 'Active',
      count: counts.active,
      icon: Play,
      emptyTitle: language === 'ka' ? 'აქტიური პროექტები არ არის' : 'No active projects',
      emptyDesc: language === 'ka' ? 'როცა კლიენტი მიიღებს შენს შეთავაზებას, პროექტი აქ გამოჩნდება' : 'When a client accepts your proposal, the project will appear here',
    },
    {
      key: 'proposals' as TabType,
      label: language === 'ka' ? 'შეთავაზებები' : 'Proposals',
      count: counts.proposals,
      icon: FileText,
      emptyTitle: language === 'ka' ? 'შეთავაზებები არ არის' : 'No proposals',
      emptyDesc: language === 'ka' ? 'მოძებნე სამუშაო და გააგზავნე შეთავაზება' : 'Find jobs and submit proposals to get started',
    },
    {
      key: 'completed' as TabType,
      label: language === 'ka' ? 'დასრულებული' : 'Completed',
      count: counts.completed,
      icon: CheckCheck,
      emptyTitle: language === 'ka' ? 'დასრულებული პროექტები არ არის' : 'No completed projects',
      emptyDesc: language === 'ka' ? 'დასრულებული პროექტები აქ გამოჩნდება' : 'Your completed projects will appear here',
    },
  ];

  const currentTab = tabs.find(t => t.key === activeTab)!;

  return (
    <div>
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <BackButton showLabel={false} className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                {language === 'ka' ? 'ჩემი სამუშაო' : 'My Work'}
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 hidden sm:block">
                {language === 'ka'
                  ? 'აქტიური პროექტები და შეთავაზებები'
                  : 'Your active projects and proposals'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-1 p-1 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border)]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-[#C4735B] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <Badge
                    variant={isActive ? "ghost" : "secondary"}
                    size="xs"
                    className={isActive ? "bg-white/20 text-white" : ""}
                  >
                    {tab.count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search (for proposals tab) */}
        {activeTab === 'proposals' && counts.proposals > 0 && (
          <div className="mb-4">
            <Input
              type="text"
              placeholder={language === 'ka' ? 'ძებნა...' : 'Search proposals...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        )}

        {/* Content */}
        {filteredProposals.length === 0 ? (
          <EmptyState
            icon={currentTab.icon}
            title={currentTab.emptyTitle}
            titleKa={currentTab.emptyTitle}
            description={currentTab.emptyDesc}
            descriptionKa={currentTab.emptyDesc}
            actionLabel={activeTab === 'proposals' ? (language === 'ka' ? 'სამუშაოების ნახვა' : 'Browse Jobs') : undefined}
            actionLabelKa={activeTab === 'proposals' ? 'სამუშაოების ნახვა' : undefined}
            actionHref={activeTab === 'proposals' ? '/browse/jobs' : undefined}
            variant="illustrated"
            size="md"
          />
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {filteredProposals.map((proposal, index) => {
              const job = proposal.jobId;
              if (!job || typeof job === 'string') return null;

              // For active or completed projects - use ProjectTrackerCard
              if (isActiveProject(proposal) || isProjectCompleted(proposal)) {
                const projectData = {
                  _id: proposal.projectTracking?._id || proposal._id,
                  jobId: job._id,
                  clientId: {
                    _id: job.clientId?._id || '',
                    name: job.clientId?.name || '',
                    avatar: job.clientId?.avatar,
                  },
                  proId: {
                    _id: user?.id || '',
                    name: user?.name || '',
                    avatar: user?.avatar,
                    phone: user?.phone,
                    title: (user as any)?.title,
                  },
                  currentStage: proposal.projectTracking?.currentStage || 'hired',
                  progress: proposal.projectTracking?.progress || 10,
                  hiredAt: proposal.acceptedAt || proposal.createdAt,
                  startedAt: proposal.projectTracking?.startedAt,
                  completedAt: proposal.projectTracking?.completedAt,
                  comments: [],
                  attachments: [],
                  agreedPrice: proposal.proposedPrice,
                  estimatedDuration: proposal.estimatedDuration,
                  estimatedDurationUnit: proposal.estimatedDurationUnit,
                };

                return (
                  <ProjectTrackerCard
                    key={proposal._id}
                    job={job}
                    project={projectData}
                    isClient={false}
                    locale={language}
                    onRefresh={fetchAllProposals}
                  />
                );
              }

              // For pending/rejected proposals - simpler card
              const statusConfig = getStatusConfig(proposal.status);
              const StatusIcon = statusConfig.icon;
              const hasUnread = (proposal.unreadMessageCount ?? 0) > 0;
              const isPending = proposal.status === 'pending';

              return (
                <div
                  key={proposal._id}
                  className="group bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border)] overflow-hidden transition-all duration-300 hover:border-[#C4735B]/20 hover:shadow-lg"
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
                      {formatTimeAgo(proposal.createdAt, language as 'en' | 'ka')}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    {/* Job Title */}
                    <Link href={`/jobs/${job._id}`} className="block group/title mb-3">
                      <h3 className="text-lg font-bold text-[var(--color-text-primary)] leading-snug line-clamp-2 group-hover/title:text-[#C4735B] transition-colors">
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
                      <span className="flex items-center gap-1 font-medium text-[#C4735B]">
                        <DollarSign className="w-3.5 h-3.5" />
                        {formatBudget(job, language as 'en' | 'ka') || (language === 'ka' ? 'შეთანხმებით' : 'Negotiable')}
                      </span>
                    </div>

                    {/* Your Proposal */}
                    <div className="rounded-xl p-4 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#C4735B]">
                          {language === 'ka' ? 'შენი შეთავაზება' : 'Your Proposal'}
                        </p>
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {formatDateShort(proposal.createdAt, language as 'en' | 'ka')}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-xl font-bold text-[#C4735B]">
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
                      <Alert variant="error" size="sm" className="mt-3">
                        <strong>{language === 'ka' ? 'მიზეზი:' : 'Reason:'}</strong> {proposal.rejectionNote}
                      </Alert>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-4 sm:px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/20">
                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                      >
                        <Link href={`/jobs/${job._id}`} className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          {language === 'ka' ? 'სამუშაო' : 'View Job'}
                        </Link>
                      </Button>

                      {isPending && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setWithdrawModalId(proposal._id)}
                          leftIcon={<X className="w-4 h-4" />}
                        >
                          {language === 'ka' ? 'გაუქმება' : 'Withdraw'}
                        </Button>
                      )}

                      {hasUnread && (
                        <Badge variant="pulse" size="sm" icon={<MessageCircle className="w-3.5 h-3.5" />} className="ml-auto font-bold">
                          {proposal.unreadMessageCount}
                        </Badge>
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

export default function MyWorkPage() {
  return (
    <AuthGuard allowedRoles={['pro', 'admin']}>
      <MyWorkPageContent />
    </AuthGuard>
  );
}
