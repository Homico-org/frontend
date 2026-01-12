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
import { isMVPMode } from '@/lib/mvp';
import { formatBudget } from '@/utils/currencyUtils';
import { formatDateShort, formatTimeAgo } from '@/utils/dateUtils';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Briefcase,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Play,
  Quote,
  Search,
  Sparkles,
  X,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Job, Proposal, ProjectTracking, ProjectStage, ProjectComment, ProjectAttachment } from '@/types/shared';
import type { LucideIcon } from 'lucide-react';

type TabType = 'active' | 'proposals' | 'completed';

// Proposal with populated job (for my-work page)
type WorkProposal = Omit<Proposal, 'jobId'> & { jobId: Job };

// Socket event data types
interface ProjectStageUpdateEvent {
  jobId: string;
  stage: ProjectStage;
  progress: number;
  project?: {
    startedAt?: string;
    completedAt?: string;
  };
}

// Status config type
interface StatusConfig {
  label: string;
  labelKa: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

const TERRACOTTA = '#C4735B';

function MyWorkPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale: language } = useLanguage();
  const toast = useToast();
  const router = useRouter();

  const [allProposals, setAllProposals] = useState<WorkProposal[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [withdrawModalId, setWithdrawModalId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const hasFetched = useRef(false);
  const socketRef = useRef<Socket | null>(null);

  // Helper functions
  const isProjectCompleted = (p: WorkProposal) =>
    p.projectTracking?.currentStage === 'completed' || p.status === 'completed';

  const isActiveProject = (p: WorkProposal) =>
    p.status === 'accepted' && p.projectTracking?.currentStage !== 'completed';

  const isPendingProposal = (p: WorkProposal) =>
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
      const response = await api.get(`/jobs/my-proposals/list`);
      const data = Array.isArray(response.data) ? response.data : [];
      setAllProposals(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || 'Failed to load data');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'pro' || user?.role === 'admin') && !hasFetched.current) {
      hasFetched.current = true;
      fetchAllProposals();

      api.post(`/jobs/counters/mark-proposal-updates-viewed`).catch(() => {});
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
    socketRef.current.on("projectStageUpdate", (data: ProjectStageUpdateEvent) => {
      console.log("[MyWork] Project stage update:", data);
      // Update the proposal's project tracking data in state
      setAllProposals((prevProposals) =>
        prevProposals.map((proposal) => {
          if (proposal.jobId.id === data.jobId) {
            return {
              ...proposal,
              projectTracking: proposal.projectTracking ? {
                ...proposal.projectTracking,
                currentStage: data.stage as ProjectTracking['currentStage'],
                progress: data.progress,
                startedAt: data.project?.startedAt,
                completedAt: data.project?.completedAt,
              } : undefined,
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
        p.id === withdrawModalId ? { ...p, status: 'withdrawn' as const } : p
      ));
      setWithdrawModalId(null);
      toast.success(
        language === 'ka' ? 'შეთავაზება გაუქმდა' : 'Proposal withdrawn',
        language === 'ka' ? 'თქვენი შეთავაზება წარმატებით გაუქმდა' : 'Your proposal has been withdrawn'
      );
    } catch (err) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(
        language === 'ka' ? 'შეცდომა' : 'Error',
        apiErr.response?.data?.message || 'Failed to withdraw proposal'
      );
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, StatusConfig> = {
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
        {/* Header - Enhanced */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <BackButton showLabel={false} className="mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  {language === 'ka' ? 'ჩემი სამუშაო' : 'My Work'}
                </h1>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C4735B]/10 text-[#C4735B]">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{allProposals.length}</span>
                </div>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">
                {language === 'ka'
                  ? 'აქტიური პროექტები და შეთავაზებები'
                  : 'Your active projects and proposals'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs - Premium Design */}
        <div className="mb-6">
          <div className="relative flex gap-1 p-1.5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                    ${isActive
                      ? 'text-white shadow-lg'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }
                  `}
                >
                  {/* Active background with gradient */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#C4735B] to-[#A85D48] shadow-[0_4px_12px_-2px_rgba(196,115,91,0.4)]" />
                  )}
                  
                  <span className="relative flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <Badge
                      variant={isActive ? "ghost" : "secondary"}
                      size="xs"
                      className={isActive ? "bg-white/20 text-white border-white/10" : ""}
                    >
                      {tab.count}
                    </Badge>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search (for proposals tab) - Enhanced */}
        {activeTab === 'proposals' && counts.proposals > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Input
                type="text"
                placeholder={language === 'ka' ? 'ძებნა სამუშაოს სახელით, კატეგორიით ან მდებარეობით...' : 'Search by job title, category, or location...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-neutral-500" />
                </button>
              )}
            </div>
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

              // For active or completed projects
              if (isActiveProject(proposal) || isProjectCompleted(proposal)) {
                // In MVP mode, show simplified card instead of ProjectTrackerCard
                if (isMVPMode()) {
                  const clientName = job.clientId?.name || (language === 'ka' ? 'კლიენტი' : 'Client');
                  const clientPhone = job.clientId?.phone;
                  const clientAvatar = job.clientId?.avatar;
                  
                  return (
                    <div
                      key={proposal.id}
                      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-emerald-50 dark:bg-emerald-900/20">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            {language === 'ka' ? 'დაქირავებული ხართ' : 'You are hired'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 line-clamp-2">
                          {job.title}
                        </h3>
                        
                        {/* Client Info */}
                        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                          <div className="flex items-center gap-3">
                            <Avatar src={clientAvatar} name={clientName} size="md" className="w-10 h-10" />
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-white">{clientName}</p>
                              <p className="text-xs text-neutral-500">{language === 'ka' ? 'კლიენტი' : 'Client'}</p>
                            </div>
                          </div>
                          
                          {/* Phone Button */}
                          {clientPhone && (
                            <a
                              href={`tel:${clientPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              {clientPhone}
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {/* Footer */}
                      <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/jobs/${job.id}`)}
                          rightIcon={<ChevronRight className="w-4 h-4" />}
                          className="w-full"
                        >
                          {language === 'ka' ? 'ნახვა' : 'View Details'}
                        </Button>
                      </div>
                    </div>
                  );
                }
                
                // Full ProjectTrackerCard for non-MVP mode
                const projectData = {
                  id: proposal.projectTracking?.id || proposal.id,
                  jobId: job.id,
                  clientId: {
                    id: job.clientId?.id || '',
                    name: job.clientId?.name || '',
                    avatar: job.clientId?.avatar,
                  },
                  proId: {
                    id: user?.id || '',
                    name: user?.name || '',
                    avatar: user?.avatar,
                    phone: user?.phone,
                    title: user && 'title' in user ? (user as { title?: string }).title : undefined,
                  },
                  currentStage: proposal.projectTracking?.currentStage || 'hired',
                  progress: proposal.projectTracking?.progress || 10,
                  hiredAt: proposal.acceptedAt || proposal.createdAt,
                  startedAt: proposal.projectTracking?.startedAt,
                  completedAt: proposal.projectTracking?.completedAt,
                  comments: [] as ProjectComment[],
                  attachments: [] as ProjectAttachment[],
                  agreedPrice: proposal.proposedPrice,
                  estimatedDuration: proposal.estimatedDuration,
                  estimatedDurationUnit: proposal.estimatedDurationUnit,
                  createdAt: proposal.createdAt,
                };

                return (
                  <ProjectTrackerCard
                    key={proposal.id}
                    job={job}
                    project={projectData}
                    isClient={false}
                    locale={language}
                    onRefresh={fetchAllProposals}
                  />
                );
              }

              // For pending/rejected proposals - Premium card design
              const statusConfig = getStatusConfig(proposal.status);
              const StatusIcon = statusConfig.icon;
              const hasUnread = (proposal.unreadMessageCount ?? 0) > 0;
              const isPending = proposal.status === 'pending';
              const isInDiscussion = proposal.status === 'in_discussion';

              return (
                <div
                  key={proposal.id}
                  className="group relative transition-all duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Premium border glow effect */}
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-[#C4735B]/0 via-[#C4735B]/0 to-[#C4735B]/0 group-hover:from-[#C4735B]/20 group-hover:via-[#D4937B]/10 group-hover:to-[#C4735B]/20 transition-all duration-500 opacity-0 group-hover:opacity-100 blur-[1px]" />
                  
                  {/* Main Card */}
                  <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100/80 dark:border-neutral-800 overflow-hidden group-hover:border-[#C4735B]/20 transition-all duration-500 group-hover:shadow-[0_20px_50px_-12px_rgba(196,115,91,0.12)] group-hover:-translate-y-0.5">
                    
                    {/* Shine effect overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-30">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/3 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    </div>

                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#C4735B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 bg-gradient-to-r from-neutral-50/80 to-transparent dark:from-neutral-800/30">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                        style={{
                          backgroundColor: statusConfig.bg,
                          color: statusConfig.color,
                          border: `1px solid ${statusConfig.border}`
                        }}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {language === 'ka' ? statusConfig.labelKa : statusConfig.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {hasUnread && (
                          <Badge variant="pulse" size="xs" icon={<MessageCircle className="w-3 h-3" />} className="font-bold">
                            {proposal.unreadMessageCount}
                          </Badge>
                        )}
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">
                          {formatTimeAgo(proposal.createdAt, language as 'en' | 'ka' | 'ru')}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Job Title with animated underline */}
                      <Link href={`/jobs/${job.id}`} className="block group/title mb-4">
                        <div className="relative inline-block">
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-snug line-clamp-2 group-hover/title:text-[#C4735B] transition-colors duration-300">
                            {job.title}
                          </h3>
                          {/* Animated underline */}
                          <span className="absolute -bottom-0.5 left-0 w-0 h-[2px] bg-gradient-to-r from-[#C4735B] via-[#D4937B] to-[#C4735B] group-hover/title:w-full transition-all duration-500 ease-out rounded-full" />
                        </div>
                      </Link>

                      {/* Client + Meta - Enhanced */}
                      <div className="flex flex-wrap items-center gap-3 mb-5">
                        <div className="flex items-center gap-2 group/client">
                          <div className="relative">
                            <Avatar
                              src={job.clientId?.avatar}
                              name={job.clientId?.name || 'Client'}
                              size="sm"
                            />
                            <div className="absolute -inset-0.5 rounded-full border-2 border-transparent group-hover/client:border-[#C4735B]/20 transition-all duration-300" />
                          </div>
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover/client:text-[#C4735B] transition-colors">
                            {job.clientId?.name}
                          </span>
                        </div>
                        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700" />
                        <span className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                        <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700" />
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-[#C4735B]">
                          <DollarSign className="w-3.5 h-3.5" />
                          {formatBudget(job, language as 'en' | 'ka' | 'ru') || (language === 'ka' ? 'შეთანხმებით' : 'Negotiable')}
                        </span>
                      </div>

                      {/* Your Proposal - Premium card */}
                      <div className="relative rounded-xl overflow-hidden">
                        {/* Gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#C4735B]/5 via-transparent to-[#D4937B]/5" />
                        
                        <div className="relative p-4 border border-[#C4735B]/10 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#C4735B]/10 flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5 text-[#C4735B]" />
                              </div>
                              <p className="text-xs font-bold uppercase tracking-wider text-[#C4735B]">
                                {language === 'ka' ? 'შენი შეთავაზება' : 'Your Proposal'}
                              </p>
                            </div>
                            <span className="text-xs text-neutral-400">
                              {formatDateShort(proposal.createdAt, language as 'en' | 'ka' | 'ru')}
                            </span>
                          </div>
                          
                          {/* Price and duration row */}
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-[#C4735B]">
                                ₾{proposal.proposedPrice?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                              <Clock className="w-3.5 h-3.5" />
                              {proposal.estimatedDuration}{' '}
                              {proposal.estimatedDurationUnit === 'days'
                                ? (language === 'ka' ? 'დღე' : 'days')
                                : proposal.estimatedDurationUnit === 'weeks'
                                ? (language === 'ka' ? 'კვირა' : 'weeks')
                                : (language === 'ka' ? 'თვე' : 'months')}
                            </div>
                          </div>
                          
                          {/* Cover letter */}
                          <div className="flex gap-2">
                            <Quote className="w-4 h-4 text-[#C4735B]/40 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 italic leading-relaxed">
                              {proposal.coverLetter}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Rejection Note */}
                      {proposal.status === 'rejected' && proposal.rejectionNote && (
                        <Alert variant="error" size="sm" className="mt-4">
                          <strong>{language === 'ka' ? 'მიზეზი:' : 'Reason:'}</strong> {proposal.rejectionNote}
                        </Alert>
                      )}
                    </div>

                    {/* Actions - Enhanced */}
                    <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-gradient-to-r from-neutral-50/50 to-transparent dark:from-neutral-800/20">
                      <div className="flex items-center gap-3">
                        <Button
                          asChild
                          variant="secondary"
                          size="sm"
                          className="group/btn"
                        >
                          <Link href={`/jobs/${job.id}`} className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                            {language === 'ka' ? 'სამუშაო' : 'View Job'}
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-1 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all" />
                          </Link>
                        </Button>

                        {(isPending || isInDiscussion) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setWithdrawModalId(proposal.id)}
                            leftIcon={<X className="w-4 h-4" />}
                            className="text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            {language === 'ka' ? 'გაუქმება' : 'Withdraw'}
                          </Button>
                        )}
                      </div>
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
