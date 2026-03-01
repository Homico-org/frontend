"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Avatar from "@/components/common/Avatar";
import JobCard from "@/components/common/JobCard";
import ReviewItem from "@/components/professionals/ReviewItem";
import type { Review } from "@/components/professionals/ReviewItem";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import type {
  Job,
  Proposal,
  ProjectStage,
} from "@/types/shared";
import { formatBudget } from "@/utils/currencyUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Calendar,
  CheckCircle,
  Copy,
  ExternalLink,
  MapPin,
  MessageSquare,
  Send,
  Star,
  UserCog,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, ReactNode } from "react";

type WorkProposal = Omit<Proposal, "jobId"> & { jobId: Job };

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  homicoReviews: number;
  externalReviews: number;
  pendingInvitations: number;
}

const STAGE_CONFIG: Record<
  ProjectStage,
  { en: string; ka: string; color: string; step: number }
> = {
  hired: { en: "Hired", ka: "დაქირავებული", color: "#3b82f6", step: 1 },
  started: { en: "Started", ka: "დაწყებული", color: "#C4735B", step: 2 },
  in_progress: { en: "In Progress", ka: "მიმდინარე", color: "#C4735B", step: 3 },
  review: { en: "Under Review", ka: "შემოწმება", color: "#f59e0b", step: 4 },
  completed: { en: "Completed", ka: "დასრულებული", color: "#22c55e", step: 5 },
};

/* ── Animation variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

/* ── Slide-in Modal (framer-motion) ── */
function SlideModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[520px] lg:w-[600px] bg-white dark:bg-neutral-950 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 sm:px-5 h-14 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
              <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Section header with optional "View all" ── */
function SectionHeader({
  title,
  count,
  onViewAll,
  viewAllLabel,
  viewAllHref,
}: {
  title: string;
  count?: number;
  onViewAll?: () => void;
  viewAllLabel?: string;
  viewAllHref?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
        {count !== undefined && count > 0 && (
          <span
            className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white rounded-full"
            style={{ backgroundColor: ACCENT_COLOR }}
          >
            {count}
          </span>
        )}
      </div>
      {viewAllHref ? (
        <Link href={viewAllHref} className="text-xs font-medium flex items-center gap-0.5 hover:underline" style={{ color: ACCENT_COLOR }}>
          {viewAllLabel || "View all"} <ArrowRight className="w-3 h-3" />
        </Link>
      ) : onViewAll ? (
        <button onClick={onViewAll} className="text-xs font-medium flex items-center gap-0.5 hover:underline" style={{ color: ACCENT_COLOR }}>
          {viewAllLabel || "View all"} <ArrowRight className="w-3 h-3" />
        </button>
      ) : null}
    </div>
  );
}

/* ── Empty state ── */
function EmptyBlock({ icon: Icon, text, subtext }: { icon: typeof Calendar; text: string; subtext?: string }) {
  return (
    <motion.div
      variants={cardVariants}
      className="rounded-xl py-8 text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
    >
      <Icon className="w-6 h-6 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
      <p className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>{text}</p>
      {subtext && <p className="text-[11px] mt-0.5 text-neutral-400/70">{subtext}</p>}
    </motion.div>
  );
}

function MySpaceContent() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { getCategoryLabel } = useCategoryLabels();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [workProposals, setWorkProposals] = useState<WorkProposal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newJobs, setNewJobs] = useState<Job[]>([]);
  const [myPostedJobs, setMyPostedJobs] = useState<Job[]>([]);

  // Reviews - request section
  const [reviewLink, setReviewLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Modal states
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();

  /* ── Initial data fetch ── */
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [rStats, proposalsRes, reviewsRes, jobsRes, reviewLinkRes, myJobsRes] =
        await Promise.allSettled([
          api.get("/reviews/stats/my"),
          api.get("/jobs/my-proposals/list"),
          api.get(`/reviews/pro/${user.id}`),
          api.get("/jobs?page=1&limit=6&sort=newest"),
          api.get("/reviews/request-link"),
          api.get("/jobs/my-jobs"),
        ]);
      if (rStats.status === "fulfilled") setReviewStats(rStats.value.data);
      if (proposalsRes.status === "fulfilled") {
        const data = Array.isArray(proposalsRes.value.data) ? proposalsRes.value.data : [];
        setWorkProposals(data);
      }
      if (reviewsRes.status === "fulfilled") {
        const raw = reviewsRes.value.data;
        const arr = Array.isArray(raw) ? raw : raw?.reviews || raw?.data || [];
        // Normalize _id → id for Mongoose documents
        setReviews(arr.map((r: any) => ({ ...r, id: r.id || r._id })));
      }
      if (jobsRes.status === "fulfilled") {
        const d = jobsRes.value.data;
        setNewJobs(d.data || d.jobs || []);
      }
      if (reviewLinkRes.status === "fulfilled") {
        setReviewLink(reviewLinkRes.value.data.link || "");
      }
      if (myJobsRes.status === "fulfilled") {
        const raw = myJobsRes.value.data;
        const allJobs: (Job & { services?: unknown[] })[] = Array.isArray(raw) ? raw : raw?.data || raw?.jobs || [];
        // Filter out mobile-created orders (those with services populated)
        setMyPostedJobs(allJobs.filter((j) => !j.services || j.services.length === 0));
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Active work ── */
  const activeWork = useMemo(() => {
    return workProposals
      .filter((p) => p.status === "accepted" && p.projectTracking?.currentStage !== "completed")
      .sort((a, b) => {
        const aT = a.projectTracking?.startedAt ? new Date(a.projectTracking.startedAt).getTime() : 0;
        const bT = b.projectTracking?.startedAt ? new Date(b.projectTracking.startedAt).getTime() : 0;
        return bT - aT;
      });
  }, [workProposals]);

  /* ── Review actions ── */
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(reviewLink);
      setIsCopied(true);
      toast.success(t("common.success"), t("reviews.linkCopied"));
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 3000);
    } catch {
      toast.error(t("common.error"), t("common.tryAgain"));
    }
  };

  const shareOnWhatsApp = () => {
    const message = `${t("reviews.leaveReview")}: ${reviewLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const sendInvitation = async () => {
    if (!invitePhone.trim()) {
      toast.error(t("common.error"), t("common.required"));
      return;
    }
    setIsSendingInvite(true);
    try {
      await api.post("/reviews/send-invitation", {
        phone: invitePhone.trim(),
        name: inviteName.trim() || undefined,
      });
      toast.success(t("common.success"), t("reviews.invitationSent"));
      setInvitePhone("");
      setInviteName("");
      fetchData();
    } catch (err: any) {
      const message = err.response?.data?.message || t("common.error");
      toast.error(t("common.error"), message);
    } finally {
      setIsSendingInvite(false);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-neutral-200 rounded-full animate-spin" style={{ borderTopColor: ACCENT_COLOR }} />
      </div>
    );
  }

  const isPro = user?.role === "pro";
  const isAdmin = user?.role === "admin";
  const firstName = user?.name?.split(" ")[0] || "";

  const reviewValue = reviewStats?.totalReviews
    ? `${reviewStats.totalReviews} · ★ ${reviewStats.averageRating?.toFixed(1) ?? "—"}`
    : "0";

  const statItems = [
    { label: t("mySpace.manageReviews"), value: reviewValue, icon: Star, accent: "#16A34A", onClick: () => setShowReviewsModal(true) },
  ];

  /* ── Work card renderer ── */
  const renderWorkCard = (proposal: WorkProposal, index: number) => {
    const job = proposal.jobId;
    if (!job || typeof job === "string") return null;
    const stage = proposal.projectTracking?.currentStage;
    const stageConfig = stage ? STAGE_CONFIG[stage] : null;
    const progress = proposal.projectTracking?.progress ?? 0;
    const agreedPrice = proposal.projectTracking?.agreedPrice;
    const firstImage = job.media?.[0]?.url || job.images?.[0];

    return (
      <motion.div
        key={proposal.id}
        variants={cardVariants}
        layout
      >
        <Link
          href={`/jobs/${job.id}`}
          className="group flex rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-shadow hover:shadow-md"
        >
          <div className="w-1 flex-shrink-0" style={{ backgroundColor: stageConfig?.color || ACCENT_COLOR }} />
          {firstImage && (
            <div className="hidden sm:block w-20 lg:w-28 flex-shrink-0 bg-neutral-100 dark:bg-neutral-800">
              <img src={storage.getFileUrl(firstImage)} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0 p-2.5 sm:p-3">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar src={job.clientId?.avatar} name={job.clientId?.name || t("common.client")} size="xs" className="w-5 h-5 flex-shrink-0" />
                <span className="text-[11px] truncate" style={{ color: "var(--color-text-tertiary)" }}>{job.clientId?.name}</span>
                {stageConfig && <Badge variant="info" size="sm">{locale === "ka" ? stageConfig.ka : stageConfig.en}</Badge>}
              </div>
              <span className="text-xs font-bold whitespace-nowrap" style={{ color: "var(--color-text-primary)" }}>
                {agreedPrice ? `${agreedPrice.toLocaleString()}₾` : formatBudget(job, t)}
              </span>
            </div>
            <h3 className="text-[13px] font-semibold line-clamp-1 mb-1" style={{ color: "var(--color-text-primary)" }}>{job.title}</h3>
            <div className="flex items-center gap-1.5 text-[10px] mb-1.5" style={{ color: "var(--color-text-tertiary)" }}>
              {job.location && <span className="flex items-center gap-0.5 truncate"><MapPin className="w-2.5 h-2.5" />{job.location}</span>}
              {job.category && (
                <span className="px-1.5 py-px rounded-full font-semibold uppercase tracking-wider" style={{ backgroundColor: `${ACCENT_COLOR}10`, color: ACCENT_COLOR, fontSize: "9px" }}>
                  {getCategoryLabel(job.category)}
                </span>
              )}
            </div>
            {stage && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(progress, 4)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                    style={{ backgroundColor: stageConfig?.color || ACCENT_COLOR }}
                  />
                </div>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: "var(--color-text-tertiary)" }}>{progress}%</span>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-5"
    >
      {/* ── Header row ── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          {user && (
            <Avatar src={user.avatar} name={user.name} size="lg" rounded="xl" className="w-10 h-10 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
              {t("mySpace.welcomeBack")}{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="text-xs truncate" style={{ color: "var(--color-text-tertiary)" }}>{t("mySpace.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/pro/profile-setup"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: ACCENT_COLOR }}
          >
            <UserCog className="w-3.5 h-3.5" />
            {t("mySpace.editProfile")}
          </Link>
          {user && (
            <Link
              href={`/professionals/${user.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("mySpace.viewProfile")}</span>
            </Link>
          )}
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {statItems.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
            >
              <button
                onClick={s.onClick}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 w-full text-left transition-all duration-200 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: `${s.accent}12` }}
                >
                  <Icon className="w-4 h-4" style={{ color: s.accent }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-neutral-400 truncate">{s.label}</p>
                  <p className="text-sm font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>{s.value}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors flex-shrink-0" />
              </button>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Active Work (pro + admin) ── */}
      {(isPro || isAdmin) && (
        <motion.section variants={itemVariants} className="mb-6">
          <SectionHeader
            title={t("mySpace.activeWork")}
            count={activeWork.length}
            viewAllHref={activeWork.length > 0 ? "/my-work" : undefined}
            viewAllLabel={t("common.viewAll")}
          />
          {activeWork.length > 0 ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
              {activeWork.slice(0, 3).map((p, i) => renderWorkCard(p, i))}
            </motion.div>
          ) : (
            <EmptyBlock icon={Briefcase} text={t("mySpace.noActiveWork")} subtext={t("mySpace.workWillAppear")} />
          )}
        </motion.section>
      )}

      {/* ── My Jobs ── */}
      <motion.section variants={itemVariants} className="mb-6">
          <SectionHeader
            title={t("job.myJobs")}
            count={myPostedJobs.length}
            viewAllHref={myPostedJobs.length > 0 ? "/my-jobs" : undefined}
            viewAllLabel={t("common.viewAll")}
          />
          {myPostedJobs.length > 0 ? (
            <div className="space-y-2">
              {myPostedJobs.slice(0, 3).map((job, i) => {
                const firstImage = job.media?.[0]?.url || job.images?.[0];
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                  >
                    <Link
                      href={`/jobs/${job.id}`}
                      className="group flex rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition-shadow hover:shadow-md"
                    >
                      {firstImage && (
                        <div className="w-20 sm:w-28 flex-shrink-0 bg-neutral-100 dark:bg-neutral-800">
                          <img src={storage.getFileUrl(firstImage)} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 p-2.5 sm:p-3 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-0.5">
                          {job.category && (
                            <span className="px-1.5 py-px rounded-full font-semibold uppercase tracking-wider" style={{ backgroundColor: `${ACCENT_COLOR}10`, color: ACCENT_COLOR, fontSize: "9px" }}>
                              {getCategoryLabel(job.category)}
                            </span>
                          )}
                          <span className="text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                            {job.proposalCount ?? 0} {t("job.proposals")}
                          </span>
                        </div>
                        <h3 className="text-[13px] font-semibold line-clamp-1 mb-0.5" style={{ color: "var(--color-text-primary)" }}>{job.title}</h3>
                        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                          {job.location && (
                            <span className="flex items-center gap-0.5 truncate"><MapPin className="w-2.5 h-2.5" />{job.location}</span>
                          )}
                          <span className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>
                            {formatBudget(job, t)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyBlock icon={Briefcase} text={t("mySpace.noPostedJobs") || "No posted jobs yet"} />
          )}
      </motion.section>

      {/* ── New Jobs ── */}
      <motion.section variants={itemVariants}>
        <SectionHeader title={t("mySpace.findNewJobs")} />
        {newJobs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {newJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <JobCard job={job} />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyBlock icon={Briefcase} text={t("mySpace.browseAvailableJobs")} />
        )}
      </motion.section>

      {/* ── Modals ── */}
      <SlideModal open={showReviewsModal} onClose={() => setShowReviewsModal(false)} title={t("mySpace.manageReviews")}>
        <div className="space-y-4">
          {/* Request Reviews section */}
          {reviewLink && (
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: `${ACCENT_COLOR}30`, background: `linear-gradient(135deg, ${ACCENT_COLOR}06 0%, ${ACCENT_COLOR}03 100%)` }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT_COLOR }}>
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{t("reviews.requestReviews")}</h3>
                  <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>{t("reviews.shareWithClients")}</p>
                </div>
              </div>

              {/* Copy link row */}
              <div className="flex gap-2 mb-3">
                <Input
                  value={reviewLink}
                  readOnly
                  className="flex-1 font-mono text-xs h-9"
                />
                <Button
                  variant="outline"
                  onClick={copyLink}
                  className="shrink-0 h-9 w-9 p-0"
                >
                  {isCopied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="outline"
                  onClick={shareOnWhatsApp}
                  className="shrink-0 h-9 hidden sm:flex items-center gap-1.5 text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  WhatsApp
                </Button>
              </div>

              {/* SMS invitation */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  placeholder={t("reviews.clientName")}
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="h-9 text-xs"
                />
                <Input
                  type="tel"
                  placeholder="+995 555 123 456"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="h-9 text-xs"
                />
                <Button
                  onClick={sendInvitation}
                  disabled={isSendingInvite || !invitePhone.trim()}
                  className="h-9 text-xs"
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  {isSendingInvite ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      {t("common.send")}
                    </>
                  )}
                </Button>
              </div>
              {reviewStats && (
                <p className="text-[10px] mt-2" style={{ color: "var(--color-text-tertiary)" }}>
                  {t("reviews.invitationsRemaining", { count: 10 - (reviewStats.pendingInvitations || 0) })}
                </p>
              )}
            </div>
          )}

          {/* Reviews list */}
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3">
                  <ReviewItem review={review} locale={locale as "en" | "ka" | "ru"} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Star className="w-6 h-6 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
              <p className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>{t("mySpace.noReviewsYet")}</p>
            </div>
          )}
        </div>
      </SlideModal>
    </motion.div>
  );
}

export default function MySpacePage() {
  return (
    <AuthGuard allowedRoles={["pro", "admin"]}>
      <MySpaceContent />
    </AuthGuard>
  );
}
