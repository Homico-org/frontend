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
import Card, { CardContent, CardBadge, CardFooter } from '@/components/common/Card';
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
  ChevronDown,
  Search,
  ArrowLeft,
  Play,
  MessageCircle,
  ExternalLink,
  X,
  AlertTriangle,
  Send,
  Building2,
  User,
  DollarSign,
  Timer,
  Inbox,
  CheckCheck,
  MessageSquare,
  Ban,
} from 'lucide-react';

type ProposalStatus = 'all' | 'pending' | 'in_discussion' | 'accepted' | 'rejected' | 'withdrawn';

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
}

export default function MyProposalsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale: language } = useLanguage();
  const toast = useToast();
  const router = useRouter();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [withdrawModalId, setWithdrawModalId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'pro')) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchMyProposals = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/jobs/my-proposals/detailed');
      setProposals(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch proposals:', err);
      setError(err.response?.data?.message || 'Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'pro' && !hasFetched.current) {
      hasFetched.current = true;
      fetchMyProposals();
    }
  }, [isAuthenticated, user, fetchMyProposals]);

  const handleWithdraw = async () => {
    if (!withdrawModalId) return;
    
    setIsWithdrawing(true);
    try {
      await api.post(`/jobs/proposals/${withdrawModalId}/withdraw`);
      setProposals(prev => prev.map(p => 
        p._id === withdrawModalId ? { ...p, status: 'withdrawn' } : p
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

  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    const job = proposal.jobId;
    const matchesSearch = searchQuery === '' ||
      job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job?.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job?.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate stats
  const stats = {
    total: proposals.length,
    pending: proposals.filter(p => p.status === 'pending').length,
    inDiscussion: proposals.filter(p => p.status === 'in_discussion').length,
    accepted: proposals.filter(p => p.status === 'accepted' || p.status === 'completed').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
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

  const getStatusLabel = (status: string) => {
    if (language === 'ka') {
      switch (status) {
        case 'pending': return 'მოლოდინში';
        case 'in_discussion': return 'მიმოწერაში';
        case 'accepted': return 'მიღებული';
        case 'completed': return 'დასრულებული';
        case 'rejected': return 'უარყოფილი';
        case 'withdrawn': return 'გაუქმებული';
        default: return status;
      }
    }
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_discussion': return 'In Discussion';
      case 'accepted': return 'Accepted';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      case 'withdrawn': return 'Withdrawn';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'in_discussion': return MessageSquare;
      case 'accepted': return CheckCircle;
      case 'completed': return CheckCheck;
      case 'rejected': return XCircle;
      case 'withdrawn': return Ban;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
      case 'in_discussion': return 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
      case 'accepted': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
      case 'completed': return 'bg-[#D2691E]/15 text-[#D2691E]';
      case 'rejected': return 'bg-red-500/15 text-red-600 dark:text-red-400';
      case 'withdrawn': return 'bg-neutral-500/15 text-neutral-500';
      default: return 'bg-neutral-500/15 text-neutral-500';
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
                <Send className="w-8 h-8 text-[var(--color-accent)] animate-pulse" />
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-2xl border-2 border-[var(--color-accent)]/20 border-t-[var(--color-accent)] animate-spin" />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {language === 'ka' ? 'იტვირთება...' : 'Loading your proposals...'}
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
        <div className="relative z-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {language === 'ka' ? 'შეცდომა' : 'Error'}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
            <Button onClick={fetchMyProposals}>
              {language === 'ka' ? 'ხელახლა ცდა' : 'Try Again'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const filterTabs = [
    { key: 'all', label: language === 'ka' ? 'ყველა' : 'All', count: stats.total, icon: Inbox },
    { key: 'pending', label: language === 'ka' ? 'მოლოდინში' : 'Pending', count: stats.pending, icon: Clock },
    { key: 'in_discussion', label: language === 'ka' ? 'მიმოწერა' : 'Discussion', count: stats.inDiscussion, icon: MessageSquare },
    { key: 'accepted', label: language === 'ka' ? 'მიღებული' : 'Accepted', count: stats.accepted, icon: CheckCircle },
    { key: 'rejected', label: language === 'ka' ? 'უარყოფილი' : 'Rejected', count: stats.rejected, icon: XCircle },
  ];

  return (
    <div className="min-h-screen relative">
      <AppBackground />
      <Header />

      <main className="relative z-20 max-w-5xl mx-auto px-4 pt-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="!p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {language === 'ka' ? 'ჩემი შეთავაზებები' : 'My Proposals'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {language === 'ka' 
                ? 'თვალყური ადევნე შენს შეთავაზებებს და კომუნიკაციას კლიენტებთან'
                : 'Track your proposals and communicate with clients'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button href="/my-work" variant="outline" size="sm">
              {language === 'ka' ? 'ჩემი სამუშაოები' : 'My Work'}
            </Button>
            <Button href="/browse/jobs" size="sm">
              {language === 'ka' ? 'სამუშაოები' : 'Browse Jobs'}
            </Button>
          </div>
        </div>

        {/* Stats & Filters */}
        <div className="mb-6 p-4 rounded-2xl border" style={{ 
          backgroundColor: 'var(--color-bg-elevated)', 
          borderColor: 'var(--color-border)' 
        }}>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as ProposalStatus)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#D2691E] text-white'
                      : 'bg-[#D2691E]/5 text-[var(--color-text-secondary)] hover:bg-[#D2691E]/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                    isActive ? 'bg-white/20' : 'bg-[#D2691E]/10 text-[#D2691E]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}

            {/* Search */}
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
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

        {/* Proposals List */}
        {filteredProposals.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-[var(--color-accent)]/10 mx-auto mb-5 flex items-center justify-center">
              <Send className="w-10 h-10 text-[var(--color-accent)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {proposals.length === 0
                ? (language === 'ka' ? 'ჯერ არ გაქვს შეთავაზება' : 'No proposals yet')
                : (language === 'ka' ? 'შედეგი ვერ მოიძებნა' : 'No matching proposals')}
            </h3>
            <p className="max-w-sm mx-auto text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              {proposals.length === 0
                ? (language === 'ka'
                    ? 'მოძებნე შენთვის შესაფერისი სამუშაო და გაგზავნე შეთავაზება'
                    : 'Find jobs that match your skills and submit proposals')
                : (language === 'ka'
                    ? 'სცადე ფილტრების შეცვლა'
                    : 'Try adjusting your filters')}
            </p>
            {proposals.length === 0 && (
              <Button href="/browse/jobs">
                {language === 'ka' ? 'სამუშაოების ნახვა' : 'Browse Jobs'}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProposals.map((proposal) => {
              const job = proposal.jobId;
              if (!job) return null;
              
              const StatusIcon = getStatusIcon(proposal.status);
              const allMedia = [
                ...(job.media || []).map(m => ({ url: m.url, type: m.type })),
                ...(job.images || []).filter(img => !job.media?.some(m => m.url === img)).map(url => ({ url, type: 'image' }))
              ];
              const hasMedia = allMedia.length > 0;
              const isClient = job.clientId?.accountType === 'organization';

              return (
                <Card
                  key={proposal._id}
                  variant="elevated"
                  hover="lift"
                  className={`group ${
                    proposal.status === 'accepted'
                      ? 'ring-2 ring-emerald-500/30 ring-offset-1 ring-offset-[#FFFDF9] dark:ring-offset-[#1c1917]'
                      : proposal.status === 'in_discussion'
                        ? 'ring-2 ring-blue-500/20 ring-offset-1'
                        : ''
                  }`}
                >
                  <div className={`flex flex-col ${hasMedia ? 'sm:flex-row' : ''}`}>
                    {/* Media Section */}
                    {hasMedia && (
                      <div className="relative w-full sm:w-48 lg:w-56 flex-shrink-0 overflow-hidden rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none">
                        <div className="relative h-44 sm:h-full sm:min-h-[220px]">
                          <img
                            src={storage.getFileUrl(allMedia[0].url)}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          {/* Job Status Badge */}
                          <div className="absolute top-3 left-3 z-10">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm ${
                              job.status === 'open' 
                                ? 'bg-emerald-500/90 text-white' 
                                : 'bg-neutral-500/90 text-white'
                            }`}>
                              {job.status === 'open' ? (language === 'ka' ? 'ღია' : 'Open') : (language === 'ka' ? 'დახურული' : 'Closed')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Content Section */}
                    <CardContent spacing="normal" className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Proposal Status & Client Response */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(proposal.status)}`}>
                              <StatusIcon className="w-3 h-3" />
                              {getStatusLabel(proposal.status)}
                            </span>
                            {proposal.unreadMessageCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-blue-500 text-white">
                                <MessageCircle className="w-3 h-3" />
                                {proposal.unreadMessageCount} {language === 'ka' ? 'ახალი' : 'new'}
                              </span>
                            )}
                            {proposal.clientRespondedAt && proposal.status === 'in_discussion' && (
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {language === 'ka' ? 'კლიენტი გიპასუხა!' : 'Client responded!'}
                              </span>
                            )}
                          </div>

                          {/* Job Title */}
                          <Link href={`/jobs/${job._id}`} className="block group/title">
                            <h3 className="text-lg font-semibold leading-snug line-clamp-2 transition-colors text-[var(--color-text-primary)] group-hover/title:text-[#D2691E]">
                              {job.title}
                            </h3>
                          </Link>

                          {/* Client Info */}
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar
                              src={job.clientId?.avatar}
                              name={job.clientId?.name || 'Client'}
                              size="xs"
                            />
                            <span className="text-sm text-[var(--color-text-secondary)]">
                              {job.clientId?.name}
                            </span>
                            {isClient && job.clientId?.companyName && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#D2691E]/10 text-[#D2691E]">
                                <Building2 className="w-3 h-3" />
                                {job.clientId.companyName}
                              </span>
                            )}
                          </div>

                          {/* Job Meta */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-sm text-[var(--color-text-secondary)]">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#D2691E]/60" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1.5 font-semibold text-[#D2691E]">
                              <DollarSign className="w-3.5 h-3.5" />
                              {formatBudget(job)}
                            </span>
                          </div>

                          {/* Your Proposal Summary */}
                          <div className="mt-3 p-3 rounded-lg bg-[#D2691E]/5 border border-[#E8D5C4]/40 dark:border-[#3d2f24]/40">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-[#D2691E]">
                                {language === 'ka' ? 'შენი შეთავაზება' : 'Your Proposal'}
                              </span>
                              <span className="text-xs text-[var(--color-text-tertiary)]">
                                {formatDate(proposal.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-bold text-[#D2691E]">
                                ₾{proposal.proposedPrice?.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                                <Timer className="w-3.5 h-3.5" />
                                {proposal.estimatedDuration} {
                                  proposal.estimatedDurationUnit === 'days' ? (language === 'ka' ? 'დღე' : 'days') :
                                  proposal.estimatedDurationUnit === 'weeks' ? (language === 'ka' ? 'კვირა' : 'weeks') :
                                  (language === 'ka' ? 'თვე' : 'months')
                                }
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-[var(--color-text-tertiary)] line-clamp-2">
                              "{proposal.coverLetter}"
                            </p>
                          </div>

                          {/* Rejection Note */}
                          {proposal.status === 'rejected' && proposal.rejectionNote && (
                            <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                              <strong>{language === 'ka' ? 'მიზეზი:' : 'Reason:'}</strong> {proposal.rejectionNote}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  {/* Actions Footer */}
                  <CardFooter className="flex flex-wrap items-center gap-3">
                    {/* Chat Button - Always visible if in discussion or accepted */}
                    {(proposal.status === 'in_discussion' || proposal.status === 'accepted' || proposal.status === 'completed') && proposal.conversationId && (
                      <Button
                        href={`/messages?conversation=${proposal.conversationId}`}
                        size="sm"
                        icon={<MessageCircle className="w-4 h-4" />}
                        className={proposal.unreadMessageCount > 0 ? 'animate-pulse' : ''}
                      >
                        {language === 'ka' ? 'მესიჯი' : 'Message'}
                        {proposal.unreadMessageCount > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                            {proposal.unreadMessageCount}
                          </span>
                        )}
                      </Button>
                    )}

                    {/* Contact Info - if accepted */}
                    {proposal.status === 'accepted' && proposal.contactRevealed && job.clientId && (
                      <div className="flex items-center gap-3">
                        {job.clientId.phone && (
                          <a href={`tel:${job.clientId.phone}`} className="flex items-center gap-1 text-sm text-[#D2691E] hover:underline">
                            <Phone className="w-3.5 h-3.5" />
                            {job.clientId.phone}
                          </a>
                        )}
                        {job.clientId.email && (
                          <a href={`mailto:${job.clientId.email}`} className="flex items-center gap-1 text-sm text-[#D2691E] hover:underline">
                            <Mail className="w-3.5 h-3.5" />
                            {language === 'ka' ? 'ემაილი' : 'Email'}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Withdraw Button - only for pending */}
                    {proposal.status === 'pending' && (
                      <button
                        onClick={() => setWithdrawModalId(proposal._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        {language === 'ka' ? 'გაუქმება' : 'Withdraw'}
                      </button>
                    )}

                    <Link
                      href={`/jobs/${job._id}`}
                      className="ml-auto flex items-center gap-1.5 text-sm font-medium text-[#D2691E] hover:underline"
                    >
                      {language === 'ka' ? 'სამუშაო' : 'View Job'}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Withdraw Modal */}
      {withdrawModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setWithdrawModalId(null)} />
          
          <div className="relative w-full max-w-md bg-[var(--color-bg-elevated)] rounded-2xl border shadow-2xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {language === 'ka' ? 'შეთავაზების გაუქმება' : 'Withdraw Proposal'}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {language === 'ka' 
                      ? 'დარწმუნებული ხარ, რომ გინდა შეთავაზების გაუქმება? ეს მოქმედება ვერ გაუქმდება.'
                      : 'Are you sure you want to withdraw this proposal? This action cannot be undone.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setWithdrawModalId(null)}
                  className="flex-1"
                >
                  {language === 'ka' ? 'გაუქმება' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="flex-1 !bg-red-500 hover:!bg-red-600"
                >
                  {isWithdrawing 
                    ? (language === 'ka' ? 'მიმდინარეობს...' : 'Withdrawing...') 
                    : (language === 'ka' ? 'დადასტურება' : 'Confirm')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

