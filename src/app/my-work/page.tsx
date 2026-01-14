"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Avatar from "@/components/common/Avatar";
import BackButton from "@/components/common/BackButton";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import type {
  Job,
  ProjectStage,
  ProjectTracking,
  Proposal,
} from "@/types/shared";
import { formatBudget } from "@/utils/currencyUtils";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Clock,
  Search,
  X
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

// Status config type
interface StatusConfig {
  label: string;
  labelKa: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

const TERRACOTTA = "#C4735B";

const STAGE_LABELS: Record<
  ProjectStage,
  { en: string; ka: string }
> = {
  hired: { en: "Hired", ka: "დაქირავებული" },
  started: { en: "Started", ka: "დაწყებული" },
  in_progress: { en: "In Progress", ka: "მიმდინარე" },
  review: { en: "Review", ka: "შემოწმება" },
  completed: { en: "Done", ka: "დასრულებული" },
};

function MyWorkPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale: language } = useLanguage();
  const toast = useToast();
  const router = useRouter();

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
    <div>
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        {/* Header - Enhanced */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <BackButton showLabel={false} className="mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  {language === "ka" ? "ჩემი სამუშაო" : "My Work"}
                </h1>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C4735B]/10 text-[#C4735B]">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">
                    {works.length}
                  </span>
                </div>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">
                {language === "ka"
                  ? "აქ არის თქვენი აქტიური და დასრულებული პროექტები"
                  : "Your active and completed projects"}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        {works.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Input
                type="text"
                placeholder={
                  language === "ka"
                    ? "ძებნა სამუშაოს სახელით, კატეგორიით ან მდებარეობით..."
                    : "Search by job title, category, or location..."
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
          <div className="space-y-4 sm:space-y-5">
            {works.map((proposal, index) => {
              const job = proposal.jobId;
              if (!job || typeof job === "string") return null;

              // For active or completed projects
              if (isActiveProject(proposal) || isProjectCompleted(proposal)) {
                return (
                  <div
                    key={proposal.id}
                    className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={job.clientId?.avatar}
                          name={job.clientId?.name || t("common.client")}
                          size="md"
                          className="w-10 h-10"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                            {job.title}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {job.clientId?.name || t("common.client")}
                            {job.location ? ` · ${job.location}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={isProjectCompleted(proposal) ? "success" : "info"}
                          size="sm"
                        >
                          {isProjectCompleted(proposal)
                            ? t("common.completed")
                            : t("common.inProgress")}
                        </Badge>
                        <Button
                          asChild
                          size="sm"
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          <Link href={`/jobs/${job.id}`}>{t("common.open")}</Link>
                        </Button>
                      </div>
                    </div>

                    <div className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                        <div className="inline-flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-neutral-400" />
                          <span className="font-medium">
                            {formatBudget(job)}
                          </span>
                        </div>
                        {proposal.projectTracking?.currentStage && (
                          <div className="inline-flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-neutral-400" />
                            <span>
                              {language === "ka" ? "სტატუსი" : "Stage"}:{" "}
                              {STAGE_LABELS[proposal.projectTracking.currentStage]?.[
                                language === "ka" ? "ka" : "en"
                              ] || proposal.projectTracking.currentStage}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                        {language === "ka"
                          ? "პროექტის ჩათი/რესურსები/დეტალები ნახეთ სამუშაოს გვერდზე"
                          : "Open the job page to view chat, resources, and project details"}
                      </p>
                    </div>
                  </div>
                );
              }

              // Pending / rejected proposals are not shown on this page anymore.
              return null;
            })}
          </div>
        )}
      </main>

    </div>
  );
}

export default function MyWorkPage() {
  return (
    <AuthGuard allowedRoles={["pro", "admin"]}>
      <MyWorkPageContent />
    </AuthGuard>
  );
}
