'use client';

import AppBackground from '@/components/common/AppBackground';
import Avatar from '@/components/common/Avatar';
import Header from '@/components/common/Header';
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
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Inbox,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Search,
  Send,
  Timer,
  X,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

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

  const [allProposals, setAllProposals] = useState<Proposal[]>([]); // All proposals for stats
  const [proposals, setProposals] = useState<Proposal[]>([]); // Filtered proposals for display
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [withdrawModalId, setWithdrawModalId] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const hasFetched = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Calculate stats from all proposals
  const stats = {
    total: allProposals.length,
    pending: allProposals.filter(p => p.status === 'pending').length,
    inDiscussion: allProposals.filter(p => p.status === 'in_discussion').length,
    accepted: allProposals.filter(p => p.status === 'accepted' || p.status === 'completed').length,
    rejected: allProposals.filter(p => p.status === 'rejected').length,
    withdrawn: allProposals.filter(p => p.status === 'withdrawn').length,
  };

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'pro')) {
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

  // Filter proposals client-side
  const filterProposals = useCallback((status: ProposalStatus, search: string) => {
    setIsContentLoading(true);

    let filtered = [...allProposals];

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(p => p.status === status);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => {
        const job = p.jobId;
        return job?.title?.toLowerCase().includes(searchLower) ||
          job?.category?.toLowerCase().includes(searchLower) ||
          job?.location?.toLowerCase().includes(searchLower);
      });
    }

    setProposals(filtered);
    setIsContentLoading(false);
  }, [allProposals]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'pro' && !hasFetched.current) {
      hasFetched.current = true;
      fetchAllProposals();
    }
  }, [isAuthenticated, user, fetchAllProposals]);

  // Filter when status or search changes
  useEffect(() => {
    if (!hasFetched.current || allProposals.length === 0 && isInitialLoading) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce only for search, immediate for status
    if (searchQuery) {
      debounceRef.current = setTimeout(() => {
        filterProposals(statusFilter, searchQuery);
      }, 300);
    } else {
      filterProposals(statusFilter, searchQuery);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [statusFilter, searchQuery, filterProposals, allProposals, isInitialLoading]);

  const handleWithdraw = async () => {
    if (!withdrawModalId) return;

    setIsWithdrawing(true);
    try {
      await api.post(`/jobs/proposals/${withdrawModalId}/withdraw`);
      // Update both allProposals and proposals
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

  // Loading State - only for initial load
  if (authLoading || isInitialLoading) {
    return (
      <div className="myproposals-container">
        <div className="myproposals-background" />
        <AppBackground />
        <Header />
        <div className="relative z-20 myproposals-loading">
          <div className="myproposals-loading-inner">
            <div className="myproposals-loading-icon">
              <Send />
              <div className="myproposals-loading-spinner" />
            </div>
            <p className="myproposals-loading-text">
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
      <div className="myproposals-container">
        <div className="myproposals-background" />
        <AppBackground />
        <Header />
        <div className="relative z-20 myproposals-loading">
          <div className="myproposals-loading-inner">
            <div className="myproposals-loading-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertTriangle style={{ color: '#EF4444' }} />
            </div>
            <h3 className="myproposals-empty-title">
              {language === 'ka' ? 'შეცდომა' : 'Error'}
            </h3>
            <p className="myproposals-loading-text">{error}</p>
            <button onClick={fetchMyProposals} className="myproposals-empty-btn">
              {language === 'ka' ? 'ხელახლა ცდა' : 'Try Again'}
            </button>
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
    { key: 'withdrawn', label: language === 'ka' ? 'გაუქმებული' : 'Withdrawn', count: stats.withdrawn, icon: Ban },
  ];

  return (
    <div className="myproposals-container">
      <div className="myproposals-background" />
      <AppBackground />
      <Header />

      <main className="myproposals-main">
        {/* Header */}
        <div className="myproposals-header">
          <button onClick={() => router.back()} className="myproposals-back">
            <ArrowLeft />
          </button>
          <div className="myproposals-title-section">
            <h1 className="myproposals-title">
              {language === 'ka' ? 'ჩემი შეთავაზებები' : 'My Proposals'}
            </h1>
            <p className="myproposals-subtitle">
              {language === 'ka'
                ? 'თვალყური ადევნე შენს შეთავაზებებს და კომუნიკაციას კლიენტებთან'
                : 'Track your proposals and communicate with clients'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="myproposals-filters">
          <div className="myproposals-filters-row">
            <div className="myproposals-filter-tabs">
              {filterTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key as ProposalStatus)}
                    className={`myproposals-filter-tab ${isActive ? 'active' : ''}`}
                  >
                    <Icon />
                    <span>{tab.label}</span>
                    <span className="myproposals-filter-count">{tab.count}</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="myproposals-search">
              <Search className="myproposals-search-icon" />
              <input
                type="text"
                placeholder={language === 'ka' ? 'ძებნა...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="myproposals-search-input"
              />
            </div>
          </div>
        </div>

        {/* Proposals List */}
        {isContentLoading ? (
          <div className="myproposals-empty">
            <div className="myproposals-loading-icon">
              <Send />
              <div className="myproposals-loading-spinner" />
            </div>
            <p className="myproposals-loading-text">
              {language === 'ka' ? 'იტვირთება...' : 'Loading...'}
            </p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="myproposals-empty">
            <div className="myproposals-empty-icon">
              <Send />
            </div>
            <h3 className="myproposals-empty-title">
              {stats.total === 0
                ? (language === 'ka' ? 'ჯერ არ გაქვს შეთავაზება' : 'No proposals yet')
                : (language === 'ka' ? 'შედეგი ვერ მოიძებნა' : 'No matching proposals')}
            </h3>
            <p className="myproposals-empty-text">
              {stats.total === 0
                ? (language === 'ka'
                    ? 'მოძებნე შენთვის შესაფერისი სამუშაო და გაგზავნე შეთავაზება'
                    : 'Find jobs that match your skills and submit proposals')
                : (language === 'ka'
                    ? 'სცადე ფილტრების შეცვლა'
                    : 'Try adjusting your filters')}
            </p>
            {stats.total === 0 && (
              <Link href="/browse/jobs" className="myproposals-empty-btn">
                <Briefcase className="w-5 h-5" />
                {language === 'ka' ? 'სამუშაოების ნახვა' : 'Browse Jobs'}
              </Link>
            )}
          </div>
        ) : (
          <div className="myproposals-list">
            {proposals.map((proposal) => {
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
                <div
                  key={proposal._id}
                  className={`myproposals-card status-${proposal.status}`}
                >
                  <div className="myproposals-card-inner">
                    {/* Media Section */}
                    {hasMedia && (
                      <div className="myproposals-card-media">
                        <div className="myproposals-card-media-inner">
                          <img
                            src={storage.getFileUrl(allMedia[0].url)}
                            alt=""
                          />
                          <div className="myproposals-card-media-overlay" />
                          <span className={`myproposals-card-job-status ${job.status === 'open' ? 'open' : 'closed'}`}>
                            {job.status === 'open' ? (language === 'ka' ? 'ღია' : 'Open') : (language === 'ka' ? 'დახურული' : 'Closed')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Content Section */}
                    <div className="myproposals-card-content">
                      {/* Status Row */}
                      <div className="myproposals-status-row">
                        <span className={`myproposals-status-badge ${proposal.status}`}>
                          <StatusIcon />
                          {getStatusLabel(proposal.status)}
                        </span>
                        {(proposal.unreadMessageCount ?? 0) > 0 && (
                          <span className="myproposals-unread-badge">
                            <MessageCircle className="w-3 h-3" />
                            {proposal.unreadMessageCount} {language === 'ka' ? 'ახალი' : 'new'}
                          </span>
                        )}
                        {proposal.clientRespondedAt && proposal.status === 'in_discussion' && (
                          <span className="myproposals-response-hint">
                            {language === 'ka' ? 'კლიენტი გიპასუხა!' : 'Client responded!'}
                          </span>
                        )}
                      </div>

                      {/* Job Title */}
                      <Link href={`/jobs/${job._id}`}>
                        <h3 className="myproposals-job-title">{job.title}</h3>
                      </Link>

                      {/* Client Info */}
                      <div className="myproposals-client-row">
                        <Avatar
                          src={job.clientId?.avatar}
                          name={job.clientId?.name || 'Client'}
                          size="xs"
                        />
                        <span className="myproposals-client-name">
                          {job.clientId?.name}
                        </span>
                        {isClient && job.clientId?.companyName && (
                          <span className="myproposals-company-badge">
                            <Building2 />
                            {job.clientId.companyName}
                          </span>
                        )}
                      </div>

                      {/* Job Meta */}
                      <div className="myproposals-job-meta">
                        <span>
                          <MapPin />
                          {job.location}
                        </span>
                        <span className="myproposals-budget">
                          <DollarSign />
                          {formatBudget(job)}
                        </span>
                      </div>

                      {/* Your Proposal Summary */}
                      <div className="myproposals-proposal-box">
                        <div className="myproposals-proposal-header">
                          <span className="myproposals-proposal-label">
                            {language === 'ka' ? 'შენი შეთავაზება' : 'Your Proposal'}
                          </span>
                          <span className="myproposals-proposal-date">
                            {formatDate(proposal.createdAt)}
                          </span>
                        </div>
                        <div className="myproposals-proposal-details">
                          <span className="myproposals-proposal-price">
                            ₾{proposal.proposedPrice?.toLocaleString()}
                          </span>
                          <span className="myproposals-proposal-duration">
                            <Timer />
                            {proposal.estimatedDuration} {
                              proposal.estimatedDurationUnit === 'days' ? (language === 'ka' ? 'დღე' : 'days') :
                              proposal.estimatedDurationUnit === 'weeks' ? (language === 'ka' ? 'კვირა' : 'weeks') :
                              (language === 'ka' ? 'თვე' : 'months')
                            }
                          </span>
                        </div>
                        <p className="myproposals-proposal-letter">
                          "{proposal.coverLetter}"
                        </p>
                      </div>

                      {/* Rejection Note */}
                      {proposal.status === 'rejected' && proposal.rejectionNote && (
                        <div className="myproposals-rejection-note">
                          <strong>{language === 'ka' ? 'მიზეზი:' : 'Reason:'}</strong> {proposal.rejectionNote}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="myproposals-card-footer">
                    {/* Chat Button */}
                    {(proposal.status === 'in_discussion' || proposal.status === 'accepted' || proposal.status === 'completed') && proposal.conversationId && (
                      <Link
                        href={`/messages?conversation=${proposal.conversationId}`}
                        className={`myproposals-action-btn primary ${(proposal.unreadMessageCount ?? 0) > 0 ? 'has-unread' : ''}`}
                      >
                        <MessageCircle />
                        {language === 'ka' ? 'მესიჯი' : 'Message'}
                        {(proposal.unreadMessageCount ?? 0) > 0 && (
                          <span className="myproposals-unread-count">
                            {proposal.unreadMessageCount}
                          </span>
                        )}
                      </Link>
                    )}

                    {/* Contact Info - if accepted */}
                    {proposal.status === 'accepted' && proposal.contactRevealed && job.clientId && (
                      <div className="myproposals-contact-info">
                        {job.clientId.phone && (
                          <a href={`tel:${job.clientId.phone}`} className="myproposals-contact-link">
                            <Phone />
                            {job.clientId.phone}
                          </a>
                        )}
                        {job.clientId.email && (
                          <a href={`mailto:${job.clientId.email}`} className="myproposals-contact-link">
                            <Mail />
                            {language === 'ka' ? 'ემაილი' : 'Email'}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Withdraw Button - only for pending */}
                    {proposal.status === 'pending' && (
                      <button
                        onClick={() => setWithdrawModalId(proposal._id)}
                        className="myproposals-action-btn danger"
                      >
                        <X />
                        {language === 'ka' ? 'გაუქმება' : 'Withdraw'}
                      </button>
                    )}

                    <Link href={`/jobs/${job._id}`} className="myproposals-view-job">
                      {language === 'ka' ? 'სამუშაო' : 'View Job'}
                      <ExternalLink />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Withdraw Modal */}
      {withdrawModalId && (
        <div className="myproposals-modal-overlay">
          <div className="myproposals-modal-backdrop" onClick={() => setWithdrawModalId(null)} />

          <div className="myproposals-modal">
            <div className="myproposals-modal-content">
              <div className="myproposals-modal-header">
                <div className="myproposals-modal-icon">
                  <AlertTriangle />
                </div>
                <div>
                  <h3 className="myproposals-modal-title">
                    {language === 'ka' ? 'შეთავაზების გაუქმება' : 'Withdraw Proposal'}
                  </h3>
                  <p className="myproposals-modal-text">
                    {language === 'ka'
                      ? 'დარწმუნებული ხარ, რომ გინდა შეთავაზების გაუქმება? ეს მოქმედება ვერ გაუქმდება.'
                      : 'Are you sure you want to withdraw this proposal? This action cannot be undone.'}
                  </p>
                </div>
              </div>

              <div className="myproposals-modal-actions">
                <button
                  onClick={() => setWithdrawModalId(null)}
                  className="myproposals-modal-btn cancel"
                >
                  {language === 'ka' ? 'გაუქმება' : 'Cancel'}
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="myproposals-modal-btn confirm"
                >
                  {isWithdrawing
                    ? (language === 'ka' ? 'მიმდინარეობს...' : 'Withdrawing...')
                    : (language === 'ka' ? 'დადასტურება' : 'Confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
