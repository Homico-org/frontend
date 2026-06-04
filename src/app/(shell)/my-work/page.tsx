"use client";

import { ACCENT_COLOR } from "@/constants/theme";
import AuthGuard from "@/components/common/AuthGuard";
import Avatar from "@/components/common/Avatar";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import PageShell from "@/components/ui/PageShell";
import { SearchInput } from "@/components/ui/SearchInput";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useToast } from "@/contexts/ToastContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import type {
  Job,
  ProjectStage,
  ProjectTracking,
  Proposal,
} from "@/types/shared";
import { formatBudget, type Currency } from "@/utils/currencyUtils";
import { currencyForCountry } from "@/data/countries";
import { formatCurrency } from "@/utils/currency";
import { extractApiErrorMessage } from "@/utils/errorUtils";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ProjectInvitations } from "@/components/projects/ProjectInvitations";

// Proposal with populated job (for my-work page)
type WorkProposal = Omit<Proposal, "jobId"> & { jobId: Job };

// Socket event data types
interface ProjectStageUpdateEvent {
  jobId: string;
  stage: ProjectStage;
  progress: number;
  project?: {
    startedAt?: string;
    completedAt?: string;
  };
}

const TERRACOTTA = ACCENT_COLOR;

// Per-stage display metadata. Stage label translations live in the
// existing `jobDetail.stages.*` namespace (en/ka/ru) so the same
// canonical string powers every surface that renders a stage chip -
// previously this file carried its own hardcoded en/ka pair which
// (a) duplicated the i18n source and (b) silently fell back to
// English for Russian users.
const STAGE_CONFIG: Record<ProjectStage, { color: string; step: number }> = {
  hired: { color: "bg-[var(--hm-info-500)]", step: 1 },
  started: { color: "bg-[var(--hm-brand-500)]", step: 2 },
  in_progress: { color: "bg-[var(--hm-brand-500)]", step: 3 },
  review: { color: "bg-[var(--hm-warning-500)]", step: 4 },
  completed: { color: "bg-[var(--hm-success-500)]", step: 5 },
};

function MyWorkPageContent({ embedded }: { embedded?: boolean }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale: language } = useLanguage();
  const { getCategoryLabel } = useCategoryLabels();
  const toast = useToast();
  const router = useRouter();
  const isEmbedded = !!embedded;

  const [allProposals, setAllProposals] = useState<WorkProposal[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Per-jobId chat-unread counts for accepted proposals. Populated
  // by fetchAllProposals via /jobs/projects/:id/unread-counts.
  const [chatUnreadByJob, setChatUnreadByJob] = useState<Record<string, number>>({});

  const hasFetched = useRef(false);
  const socketRef = useRef<Socket | null>(null);

  // Helper functions
  const isProjectCompleted = (p: WorkProposal) =>
    p.projectTracking?.currentStage === "completed" || p.status === "completed";

  const isActiveProject = (p: WorkProposal) =>
    p.status === "accepted" && p.projectTracking?.currentStage !== "completed";

  // Only show "works" here: accepted/hired projects (active + completed).
  // Proposals list is handled inside the job page itself.
  const works = useMemo(() => {
    let filtered = allProposals.filter(
      (p) => isActiveProject(p) || isProjectCompleted(p)
    );

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        const job = p.jobId;
        return (
          job?.title?.toLowerCase().includes(searchLower) ||
          job?.category?.toLowerCase().includes(searchLower) ||
          job?.location?.toLowerCase().includes(searchLower)
        );
      });
    }

    const getSortTime = (p: WorkProposal): number => {
      const job = p.jobId;
      const dateStr =
        p.projectTracking?.completedAt ||
        p.projectTracking?.startedAt ||
        (p as any).acceptedAt ||
        p.createdAt ||
        (job as any)?.createdAt ||
        null;
      const ms = dateStr ? new Date(dateStr).getTime() : 0;
      return Number.isFinite(ms) ? ms : 0;
    };

    return [...filtered].sort((a, b) => getSortTime(b) - getSortTime(a));
  }, [allProposals, searchQuery]);

  useEffect(() => {
    if (
      !authLoading &&
      (!isAuthenticated || (user?.role !== "pro" && user?.role !== "admin"))
    ) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Shared abort ref so a WS-reconnect refetch happening mid-mount
  // cancels the prior in-flight request, plus the standard Strict Mode
  // double-mount dedup.
  const fetchAllProposalsAbortRef = useRef<AbortController | null>(null);
  const fetchAllProposals = useCallback(async () => {
    fetchAllProposalsAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAllProposalsAbortRef.current = controller;
    try {
      setIsInitialLoading(true);
      const response = await api.get(`/jobs/my-proposals/list`, {
        signal: controller.signal,
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setAllProposals(data);
      setError(null);
      // Fetch chat-unread for active proposals (status==='accepted'
      // means there's a project chat the pro can be missing
      // messages in). Best-effort - failures are silent.
      const activeJobIds = data
        .filter((p: WorkProposal) => p.status === "accepted" && p.jobId?.id)
        .map((p: WorkProposal) => p.jobId.id);
      if (activeJobIds.length > 0) {
        const counts: Record<string, number> = {};
        await Promise.all(
          activeJobIds.map(async (jobId: string) => {
            try {
              const res = await api.get<{ chat?: number }>(
                `/jobs/projects/${jobId}/unread-counts`,
                { signal: controller.signal },
              );
              if (res.data?.chat) counts[jobId] = res.data.chat;
            } catch {
              // Silent: single failure doesn't break the list
            }
          }),
        );
        if (!controller.signal.aborted) {
          setChatUnreadByJob(counts);
        }
      }
    } catch (err) {
      const name = (err as { name?: string })?.name;
      const code = (err as { code?: string })?.code;
      if (name === "CanceledError" || code === "ERR_CANCELED") return;
      console.error("Failed to fetch proposals:", err);
      setError(extractApiErrorMessage(err, "Failed to load data"));
    } finally {
      if (!controller.signal.aborted) {
        setIsInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (
      isAuthenticated &&
      (user?.role === "pro" || user?.role === "admin") &&
      !hasFetched.current
    ) {
      hasFetched.current = true;
      fetchAllProposals();

      api.post(`/jobs/counters/mark-proposal-updates-viewed`).catch(() => {});
    }
  }, [isAuthenticated, user, fetchAllProposals]);

  // Stable ref to the latest fetchAllProposals so the socket
  // reconnect handler always invokes the freshest closure without
  // re-mounting the socket on every render.
  const fetchAllProposalsRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    fetchAllProposalsRef.current = () => {
      void fetchAllProposals();
    };
  }, [fetchAllProposals]);

  // Lightweight chat-unread refresh. Mirrors the pattern on /my-jobs:
  // when a new notification arrives or the tab regains focus, just
  // re-pull the per-job badge counts (no proposal-list refetch).
  const { unreadCount: notifUnreadCount } = useNotifications();
  const refreshChatUnreadCounts = useCallback(async () => {
    const activeJobIds = allProposals
      .filter((p) => p.status === "accepted" && p.jobId?.id)
      .map((p) => p.jobId.id);
    if (activeJobIds.length === 0) return;
    const next: Record<string, number> = {};
    await Promise.all(
      activeJobIds.map(async (jobId) => {
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
  }, [allProposals]);

  // Refetch on UP-transition of the notification badge count -
  // signals a new in-flight message-type notification.
  const lastNotifUnreadRef = useRef(notifUnreadCount);
  useEffect(() => {
    if (notifUnreadCount > lastNotifUnreadRef.current) {
      void refreshChatUnreadCounts();
    }
    lastNotifUnreadRef.current = notifUnreadCount;
  }, [notifUnreadCount, refreshChatUnreadCounts]);

  // Refetch when the tab regains focus (user replied in another
  // tab; come back to a list that should reflect the new zero).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshChatUnreadCounts();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refreshChatUnreadCounts]);

  // WebSocket connection for real-time project stage updates
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const wsUrl = apiUrl.replace(/^http/, "ws");

    socketRef.current = io(`${wsUrl}/chat`, {
      auth: { token },
      // WebSocket first, polling fallback. WS-only meant corporate
      // firewall users got no real-time updates at all; the upgrade
      // path negotiates automatically when WS is available.
      transports: ["websocket", "polling"],
      // Auto-reconnect with backoff. Without this, sleep/wake and
      // network blips silently killed the stage-update stream and
      // the user had to navigate away/back to recover.
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Refetch proposals on reconnect so stage updates that fired
    // during the disconnect window get pulled in. WebSocket replay
    // doesn't cover the offline gap. Goes through a ref so the
    // socket effect doesn't have to list `fetchAllProposals` as a
    // dep (which would re-mount the socket on every render).
    socketRef.current.io.on("reconnect", () => {
      fetchAllProposalsRef.current?.();
    });

    // Listen for project stage updates
    socketRef.current.on(
      "projectStageUpdate",
      (data: ProjectStageUpdateEvent) => {
        // Update the proposal's project tracking data in state
        setAllProposals((prevProposals) =>
          prevProposals.map((proposal) => {
            if (proposal.jobId.id === data.jobId) {
              return {
                ...proposal,
                projectTracking: proposal.projectTracking
                  ? {
                      ...proposal.projectTracking,
                      currentStage:
                        data.stage as ProjectTracking["currentStage"],
                      progress: data.progress,
                      startedAt: data.project?.startedAt,
                      completedAt: data.project?.completedAt,
                    }
                  : undefined,
              };
            }
            return proposal;
          })
        );
      }
    );

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  // Note: proposals management (withdraw, etc.) is handled on the job page.

  // Loading State
  if (authLoading || isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--hm-brand-500)] to-[#A85D48] opacity-20 animate-pulse" />
            <div className="absolute inset-2 rounded-xl bg-[var(--hm-bg-elevated)] flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-[var(--hm-brand-500)] animate-pulse" />
            </div>
            <div
              className="absolute inset-0 rounded-2xl border-2 border-[var(--hm-brand-500)]/30 animate-spin"
              style={{ animationDuration: "3s" }}
            />
          </div>
          <p className="text-[var(--hm-fg-secondary)] font-medium">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--hm-error-500)]/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-[var(--hm-error-500)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--hm-fg-primary)] mb-2">
            {t("common.error")}
          </h3>
          <p className="text-[var(--hm-fg-secondary)] mb-6">{error}</p>
          <button
            onClick={fetchAllProposals}
            className="px-6 py-3 rounded-xl bg-[var(--hm-brand-500)] text-white font-medium hover:bg-[#A85D48] transition-all"
          >
            {t("common.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      variant={isEmbedded ? "embedded" : "standalone"}
      showHeader={!isEmbedded}
      icon={Briefcase}
      title={t("job.myWork")}
      subtitle={t("job.myWorkSubtitle")}
      headerContentClassName={isEmbedded ? "max-w-none" : "mx-auto max-w-6xl"}
      bodyContentClassName={isEmbedded ? undefined : "mx-auto max-w-6xl"}
      bodyClassName={!isEmbedded ? "pb-24" : undefined}
      rightContent={
        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)] text-xs font-semibold">
            {works.length}
          </span>
        </div>
      }
    >

        {/* Pro-side inbox of pending project engagement invites. Renders
            nothing when the list is empty so it stays out of the way. */}
        <ProjectInvitations />

        {/* Search */}
        {works.length > 0 && (
          <div className="mb-6">
            <SearchInput
              placeholder={t("job.searchByTitle")}
              value={searchQuery}
              onValueChange={setSearchQuery}
              inputSize="default"
              className="bg-[var(--hm-bg-elevated)] border-[var(--hm-border)]"
            />
          </div>
        )}

        {/* Content */}
        {works.length === 0 ? (
          /* Empty state. Previously had two bugs: (a) `titleKa` was set
             to the SAME ternary as `title`, so the EmptyState side-
             channel did nothing - whatever `title` rendered also went
             into the ka slot; (b) Russian users got the English copy.
             Both fixed by routing through proper i18n keys. */
          <EmptyState
            icon={Briefcase}
            title={t("job.noWorkYet")}
            description={t("job.noWorkYetBody")}
            actionLabel={t("job.noWorkYetAction")}
            actionHref="/jobs"
            variant="illustrated"
            size="md"
          />
        ) : (
          <div className="space-y-3">
            {works.map((proposal) => {
              const job = proposal.jobId;
              if (!job || typeof job === "string") return null;
              if (!isActiveProject(proposal) && !isProjectCompleted(proposal)) return null;

              const completed = isProjectCompleted(proposal);
              const stage = proposal.projectTracking?.currentStage;
              const stageConfig = stage ? STAGE_CONFIG[stage] : null;
              const progress = proposal.projectTracking?.progress ?? 0;
              const agreedPrice = proposal.projectTracking?.agreedPrice;
              const firstImage = job.media?.[0]?.url || job.images?.[0];

              return (
                <Link
                  key={proposal.id}
                  href={`/${(job.country ?? 'GE').toLowerCase()}/jobs/${job.id}`}
                  className="group flex bg-[var(--hm-bg-elevated)] rounded-xl sm:rounded-2xl overflow-hidden border border-[var(--hm-border-subtle)] hover:border-[var(--hm-brand-500)]/30 transition-colors duration-150 hover:shadow-md"
                >
                  {/* Status color strip */}
                  <div className={`w-1 sm:w-1.5 flex-shrink-0 ${completed ? "bg-[var(--hm-success-500)]" : stageConfig?.color || "bg-[var(--hm-brand-500)]"}`} />

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
                    {/* Top: Client + Budget */}
                    <div className="flex items-start justify-between gap-3 mb-1.5 sm:mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          src={job.clientId?.avatar}
                          name={job.clientId?.name || t("common.client")}
                          size="sm"
                          className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[11px] sm:text-xs text-[var(--hm-fg-muted)] truncate block">
                            {job.clientId?.name || t("common.client")}
                          </span>
                        </div>
                        {/* Truncate cap at 12 chars stops the longer
                            Georgian stage labels ("დაქირავებული",
                            "მიმდინარეობს" etc.) from pushing the price
                            off the right edge on 320-360px phones.
                            Full label still shows via the title attr. */}
                        <Badge
                          variant={completed ? "success" : "info"}
                          size="sm"
                          className="flex-shrink-0 max-w-[100px] sm:max-w-none truncate"
                          title={completed ? t("common.completed") : stage
                            ? t(`jobDetail.stages.${stage}`)
                            : t("common.inProgress")}
                        >
                          {completed ? t("common.completed") : stage
                            ? t(`jobDetail.stages.${stage}`)
                            : t("common.inProgress")}
                        </Badge>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm sm:text-base font-bold text-[var(--hm-fg-primary)] tabular-nums whitespace-nowrap">
                          {agreedPrice
                            ? formatCurrency(agreedPrice, {
                                country: job.country ?? 'GE',
                              })
                            : formatBudget(job, t, currencyForCountry(job.country) as Currency)}
                        </p>
                      </div>
                    </div>

                    {/* Title + unread-chat badge */}
                    <h3 className="text-[13px] sm:text-base font-semibold text-[var(--hm-fg-primary)] line-clamp-1 group-hover:text-[var(--hm-brand-500)] transition-colors duration-150 mb-0.5 flex items-center gap-1.5">
                      <span className="line-clamp-1">{job.title}</span>
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

                    {/* Meta: location + category */}
                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[var(--hm-fg-muted)] mb-2 sm:mb-2.5">
                      {job.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </span>
                      )}
                      {job.category && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[var(--hm-brand-500)]/10 font-semibold uppercase tracking-wider text-[var(--hm-brand-500)]">
                          {getCategoryLabel(job.category)}
                        </span>
                      )}
                    </div>

                    {/* Progress bar for active projects */}
                    {!completed && stage && (
                      <div className="mb-2.5 sm:mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-3">
                            {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                              <div key={key} className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                  config.step <= (stageConfig?.step || 0)
                                    ? config.step === stageConfig?.step ? stageConfig.color : "bg-[var(--hm-success-500)]"
                                    : "bg-[var(--hm-bg-tertiary)]"
                                }`} />
                                <span className={`hidden sm:inline text-[10px] ${
                                  key === stage ? "font-semibold text-[var(--hm-fg-secondary)]" : "text-[var(--hm-fg-muted)]"
                                }`}>
                                  {t(`jobDetail.stages.${key}`)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--hm-fg-muted)] tabular-nums">
                            {progress}%
                          </span>
                        </div>
                        <div className="h-1 sm:h-1.5 rounded-full bg-[var(--hm-bg-tertiary)] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${stageConfig?.color || "bg-[var(--hm-brand-500)]"}`}
                            style={{ width: `${Math.max(progress, 5)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Completed badge for completed projects */}
                    {completed && (
                      <div className="flex items-center gap-1.5 mb-2.5 sm:mb-3 px-2 py-1 sm:py-1.5 rounded-lg bg-[var(--hm-success-50)]/20 border border-emerald-100/80 w-fit">
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--hm-success-500)]" />
                        <span className="text-[10px] sm:text-[11px] font-medium text-[var(--hm-success-500)]">
                          {proposal.projectTracking?.completedAt
                            ? `${t("job.completedOn")} ${new Date(proposal.projectTracking.completedAt).toLocaleDateString(language === "ka" ? "ka-GE" : language === "ru" ? "ru-RU" : "en-US", { month: "short", day: "numeric" })}`
                            : t("common.completed")}
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-[var(--hm-border-subtle)]">
                      <div className="flex items-center gap-3 text-[10px] sm:text-[11px] text-[var(--hm-fg-muted)]">
                        {proposal.projectTracking?.startedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {t("job.startedOn")}{" "}
                            {new Date(proposal.projectTracking.startedAt).toLocaleDateString(
                              language === "ka" ? "ka-GE" : language === "ru" ? "ru-RU" : "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        )}
                        {(proposal.projectTracking?.comments?.length || 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {proposal.projectTracking!.comments.length}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] sm:text-[13px] font-medium text-[var(--hm-brand-500)] group-hover:gap-2 transition-all">
                        <span>{t("common.view")}</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
    </PageShell>
  );
}

export default function MyWorkPage() {
  return (
    <AuthGuard allowedRoles={["pro", "admin"]}>
      <MyWorkPageContent embedded />
    </AuthGuard>
  );
}
