'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { logApiError } from '@/utils/errorUtils';
import {
  Activity as ActivityIcon,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Building2,
  ChevronRight,
  FileText,
  Globe,
  Layers,
  MapPin,
  MessageCircle,
  PieChart,
  Radio,
  RefreshCw,
  Shield,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { formatTimeAgoCompact } from '@/utils/dateUtils';
import { ADMIN_THEME as THEME } from '@/constants/theme';
import { getAdminActivityColor } from '@/utils/statusUtils';

interface DashboardStats {
  users: {
    total: number;
    clients: number;
    pros: number;
    companies: number;
    admins: number;
    verifiedPros: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  jobs: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  proposals: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    acceptanceRate: number;
  };
  support: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    unread: number;
  };
}

interface ActivityData {
  name?: string;
  role?: string;
  title?: string;
  clientId?: { name?: string };
  proId?: { name?: string };
  userId?: { name?: string };
  [key: string]: unknown;
}

interface Activity {
  type: string;
  data: ActivityData;
  date: string;
}

interface CategoryData {
  _id: string;
  count: number;
}

interface DailyData {
  _id: string;
  count: number;
}

interface LocationData {
  _id: string;
  count: number;
}

function AdminDashboardPageContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLanguage();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [jobsByCategory, setJobsByCategory] = useState<CategoryData[]>([]);
  const [jobsByLocation, setJobsByLocation] = useState<LocationData[]>([]);
  const [dailySignups, setDailySignups] = useState<DailyData[]>([]);
  const [dailyJobs, setDailyJobs] = useState<DailyData[]>([]);
  const [dailyProposals, setDailyProposals] = useState<DailyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeChart, setActiveChart] = useState<'signups' | 'jobs' | 'proposals'>('signups');

  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const [
        statsRes,
        usersRes,
        jobsRes,
        activityRes,
        categoryRes,
        locationRes,
        signupsRes,
        dailyJobsRes,
        dailyProposalsRes,
      ] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/recent-users?limit=6'),
        api.get('/admin/recent-jobs?limit=6'),
        api.get('/admin/activity?limit=20'),
        api.get('/admin/jobs-by-category'),
        api.get('/admin/jobs-by-location'),
        api.get('/admin/daily-signups?days=14'),
        api.get('/admin/daily-jobs?days=14'),
        api.get('/admin/daily-proposals?days=14'),
      ]);

      setStats(statsRes.data);
      setRecentUsers(usersRes.data);
      setRecentJobs(jobsRes.data);
      setActivities(activityRes.data);
      setJobsByCategory(categoryRes.data);
      setJobsByLocation(locationRes.data);
      setDailySignups(signupsRes.data);
      setDailyJobs(dailyJobsRes.data);
      setDailyProposals(dailyProposalsRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      logApiError('Admin Dashboard', err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message = apiErr?.response?.data?.message || apiErr?.message || 'Failed to load dashboard data';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && !isRefreshing) {
        fetchDashboardData(true);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isRefreshing, fetchDashboardData]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return Users;
      case 'job_created': return Briefcase;
      case 'proposal_sent': return FileText;
      case 'ticket_created': return MessageCircle;
      default: return ActivityIcon;
    }
  };

  const getActivityColor = (type: string) => getAdminActivityColor(type);

  const getActivityMessage = (activity: Activity) => {
    switch (activity.type) {
      case 'user_signup':
        return { name: activity.data.name, action: t('admin.signedUp'), extra: activity.data.role };
      case 'job_created':
        return { name: activity.data.clientId?.name || 'Client', action: t('admin.posted'), extra: activity.data.title };
      case 'proposal_sent':
        return { name: activity.data.proId?.name || 'Pro', action: t('admin.sentProposal'), extra: '' };
      case 'ticket_created':
        return { name: activity.data.userId?.name || 'User', action: t('admin.openedTicket'), extra: '' };
      default:
        return { name: 'System', action: 'activity', extra: '' };
    }
  };

  const getChartData = () => {
    switch (activeChart) {
      case 'signups': return dailySignups;
      case 'jobs': return dailyJobs;
      case 'proposals': return dailyProposals;
    }
  };

  const getChartColor = () => {
    switch (activeChart) {
      case 'signups': return THEME.primary;
      case 'jobs': return THEME.info;
      case 'proposals': return THEME.warning;
    }
  };

  const chartData = getChartData();
  const maxChartValue = Math.max(...chartData.map(d => d.count), 1);
  const maxCategoryCount = Math.max(...jobsByCategory.map(c => c.count), 1);
  const maxLocationCount = Math.max(...jobsByLocation.map(l => l.count), 1);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: THEME.surface }}>
        <div className="text-center">
          <div className="relative inline-block">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center animate-pulse"
              style={{ background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})` }}
            >
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <div
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center animate-bounce"
              style={{ background: THEME.warning }}
            >
              <Zap className="w-4 h-4 text-black" />
            </div>
          </div>
          <p className="mt-6 text-sm" style={{ color: THEME.textMuted }}>
            {t('admin.loadingDashboard')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: THEME.surface }}>
        <div className="text-center max-w-md mx-auto px-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: `${THEME.error}20` }}
          >
            <AlertCircle className="w-10 h-10" style={{ color: THEME.error }} />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: THEME.text }}>
            {t('admin.errorLoadingDashboard')}
          </h2>
          <p className="text-sm mb-6" style={{ color: THEME.textMuted }}>
            {error}
          </p>
          <button
            onClick={() => fetchDashboardData()}
            className="px-6 py-3 rounded-xl text-white font-medium transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})` }}
          >
            {t('common.tryAgain')}
          </button>
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
              {/* Logo */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
                  boxShadow: `0 8px 32px ${THEME.primary}40`,
                }}
              >
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  className="text-xl font-semibold tracking-tight"
                  style={{ color: THEME.text, fontFamily: "'Inter', sans-serif" }}
                >
                  {t('admin.controlCenter')}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: THEME.success }} />
                  <span className="text-xs" style={{ color: THEME.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                    {lastUpdated ? formatTimeAgoCompact(lastUpdated.toISOString(), locale as 'en' | 'ka' | 'ru') : 'syncing...'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Stats Pills */}
              <div className="hidden lg:flex items-center gap-2">
                {stats?.support.unread && stats.support.unread > 0 && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full animate-pulse"
                    style={{ background: `${THEME.error}20`, border: `1px solid ${THEME.error}40` }}
                  >
                    <AlertCircle className="w-3.5 h-3.5" style={{ color: THEME.error }} />
                    <span className="text-xs font-medium" style={{ color: THEME.error }}>
                      {stats.support.unread} {t('admin.unread')}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <Link
                href="/browse"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                style={{
                  background: THEME.surfaceLight,
                  border: `1px solid ${THEME.border}`,
                  color: THEME.textMuted,
                }}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{t('admin.site')}</span>
              </Link>
              <button
                onClick={() => fetchDashboardData(true)}
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
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Quick Actions - Prominent at top */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: t('admin.users'), icon: Users, href: '/admin/users', color: THEME.primary, count: stats?.users.total },
            { label: t('admin.jobs'), icon: Briefcase, href: '/admin/jobs', color: THEME.info, count: stats?.jobs.total },
            { label: t('admin.support'), icon: MessageCircle, href: '/admin/support', color: THEME.warning, count: stats?.support.open, badge: stats?.support.unread },
            { label: t('admin.activityLogs'), icon: ActivityIcon, href: '/admin/activity-logs', color: THEME.success },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${THEME.surfaceLight}, ${THEME.surface})`,
                border: `1px solid ${THEME.border}`,
              }}
            >
              {/* Gradient overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(135deg, ${action.color}15, transparent 60%)` }}
              />

              {/* Badge for unread */}
              {action.badge && action.badge > 0 && (
                <div
                  className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse"
                  style={{ background: THEME.error, color: 'white' }}
                >
                  {action.badge}
                </div>
              )}

              <div className="relative flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{
                    background: `linear-gradient(135deg, ${action.color}, ${action.color}B0)`,
                    boxShadow: `0 4px 12px ${action.color}30`,
                  }}
                >
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm block" style={{ color: THEME.text }}>{action.label}</span>
                  {action.count !== undefined && (
                    <span
                      className="text-xs"
                      style={{ color: THEME.textMuted, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {action.count?.toLocaleString() || 0}
                    </span>
                  )}
                </div>
                <ArrowUpRight
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  style={{ color: action.color }}
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Users Card */}
          <div
            className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(circle at top right, ${THEME.primary}10, transparent 70%)` }}
            />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${THEME.primary}20` }}
                >
                  <Users className="w-6 h-6" style={{ color: THEME.primary }} />
                </div>
                {stats && stats.users.growth !== 0 && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      background: stats.users.growth > 0 ? `${THEME.success}20` : `${THEME.error}20`,
                      color: stats.users.growth > 0 ? THEME.success : THEME.error,
                    }}
                  >
                    {stats.users.growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(stats.users.growth)}%
                  </div>
                )}
              </div>
              <p
                className="text-4xl font-bold tracking-tight"
                style={{ color: THEME.text, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {stats?.users.total.toLocaleString() || '0'}
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.textMuted }}>
                {t('admin.totalUsers')}
              </p>
              <div
                className="flex items-center gap-4 mt-4 pt-4 text-xs"
                style={{ borderTop: `1px solid ${THEME.border}` }}
              >
                <span style={{ color: THEME.success }}>+{stats?.users.today || 0} {t('common.today')}</span>
                <span style={{ color: THEME.textDim }}>+{stats?.users.thisWeek || 0} {t('admin.week')}</span>
              </div>
            </div>
          </div>

          {/* Jobs Card */}
          <div
            className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(circle at top right, ${THEME.info}10, transparent 70%)` }}
            />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${THEME.info}20` }}
                >
                  <Briefcase className="w-6 h-6" style={{ color: THEME.info }} />
                </div>
                {stats && stats.jobs.growth !== 0 && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      background: stats.jobs.growth > 0 ? `${THEME.success}20` : `${THEME.error}20`,
                      color: stats.jobs.growth > 0 ? THEME.success : THEME.error,
                    }}
                  >
                    {stats.jobs.growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(stats.jobs.growth)}%
                  </div>
                )}
              </div>
              <p
                className="text-4xl font-bold tracking-tight"
                style={{ color: THEME.text, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {stats?.jobs.total.toLocaleString() || '0'}
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.textMuted }}>
                {t('admin.totalJobs')}
              </p>
              <div
                className="flex items-center gap-4 mt-4 pt-4 text-xs"
                style={{ borderTop: `1px solid ${THEME.border}` }}
              >
                <span style={{ color: THEME.success }}>{stats?.jobs.open || 0} {t('common.open')}</span>
                <span style={{ color: THEME.warning }}>{stats?.jobs.inProgress || 0} {t('common.active')}</span>
              </div>
            </div>
          </div>

          {/* Proposals Card */}
          <div
            className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(circle at top right, ${THEME.warning}10, transparent 70%)` }}
            />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${THEME.warning}20` }}
                >
                  <FileText className="w-6 h-6" style={{ color: THEME.warning }} />
                </div>
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: `${THEME.primary}20`, color: THEME.primary }}
                >
                  <Target className="w-3 h-3" />
                  {stats?.proposals.acceptanceRate || 0}%
                </div>
              </div>
              <p
                className="text-4xl font-bold tracking-tight"
                style={{ color: THEME.text, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {stats?.proposals.total.toLocaleString() || '0'}
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.textMuted }}>
                {t('admin.totalProposals')}
              </p>
              <div
                className="flex items-center gap-4 mt-4 pt-4 text-xs"
                style={{ borderTop: `1px solid ${THEME.border}` }}
              >
                <span style={{ color: THEME.warning }}>{stats?.proposals.pending || 0} {t('common.pending')}</span>
                <span style={{ color: THEME.success }}>{stats?.proposals.accepted || 0} {t('common.accepted')}</span>
              </div>
            </div>
          </div>

          {/* Support Card */}
          <div
            className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(circle at top right, ${THEME.error}10, transparent 70%)` }}
            />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${THEME.error}20` }}
                >
                  <MessageCircle className="w-6 h-6" style={{ color: THEME.error }} />
                </div>
                {stats && stats.support.unread > 0 && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold animate-pulse"
                    style={{ background: `${THEME.error}20`, color: THEME.error }}
                  >
                    <Radio className="w-3 h-3" />
                    {stats.support.unread}
                  </div>
                )}
              </div>
              <p
                className="text-4xl font-bold tracking-tight"
                style={{ color: THEME.text, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {stats?.support.total.toLocaleString() || '0'}
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.textMuted }}>
                {t('admin.supportTickets')}
              </p>
              <div
                className="flex items-center gap-4 mt-4 pt-4 text-xs"
                style={{ borderTop: `1px solid ${THEME.border}` }}
              >
                <span style={{ color: THEME.error }}>{stats?.support.open || 0} {locale === 'ka' ? 'ღია' : 'open'}</span>
                <span style={{ color: THEME.success }}>{stats?.support.resolved || 0} {t('admin.resolved')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Distribution Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Main Chart */}
          <div
            className="lg:col-span-8 rounded-2xl p-6"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: THEME.text }}>
                  {t('admin.activityOverview')}
                </h3>
                <p className="text-sm mt-0.5" style={{ color: THEME.textMuted }}>
                  {t('admin.last14Days')}
                </p>
              </div>
              <div
                className="flex items-center gap-1 p-1 rounded-xl"
                style={{ background: THEME.surface }}
              >
                {[
                  { id: 'signups', label: t('admin.signups'), color: THEME.primary },
                  { id: 'jobs', label: t('admin.jobs'), color: THEME.info },
                  { id: 'proposals', label: t('admin.proposals'), color: THEME.warning },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChart(tab.id as typeof activeChart)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: activeChart === tab.id ? tab.color : 'transparent',
                      color: activeChart === tab.id ? 'white' : THEME.textMuted,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="relative h-48">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-full h-px" style={{ background: THEME.border }} />
                ))}
              </div>

              {/* Bars */}
              <div className="relative h-full flex items-end gap-1 px-1">
                {chartData.map((day, i) => (
                  <div
                    key={day._id}
                    className="flex-1 flex flex-col items-center justify-end group cursor-pointer"
                    style={{ height: '100%' }}
                  >
                    {/* Tooltip */}
                    <div
                      className="absolute bottom-full mb-2 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                    >
                      <p className="text-xs font-medium" style={{ color: THEME.text }}>{day.count}</p>
                      <p className="text-[10px]" style={{ color: THEME.textDim }}>{day._id.slice(5)}</p>
                    </div>

                    <div
                      className="w-full rounded-t-md transition-all duration-500 group-hover:opacity-80"
                      style={{
                        height: `${Math.max((day.count / maxChartValue) * 100, 4)}%`,
                        background: `linear-gradient(to top, ${getChartColor()}, ${getChartColor()}80)`,
                        boxShadow: day.count > 0 ? `0 0 20px ${getChartColor()}40` : 'none',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between mt-3 px-1">
              <span className="text-[10px]" style={{ color: THEME.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
                {chartData[0]?._id?.slice(5) || ''}
              </span>
              <span className="text-[10px]" style={{ color: THEME.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
                {chartData[chartData.length - 1]?._id?.slice(5) || ''}
              </span>
            </div>
          </div>

          {/* User Distribution */}
          <div
            className="lg:col-span-4 rounded-2xl p-6"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: THEME.text }}>
                {t('admin.userBreakdown')}
              </h3>
              <PieChart className="w-5 h-5" style={{ color: THEME.textMuted }} />
            </div>

            <div className="space-y-4">
              {[
                { label: t('admin.clients'), value: stats?.users.clients || 0, icon: Users, color: THEME.primary },
                { label: t('admin.professionals'), value: stats?.users.pros || 0, icon: Shield, color: THEME.info },
                { label: t('admin.companies'), value: stats?.users.companies || 0, icon: Building2, color: '#8B5CF6' },
                { label: t('admin.verifiedPros'), value: stats?.users.verifiedPros || 0, icon: UserCheck, color: THEME.success },
              ].map((item) => {
                const percentage = stats?.users.total ? Math.round((item.value / stats.users.total) * 100) : 0;
                return (
                  <div key={item.label} className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${item.color}20` }}
                      >
                        <item.icon className="w-4 h-4" style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm" style={{ color: THEME.textMuted }}>{item.label}</span>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: THEME.text, fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: THEME.surface }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${percentage}%`,
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity & Categories Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Live Activity */}
          <div
            className="lg:col-span-6 rounded-2xl overflow-hidden"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${THEME.border}` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: THEME.success }} />
                <h3 className="font-semibold" style={{ color: THEME.text }}>
                  {t('admin.liveActivity')}
                </h3>
              </div>
              <span className="text-xs" style={{ color: THEME.textDim }}>
                {activities.length} {t('admin.events')}
              </span>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {activities.length === 0 ? (
                <div className="p-12 text-center">
                  <ActivityIcon className="w-12 h-12 mx-auto mb-3" style={{ color: THEME.textDim }} />
                  <p style={{ color: THEME.textMuted }}>{t('admin.noRecentActivity')}</p>
                </div>
              ) : (
                activities.slice(0, 12).map((activity, i) => {
                  const Icon = getActivityIcon(activity.type);
                  const color = getActivityColor(activity.type);
                  const msg = getActivityMessage(activity);
                  return (
                    <div
                      key={i}
                      className="px-6 py-3 flex items-center gap-4 transition-colors"
                      style={{
                        borderBottom: i < 11 ? `1px solid ${THEME.border}` : 'none',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: THEME.text }}>
                          <span className="font-medium">{msg.name}</span>
                          <span style={{ color: THEME.textMuted }}> {msg.action}</span>
                          {msg.extra && <span style={{ color: THEME.textDim }}> · {msg.extra}</span>}
                        </p>
                      </div>
                      <span
                        className="text-xs flex-shrink-0"
                        style={{ color: THEME.textDim, fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {formatTimeAgoCompact(activity.date, locale as 'en' | 'ka' | 'ru')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Categories & Locations */}
          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Jobs by Category */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
            >
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${THEME.border}` }}
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" style={{ color: THEME.textMuted }} />
                  <h3 className="font-semibold text-sm" style={{ color: THEME.text }}>
                    {t('common.categories')}
                  </h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {jobsByCategory.length === 0 ? (
                  <p className="text-center py-4 text-sm" style={{ color: THEME.textMuted }}>
                    {t('admin.noData')}
                  </p>
                ) : (
                  jobsByCategory.slice(0, 5).map((cat) => (
                    <div key={cat._id} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm truncate" style={{ color: THEME.textMuted }}>
                          {t(`categories.${cat._id}`) || cat._id || 'Other'}
                        </span>
                        <span
                          className="text-xs font-medium ml-2"
                          style={{ color: THEME.text, fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {cat.count}
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: THEME.surface }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(cat.count / maxCategoryCount) * 100}%`,
                            background: `linear-gradient(90deg, ${THEME.info}, ${THEME.info}80)`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Jobs by Location */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
            >
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${THEME.border}` }}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: THEME.textMuted }} />
                  <h3 className="font-semibold text-sm" style={{ color: THEME.text }}>
                    {t('admin.locations')}
                  </h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {jobsByLocation.length === 0 ? (
                  <p className="text-center py-4 text-sm" style={{ color: THEME.textMuted }}>
                    {locale === 'ka' ? 'მონაცემები არ არის' : 'No data'}
                  </p>
                ) : (
                  jobsByLocation.slice(0, 5).map((loc) => (
                    <div key={loc._id} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm truncate" style={{ color: THEME.textMuted }}>
                          {loc._id || 'Unknown'}
                        </span>
                        <span
                          className="text-xs font-medium ml-2"
                          style={{ color: THEME.text, fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {loc.count}
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: THEME.surface }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(loc.count / maxLocationCount) * 100}%`,
                            background: `linear-gradient(90deg, ${THEME.primary}, ${THEME.accent})`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Items Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Users */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${THEME.border}` }}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: THEME.textMuted }} />
                <h3 className="font-semibold" style={{ color: THEME.text }}>
                  {t('admin.recentUsers')}
                </h3>
              </div>
              <Link
                href="/admin/users"
                className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: THEME.primary }}
              >
                {t('common.viewAll')}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div>
              {recentUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3" style={{ color: THEME.textDim }} />
                  <p style={{ color: THEME.textMuted }}>{t('admin.noUsersYet')}</p>
                </div>
              ) : (
                recentUsers.map((user, i) => (
                  <div
                    key={user._id}
                    className="px-6 py-3 flex items-center gap-4 transition-colors"
                    style={{ borderBottom: i < recentUsers.length - 1 ? `1px solid ${THEME.border}` : 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Avatar src={user.avatar} name={user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: THEME.text }}>{user.name}</p>
                      <p className="text-xs truncate" style={{ color: THEME.textDim }}>{user.email}</p>
                    </div>
                    <span
                      className="px-2.5 py-1 text-xs font-medium rounded-lg"
                      style={{
                        background: user.role === 'pro' ? `${THEME.info}20` :
                                   user.role === 'company' ? '#8B5CF620' :
                                   user.role === 'admin' ? `${THEME.error}20` :
                                   `${THEME.primary}20`,
                        color: user.role === 'pro' ? THEME.info :
                               user.role === 'company' ? '#8B5CF6' :
                               user.role === 'admin' ? THEME.error :
                               THEME.primary,
                      }}
                    >
                      {user.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Jobs */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${THEME.border}` }}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" style={{ color: THEME.textMuted }} />
                <h3 className="font-semibold" style={{ color: THEME.text }}>
                  {t('admin.recentJobs')}
                </h3>
              </div>
              <Link
                href="/admin/jobs"
                className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: THEME.primary }}
              >
                {locale === 'ka' ? 'ყველა' : 'View all'}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div>
              {recentJobs.length === 0 ? (
                <div className="p-12 text-center">
                  <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: THEME.textDim }} />
                  <p style={{ color: THEME.textMuted }}>{t('admin.noJobsYet')}</p>
                </div>
              ) : (
                recentJobs.map((job, i) => (
                  <div
                    key={job._id}
                    className="px-6 py-3 transition-colors"
                    style={{ borderBottom: i < recentJobs.length - 1 ? `1px solid ${THEME.border}` : 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: THEME.text }}>{job.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs truncate" style={{ color: THEME.textDim }}>
                            {t(`categories.${job.category}`) || job.category}
                          </span>
                          {job.location && (
                            <>
                              <span style={{ color: THEME.textDim }}>·</span>
                              <span className="text-xs flex items-center gap-0.5" style={{ color: THEME.textDim }}>
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span
                        className="px-2.5 py-1 text-xs font-medium rounded-lg flex-shrink-0"
                        style={{
                          background: job.status === 'open' ? `${THEME.success}20` :
                                     job.status === 'in_progress' ? `${THEME.warning}20` :
                                     job.status === 'completed' ? `${THEME.info}20` :
                                     `${THEME.textDim}20`,
                          color: job.status === 'open' ? THEME.success :
                                 job.status === 'in_progress' ? THEME.warning :
                                 job.status === 'completed' ? THEME.info :
                                 THEME.textDim,
                        }}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AdminDashboardPageContent />
    </AuthGuard>
  );
}
