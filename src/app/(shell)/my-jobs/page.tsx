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
import { useNotifications } from "@/contexts/NotificationContext";
import { useToast } from "@/contexts/ToastContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { useCountryLink } from "@/hooks/useCountry";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import type { Job, ProjectStage, ProjectTracking } from "@/types/shared";
import { formatTimeAgo } from "@/utils/dateUtils";
import { formatCurrency, formatPriceRange, type Currency } from "@/utils/currencyUtils";
import { currencyForCountry } from "@/data/countries";
import { currencySymbol } from "@/utils/currency";
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
import Image from "next/image";
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

// Status color strip mapping. The "unknown / other" branch used the
// hardcoded `bg-neutral-300` which read as a bright blue-grey on dark
// theme. Swapped to the theme-aware `--hm-border-strong` token so the
// strip stays a neutral muted line in both modes.
function getStatusColor(job: Job) {
  const hasShortlisted = (job.shortlistedCount || 0) > 0;
  if (job.status === "open" && hasShortlisted) return "bg-[var(--hm-info-500)]";
  if (job.status === "open") return "bg-[var(--hm-success-500)]";
  if (job.status === "in_progress") return "bg-[var(--hm-brand-500)]";
  if (job.status === "expired") return "bg-[var(--hm-warning-500)]";
  return "bg-[var(--hm-border-strong)]";
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

// Budget display helper. The job carries its own marketplace country
// (stamped at post time), which determines the currency we render -
// the same client may have jobs in GE (GEL) and IL (ILS) and each
// should render in its own currency.
function getJobBudget(job: Job, t: (key: string) => string): string {
  const currency = currencyForCountry(job.country) as Currency;
  const sym = currencySymbol({ country: job.country ?? 'GE' });
  if (job.budgetType === "fixed") {
    const amount = job.budgetAmount ?? job.budgetMin;
    if (amount) return formatCurrency(amount, currency);
  } else if (job.budgetType === "per_sqm" && job.pricePerUnit) {
    const total = job.areaSize ? job.pricePerUnit * job.areaSize : null;
    if (total) return formatCurrency(total, currency);
    return `${job.pricePerUnit}${sym}/${t('common.perSqmShort')}`;
  } else if (job.budgetType === "range" && job.budgetMin && job.budgetMax) {
    return formatPriceRange(job.budgetMin, job.budgetMax, currency);
  }
  return t("card.negotiable");
}

function MyJobsPageContent({ embedded }: { embedded?: boolean }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { t } = useLanguage();
  const { getCategoryLabel, locale } = useCategoryLabels();
  const toast = useToast();
  const router = useRouter();
  const cl = useCountryLink();
  const isEmbedded = !!embedded;
  // Notification unread-count is used as a "something happened"
  // signal to trigger a chat-unread refetch. When a new message-
  // type notification arrives, the bell count ticks up, which is
  // our cheap, backend-free cue to refresh the per-job badges.
  const { unreadCount: notifUnreadCount } = useNotifications();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // Unread chat-message count keyed by job id. Populated alongside
  // project-tracking fetch so the card render can show a "you have
  // new messages" badge on jobs that have activity in their chat
  // since the last open. Empty Record by default - no badge shown.
  const [chatUnreadByJob, setChatUnreadByJob] = useState<Record<string, number>>({});
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [deleteModalJob, setDeleteModalJob] = useState<Job | null>(null);
  const [renewingJobId, setRenewingJobId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  // Stable ref to the latest fetchMyJobs so the socket effect can
  // call it without adding the function to its dependency array
  // (which would re-mount the socket every render).
  const fetchMyJobsRef = useRef<(() => void) | null>(null);

  // WebSocket connection for real-time project stage updates
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const wsUrl = apiUrl.replace(/^http/, "ws");

    socketRef.current = io(`${wsUrl}/chat`, {
      auth: { token },
      // WebSocket first, polling fallback. Previously `["websocket"]`
      // only meant a corporate firewall blocking ws:// or wss://
      // silently failed - users on locked-down networks got zero
      // real-time updates. socket.io will negotiate the upgrade
      // automatically when WS is available.
      transports: ["websocket", "polling"],
      // Auto-reconnect with backoff. Previously the socket had no
      // reconnection config; a sleep/wake or network blip silently
      // killed updates until the user navigated away. Matches the
      // notifications socket so behavior is consistent.
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current.on("connect", () => {
      console.log("[MyJobs] WebSocket connected");
    });

    // On reconnect, refetch my-jobs so any stage updates that fired
    // during the disconnect window get pulled in. WebSocket replay
    // doesn't cover events emitted while we were offline. Refs go
    // through `fetchMyJobsRef` so the socket effect doesn't have
    // to list fetchMyJobs as a dep (would cause socket churn).
    socketRef.current.io.on("reconnect", () => {
      fetchMyJobsRef.current?.();
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

  // Shared abort ref so refetches (from WS reconnect, initial mount,
  // and Strict Mode double-mount) cancel the prior in-flight request
  // instead of all racing for the same setJobs and stomping each
  // other's tracking-populated payloads.
  const fetchMyJobsAbortRef = useRef<AbortController | null>(null);
  const fetchMyJobs = useCallback(
    async (isInitial: boolean = false) => {
      fetchMyJobsAbortRef.current?.abort();
      const controller = new AbortController();
      fetchMyJobsAbortRef.current = controller;
      try {
        if (isInitial) {
          setIsInitialLoading(true);
        }
        const response = await api.get(`/jobs/my-jobs`, {
          signal: controller.signal,
        });
        // Show all jobs returned by the API. The previous "filter out
        // anything with a services array" rule was a legacy mobile-
        // order exclusion - but the standard post-job wizard ALSO
        // writes a `services` array whenever the user picks any
        // service, so the filter silently hid every wizard-posted job
        // from My Jobs. If a future legacy-order exclusion is needed
        // it should key off an explicit signal (jobType / source flag),
        // not the presence of `services`.
        const jobsData = response.data as Job[];

        // Fetch project tracking + chat-unread for in_progress
        // jobs in parallel. The unread fetch is best-effort -
        // failure is silent so a single bad jobId doesn't break
        // the whole list render.
        const unreadByJob: Record<string, number> = {};
        const jobsWithTracking = await Promise.all(
          jobsData.map(async (job: Job) => {
            if (job.status === "in_progress") {
              try {
                const [trackingResponse, unreadResponse] = await Promise.all([
                  api.get(`/jobs/projects/${job.id}`, { signal: controller.signal }),
                  api
                    .get<{ chat?: number }>(`/jobs/projects/${job.id}/unread-counts`, { signal: controller.signal })
                    .catch(() => null),
                ]);
                if (unreadResponse?.data?.chat) {
                  unreadByJob[job.id] = unreadResponse.data.chat;
                }
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

        if (controller.signal.aborted) return;
        setJobs(jobsWithTracking);
        setChatUnreadByJob(unreadByJob);
      } catch (err) {
        const name = (err as { name?: string })?.name;
        const code = (err as { code?: string })?.code;
        if (name === "CanceledError" || code === "ERR_CANCELED") return;
        console.error("Failed to fetch jobs:", err);
        toast.error(t("common.error"), t("job.failedToLoadProjects"));
      } finally {
        if (!controller.signal.aborted) {
          setIsInitialLoading(false);
        }
      }
    },
    [toast, t]
  );

  // Keep the ref pointed at the latest fetchMyJobs so the socket
  // reconnect handler always invokes the freshest closure.
  useEffect(() => {
    fetchMyJobsRef.current = () => {
      void fetchMyJobs();
    };
  }, [fetchMyJobs]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated && isInitialLoading) {
      fetchMyJobs(true);
    }
  }, [isAuthenticated, isInitialLoading, fetchMyJobs]);

  // Lightweight chat-unread refresh - no job-list refetch, just
  // re-pulls the per-job badge counts. Used as a live-update path
  // so badges don't go stale when a message arrives in another tab
  // or while the user is on this page.
  const refreshChatUnreadCounts = useCallback(async () => {
    const inProgressIds = jobs
      .filter((j) => j.status === "in_progress")
      .map((j) => j.id);
    if (inProgressIds.length === 0) return;
    const next: Record<string, number> = {};
    await Promise.all(
      inProgressIds.map(async (jobId) => {
        try {
          const res = await api.get<{ chat?: number }>(
            `/jobs/projects/${jobId}/unread-counts`,
          );
          if (res.data?.chat) next[jobId] = res.data.chat;
        } catch {
          // Silent: per-job failure doesn't break the rest
        }
      }),
    );
    setChatUnreadByJob(next);
  }, [jobs]);

  // Refresh badges whenever the notification unread-count ticks up
  // (a new message-type notification just arrived). Tracked via a
  // ref so we only refetch on transitions UP, not down (which fires
  // when the user marks notifications read).
  const lastNotifUnreadRef = useRef(notifUnreadCount);
  useEffect(() => {
    if (notifUnreadCount > lastNotifUnreadRef.current) {
      void refreshChatUnreadCounts();
    }
    lastNotifUnreadRef.current = notifUnreadCount;
  }, [notifUnreadCount, refreshChatUnreadCounts]);

  // Refresh when the tab regains focus - covers the case where the
  // user reads/replies in another tab and comes back; the badges
  // should reflect the new zero, not the count from page-mount time.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshChatUnreadCounts();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refreshChatUnreadCounts]);

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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)] text-xs font-semibold">
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
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)] text-xs font-semibold">
              {visibleJobs.length}
            </span>
            <Button
              asChild
              size="sm"
              // min-h-10 forces a 40px tap height even at the smaller
              // `sm` size, matching the iOS HIG comfort floor without
              // bumping the desktop visual past where the page header
              // expects it.
              className="rounded-full text-xs sm:text-sm px-3 sm:px-4 min-h-10 flex-shrink-0 active:scale-95"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              <Link href={cl("/post-job")}>{t("common.add")}</Link>
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
              className="bg-[var(--hm-bg-elevated)] border-[var(--hm-border)]"
            />
          </div>
        )}

        {/* ==================== JOB CARDS ZONE ==================== */}
        {visibleJobs.length === 0 ? (
          /* Empty state. Previously used the EmptyState component's
             `titleKa` / `descriptionKa` side-channel which (a) skipped
             Russian entirely and (b) violated the project rule "never
             hardcode user-facing strings, always use t()". The
             EmptyState component still supports the side-channel for
             legacy callers; new copy threads through proper i18n keys
             instead. */
          <EmptyState
            icon={Briefcase}
            title={t(jobs.length === 0 ? "job.noJobsYet" : "job.noJobsMatchSearch")}
            description={t(
              jobs.length === 0 ? "job.noJobsYetBody" : "job.noJobsMatchSearchBody",
            )}
            actionLabel={jobs.length === 0 ? t("job.postJob") : undefined}
            actionHref={jobs.length === 0 ? "/post-job" : undefined}
            variant="illustrated"
            // Zero-jobs is a first-impression moment - bump to `lg`
            // so the CTA gets the full hero treatment. Filtered-empty
            // (user already has jobs, just narrowed them out) stays
            // `md` so it doesn't shove the rest of the page down.
            size={jobs.length === 0 ? "lg" : "md"}
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
                  onClick={() => router.push(`/${(job.country ?? 'GE').toLowerCase()}/jobs/${job.id}`)}
                  className="group relative bg-[var(--hm-bg-elevated)] rounded-xl sm:rounded-2xl overflow-hidden border border-[var(--hm-border-subtle)] hover:border-[var(--hm-brand-500)]/30 transition-colors duration-150 cursor-pointer hover:shadow-md flex"
                >
                  {/* Status color strip */}
                  <div className={`w-1 sm:w-1.5 flex-shrink-0 ${getStatusColor(job)}`} />

                  {/* Optional thumbnail - desktop only */}
                  {firstImage && (
                    <div className="hidden sm:block w-28 lg:w-36 flex-shrink-0 overflow-hidden bg-[var(--hm-bg-tertiary)]">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary-served + onError fallback; next/image conversion deferred until perf audit. */}
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
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-[var(--hm-brand-500)]/10 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--hm-brand-500)]">
                          {getCategoryLabel(job.category)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[var(--hm-fg-muted)]">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {formatTimeAgo(job.createdAt, t)}
                        </span>
                        {job.location && (
                          <span className="hidden sm:flex items-center gap-1 text-[11px] text-[var(--hm-fg-muted)] truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </span>
                        )}
                      </div>

                      {/* Budget + Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm sm:text-base font-bold text-[var(--hm-fg-primary)] tabular-nums whitespace-nowrap">
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
                                aria-label={t("common.edit")}
                                title={t("common.edit")}
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
                                aria-label={t("common.delete")}
                                title={t("common.delete")}
                                className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)]"
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
                              className="w-8 h-8 text-[var(--hm-warning-500)] hover:text-[var(--hm-warning-500)] hover:bg-[var(--hm-warning-50)]"
                              title={t("job.renew")}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Title + mobile location + unread-chat badge */}
                    <h3 className="text-[13px] sm:text-base font-semibold text-[var(--hm-fg-primary)] line-clamp-1 sm:line-clamp-2 group-hover:text-[var(--hm-brand-500)] transition-colors duration-150 mb-0.5 flex items-center gap-1.5">
                      <span className="line-clamp-1 sm:line-clamp-2">{job.title}</span>
                      {/* Unread message count for in-progress jobs.
                          Surfaces backend data that was previously
                          trapped inside ProjectChat - now visible
                          on the list card so users know which jobs
                          have new activity without opening each. */}
                      {chatUnreadByJob[job.id] > 0 && (
                        <span
                          className="flex-shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-[var(--hm-brand-500)] text-white text-[10px] font-bold"
                          title={t("notifications.filters.unread")}
                          aria-label={t("notifications.filters.unread")}
                        >
                          {chatUnreadByJob[job.id]}
                        </span>
                      )}
                    </h3>

                    {/* Mobile location */}
                    {job.location && (
                      <span className="sm:hidden flex items-center gap-1 text-[10px] text-[var(--hm-fg-muted)] mb-1">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </span>
                    )}

                    {/* Description - desktop only */}
                    <p className="hidden sm:block text-[13px] text-[var(--hm-fg-muted)] line-clamp-1 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Footer: proposals / hired pro / actions */}
                    <div className="flex items-center justify-between mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-[var(--hm-border-subtle)] gap-2">
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
                                    className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[var(--hm-bg-tertiary)] border-2 border-white overflow-hidden"
                                    style={{ zIndex: 3 - i }}
                                  >
                                    {proposal?.proId?.avatar ? (
                                      <Image src={storage.getFileUrl(proposal.proId.avatar)} alt={proName} fill sizes="32px" className="object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[9px] sm:text-[11px] font-semibold text-[var(--hm-fg-muted)] bg-gradient-to-br from-[var(--hm-bg-tertiary)] to-[var(--hm-border)]">
                                        {initial || <Users className="w-2.5 h-2.5" />}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {job.proposalCount > 3 && (
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[var(--hm-brand-500)]/10 border-2 border-white flex items-center justify-center text-[9px] sm:text-[11px] font-bold text-[var(--hm-brand-500)]">
                                  +{job.proposalCount - 3}
                                </div>
                              )}
                            </div>
                            {job.proposalCount === 1 && job.recentProposals?.[0]?.proId?.name && (
                              <span className="min-w-0 text-[11px] sm:text-[12px] text-[var(--hm-fg-muted)] truncate">
                                {t("job.from")} {job.recentProposals[0].proId.name}
                              </span>
                            )}
                          </>
                        )}
                        {isOpen && job.proposalCount === 0 && (
                          <div className="flex items-center gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-[var(--hm-warning-50)]/20 border border-amber-100/80">
                            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-full w-full bg-[var(--hm-warning-500)]" />
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-medium text-[var(--hm-warning-500)]">
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
                                className="w-7 h-7 sm:w-8 sm:h-8 ring-2 ring-[var(--hm-brand-500)]/20"
                              />
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                                <Check className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--hm-brand-500)] block">
                                {t("common.hired")}
                              </span>
                              <span className="text-[12px] sm:text-[13px] font-semibold text-[var(--hm-fg-primary)] truncate block">
                                {job.hiredPro.name || job.hiredPro.userId?.name || "Professional"}
                              </span>
                            </div>
                          </div>
                        )}
                        {isExpired && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--hm-warning-50)]/20">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--hm-warning-500)]" />
                            <span className="text-[10px] sm:text-[11px] font-medium text-[var(--hm-warning-500)]">
                              {t("job.expired")}
                            </span>
                          </div>
                        )}
                        {/* Stats: views */}
                        <div className="hidden sm:flex items-center gap-1 text-[11px] text-[var(--hm-fg-muted)] ml-auto mr-2">
                          <Eye className="w-3 h-3" />
                          {job.viewCount || 0}
                        </div>
                      </div>

                      {/* Right: CTA buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Mobile action icons - bumped from 28px to
                            36px so they reliably hit a finger tap on
                            phones. Each icon also got a slight bump to
                            14px so the visual stays balanced inside the
                            larger button. */}
                        <div className="flex sm:hidden items-center gap-0.5">
                          {isOpen && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                onClick={(e) => e.stopPropagation()}
                                aria-label={t("common.edit")}
                                className="w-9 h-9 active:scale-95"
                              >
                                <Link href={`/post-job?edit=${job.id}`}>
                                  <Edit3 className="w-3.5 h-3.5" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); setDeleteModalJob(job); }}
                                disabled={deletingJobId === job.id}
                                aria-label={t("common.delete")}
                                className="w-9 h-9 active:scale-95 text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          {isExpired && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); handleRenewJob(job.id); }}
                              disabled={renewingJobId === job.id}
                              loading={renewingJobId === job.id}
                              className="w-9 h-9 active:scale-95 text-[var(--hm-warning-500)]"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>

                        {isOpen && job.proposalCount > 0 && (
                          <Button
                            variant="default"
                            size="sm"
                            asChild
                            onClick={(e) => { e.stopPropagation(); handleViewProposals(job.id); }}
                            className="group/btn text-[11px] sm:text-[13px] h-7 sm:h-8 px-2.5 sm:px-3"
                          >
                            <Link href={`/my-jobs/${job.id}/proposals`} className="flex items-center gap-1.5">
                              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              {t("job.viewProposalsCount", { count: job.proposalCount })}
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
        icon={<AlertTriangle className="w-6 h-6 text-[var(--hm-error-500)]" />}
        variant="danger"
        cancelLabel={t("common.cancel")}
        confirmLabel={t("common.delete")}
        isLoading={!!deletingJobId}
        loadingLabel={t("common.deleting")}
        confirmIcon={<Trash2 className="w-4 h-4" />}
      >
        {/* Job preview */}
        {deleteModalJob && (
          <div className="bg-[var(--hm-bg-tertiary)]/50 rounded-xl p-3 sm:p-4 mb-4">
            <p className="font-medium text-[var(--hm-fg-primary)] text-sm">
              {deleteModalJob.title}
            </p>
            <p className="text-xs text-[var(--hm-fg-muted)] mt-1 line-clamp-2">
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
                ? "py-20 flex items-center justify-center bg-[var(--hm-bg-elevated)]"
                : "min-h-screen flex items-center justify-center bg-[var(--hm-bg-elevated)]"
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
