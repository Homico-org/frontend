'use client';

import AuthGuard from '@/components/common/AuthGuard';
import { Button } from '@/components/ui/button';
import { ADMIN_THEME as THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { formatDateTimeShort } from '@/utils/dateUtils';
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface QuoteRequest {
  id: string;
  _id?: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  serviceType: string;
  description?: string;
  preferredPlan: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  createdAt: string;
}

interface QuoteStats {
  total: number;
  new: number;
  contacted: number;
  converted: number;
  closed: number;
}

type StatusFilter = 'all' | 'new' | 'contacted' | 'converted' | 'closed';

function getQuoteStatusColor(status: string): string {
  switch (status) {
    case 'new': return '#3B82F6';
    case 'contacted': return '#F59E0B';
    case 'converted': return '#22C55E';
    case 'closed': return '#71717A';
    default: return '#71717A';
  }
}

function AdminBusinessQuotesContent() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();
  const toast = useToast();
  const router = useRouter();

  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [stats, setStats] = useState<QuoteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasLoadedRef = useRef(false);

  const getQuoteId = (q: QuoteRequest) => q.id || q._id || '';

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh || hasLoadedRef.current) setIsRefreshing(true);
      else setIsLoading(true);

      const [quotesRes, statsRes] = await Promise.all([
        api.get('/business/quote-requests'),
        api.get('/business/quote-requests/stats'),
      ]);

      setQuotes(quotesRes.data || []);
      setStats(statsRes.data || { total: 0, new: 0, contacted: 0, converted: 0, closed: 0 });
    } catch {
      toast.error(t('admin.failedToLoadQuotes'));
    } finally {
      hasLoadedRef.current = true;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t, toast]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  const filteredQuotes = statusFilter === 'all'
    ? quotes
    : quotes.filter(q => q.status === statusFilter);

  const handleStatusChange = async (quote: QuoteRequest, newStatus: string) => {
    setIsUpdating(true);
    try {
      await api.patch(`/business/quote-requests/${getQuoteId(quote)}/status`, { status: newStatus });
      toast.success(t('admin.quoteStatusUpdated'));
      fetchData(true);
      setShowDetailModal(false);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedQuote) return;
    setIsDeleting(true);
    try {
      await api.delete(`/business/quote-requests/${getQuoteId(selectedQuote)}`);
      toast.success(t('admin.quoteDeleted'));
      setShowDeleteModal(false);
      setShowDetailModal(false);
      fetchData(true);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return t('admin.quoteNew');
      case 'contacted': return t('admin.quoteContacted');
      case 'converted': return t('admin.quoteConverted');
      case 'closed': return t('admin.quoteClosed');
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return MessageSquare;
      case 'contacted': return Clock;
      case 'converted': return CheckCircle;
      case 'closed': return XCircle;
      default: return MessageSquare;
    }
  };

  const getServiceLabel = (type: string) => {
    const key = `business.serviceType${type.charAt(0).toUpperCase() + type.slice(1)}`;
    return t(key) || type;
  };

  const getPlanLabel = (plan: string) => {
    const map: Record<string, string> = {
      on_demand: t('business.planOnDemand'),
      standard: t('business.planStandard'),
      business: t('business.planBusiness'),
      not_sure: t('business.planNotSure'),
    };
    return map[plan] || plan;
  };

  const statCards = [
    { key: 'all' as const, label: t('admin.quotesTotal'), value: stats?.total || 0, icon: Building2, color: THEME.primary },
    { key: 'new' as const, label: t('admin.quoteNew'), value: stats?.new || 0, icon: MessageSquare, color: '#3B82F6' },
    { key: 'contacted' as const, label: t('admin.quoteContacted'), value: stats?.contacted || 0, icon: Clock, color: THEME.warning },
    { key: 'converted' as const, label: t('admin.quoteConverted'), value: stats?.converted || 0, icon: CheckCircle, color: THEME.success },
    { key: 'closed' as const, label: t('admin.quoteClosed'), value: stats?.closed || 0, icon: XCircle, color: THEME.textDim },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: THEME.surface }}>
        <div className="text-center">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto animate-pulse"
            style={{ background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})` }}
          >
            <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <p className="mt-4 text-sm" style={{ color: THEME.textMuted }}>
            {t('admin.loadingQuotes')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: THEME.surface }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: `${THEME.surface}E6`, borderBottom: `1px solid ${THEME.border}` }}
      >
        <div className="max-w-[1800px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => router.push('/admin')}
                className="shrink-0 w-9 h-9 sm:w-10 sm:h-10"
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: THEME.textMuted }} />
              </Button>
              <div className="min-w-0">
                <h1
                  className="text-base sm:text-xl font-semibold tracking-tight truncate"
                  style={{ color: THEME.text }}
                >
                  {t('admin.quoteManagement')}
                </h1>
                <p className="text-xs sm:text-sm hidden sm:block" style={{ color: THEME.textMuted }}>
                  {stats?.total || 0} {t('admin.quotesTotal').toLowerCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden w-9 h-9"
                style={{
                  background: showFilters ? `${THEME.primary}20` : THEME.surfaceLight,
                  border: `1px solid ${showFilters ? THEME.primary : THEME.border}`,
                }}
              >
                <Filter className="w-4 h-4" style={{ color: showFilters ? THEME.primary : THEME.textMuted }} />
              </Button>
              <Button
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                loading={isRefreshing}
                size="sm"
                className="h-9 px-3 sm:px-4"
                style={{
                  background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
                  boxShadow: `0 4px 16px ${THEME.primary}40`,
                }}
              >
                {!isRefreshing && <RefreshCw className="w-4 h-4 sm:mr-2" />}
                <span className="hidden sm:inline">{t('admin.refresh')}</span>
              </Button>
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t sm:hidden" style={{ borderColor: THEME.border }}>
              <div className="flex flex-wrap gap-2">
                {statCards.map((stat) => (
                  <button
                    key={stat.key}
                    onClick={() => setStatusFilter(prev => prev === stat.key ? 'all' : stat.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: statusFilter === stat.key ? `${stat.color}20` : THEME.surfaceLight,
                      color: statusFilter === stat.key ? stat.color : THEME.textMuted,
                      border: `1px solid ${statusFilter === stat.key ? stat.color : THEME.border}`,
                    }}
                  >
                    <stat.icon className="w-3 h-3" />
                    {stat.label}
                    <span className="font-bold">{stat.value}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Stats Grid — Desktop */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {statCards.map((stat) => (
            <button
              key={stat.key}
              type="button"
              onClick={() => setStatusFilter(prev => prev === stat.key ? 'all' : stat.key)}
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left"
              style={{
                background: THEME.surfaceLight,
                border: statusFilter === stat.key ? `1px solid ${stat.color}80` : `1px solid ${THEME.border}`,
                boxShadow: statusFilter === stat.key ? `0 8px 32px ${stat.color}20` : undefined,
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `radial-gradient(circle at top right, ${stat.color}10, transparent 70%)` }}
              />
              {statusFilter === stat.key && (
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${stat.color}10, transparent 60%)` }} />
              )}
              <div className="relative flex items-center gap-3 sm:gap-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}20` }}
                >
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: stat.color }} />
                </div>
                <div>
                  <p
                    className="text-xl sm:text-2xl font-bold tracking-tight"
                    style={{ color: THEME.text, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm" style={{ color: THEME.textMuted }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Mobile Stats Summary */}
        <div className="sm:hidden flex items-center justify-between mb-4 px-1">
          <p className="text-sm font-medium" style={{ color: THEME.text }}>
            {stats?.total || 0} {t('admin.quotesTotal').toLowerCase()}
          </p>
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{ background: `${THEME.primary}20`, color: THEME.primary }}
            >
              <X className="w-3 h-3" />
              {t('common.clear')}
            </button>
          )}
        </div>

        {/* Quotes List */}
        <div
          className="rounded-xl sm:rounded-2xl overflow-hidden"
          style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
        >
          {/* Table Header — Desktop */}
          <div
            className="hidden md:grid px-4 sm:px-6 py-3 sm:py-4 grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider"
            style={{ borderBottom: `1px solid ${THEME.border}`, color: THEME.textDim }}
          >
            <div className="col-span-3">{t('admin.quoteCompany')}</div>
            <div className="col-span-2">{t('admin.quoteContact')}</div>
            <div className="col-span-2">{t('admin.quoteService')}</div>
            <div className="col-span-2">{t('common.status')}</div>
            <div className="col-span-2">{t('admin.quoteSubmitted')}</div>
            <div className="col-span-1 text-right">{t('admin.actions')}</div>
          </div>

          {filteredQuotes.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Building2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: THEME.textDim }} />
              <p className="text-base sm:text-lg font-medium" style={{ color: THEME.textMuted }}>
                {t('admin.noQuotesFound')}
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.textDim }}>
                {t('admin.noQuotesYet')}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y" style={{ borderColor: THEME.border }}>
                {filteredQuotes.map((quote, index) => {
                  const StatusIcon = getStatusIcon(quote.status);
                  return (
                    <div
                      key={getQuoteId(quote) || index}
                      className="p-4 active:bg-opacity-50 transition-colors cursor-pointer"
                      onClick={() => { setSelectedQuote(quote); setShowDetailModal(true); }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${getQuoteStatusColor(quote.status)}20` }}
                        >
                          <StatusIcon className="w-5 h-5" style={{ color: getQuoteStatusColor(quote.status) }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" style={{ color: THEME.text }}>
                            {quote.companyName}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: THEME.textDim }}>
                            {quote.contactName} · {getServiceLabel(quote.serviceType)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                              style={{ background: `${getQuoteStatusColor(quote.status)}20`, color: getQuoteStatusColor(quote.status) }}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {getStatusLabel(quote.status)}
                            </span>
                            <span className="text-xs" style={{ color: THEME.textDim }}>
                              {getPlanLabel(quote.preferredPlan)}
                            </span>
                          </div>
                        </div>
                        <p
                          className="text-[10px] whitespace-nowrap"
                          style={{ color: THEME.textDim, fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {formatDateTimeShort(quote.createdAt, locale as 'en' | 'ka' | 'ru')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                {filteredQuotes.map((quote, index) => {
                  const StatusIcon = getStatusIcon(quote.status);
                  return (
                    <div
                      key={getQuoteId(quote) || index}
                      className="px-4 sm:px-6 py-3 sm:py-4 grid grid-cols-12 gap-4 items-center transition-colors cursor-pointer"
                      style={{ borderBottom: index < filteredQuotes.length - 1 ? `1px solid ${THEME.border}` : 'none' }}
                      onClick={() => { setSelectedQuote(quote); setShowDetailModal(true); }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surfaceHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="col-span-3 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: THEME.text }}>
                          {quote.companyName}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: THEME.textDim }}>
                          {quote.email}
                        </p>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <p className="text-sm truncate" style={{ color: THEME.text }}>
                          {quote.contactName}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: THEME.textDim }}>
                          {quote.phone}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm" style={{ color: THEME.text }}>
                          {getServiceLabel(quote.serviceType)}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: THEME.textDim }}>
                          {getPlanLabel(quote.preferredPlan)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{ background: `${getQuoteStatusColor(quote.status)}20`, color: getQuoteStatusColor(quote.status) }}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {getStatusLabel(quote.status)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <p
                          className="text-xs"
                          style={{ color: THEME.textDim, fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {formatDateTimeShort(quote.createdAt, locale as 'en' | 'ka' | 'ru')}
                        </p>
                      </div>
                      <div className="col-span-1 flex justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedQuote(quote);
                            setShowDeleteModal(true);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform active:scale-90"
                          style={{ background: `${THEME.error}20` }}
                        >
                          <Trash2 className="w-4 h-4" style={{ color: THEME.error }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ background: THEME.surfaceLight, borderBottom: `1px solid ${THEME.border}` }}>
              <h2 className="text-lg font-semibold" style={{ color: THEME.text }}>
                {t('admin.quoteDetails')}
              </h2>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8"
                style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
              >
                <X className="w-4 h-4" style={{ color: THEME.textMuted }} />
              </Button>
            </div>

            <div className="p-5 space-y-5">
              {/* Company & Contact */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: THEME.textDim }}>
                    {t('admin.quoteCompany')}
                  </p>
                  <p className="text-base font-semibold" style={{ color: THEME.text }}>
                    {selectedQuote.companyName}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: THEME.textDim }}>
                      {t('admin.quoteContact')}
                    </p>
                    <p className="text-sm" style={{ color: THEME.text }}>{selectedQuote.contactName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: THEME.textDim }}>
                      {t('admin.quoteSubmitted')}
                    </p>
                    <p className="text-sm" style={{ color: THEME.text, fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatDateTimeShort(selectedQuote.createdAt, locale as 'en' | 'ka' | 'ru')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div
                className="flex flex-col gap-2 p-3 rounded-xl"
                style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
              >
                <a
                  href={`mailto:${selectedQuote.email}`}
                  className="flex items-center gap-2.5 text-sm hover:opacity-80 transition-opacity"
                  style={{ color: THEME.primary }}
                >
                  <Mail className="w-4 h-4" />
                  {selectedQuote.email}
                </a>
                <a
                  href={`tel:${selectedQuote.phone}`}
                  className="flex items-center gap-2.5 text-sm hover:opacity-80 transition-opacity"
                  style={{ color: THEME.primary }}
                >
                  <Phone className="w-4 h-4" />
                  {selectedQuote.phone}
                </a>
              </div>

              {/* Service & Plan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: THEME.textDim }}>
                    {t('admin.quoteService')}
                  </p>
                  <p className="text-sm font-medium" style={{ color: THEME.text }}>
                    {getServiceLabel(selectedQuote.serviceType)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: THEME.textDim }}>
                    {t('admin.quotePlan')}
                  </p>
                  <p className="text-sm font-medium" style={{ color: THEME.text }}>
                    {getPlanLabel(selectedQuote.preferredPlan)}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedQuote.description && (
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: THEME.textDim }}>
                    {t('common.description')}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: THEME.text }}>
                    {selectedQuote.description}
                  </p>
                </div>
              )}

              {/* Status & Actions */}
              <div
                className="p-4 rounded-xl space-y-3"
                style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
              >
                <p className="text-xs uppercase tracking-wider" style={{ color: THEME.textDim }}>
                  {t('admin.changeStatus')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(['new', 'contacted', 'converted', 'closed'] as const).map((status) => {
                    const isActive = selectedQuote.status === status;
                    const StatusIcon = getStatusIcon(status);
                    return (
                      <button
                        key={status}
                        onClick={() => !isActive && handleStatusChange(selectedQuote, status)}
                        disabled={isActive || isUpdating}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                        style={{
                          background: isActive ? `${getQuoteStatusColor(status)}20` : THEME.surfaceLight,
                          color: isActive ? getQuoteStatusColor(status) : THEME.textMuted,
                          border: `1px solid ${isActive ? getQuoteStatusColor(status) : THEME.border}`,
                        }}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {getStatusLabel(status)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => { setShowDeleteModal(true); }}
                className="flex items-center gap-2 text-sm w-full justify-center py-2.5 rounded-xl transition-colors"
                style={{ color: THEME.error, background: `${THEME.error}10`, border: `1px solid ${THEME.error}20` }}
              >
                <Trash2 className="w-4 h-4" />
                {t('admin.deleteQuote')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedQuote && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div
            className="relative w-full max-w-sm rounded-2xl p-6"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: `${THEME.error}20` }}
              >
                <Trash2 className="w-6 h-6" style={{ color: THEME.error }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: THEME.text }}>
                {t('admin.deleteQuote')}
              </h3>
              <p className="text-sm mb-6" style={{ color: THEME.textMuted }}>
                {t('admin.deleteQuoteConfirmation')}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowDeleteModal(false)}
                  style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  loading={isDeleting}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBusinessQuotesPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AdminBusinessQuotesContent />
    </AuthGuard>
  );
}
