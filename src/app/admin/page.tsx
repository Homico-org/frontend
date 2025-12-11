'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import Avatar from '@/components/common/Avatar';
import {
  Users,
  Briefcase,
  FileText,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  Building2,
  UserCheck,
  Shield,
  MapPin,
  Tag,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Zap,
  BarChart3,
  PieChart,
} from 'lucide-react';

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

interface Activity {
  type: string;
  data: any;
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

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [jobsByCategory, setJobsByCategory] = useState<CategoryData[]>([]);
  const [dailySignups, setDailySignups] = useState<DailyData[]>([]);
  const [dailyJobs, setDailyJobs] = useState<DailyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const [
        statsRes,
        usersRes,
        jobsRes,
        activityRes,
        categoryRes,
        signupsRes,
        dailyJobsRes,
      ] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/recent-users?limit=5'),
        api.get('/admin/recent-jobs?limit=5'),
        api.get('/admin/activity?limit=15'),
        api.get('/admin/jobs-by-category'),
        api.get('/admin/daily-signups?days=14'),
        api.get('/admin/daily-jobs?days=14'),
      ]);

      setStats(statsRes.data);
      setRecentUsers(usersRes.data);
      setRecentJobs(jobsRes.data);
      setActivities(activityRes.data);
      setJobsByCategory(categoryRes.data);
      setDailySignups(signupsRes.data);
      setDailyJobs(dailyJobsRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
      return;
    }

    if (isAuthenticated && user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [authLoading, isAuthenticated, user, router, fetchDashboardData]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('admin.justNow');
    if (diffMins < 60) return `${diffMins}${t('admin.mAgo')}`;
    if (diffHours < 24) return `${diffHours}${t('admin.hAgo')}`;
    if (diffDays < 7) return `${diffDays}${t('admin.dAgo')}`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return <Users className="w-4 h-4" />;
      case 'job_created': return <Briefcase className="w-4 h-4" />;
      case 'proposal_sent': return <FileText className="w-4 h-4" />;
      case 'ticket_created': return <MessageCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_signup': return 'bg-[#D2691E]/10 text-[#D2691E] dark:text-[#CD853F]';
      case 'job_created': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'proposal_sent': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'ticket_created': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
      default: return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400';
    }
  };

  const getActivityMessage = (activity: Activity) => {
    switch (activity.type) {
      case 'user_signup':
        return <><span className="font-medium">{activity.data.name}</span> {t('admin.signedUpAs')} {activity.data.role}</>;
      case 'job_created':
        return <><span className="font-medium">{activity.data.clientId?.name || 'Someone'}</span> {t('admin.posted')} "{activity.data.title}"</>;
      case 'proposal_sent':
        return <><span className="font-medium">{activity.data.proId?.name || 'Pro'}</span> {t('admin.sentProposal')}</>;
      case 'ticket_created':
        return <><span className="font-medium">{activity.data.userId?.name || 'Someone'}</span> {t('admin.openedTicket')}</>;
      default:
        return 'Activity';
    }
  };

  // Calculate max for bar charts
  const maxCategoryCount = Math.max(...jobsByCategory.map(c => c.count), 1);
  const maxDailySignup = Math.max(...dailySignups.map(d => d.count), 1);
  const maxDailyJob = Math.max(...dailyJobs.map(d => d.count), 1);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D2691E] to-[#D2691E] flex items-center justify-center animate-pulse">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center animate-bounce">
                <Zap className="w-3 h-3 text-amber-900" />
              </div>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">{t('admin.loadingDashboard')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl border-b" style={{ backgroundColor: 'rgba(var(--color-bg-primary-rgb, 40, 40, 44), 0.8)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D2691E] to-[#D2691E] flex items-center justify-center shadow-lg shadow-[#D2691E]/20">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                    {t('admin.commandCenter')}
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {lastUpdated ? `${t('admin.updated')} ${formatTimeAgo(lastUpdated.toISOString())}` : t('common.loading')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-50"
                style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
              >
                <ArrowUpRight className="w-4 h-4 rotate-[-135deg]" />
                {t('nav.browse')}
              </Link>
              <button
                onClick={() => fetchDashboardData(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {t('admin.refresh')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Primary Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Users */}
          <div className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D2691E]/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D2691E] to-[#D2691E] flex items-center justify-center shadow-lg shadow-[#D2691E]/20">
                  <Users className="w-5 h-5 text-white" />
                </div>
                {stats && stats.users.growth !== 0 && (
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stats.users.growth > 0 ? 'bg-[#D2691E]/10 text-[#D2691E] dark:text-[#CD853F]' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                    {stats.users.growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(stats.users.growth)}%
                  </div>
                )}
              </div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                {stats?.users.total.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('admin.totalUsers')}</p>
              <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-neutral-500 dark:text-neutral-400">+{stats?.users.today || 0} {t('admin.today')}</span>
                <span className="text-neutral-500 dark:text-neutral-400">+{stats?.users.thisWeek || 0} {t('admin.thisWeek')}</span>
              </div>
            </div>
          </div>

          {/* Total Jobs */}
          <div className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                {stats && stats.jobs.growth !== 0 && (
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stats.jobs.growth > 0 ? 'bg-[#D2691E]/10 text-[#D2691E] dark:text-[#CD853F]' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                    {stats.jobs.growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(stats.jobs.growth)}%
                  </div>
                )}
              </div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                {stats?.jobs.total.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('admin.totalJobs')}</p>
              <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-[#D2691E] dark:text-[#CD853F]">{stats?.jobs.open || 0} {t('admin.open')}</span>
                <span className="text-amber-600 dark:text-amber-400">{stats?.jobs.inProgress || 0} {t('admin.active')}</span>
              </div>
            </div>
          </div>

          {/* Total Proposals */}
          <div className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-3 h-3" />
                  {stats?.proposals.acceptanceRate || 0}% {t('admin.rate')}
                </div>
              </div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                {stats?.proposals.total.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('admin.totalProposals')}</p>
              <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-amber-600 dark:text-amber-400">{stats?.proposals.pending || 0} {t('admin.pending')}</span>
                <span className="text-[#D2691E] dark:text-[#CD853F]">{stats?.proposals.accepted || 0} {t('admin.accepted')}</span>
              </div>
            </div>
          </div>

          {/* Support Tickets */}
          <div className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                {stats && stats.support.unread > 0 && (
                  <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse">
                    <AlertCircle className="w-3 h-3" />
                    {stats.support.unread} {t('admin.unread')}
                  </div>
                )}
              </div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                {stats?.support.total.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('admin.supportTickets')}</p>
              <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-rose-600 dark:text-rose-400">{stats?.support.open || 0} {t('admin.open')}</span>
                <span className="text-[#D2691E] dark:text-[#CD853F]">{stats?.support.resolved || 0} {t('admin.resolved')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Breakdown & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* User Distribution */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">{t('admin.userDistribution')}</h3>
              <PieChart className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="space-y-4">
              {[
                { label: t('admin.clients'), value: stats?.users.clients || 0, icon: Users, color: 'bg-[#D2691E]', bgColor: 'bg-[#D2691E]/10' },
                { label: t('admin.professionals'), value: stats?.users.pros || 0, icon: Shield, color: 'bg-blue-500', bgColor: 'bg-blue-500/10' },
                { label: t('admin.companies'), value: stats?.users.companies || 0, icon: Building2, color: 'bg-purple-500', bgColor: 'bg-purple-500/10' },
                { label: t('admin.verifiedPros'), value: stats?.users.verifiedPros || 0, icon: UserCheck, color: 'bg-amber-500', bgColor: 'bg-amber-500/10' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`w-4 h-4 ${item.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">{item.label}</span>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{item.value.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${stats?.users.total ? (item.value / stats.users.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Signups Chart */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">{t('admin.dailySignups')}</h3>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.last14Days')}</span>
            </div>
            <div className="flex items-end gap-1 h-32">
              {dailySignups.map((day, i) => (
                <div key={day._id} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full bg-[#D2691E] rounded-t transition-all duration-300 group-hover:bg-[#CD853F]"
                    style={{ height: `${(day.count / maxDailySignup) * 100}%`, minHeight: day.count > 0 ? '4px' : '2px' }}
                  />
                  <span className="text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.count}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-neutral-400">
              <span>{dailySignups[0]?._id?.slice(5) || ''}</span>
              <span>{dailySignups[dailySignups.length - 1]?._id?.slice(5) || ''}</span>
            </div>
          </div>

          {/* Daily Jobs Chart */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">{t('admin.dailyJobs')}</h3>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.last14Days')}</span>
            </div>
            <div className="flex items-end gap-1 h-32">
              {dailyJobs.map((day, i) => (
                <div key={day._id} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 group-hover:bg-blue-400"
                    style={{ height: `${(day.count / maxDailyJob) * 100}%`, minHeight: day.count > 0 ? '4px' : '2px' }}
                  />
                  <span className="text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.count}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-neutral-400">
              <span>{dailyJobs[0]?._id?.slice(5) || ''}</span>
              <span>{dailyJobs[dailyJobs.length - 1]?._id?.slice(5) || ''}</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Activity Feed */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-neutral-400" />
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">{t('admin.liveActivity')}</h3>
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{activities.length} {t('admin.events')}</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {activities.length === 0 ? (
                <div className="p-8 text-center">
                  <Activity className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">{t('admin.noRecentActivity')}</p>
                </div>
              ) : (
                activities.slice(0, 10).map((activity, i) => (
                  <div
                    key={i}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                        {getActivityMessage(activity)}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-400 flex-shrink-0">
                      {formatTimeAgo(activity.date)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Jobs by Category */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-neutral-400" />
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">{t('admin.topCategories')}</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {jobsByCategory.length === 0 ? (
                <div className="text-center py-4">
                  <Tag className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">{t('admin.noDataYet')}</p>
                </div>
              ) : (
                jobsByCategory.slice(0, 6).map((cat, i) => (
                  <div key={cat._id} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate flex-1">{t(`categories.${cat._id}`) || cat._id || t('categories.Other')}</span>
                      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 ml-2">{cat.count}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 group-hover:from-blue-400 group-hover:to-blue-300"
                        style={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Users */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-neutral-400" />
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">{t('admin.recentUsers')}</h3>
              </div>
              <Link href="/admin/users" className="text-xs text-[#D2691E] dark:text-[#CD853F] hover:underline flex items-center gap-1">
                {t('admin.viewAll')} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {recentUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">{t('admin.noUsersYet')}</p>
                </div>
              ) : (
                recentUsers.map((user) => (
                  <div key={user._id} className="px-5 py-3 flex items-center gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <Avatar src={user.avatar} name={user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">{user.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        user.role === 'pro' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                        user.role === 'company' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                        user.role === 'admin' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                        'bg-[#D2691E]/10 text-[#D2691E] dark:text-[#CD853F]'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Jobs */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-neutral-400" />
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">{t('admin.recentJobs')}</h3>
              </div>
              <Link href="/admin/jobs" className="text-xs text-[#D2691E] dark:text-[#CD853F] hover:underline flex items-center gap-1">
                {t('admin.viewAll')} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {recentJobs.length === 0 ? (
                <div className="p-8 text-center">
                  <Briefcase className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">{t('admin.noJobsYet')}</p>
                </div>
              ) : (
                recentJobs.map((job) => (
                  <div key={job._id} className="px-5 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">{job.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="truncate">{job.category}</span>
                          {job.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 truncate">
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                        job.status === 'open' ? 'bg-[#D2691E]/10 text-[#D2691E] dark:text-[#CD853F]' :
                        job.status === 'in_progress' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                        job.status === 'completed' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                        'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('admin.manageUsers'), icon: Users, href: '/admin/users', color: 'from-[#D2691E] to-[#D2691E]' },
            { label: t('admin.manageJobs'), icon: Briefcase, href: '/admin/jobs', color: 'from-blue-500 to-blue-600' },
            { label: t('admin.supportTicketsAction'), icon: MessageCircle, href: '/admin/support', color: 'from-amber-500 to-amber-600' },
            { label: t('admin.viewReports'), icon: BarChart3, href: '/admin/reports', color: 'from-purple-500 to-purple-600' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <div className="relative flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-sm text-neutral-900 dark:text-neutral-50">{action.label}</span>
                <ArrowUpRight className="w-4 h-4 text-neutral-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
