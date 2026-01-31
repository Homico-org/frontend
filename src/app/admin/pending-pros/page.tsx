'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { ADMIN_THEME as THEME } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { formatDateShort } from '@/utils/dateUtils';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  Eye,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PendingPro {
  _id: string;
  id?: string; // Alternative ID field
  uid?: number;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  city?: string;
  bio?: string;
  categories?: string[];
  subcategories?: string[];
  selectedCategories?: string[];
  selectedSubcategories?: string[];
  selectedServices?: Array<{
    key: string;
    categoryKey: string;
    name: string;
    nameKa: string;
    experience: string;
  }>;
  basePrice?: number;
  maxPrice?: number;
  pricingModel?: string;
  yearsExperience?: number;
  isProfileCompleted?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  adminRejectionReason?: string;
  createdAt: string;
  portfolioProjects?: Array<{
    title: string;
    description: string;
    imageUrl?: string;
    images?: string[];
  }>;
}

interface PendingProsStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

function AdminPendingProsPageContent() {
  const { isAuthenticated } = useAuth();
  const { locale, t } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const { categories, getCategoryByKey, getSubcategoriesForCategory } = useCategories();

  const [pros, setPros] = useState<PendingPro[]>([]);
  const [stats, setStats] = useState<PendingProsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPro, setSelectedPro] = useState<PendingPro | null>(null);
  const [rejectModalPro, setRejectModalPro] = useState<PendingPro | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Avoid "full page reload" feel on filter changes after first load
  const hasLoadedOnceRef = useRef(false);

  const fetchPendingPros = useCallback(async () => {
    try {
      if (hasLoadedOnceRef.current) setIsRefreshing(true);
      else setIsLoading(true);
      setErrorMessage('');
      const response = await api.get('/admin/pending-pros', {
        params: {
          page,
          limit: 20,
          status: statusFilter,
        },
      });
      setPros(response.data.users);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching pending pros:', error);
      setErrorMessage(t('admin.pendingPros.failedToLoadData'));
    } finally {
      hasLoadedOnceRef.current = true;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, statusFilter, t]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/pending-pros/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingPros();
      fetchStats();
    }
  }, [isAuthenticated, fetchPendingPros, fetchStats]);

  // Helper to get pro ID (supports both _id and id)
  const getProId = (pro: PendingPro): string => pro._id || pro.id || '';

  const handleApprove = async (proId: string) => {
    if (!proId) {
      console.error('Cannot approve: pro ID is undefined');
      toast.error(t('admin.pendingPros.failedToApprove'));
      return;
    }
    try {
      setActionLoading(proId);
      await api.patch(`/admin/pros/${proId}/approve`);
      toast.success(t('admin.pendingPros.approvedToast'));
      fetchPendingPros();
      fetchStats();
      setSelectedPro(null);
    } catch (error) {
      console.error('Error approving pro:', error);
      toast.error(t('admin.pendingPros.failedToApprove'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalPro || !rejectReason.trim()) return;
    
    try {
      const proId = getProId(rejectModalPro);
      setActionLoading(proId);
      await api.patch(`/admin/pros/${proId}/reject`, {
        reason: rejectReason,
      });
      toast.success(t('admin.pendingPros.rejectedToast'));
      fetchPendingPros();
      fetchStats();
      setRejectModalPro(null);
      setRejectReason('');
      setSelectedPro(null);
    } catch (error) {
      console.error('Error rejecting pro:', error);
      toast.error(t('admin.pendingPros.failedToReject'));
    } finally {
      setActionLoading(null);
    }
  };

  const getServiceLabel = (service: { name?: string; nameKa?: string }) => (
    ({ ka: service.nameKa, en: service.name, ru: service.name }[locale] ?? service.name ?? service.nameKa ?? '')
  );

  const getCategoryLabel = (key: string) => {
    const cat = getCategoryByKey(key);
    const fallback = cat?.name || cat?.nameKa || key;
    return ({ ka: cat?.nameKa, en: cat?.name, ru: cat?.name }[locale] ?? fallback);
  };

  const getSubcategoryLabel = (key: string) => {
    for (const cat of categories) {
      const subs = getSubcategoriesForCategory(cat.key);
      const sub = subs.find(s => s.key === key);
      if (sub) {
        const fallback = sub.name || sub.nameKa || key;
        return ({ ka: sub.nameKa, en: sub.name, ru: sub.name }[locale] ?? fallback);
      }
    }
    return key;
  };

  const getExperienceLabel = (exp: string) => {
    const yearUnit = t('timeUnits.year');
    const labels: Record<string, string> = {
      '1-2': `1-2 ${yearUnit}`,
      '3-5': `3-5 ${yearUnit}`,
      '5-10': `5-10 ${yearUnit}`,
      '10+': `10+ ${yearUnit}`,
    };
    return labels[exp] || exp;
  };

  const handleStatusCardClick = (next: typeof statusFilter) => {
    setPage(1);
    setStatusFilter((prev) => (prev === next ? 'all' : next));
  };

  return (
    <div className="min-h-screen" style={{ background: THEME.surface }}>
      {/* Header - Mobile optimized */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{
          background: `${THEME.surface}E6`,
          borderBottom: `1px solid ${THEME.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 -ml-2 rounded-xl transition-colors flex-shrink-0"
                style={{ color: THEME.textMuted }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold truncate" style={{ color: THEME.text }}>
                  {t('admin.pendingPros.title')}
                </h1>
                <p className="text-xs sm:text-sm hidden sm:block" style={{ color: THEME.textMuted }}>
                  {t('admin.pendingPros.subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={() => { fetchPendingPros(); fetchStats(); }}
              disabled={isRefreshing}
              className="p-2.5 -mr-2 rounded-xl transition-colors flex-shrink-0"
              style={{ color: THEME.textMuted }}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-3 sm:mt-4">
          <div
            className="rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm"
            style={{
              background: `${THEME.error}12`,
              border: `1px solid ${THEME.error}33`,
              color: THEME.error,
            }}
          >
            {errorMessage}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Cards - Compact on mobile */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
            <button
              type="button"
              onClick={() => handleStatusCardClick('pending')}
              className="rounded-xl sm:rounded-2xl p-2 sm:p-4 text-left transition-all active:scale-[0.98] sm:hover:scale-[1.01]"
              style={{
                background: THEME.surfaceLight,
                border: `1px solid ${statusFilter === 'pending' ? `${THEME.warning}66` : THEME.border}`,
                boxShadow: statusFilter === 'pending' ? `0 0 0 2px ${THEME.warning}20` : undefined,
              }}
            >
              <div className="flex flex-col sm:flex-row items-center sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl mb-1 sm:mb-0" style={{ background: `${THEME.warning}20` }}>
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: THEME.warning }} />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-2xl font-bold" style={{ color: THEME.text }}>{stats.pending}</p>
                  <p className="text-[10px] sm:text-sm leading-tight" style={{ color: THEME.textMuted }}>
                    {t('common.pending')}
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleStatusCardClick('approved')}
              className="rounded-xl sm:rounded-2xl p-2 sm:p-4 text-left transition-all active:scale-[0.98] sm:hover:scale-[1.01]"
              style={{
                background: THEME.surfaceLight,
                border: `1px solid ${statusFilter === 'approved' ? `${THEME.success}66` : THEME.border}`,
                boxShadow: statusFilter === 'approved' ? `0 0 0 2px ${THEME.success}20` : undefined,
              }}
            >
              <div className="flex flex-col sm:flex-row items-center sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl mb-1 sm:mb-0" style={{ background: `${THEME.success}20` }}>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: THEME.success }} />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-2xl font-bold" style={{ color: THEME.text }}>{stats.approved}</p>
                  <p className="text-[10px] sm:text-sm leading-tight" style={{ color: THEME.textMuted }}>
                    {t('admin.pendingPros.approved')}
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleStatusCardClick('rejected')}
              className="rounded-xl sm:rounded-2xl p-2 sm:p-4 text-left transition-all active:scale-[0.98] sm:hover:scale-[1.01]"
              style={{
                background: THEME.surfaceLight,
                border: `1px solid ${statusFilter === 'rejected' ? `${THEME.error}66` : THEME.border}`,
                boxShadow: statusFilter === 'rejected' ? `0 0 0 2px ${THEME.error}20` : undefined,
              }}
            >
              <div className="flex flex-col sm:flex-row items-center sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl mb-1 sm:mb-0" style={{ background: `${THEME.error}20` }}>
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: THEME.error }} />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-2xl font-bold" style={{ color: THEME.text }}>{stats.rejected}</p>
                  <p className="text-[10px] sm:text-sm leading-tight" style={{ color: THEME.textMuted }}>
                    {t('common.rejected')}
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleStatusCardClick('all')}
              className="rounded-xl sm:rounded-2xl p-2 sm:p-4 text-left transition-all active:scale-[0.98] sm:hover:scale-[1.01]"
              style={{
                background: THEME.surfaceLight,
                border: `1px solid ${statusFilter === 'all' ? `${THEME.info}66` : THEME.border}`,
                boxShadow: statusFilter === 'all' ? `0 0 0 2px ${THEME.info}20` : undefined,
              }}
            >
              <div className="flex flex-col sm:flex-row items-center sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl mb-1 sm:mb-0" style={{ background: `${THEME.info}20` }}>
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: THEME.info }} />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-2xl font-bold" style={{ color: THEME.text }}>{stats.total}</p>
                  <p className="text-[10px] sm:text-sm leading-tight" style={{ color: THEME.textMuted }}>
                    {t('common.total')}
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Professionals List */}
        <div
          className="rounded-xl sm:rounded-2xl overflow-hidden"
          style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
        >
          {isLoading ? (
            <div className="p-6 sm:p-8 text-center">
              <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-3 sm:mb-4 animate-spin" style={{ color: THEME.textMuted }} />
              <p className="text-sm sm:text-base" style={{ color: THEME.textMuted }}>
                {t('common.loading')}
              </p>
            </div>
          ) : pros.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <UserCheck className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4" style={{ color: THEME.textMuted }} />
              <p className="text-sm sm:text-base" style={{ color: THEME.text }}>
                {statusFilter === 'pending'
                  ? t('admin.pendingPros.noPendingProfessionals')
                  : t('admin.pendingPros.noProfessionalsFound')
                }
              </p>
            </div>
          ) : (
            <div>
              {pros.map((pro, index) => (
                <div
                  key={getProId(pro)}
                  className="p-3 sm:p-4 transition-colors cursor-pointer active:bg-opacity-50"
                  style={{
                    borderBottom: index < pros.length - 1 ? `1px solid ${THEME.border}` : 'none',
                  }}
                  onClick={() => setSelectedPro(pro)}
                  onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Mobile: Stacked layout / Desktop: Row layout */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    <Avatar
                      src={pro.avatar}
                      name={pro.name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      {/* Name and status badge row */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base truncate max-w-[150px] sm:max-w-none" style={{ color: THEME.text }}>
                          {pro.name}
                        </h3>
                        {pro.verificationStatus === 'verified' && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0"
                            style={{ background: `${THEME.success}20`, color: THEME.success }}>
                            {t('admin.pendingPros.approved')}
                          </span>
                        )}
                        {pro.verificationStatus === 'rejected' && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0"
                            style={{ background: `${THEME.error}20`, color: THEME.error }}>
                            {t('common.rejected')}
                          </span>
                        )}
                        {pro.verificationStatus !== 'verified' && pro.verificationStatus !== 'rejected' && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0"
                            style={{ background: `${THEME.warning}20`, color: THEME.warning }}>
                            {t('common.pending')}
                          </span>
                        )}
                      </div>

                      {/* Contact info - simplified on mobile */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                        {pro.city && (
                          <span className="flex items-center gap-1" style={{ color: THEME.textMuted }}>
                            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                            <span className="truncate">{pro.city}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1" style={{ color: THEME.textMuted }}>
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                          {formatDateShort(pro.createdAt)}
                        </span>
                        {/* Phone - hidden on mobile, shown on desktop */}
                        {pro.phone && (
                          <span className="hidden sm:flex items-center gap-1" style={{ color: THEME.textMuted }}>
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            {pro.phone}
                          </span>
                        )}
                      </div>

                      {/* Categories/Services - limit shown on mobile */}
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2">
                        {(pro.selectedServices?.slice(0, 2) || []).map((service, i) => (
                          <span
                            key={`service-${i}-${service.key}`}
                            className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium truncate max-w-[100px] sm:max-w-none"
                            style={{ background: `${THEME.primary}20`, color: THEME.primary }}
                          >
                            {getServiceLabel(service)}
                          </span>
                        ))}
                        {(pro.selectedServices?.length || 0) > 2 && (
                          <span
                            className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs"
                            style={{ background: THEME.surface, color: THEME.textMuted }}
                          >
                            +{(pro.selectedServices?.length || 0) - 2}
                          </span>
                        )}
                        {!pro.selectedServices?.length && (pro.selectedSubcategories?.slice(0, 2) || []).map((sub, i) => (
                          <span
                            key={`subcategory-${i}-${sub}`}
                            className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium truncate max-w-[100px] sm:max-w-none"
                            style={{ background: `${THEME.primary}20`, color: THEME.primary }}
                          >
                            {getSubcategoryLabel(sub)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Desktop actions - hidden on mobile */}
                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                      {statusFilter === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectModalPro(pro);
                            }}
                            disabled={actionLoading === getProId(pro)}
                            style={{ borderColor: THEME.error, color: THEME.error }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            {t('admin.reject')}
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(getProId(pro));
                            }}
                            disabled={actionLoading === getProId(pro)}
                            style={{ background: THEME.success, color: '#fff' }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {t('admin.approve')}
                          </Button>
                        </>
                      )}
                      <Link
                        href={`/professionals/${pro.uid || getProId(pro)}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                        style={{ color: THEME.textMuted }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Mobile: Chevron indicator */}
                    <div className="sm:hidden flex-shrink-0 self-center">
                      <ChevronRight className="w-4 h-4" style={{ color: THEME.textMuted }} />
                    </div>
                  </div>

                  {/* Mobile action buttons - shown below content on pending filter */}
                  {statusFilter === 'pending' && (
                    <div className="flex sm:hidden gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${THEME.border}` }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRejectModalPro(pro);
                        }}
                        disabled={actionLoading === getProId(pro)}
                        className="flex-1 h-9"
                        style={{ borderColor: THEME.error, color: THEME.error }}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        {t('admin.reject')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(getProId(pro));
                        }}
                        disabled={actionLoading === getProId(pro)}
                        className="flex-1 h-9"
                        style={{ background: THEME.success, color: '#fff' }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        {t('admin.approve')}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination - Compact on mobile */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between p-3 sm:p-4"
              style={{ borderTop: `1px solid ${THEME.border}` }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="h-9 px-2 sm:px-3"
              >
                <ChevronLeft className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">{t('common.previous')}</span>
              </Button>
              <span className="text-sm" style={{ color: THEME.textMuted }}>
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="h-9 px-2 sm:px-3"
              >
                <span className="hidden sm:inline">{t('common.next')}</span>
                <ChevronRight className="w-4 h-4 sm:ml-1" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal - Bottom sheet on mobile */}
      {selectedPro && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-backdrop"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPro(null);
          }}
        >
          <div
            className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up-sheet sm:animate-none sm:scale-100"
            style={{ background: THEME.surfaceLight }}
          >
            {/* Drag handle for mobile - visual affordance */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 sticky top-0 z-20" style={{ background: THEME.surfaceLight }}>
              <div className="w-12 h-1.5 rounded-full" style={{ background: THEME.border }} />
            </div>

            {/* Modal header - Sticky */}
            <div
              className="sticky top-0 sm:top-0 z-10 flex items-center justify-between px-4 py-3 sm:p-4 -mt-2 sm:mt-0"
              style={{ background: THEME.surfaceLight, borderBottom: `1px solid ${THEME.border}` }}
            >
              <h2 className="text-base sm:text-lg font-semibold" style={{ color: THEME.text }}>
                {t('admin.pendingPros.professionalDetails')}
              </h2>
              <button
                onClick={() => setSelectedPro(null)}
                className="p-2.5 -mr-2 rounded-full active:bg-black/10 transition-colors"
                style={{ color: THEME.textMuted }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* Profile Header - Stacked on mobile */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                <Avatar
                  src={selectedPro.avatar}
                  name={selectedPro.name}
                  size="xl"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl font-bold" style={{ color: THEME.text }}>{selectedPro.name}</h3>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mt-2">
                    {selectedPro.phone && (
                      <a
                        href={`tel:${selectedPro.phone}`}
                        className="flex items-center gap-1 text-xs sm:text-sm active:opacity-70"
                        style={{ color: THEME.textMuted }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {selectedPro.phone}
                      </a>
                    )}
                    {selectedPro.email && (
                      <a
                        href={`mailto:${selectedPro.email}`}
                        className="flex items-center gap-1 text-xs sm:text-sm active:opacity-70 truncate max-w-[180px] sm:max-w-none"
                        style={{ color: THEME.textMuted }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{selectedPro.email}</span>
                      </a>
                    )}
                    {selectedPro.city && (
                      <span className="flex items-center gap-1 text-xs sm:text-sm" style={{ color: THEME.textMuted }}>
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {selectedPro.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedPro.bio && (
                <div className="mb-5 sm:mb-6">
                  <h4 className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: THEME.textMuted }}>
                    {t('admin.pendingPros.bio')}
                  </h4>
                  <p className="text-sm sm:text-base" style={{ color: THEME.text }}>{selectedPro.bio}</p>
                </div>
              )}

              {/* Pricing */}
              {(selectedPro.basePrice || selectedPro.maxPrice) && (
                <div className="mb-5 sm:mb-6">
                  <h4 className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: THEME.textMuted }}>
                    {t('admin.pendingPros.pricing')}
                  </h4>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: THEME.success }} />
                    <span className="text-base sm:text-lg font-semibold" style={{ color: THEME.text }}>
                      {selectedPro.basePrice}
                      {selectedPro.maxPrice && ` - ${selectedPro.maxPrice}`}
                      {' '}₾
                    </span>
                    {selectedPro.pricingModel && (
                      <span className="text-xs sm:text-sm" style={{ color: THEME.textMuted }}>
                        / {selectedPro.pricingModel}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Services */}
              {selectedPro.selectedServices && selectedPro.selectedServices.length > 0 && (
                <div className="mb-5 sm:mb-6">
                  <h4 className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: THEME.textMuted }}>
                    {t('admin.pendingPros.services')}
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {selectedPro.selectedServices.map((service, i) => (
                      <span
                        key={`service-${i}-${service.key}`}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2"
                        style={{ background: `${THEME.primary}20`, color: THEME.primary }}
                      >
                        {getServiceLabel(service)}
                        <span className="text-[10px] sm:text-xs opacity-75">
                          {getExperienceLabel(service.experience)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories (fallback) */}
              {!selectedPro.selectedServices?.length && selectedPro.selectedCategories && selectedPro.selectedCategories.length > 0 && (
                <div className="mb-5 sm:mb-6">
                  <h4 className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: THEME.textMuted }}>
                    {t('admin.pendingPros.categories')}
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {selectedPro.selectedCategories.map((cat, i) => (
                      <span
                        key={`category-${i}-${cat}`}
                        className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
                        style={{ background: THEME.surface, color: THEME.text }}
                      >
                        {getCategoryLabel(cat)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              {selectedPro.portfolioProjects && selectedPro.portfolioProjects.length > 0 && (
                <div className="mb-5 sm:mb-6">
                  <h4 className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: THEME.textMuted }}>
                    {t('admin.pendingPros.portfolio')} ({selectedPro.portfolioProjects.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {selectedPro.portfolioProjects.slice(0, 6).map((project, i) => (
                      <div
                        key={`project-${i}-${project.title}`}
                        className="aspect-square rounded-lg overflow-hidden relative"
                        style={{ background: THEME.surface }}
                      >
                        {(project.imageUrl || project.images?.[0]) && (
                          <Image
                            src={project.imageUrl || project.images?.[0] || ''}
                            alt={project.title}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection reason */}
              {selectedPro.adminRejectionReason && (
                <div
                  className="mb-5 sm:mb-6 p-3 sm:p-4 rounded-xl"
                  style={{ background: `${THEME.error}10`, border: `1px solid ${THEME.error}40` }}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: THEME.error }} />
                    <div>
                      <h4 className="text-sm font-medium mb-1" style={{ color: THEME.error }}>
                        {t('admin.rejectionReason')}
                      </h4>
                      <p className="text-xs sm:text-sm" style={{ color: THEME.error }}>
                        {selectedPro.adminRejectionReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions - Stacked on mobile for pending pros, with safe-area padding */}
              <div
                className="pt-4 pb-6 sm:pb-0"
                style={{ borderTop: `1px solid ${THEME.border}` }}
              >
                {selectedPro.verificationStatus !== 'verified' && selectedPro.verificationStatus !== 'rejected' ? (
                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <Link
                      href={`/professionals/${selectedPro.uid || getProId(selectedPro)}`}
                      target="_blank"
                      className="order-3 sm:order-1 sm:flex-1"
                    >
                      <Button variant="outline" className="w-full h-12 sm:h-9 text-base sm:text-sm">
                        <Eye className="w-4 h-4 mr-2" />
                        {t('common.viewProfile')}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRejectModalPro(selectedPro);
                      }}
                      disabled={actionLoading === getProId(selectedPro)}
                      className="order-2 sm:flex-1 h-12 sm:h-9 text-base sm:text-sm"
                      style={{ borderColor: THEME.error, color: THEME.error }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {t('admin.reject')}
                    </Button>
                    <Button
                      onClick={() => handleApprove(getProId(selectedPro))}
                      disabled={actionLoading === getProId(selectedPro)}
                      className="order-1 sm:order-3 sm:flex-1 h-12 sm:h-9 font-medium text-base sm:text-sm"
                      style={{ background: THEME.success, color: '#fff' }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('admin.approve')}
                    </Button>
                  </div>
                ) : (
                  <Link
                    href={`/professionals/${selectedPro.uid || getProId(selectedPro)}`}
                    target="_blank"
                    className="block"
                  >
                    <Button variant="outline" className="w-full h-12 sm:h-9 text-base sm:text-sm">
                      <Eye className="w-4 h-4 mr-2" />
                      {t('common.viewProfile')}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal - Bottom sheet on mobile */}
      {rejectModalPro && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 animate-fade-backdrop"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setRejectModalPro(null);
              setRejectReason('');
            }
          }}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up-sheet sm:animate-none"
            style={{ background: THEME.surfaceLight }}
          >
            {/* Drag handle for mobile - visual affordance */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full" style={{ background: THEME.border }} />
            </div>
            <div
              className="flex items-center justify-between px-4 py-3 sm:p-4 -mt-1 sm:mt-0"
              style={{ borderBottom: `1px solid ${THEME.border}` }}
            >
              <h2 className="text-base sm:text-lg font-semibold" style={{ color: THEME.text }}>
                {t('admin.pendingPros.rejectProfessional')}
              </h2>
              <button
                onClick={() => {
                  setRejectModalPro(null);
                  setRejectReason('');
                }}
                className="p-2.5 -mr-2 rounded-full active:bg-black/10 transition-colors"
                style={{ color: THEME.textMuted }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Safe area padding at bottom for mobile */}
            <div className="p-4 sm:p-6 pb-10 sm:pb-6">
              <p className="text-sm sm:text-base mb-3 sm:mb-4" style={{ color: THEME.textMuted }}>
                {t('admin.pendingPros.rejectReasonHelp')}
              </p>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('admin.enterRejectionReason')}
                rows={4}
                className="mb-4 text-base"
                style={{ background: THEME.surface, borderColor: THEME.border, color: THEME.text }}
              />
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectModalPro(null);
                    setRejectReason('');
                  }}
                  className="flex-1 h-12 sm:h-9 text-base sm:text-sm"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading === getProId(rejectModalPro)}
                  className="flex-1 h-12 sm:h-9 font-medium text-base sm:text-sm"
                  style={{ background: THEME.error, color: '#fff' }}
                >
                  {t('admin.reject')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPendingProsPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AdminPendingProsPageContent />
    </AuthGuard>
  );
}
