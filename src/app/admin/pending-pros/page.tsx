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
  Users,
  Search,
  UserCheck,
  UserX,
  ArrowLeft,
  RefreshCw,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  Briefcase,
  Star,
  Phone,
  Mail,
  ExternalLink,
  X,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { formatDateShort } from '@/utils/dateUtils';
import { ADMIN_THEME as THEME } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { useCategories } from '@/contexts/CategoriesContext';
import Link from 'next/link';

interface PendingPro {
  _id: string;
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
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { getCategoryByKey, getSubcategoryByKey } = useCategories();

  const [pros, setPros] = useState<PendingPro[]>([]);
  const [stats, setStats] = useState<PendingProsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const handleApprove = async (proId: string) => {
    try {
      setActionLoading(proId);
      await api.patch(`/admin/pros/${proId}/approve`);
      fetchPendingPros();
      fetchStats();
      setSelectedPro(null);
    } catch (error) {
      console.error('Error approving pro:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalPro || !rejectReason.trim()) return;
    
    try {
      setActionLoading(rejectModalPro._id);
      await api.patch(`/admin/pros/${rejectModalPro._id}/reject`, {
        reason: rejectReason,
      });
      fetchPendingPros();
      fetchStats();
      setRejectModalPro(null);
      setRejectReason('');
      setSelectedPro(null);
    } catch (error) {
      console.error('Error rejecting pro:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getCategoryLabel = (key: string) => {
    const cat = getCategoryByKey(key);
    return locale === 'ka' ? cat?.nameKa || key : cat?.name || key;
  };

  const getSubcategoryLabel = (key: string) => {
    const sub = getSubcategoryByKey(key);
    return locale === 'ka' ? sub?.nameKa || key : sub?.name || key;
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
    <div className={`min-h-screen ${THEME.background}`}>
      {/* Header */}
      <header className={`sticky top-0 z-30 ${THEME.card} border-b ${THEME.border} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className={`p-2 rounded-xl ${THEME.hover} transition-colors`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-xl font-semibold ${THEME.text}`}>
                  {locale === 'ka' ? 'პროფესიონალების დამტკიცება' : 'Professional Approvals'}
                </h1>
                <p className={`text-sm ${THEME.textSecondary}`}>
                  {locale === 'ka' ? 'განხილეთ და დაამტკიცეთ ახალი პროფესიონალები' : 'Review and approve new professionals'}
                </p>
              </div>
            </div>
            <button
              onClick={() => { fetchPendingPros(); fetchStats(); }}
              disabled={isRefreshing}
              className={`p-2 rounded-xl ${THEME.hover} transition-colors`}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={`${THEME.card} rounded-2xl p-4 border ${THEME.border}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${THEME.text}`}>{stats.pending}</p>
                  <p className={`text-sm ${THEME.textSecondary}`}>
                    {locale === 'ka' ? 'მოლოდინში' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
            <div className={`${THEME.card} rounded-2xl p-4 border ${THEME.border}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${THEME.text}`}>{stats.approved}</p>
                  <p className={`text-sm ${THEME.textSecondary}`}>
                    {locale === 'ka' ? 'დამტკიცებული' : 'Approved'}
                  </p>
                </div>
              </div>
            </div>
            <div className={`${THEME.card} rounded-2xl p-4 border ${THEME.border}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${THEME.text}`}>{stats.rejected}</p>
                  <p className={`text-sm ${THEME.textSecondary}`}>
                    {locale === 'ka' ? 'უარყოფილი' : 'Rejected'}
                  </p>
                </div>
              </div>
            </div>
            <div className={`${THEME.card} rounded-2xl p-4 border ${THEME.border}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${THEME.text}`}>{stats.total}</p>
                  <p className={`text-sm ${THEME.textSecondary}`}>
                    {locale === 'ka' ? 'სულ' : 'Total'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={`${THEME.card} rounded-2xl p-4 border ${THEME.border} mb-6`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${THEME.textSecondary}`} />
              <Input
                placeholder={locale === 'ka' ? 'ძებნა სახელით, ტელეფონით...' : 'Search by name, phone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
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
        <div className={`${THEME.card} rounded-2xl border ${THEME.border} overflow-hidden`}>
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className={`w-8 h-8 mx-auto mb-4 animate-spin ${THEME.textSecondary}`} />
              <p className={THEME.textSecondary}>
                {locale === 'ka' ? 'იტვირთება...' : 'Loading...'}
              </p>
            </div>
          ) : pros.length === 0 ? (
            <div className="p-8 text-center">
              <UserCheck className={`w-12 h-12 mx-auto mb-4 ${THEME.textSecondary}`} />
              <p className={THEME.text}>
                {statusFilter === 'pending' 
                  ? (locale === 'ka' ? 'მოლოდინში არ არის პროფესიონალები' : 'No pending professionals')
                  : (locale === 'ka' ? 'პროფესიონალები ვერ მოიძებნა' : 'No professionals found')
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {pros.map((pro) => (
                <div
                  key={pro._id}
                  className={`p-4 ${THEME.hover} transition-colors cursor-pointer`}
                  onClick={() => setSelectedPro(pro)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={pro.avatar}
                      name={pro.name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${THEME.text} truncate`}>{pro.name}</h3>
                        {pro.isAdminApproved === true && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            {locale === 'ka' ? 'დამტკიცებული' : 'Approved'}
                          </span>
                        )}
                        {pro.adminRejectionReason && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                            {locale === 'ka' ? 'უარყოფილი' : 'Rejected'}
                          </span>
                        )}
                        {!pro.isAdminApproved && !pro.adminRejectionReason && (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                            {locale === 'ka' ? 'მოლოდინში' : 'Pending'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {pro.phone && (
                          <span className={`flex items-center gap-1 ${THEME.textSecondary}`}>
                            <Phone className="w-3.5 h-3.5" />
                            {pro.phone}
                          </span>
                        )}
                        {pro.city && (
                          <span className={`flex items-center gap-1 ${THEME.textSecondary}`}>
                            <MapPin className="w-3.5 h-3.5" />
                            {pro.city}
                          </span>
                        )}
                        <span className={`flex items-center gap-1 ${THEME.textSecondary}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {formatDateShort(pro.createdAt)}
                        </span>
                      </div>
                      {/* Categories/Services */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(pro.selectedServices?.slice(0, 3) || []).map((service, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-[#C4735B]/10 text-[#C4735B] text-xs font-medium"
                          >
                            {locale === 'ka' ? service.nameKa : service.name}
                          </span>
                        ))}
                        {(pro.selectedServices?.length || 0) > 3 && (
                          <span className={`px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 ${THEME.textSecondary} text-xs`}>
                            +{(pro.selectedServices?.length || 0) - 3}
                          </span>
                        )}
                        {!pro.selectedServices?.length && (pro.selectedSubcategories?.slice(0, 3) || []).map((sub, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-[#C4735B]/10 text-[#C4735B] text-xs font-medium"
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
                            disabled={actionLoading === pro._id}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            {locale === 'ka' ? 'უარყოფა' : 'Reject'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(pro._id);
                            }}
                            disabled={actionLoading === pro._id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {locale === 'ka' ? 'დამტკიცება' : 'Approve'}
                          </Button>
                        </>
                      )}
                      <Link
                        href={`/professionals/${pro._id}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className={`p-2 rounded-lg ${THEME.hover}`}
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
            <div className={`flex items-center justify-between p-4 border-t ${THEME.border}`}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {locale === 'ka' ? 'წინა' : 'Previous'}
              </Button>
              <span className={THEME.textSecondary}>
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
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto ${THEME.card} rounded-2xl shadow-2xl`}>
            <div className={`sticky top-0 flex items-center justify-between p-4 border-b ${THEME.border} ${THEME.card}`}>
              <h2 className={`text-lg font-semibold ${THEME.text}`}>
                {locale === 'ka' ? 'პროფესიონალის დეტალები' : 'Professional Details'}
              </h2>
              <button
                onClick={() => setSelectedPro(null)}
                className={`p-2 rounded-lg ${THEME.hover}`}
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
                  <h3 className={`text-xl font-bold ${THEME.text}`}>{selectedPro.name}</h3>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {selectedPro.phone && (
                      <span className={`flex items-center gap-1 text-sm ${THEME.textSecondary}`}>
                        <Phone className="w-4 h-4" />
                        {selectedPro.phone}
                      </span>
                    )}
                    {selectedPro.email && (
                      <span className={`flex items-center gap-1 text-sm ${THEME.textSecondary}`}>
                        <Mail className="w-4 h-4" />
                        {selectedPro.email}
                      </span>
                    )}
                    {selectedPro.city && (
                      <span className={`flex items-center gap-1 text-sm ${THEME.textSecondary}`}>
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
                  <h4 className={`text-sm font-medium ${THEME.textSecondary} mb-2`}>
                    {locale === 'ka' ? 'ბიო' : 'Bio'}
                  </h4>
                  <p className={THEME.text}>{selectedPro.bio}</p>
                </div>
              )}

              {/* Pricing */}
              {(selectedPro.basePrice || selectedPro.maxPrice) && (
                <div className="mb-6">
                  <h4 className={`text-sm font-medium ${THEME.textSecondary} mb-2`}>
                    {locale === 'ka' ? 'ფასი' : 'Pricing'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className={`text-lg font-semibold ${THEME.text}`}>
                      {selectedPro.basePrice}
                      {selectedPro.maxPrice && ` - ${selectedPro.maxPrice}`}
                      {' '}₾
                    </span>
                    {selectedPro.pricingModel && (
                      <span className={`text-sm ${THEME.textSecondary}`}>
                        / {selectedPro.pricingModel}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Services */}
              {selectedPro.selectedServices && selectedPro.selectedServices.length > 0 && (
                <div className="mb-6">
                  <h4 className={`text-sm font-medium ${THEME.textSecondary} mb-2`}>
                    {locale === 'ka' ? 'სერვისები' : 'Services'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPro.selectedServices.map((service, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-lg bg-[#C4735B]/10 text-[#C4735B] text-sm font-medium flex items-center gap-2"
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
                  <h4 className={`text-sm font-medium ${THEME.textSecondary} mb-2`}>
                    {locale === 'ka' ? 'კატეგორიები' : 'Categories'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPro.selectedCategories.map((cat, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm"
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
                  <h4 className={`text-sm font-medium ${THEME.textSecondary} mb-2`}>
                    {locale === 'ka' ? 'პორტფოლიო' : 'Portfolio'} ({selectedPro.portfolioProjects.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedPro.portfolioProjects.slice(0, 6).map((project, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                        {(project.imageUrl || project.images?.[0]) && (
                          <img
                            src={project.imageUrl || project.images?.[0]}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection reason */}
              {selectedPro.adminRejectionReason && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-700 dark:text-red-400 mb-1">
                        {locale === 'ka' ? 'უარყოფის მიზეზი' : 'Rejection Reason'}
                      </h4>
                      <p className="text-sm text-red-600 dark:text-red-300">
                        {selectedPro.adminRejectionReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <Link
                  href={`/professionals/${selectedPro._id}`}
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
                      disabled={actionLoading === selectedPro._id}
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {locale === 'ka' ? 'უარყოფა' : 'Reject'}
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedPro._id)}
                      disabled={actionLoading === selectedPro._id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
          <div className={`w-full max-w-md ${THEME.card} rounded-2xl shadow-2xl`}>
            <div className={`flex items-center justify-between p-4 border-b ${THEME.border}`}>
              <h2 className={`text-lg font-semibold ${THEME.text}`}>
                {locale === 'ka' ? 'პროფესიონალის უარყოფა' : 'Reject Professional'}
              </h2>
              <button
                onClick={() => {
                  setRejectModalPro(null);
                  setRejectReason('');
                }}
                className={`p-2 rounded-lg ${THEME.hover}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className={`mb-4 ${THEME.textSecondary}`}>
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
                  disabled={!rejectReason.trim() || actionLoading === rejectModalPro._id}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
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
