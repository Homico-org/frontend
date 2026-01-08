'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import { api } from '@/lib/api';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Shield,
  Building2,
  ArrowLeft,
  RefreshCw,
  MoreVertical,
  Mail,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  TrendingUp,
  Crown,
  BadgeCheck,
  Clock,
  AlertCircle,
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  Globe,
  Image,
} from 'lucide-react';
import { formatDateShort } from '@/utils/dateUtils';
import { ADMIN_THEME as THEME } from '@/constants/theme';
import { getAdminRoleColor, getAdminRoleLabel } from '@/utils/statusUtils';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'client' | 'pro' | 'company' | 'admin';
  avatar?: string;
  isVerified?: boolean;
  isActive?: boolean;
  isSuspended?: boolean;
  location?: string;
  createdAt: string;
  lastLoginAt?: string;
  // Verification fields
  verificationStatus?: 'pending' | 'submitted' | 'verified' | 'rejected';
  idDocumentUrl?: string;
  idDocumentBackUrl?: string;
  selfieWithIdUrl?: string;
  verificationSubmittedAt?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

interface UserStats {
  total: number;
  clients: number;
  pros: number;
  companies: number;
  admins: number;
  verifiedPros: number;
  suspended: number;
  thisWeek: number;
  thisMonth: number;
}

function AdminUsersPageContent() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenuUser, setActionMenuUser] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState<User | null>(null);
  const [verificationAction, setVerificationAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isProcessingVerification, setIsProcessingVerification] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (searchQuery) params.set('search', searchQuery);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (verificationFilter !== 'all') params.set('verificationStatus', verificationFilter);

      // Fetch stats first (this always works)
      const statsRes = await api.get('/admin/stats').catch((err) => {
        console.error('Failed to fetch /admin/stats:', err.response?.status, err.response?.data || err.message);
        return { data: { users: {} } };
      });

      // Try to fetch paginated users
      let usersData: User[] = [];
      let totalPagesData = 1;

      try {
        const usersRes = await api.get(`/admin/users?${params.toString()}`);
        console.log('Users API response:', usersRes.data);
        usersData = usersRes.data.users || [];
        totalPagesData = usersRes.data.totalPages || 1;
      } catch (err) {
        const apiErr = err as { response?: { status?: number; data?: unknown }; message?: string };
        console.error('Failed to fetch /admin/users:', apiErr.response?.status, apiErr.response?.data || apiErr.message);
        // Fallback: use recent-users endpoint if paginated endpoint fails
        try {
          const recentRes = await api.get('/admin/recent-users?limit=50');
          console.log('Fallback to recent-users:', recentRes.data);
          usersData = recentRes.data || [];
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
        }
      }

      setUsers(usersData);
      setTotalPages(totalPagesData);
      setStats({
        total: statsRes.data.users?.total || 0,
        clients: statsRes.data.users?.clients || 0,
        pros: statsRes.data.users?.pros || 0,
        companies: statsRes.data.users?.companies || 0,
        admins: statsRes.data.users?.admins || 0,
        verifiedPros: statsRes.data.users?.verifiedPros || 0,
        suspended: statsRes.data.users?.suspended || 0,
        thisWeek: statsRes.data.users?.thisWeek || 0,
        thisMonth: statsRes.data.users?.thisMonth || 0,
      });
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, searchQuery, roleFilter, verificationFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter, verificationFilter]);

  const getRoleColor = (role: string) => getAdminRoleColor(role);
  const getRoleLabel = (role: string) => getAdminRoleLabel(role, locale as 'en' | 'ka');

  const handleVerificationAction = async (action: 'approve' | 'reject') => {
    if (!showVerificationModal) return;

    setIsProcessingVerification(true);
    try {
      await api.patch(`/admin/users/${showVerificationModal._id}/verification`, {
        status: action === 'approve' ? 'verified' : 'rejected',
        rejectionNote: action === 'reject' ? rejectionNote : undefined,
      });

      // Update local state
      setUsers(prev => prev.map(u =>
        u._id === showVerificationModal._id
          ? { ...u, verificationStatus: action === 'approve' ? 'verified' : 'rejected' }
          : u
      ));

      setShowVerificationModal(null);
      setVerificationAction(null);
      setRejectionNote('');
    } catch (err) {
      console.error('Failed to update verification:', err);
    } finally {
      setIsProcessingVerification(false);
    }
  };

  const statCards = [
    { label: locale === 'ka' ? 'სულ მომხმარებელი' : 'Total Users', value: stats?.total || 0, icon: Users, color: THEME.primary },
    { label: locale === 'ka' ? 'კლიენტები' : 'Clients', value: stats?.clients || 0, icon: UserCheck, color: THEME.success },
    { label: locale === 'ka' ? 'პროფესიონალები' : 'Professionals', value: stats?.pros || 0, icon: Shield, color: THEME.info },
    { label: locale === 'ka' ? 'კომპანიები' : 'Companies', value: stats?.companies || 0, icon: Building2, color: '#8B5CF6' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: THEME.surface }}>
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto animate-pulse"
            style={{ background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})` }}
          >
            <Users className="w-8 h-8 text-white" />
          </div>
          <p className="mt-4 text-sm" style={{ color: THEME.textMuted }}>
            {locale === 'ka' ? 'იტვირთება...' : 'Loading users...'}
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
              <Button
                variant="secondary"
                size="icon"
                onClick={() => router.push('/admin')}
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ArrowLeft className="w-5 h-5" style={{ color: THEME.textMuted }} />
              </Button>
              <div>
                <h1
                  className="text-xl font-semibold tracking-tight"
                  style={{ color: THEME.text, fontFamily: "'Inter', sans-serif" }}
                >
                  {locale === 'ka' ? 'მომხმარებლების მართვა' : 'User Management'}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: THEME.textMuted }}>
                  {stats?.total.toLocaleString() || 0} {locale === 'ka' ? 'მომხმარებელი' : 'users total'}
                </p>
              </div>
            </div>

            <Button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              loading={isRefreshing}
              leftIcon={!isRefreshing ? <RefreshCw className="w-4 h-4" /> : undefined}
              style={{
                background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
                boxShadow: `0 4px 16px ${THEME.primary}40`,
              }}
            >
              <span className="hidden sm:inline">{locale === 'ka' ? 'განახლება' : 'Refresh'}</span>
            </Button>
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
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10" style={{ color: THEME.textDim }} />
              <Input
                type="text"
                placeholder={locale === 'ka' ? 'სახელი, ემაილი ან ტელეფონი...' : 'Search by name, email or phone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
                style={{
                  background: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  color: THEME.text,
                }}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 rounded-xl text-sm cursor-pointer focus:outline-none transition-all"
              style={{
                background: THEME.surface,
                border: `1px solid ${THEME.border}`,
                color: THEME.text,
              }}
            >
              <option value="all">{locale === 'ka' ? 'ყველა როლი' : 'All Roles'}</option>
              <option value="client">{locale === 'ka' ? 'კლიენტები' : 'Clients'}</option>
              <option value="pro">{locale === 'ka' ? 'პროფესიონალები' : 'Professionals'}</option>
              <option value="company">{locale === 'ka' ? 'კომპანიები' : 'Companies'}</option>
              <option value="admin">{locale === 'ka' ? 'ადმინები' : 'Admins'}</option>
            </select>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-4 py-3 rounded-xl text-sm cursor-pointer focus:outline-none transition-all"
              style={{
                background: verificationFilter === 'submitted' ? THEME.warning + '20' : THEME.surface,
                border: `1px solid ${verificationFilter === 'submitted' ? THEME.warning : THEME.border}`,
                color: THEME.text,
              }}
            >
              <option value="all">{locale === 'ka' ? 'ყველა ვერიფიკაცია' : 'All Verification'}</option>
              <option value="submitted">{locale === 'ka' ? '⏳ მოლოდინში' : '⏳ Pending Review'}</option>
              <option value="verified">{locale === 'ka' ? '✓ ვერიფიცირებული' : '✓ Verified'}</option>
              <option value="rejected">{locale === 'ka' ? '✗ უარყოფილი' : '✗ Rejected'}</option>
              <option value="pending">{locale === 'ka' ? 'არ გაგზავნილა' : 'Not Submitted'}</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
        >
          {/* Table Header */}
          <div
            className="px-6 py-4 grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider"
            style={{ borderBottom: `1px solid ${THEME.border}`, color: THEME.textDim }}
          >
            <div className="col-span-4">{locale === 'ka' ? 'მომხმარებელი' : 'User'}</div>
            <div className="col-span-2">{locale === 'ka' ? 'როლი' : 'Role'}</div>
            <div className="col-span-2 hidden lg:block">{locale === 'ka' ? 'სტატუსი' : 'Status'}</div>
            <div className="col-span-2 hidden md:block">{locale === 'ka' ? 'რეგისტრაცია' : 'Joined'}</div>
            <div className="col-span-2 text-right">{locale === 'ka' ? 'მოქმედებები' : 'Actions'}</div>
          </div>

          {/* Table Body */}
          {users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: THEME.textDim }} />
              <p className="text-lg font-medium" style={{ color: THEME.textMuted }}>
                {locale === 'ka' ? 'მომხმარებლები არ მოიძებნა' : 'No users found'}
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.textDim }}>
                {locale === 'ka' ? 'სცადეთ სხვა ძებნა' : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            users.map((user, index) => (
              <div
                key={user._id}
                className="px-6 py-4 grid grid-cols-12 gap-4 items-center transition-colors cursor-pointer"
                style={{
                  borderBottom: index < users.length - 1 ? `1px solid ${THEME.border}` : 'none',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* User Info */}
                <div className="col-span-4 flex items-center gap-3">
                  <Avatar src={user.avatar} name={user.name} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate" style={{ color: THEME.text }}>
                        {user.name}
                      </p>
                      {user.isVerified && (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: THEME.success }} />
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: THEME.textDim }}>{user.email}</p>
                  </div>
                </div>

                {/* Role */}
                <div className="col-span-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: `${getRoleColor(user.role)}20`,
                      color: getRoleColor(user.role),
                    }}
                  >
                    {user.role === 'admin' && <Crown className="w-3 h-3" />}
                    {getRoleLabel(user.role)}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-2 hidden lg:flex items-center gap-2">
                  {user.isSuspended ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ background: `${THEME.error}20`, color: THEME.error }}
                    >
                      <Ban className="w-3 h-3" />
                      {locale === 'ka' ? 'დაბლოკილი' : 'Suspended'}
                    </span>
                  ) : user.role === 'pro' || user.role === 'company' ? (
                    // Show verification status for pros/companies
                    user.verificationStatus === 'submitted' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowVerificationModal(user);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105"
                        style={{ background: `${THEME.warning}20`, color: THEME.warning }}
                      >
                        <Clock className="w-3 h-3" />
                        {locale === 'ka' ? 'გადასამოწმებელი' : 'Review'}
                      </button>
                    ) : user.verificationStatus === 'verified' ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ background: `${THEME.success}20`, color: THEME.success }}
                      >
                        <BadgeCheck className="w-3 h-3" />
                        {locale === 'ka' ? 'დადასტურებული' : 'Verified'}
                      </span>
                    ) : user.verificationStatus === 'rejected' ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ background: `${THEME.error}20`, color: THEME.error }}
                      >
                        <XCircle className="w-3 h-3" />
                        {locale === 'ka' ? 'უარყოფილი' : 'Rejected'}
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ background: `${THEME.textDim}20`, color: THEME.textDim }}
                      >
                        <AlertCircle className="w-3 h-3" />
                        {locale === 'ka' ? 'არ გაგზავნილა' : 'Not Submitted'}
                      </span>
                    )
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ background: `${THEME.success}20`, color: THEME.success }}
                    >
                      <CheckCircle className="w-3 h-3" />
                      {locale === 'ka' ? 'აქტიური' : 'Active'}
                    </span>
                  )}
                </div>

                {/* Joined */}
                <div className="col-span-2 hidden md:block">
                  <p
                    className="text-sm"
                    style={{ color: THEME.textMuted, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {formatDateShort(user.createdAt, locale as 'en' | 'ka')}
                  </p>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => router.push(`/profile/${user._id}`)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: `${THEME.info}20` }}
                    title={locale === 'ka' ? 'პროფილის ნახვა' : 'View Profile'}
                  >
                    <Eye className="w-4 h-4" style={{ color: THEME.info }} />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuUser(actionMenuUser === user._id ? null : user._id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: THEME.surface }}
                    >
                      <MoreVertical className="w-4 h-4" style={{ color: THEME.textMuted }} />
                    </button>
                    {actionMenuUser === user._id && (
                      <div
                        className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden shadow-xl z-10"
                        style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
                      >
                        <button
                          className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors"
                          style={{ color: THEME.text }}
                          onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          onClick={() => {
                            setActionMenuUser(null);
                            router.push(`/profile/${user._id}`);
                          }}
                        >
                          <Eye className="w-4 h-4" style={{ color: THEME.info }} />
                          {locale === 'ka' ? 'პროფილის ნახვა' : 'View Profile'}
                        </button>
                        <button
                          className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors"
                          style={{ color: THEME.text }}
                          onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          onClick={() => setActionMenuUser(null)}
                        >
                          <Mail className="w-4 h-4" style={{ color: THEME.warning }} />
                          {locale === 'ka' ? 'ემაილის გაგზავნა' : 'Send Email'}
                        </button>
                        <div style={{ borderTop: `1px solid ${THEME.border}` }} />
                        <button
                          className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors"
                          style={{ color: user.isSuspended ? THEME.success : THEME.error }}
                          onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          onClick={() => setActionMenuUser(null)}
                        >
                          {user.isSuspended ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              {locale === 'ka' ? 'განბლოკვა' : 'Unsuspend'}
                            </>
                          ) : (
                            <>
                              <Ban className="w-4 h-4" />
                              {locale === 'ka' ? 'დაბლოკვა' : 'Suspend'}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm" style={{ color: THEME.textMuted }}>
              {locale === 'ka' ? `გვერდი ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ChevronLeft className="w-5 h-5" style={{ color: THEME.textMuted }} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: THEME.textMuted }} />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Click outside to close menu */}
      {actionMenuUser && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuUser(null)}
        />
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowVerificationModal(null);
              setVerificationAction(null);
              setRejectionNote('');
            }}
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
                <Avatar src={showVerificationModal.avatar} name={showVerificationModal.name} size="lg" />
                <div>
                  <h3 className="font-semibold" style={{ color: THEME.text }}>
                    {showVerificationModal.name}
                  </h3>
                  <p className="text-sm" style={{ color: THEME.textMuted }}>
                    {showVerificationModal.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowVerificationModal(null);
                  setVerificationAction(null);
                  setRejectionNote('');
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{ background: THEME.surface }}
              >
                <XCircle className="w-5 h-5" style={{ color: THEME.textMuted }} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* ID Documents Section */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: THEME.text }}>
                  <Image className="w-4 h-4" style={{ color: THEME.primary }} />
                  {locale === 'ka' ? 'საიდენტიფიკაციო დოკუმენტები' : 'ID Documents'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* ID Front */}
                  <div
                    className="rounded-xl p-3"
                    style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                  >
                    <p className="text-xs mb-2" style={{ color: THEME.textDim }}>
                      {locale === 'ka' ? 'პირადობის წინა მხარე' : 'ID Front'}
                    </p>
                    {showVerificationModal.idDocumentUrl ? (
                      <a
                        href={showVerificationModal.idDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video rounded-lg overflow-hidden bg-black/20 hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={showVerificationModal.idDocumentUrl}
                          alt="ID Front"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ) : (
                      <div
                        className="aspect-video rounded-lg flex items-center justify-center"
                        style={{ background: THEME.surfaceHover }}
                      >
                        <p className="text-xs" style={{ color: THEME.textDim }}>
                          {locale === 'ka' ? 'არ არის ატვირთული' : 'Not uploaded'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ID Back */}
                  <div
                    className="rounded-xl p-3"
                    style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                  >
                    <p className="text-xs mb-2" style={{ color: THEME.textDim }}>
                      {locale === 'ka' ? 'პირადობის უკანა მხარე' : 'ID Back'}
                    </p>
                    {showVerificationModal.idDocumentBackUrl ? (
                      <a
                        href={showVerificationModal.idDocumentBackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video rounded-lg overflow-hidden bg-black/20 hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={showVerificationModal.idDocumentBackUrl}
                          alt="ID Back"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ) : (
                      <div
                        className="aspect-video rounded-lg flex items-center justify-center"
                        style={{ background: THEME.surfaceHover }}
                      >
                        <p className="text-xs" style={{ color: THEME.textDim }}>
                          {locale === 'ka' ? 'არ არის ატვირთული' : 'Not uploaded'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Selfie with ID */}
                  <div
                    className="rounded-xl p-3"
                    style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                  >
                    <p className="text-xs mb-2" style={{ color: THEME.textDim }}>
                      {locale === 'ka' ? 'სელფი პირადობით' : 'Selfie with ID'}
                    </p>
                    {showVerificationModal.selfieWithIdUrl ? (
                      <a
                        href={showVerificationModal.selfieWithIdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video rounded-lg overflow-hidden bg-black/20 hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={showVerificationModal.selfieWithIdUrl}
                          alt="Selfie with ID"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ) : (
                      <div
                        className="aspect-video rounded-lg flex items-center justify-center"
                        style={{ background: THEME.surfaceHover }}
                      >
                        <p className="text-xs" style={{ color: THEME.textDim }}>
                          {locale === 'ka' ? 'არ არის ატვირთული' : 'Not uploaded'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Links Section */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: THEME.text }}>
                  <Globe className="w-4 h-4" style={{ color: THEME.primary }} />
                  {locale === 'ka' ? 'სოციალური ბმულები' : 'Social Links'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {showVerificationModal.facebookUrl && (
                    <a
                      href={showVerificationModal.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all hover:scale-[1.02]"
                      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                    >
                      <Facebook className="w-5 h-5" style={{ color: '#1877F2' }} />
                      <span className="text-sm truncate" style={{ color: THEME.text }}>Facebook</span>
                      <ExternalLink className="w-3 h-3 ml-auto" style={{ color: THEME.textDim }} />
                    </a>
                  )}
                  {showVerificationModal.instagramUrl && (
                    <a
                      href={showVerificationModal.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all hover:scale-[1.02]"
                      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                    >
                      <Instagram className="w-5 h-5" style={{ color: '#E4405F' }} />
                      <span className="text-sm truncate" style={{ color: THEME.text }}>Instagram</span>
                      <ExternalLink className="w-3 h-3 ml-auto" style={{ color: THEME.textDim }} />
                    </a>
                  )}
                  {showVerificationModal.linkedinUrl && (
                    <a
                      href={showVerificationModal.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all hover:scale-[1.02]"
                      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                    >
                      <Linkedin className="w-5 h-5" style={{ color: '#0A66C2' }} />
                      <span className="text-sm truncate" style={{ color: THEME.text }}>LinkedIn</span>
                      <ExternalLink className="w-3 h-3 ml-auto" style={{ color: THEME.textDim }} />
                    </a>
                  )}
                  {showVerificationModal.websiteUrl && (
                    <a
                      href={showVerificationModal.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all hover:scale-[1.02]"
                      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                    >
                      <Globe className="w-5 h-5" style={{ color: THEME.primary }} />
                      <span className="text-sm truncate" style={{ color: THEME.text }}>Website</span>
                      <ExternalLink className="w-3 h-3 ml-auto" style={{ color: THEME.textDim }} />
                    </a>
                  )}
                  {!showVerificationModal.facebookUrl && !showVerificationModal.instagramUrl && !showVerificationModal.linkedinUrl && !showVerificationModal.websiteUrl && (
                    <p className="col-span-2 text-sm py-4 text-center" style={{ color: THEME.textDim }}>
                      {locale === 'ka' ? 'სოციალური ბმულები არ არის დამატებული' : 'No social links added'}
                    </p>
                  )}
                </div>
              </div>

              {/* Rejection Note (if rejecting) */}
              {verificationAction === 'reject' && (
                <div>
                  <h4 className="text-sm font-medium mb-3" style={{ color: THEME.text }}>
                    {locale === 'ka' ? 'უარყოფის მიზეზი' : 'Rejection Reason'}
                  </h4>
                  <Textarea
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder={locale === 'ka' ? 'მიუთითეთ უარყოფის მიზეზი...' : 'Enter rejection reason...'}
                    rows={3}
                    style={{
                      background: THEME.surface,
                      border: `1px solid ${THEME.border}`,
                      color: THEME.text,
                    }}
                  />
                </div>
              )}

              {/* Submitted Date */}
              {showVerificationModal.verificationSubmittedAt && (
                <p className="text-xs" style={{ color: THEME.textDim }}>
                  {locale === 'ka' ? 'გაგზავნილია: ' : 'Submitted: '}
                  {formatDateShort(showVerificationModal.verificationSubmittedAt, locale as 'en' | 'ka')}
                </p>
              )}
            </div>

            {/* Footer Actions */}
            <div
              className="sticky bottom-0 px-6 py-4 flex items-center justify-end gap-3"
              style={{ background: THEME.surfaceLight, borderTop: `1px solid ${THEME.border}` }}
            >
              {verificationAction === 'reject' ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setVerificationAction(null)}
                    style={{ background: THEME.surface, color: THEME.textMuted }}
                  >
                    {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleVerificationAction('reject')}
                    disabled={isProcessingVerification || !rejectionNote.trim()}
                    loading={isProcessingVerification}
                  >
                    {locale === 'ka' ? 'უარყოფა' : 'Confirm Reject'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setVerificationAction('reject')}
                    leftIcon={<XCircle className="w-4 h-4" />}
                    style={{ background: `${THEME.error}20`, color: THEME.error, borderColor: THEME.error }}
                  >
                    {locale === 'ka' ? 'უარყოფა' : 'Reject'}
                  </Button>
                  <Button
                    onClick={() => handleVerificationAction('approve')}
                    disabled={isProcessingVerification}
                    loading={isProcessingVerification}
                    leftIcon={!isProcessingVerification ? <BadgeCheck className="w-4 h-4" /> : undefined}
                    style={{
                      background: `linear-gradient(135deg, ${THEME.success}, #16A34A)`,
                      boxShadow: `0 4px 16px ${THEME.success}40`,
                    }}
                  >
                    {locale === 'ka' ? 'დადასტურება' : 'Approve'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AdminUsersPageContent />
    </AuthGuard>
  );
}
