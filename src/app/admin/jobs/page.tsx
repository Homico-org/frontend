"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Avatar from "@/components/common/Avatar";
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
  Eye,
  FileText,
  MapPin,
  Play,
  RefreshCw,
  Tag,
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

type JobStatusFilter =
  | "all"
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled";

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
  const hasLoadedRef = useRef(false);

  const fetchData = useCallback(
    async (showRefresh = false) => {
      try {
        // Initial load: show full-page loader
        // Subsequent loads (filters/pagination): soft refresh
        if (showRefresh || hasLoadedRef.current) setIsRefreshing(true);
        else setIsLoading(true);

        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "20");
        if (statusFilter !== "all") params.set("status", statusFilter);

        // Fetch stats first (this always works)
        const statsRes = await api.get(`/admin/stats`).catch((err) => {
          console.error(
            "Failed to fetch /admin/stats:",
            err.response?.status,
            err.response?.data || err.message
          );
          return { data: { jobs: {} } };
        });

        // Try to fetch paginated jobs
        let jobsData: AdminJob[] = [];
        let totalPagesData = 1;

        try {
          const jobsRes = await api.get(`/admin/jobs?${params.toString()}`);
          console.log("Jobs API response:", jobsRes.data);
          jobsData = jobsRes.data.jobs || [];
          totalPagesData = jobsRes.data.totalPages || 1;
        } catch (err) {
          const apiErr = err as {
            response?: { status?: number; data?: unknown };
            message?: string;
          };
          console.error(
            "Failed to fetch /admin/jobs:",
            apiErr.response?.status,
            apiErr.response?.data || apiErr.message
          );
          // Fallback: use recent-jobs endpoint if paginated endpoint fails
          try {
            const recentRes = await api.get(`/admin/recent-jobs?limit=50`);
            console.log("Fallback to recent-jobs:", recentRes.data);
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
  const getStatusLabel = (status: string) =>
    getJobStatusLabel(status, locale as "en" | "ka" | "ru");

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
      {
        key: "all" as const,
        label: t("admin.totalJobs"),
        value: stats?.total || 0,
        icon: Briefcase,
        color: THEME.primary,
      },
      {
        key: "open" as const,
        label: t("common.open"),
        value: stats?.open || 0,
        icon: Play,
        color: THEME.success,
      },
      {
        key: "in_progress" as const,
        label: t("common.inProgress"),
        value: stats?.inProgress || 0,
        icon: Clock,
        color: THEME.warning,
      },
      {
        key: "completed" as const,
        label: t("common.completed"),
        value: stats?.completed || 0,
        icon: CheckCircle,
        color: THEME.info,
      },
      {
        key: "cancelled" as const,
        label: t("common.cancelled"),
        value: stats?.cancelled || 0,
        icon: XCircle,
        color: THEME.textDim,
      },
    ],
    [
      stats?.total,
      stats?.open,
      stats?.inProgress,
      stats?.completed,
      stats?.cancelled,
      t,
    ]
  );

  const handleCardFilterClick = (key: JobStatusFilter) => {
    setStatusFilter((prev) => (prev === key ? "all" : key));
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: THEME.surface }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
            }}
          >
            <Briefcase className="w-8 h-8 text-white" />
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
      {/* Google Fonts */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap");
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
              <button
                onClick={() => router.push("/admin")}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{
                  background: THEME.surfaceLight,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <ArrowLeft
                  className="w-5 h-5"
                  style={{ color: THEME.textMuted }}
                />
              </button>
              <div>
                <h1
                  className="text-xl font-semibold tracking-tight"
                  style={{
                    color: THEME.text,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {t("admin.jobManagement")}
                </h1>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: THEME.textMuted }}
                >
                  {stats?.total.toLocaleString() || 0} {t("admin.jobsTotal")}
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
                color: "white",
                boxShadow: `0 4px 16px ${THEME.primary}40`,
              }}
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">{t("admin.refresh")}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={() => handleCardFilterClick(stat.key)}
              className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] text-left"
              style={{
                background: THEME.surfaceLight,
                border:
                  statusFilter === stat.key
                    ? `1px solid ${stat.color}80`
                    : `1px solid ${THEME.border}`,
                boxShadow:
                  statusFilter === stat.key
                    ? `0 8px 32px ${stat.color}20`
                    : undefined,
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `radial-gradient(circle at top right, ${stat.color}10, transparent 70%)`,
                }}
              />
              {statusFilter === stat.key && (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${stat.color}10, transparent 60%)`,
                  }}
                />
              )}
              <div className="relative flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}20` }}
                >
                  <stat.icon
                    className="w-6 h-6"
                    style={{ color: stat.color }}
                  />
                </div>
                <div>
                  <p
                    className="text-2xl font-bold tracking-tight"
                    style={{
                      color: THEME.text,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm" style={{ color: THEME.textMuted }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Jobs Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: THEME.surfaceLight,
            border: `1px solid ${THEME.border}`,
          }}
        >
          {/* Table Header */}
          <div
            className="px-6 py-4 grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider"
            style={{
              borderBottom: `1px solid ${THEME.border}`,
              color: THEME.textDim,
            }}
          >
            <div className="col-span-4">{t("admin.job")}</div>
            <div className="col-span-2">{t("admin.client")}</div>
            <div className="col-span-2 hidden lg:block">
              {t("common.status")}
            </div>
            <div className="col-span-2 hidden md:block">
              {t("admin.posted")}
            </div>
            <div className="col-span-2 text-right">{t("admin.actions")}</div>
          </div>

          {/* Table Body */}
          {jobs.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: THEME.textDim }}
              />
              <p
                className="text-lg font-medium"
                style={{ color: THEME.textMuted }}
              >
                {t("admin.noJobsFound")}
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.textDim }}>
                {t("admin.tryAdjustingYourSearchOr")}
              </p>
            </div>
          ) : (
            jobs.map((job, index) => {
              const StatusIcon = getStatusIcon(job.status);
              const jobIdRaw = (job as any)?._id || (job as any)?.id;
              const jobId =
                typeof jobIdRaw === "string"
                  ? jobIdRaw
                  : jobIdRaw?.toString?.() || "";
              const clientIdRaw =
                (job as any)?.clientId?.id || (job as any)?.clientId?._id;
              const clientId =
                typeof clientIdRaw === "string"
                  ? clientIdRaw
                  : clientIdRaw?.toString?.() || "";
              return (
                <div
                  key={jobId || `job-${index}`}
                  className="px-6 py-4 grid grid-cols-12 gap-4 items-center transition-colors cursor-pointer"
                  style={{
                    borderBottom:
                      index < jobs.length - 1
                        ? `1px solid ${THEME.border}`
                        : "none",
                  }}
                  onClick={() => {
                    if (jobId) router.push(`/jobs/${jobId}`);
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = THEME.surfaceHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {/* Job Info */}
                  <div className="col-span-4 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className="font-medium text-sm truncate"
                        style={{ color: THEME.text }}
                      >
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
                        title={job.budget ? formatBudget(job.budget) : "-"}
                      >
                        <DollarSign className="w-3 h-3" />
                        {job.budget ? formatBudget(job.budget) : "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: THEME.textDim }}
                      >
                        <Tag className="w-3 h-3" />
                        {t(`categories.${job.category}`) || job.category}
                      </span>
                      {job.location && (
                        <>
                          <span style={{ color: THEME.textDim }}>·</span>
                          <span
                            className="flex items-center gap-1 text-xs"
                            style={{ color: THEME.textDim }}
                          >
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
                        {job.budget ? formatBudget(job.budget) : "-"}
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
                      <Avatar
                        src={job.clientId?.avatar}
                        name={job.clientId?.name || "Client"}
                        size="sm"
                      />
                      <span
                        className="text-sm truncate"
                        style={{ color: THEME.textMuted }}
                      >
                        {job.clientId?.name || "Unknown"}
                      </span>
                    </button>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 hidden lg:block">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: `${getStatusColor(job.status)}20`,
                        color: getStatusColor(job.status),
                      }}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {getStatusLabel(job.status)}
                    </span>
                  </div>

                  {/* Posted Date */}
                  <div className="col-span-2 hidden md:block">
                    <p
                      className="text-sm"
                      style={{
                        color: THEME.textMuted,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {formatDateTimeShort(
                        job.createdAt,
                        locale as "en" | "ka" | "ru"
                      )}
                    </p>
                    {job.proposalCount !== undefined && (
                      <p
                        className="text-xs mt-0.5 flex items-center gap-1"
                        style={{ color: THEME.textDim }}
                      >
                        <FileText className="w-3 h-3" />
                        {job.proposalCount} {t("admin.proposals")}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
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
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm" style={{ color: THEME.textMuted }}>
              {locale === "ka"
                ? `გვერდი ${page} / ${totalPages}`
                : `Page ${page} of ${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                style={{
                  background: THEME.surfaceLight,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <ChevronLeft
                  className="w-5 h-5"
                  style={{ color: THEME.textMuted }}
                />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                style={{
                  background: THEME.surfaceLight,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <ChevronRight
                  className="w-5 h-5"
                  style={{ color: THEME.textMuted }}
                />
              </button>
            </div>
          </div>
        )}
      </main>
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
