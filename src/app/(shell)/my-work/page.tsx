"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Avatar from "@/components/common/Avatar";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import PageShell from "@/components/ui/PageShell";
import { SearchInput } from "@/components/ui/SearchInput";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { formatBudget } from "@/utils/currencyUtils";
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

const TERRACOTTA = "#C4735B";

const STAGE_CONFIG: Record<
  ProjectStage,
  { en: string; ka: string; color: string; step: number }
> = {
  hired: { en: "Hired", ka: "დაქირავებული", color: "bg-blue-500", step: 1 },
  started: { en: "Started", ka: "დაწყებული", color: "bg-[#C4735B]", step: 2 },
  in_progress: { en: "In Progress", ka: "მიმდინარე", color: "bg-[#C4735B]", step: 3 },
  review: { en: "Under Review", ka: "შემოწმება", color: "bg-amber-500", step: 4 },
  completed: { en: "Completed", ka: "დასრულებული", color: "bg-emerald-500", step: 5 },
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

  const fetchAllProposals = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      const response = await api.get(`/jobs/my-proposals/list`);
      const data = Array.isArray(response.data) ? response.data : [];
      setAllProposals(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Failed to load data");
    } finally {
      setIsInitialLoading(false);
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
      console.log("[MyWork] WebSocket connected");
    });

    // Listen for project stage updates
    socketRef.current.on(
      "projectStageUpdate",
      (data: ProjectStageUpdateEvent) => {
        console.log("[MyWork] Project stage update:", data);
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
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C4735B] to-[#A85D48] opacity-20 animate-pulse" />
            <div className="absolute inset-2 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-[#C4735B] animate-pulse" />
            </div>
            <div
              className="absolute inset-0 rounded-2xl border-2 border-[#C4735B]/30 animate-spin"
              style={{ animationDuration: "3s" }}
            />
          </div>
          <p className="text-[var(--color-text-secondary)] font-medium">
            {language === "ka" ? "იტვირთება..." : "Loading..."}
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            {language === "ka" ? "შეცდომა" : "Error"}
          </h3>
          <p className="text-[var(--color-text-secondary)] mb-6">{error}</p>
          <button
            onClick={fetchAllProposals}
            className="px-6 py-3 rounded-xl bg-[#C4735B] text-white font-medium hover:bg-[#A85D48] transition-all"
          >
            {language === "ka" ? "ხელახლა ცდა" : "Try Again"}
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C4735B]/10 text-[#C4735B] text-xs font-semibold">
            {works.length}
          </span>
        </div>
      }
    >

        {/* Search */}
        {works.length > 0 && (
          <div className="mb-6">
            <SearchInput
              placeholder={
                language === "ka"
                  ? "ძებნა სამუშაოს სახელით, კატეგორიით ან მდებარეობით..."
                  : "Search by job title, category, or location..."
              }
              value={searchQuery}
              onValueChange={setSearchQuery}
              inputSize="default"
              className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
            />
          </div>
        )}

        {/* Content */}
        {works.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={language === "ka" ? "სამუშაოები არ არის" : "No work yet"}
            titleKa={language === "ka" ? "სამუშაოები არ არის" : "No work yet"}
            description={
              language === "ka"
                ? "როცა კლიენტი მიიღებს შენს შეთავაზებას, პროექტი აქ გამოჩნდება"
                : "When a client accepts your proposal, it will appear here"
            }
            descriptionKa={
              language === "ka"
                ? "როცა კლიენტი მიიღებს შენს შეთავაზებას, პროექტი აქ გამოჩნდება"
                : "When a client accepts your proposal, it will appear here"
            }
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
                  href={`/jobs/${job.id}`}
                  className="group flex bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 hover:border-[#C4735B]/30 dark:hover:border-[#C4735B]/30 transition-colors duration-150 hover:shadow-md"
                >
                  {/* Status color strip */}
                  <div className={`w-1 sm:w-1.5 flex-shrink-0 ${completed ? "bg-emerald-500" : stageConfig?.color || "bg-[#C4735B]"}`} />

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
                          <span className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 truncate block">
                            {job.clientId?.name || t("common.client")}
                          </span>
                        </div>
                        <Badge
                          variant={completed ? "success" : "info"}
                          size="sm"
                          className="flex-shrink-0"
                        >
                          {completed ? t("common.completed") : stageConfig
                            ? (language === "ka" ? stageConfig.ka : stageConfig.en)
                            : t("common.inProgress")}
                        </Badge>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                          {agreedPrice ? `${agreedPrice.toLocaleString()}₾` : formatBudget(job, t)}
                        </p>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-[13px] sm:text-base font-semibold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-[#C4735B] transition-colors duration-150 mb-0.5">
                      {job.title}
                    </h3>

                    {/* Meta: location + category */}
                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-neutral-400 mb-2 sm:mb-2.5">
                      {job.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </span>
                      )}
                      {job.category && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#C4735B]/10 font-semibold uppercase tracking-wider text-[#C4735B]">
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
                                    ? config.step === stageConfig?.step ? stageConfig.color : "bg-emerald-500"
                                    : "bg-neutral-200 dark:bg-neutral-700"
                                }`} />
                                <span className={`hidden sm:inline text-[10px] ${
                                  key === stage ? "font-semibold text-neutral-700 dark:text-neutral-200" : "text-neutral-400"
                                }`}>
                                  {language === "ka" ? config.ka : config.en}
                                </span>
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 tabular-nums">
                            {progress}%
                          </span>
                        </div>
                        <div className="h-1 sm:h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${stageConfig?.color || "bg-[#C4735B]"}`}
                            style={{ width: `${Math.max(progress, 5)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Completed badge for completed projects */}
                    {completed && (
                      <div className="flex items-center gap-1.5 mb-2.5 sm:mb-3 px-2 py-1 sm:py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100/80 dark:border-emerald-800/30 w-fit">
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                        <span className="text-[10px] sm:text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          {proposal.projectTracking?.completedAt
                            ? `${language === "ka" ? "დასრულდა" : "Completed"} ${new Date(proposal.projectTracking.completedAt).toLocaleDateString(language === "ka" ? "ka-GE" : "en-US", { month: "short", day: "numeric" })}`
                            : t("common.completed")}
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center gap-3 text-[10px] sm:text-[11px] text-neutral-400">
                        {proposal.projectTracking?.startedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {language === "ka" ? "დაწყებული" : "Started"}{" "}
                            {new Date(proposal.projectTracking.startedAt).toLocaleDateString(
                              language === "ka" ? "ka-GE" : "en-US",
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
                      <div className="flex items-center gap-1 text-[11px] sm:text-[13px] font-medium text-[#C4735B] group-hover:gap-2 transition-all">
                        <span>{language === "ka" ? "გახსნა" : "View"}</span>
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
