'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import AppBackground from '@/components/common/AppBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  UserPlus,
  Settings,
  Crown
} from 'lucide-react';
import { COMPANY_ACCENT as ACCENT, COMPANY_ACCENT_HOVER as ACCENT_HOVER } from '@/constants/theme';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  pendingProposals: number;
  acceptedProposals: number;
  totalRevenue: number;
  avgRating: number;
  reviewCount: number;
}

interface RecentJob {
  _id: string;
  title: string;
  status: string;
  clientName?: string;
  location?: string;
  scheduledDate?: string;
  assignedEmployees?: { name: string }[];
}

interface RecentProposal {
  _id: string;
  jobTitle: string;
  status: string;
  proposedPrice: number;
  submittedAt: string;
}

export default function CompanyDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openLoginModal('/company/dashboard');
    }
    if (!authLoading && user?.role !== 'company' && user?.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router, openLoginModal]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      // Fetch stats
      const statsRes = await fetch(`${API_URL}/companies/my/company/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Fetch recent jobs
      const jobsRes = await fetch(`${API_URL}/companies/my/company/jobs?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setRecentJobs(data.data || []);
      }

      // Fetch recent proposals
      const proposalsRes = await fetch(`${API_URL}/companies/my/company/proposals?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (proposalsRes.ok) {
        const data = await proposalsRes.json();
        setRecentProposals(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (user?.role === 'company' || user?.role === 'admin')) {
      fetchDashboardData();
    }
  }, [authLoading, user, fetchDashboardData]);

  const getStatusVariant = (status: string): 'warning' | 'info' | 'secondary' | 'success' | 'danger' | 'default' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': case 'accepted': return 'info';
      case 'in_progress': return 'secondary';
      case 'completed': return 'success';
      case 'rejected': case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="xl" variant="border" color={ACCENT} />
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <AppBackground />
      <Header />
      <HeaderSpacer />

      <main className="container-custom py-8 relative z-10">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {t('company.companyDashboard')}
              </h1>
              <p className="mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {t('company.manageYourCompanyAndTeam')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/company/employees/invite"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('company.invite')}</span>
              </Link>
              <Link
                href="/jobs"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white transition-all duration-200"
                style={{ background: ACCENT }}
                onMouseEnter={(e) => e.currentTarget.style.background = ACCENT_HOVER}
                onMouseLeave={(e) => e.currentTarget.style.background = ACCENT}
              >
                <Briefcase className="w-4 h-4" />
                <span>{t('company.browseJobs')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Active Jobs */}
          <div
            className="rounded-2xl p-5 transition-all duration-200"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}15` }}>
                <Briefcase className="w-5 h-5" style={{ color: ACCENT }} />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: `${ACCENT}15`, color: ACCENT }}>
                {t('common.active')}
              </span>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {stats?.activeJobs || 0}
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {t('company.activeJobs')}
            </p>
          </div>

          {/* Team Members */}
          <div
            className="rounded-2xl p-5 transition-all duration-200"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <Badge variant="info" size="xs">
                {stats?.activeEmployees || 0} {t('common.active')}
              </Badge>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {stats?.totalEmployees || 0}
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {t('company.teamMembers')}
            </p>
          </div>

          {/* Pending Proposals */}
          <div
            className="rounded-2xl p-5 transition-all duration-200"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <FileText className="w-5 h-5 text-amber-500" />
              </div>
              {(stats?.pendingProposals || 0) > 0 && (
                <Badge variant="warning" size="xs">
                  {t('common.new')}
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {stats?.pendingProposals || 0}
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {t('company.pendingProposals')}
            </p>
          </div>

          {/* Rating */}
          <div
            className="rounded-2xl p-5 transition-all duration-200"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <Star className="w-5 h-5 text-emerald-500" />
              </div>
              <Badge variant="success" size="xs">
                {stats?.reviewCount || 0} {t('common.reviews')}
              </Badge>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {stats?.avgRating?.toFixed(1) || '0.0'}
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {t('company.averageRating')}
            </p>
          </div>
        </div>

        {/* Quick Actions & Stats Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div
            className="lg:col-span-1 rounded-2xl p-6"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <h2 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              {t('company.quickActions')}
            </h2>
            <div className="space-y-2">
              <Link
                href="/jobs"
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group"
                style={{ background: 'var(--color-bg-secondary)' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${ACCENT}15` }}>
                  <Briefcase className="w-4 h-4" style={{ color: ACCENT }} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('company.findJobs')}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-tertiary)' }} />
              </Link>

              <Link
                href="/company/employees/invite"
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group"
                style={{ background: 'var(--color-bg-secondary)' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/30">
                  <UserPlus className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('company.inviteEmployee')}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-tertiary)' }} />
              </Link>

              <Link
                href="/company/proposals"
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group"
                style={{ background: 'var(--color-bg-secondary)' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-900/30">
                  <FileText className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('company.viewProposals')}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-tertiary)' }} />
              </Link>

              <Link
                href="/company/settings"
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group"
                style={{ background: 'var(--color-bg-secondary)' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                  <Settings className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {t('company.companySettings')}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-tertiary)' }} />
              </Link>
            </div>
          </div>

          {/* Performance Overview */}
          <div
            className="lg:col-span-2 rounded-2xl p-6"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {t('company.performanceOverview')}
              </h2>
              <Link
                href="/company/analytics"
                className="text-sm font-medium flex items-center gap-1 transition-colors"
                style={{ color: ACCENT }}
              >
                {t('common.viewAll')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)' }}>
                <div className="text-2xl font-bold" style={{ color: ACCENT }}>
                  {stats?.completedJobs || 0}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t('common.completed')}
                </p>
              </div>
              <div className="text-center p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)' }}>
                <div className="text-2xl font-bold text-blue-500">
                  {stats?.acceptedProposals || 0}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t('company.wonBids')}
                </p>
              </div>
              <div className="text-center p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)' }}>
                <div className="text-2xl font-bold text-emerald-500">
                  {stats?.totalRevenue ? `₾${(stats.totalRevenue / 1000).toFixed(1)}K` : '₾0'}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t('company.revenue')}
                </p>
              </div>
              <div className="text-center p-4 rounded-xl" style={{ background: 'var(--color-bg-secondary)' }}>
                <div className="text-2xl font-bold text-amber-500">
                  {stats?.totalJobs ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0}%
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t('company.successRate')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Jobs */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {t('company.recentJobs')}
              </h2>
              <Link
                href="/company/jobs"
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: ACCENT }}
              >
                {t('common.viewAll')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <Link
                    key={job._id}
                    href={`/company/jobs/${job._id}`}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--hover-bg)]"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}10` }}>
                      <Briefcase className="w-5 h-5" style={{ color: ACCENT }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {job.title}
                        </span>
                        <Badge variant={getStatusVariant(job.status)} size="xs" className="flex-shrink-0">
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        {job.clientName && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {job.clientName}
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Briefcase className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                  <p style={{ color: 'var(--color-text-tertiary)' }}>
                    {t('company.noJobsYet')}
                  </p>
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-2 mt-3 text-sm font-medium"
                    style={{ color: ACCENT }}
                  >
                    <Plus className="w-4 h-4" />
                    {t('company.browseJobs')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Proposals */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {t('company.recentProposals')}
              </h2>
              <Link
                href="/company/proposals"
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: ACCENT }}
              >
                {locale === 'ka' ? 'ყველა' : 'View All'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
              {recentProposals.length > 0 ? (
                recentProposals.map((proposal) => (
                  <Link
                    key={proposal._id}
                    href={`/company/proposals/${proposal._id}`}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--hover-bg)]"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50 dark:bg-amber-900/30">
                      <FileText className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {proposal.jobTitle}
                        </span>
                        <Badge variant={getStatusVariant(proposal.status)} size="xs" className="flex-shrink-0">
                          {proposal.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ₾{proposal.proposedPrice?.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(proposal.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center">
                  <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                  <p style={{ color: 'var(--color-text-tertiary)' }}>
                    {t('company.noProposalsYet')}
                  </p>
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-2 mt-3 text-sm font-medium"
                    style={{ color: ACCENT }}
                  >
                    <Plus className="w-4 h-4" />
                    {t('company.submitProposal')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Premium Upsell Banner */}
        <div
          className="mt-8 rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}15 0%, ${ACCENT}05 100%)`,
            border: `1px solid ${ACCENT}30`
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: ACCENT }}>
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {t('company.upgradeToPremium')}
                </h3>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('company.getMoreVisibilityAndPriority')}
                </p>
              </div>
            </div>
            <Link
              href="/company/premium"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white transition-all duration-200 self-start lg:self-center"
              style={{ background: ACCENT }}
              onMouseEnter={(e) => e.currentTarget.style.background = ACCENT_HOVER}
              onMouseLeave={(e) => e.currentTarget.style.background = ACCENT}
            >
              {t('company.viewPlans')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
