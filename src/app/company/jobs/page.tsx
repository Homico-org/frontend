'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { COMPANY_ACCENT as ACCENT, COMPANY_ACCENT_HOVER as ACCENT_HOVER } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateShort } from '@/utils/dateUtils';
import {
  AlertTriangle,
  ArrowUpRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Clock,
  Filter,
  MapPin,
  PlayCircle,
  Plus,
  Search,
  Timer,
  User,
  UserCheck,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Employee {
  _id: string;
  name: string;
  jobTitle?: string;
  avatar?: string;
}

interface CompanyJob {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  location?: string;
  address?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  estimatedDuration?: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  quotedPrice?: number;
  finalPrice?: number;
  currency?: string;
  assignedEmployees?: Employee[];
  leadEmployee?: Employee;
  tags?: string[];
  createdAt: string;
}

export default function CompanyJobsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { locale } = useLanguage();
  const router = useRouter();

  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, hasMore: false });
  const [filter, setFilter] = useState({ status: '', priority: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openLoginModal('/company/jobs');
    }
    if (!authLoading && user?.role !== 'company') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router, openLoginModal]);

  useEffect(() => {
    if (!authLoading && user?.role === 'company') {
      fetchJobs();
    }
  }, [authLoading, user, filter.status, filter.priority]);

  const fetchJobs = async (page = 1) => {
    try {
      setIsLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (filter.status) params.append('status', filter.status);
      if (filter.priority) params.append('priority', filter.priority);

      const res = await fetch(`${API_URL}/companies/my/company/jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setJobs(data.data || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, hasMore: false });
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
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
      case 'assigned':
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: UserCheck,
          label: locale === 'ka' ? 'დანიშნული' : 'Assigned'
        };
      case 'in_progress':
        return {
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: PlayCircle,
          label: locale === 'ka' ? 'მიმდინარე' : 'In Progress'
        };
      case 'completed':
        return {
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          label: locale === 'ka' ? 'დასრულებული' : 'Completed'
        };
      case 'cancelled':
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: XCircle,
          label: locale === 'ka' ? 'გაუქმებული' : 'Cancelled'
        };
      default:
        return {
          color: 'bg-neutral-50 text-neutral-700 border-neutral-200',
          icon: Briefcase,
          label: status
        };
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          color: 'bg-red-50 text-red-600 border-red-200',
          label: locale === 'ka' ? 'სასწრაფო' : 'Urgent'
        };
      case 'high':
        return {
          color: 'bg-amber-50 text-amber-600 border-amber-200',
          label: locale === 'ka' ? 'მაღალი' : 'High'
        };
      case 'medium':
        return {
          color: 'bg-blue-50 text-blue-600 border-blue-200',
          label: locale === 'ka' ? 'საშუალო' : 'Medium'
        };
      case 'low':
        return {
          color: 'bg-neutral-50 text-neutral-500 border-neutral-200',
          label: locale === 'ka' ? 'დაბალი' : 'Low'
        };
      default:
        return {
          color: 'bg-neutral-50 text-neutral-500 border-neutral-200',
          label: priority
        };
    }
  };

  // Stats calculations
  const stats = {
    total: pagination.total || jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    assigned: jobs.filter(j => j.status === 'assigned').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  // Filter displayed jobs by search
  const displayedJobs = filter.search
    ? jobs.filter(j =>
        j.title.toLowerCase().includes(filter.search.toLowerCase()) ||
        j.clientName?.toLowerCase().includes(filter.search.toLowerCase()) ||
        j.location?.toLowerCase().includes(filter.search.toLowerCase())
      )
    : jobs;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <LoadingSpinner size="lg" variant="border" color={ACCENT} />
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
              {locale === 'ka' ? 'სამუშაოები' : 'Jobs'}
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              {locale === 'ka' ? 'მართეთ კომპანიის სამუშაოები და დავალებები' : 'Manage your company jobs and assignments'}
            </p>
          </div>
          <Link
            href="/company/jobs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 self-start"
            style={{ backgroundColor: ACCENT }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ACCENT_HOVER}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ACCENT}
          >
            <Plus className="w-5 h-5" />
            {locale === 'ka' ? 'ახალი სამუშაო' : 'Create Job'}
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
                <Briefcase className="w-5 h-5" style={{ color: ACCENT }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.total}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {locale === 'ka' ? 'ყველა' : 'All Jobs'}
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
            onClick={() => setFilter({ ...filter, status: 'assigned' })}
            className={`bg-[var(--color-bg-primary)] rounded-xl border p-4 text-left transition-all duration-200 ${
              filter.status === 'assigned'
                ? 'border-blue-500 ring-2 ring-blue-100'
                : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {locale === 'ka' ? 'დანიშნული' : 'Assigned'}
            </div>
          </button>

          <button
            onClick={() => setFilter({ ...filter, status: 'in_progress' })}
            className={`bg-[var(--color-bg-primary)] rounded-xl border p-4 text-left transition-all duration-200 ${
              filter.status === 'in_progress'
                ? 'border-indigo-500 ring-2 ring-indigo-100'
                : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <PlayCircle className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-indigo-600">{stats.inProgress}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {locale === 'ka' ? 'მიმდინარე' : 'In Progress'}
            </div>
          </button>

          <button
            onClick={() => setFilter({ ...filter, status: 'completed' })}
            className={`bg-[var(--color-bg-primary)] rounded-xl border p-4 text-left transition-all duration-200 ${
              filter.status === 'completed'
                ? 'border-emerald-500 ring-2 ring-emerald-100'
                : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {locale === 'ka' ? 'დასრულებული' : 'Completed'}
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
                placeholder={locale === 'ka' ? 'მოძებნე სამუშაო...' : 'Search jobs...'}
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F] transition-colors"
              />
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters || filter.priority ? 'outline' : 'secondary'}
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="w-4 h-4" />}
                className={showFilters || filter.priority ? 'border-[#E07B4F] bg-[#E07B4F]/5 text-[#E07B4F]' : ''}
              >
                {locale === 'ka' ? 'ფილტრები' : 'Filters'}
              </Button>

              {filter.status && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFilter({ ...filter, status: '' })}
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  {locale === 'ka' ? 'გაწმინდე' : 'Clear'}
                </Button>
              )}
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)]">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-[var(--color-text-secondary)] mr-2">
                  {locale === 'ka' ? 'პრიორიტეტი:' : 'Priority:'}
                </span>
                {['urgent', 'high', 'medium', 'low'].map((priority) => {
                  const info = getPriorityInfo(priority);
                  return (
                    <button
                      key={priority}
                      onClick={() => setFilter({ ...filter, priority: filter.priority === priority ? '' : priority })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                        filter.priority === priority
                          ? info.color
                          : 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-secondary)]'
                      }`}
                    >
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Jobs List */}
        <div className="bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" color={ACCENT} />
            </div>
          ) : displayedJobs.length > 0 ? (
            <div className="divide-y divide-[var(--color-border-primary)]">
              {displayedJobs.map((job) => {
                const statusInfo = getStatusInfo(job.status);
                const priorityInfo = getPriorityInfo(job.priority);
                const StatusIcon = statusInfo.icon;

                return (
                  <Link
                    key={job._id}
                    href={`/company/jobs/${job._id}`}
                    className="block p-5 hover:bg-[var(--color-bg-secondary)] transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Title and badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
                            {job.title}
                          </h3>
                          <Badge
                            variant={
                              job.status === 'pending' ? 'warning' :
                              job.status === 'assigned' ? 'info' :
                              job.status === 'in_progress' ? 'info' :
                              job.status === 'completed' ? 'success' :
                              job.status === 'cancelled' ? 'danger' : 'default'
                            }
                            size="xs"
                            icon={<StatusIcon className="w-3 h-3" />}
                          >
                            {statusInfo.label}
                          </Badge>
                          {job.priority !== 'medium' && (
                            <Badge
                              variant={
                                job.priority === 'urgent' ? 'danger' :
                                job.priority === 'high' ? 'warning' : 'secondary'
                              }
                              size="xs"
                              icon={job.priority === 'urgent' ? <AlertTriangle className="w-3 h-3" /> : undefined}
                            >
                              {priorityInfo.label}
                            </Badge>
                          )}
                        </div>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-text-secondary)]">
                          {job.clientName && (
                            <span className="flex items-center gap-1.5">
                              <User className="w-4 h-4" />
                              {job.clientName}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                          )}
                          {job.scheduledDate && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {formatDateShort(job.scheduledDate, locale as 'en' | 'ka')}
                              {job.scheduledTime && ` ${job.scheduledTime}`}
                            </span>
                          )}
                          {job.estimatedDuration && (
                            <span className="flex items-center gap-1.5">
                              <Timer className="w-4 h-4" />
                              {job.estimatedDuration}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {job.tags && job.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.tags.slice(0, 4).map((tag) => (
                              <Badge key={tag} variant="ghost" size="xs">
                                {tag}
                              </Badge>
                            ))}
                            {job.tags.length > 4 && (
                              <Badge variant="ghost" size="xs">
                                +{job.tags.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Assigned Team */}
                        {job.assignedEmployees && job.assignedEmployees.length > 0 && (
                          <div className="flex -space-x-2">
                            {job.assignedEmployees.slice(0, 3).map((emp) => (
                              <div
                                key={emp._id}
                                className="w-8 h-8 rounded-full border-2 border-[var(--color-bg-primary)] flex items-center justify-center text-white text-xs font-medium"
                                style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_HOVER} 100%)` }}
                                title={emp.name}
                              >
                                {emp.avatar ? (
                                  <img src={emp.avatar} alt={emp.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  emp.name?.charAt(0)
                                )}
                              </div>
                            ))}
                            {job.assignedEmployees.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] border-2 border-[var(--color-bg-primary)] flex items-center justify-center text-[var(--color-text-secondary)] text-xs font-medium">
                                +{job.assignedEmployees.length - 3}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Price */}
                        {(job.quotedPrice || job.finalPrice) && (
                          <div className="text-right">
                            <div className="font-semibold text-[var(--color-text-primary)]">
                              {(job.finalPrice || job.quotedPrice)?.toLocaleString()} {job.currency || 'GEL'}
                            </div>
                            {job.finalPrice && job.quotedPrice && job.finalPrice !== job.quotedPrice && (
                              <div className="text-sm text-[var(--color-text-tertiary)] line-through">
                                {job.quotedPrice.toLocaleString()} {job.currency || 'GEL'}
                              </div>
                            )}
                          </div>
                        )}

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
                <Clipboard className="w-8 h-8" style={{ color: ACCENT }} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                {locale === 'ka' ? 'სამუშაოები არ მოიძებნა' : 'No jobs found'}
              </h3>
              <p className="text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto">
                {filter.status || filter.search
                  ? (locale === 'ka' ? 'სცადეთ ფილტრების შეცვლა' : 'Try adjusting your filters')
                  : (locale === 'ka' ? 'შექმენით პირველი სამუშაო თქვენი გუნდისთვის' : 'Create your first job for your team')
                }
              </p>
              <Link
                href="/company/jobs/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200"
                style={{ backgroundColor: ACCENT }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ACCENT_HOVER}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ACCENT}
              >
                <Plus className="w-5 h-5" />
                {locale === 'ka' ? 'ახალი სამუშაო' : 'Create First Job'}
              </Link>
            </div>
          )}

          {/* Pagination */}
          {pagination.hasMore && (
            <div className="p-4 border-t border-[var(--color-border-primary)] text-center">
              <Button
                variant="link"
                onClick={() => fetchJobs(pagination.page + 1)}
                rightIcon={<ArrowUpRight className="w-4 h-4" />}
              >
                {locale === 'ka' ? 'მეტის ჩატვირთვა' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
