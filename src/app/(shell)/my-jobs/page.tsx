"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Avatar from "@/components/common/Avatar";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmModal } from "@/components/ui/Modal";
import PageShell from "@/components/ui/PageShell";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import type { Job, ProjectStage, ProjectTracking } from "@/types/shared";
import { formatTimeAgo } from "@/utils/dateUtils";
import { formatCurrency, formatPriceRange } from "@/utils/currencyUtils";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Check,
  Clock,
  Edit3,
  Eye,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Socket event data type
interface ProjectStageUpdateEvent {
  jobId: string;
  stage: ProjectStage;
  progress: number;
  project?: Partial<ProjectTracking>;
}

import { useLanguage } from "@/contexts/LanguageContext";

// Status color strip mapping
function getStatusColor(job: Job) {
  const hasShortlisted = (job.shortlistedCount || 0) > 0;
  if (job.status === "open" && hasShortlisted) return "bg-blue-500";
  if (job.status === "open") return "bg-emerald-500";
  if (job.status === "in_progress") return "bg-[#C4735B]";
  if (job.status === "expired") return "bg-amber-500";
  return "bg-neutral-300 dark:bg-neutral-600";
}

// Status badge component
function JobStatusBadge({ job, t }: { job: Job; t: (key: string) => string }) {
  const hasShortlisted = (job.shortlistedCount || 0) > 0;
  if (job.status === "open" && !hasShortlisted)
    return <Badge variant="success" size="sm" dot dotColor="success">{t("common.open")}</Badge>;
  if (job.status === "open" && hasShortlisted)
    return <Badge variant="info" size="sm" icon={<Users className="w-3 h-3" />}>{t("job.shortlisted")} ({job.shortlistedCount})</Badge>;
  if (job.status === "in_progress")
    return <Badge variant="premium" size="sm" icon={<Check className="w-3 h-3" />}>{t("common.hired")}</Badge>;
  if (job.status === "completed" || job.status === "cancelled")
    return <Badge variant="default" size="sm">{t("job.closed")}</Badge>;
  if (job.status === "expired")
    return <Badge variant="warning" size="sm" icon={<Clock className="w-3 h-3" />}>{t("job.expired")}</Badge>;
  return null;
}

// Budget display helper
function getJobBudget(job: Job, t: (key: string) => string): string {
  if (job.budgetType === "fixed") {
    const amount = job.budgetAmount ?? job.budgetMin;
    if (amount) return formatCurrency(amount);
  } else if (job.budgetType === "per_sqm" && job.pricePerUnit) {
    const total = job.areaSize ? job.pricePerUnit * job.areaSize : null;
    if (total) return formatCurrency(total);
    return `${job.pricePerUnit}₾/მ²`;
  } else if (job.budgetType === "range" && job.budgetMin && job.budgetMax) {
    return formatPriceRange(job.budgetMin, job.budgetMax);
  }
  return t("card.negotiable");
}

function MyJobsPageContent({ embedded }: { embedded?: boolean }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { t } = useLanguage();
  const { getCategoryLabel, locale } = useCategoryLabels();
  const toast = useToast();
  const router = useRouter();
  const isEmbedded = !!embedded;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [deleteModalJob, setDeleteModalJob] = useState<Job | null>(null);
  const [renewingJobId, setRenewingJobId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  // WebSocket connection for real-time project stage updates
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const wsUrl = apiUrl.replace(/^http/, "ws");

    socketRef.current = io(`${wsUrl}/chat`, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("[MyJobs] WebSocket connected");
    });

    // Listen for project stage updates
    socketRef.current.on(
      "projectStageUpdate",
      (data: ProjectStageUpdateEvent) => {
        console.log("[MyJobs] Project stage update:", data);
        // Update the job's project tracking data in state
        setJobs((prevJobs) =>
          prevJobs.map((job) => {
            if (job.id === data.jobId && job.projectTracking) {
              return {
                ...job,
                projectTracking: {
                  ...job.projectTracking,
                  ...data.project,
                  jobId: job.projectTracking.jobId || job.id,
                  currentStage: data.stage,
                  progress: data.progress,
                },
              };
            }
            return job;
          })
        );
      }
    );

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  const fetchMyJobs = useCallback(
    async (isInitial: boolean = false) => {
      try {
        if (isInitial) {
          setIsInitialLoading(true);
        }
        const response = await api.get(`/jobs/my-jobs`);
        const jobsData = response.data;

        // Fetch project tracking data for in_progress jobs
        const jobsWithTracking = await Promise.all(
          jobsData.map(async (job: Job) => {
            if (job.status === "in_progress") {
              try {
                const trackingResponse = await api.get(
                  `/jobs/projects/${job.id}`
                );
                return {
                  ...job,
                  projectTracking: trackingResponse.data.project,
                };
              } catch {
                // If no project tracking exists, return job as-is
                return job;
              }
            }
            return job;
          })
        );

        setJobs(jobsWithTracking);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
        toast.error(t("common.error"), t("job.failedToLoadProjects"));
      } finally {
        setIsInitialLoading(false);
      }
    },
    [toast, t]
  );

  // Initial load
  useEffect(() => {
    if (isAuthenticated && isInitialLoading) {
      fetchMyJobs(true);
    }
  }, [isAuthenticated, isInitialLoading, fetchMyJobs]);

  // Mark proposals on each job as viewed when clicking "View Proposals"
  const handleViewProposals = async (jobId: string) => {
    try {
      await api.post(`/jobs/counters/mark-proposals-viewed/${jobId}`);
    } catch {
      // Silently ignore errors
    }
  };

  // No filter tabs: always show full list

  const visibleJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = !query
      ? jobs
      : jobs.filter((job) => {
          const title = (job.title || "").toLowerCase();
          const category = (job.category || "").toLowerCase();
          const subcategory = ((job as any).subcategory || "").toString().toLowerCase();
          const location = (job.location || "").toLowerCase();
          return (
            title.includes(query) ||
            category.includes(query) ||
            subcategory.includes(query) ||
            location.includes(query)
          );
        });

    const getSortTime = (job: Job): number => {
      const dateStr = (job as any).createdAt || (job as any).updatedAt || null;
      const ms = dateStr ? new Date(dateStr).getTime() : 0;
      return Number.isFinite(ms) ? ms : 0;
    };

    return [...filtered].sort((a, b) => getSortTime(b) - getSortTime(a));
  }, [jobs, searchQuery]);

  // Delete job handler
  const handleDeleteJob = async () => {
    if (!deleteModalJob) return;

    const jobId = deleteModalJob.id;

    try {
      setDeletingJobId(jobId);
      await api.delete(`/jobs/${jobId}`);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      toast.success(t("common.success"), t("job.jobDeletedSuccessfully"));
      setDeleteModalJob(null);
    } catch (err) {
      toast.error(
        t("common.error"),
        t("job.failedToDeleteJob")
      );
    } finally {
      setDeletingJobId(null);
    }
  };

  // Renew expired job handler
  const handleRenewJob = async (jobId: string) => {
    try {
      setRenewingJobId(jobId);
      await api.post(`/jobs/${jobId}/renew`);

      // Update job in local state to open status
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: "open" as const } : j
        )
      );

      toast.success(
        t("common.success"),
        t("job.jobRenewedFor30Days")
      );
    } catch (err) {
      toast.error(
        t("common.error"),
        t("job.failedToRenewJob")
      );
    } finally {
      setRenewingJobId(null);
    }
  };

  // Initial loading skeleton
  if (authLoading || isInitialLoading) {
    return (
      <PageShell
        variant={isEmbedded ? "embedded" : "standalone"}
        showHeader={!isEmbedded}
        icon={Briefcase}
        title={t("job.myJobs")}
        subtitle={t("job.myJobsSubtitle")}
        headerContentClassName={isEmbedded ? "max-w-none" : "mx-auto max-w-6xl"}
        bodyContentClassName={isEmbedded ? undefined : "mx-auto max-w-6xl"}
        rightContent={
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C4735B]/10 text-[#C4735B] text-xs font-semibold">
              {visibleJobs.length}
            </span>
          </div>
        }
      >
        <div className="w-full">
          <Skeleton className="w-28 sm:w-32 h-7 sm:h-8 mb-2" />
          <Skeleton className="w-48 sm:w-64 h-4 sm:h-5 mb-4 sm:mb-6 hidden sm:block" />
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard
                key={i}
                variant="horizontal"
                className="h-40 sm:h-44"
              />
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <div className="flex flex-col">
      <PageShell
        variant={isEmbedded ? "embedded" : "standalone"}
        showHeader={!isEmbedded}
        icon={Briefcase}
        title={t("job.myJobs")}
        subtitle={t("job.myJobsSubtitle")}
        headerContentClassName={isEmbedded ? "max-w-none" : "mx-auto max-w-6xl"}
        bodyContentClassName={isEmbedded ? undefined : "mx-auto max-w-6xl"}
        rightContent={
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C4735B]/10 text-[#C4735B] text-xs font-semibold">
              {visibleJobs.length}
            </span>
            <Button
              asChild
              size="sm"
              className="rounded-full text-xs sm:text-sm px-3 sm:px-4 flex-shrink-0"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              <Link href="/post-job">{t("common.add")}</Link>
            </Button>
          </div>
        }
      >

        {/* Search */}
        {jobs.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <SearchInput
              placeholder={t("job.searchMyJobsPlaceholder")}
              value={searchQuery}
              onValueChange={setSearchQuery}
              inputSize="default"
              className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
            />
          </div>
        )}

        {/* ==================== JOB CARDS ZONE ==================== */}
        {visibleJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={jobs.length === 0 ? "No jobs yet" : "No jobs found"}
            titleKa={
              jobs.length === 0 ? "პროექტები ჯერ არ არის" : "პროექტები არ მოიძებნა"
            }
            description={
              jobs.length === 0
                ? "Create your first project and start receiving proposals"
                : "Try a different search term"
            }
            descriptionKa={
              jobs.length === 0
                ? "შექმენი პირველი პროექტი და დაიწყე შეთავაზებების მიღება"
                : "სცადე სხვა საძიებო სიტყვა"
            }
            actionLabel={jobs.length === 0 ? "Post a Job" : undefined}
            actionLabelKa={jobs.length === 0 ? "სამუშაოს გამოქვეყნება" : undefined}
            actionHref={jobs.length === 0 ? "/post-job" : undefined}
            variant="illustrated"
            size="md"
          />
        ) : (
          <div className="space-y-3">
            {visibleJobs.map((job) => {
              const firstImage = job.media?.[0]?.url || job.images?.[0];
              const isHired = job.status === "in_progress";
              const isOpen = job.status === "open";
              const isClosed = job.status === "completed" || job.status === "cancelled";
              const isExpired = job.status === "expired";
              const budget = getJobBudget(job, t);

              return (
                <div
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="group relative bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 hover:border-[#C4735B]/30 dark:hover:border-[#C4735B]/30 transition-colors duration-150 cursor-pointer hover:shadow-md flex"
                >
                  {/* Status color strip */}
                  <div className={`w-1 sm:w-1.5 flex-shrink-0 ${getStatusColor(job)}`} />

                  {/* Optional thumbnail - desktop only */}
                  {firstImage && (
                    <div className="hidden sm:block w-28 lg:w-36 flex-shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <img
                        src={storage.getFileUrl(firstImage)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col">
                    {/* Top row: metadata + budget */}
                    <div className="flex items-start justify-between gap-3 mb-1.5 sm:mb-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                        <JobStatusBadge job={job} t={t} />
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-[#C4735B]/10 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#C4735B]">
                          {getCategoryLabel(job.category)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-neutral-400">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {formatTimeAgo(job.createdAt, t)}
                        </span>
                        {job.location && (
                          <span className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-400 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </span>
                        )}
                      </div>

                      {/* Budget + Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                            {budget}
                          </p>
                        </div>
                        {/* Desktop action icons */}
                        <div className="hidden sm:flex items-center gap-0.5 ml-1">
                          {isOpen && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                onClick={(e) => e.stopPropagation()}
                                className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Link href={`/post-job?edit=${job.id}`}>
                                  <Edit3 className="w-3.5 h-3.5" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteModalJob(job);
                                }}
                                disabled={deletingJobId === job.id}
                                className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          {isExpired && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenewJob(job.id);
                              }}
                              disabled={renewingJobId === job.id}
                              loading={renewingJobId === job.id}
                              className="w-8 h-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                              title={t("job.renew")}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Title + mobile location */}
                    <h3 className="text-[13px] sm:text-base font-semibold text-neutral-900 dark:text-white line-clamp-1 sm:line-clamp-2 group-hover:text-[#C4735B] transition-colors duration-150 mb-0.5">
                      {job.title}
                    </h3>

                    {/* Mobile location */}
                    {job.location && (
                      <span className="sm:hidden flex items-center gap-1 text-[10px] text-neutral-400 mb-1">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </span>
                    )}

                    {/* Description - desktop only */}
                    <p className="hidden sm:block text-[13px] text-neutral-500 dark:text-neutral-400 line-clamp-1 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Footer: proposals / hired pro / actions */}
                    <div className="flex items-center justify-between mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-neutral-100 dark:border-neutral-800 gap-2">
                      {/* Left: status-specific content */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {isOpen && job.proposalCount > 0 && (
                          <>
                            <div className="flex -space-x-1.5">
                              {[...Array(Math.min(job.proposalCount, 3))].map((_, i) => {
                                const proposal = job.recentProposals?.[i];
                                const proName = proposal?.proId?.name || "";
                                const initial = proName.charAt(0).toUpperCase();
                                return (
                                  <div
                                    key={i}
                                    className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 border-2 border-white dark:border-neutral-900 overflow-hidden"
                                    style={{ zIndex: 3 - i }}
                                  >
                                    {proposal?.proId?.avatar ? (
                                      <img src={storage.getFileUrl(proposal.proId.avatar)} alt={proName} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[9px] sm:text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-600 dark:to-neutral-700">
                                        {initial || <Users className="w-2.5 h-2.5" />}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {job.proposalCount > 3 && (
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#C4735B]/10 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-[9px] sm:text-[11px] font-bold text-[#C4735B]">
                                  +{job.proposalCount - 3}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[12px] sm:text-[13px] font-semibold text-[#C4735B]">
                                {job.proposalCount} {t("job.proposals")}
                              </span>
                              {job.proposalCount === 1 && job.recentProposals?.[0]?.proId?.name && (
                                <span className="block text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                                  {t("job.from")} {job.recentProposals[0].proId.name}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                        {isOpen && job.proposalCount === 0 && (
                          <div className="flex items-center gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100/80 dark:border-amber-800/30">
                            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-full w-full bg-amber-500" />
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-medium text-amber-700 dark:text-amber-400">
                              {t("job.awaitingProposals")}
                            </span>
                          </div>
                        )}
                        {isHired && job.hiredPro && (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Avatar
                                src={job.hiredPro.avatar || job.hiredPro.userId?.avatar}
                                name={job.hiredPro.name || job.hiredPro.userId?.name || "Pro"}
                                size="sm"
                                className="w-7 h-7 sm:w-8 sm:h-8 ring-2 ring-[#C4735B]/20"
                              />
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-green-500 border-2 border-white dark:border-neutral-900 flex items-center justify-center">
                                <Check className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#C4735B] block">
                                {t("common.hired")}
                              </span>
                              <span className="text-[12px] sm:text-[13px] font-semibold text-neutral-900 dark:text-white truncate block">
                                {job.hiredPro.name || job.hiredPro.userId?.name || "Professional"}
                              </span>
                            </div>
                          </div>
                        )}
                        {isExpired && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
                            <span className="text-[10px] sm:text-[11px] font-medium text-amber-700 dark:text-amber-400">
                              {t("job.expired")}
                            </span>
                          </div>
                        )}
                        {/* Stats: views */}
                        <div className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-400 ml-auto mr-2">
                          <Eye className="w-3 h-3" />
                          {job.viewCount || 0}
                        </div>
                      </div>

                      {/* Right: CTA buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Mobile action icons */}
                        <div className="flex sm:hidden items-center gap-0.5">
                          {isOpen && (
                            <>
                              <Button variant="ghost" size="icon" asChild onClick={(e) => e.stopPropagation()} className="w-7 h-7">
                                <Link href={`/post-job?edit=${job.id}`}><Edit3 className="w-3 h-3" /></Link>
                              </Button>
                              <Button
                                variant="ghost" size="icon"
                                onClick={(e) => { e.stopPropagation(); setDeleteModalJob(job); }}
                                disabled={deletingJobId === job.id}
                                className="w-7 h-7 text-neutral-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          {isExpired && (
                            <Button
                              variant="ghost" size="icon"
                              onClick={(e) => { e.stopPropagation(); handleRenewJob(job.id); }}
                              disabled={renewingJobId === job.id}
                              loading={renewingJobId === job.id}
                              className="w-7 h-7 text-amber-600"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          )}
                        </div>

                        {isOpen && job.proposalCount > 0 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            asChild
                            onClick={(e) => { e.stopPropagation(); handleViewProposals(job.id); }}
                            className="group/btn text-[11px] sm:text-[13px] h-7 sm:h-8 px-2.5 sm:px-3"
                          >
                            <Link href={`/my-jobs/${job.id}/proposals`} className="flex items-center gap-1.5">
                              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              {t("job.viewProposals")}
                              <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-0 -ml-1 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all" />
                            </Link>
                          </Button>
                        )}
                        {isExpired && (
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleRenewJob(job.id); }}
                            disabled={renewingJobId === job.id}
                            loading={renewingJobId === job.id}
                            size="sm"
                            leftIcon={!renewingJobId || renewingJobId !== job.id ? <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : undefined}
                            className="hidden sm:flex bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-sm text-[13px] h-8"
                          >
                            {renewingJobId === job.id ? t("job.renewing") : t("job.renew")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageShell>

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      <ConfirmModal
        isOpen={!!deleteModalJob}
        onClose={() => !deletingJobId && setDeleteModalJob(null)}
        onConfirm={handleDeleteJob}
        title={t("job.deleteJob")}
        description={t("job.areYouSureYouWant")}
        icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
        variant="danger"
        cancelLabel={t("common.cancel")}
        confirmLabel={t("common.delete")}
        isLoading={!!deletingJobId}
        loadingLabel={t("common.deleting")}
        confirmIcon={<Trash2 className="w-4 h-4" />}
      >
        {/* Job preview */}
        {deleteModalJob && (
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 sm:p-4 mb-4">
            <p className="font-medium text-neutral-900 dark:text-white text-sm">
              {deleteModalJob.title}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
              {deleteModalJob.description}
            </p>
          </div>
        )}
      </ConfirmModal>

      {/* Hide scrollbar utility */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default function MyJobsPage() {
  const embedded = true;

  return (
    <AuthGuard allowedRoles={["client", "pro", "admin"]}>
      <Suspense
        fallback={
          <div
            className={
              embedded
                ? "py-20 flex items-center justify-center bg-white dark:bg-neutral-950"
                : "min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950"
            }
          >
            <LoadingSpinner size="lg" color={ACCENT_COLOR} />
          </div>
        }
      >
        <MyJobsPageContent embedded={embedded} />
      </Suspense>
    </AuthGuard>
  );
}
