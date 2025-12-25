'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  User,
  ChevronRight,
  Search,
  Filter,
  ArrowUpRight,
  Send,
  Eye,
  MessageSquare,
  DollarSign,
  Briefcase
} from 'lucide-react';

// Terracotta accent colors
const ACCENT = '#E07B4F';
const ACCENT_HOVER = '#D26B3F';

interface ProposalJob {
  _id: string;
  title: string;
  category?: string;
  location?: string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
}

interface CompanyProposal {
  _id: string;
  jobId: ProposalJob;
  clientId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  amount: number;
  currency: string;
  message: string;
  status: 'pending' | 'viewed' | 'accepted' | 'rejected' | 'withdrawn';
  estimatedDuration?: string;
  assignedEmployee?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function CompanyProposalsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { locale } = useLanguage();
  const router = useRouter();

  const [proposals, setProposals] = useState<CompanyProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, hasMore: false });
  const [filter, setFilter] = useState({ status: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openLoginModal('/company/proposals');
    }
    if (!authLoading && user?.role !== 'company') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router, openLoginModal]);

  useEffect(() => {
    if (!authLoading && user?.role === 'company') {
      fetchProposals();
    }
  }, [authLoading, user, filter.status]);

  const fetchProposals = async (page = 1) => {
    try {
      setIsLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (filter.status) params.append('status', filter.status);

      const res = await fetch(`${API_URL}/companies/my/company/proposals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProposals(data.data || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, hasMore: false });
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
          label: locale === 'ka' ? 'მოლოდინში' : 'Pending'
        };
      case 'viewed':
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Eye,
          label: locale === 'ka' ? 'ნანახი' : 'Viewed'
        };
      case 'accepted':
        return {
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          label: locale === 'ka' ? 'მიღებული' : 'Accepted'
        };
      case 'rejected':
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: XCircle,
          label: locale === 'ka' ? 'უარყოფილი' : 'Rejected'
        };
      case 'withdrawn':
        return {
          color: 'bg-neutral-50 text-neutral-600 border-neutral-200',
          icon: XCircle,
          label: locale === 'ka' ? 'გაწვეული' : 'Withdrawn'
        };
      default:
        return {
          color: 'bg-neutral-50 text-neutral-700 border-neutral-200',
          icon: FileText,
          label: status
        };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (locale === 'ka') {
      if (diffMins < 60) return `${diffMins} წუთის წინ`;
      if (diffHours < 24) return `${diffHours} საათის წინ`;
      if (diffDays < 7) return `${diffDays} დღის წინ`;
      return formatDate(dateString);
    }
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  // Stats calculations
  const stats = {
    total: pagination.total || proposals.length,
    pending: proposals.filter(p => p.status === 'pending').length,
    viewed: proposals.filter(p => p.status === 'viewed').length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
  };

  // Filter displayed proposals by search
  const displayedProposals = filter.search
    ? proposals.filter(p =>
        p.jobId?.title?.toLowerCase().includes(filter.search.toLowerCase()) ||
        p.clientId?.name?.toLowerCase().includes(filter.search.toLowerCase())
      )
    : proposals;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: ACCENT, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {locale === 'ka' ? 'შეთავაზებები' : 'Proposals'}
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              {locale === 'ka' ? 'თვალყური ადევნეთ კომპანიის შეთავაზებებს' : 'Track your company proposals and bids'}
            </p>
          </div>
          <Link
            href="/browse/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 self-start"
            style={{ backgroundColor: ACCENT }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ACCENT_HOVER}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ACCENT}
          >
            <Briefcase className="w-5 h-5" />
            {locale === 'ka' ? 'სამუშაოების ნახვა' : 'Browse Jobs'}
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => setFilter({ ...filter, status: '' })}
            className={`bg-[var(--color-bg-primary)] rounded-xl border p-4 text-left transition-all duration-200 ${
              !filter.status
                ? 'border-[#E07B4F] ring-2 ring-[#E07B4F]/20'
                : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ACCENT}15` }}>
                <FileText className="w-5 h-5" style={{ color: ACCENT }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.total}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {locale === 'ka' ? 'ყველა' : 'All'}
            </div>
          </button>

          <button
            onClick={() => setFilter({ ...filter, status: 'pending' })}
            className={`bg-[var(--color-bg-primary)] rounded-xl border p-4 text-left transition-all duration-200 ${
              filter.status === 'pending'
                ? 'border-amber-500 ring-2 ring-amber-100'
                : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {locale === 'ka' ? 'მოლოდინში' : 'Pending'}
            </div>
          </button>

          <button
            onClick={() => setFilter({ ...filter, status: 'viewed' })}
            className={`bg-[var(--color-bg-primary)] rounded-xl border p-4 text-left transition-all duration-200 ${
              filter.status === 'viewed'
                ? 'border-blue-500 ring-2 ring-blue-100'
                : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.viewed}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {locale === 'ka' ? 'ნანახი' : 'Viewed'}
            </div>
          </button>

          <button
            onClick={() => setFilter({ ...filter, status: 'accepted' })}
            className={`bg-[var(--color-bg-primary)] rounded-xl border p-4 text-left transition-all duration-200 ${
              filter.status === 'accepted'
                ? 'border-emerald-500 ring-2 ring-emerald-100'
                : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{stats.accepted}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {locale === 'ka' ? 'მიღებული' : 'Accepted'}
            </div>
          </button>

          <button
            onClick={() => setFilter({ ...filter, status: 'rejected' })}
            className={`bg-[var(--color-bg-primary)] rounded-xl border p-4 text-left transition-all duration-200 ${
              filter.status === 'rejected'
                ? 'border-red-500 ring-2 ring-red-100'
                : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {locale === 'ka' ? 'უარყოფილი' : 'Rejected'}
            </div>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border-primary)] p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder={locale === 'ka' ? 'მოძებნე შეთავაზება...' : 'Search proposals...'}
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F] transition-colors"
              />
            </div>

            {/* Clear Filter */}
            {filter.status && (
              <button
                onClick={() => setFilter({ ...filter, status: '' })}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-secondary)]"
              >
                <XCircle className="w-4 h-4" />
                {locale === 'ka' ? 'გაწმინდე' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {/* Proposals List */}
        <div className="bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: ACCENT, borderTopColor: 'transparent' }}
              />
            </div>
          ) : displayedProposals.length > 0 ? (
            <div className="divide-y divide-[var(--color-border-primary)]">
              {displayedProposals.map((proposal) => {
                const statusInfo = getStatusInfo(proposal.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <Link
                    key={proposal._id}
                    href={`/company/proposals/${proposal._id}`}
                    className="block p-5 hover:bg-[var(--color-bg-secondary)] transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Job Title and Status */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
                            {proposal.jobId?.title || 'Untitled Job'}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-text-secondary)]">
                          <span className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {proposal.clientId?.name || 'Unknown Client'}
                          </span>
                          {proposal.jobId?.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {proposal.jobId.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatTimeAgo(proposal.createdAt)}
                          </span>
                          {proposal.estimatedDuration && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {proposal.estimatedDuration}
                            </span>
                          )}
                        </div>

                        {/* Message preview */}
                        {proposal.message && (
                          <p className="mt-2 text-sm text-[var(--color-text-tertiary)] line-clamp-1">
                            {proposal.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Assigned Employee */}
                        {proposal.assignedEmployee && (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-[var(--color-bg-primary)] flex items-center justify-center text-white text-xs font-medium"
                              style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_HOVER} 100%)` }}
                              title={proposal.assignedEmployee.name}
                            >
                              {proposal.assignedEmployee.avatar ? (
                                <img
                                  src={proposal.assignedEmployee.avatar}
                                  alt={proposal.assignedEmployee.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                proposal.assignedEmployee.name?.charAt(0)
                              )}
                            </div>
                          </div>
                        )}

                        {/* Amount */}
                        <div className="text-right">
                          <div className="font-semibold text-[var(--color-text-primary)]">
                            {proposal.amount?.toLocaleString()} {proposal.currency || 'GEL'}
                          </div>
                          {proposal.jobId?.budgetAmount && (
                            <div className="text-xs text-[var(--color-text-tertiary)]">
                              {locale === 'ka' ? 'ბიუჯეტი:' : 'Budget:'} {proposal.jobId.budgetAmount.toLocaleString()}
                            </div>
                          )}
                        </div>

                        <ChevronRight className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${ACCENT}15` }}
              >
                <Send className="w-8 h-8" style={{ color: ACCENT }} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                {locale === 'ka' ? 'შეთავაზებები არ მოიძებნა' : 'No proposals found'}
              </h3>
              <p className="text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto">
                {filter.status || filter.search
                  ? (locale === 'ka' ? 'სცადეთ ფილტრების შეცვლა' : 'Try adjusting your filters')
                  : (locale === 'ka' ? 'დაიწყეთ სამუშაოებზე შეთავაზებების გაგზავნა' : 'Start bidding on jobs to grow your business')
                }
              </p>
              <Link
                href="/browse/jobs"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200"
                style={{ backgroundColor: ACCENT }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ACCENT_HOVER}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ACCENT}
              >
                <Briefcase className="w-5 h-5" />
                {locale === 'ka' ? 'სამუშაოების ნახვა' : 'Browse Jobs'}
              </Link>
            </div>
          )}

          {/* Pagination */}
          {pagination.hasMore && (
            <div className="p-4 border-t border-[var(--color-border-primary)] text-center">
              <button
                onClick={() => fetchProposals(pagination.page + 1)}
                className="inline-flex items-center gap-2 px-4 py-2 font-medium transition-all duration-200 hover:opacity-80"
                style={{ color: ACCENT }}
              >
                {locale === 'ka' ? 'მეტის ჩატვირთვა' : 'Load More'}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
