'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import Select from '@/components/common/Select';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
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
    Search,
    UserCheck,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

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
  isAdminApproved?: boolean;
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
  const { locale } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const { categories, getCategoryByKey, getSubcategoriesForCategory } = useCategories();

  const [pros, setPros] = useState<PendingPro[]>([]);
  const [stats, setStats] = useState<PendingProsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPro, setSelectedPro] = useState<PendingPro | null>(null);
  const [rejectModalPro, setRejectModalPro] = useState<PendingPro | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPendingPros = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setErrorMessage('');
      const response = await api.get('/admin/pending-pros', {
        params: {
          page,
          limit: 20,
          search: searchQuery || undefined,
          status: statusFilter,
        },
      });
      setPros(response.data.users);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching pending pros:', error);
      setErrorMessage(locale === 'ka' ? 'ვერ მოხერხდა მონაცემების ჩატვირთვა' : 'Failed to load data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, searchQuery, statusFilter]);

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
      toast.error(locale === 'ka' ? 'ვერ მოხერხდა დამტკიცება' : 'Failed to approve');
      return;
    }
    try {
      setActionLoading(proId);
      await api.patch(`/admin/pros/${proId}/approve`);
      toast.success(locale === 'ka' ? 'დამტკიცებულია' : 'Approved');
      fetchPendingPros();
      fetchStats();
      setSelectedPro(null);
    } catch (error) {
      console.error('Error approving pro:', error);
      toast.error(locale === 'ka' ? 'ვერ მოხერხდა დამტკიცება' : 'Failed to approve');
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
      toast.success(locale === 'ka' ? 'უარყოფილია' : 'Rejected');
      fetchPendingPros();
      fetchStats();
      setRejectModalPro(null);
      setRejectReason('');
      setSelectedPro(null);
    } catch (error) {
      console.error('Error rejecting pro:', error);
      toast.error(locale === 'ka' ? 'ვერ მოხერხდა უარყოფა' : 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const getCategoryLabel = (key: string) => {
    const cat = getCategoryByKey(key);
    return locale === 'ka' ? cat?.nameKa || key : cat?.name || key;
  };

  const getSubcategoryLabel = (key: string) => {
    for (const cat of categories) {
      const subs = getSubcategoriesForCategory(cat.key);
      const sub = subs.find(s => s.key === key);
      if (sub) {
        return locale === 'ka' ? sub.nameKa || sub.name : sub.name;
      }
    }
    return key;
  };

  const getExperienceLabel = (exp: string) => {
    const labels: Record<string, string> = {
      '1-2': '1-2 წელი',
      '3-5': '3-5 წელი',
      '5-10': '5-10 წელი',
      '10+': '10+ წელი',
    };
    return labels[exp] || exp;
  };

  const statusOptions = [
    { value: 'pending', label: locale === 'ka' ? 'მოლოდინში' : 'Pending' },
    { value: 'approved', label: locale === 'ka' ? 'დამტკიცებული' : 'Approved' },
    { value: 'rejected', label: locale === 'ka' ? 'უარყოფილი' : 'Rejected' },
    { value: 'all', label: locale === 'ka' ? 'ყველა' : 'All' },
  ];

  return (
    <div className="min-h-screen" style={{ background: THEME.surface }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ 
          background: `${THEME.surface}E6`,
          borderBottom: `1px solid ${THEME.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 rounded-xl transition-colors"
                style={{ color: THEME.textMuted }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: THEME.text }}>
                  {locale === 'ka' ? 'პროფესიონალების დამტკიცება' : 'Professional Approvals'}
                </h1>
                <p className="text-sm" style={{ color: THEME.textMuted }}>
                  {locale === 'ka' ? 'განხილეთ და დაამტკიცეთ ახალი პროფესიონალები' : 'Review and approve new professionals'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { fetchPendingPros(); fetchStats(); }}
              disabled={isRefreshing}
              className="p-2 rounded-xl transition-colors"
              style={{ color: THEME.textMuted }}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className="rounded-xl px-4 py-3 text-sm"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div 
              className="rounded-2xl p-4"
              style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: `${THEME.warning}20` }}>
                  <Clock className="w-5 h-5" style={{ color: THEME.warning }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: THEME.text }}>{stats.pending}</p>
                  <p className="text-sm" style={{ color: THEME.textMuted }}>
                    {locale === 'ka' ? 'მოლოდინში' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
            <div 
              className="rounded-2xl p-4"
              style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: `${THEME.success}20` }}>
                  <CheckCircle className="w-5 h-5" style={{ color: THEME.success }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: THEME.text }}>{stats.approved}</p>
                  <p className="text-sm" style={{ color: THEME.textMuted }}>
                    {locale === 'ka' ? 'დამტკიცებული' : 'Approved'}
                  </p>
                </div>
              </div>
            </div>
            <div 
              className="rounded-2xl p-4"
              style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: `${THEME.error}20` }}>
                  <XCircle className="w-5 h-5" style={{ color: THEME.error }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: THEME.text }}>{stats.rejected}</p>
                  <p className="text-sm" style={{ color: THEME.textMuted }}>
                    {locale === 'ka' ? 'უარყოფილი' : 'Rejected'}
                  </p>
                </div>
              </div>
            </div>
            <div 
              className="rounded-2xl p-4"
              style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: `${THEME.info}20` }}>
                  <Users className="w-5 h-5" style={{ color: THEME.info }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: THEME.text }}>{stats.total}</p>
                  <p className="text-sm" style={{ color: THEME.textMuted }}>
                    {locale === 'ka' ? 'სულ' : 'Total'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div 
          className="rounded-2xl p-4 mb-6"
          style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: THEME.textMuted }}
              />
              <Input
                placeholder={locale === 'ka' ? 'ძებნა სახელით, ტელეფონით...' : 'Search by name, phone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{ background: THEME.surface, borderColor: THEME.border, color: THEME.text }}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as 'pending' | 'approved' | 'rejected' | 'all')}
                placeholder={locale === 'ka' ? 'სტატუსი' : 'Status'}
              />
            </div>
          </div>
        </div>

        {/* Professionals List */}
        <div 
          className="rounded-2xl overflow-hidden"
          style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
        >
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: THEME.textMuted }} />
              <p style={{ color: THEME.textMuted }}>
                {locale === 'ka' ? 'იტვირთება...' : 'Loading...'}
              </p>
            </div>
          ) : pros.length === 0 ? (
            <div className="p-8 text-center">
              <UserCheck className="w-12 h-12 mx-auto mb-4" style={{ color: THEME.textMuted }} />
              <p style={{ color: THEME.text }}>
                {statusFilter === 'pending' 
                  ? (locale === 'ka' ? 'მოლოდინში არ არის პროფესიონალები' : 'No pending professionals')
                  : (locale === 'ka' ? 'პროფესიონალები ვერ მოიძებნა' : 'No professionals found')
                }
              </p>
            </div>
          ) : (
            <div>
              {pros.map((pro, index) => (
                <div
                  key={getProId(pro)}
                  className="p-4 transition-colors cursor-pointer"
                  style={{ 
                    borderBottom: index < pros.length - 1 ? `1px solid ${THEME.border}` : 'none',
                  }}
                  onClick={() => setSelectedPro(pro)}
                  onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={pro.avatar}
                      name={pro.name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate" style={{ color: THEME.text }}>{pro.name}</h3>
                        {pro.isAdminApproved === true && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: `${THEME.success}20`, color: THEME.success }}>
                            {locale === 'ka' ? 'დამტკიცებული' : 'Approved'}
                          </span>
                        )}
                        {pro.adminRejectionReason && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: `${THEME.error}20`, color: THEME.error }}>
                            {locale === 'ka' ? 'უარყოფილი' : 'Rejected'}
                          </span>
                        )}
                        {!pro.isAdminApproved && !pro.adminRejectionReason && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: `${THEME.warning}20`, color: THEME.warning }}>
                            {locale === 'ka' ? 'მოლოდინში' : 'Pending'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {pro.phone && (
                          <span className="flex items-center gap-1" style={{ color: THEME.textMuted }}>
                            <Phone className="w-3.5 h-3.5" />
                            {pro.phone}
                          </span>
                        )}
                        {pro.city && (
                          <span className="flex items-center gap-1" style={{ color: THEME.textMuted }}>
                            <MapPin className="w-3.5 h-3.5" />
                            {pro.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1" style={{ color: THEME.textMuted }}>
                          <Clock className="w-3.5 h-3.5" />
                          {formatDateShort(pro.createdAt)}
                        </span>
                      </div>
                      {/* Categories/Services */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(pro.selectedServices?.slice(0, 3) || []).map((service, i) => (
                          <span
                            key={`service-${i}-${service.key}`}
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: `${THEME.primary}20`, color: THEME.primary }}
                          >
                            {locale === 'ka' ? service.nameKa : service.name}
                          </span>
                        ))}
                        {(pro.selectedServices?.length || 0) > 3 && (
                          <span 
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{ background: THEME.surface, color: THEME.textMuted }}
                          >
                            +{(pro.selectedServices?.length || 0) - 3}
                          </span>
                        )}
                        {!pro.selectedServices?.length && (pro.selectedSubcategories?.slice(0, 3) || []).map((sub, i) => (
                          <span
                            key={`subcategory-${i}-${sub}`}
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: `${THEME.primary}20`, color: THEME.primary }}
                          >
                            {getSubcategoryLabel(sub)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                            {locale === 'ka' ? 'უარყოფა' : 'Reject'}
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
                            {locale === 'ka' ? 'დამტკიცება' : 'Approve'}
                          </Button>
                        </>
                      )}
                      <Link
                        href={`/professionals/${pro.uid || getProId(pro)}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg"
                        style={{ color: THEME.textMuted }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div 
              className="flex items-center justify-between p-4"
              style={{ borderTop: `1px solid ${THEME.border}` }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {locale === 'ka' ? 'წინა' : 'Previous'}
              </Button>
              <span style={{ color: THEME.textMuted }}>
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                {locale === 'ka' ? 'შემდეგი' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedPro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            style={{ background: THEME.surfaceLight }}
          >
            <div 
              className="sticky top-0 flex items-center justify-between p-4"
              style={{ background: THEME.surfaceLight, borderBottom: `1px solid ${THEME.border}` }}
            >
              <h2 className="text-lg font-semibold" style={{ color: THEME.text }}>
                {locale === 'ka' ? 'პროფესიონალის დეტალები' : 'Professional Details'}
              </h2>
              <button
                onClick={() => setSelectedPro(null)}
                className="p-2 rounded-lg"
                style={{ color: THEME.textMuted }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4 mb-6">
                <Avatar
                  src={selectedPro.avatar}
                  name={selectedPro.name}
                  size="xl"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold" style={{ color: THEME.text }}>{selectedPro.name}</h3>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {selectedPro.phone && (
                      <span className="flex items-center gap-1 text-sm" style={{ color: THEME.textMuted }}>
                        <Phone className="w-4 h-4" />
                        {selectedPro.phone}
                      </span>
                    )}
                    {selectedPro.email && (
                      <span className="flex items-center gap-1 text-sm" style={{ color: THEME.textMuted }}>
                        <Mail className="w-4 h-4" />
                        {selectedPro.email}
                      </span>
                    )}
                    {selectedPro.city && (
                      <span className="flex items-center gap-1 text-sm" style={{ color: THEME.textMuted }}>
                        <MapPin className="w-4 h-4" />
                        {selectedPro.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedPro.bio && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2" style={{ color: THEME.textMuted }}>
                    {locale === 'ka' ? 'ბიო' : 'Bio'}
                  </h4>
                  <p style={{ color: THEME.text }}>{selectedPro.bio}</p>
                </div>
              )}

              {/* Pricing */}
              {(selectedPro.basePrice || selectedPro.maxPrice) && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2" style={{ color: THEME.textMuted }}>
                    {locale === 'ka' ? 'ფასი' : 'Pricing'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" style={{ color: THEME.success }} />
                    <span className="text-lg font-semibold" style={{ color: THEME.text }}>
                      {selectedPro.basePrice}
                      {selectedPro.maxPrice && ` - ${selectedPro.maxPrice}`}
                      {' '}₾
                    </span>
                    {selectedPro.pricingModel && (
                      <span className="text-sm" style={{ color: THEME.textMuted }}>
                        / {selectedPro.pricingModel}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Services */}
              {selectedPro.selectedServices && selectedPro.selectedServices.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2" style={{ color: THEME.textMuted }}>
                    {locale === 'ka' ? 'სერვისები' : 'Services'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPro.selectedServices.map((service, i) => (
                      <span
                        key={`service-${i}-${service.key}`}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
                        style={{ background: `${THEME.primary}20`, color: THEME.primary }}
                      >
                        {locale === 'ka' ? service.nameKa : service.name}
                        <span className="text-xs opacity-75">
                          {getExperienceLabel(service.experience)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories (fallback) */}
              {!selectedPro.selectedServices?.length && selectedPro.selectedCategories && selectedPro.selectedCategories.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2" style={{ color: THEME.textMuted }}>
                    {locale === 'ka' ? 'კატეგორიები' : 'Categories'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPro.selectedCategories.map((cat, i) => (
                      <span
                        key={`category-${i}-${cat}`}
                        className="px-3 py-1 rounded-full text-sm"
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
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2" style={{ color: THEME.textMuted }}>
                    {locale === 'ka' ? 'პორტფოლიო' : 'Portfolio'} ({selectedPro.portfolioProjects.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
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
                  className="mb-6 p-4 rounded-xl"
                  style={{ background: `${THEME.error}10`, border: `1px solid ${THEME.error}40` }}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: THEME.error }} />
                    <div>
                      <h4 className="font-medium mb-1" style={{ color: THEME.error }}>
                        {locale === 'ka' ? 'უარყოფის მიზეზი' : 'Rejection Reason'}
                      </h4>
                      <p className="text-sm" style={{ color: THEME.error }}>
                        {selectedPro.adminRejectionReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div 
                className="flex gap-3 pt-4"
                style={{ borderTop: `1px solid ${THEME.border}` }}
              >
                <Link
                  href={`/professionals/${selectedPro.uid || getProId(selectedPro)}`}
                  target="_blank"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    {locale === 'ka' ? 'პროფილის ნახვა' : 'View Profile'}
                  </Button>
                </Link>
                {!selectedPro.isAdminApproved && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRejectModalPro(selectedPro);
                      }}
                      disabled={actionLoading === getProId(selectedPro)}
                      className="flex-1"
                      style={{ borderColor: THEME.error, color: THEME.error }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {locale === 'ka' ? 'უარყოფა' : 'Reject'}
                    </Button>
                    <Button
                      onClick={() => handleApprove(getProId(selectedPro))}
                      disabled={actionLoading === getProId(selectedPro)}
                      className="flex-1"
                      style={{ background: THEME.success, color: '#fff' }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {locale === 'ka' ? 'დამტკიცება' : 'Approve'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalPro && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-2xl shadow-2xl"
            style={{ background: THEME.surfaceLight }}
          >
            <div 
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${THEME.border}` }}
            >
              <h2 className="text-lg font-semibold" style={{ color: THEME.text }}>
                {locale === 'ka' ? 'პროფესიონალის უარყოფა' : 'Reject Professional'}
              </h2>
              <button
                onClick={() => {
                  setRejectModalPro(null);
                  setRejectReason('');
                }}
                className="p-2 rounded-lg"
                style={{ color: THEME.textMuted }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="mb-4" style={{ color: THEME.textMuted }}>
                {locale === 'ka' 
                  ? 'გთხოვთ მიუთითოთ უარყოფის მიზეზი. ეს ინფორმაცია გაეგზავნება პროფესიონალს.'
                  : 'Please provide a reason for rejection. This will be sent to the professional.'}
              </p>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={locale === 'ka' ? 'უარყოფის მიზეზი...' : 'Reason for rejection...'}
                rows={4}
                className="mb-4"
                style={{ background: THEME.surface, borderColor: THEME.border, color: THEME.text }}
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectModalPro(null);
                    setRejectReason('');
                  }}
                  className="flex-1"
                >
                  {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading === getProId(rejectModalPro)}
                  className="flex-1"
                  style={{ background: THEME.error, color: '#fff' }}
                >
                  {locale === 'ka' ? 'უარყოფა' : 'Reject'}
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
