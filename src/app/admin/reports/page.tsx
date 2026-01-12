'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import Select from '@/components/common/Select';
import { api } from '@/lib/api';
import {
  Flag,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  MoreVertical,
  Eye,
  MessageCircle,
  User,
  Briefcase,
  CreditCard,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Archive,
  Trash2,
} from 'lucide-react';
import { formatDateShort } from '@/utils/dateUtils';
import { ADMIN_THEME as THEME } from '@/constants/theme';
import { getAdminReportStatusColor, getAdminReportStatusLabel } from '@/utils/statusUtils';

// Support ticket structure (fallback data source)
interface SupportTicket {
  _id: string;
  category?: string;
  subject?: string;
  messages?: Array<{ content: string }>;
  status: string;
  priority?: string;
  userId?: { _id: string; name: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
}

interface Report {
  _id: string;
  type: 'user' | 'job' | 'order' | 'payment';
  reason: string;
  description?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reporterId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  reportedId?: {
    _id: string;
    name?: string;
    title?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface ReportStats {
  total: number;
  pending: number;
  investigating: number;
  resolved: number;
  dismissed: number;
  urgent: number;
}

function AdminReportsPageContent() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionMenuReport, setActionMenuReport] = useState<string | null>(null);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);

      // Try to fetch paginated reports
      let reportsData: Report[] = [];
      let totalPagesData = 1;
      let statsData: ReportStats = { total: 0, pending: 0, investigating: 0, resolved: 0, dismissed: 0, urgent: 0 };

      try {
        const [reportsRes, statsRes] = await Promise.all([
          api.get(`/admin/reports?${params.toString()}`),
          api.ge`/admin/report-stats`,
        ]);
        console.log('Reports API response:', reportsRes.data);
        console.log('Report stats response:', statsRes.data);
        reportsData = reportsRes.data.reports || [];
        totalPagesData = reportsRes.data.totalPages || 1;
        statsData = statsRes.data;
      } catch (err) {
        const apiErr = err as { response?: { status?: number; data?: unknown }; message?: string };
        console.error('Failed to fetch /admin/reports:', apiErr.response?.status, apiErr.response?.data || apiErr.message);
        // Fallback: use support tickets endpoint
        try {
          const ticketsRes = await api.ge`/support/admin/tickets`;
          console.log('Fallback to support tickets:', ticketsRes.data);
          // Transform tickets to report format
          const tickets = ticketsRes.data || [];
          reportsData = tickets.map((ticket: SupportTicket) => ({
            _id: ticket._id,
            type: ticket.category || 'user',
            reason: ticket.subject,
            description: ticket.messages?.[0]?.content || '',
            status: ticket.status === 'open' ? 'pending' : ticket.status === 'in_progress' ? 'investigating' : ticket.status === 'resolved' ? 'resolved' : 'dismissed',
            priority: ticket.priority || 'medium',
            reporterId: ticket.userId,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
          }));
          // Get stats from dashboard stats
          const dashboardStats = await api.ge`/admin/stats`.catch(() => ({ data: { support: {} } }));
          statsData = {
            total: dashboardStats.data.support?.total || tickets.length,
            pending: dashboardStats.data.support?.open || 0,
            investigating: dashboardStats.data.support?.inProgress || 0,
            resolved: dashboardStats.data.support?.resolved || 0,
            dismissed: 0,
            urgent: dashboardStats.data.support?.unread || 0,
          };
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
        }
      }

      setReports(reportsData);
      setTotalPages(totalPagesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  const getStatusColor = (status: string) => getAdminReportStatusColor(status);
  const getStatusLabel = (status: string) => getAdminReportStatusLabel(status, locale as 'en' | 'ka' | 'ru');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'investigating': return ShieldAlert;
      case 'resolved': return CheckCircle;
      case 'dismissed': return XCircle;
      default: return Flag;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return THEME.error;
      case 'high': return '#F97316';
      case 'medium': return THEME.warning;
      case 'low': return THEME.textDim;
      default: return THEME.textDim;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return t('admin.urgent');
      case 'high': return t('admin.high');
      case 'medium': return t('admin.medium');
      case 'low': return t('admin.low');
      default: return priority;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return User;
      case 'job': return Briefcase;
      case 'order': return MessageCircle;
      case 'payment': return CreditCard;
      default: return Flag;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'user': return t('admin.user');
      case 'job': return t('admin.job');
      case 'order': return t('admin.order');
      case 'payment': return t('admin.payment');
      default: return type;
    }
  };

  const statCards = [
    { label: t('admin.totalReports'), value: stats?.total || 0, icon: Flag, color: THEME.primary },
    { label: t('common.pending'), value: stats?.pending || 0, icon: Clock, color: THEME.warning },
    { label: t('admin.resolved'), value: stats?.resolved || 0, icon: CheckCircle, color: THEME.success },
    { label: locale === 'ka' ? 'გადაუდებელი' : 'Urgent', value: stats?.urgent || 0, icon: AlertTriangle, color: THEME.error },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: THEME.surface }}>
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto animate-pulse"
            style={{ background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})` }}
          >
            <Flag className="w-8 h-8 text-white" />
          </div>
          <p className="mt-4 text-sm" style={{ color: THEME.textMuted }}>
            {t('admin.loadingReports')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: THEME.surface }}>
      {/* Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: `${THEME.surface}E6`,
          borderBottom: `1px solid ${THEME.border}`,
        }}
      >
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ArrowLeft className="w-5 h-5" style={{ color: THEME.textMuted }} />
              </button>
              <div>
                <h1
                  className="text-xl font-semibold tracking-tight"
                  style={{ color: THEME.text, fontFamily: "'Inter', sans-serif" }}
                >
                  {t('admin.reportManagement')}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: THEME.textMuted }}>
                  {stats?.total.toLocaleString() || 0} {t('admin.reportsTotal')}
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
                color: 'white',
                boxShadow: `0 4px 16px ${THEME.primary}40`,
              }}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('admin.refresh')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]"
              style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `radial-gradient(circle at top right, ${stat.color}10, transparent 70%)` }}
              />
              <div className="relative flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}20` }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div>
                  <p
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: THEME.text, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm" style={{ color: THEME.textMuted }}>{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: THEME.textDim }} />
              <input
                type="text"
                placeholder={t('admin.searchReports')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{
                  background: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  color: THEME.text,
                }}
              />
            </div>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              size="sm"
              options={[
                { value: 'all', label: t('admin.allTypes') },
                { value: 'user', label: locale === 'ka' ? 'მომხმარებელი' : 'User' },
                { value: 'job', label: locale === 'ka' ? 'სამუშაო' : 'Job' },
                { value: 'order', label: locale === 'ka' ? 'შეკვეთა' : 'Order' },
                { value: 'payment', label: locale === 'ka' ? 'გადახდა' : 'Payment' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              size="sm"
              options={[
                { value: 'all', label: t('admin.allStatus') },
                { value: 'pending', label: locale === 'ka' ? 'მოლოდინში' : 'Pending' },
                { value: 'investigating', label: t('admin.investigating') },
                { value: 'resolved', label: locale === 'ka' ? 'გადაჭრილი' : 'Resolved' },
                { value: 'dismissed', label: t('admin.dismissed') },
              ]}
            />
          </div>
        </div>

        {/* Reports Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
        >
          {/* Table Header */}
          <div
            className="px-6 py-4 grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider"
            style={{ borderBottom: `1px solid ${THEME.border}`, color: THEME.textDim }}
          >
            <div className="col-span-3">{t('admin.report')}</div>
            <div className="col-span-2">{t('common.type')}</div>
            <div className="col-span-2">{t('admin.reporter')}</div>
            <div className="col-span-2 hidden lg:block">{t('common.status')}</div>
            <div className="col-span-1 hidden md:block">{t('common.priority')}</div>
            <div className="col-span-2 text-right">{t('admin.actions')}</div>
          </div>

          {/* Table Body */}
          {reports.length === 0 ? (
            <div className="p-12 text-center">
              <Flag className="w-16 h-16 mx-auto mb-4" style={{ color: THEME.textDim }} />
              <p className="text-lg font-medium" style={{ color: THEME.textMuted }}>
                {t('admin.noReportsFound')}
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.textDim }}>
                {t('admin.noReportsHaveBeenSubmitted')}
              </p>
            </div>
          ) : (
            reports.map((report, index) => {
              const StatusIcon = getStatusIcon(report.status);
              const TypeIcon = getTypeIcon(report.type);
              return (
                <div
                  key={report._id}
                  className="px-6 py-4 grid grid-cols-12 gap-4 items-center transition-colors cursor-pointer"
                  style={{
                    borderBottom: index < reports.length - 1 ? `1px solid ${THEME.border}` : 'none',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Report Info */}
                  <div className="col-span-3 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: THEME.text }}>
                      {report.reason}
                    </p>
                    {report.description && (
                      <p className="text-xs mt-1 truncate" style={{ color: THEME.textDim }}>
                        {report.description}
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: THEME.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatDateShort(report.createdAt, locale as 'en' | 'ka' | 'ru')}
                    </p>
                  </div>

                  {/* Type */}
                  <div className="col-span-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: `${THEME.info}20`,
                        color: THEME.info,
                      }}
                    >
                      <TypeIcon className="w-3 h-3" />
                      {getTypeLabel(report.type)}
                    </span>
                  </div>

                  {/* Reporter */}
                  <div className="col-span-2 flex items-center gap-2">
                    <Avatar src={report.reporterId?.avatar} name={report.reporterId?.name || 'User'} size="sm" />
                    <span className="text-sm truncate" style={{ color: THEME.textMuted }}>
                      {report.reporterId?.name || 'Anonymous'}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 hidden lg:block">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: `${getStatusColor(report.status)}20`,
                        color: getStatusColor(report.status),
                      }}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {getStatusLabel(report.status)}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="col-span-1 hidden md:block">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: `${getPriorityColor(report.priority)}20`,
                        color: getPriorityColor(report.priority),
                      }}
                    >
                      {getPriorityLabel(report.priority)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: `${THEME.info}20` }}
                      title={t('admin.viewDetails')}
                    >
                      <Eye className="w-4 h-4" style={{ color: THEME.info }} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuReport(actionMenuReport === report._id ? null : report._id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: THEME.surface }}
                      >
                        <MoreVertical className="w-4 h-4" style={{ color: THEME.textMuted }} />
                      </button>
                      {actionMenuReport === report._id && (
                        <div
                          className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden shadow-xl z-10"
                          style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
                        >
                          <button
                            className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors"
                            style={{ color: THEME.text }}
                            onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            onClick={() => setActionMenuReport(null)}
                          >
                            <Eye className="w-4 h-4" style={{ color: THEME.info }} />
                            {t('admin.viewDetails')}
                          </button>
                          {report.status === 'pending' && (
                            <button
                              className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors"
                              style={{ color: THEME.info }}
                              onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              onClick={() => setActionMenuReport(null)}
                            >
                              <ShieldAlert className="w-4 h-4" />
                              {t('admin.startInvestigation')}
                            </button>
                          )}
                          <button
                            className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors"
                            style={{ color: THEME.success }}
                            onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            onClick={() => setActionMenuReport(null)}
                          >
                            <CheckCircle className="w-4 h-4" />
                            {t('admin.markResolved')}
                          </button>
                          <div style={{ borderTop: `1px solid ${THEME.border}` }} />
                          <button
                            className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors"
                            style={{ color: THEME.textDim }}
                            onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            onClick={() => setActionMenuReport(null)}
                          >
                            <Archive className="w-4 h-4" />
                            {t('admin.dismiss')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm" style={{ color: THEME.textMuted }}>
              {locale === 'ka' ? `გვერდი ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ChevronLeft className="w-5 h-5" style={{ color: THEME.textMuted }} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: THEME.textMuted }} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Click outside to close menu */}
      {actionMenuReport && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuReport(null)}
        />
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AdminReportsPageContent />
    </AuthGuard>
  );
}
