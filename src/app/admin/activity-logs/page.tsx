'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AuthGuard from '@/components/common/AuthGuard';
import { api } from '@/lib/api';
import {
  Activity,
  Search,
  ArrowLeft,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Filter,
  Clock,
  UserPlus,
  LogIn,
  LogOut,
  UserMinus,
  Edit3,
  Star,
  Shield,
  Trash2,
  Eye,
  FileText,
  AlertCircle,
} from 'lucide-react';

// Terracotta admin theme (matching dashboard)
const THEME = {
  primary: '#C4735B',
  primaryDark: '#A85D4A',
  accent: '#D4897A',
  surface: '#1A1A1C',
  surfaceLight: '#232326',
  surfaceHover: '#2A2A2E',
  border: '#333338',
  borderLight: '#3D3D42',
  text: '#FAFAFA',
  textMuted: '#A1A1AA',
  textDim: '#71717A',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

interface ActivityLog {
  _id: string;
  type: string;
  userId: string;
  userEmail: string;
  userName: string;
  targetId?: string;
  targetType?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  createdAt: string;
}

interface ActivityStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  byType: { _id: string; count: number }[];
}

const ACTIVITY_ICONS: Record<string, any> = {
  'user.register': UserPlus,
  'user.login': LogIn,
  'user.logout': LogOut,
  'user.delete': UserMinus,
  'user.update': Edit3,
  'user.upgrade_to_pro': Star,
  'user.verification_submit': Shield,
  'user.verification_approved': Shield,
  'user.verification_rejected': Shield,
  'profile.update': Edit3,
  'profile.deactivate': AlertCircle,
  'profile.reactivate': Activity,
  'job.create': FileText,
  'job.update': Edit3,
  'job.delete': Trash2,
  'proposal.create': FileText,
  'proposal.accept': Activity,
  'proposal.reject': AlertCircle,
};

const ACTIVITY_COLORS: Record<string, string> = {
  'user.register': THEME.success,
  'user.login': THEME.info,
  'user.logout': THEME.textMuted,
  'user.delete': THEME.error,
  'user.update': THEME.warning,
  'user.upgrade_to_pro': THEME.primary,
  'user.verification_submit': THEME.warning,
  'user.verification_approved': THEME.success,
  'user.verification_rejected': THEME.error,
  'profile.update': THEME.info,
  'profile.deactivate': THEME.warning,
  'profile.reactivate': THEME.success,
  'job.create': THEME.success,
  'job.update': THEME.warning,
  'job.delete': THEME.error,
  'proposal.create': THEME.info,
  'proposal.accept': THEME.success,
  'proposal.reject': THEME.error,
};

function AdminActivityLogsPageContent() {
  const { isAuthenticated } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '30');
      if (searchQuery) params.set('userEmail', searchQuery);
      if (typeFilter !== 'all') params.set('type', typeFilter);

      const [logsRes, statsRes, typesRes] = await Promise.all([
        api.get(`/admin/activity-logs?${params.toString()}`),
        api.get('/admin/activity-stats'),
        api.get('/admin/activity-types'),
      ]);

      setLogs(logsRes.data.logs || []);
      setTotalPages(logsRes.data.pages || 1);
      setTotal(logsRes.data.total || 0);
      setStats(statsRes.data);
      setActivityTypes(typesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, searchQuery, typeFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatActivityType = (type: string) => {
    return type.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getActivityIcon = (type: string) => {
    return ACTIVITY_ICONS[type] || Activity;
  };

  const getActivityColor = (type: string) => {
    return ACTIVITY_COLORS[type] || THEME.textMuted;
  };

  const statCards = [
    { label: locale === 'ka' ? 'დღეს' : 'Today', value: stats?.today || 0, icon: Clock, color: THEME.success },
    { label: locale === 'ka' ? 'ამ კვირაში' : 'This Week', value: stats?.thisWeek || 0, icon: Calendar, color: THEME.info },
    { label: locale === 'ka' ? 'ამ თვეში' : 'This Month', value: stats?.thisMonth || 0, icon: Activity, color: THEME.primary },
    { label: locale === 'ka' ? 'სულ ჩანაწერები' : 'Total Logs', value: total, icon: FileText, color: THEME.warning },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: THEME.surface }}>
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto animate-pulse"
            style={{ background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})` }}
          >
            <Activity className="w-8 h-8 text-white" />
          </div>
          <p className="mt-4 text-sm" style={{ color: THEME.textMuted }}>
            {locale === 'ka' ? 'იტვირთება...' : 'Loading activity logs...'}
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
                  {locale === 'ka' ? 'აქტივობის ლოგები' : 'Activity Logs'}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: THEME.textMuted }}>
                  {total.toLocaleString()} {locale === 'ka' ? 'ჩანაწერი' : 'records'}
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
              <span className="hidden sm:inline">{locale === 'ka' ? 'განახლება' : 'Refresh'}</span>
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
                placeholder={locale === 'ka' ? 'ძებნა ემაილით...' : 'Search by email...'}
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
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 rounded-xl text-sm cursor-pointer focus:outline-none transition-all min-w-[200px]"
              style={{
                background: THEME.surface,
                border: `1px solid ${THEME.border}`,
                color: THEME.text,
              }}
            >
              <option value="all">{locale === 'ka' ? 'ყველა ტიპი' : 'All Types'}</option>
              {activityTypes.map((type) => (
                <option key={type} value={type}>{formatActivityType(type)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Activity Logs Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
        >
          {/* Table Header */}
          <div
            className="px-6 py-4 grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider"
            style={{ borderBottom: `1px solid ${THEME.border}`, color: THEME.textDim }}
          >
            <div className="col-span-3">{locale === 'ka' ? 'მოქმედება' : 'Action'}</div>
            <div className="col-span-3">{locale === 'ka' ? 'მომხმარებელი' : 'User'}</div>
            <div className="col-span-3 hidden lg:block">{locale === 'ka' ? 'დეტალები' : 'Details'}</div>
            <div className="col-span-3 text-right">{locale === 'ka' ? 'დრო' : 'Time'}</div>
          </div>

          {/* Table Body */}
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-16 h-16 mx-auto mb-4" style={{ color: THEME.textDim }} />
              <p className="text-lg font-medium" style={{ color: THEME.textMuted }}>
                {locale === 'ka' ? 'ლოგები არ მოიძებნა' : 'No logs found'}
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.textDim }}>
                {locale === 'ka' ? 'სცადეთ სხვა ფილტრი' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            logs.map((log, index) => {
              const Icon = getActivityIcon(log.type);
              const color = getActivityColor(log.type);

              return (
                <div
                  key={log._id}
                  className="px-6 py-4 grid grid-cols-12 gap-4 items-center transition-colors cursor-pointer"
                  style={{
                    borderBottom: index < logs.length - 1 ? `1px solid ${THEME.border}` : 'none',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setSelectedLog(log)}
                >
                  {/* Action */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: THEME.text }}
                    >
                      {formatActivityType(log.type)}
                    </span>
                  </div>

                  {/* User */}
                  <div className="col-span-3">
                    <p className="text-sm font-medium truncate" style={{ color: THEME.text }}>
                      {log.userName || 'Unknown'}
                    </p>
                    <p className="text-xs truncate" style={{ color: THEME.textDim }}>
                      {log.userEmail || log.userId}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="col-span-3 hidden lg:block">
                    {log.details && Object.keys(log.details).length > 0 ? (
                      <p className="text-xs truncate" style={{ color: THEME.textMuted }}>
                        {Object.entries(log.details)
                          .filter(([key]) => !key.startsWith('full'))
                          .slice(0, 2)
                          .map(([key, value]) => `${key}: ${typeof value === 'object' ? '...' : value}`)
                          .join(', ')}
                      </p>
                    ) : (
                      <span className="text-xs" style={{ color: THEME.textDim }}>-</span>
                    )}
                  </div>

                  {/* Time */}
                  <div className="col-span-3 text-right">
                    <p
                      className="text-sm"
                      style={{ color: THEME.textMuted, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {formatDate(log.timestamp || log.createdAt)}
                    </p>
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

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
              style={{ background: THEME.surfaceLight, borderBottom: `1px solid ${THEME.border}` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${getActivityColor(selectedLog.type)}20` }}
                >
                  {(() => {
                    const Icon = getActivityIcon(selectedLog.type);
                    return <Icon className="w-6 h-6" style={{ color: getActivityColor(selectedLog.type) }} />;
                  })()}
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: THEME.text }}>
                    {formatActivityType(selectedLog.type)}
                  </h3>
                  <p className="text-sm" style={{ color: THEME.textMuted }}>
                    {formatDate(selectedLog.timestamp || selectedLog.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{ background: THEME.surface }}
              >
                <span style={{ color: THEME.textMuted }}>×</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: THEME.text }}>
                  <User className="w-4 h-4" style={{ color: THEME.primary }} />
                  {locale === 'ka' ? 'მომხმარებელი' : 'User'}
                </h4>
                <div
                  className="rounded-xl p-4"
                  style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs" style={{ color: THEME.textDim }}>
                        {locale === 'ka' ? 'სახელი' : 'Name'}
                      </p>
                      <p className="text-sm font-medium" style={{ color: THEME.text }}>
                        {selectedLog.userName || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: THEME.textDim }}>
                        {locale === 'ka' ? 'ემაილი' : 'Email'}
                      </p>
                      <p className="text-sm font-medium" style={{ color: THEME.text }}>
                        {selectedLog.userEmail || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: THEME.textDim }}>
                        {locale === 'ka' ? 'მომხმარებლის ID' : 'User ID'}
                      </p>
                      <p className="text-xs font-mono" style={{ color: THEME.textMuted }}>
                        {selectedLog.userId}
                      </p>
                    </div>
                    {selectedLog.ip && (
                      <div>
                        <p className="text-xs" style={{ color: THEME.textDim }}>IP</p>
                        <p className="text-sm font-mono" style={{ color: THEME.textMuted }}>
                          {selectedLog.ip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: THEME.text }}>
                    <FileText className="w-4 h-4" style={{ color: THEME.primary }} />
                    {locale === 'ka' ? 'დეტალები' : 'Details'}
                  </h4>
                  <div
                    className="rounded-xl p-4 overflow-x-auto"
                    style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                  >
                    <pre
                      className="text-xs whitespace-pre-wrap"
                      style={{ color: THEME.textMuted, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div>
                  <h4 className="text-sm font-medium mb-3" style={{ color: THEME.text }}>
                    {locale === 'ka' ? 'მოწყობილობა' : 'User Agent'}
                  </h4>
                  <p className="text-xs break-all" style={{ color: THEME.textDim }}>
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminActivityLogsPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AdminActivityLogsPageContent />
    </AuthGuard>
  );
}
