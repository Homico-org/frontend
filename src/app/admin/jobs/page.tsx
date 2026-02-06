"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Avatar from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { ADMIN_THEME as THEME } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import type { BaseEntity } from "@/types/shared";
import { formatDateTimeShort } from "@/utils/dateUtils";
import { getAdminJobStatusColor, getJobStatusLabel } from "@/utils/statusUtils";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Edit2,
  Eye,
  FileText,
  Filter,
  MapPin,
  Play,
  RefreshCw,
  Star,
  Tag,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface AdminJob extends BaseEntity {
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  budget?: {
    min?: number;
    max?: number;
    type?: string;
  };
  location?: string;
  clientId: {
    id: string;
    name: string;
    avatar?: string;
  };
  proposalCount?: number;
  createdAt: string;
}

interface JobStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  thisWeek: number;
  thisMonth: number;
}

interface Proposal {
  _id: string;
  proId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
    avgRating?: number;
    totalReviews?: number;
    verificationStatus?: string;
    city?: string;
  };
  proposedPrice?: number;
  coverLetter?: string;
  status: string;
  createdAt: string;
}

type JobStatusFilter = "all" | "open" | "in_progress" | "completed" | "cancelled";

function AdminJobsPageContent() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();

  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const hasLoadedRef = useRef(false);

  // Modal states
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProposalsModal, setShowProposalsModal] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "open" as AdminJob["status"],
    budgetAmount: 0,
    location: "",
  });

  const fetchData = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh || hasLoadedRef.current) setIsRefreshing(true);
        else setIsLoading(true);

        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "20");
        if (statusFilter !== "all") params.set("status", statusFilter);

        const statsRes = await api.get(`/admin/stats`).catch((err) => {
          console.error("Failed to fetch /admin/stats:", err.response?.status, err.response?.data || err.message);
          return { data: { jobs: {} } };
        });

        let jobsData: AdminJob[] = [];
        let totalPagesData = 1;

        try {
          const jobsRes = await api.get(`/admin/jobs?${params.toString()}`);
          jobsData = jobsRes.data.jobs || [];
          totalPagesData = jobsRes.data.totalPages || 1;
        } catch (err) {
          const apiErr = err as { response?: { status?: number; data?: unknown }; message?: string };
          console.error("Failed to fetch /admin/jobs:", apiErr.response?.status, apiErr.response?.data || apiErr.message);
          try {
            const recentRes = await api.get(`/admin/recent-jobs?limit=50`);
            jobsData = recentRes.data || [];
          } catch (fallbackErr) {
            console.error("Fallback also failed:", fallbackErr);
          }
        }

        setJobs(jobsData);
        setTotalPages(totalPagesData);
        setStats({
          total: statsRes.data.jobs?.total || 0,
          open: statsRes.data.jobs?.open || 0,
          inProgress: statsRes.data.jobs?.inProgress || 0,
          completed: statsRes.data.jobs?.completed || 0,
          cancelled: statsRes.data.jobs?.cancelled || 0,
          thisWeek: statsRes.data.jobs?.thisWeek || 0,
          thisMonth: statsRes.data.jobs?.thisMonth || 0,
        });
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        hasLoadedRef.current = true;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, statusFilter]
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const formatBudget = (budget?: AdminJob["budget"]) => {
    if (!budget) return "-";
    if (budget.min && budget.max) {
      return `₾${budget.min} - ₾${budget.max}`;
    }
    if (budget.min) return `₾${budget.min}+`;
    if (budget.max) return `${t("admin.upTo")} ₾${budget.max}`;
    return "-";
  };

  const getStatusColor = (status: string) => getAdminJobStatusColor(status);
  const getStatusLabel = (status: string) => getJobStatusLabel(status, locale as "en" | "ka" | "ru");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return Play;
      case "in_progress":
        return Clock;
      case "completed":
        return CheckCircle;
      case "cancelled":
        return XCircle;
      default:
        return Briefcase;
    }
  };

  const statCards = useMemo(
    () => [
      { key: "all" as const, label: t("admin.totalJobs"), value: stats?.total || 0, icon: Briefcase, color: THEME.primary },
      { key: "open" as const, label: t("common.open"), value: stats?.open || 0, icon: Play, color: THEME.success },
      { key: "in_progress" as const, label: t("common.inProgress"), value: stats?.inProgress || 0, icon: Clock, color: THEME.warning },
      { key: "completed" as const, label: t("common.completed"), value: stats?.completed || 0, icon: CheckCircle, color: THEME.info },
      { key: "cancelled" as const, label: t("common.cancelled"), value: stats?.cancelled || 0, icon: XCircle, color: THEME.textDim },
    ],
    [stats?.total, stats?.open, stats?.inProgress, stats?.completed, stats?.cancelled, t]
  );

  const handleCardFilterClick = (key: JobStatusFilter) => {
    setStatusFilter((prev) => (prev === key ? "all" : key));
  };

  const getJobId = (job: AdminJob) => {
    const jobIdRaw = (job as any)?._id || (job as any)?.id;
    return typeof jobIdRaw === "string" ? jobIdRaw : jobIdRaw?.toString?.() || "";
  };

  const getClientId = (job: AdminJob) => {
    const clientIdRaw = (job as any)?.clientId?.id || (job as any)?.clientId?._id;
    return typeof clientIdRaw === "string" ? clientIdRaw : clientIdRaw?.toString?.() || "";
  };

  // Open edit modal
  const handleEditClick = (job: AdminJob, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJob(job);
    setEditForm({
      title: job.title,
      description: job.description || "",
      status: job.status,
      budgetAmount: job.budget?.min || 0,
      location: job.location || "",
    });
    setShowEditModal(true);
  };

  // Save job edits
  const handleSaveJob = async () => {
    if (!selectedJob) return;
    setIsSaving(true);
    try {
      const jobId = getJobId(selectedJob);
      await api.patch(`/admin/jobs/${jobId}`, editForm);
      setShowEditModal(false);
      fetchData(true);
    } catch (err) {
      console.error("Failed to update job:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Open delete modal
  const handleDeleteClick = (job: AdminJob, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJob(job);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedJob) return;
    setIsDeleting(true);
    try {
      const jobId = getJobId(selectedJob);
      await api.delete(`/admin/jobs/${jobId}`);
      setShowDeleteModal(false);
      fetchData(true);
    } catch (err) {
      console.error("Failed to delete job:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open proposals modal
  const handleViewProposals = async (job: AdminJob, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJob(job);
    setShowProposalsModal(true);
    setIsLoadingProposals(true);
    try {
      const jobId = getJobId(job);
      const res = await api.get(`/admin/jobs/${jobId}/proposals`);
      setProposals(res.data || []);
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
      setProposals([]);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: THEME.surface }}>
        <div className="text-center">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto animate-pulse"
            style={{ background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})` }}
          >
            <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <p className="mt-4 text-sm" style={{ color: THEME.textMuted }}>
            {t("admin.loadingJobs")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: THEME.surface }}>
      {/* Header - Mobile First */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: `${THEME.surface}E6`, borderBottom: `1px solid ${THEME.border}` }}
      >
        <div className="max-w-[1800px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => router.push("/admin")}
                className="shrink-0 w-9 h-9 sm:w-10 sm:h-10"
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: THEME.textMuted }} />
              </Button>
              <div className="min-w-0">
                <h1
                  className="text-base sm:text-xl font-semibold tracking-tight truncate"
                  style={{ color: THEME.text, fontFamily: "'Inter', sans-serif" }}
                >
                  {t("admin.jobManagement")}
                </h1>
                <p className="text-xs sm:text-sm hidden sm:block" style={{ color: THEME.textMuted }}>
                  {stats?.total.toLocaleString() || 0} {t("admin.jobsTotal")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Filter Toggle */}
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden w-9 h-9"
                style={{
                  background: showFilters ? `${THEME.primary}20` : THEME.surfaceLight,
                  border: `1px solid ${showFilters ? THEME.primary : THEME.border}`,
                }}
              >
                <Filter className="w-4 h-4" style={{ color: showFilters ? THEME.primary : THEME.textMuted }} />
              </Button>

              <Button
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                loading={isRefreshing}
                size="sm"
                className="h-9 px-3 sm:px-4"
                style={{
                  background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
                  boxShadow: `0 4px 16px ${THEME.primary}40`,
                }}
              >
                {!isRefreshing && <RefreshCw className="w-4 h-4 sm:mr-2" />}
                <span className="hidden sm:inline">{t("admin.refresh")}</span>
              </Button>
            </div>
          </div>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t sm:hidden" style={{ borderColor: THEME.border }}>
              <div className="flex flex-wrap gap-2">
                {statCards.map((stat) => (
                  <button
                    key={stat.key}
                    onClick={() => {
                      handleCardFilterClick(stat.key);
                      setPage(1);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: statusFilter === stat.key ? `${stat.color}20` : THEME.surfaceLight,
                      color: statusFilter === stat.key ? stat.color : THEME.textMuted,
                      border: `1px solid ${statusFilter === stat.key ? stat.color : THEME.border}`,
                    }}
                  >
                    <stat.icon className="w-3 h-3" />
                    {stat.label}
                    <span className="font-bold">{stat.value}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Stats Grid - Desktop */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={() => handleCardFilterClick(stat.key)}
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left"
              style={{
                background: THEME.surfaceLight,
                border: statusFilter === stat.key ? `1px solid ${stat.color}80` : `1px solid ${THEME.border}`,
                boxShadow: statusFilter === stat.key ? `0 8px 32px ${stat.color}20` : undefined,
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `radial-gradient(circle at top right, ${stat.color}10, transparent 70%)` }}
              />
              {statusFilter === stat.key && (
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${stat.color}10, transparent 60%)` }} />
              )}
              <div className="relative flex items-center gap-3 sm:gap-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}20` }}
                >
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: stat.color }} />
                </div>
                <div>
                  <p
                    className="text-xl sm:text-2xl font-bold tracking-tight"
                    style={{ color: THEME.text, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm" style={{ color: THEME.textMuted }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Mobile Stats Summary */}
        <div className="sm:hidden flex items-center justify-between mb-4 px-1">
          <p className="text-sm font-medium" style={{ color: THEME.text }}>
            {stats?.total.toLocaleString() || 0} {t("admin.jobsTotal")}
          </p>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{ background: `${THEME.primary}20`, color: THEME.primary }}
            >
              <X className="w-3 h-3" />
              {t("common.clearFilter")}
            </button>
          )}
        </div>

        {/* Jobs List */}
        <div
          className="rounded-xl sm:rounded-2xl overflow-hidden"
          style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
        >
          {/* Table Header - Desktop Only */}
          <div
            className="hidden md:grid px-4 sm:px-6 py-3 sm:py-4 grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider"
            style={{ borderBottom: `1px solid ${THEME.border}`, color: THEME.textDim }}
          >
            <div className="col-span-4">{t("admin.job")}</div>
            <div className="col-span-2">{t("admin.client")}</div>
            <div className="col-span-2">{t("common.status")}</div>
            <div className="col-span-2">{t("admin.posted")}</div>
            <div className="col-span-2 text-right">{t("admin.actions")}</div>
          </div>

          {/* Empty State */}
          {jobs.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: THEME.textDim }} />
              <p className="text-base sm:text-lg font-medium" style={{ color: THEME.textMuted }}>
                {t("admin.noJobsFound")}
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.textDim }}>
                {t("admin.tryAdjustingYourSearchOr")}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y" style={{ borderColor: THEME.border }}>
                {jobs.map((job, index) => {
                  const StatusIcon = getStatusIcon(job.status);
                  const jobId = getJobId(job);
                  const clientId = getClientId(job);

                  return (
                    <div
                      key={jobId || `job-${index}`}
                      className="p-4 active:bg-opacity-50 transition-colors"
                      onClick={() => {
                        if (jobId) router.push(`/jobs/${jobId}`);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${getStatusColor(job.status)}20` }}
                        >
                          <StatusIcon className="w-5 h-5" style={{ color: getStatusColor(job.status) }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate mb-1" style={{ color: THEME.text }}>
                            {job.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" style={{ color: THEME.textDim }}>
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {t(`categories.${job.category}`) || job.category}
                            </span>
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                              style={{ background: `${getStatusColor(job.status)}20`, color: getStatusColor(job.status) }}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {getStatusLabel(job.status)}
                            </span>
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
                              style={{
                                background: `${THEME.accent}18`,
                                border: `1px solid ${THEME.accent}30`,
                                color: THEME.accent,
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              <DollarSign className="w-3 h-3" />
                              {formatBudget(job.budget)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p
                            className="text-[10px] whitespace-nowrap"
                            style={{ color: THEME.textDim, fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {formatDateTimeShort(job.createdAt, locale as "en" | "ka" | "ru")}
                          </p>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => handleViewProposals(job, e)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform active:scale-90"
                              style={{ background: `${THEME.accent}20` }}
                            >
                              <Users className="w-4 h-4" style={{ color: THEME.accent }} />
                            </button>
                            <button
                              onClick={(e) => handleEditClick(job, e)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform active:scale-90"
                              style={{ background: `${THEME.warning}20` }}
                            >
                              <Edit2 className="w-4 h-4" style={{ color: THEME.warning }} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(job, e)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform active:scale-90"
                              style={{ background: `${THEME.error}20` }}
                            >
                              <Trash2 className="w-4 h-4" style={{ color: THEME.error }} />
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Client Row */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: THEME.border }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (clientId) router.push(`/users/${clientId}`);
                          }}
                          className="flex items-center gap-2 min-w-0"
                          disabled={!clientId}
                        >
                          <Avatar src={job.clientId?.avatar} name={job.clientId?.name || "Client"} size="xs" />
                          <span className="text-xs truncate" style={{ color: THEME.textMuted }}>
                            {job.clientId?.name || "Unknown"}
                          </span>
                        </button>
                        {job.proposalCount !== undefined && (
                          <span className="flex items-center gap-1 text-xs ml-auto" style={{ color: THEME.textDim }}>
                            <FileText className="w-3 h-3" />
                            {job.proposalCount} {t("admin.proposals")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                {jobs.map((job, index) => {
                  const StatusIcon = getStatusIcon(job.status);
                  const jobId = getJobId(job);
                  const clientId = getClientId(job);

                  return (
                    <div
                      key={jobId || `job-${index}`}
                      className="px-4 sm:px-6 py-3 sm:py-4 grid grid-cols-12 gap-4 items-center transition-colors cursor-pointer"
                      style={{ borderBottom: index < jobs.length - 1 ? `1px solid ${THEME.border}` : "none" }}
                      onClick={() => {
                        if (jobId) router.push(`/jobs/${jobId}`);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surfaceHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Job Info */}
                      <div className="col-span-4 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium text-sm truncate" style={{ color: THEME.text }}>
                            {job.title}
                          </p>
                          <span
                            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0"
                            style={{
                              background: `${THEME.accent}18`,
                              border: `1px solid ${THEME.accent}30`,
                              color: THEME.accent,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            <DollarSign className="w-3 h-3" />
                            {formatBudget(job.budget)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-xs" style={{ color: THEME.textDim }}>
                            <Tag className="w-3 h-3" />
                            {t(`categories.${job.category}`) || job.category}
                          </span>
                          {job.location && (
                            <>
                              <span style={{ color: THEME.textDim }}>·</span>
                              <span className="flex items-center gap-1 text-xs" style={{ color: THEME.textDim }}>
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="xl:hidden mt-2">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{
                              background: `${THEME.accent}18`,
                              border: `1px solid ${THEME.accent}30`,
                              color: THEME.accent,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            <DollarSign className="w-3 h-3" />
                            {formatBudget(job.budget)}
                          </span>
                        </div>
                      </div>

                      {/* Client */}
                      <div className="col-span-2 flex items-center gap-2">
                        <button
                          type="button"
                          className="flex items-center gap-2 min-w-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (clientId) router.push(`/users/${clientId}`);
                          }}
                          disabled={!clientId}
                          title={clientId ? t("admin.viewClient") : ""}
                        >
                          <Avatar src={job.clientId?.avatar} name={job.clientId?.name || "Client"} size="sm" />
                          <span className="text-sm truncate" style={{ color: THEME.textMuted }}>
                            {job.clientId?.name || "Unknown"}
                          </span>
                        </button>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{ background: `${getStatusColor(job.status)}20`, color: getStatusColor(job.status) }}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {getStatusLabel(job.status)}
                        </span>
                      </div>

                      {/* Posted Date */}
                      <div className="col-span-2">
                        <p
                          className="text-sm"
                          style={{ color: THEME.textMuted, fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {formatDateTimeShort(job.createdAt, locale as "en" | "ka" | "ru")}
                        </p>
                        {job.proposalCount !== undefined && (
                          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: THEME.textDim }}>
                            <FileText className="w-3 h-3" />
                            {job.proposalCount} {t("admin.proposals")}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleViewProposals(job, e)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                          style={{ background: `${THEME.accent}20` }}
                          title={t("admin.viewProposals")}
                        >
                          <Users className="w-4 h-4" style={{ color: THEME.accent }} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (jobId) router.push(`/jobs/${jobId}`);
                          }}
                          disabled={!jobId}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                          style={{ background: `${THEME.info}20` }}
                          title={t("admin.viewJob")}
                        >
                          <Eye className="w-4 h-4" style={{ color: THEME.info }} />
                        </button>
                        <button
                          onClick={(e) => handleEditClick(job, e)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                          style={{ background: `${THEME.warning}20` }}
                          title={t("common.edit")}
                        >
                          <Edit2 className="w-4 h-4" style={{ color: THEME.warning }} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(job, e)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                          style={{ background: `${THEME.error}20` }}
                          title={t("common.delete")}
                        >
                          <Trash2 className="w-4 h-4" style={{ color: THEME.error }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 sm:mt-6 px-1">
            <p className="text-xs sm:text-sm" style={{ color: THEME.textMuted }}>
              {locale === "ka" ? `გვერდი ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 sm:w-10 sm:h-10"
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: THEME.textMuted }} />
              </Button>

              {/* Page Numbers - Desktop Only */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className="w-9 h-9 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: page === pageNum ? THEME.primary : "transparent",
                        color: page === pageNum ? "#fff" : THEME.textMuted,
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="secondary"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 sm:w-10 sm:h-10"
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: THEME.textMuted }} />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Edit Job Modal */}
      {showEditModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: THEME.text }}>
                {t("admin.editJob")}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: THEME.surface }}
              >
                <X className="w-4 h-4" style={{ color: THEME.textMuted }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: THEME.textMuted }}>
                  {t("common.title")}
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm"
                  style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: THEME.textMuted }}>
                  {t("common.description")}
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg text-sm resize-none"
                  style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: THEME.textMuted }}>
                  {t("common.status")}
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AdminJob["status"] })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm"
                  style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
                >
                  <option value="open">{t("common.open")}</option>
                  <option value="in_progress">{t("common.inProgress")}</option>
                  <option value="completed">{t("common.completed")}</option>
                  <option value="cancelled">{t("common.cancelled")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: THEME.textMuted }}>
                  {t("common.budget")} (₾)
                </label>
                <input
                  type="number"
                  value={editForm.budgetAmount}
                  onChange={(e) => setEditForm({ ...editForm, budgetAmount: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm"
                  style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: THEME.textMuted }}>
                  {t("common.location")}
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg text-sm"
                  style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
                style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSaveJob}
                loading={isSaving}
                style={{ background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`, color: "#fff" }}
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${THEME.error}20` }}
              >
                <Trash2 className="w-6 h-6" style={{ color: THEME.error }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: THEME.text }}>
                  {t("admin.deleteJob")}
                </h2>
                <p className="text-sm" style={{ color: THEME.textMuted }}>
                  {t("admin.deleteJobConfirmation")}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg mb-6" style={{ background: THEME.surface }}>
              <p className="font-medium text-sm" style={{ color: THEME.text }}>
                {selectedJob.title}
              </p>
              <p className="text-xs mt-1" style={{ color: THEME.textDim }}>
                {selectedJob.proposalCount || 0} {t("admin.proposals")} • {selectedJob.clientId?.name}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleConfirmDelete}
                loading={isDeleting}
                style={{ background: THEME.error, color: "#fff" }}
              >
                {t("common.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Proposals Modal */}
      {showProposalsModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: THEME.text }}>
                  {t("admin.jobProposals")}
                </h2>
                <p className="text-sm" style={{ color: THEME.textMuted }}>
                  {selectedJob.title}
                </p>
              </div>
              <button
                onClick={() => setShowProposalsModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: THEME.surface }}
              >
                <X className="w-4 h-4" style={{ color: THEME.textMuted }} />
              </button>
            </div>

            {isLoadingProposals ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: THEME.primary }} />
                <p className="text-sm mt-3" style={{ color: THEME.textMuted }}>{t("common.loading")}</p>
              </div>
            ) : proposals.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-3" style={{ color: THEME.textDim }} />
                <p className="text-sm" style={{ color: THEME.textMuted }}>{t("admin.noProposalsYet")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((proposal) => (
                  <div
                    key={proposal._id}
                    className="p-4 rounded-xl"
                    style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar src={proposal.proId?.avatar} name={proposal.proId?.name || "Pro"} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm" style={{ color: THEME.text }}>
                            {proposal.proId?.name || "Unknown"}
                          </p>
                          {proposal.proId?.verificationStatus === "verified" && (
                            <CheckCircle className="w-4 h-4" style={{ color: THEME.success }} />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {proposal.proId?.avgRating ? (
                            <span className="flex items-center gap-1 text-xs" style={{ color: THEME.warning }}>
                              <Star className="w-3 h-3 fill-current" />
                              {proposal.proId.avgRating.toFixed(1)}
                            </span>
                          ) : null}
                          {proposal.proId?.city && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: THEME.textDim }}>
                              <MapPin className="w-3 h-3" />
                              {proposal.proId.city}
                            </span>
                          )}
                          {proposal.proId?.phone && (
                            <span className="text-xs" style={{ color: THEME.textDim }}>
                              {proposal.proId.phone}
                            </span>
                          )}
                        </div>
                        {proposal.coverLetter && (
                          <p className="text-xs mt-2 line-clamp-2" style={{ color: THEME.textMuted }}>
                            {proposal.coverLetter}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold" style={{ color: THEME.accent, fontFamily: "'JetBrains Mono', monospace" }}>
                          ₾{proposal.proposedPrice}
                        </p>
                        <span
                          className="inline-block px-2 py-0.5 rounded-md text-xs font-medium mt-1"
                          style={{
                            background: proposal.status === "accepted" ? `${THEME.success}20` : proposal.status === "rejected" ? `${THEME.error}20` : `${THEME.warning}20`,
                            color: proposal.status === "accepted" ? THEME.success : proposal.status === "rejected" ? THEME.error : THEME.warning,
                          }}
                        >
                          {proposal.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminJobsPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminJobsPageContent />
    </AuthGuard>
  );
}
