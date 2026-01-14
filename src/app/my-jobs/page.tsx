"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Avatar from "@/components/common/Avatar";
import BackButton from "@/components/common/BackButton";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmModal } from "@/components/ui/Modal";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import type { Job, ProjectStage, ProjectTracking } from "@/types/shared";
import { formatTimeAgo } from "@/utils/dateUtils";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Check,
  Clock,
  Edit3,
  Eye,
  FileText,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
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

function MyJobsPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { t } = useLanguage();
  const { getCategoryLabel, locale } = useCategoryLabels();
  const toast = useToast();
  const router = useRouter();

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
        locale === "ka" ? "შეცდომა" : "Error",
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
        locale === "ka" ? "წარმატება" : "Success",
        t("job.jobRenewedFor30Days")
      );
    } catch (err) {
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        t("job.failedToRenewJob")
      );
    } finally {
      setRenewingJobId(null);
    }
  };

  // Initial loading skeleton
  if (authLoading || isInitialLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Skeleton className="w-32 h-8 mb-2" />
        <Skeleton className="w-64 h-5 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard
              key={i}
              variant="horizontal"
              className="h-56 sm:h-44"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* ==================== PAGE HEADER WITH BACK BUTTON ==================== */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <BackButton showLabel={false} className="mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                    {t("job.myJobs")}
                  </h1>
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C4735B]/10 text-[#C4735B]">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{visibleJobs.length}</span>
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="rounded-full"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  <Link href="/post-job">{t("job.addJob")}</Link>
                </Button>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">
                {t("job.manageYourActiveListingsAnd")}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        {jobs.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Input
                type="text"
                placeholder={
                  locale === "ka"
                    ? "ძებნა სათაურით, კატეგორიით ან მდებარეობით..."
                    : "Search by title, category, or location..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-neutral-500" />
                </button>
              )}
            </div>
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
          <div className="space-y-4">
            {visibleJobs.map((job) => {
              const firstImage = job.media?.[0]?.url || job.images?.[0];
              const isHired = job.status === "in_progress";
              const hasShortlisted = (job.shortlistedCount || 0) > 0;
              const isOpen = job.status === "open" && !hasShortlisted;
              const isShortlisted = job.status === "open" && hasShortlisted;
              const isClosed =
                job.status === "completed" || job.status === "cancelled";
              const isExpired = job.status === "expired";

              return (
                <div
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="group relative transition-all duration-500 cursor-pointer"
                >
                  {/* Premium border glow effect */}
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-[#C4735B]/0 via-[#C4735B]/0 to-[#C4735B]/0 group-hover:from-[#C4735B]/20 group-hover:via-[#D4937B]/10 group-hover:to-[#C4735B]/20 transition-all duration-500 opacity-0 group-hover:opacity-100 blur-[1px]" />

                  {/* Main Card */}
                  <div className="relative bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100/80 dark:border-neutral-800 group-hover:border-[#C4735B]/20 transition-all duration-500 group-hover:shadow-[0_20px_50px_-12px_rgba(196,115,91,0.12)] group-hover:-translate-y-0.5">
                    {/* Shine effect overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/3 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    </div>

                    {/* Mobile: Vertical Stack Layout */}
                    <div className="flex flex-col sm:flex-row">
                      {/* ===== IMAGE SECTION ===== */}
                      <div className="relative w-full sm:w-52 lg:w-64 flex-shrink-0 bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 overflow-hidden">
                        {firstImage ? (
                          <img
                            src={storage.getFileUrl(firstImage)}
                            alt=""
                            className="w-full h-44 sm:h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            style={{ minHeight: "176px" }}
                          />
                        ) : (
                          <div className="w-full h-44 sm:h-full min-h-[176px] flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-14 h-14 rounded-2xl bg-neutral-200/50 dark:bg-neutral-700/50 flex items-center justify-center mx-auto mb-2">
                                <FileText className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
                              </div>
                              <span className="text-xs text-neutral-400">
                                {t("job.noImage")}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Gradient overlay on image */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          {isOpen && (
                            <Badge
                              variant="success"
                              size="sm"
                              dot
                              dotColor="success"
                              className="shadow-lg backdrop-blur-sm"
                            >
                              {t("common.open")}
                            </Badge>
                          )}
                          {isShortlisted && (
                            <Badge
                              variant="info"
                              size="sm"
                              icon={<Users className="w-3 h-3" />}
                              className="shadow-lg backdrop-blur-sm"
                            >
                              {t("job.shortlisted")} ({job.shortlistedCount})
                            </Badge>
                          )}
                          {isHired && (
                            <Badge
                              variant="premium"
                              size="sm"
                              icon={<Check className="w-3 h-3" />}
                              className="shadow-lg backdrop-blur-sm"
                            >
                              {locale === "ka" ? "დაქირავებული" : "Hired"}
                            </Badge>
                          )}
                          {isClosed && (
                            <Badge
                              variant="default"
                              size="sm"
                              className="shadow-lg backdrop-blur-sm"
                            >
                              {locale === "ka" ? "დახურული" : "Closed"}
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge
                              variant="warning"
                              size="sm"
                              icon={<Clock className="w-3 h-3" />}
                              className="shadow-lg backdrop-blur-sm"
                            >
                              {locale === "ka" ? "ვადაგასული" : "Expired"}
                            </Badge>
                          )}
                        </div>

                        {/* Location badge on image */}
                        {job.location && (
                          <div className="absolute bottom-3 left-3 z-10">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </span>
                          </div>
                        )}

                        {/* Mobile: Action buttons overlay */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 sm:hidden z-10">
                          {isOpen && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-lg w-8 h-8"
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
                                className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-lg w-8 h-8 text-neutral-400 hover:text-red-500"
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
                              className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-lg w-8 h-8 text-amber-600"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* ===== CONTENT SECTION ===== */}
                      <div className="flex-1 p-5 flex flex-col">
                        <div className="flex items-start justify-between flex-1">
                          <div className="flex-1 min-w-0">
                            {/* Category Tags & Time */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full bg-[#C4735B]/10 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#C4735B]">
                                {getCategoryLabel(job.category)}
                              </span>
                              {(job.subcategory || job.skills?.[0]) && (
                                <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] sm:text-[11px] font-medium text-neutral-500">
                                  {getCategoryLabel(
                                    job.subcategory || job.skills?.[0] || ""
                                  )}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-neutral-400">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(
                                  job.createdAt,
                                  locale as "en" | "ka" | "ru"
                                )}
                              </span>
                            </div>

                            {/* Title with animated underline */}
                            <div className="group/title inline-block mb-2">
                              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white line-clamp-2 group-hover:text-[#C4735B] transition-colors duration-300">
                                {job.title}
                              </h3>
                              <span className="block w-0 h-0.5 bg-gradient-to-r from-[#C4735B] to-[#D4937B] group-hover:w-full transition-all duration-500 rounded-full" />
                            </div>

                            {/* Description - Hidden on very small screens */}
                            <p className="hidden sm:block text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                              {job.description}
                            </p>
                          </div>

                          {/* Action Icons - Top Right - Desktop only */}
                          <div className="hidden sm:flex items-center gap-1 ml-4">
                            {isOpen && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  onClick={(e) => e.stopPropagation()}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Link href={`/post-job?edit=${job.id}`}>
                                    <Edit3 className="w-4 h-4" />
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
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-4 h-4" />
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
                                className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                title={t("job.renew")}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* ===== FOOTER SECTION ===== */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 gap-3">
                          {/* Left: Proposals or Hired Pro */}
                          <div className="flex items-center gap-3">
                            {isOpen && job.proposalCount > 0 && (
                              <>
                                {/* Stacked Avatars with ring effect */}
                                <div className="flex -space-x-2.5">
                                  {[
                                    ...Array(Math.min(job.proposalCount, 3)),
                                  ].map((_, i) => {
                                    const proposal = job.recentProposals?.[i];
                                    const proName = proposal?.proId?.name || "";
                                    const initial = proName
                                      .charAt(0)
                                      .toUpperCase();

                                    return (
                                      <div
                                        key={i}
                                        className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 border-2 border-white dark:border-neutral-900 overflow-hidden ring-2 ring-[#C4735B]/0 group-hover:ring-[#C4735B]/20 transition-all duration-300"
                                        style={{ zIndex: 3 - i }}
                                      >
                                        {proposal?.proId?.avatar ? (
                                          <img
                                            src={storage.getFileUrl(
                                              proposal.proId.avatar
                                            )}
                                            alt={proName}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-600 dark:to-neutral-700">
                                            {initial || (
                                              <Users className="w-3 h-3" />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {job.proposalCount > 3 && (
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#C4735B]/10 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-xs font-bold text-[#C4735B]">
                                      +{job.proposalCount - 3}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-[#C4735B]">
                                    {job.proposalCount}{" "}
                                    {locale === "ka"
                                      ? "შეთავაზება"
                                      : job.proposalCount === 1
                                        ? "Proposal"
                                        : "Proposals"}
                                  </span>
                                  {job.proposalCount === 1 &&
                                    job.recentProposals?.[0]?.proId?.name && (
                                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                        {t("job.from")}{" "}
                                        {job.recentProposals[0].proId.name}
                                      </span>
                                    )}
                                </div>
                              </>
                            )}
                            {isOpen && job.proposalCount === 0 && (
                              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                </span>
                                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                  {t("job.awaitingProposals")}
                                </span>
                              </div>
                            )}
                            {isHired && job.hiredPro && (
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar
                                    src={
                                      job.hiredPro.avatar ||
                                      job.hiredPro.userId?.avatar
                                    }
                                    name={
                                      job.hiredPro.name ||
                                      job.hiredPro.userId?.name ||
                                      "Pro"
                                    }
                                    size="sm"
                                    className="w-9 h-9 ring-2 ring-[#C4735B]/20"
                                  />
                                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-neutral-900 flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 text-white" />
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4735B] block">
                                    {t("common.hired")}
                                  </span>
                                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                                    {job.hiredPro.name ||
                                      job.hiredPro.userId?.name ||
                                      "Professional"}
                                  </span>
                                </div>
                              </div>
                            )}
                            {isExpired && (
                              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                  {t("job.expired")}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Right: Action Button */}
                          <div className="flex-shrink-0">
                            {isOpen && job.proposalCount > 0 && (
                              <Button
                                variant="secondary"
                                size="sm"
                                asChild
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProposals(job.id);
                                }}
                                className="group/btn"
                              >
                                <Link
                                  href={`/my-jobs/${job.id}/proposals`}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  {t("job.viewProposals")}
                                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-1 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all" />
                                </Link>
                              </Button>
                            )}
                            {isExpired && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenewJob(job.id);
                                }}
                                disabled={renewingJobId === job.id}
                                loading={renewingJobId === job.id}
                                size="sm"
                                leftIcon={
                                  !renewingJobId || renewingJobId !== job.id ? (
                                    <RefreshCw className="w-4 h-4" />
                                  ) : undefined
                                }
                                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/20"
                              >
                                {renewingJobId === job.id
                                  ? t("job.renewing")
                                  : locale === "ka"
                                    ? "განახლება"
                                    : "Renew"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

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
  return (
    <AuthGuard allowedRoles={["client", "pro", "company", "admin"]}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
            <LoadingSpinner size="lg" color={ACCENT_COLOR} />
          </div>
        }
      >
        <MyJobsPageContent />
      </Suspense>
    </AuthGuard>
  );
}
