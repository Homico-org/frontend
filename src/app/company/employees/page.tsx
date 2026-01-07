'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import AppBackground from '@/components/common/AppBackground';
import Avatar from '@/components/common/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Star,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Crown,
  Shield,
  User,
  ChevronDown,
  X,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';
import { COMPANY_ACCENT as ACCENT, COMPANY_ACCENT_HOVER as ACCENT_HOVER } from '@/constants/theme';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'owner' | 'manager' | 'worker';
  jobTitle?: string;
  department?: string;
  status: 'pending' | 'active' | 'inactive' | 'terminated';
  skills?: string[];
  completedJobs?: number;
  avgRating?: number;
  hireDate?: string;
  isAvailable?: boolean;
  proProfileId?: string;
}

export default function CompanyEmployeesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { locale } = useLanguage();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openLoginModal('/company/employees');
    }
    if (!authLoading && user?.role !== 'company' && user?.role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router, openLoginModal]);

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`${API_URL}/companies/my/company/employees?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, roleFilter, searchQuery]);

  useEffect(() => {
    if (!authLoading && (user?.role === 'company' || user?.role === 'admin')) {
      fetchEmployees();
    }
  }, [authLoading, user, fetchEmployees]);

  const getStatusBadge = (status: string): { variant: 'success' | 'warning' | 'default' | 'danger', icon: typeof Check } => {
    switch (status) {
      case 'active':
        return { variant: 'success', icon: Check };
      case 'pending':
        return { variant: 'warning', icon: Clock };
      case 'inactive':
        return { variant: 'default', icon: AlertCircle };
      case 'terminated':
        return { variant: 'danger', icon: X };
      default:
        return { variant: 'default', icon: AlertCircle };
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown;
      case 'manager': return Shield;
      default: return User;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return { bg: `${ACCENT}15`, text: ACCENT };
      case 'manager': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' };
      default: return { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' };
    }
  };

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    pending: employees.filter(e => e.status === 'pending').length,
    managers: employees.filter(e => e.role === 'manager').length,
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <LoadingSpinner size="xl" variant="border" color={ACCENT} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <AppBackground />
      <Header />
      <HeaderSpacer />

      <main className="container-custom py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {locale === 'ka' ? 'გუნდის წევრები' : 'Team Members'}
            </h1>
            <p className="mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {locale === 'ka' ? 'მართეთ თქვენი თანამშრომლები' : 'Manage your company employees'}
            </p>
          </div>
          <Link
            href="/company/employees/invite"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white transition-all duration-200 self-start"
            style={{ background: ACCENT }}
            onMouseEnter={(e) => e.currentTarget.style.background = ACCENT_HOVER}
            onMouseLeave={(e) => e.currentTarget.style.background = ACCENT}
          >
            <UserPlus className="w-4 h-4" />
            {locale === 'ka' ? 'მოწვევა' : 'Invite Employee'}
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div
            className="rounded-xl p-4 transition-all duration-200"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${ACCENT}15` }}>
                <Users className="w-5 h-5" style={{ color: ACCENT }} />
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.total}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {locale === 'ka' ? 'სულ' : 'Total'}
                </div>
              </div>
            </div>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.active}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {locale === 'ka' ? 'აქტიური' : 'Active'}
                </div>
              </div>
            </div>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-900/30">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.pending}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {locale === 'ka' ? 'მოლოდინში' : 'Pending'}
                </div>
              </div>
            </div>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/30">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.managers}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {locale === 'ka' ? 'მენეჯერები' : 'Managers'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder={locale === 'ka' ? 'ძიება სახელით, ელ-ფოსტით...' : 'Search by name, email...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl text-sm focus:outline-none cursor-pointer"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="">{locale === 'ka' ? 'ყველა როლი' : 'All Roles'}</option>
                <option value="owner">{locale === 'ka' ? 'მფლობელი' : 'Owner'}</option>
                <option value="manager">{locale === 'ka' ? 'მენეჯერი' : 'Manager'}</option>
                <option value="worker">{locale === 'ka' ? 'თანამშრომელი' : 'Worker'}</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl text-sm focus:outline-none cursor-pointer"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="">{locale === 'ka' ? 'ყველა სტატუსი' : 'All Status'}</option>
                <option value="active">{locale === 'ka' ? 'აქტიური' : 'Active'}</option>
                <option value="pending">{locale === 'ka' ? 'მოლოდინში' : 'Pending'}</option>
                <option value="inactive">{locale === 'ka' ? 'არააქტიური' : 'Inactive'}</option>
              </select>
              <button
                onClick={fetchEmployees}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: ACCENT, color: 'white' }}
              >
                {locale === 'ka' ? 'ძიება' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Employee Grid */}
        {employees.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee) => {
              const StatusIcon = getStatusBadge(employee.status).icon;
              const RoleIcon = getRoleIcon(employee.role);
              const roleColor = getRoleColor(employee.role);

              return (
                <div
                  key={employee._id}
                  className="rounded-2xl p-5 transition-all duration-200 hover:shadow-lg relative group"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  {/* Action Menu */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setActionMenuId(actionMenuId === employee._id ? null : employee._id)}
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      style={{ background: 'var(--color-bg-secondary)' }}
                    >
                      <MoreVertical className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                    </button>
                    {actionMenuId === employee._id && (
                      <div
                        className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg py-1 z-10"
                        style={{
                          background: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        {employee.proProfileId && (
                          <Link
                            href={`/professionals/${employee.proProfileId}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--hover-bg)]"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            <User className="w-4 h-4" />
                            {locale === 'ka' ? 'პროფილის ნახვა' : 'View Profile'}
                          </Link>
                        )}
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--hover-bg)]"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          <Mail className="w-4 h-4" />
                          {locale === 'ka' ? 'შეტყობინება' : 'Send Message'}
                        </button>
                        {employee.role !== 'owner' && (
                          <button
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-4 h-4" />
                            {locale === 'ka' ? 'წაშლა' : 'Remove'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Employee Info */}
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={employee.avatar}
                      name={employee.name}
                      size="lg"
                      className="w-14 h-14 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {employee.name}
                        </h3>
                      </div>
                      <p className="text-sm truncate mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                        {employee.email}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: roleColor.bg, color: roleColor.text }}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {employee.role}
                        </span>
                        <Badge variant={getStatusBadge(employee.status).variant} size="xs" icon={<StatusIcon className="w-3 h-3" />}>
                          {employee.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  {employee.status === 'active' && (
                    <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {employee.completedJobs || 0} {locale === 'ka' ? 'სამუშაო' : 'jobs'}
                        </span>
                      </div>
                      {employee.avgRating && (
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {employee.avgRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {employee.isAvailable !== undefined && (
                        <div className="flex items-center gap-1.5 ml-auto">
                          <div className={`w-2 h-2 rounded-full ${employee.isAvailable ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            {employee.isAvailable
                              ? (locale === 'ka' ? 'ხელმისაწვდომი' : 'Available')
                              : (locale === 'ka' ? 'დაკავებული' : 'Busy')
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {employee.jobTitle && (
                    <p className="text-sm mt-3" style={{ color: 'var(--color-text-tertiary)' }}>
                      {employee.jobTitle}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)'
            }}
          >
            <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {locale === 'ka' ? 'თანამშრომლები არ მოიძებნა' : 'No employees found'}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
              {locale === 'ka'
                ? 'მოიწვიეთ თქვენი პირველი თანამშრომელი გუნდში'
                : 'Invite your first team member to get started'
              }
            </p>
            <Link
              href="/company/employees/invite"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white transition-all"
              style={{ background: ACCENT }}
            >
              <UserPlus className="w-4 h-4" />
              {locale === 'ka' ? 'მოწვევა' : 'Invite Employee'}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
