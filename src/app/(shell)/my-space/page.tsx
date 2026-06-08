"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Avatar from "@/components/common/Avatar";
import JobCard from "@/components/common/JobCard";
import { ProjectInvitations } from "@/components/projects/ProjectInvitations";
import ReviewItem from "@/components/professionals/ReviewItem";
import type { Review } from "@/components/professionals/ReviewItem";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import SchedulePanel from "@/components/settings/SchedulePanel";
import SlaStatusBanner from "@/components/sla/SlaStatusBanner";
import SidePanel from "@/components/ui/SidePanel";
import { features } from "@/config/features";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useJobsContext } from "@/contexts/JobsContext";
import { useLanguage, countries, type CountryCode } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { useCountryLink } from "@/hooks/useCountry";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import type {
  Job,
  Proposal,
  ProjectStage,
} from "@/types/shared";
import { formatBudget, type Currency } from "@/utils/currencyUtils";
import { currencyForCountry } from "@/data/countries";
import { formatCurrency } from "@/utils/currency";
import { extractApiErrorMessage } from "@/utils/errorUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
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
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import ProMilestonePayments from "@/components/projects/ProMilestonePayments";

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
  started: { en: "Started", ka: "დაწყებული", color: 'var(--hm-brand-500)', step: 2 },
  in_progress: { en: "In Progress", ka: "მიმდინარე", color: 'var(--hm-brand-500)', step: 3 },
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
      <div className="flex items-center gap-2.5">
        {/* Brand-accent ornament + title pair. The thin 4px tab next to
            the title gives every section the same anchor, helping the
            eye scan vertically through a busy dashboard. */}
        <span
          className="w-1 h-4 rounded-full shrink-0"
          style={{ backgroundColor: ACCENT_COLOR }}
          aria-hidden="true"
        />
        <h2 className="text-[15px] font-bold" style={{ color: "var(--hm-fg-primary)" }}>{title}</h2>
        {count !== undefined && count > 0 && (
          <span
            className="flex items-center justify-center min-w-[20px] h-[18px] px-1.5 text-[10.5px] font-bold tabular-nums rounded-full"
            style={{
              backgroundColor: `${ACCENT_COLOR}15`,
              color: ACCENT_COLOR,
              border: `1px solid ${ACCENT_COLOR}30`,
            }}
          >
            {count}
          </span>
        )}
      </div>
      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className="group text-xs font-semibold flex items-center gap-0.5 transition-colors hover:opacity-80"
          style={{ color: ACCENT_COLOR }}
        >
          {viewAllLabel || "View all"}
          <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      ) : onViewAll ? (
        <button
          onClick={onViewAll}
          className="group text-xs font-semibold flex items-center gap-0.5 transition-colors hover:opacity-80"
          style={{ color: ACCENT_COLOR }}
        >
          {viewAllLabel || "View all"}
          <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      ) : null}
    </div>
  );
}

/* ── Empty state ──
 * Same warm IconBadge-led pattern as the bookings empty state, scaled
 * down to fit inline within a section. Grey muted icons read as broken
 * (per NN/g empty-state research); the brand-accent IconBadge reads as
 * "nothing yet" framing instead of "something failed".
 */
function EmptyBlock({ icon: Icon, text, subtext, actionLabel, actionHref }: { icon: typeof Calendar; text: string; subtext?: string; actionLabel?: string; actionHref?: string }) {
  return (
    <motion.div
      variants={cardVariants}
      className="rounded-xl py-7 px-4 text-center"
      style={{
        backgroundColor: "var(--hm-bg-elevated)",
        border: "1px solid var(--hm-border-subtle)",
        boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
      }}
    >
      <div
        className="inline-flex items-center justify-center w-10 h-10 rounded-full mx-auto mb-2.5"
        style={{
          background: `linear-gradient(135deg, ${ACCENT_COLOR}18 0%, ${ACCENT_COLOR}08 100%)`,
        }}
      >
        <Icon className="w-4 h-4" style={{ color: ACCENT_COLOR }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: "var(--hm-fg-primary)" }}>{text}</p>
      {subtext && (
        <p className="text-xs mt-1" style={{ color: "var(--hm-fg-muted)" }}>{subtext}</p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="inline-block mt-3">
          <Button variant="default" size="sm" rightIcon={<ArrowRight />}>
            {actionLabel}
          </Button>
        </Link>
      )}
    </motion.div>
  );
}

/* ── Action row ──
 * One task in the "Needs your attention" queue. A full-width, ≥44px
 * tappable row (Fitts's Law) framed as a thing to DO, not a number to
 * read: icon tile + title + one-line subtitle + count badge + chevron.
 * `accent` carries urgency (red = penalty risk, green = get paid, etc.).
 */
function ActionRow({
  icon: Icon,
  accent,
  title,
  subtitle,
  count,
  href,
  index,
}: {
  icon: typeof Briefcase;
  accent: string;
  title: string;
  subtitle?: string;
  count?: number;
  href: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.04 + index * 0.05 }}
    >
      <Link
        href={href}
        className="group flex items-center gap-3 px-3.5 py-3 min-h-[56px] rounded-xl w-full transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.99]"
        style={{
          backgroundColor: "var(--hm-bg-elevated)",
          border: "1px solid var(--hm-border-subtle)",
          boxShadow:
            "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${accent}1f 0%, ${accent}0a 100%)`,
            boxShadow: `inset 0 0 0 1px ${accent}1a`,
          }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-tight" style={{ color: "var(--hm-fg-primary)" }}>
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--hm-fg-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {count !== undefined && count > 0 && (
          <span
            className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[11px] font-bold tabular-nums rounded-full flex-shrink-0"
            style={{ backgroundColor: accent, color: "#fff" }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
        <ChevronRight
          className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: "var(--hm-fg-muted)" }}
        />
      </Link>
    </motion.div>
  );
}

interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  weight: number;
  action: () => void;
}

function ProfileCompletionCard({
  items,
  onAvatarUpload,
  onShareReviewLink,
}: {
  items: CompletionItem[];
  onAvatarUpload: () => void;
  onShareReviewLink: () => void;
}) {
  const { t } = useLanguage();
  const percent = items.filter((i) => i.done).reduce((acc, i) => acc + i.weight, 0);

  if (percent >= 100) return null;

  return (
    <motion.div variants={itemVariants} className="mb-6">
      <div
        className="rounded-xl p-3.5"
        style={{
          backgroundColor: "var(--hm-bg-elevated)",
          border: "1px solid var(--hm-border-subtle)",
        }}
      >
        {/* Header row - slimmer 40px ring so this reads as a quiet nudge,
            not a hero card competing with the work sections above. */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-10 h-10 flex-shrink-0">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" strokeWidth="3.5" stroke="var(--hm-border-subtle)" />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                strokeWidth="3.5"
                stroke={ACCENT_COLOR}
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - percent / 100)}`}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
              style={{ color: ACCENT_COLOR }}
            >
              {percent}%
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-[13px] font-bold" style={{ color: "var(--hm-fg-primary)" }}>
              {t("mySpace.profileCompletion")}
            </h2>
            <p className="text-[11px]" style={{ color: "var(--hm-fg-muted)" }}>
              {t("mySpace.profileCompletionSubtitle")}
            </p>
          </div>
        </div>

        {/* Checklist */}
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.key}>
              {item.done ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-[var(--hm-success-500)]" />
                  <span className="text-[12px] line-through" style={{ color: "var(--hm-fg-muted)" }}>
                    {item.label}
                  </span>
                </div>
              ) : (
                <button
                  onClick={item.action}
                  className="flex items-center gap-2 w-full text-left group"
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0"
                    style={{ borderColor: `${ACCENT_COLOR}60` }}
                  />
                  <span
                    className="text-[12px] font-medium group-hover:underline"
                    style={{ color: ACCENT_COLOR }}
                  >
                    {item.label}
                  </span>
                  <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: ACCENT_COLOR }} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function MySpaceContent() {
  const { user } = useAuth();
  const { t, locale, pick, country: ctxCountry } = useLanguage();
  const phonePlaceholder = `${countries[ctxCountry as CountryCode]?.phonePrefix ?? '+995'} ${countries[ctxCountry as CountryCode]?.placeholder ?? '5XX XXX XXX'}`;
  const { getCategoryLabel } = useCategoryLabels();
  const cl = useCountryLink();
  const { savedJobIds, handleSaveJob, appliedJobIds } = useJobsContext();
  const toast = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [workProposals, setWorkProposals] = useState<WorkProposal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newJobs, setNewJobs] = useState<Job[]>([]);
  const [newJobsTotal, setNewJobsTotal] = useState(0);
  const [proProfile, setProProfile] = useState<Record<string, unknown> | null>(null);

  // Action-queue signals (all from existing endpoints).
  const [proposalUpdatesCount, setProposalUpdatesCount] = useState(0);
  const [bookingsToStart, setBookingsToStart] = useState(0);
  const [bookingsToComplete, setBookingsToComplete] = useState(0);

  // Reviews - request section
  const [reviewLink, setReviewLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Modal states
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  // Email prompt dismissal
  const [emailPromptDismissed, setEmailPromptDismissed] = useState(() => {
    try {
      const stored = localStorage.getItem('emailPromptDismissedAt');
      if (!stored) return false;
      const dismissedAt = Number(stored);
      return Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  });

  const dismissEmailPrompt = () => {
    try { localStorage.setItem('emailPromptDismissedAt', String(Date.now())); } catch { /* ignore */ }
    setEmailPromptDismissed(true);
  };
  const copyTimeoutRef = useRef<NodeJS.Timeout>();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  /* ── Initial data fetch ── */
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [rStats, proposalsRes, reviewsRes, jobsRes, reviewLinkRes, profileRes, updatesRes, bookingsRes] =
        await Promise.allSettled([
          api.get("/reviews/stats/my"),
          api.get("/jobs/my-proposals/list"),
          api.get(`/reviews/pro/${user.id}`),
          api.get("/jobs?page=1&limit=3&sort=newest"),
          api.get("/reviews/request-link"),
          api.get("/users/me"),
          api.get("/jobs/counters/proposal-updates"),
          features.bookings ? api.get("/bookings/my") : Promise.resolve({ data: [] }),
        ]);
      if (rStats.status === "fulfilled") setReviewStats(rStats.value.data);
      if (profileRes.status === "fulfilled") setProProfile(profileRes.value.data as Record<string, unknown>);
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
        const list = d.data || d.jobs || [];
        setNewJobs(list);
        setNewJobsTotal(d.total ?? d.totalCount ?? d.pagination?.total ?? list.length);
      }
      if (reviewLinkRes.status === "fulfilled") {
        setReviewLink(reviewLinkRes.value.data.link || "");
      }
      if (updatesRes.status === "fulfilled") {
        setProposalUpdatesCount(updatesRes.value.data?.count ?? 0);
      }
      if (bookingsRes.status === "fulfilled") {
        // /bookings/my returns bookings where the user is pro OR client.
        // Keep only the pro-side ones (professional may be populated or a
        // raw id) and bucket by the status that needs the pro to act.
        const raw = bookingsRes.value.data;
        const arr: any[] = Array.isArray(raw) ? raw : raw?.data || raw?.bookings || [];
        const mine = arr.filter((b) => {
          const proId = b?.professional?._id ?? b?.professional?.id ?? b?.professional;
          return String(proId) === String(user.id);
        });
        setBookingsToStart(mine.filter((b) => b.status === "confirmed").length);
        setBookingsToComplete(mine.filter((b) => b.status === "in_progress").length);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Refetch when page becomes visible (e.g., returning from profile-setup)
  useEffect(() => {
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData]);

  /* ── My work: active + completed (the retired /my-work page now lives
     here as tabs). ── */
  const activeWork = useMemo(() => {
    return workProposals
      .filter((p) => p.status === "accepted" && p.projectTracking?.currentStage !== "completed")
      .sort((a, b) => {
        const aT = a.projectTracking?.startedAt ? new Date(a.projectTracking.startedAt).getTime() : 0;
        const bT = b.projectTracking?.startedAt ? new Date(b.projectTracking.startedAt).getTime() : 0;
        return bT - aT;
      });
  }, [workProposals]);

  const completedWork = useMemo(() => {
    return workProposals
      .filter(
        (p) =>
          p.projectTracking?.currentStage === "completed" ||
          p.status === "completed",
      )
      .sort((a, b) => {
        const aT = a.projectTracking?.completedAt ? new Date(a.projectTracking.completedAt).getTime() : 0;
        const bT = b.projectTracking?.completedAt ? new Date(b.projectTracking.completedAt).getTime() : 0;
        return bT - aT;
      });
  }, [workProposals]);

  const [workTab, setWorkTab] = useState<"active" | "completed">("active");
  const workList = workTab === "active" ? activeWork : completedWork;

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
    } catch (err) {
      toast.error(t("common.error"), extractApiErrorMessage(err, t("common.error")));
    } finally {
      setIsSendingInvite(false);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner size="lg" color={ACCENT_COLOR} variant="border" />
      </div>
    );
  }

  const isPro = user?.role === "pro";
  const isAdmin = user?.role === "admin";
  const firstName = user?.name?.split(" ")[0] || "";

  /* ── Avatar upload handler ── */
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await api.post("/users/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(t("common.success"), t("common.saved"));
      fetchData();
    } catch {
      toast.error(t("common.error"), t("common.tryAgain"));
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  /* ── Profile completion items (not a hook — computed after early return) ── */
  const completionItems: CompletionItem[] = (() => {
    if (!isPro || !user || !proProfile) return [];
    const bioText = ((proProfile.bio as string) || (proProfile.description as string) || "");
    const userServices = proProfile.selectedServices as unknown[] | undefined;
    const userCategories = proProfile.selectedCategories as string[] | undefined;
    const userServicePricing = proProfile.servicePricing as unknown[] | undefined;
    const userAreas = proProfile.serviceAreas as unknown[] | undefined;
    const userPortfolio = proProfile.portfolioProjects as unknown[] | undefined;
    return [
      {
        key: "avatar",
        label: t("mySpace.addProfilePhoto"),
        done: !!user.avatar,
        weight: 20,
        action: () => avatarInputRef.current?.click(),
      },
      {
        key: "bio",
        label: t("mySpace.writeAboutYourself"),
        done: bioText.length >= 20,
        weight: 15,
        action: () => { router.push("/pro/profile-setup/about"); },
      },
      {
        key: "services",
        label: t("mySpace.selectYourServices"),
        done: (userServicePricing?.length ?? 0) > 0 || (userServices?.length ?? 0) > 0,
        weight: 20,
        action: () => { router.push("/pro/profile-setup/services"); },
      },
      {
        key: "serviceAreas",
        label: t("mySpace.setServiceAreas"),
        done: (userAreas?.length ?? 0) > 0,
        weight: 10,
        action: () => { router.push("/pro/profile-setup/areas"); },
      },
      {
        key: "portfolio",
        label: t("mySpace.addPortfolioProjects"),
        done: (userPortfolio?.length ?? 0) > 0,
        weight: 20,
        action: () => { router.push("/pro/profile-setup/portfolio"); },
      },
      {
        key: "review",
        label: t("mySpace.getFirstReview"),
        done: (reviewStats?.totalReviews ?? 0) > 0,
        weight: 15,
        action: () => setShowReviewsModal(true),
      },
    ];
  })();

  // "Needs your attention" queue. Each entry is a thing the pro must DO,
  // ordered by urgency: a client engaged your bid → finish work to get
  // paid → start committed work. Only rows with count > 0 are shown; the
  // SLA penalty (the most urgent signal) stays in the banner above so it
  // isn't duplicated here.
  const actionItems: {
    key: string;
    icon: typeof Briefcase;
    accent: string;
    title: string;
    subtitle: string;
    count: number;
    href: string;
  }[] = [
    proposalUpdatesCount > 0 && {
      key: "proposal-updates",
      icon: MessageSquare,
      accent: "#3B82F6",
      title: t("mySpace.actionProposalUpdates"),
      subtitle: t("mySpace.actionProposalUpdatesSub"),
      count: proposalUpdatesCount,
      href: "/my-proposals",
    },
    bookingsToComplete > 0 && {
      key: "complete-booked",
      icon: CheckCircle2,
      accent: "#16A34A",
      title: t("mySpace.actionCompleteBooked"),
      subtitle: t("mySpace.actionCompleteBookedSub"),
      count: bookingsToComplete,
      href: "/bookings",
    },
    bookingsToStart > 0 && {
      key: "start-booked",
      icon: Calendar,
      accent: ACCENT_COLOR,
      title: t("mySpace.actionStartBooked"),
      subtitle: t("mySpace.actionStartBookedSub"),
      count: bookingsToStart,
      href: "/bookings",
    },
  ].filter(Boolean) as {
    key: string;
    icon: typeof Briefcase;
    accent: string;
    title: string;
    subtitle: string;
    count: number;
    href: string;
  }[];

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
          className="group flex rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg"
          style={{
            backgroundColor: "var(--hm-bg-elevated)",
            border: "1px solid var(--hm-border-subtle)",
            boxShadow:
              "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
          }}
        >
          {/* Stage-color rail: 4px with a subtle inset glow, matching the
              booking card's rail treatment so the surfaces share one
              visual language. */}
          <div
            className="w-1 flex-shrink-0 self-stretch my-3 ml-2 rounded-full"
            style={{
              backgroundColor: stageConfig?.color || ACCENT_COLOR,
              boxShadow: `0 0 8px ${stageConfig?.color || ACCENT_COLOR}40`,
            }}
            aria-hidden="true"
          />
          {firstImage && (
            <div className="relative hidden sm:block w-20 lg:w-28 flex-shrink-0 bg-[var(--hm-bg-tertiary)]">
              <Image src={storage.getFileUrl(firstImage)} alt="" fill sizes="(min-width: 1024px) 112px, 80px" className="object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0 p-2.5 sm:p-3">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar src={job.clientId?.avatar} name={job.clientId?.name || t("common.client")} size="xs" className="w-5 h-5 flex-shrink-0" />
                <span className="text-[11px] truncate" style={{ color: "var(--hm-fg-muted)" }}>{job.clientId?.name}</span>
                {stageConfig && <Badge variant="info" size="sm">{pick({ en: stageConfig.en, ka: stageConfig.ka })}</Badge>}
              </div>
              <span className="text-xs font-bold whitespace-nowrap" style={{ color: "var(--hm-fg-primary)" }}>
                {agreedPrice
                  ? formatCurrency(agreedPrice, {
                      country: job.country ?? 'GE',
                    })
                  : formatBudget(job, t, currencyForCountry(job.country) as Currency)}
              </span>
            </div>
            <h3 className="text-[13px] font-semibold line-clamp-1 mb-1" style={{ color: "var(--hm-fg-primary)" }}>{job.title}</h3>
            <div className="flex items-center gap-1.5 text-[10px] mb-1.5" style={{ color: "var(--hm-fg-muted)" }}>
              {job.location && <span className="flex items-center gap-0.5 truncate"><MapPin className="w-2.5 h-2.5" />{job.location}</span>}
              {job.category && (
                <span className="px-1.5 py-px rounded-full font-semibold uppercase tracking-wider" style={{ backgroundColor: `${ACCENT_COLOR}10`, color: ACCENT_COLOR, fontSize: "9px" }}>
                  {getCategoryLabel(job.category)}
                </span>
              )}
            </div>
            {stage && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full overflow-hidden bg-[var(--hm-bg-tertiary)]">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(progress, 4)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                    style={{ backgroundColor: stageConfig?.color || ACCENT_COLOR }}
                  />
                </div>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: "var(--hm-fg-muted)" }}>{progress}%</span>
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
      {/* ── Header ── One compact row: identity on the left, actions on
           the right. The standalone DASHBOARD eyebrow and the subtitle
           were removed so the work-winning KPIs below land in the
           first viewport instead of greeting chrome (F-pattern: lead
           with value, not a salutation). Actions go icon-only on <sm so
           the row never wraps with longer Georgian labels. */}
      <motion.div variants={itemVariants} className="mb-5 flex items-center gap-3">
        {user && (
          <Avatar src={user.avatar} name={user.name} size="lg" rounded="xl" className="w-10 h-10 flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-bold truncate" style={{ color: "var(--hm-fg-primary)" }}>
            {t("mySpace.welcomeBack")}{firstName ? `, ${firstName}` : ""}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile: 36px icon-only square */}
          <Link
            href="/pro/profile-setup"
            aria-label={t("mySpace.editProfile")}
            title={t("mySpace.editProfile")}
            className="sm:hidden shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all active:scale-95"
            style={{ backgroundColor: ACCENT_COLOR }}
          >
            <UserCog className="w-4 h-4" />
          </Link>
          {/* sm+: full labeled primary button */}
          <Link href="/pro/profile-setup" className="hidden sm:inline-flex shrink-0">
            <Button variant="default" size="sm" leftIcon={<UserCog />}>
              {t("mySpace.editProfile")}
            </Button>
          </Link>
          {features.bookings && (
            <>
              {/* Mobile: 36px icon-only square */}
              <button
                type="button"
                onClick={() => setShowSchedule(true)}
                aria-label={t("settings.availability")}
                title={t("settings.availability")}
                className="sm:hidden shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/10 hover:bg-[var(--hm-brand-500)]/20 transition-all active:scale-95"
              >
                <Calendar className="w-4 h-4" />
              </button>
              {/* sm+: full labeled ghost-button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSchedule(true)}
                leftIcon={<Calendar />}
                className="hidden sm:inline-flex shrink-0 text-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/10 hover:bg-[var(--hm-brand-500)]/20 hover:text-[var(--hm-brand-500)]"
              >
                {t("settings.availability")}
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* ── Hidden avatar file input ── */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {/* ── SLA penalty banner ── Hidden when level is 'none'.
           Reads slaPenaltyLevel / slaDemotedUntil / deactivatedUntil
           from the pro's own user record. Mounted FIRST so the most
           urgent signal is at the top of the dashboard. */}
      <SlaStatusBanner />

      {/* ── Email prompt banner ── */}
      {!user?.email && !emailPromptDismissed && (
        <motion.div variants={itemVariants} className="mb-4">
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              border: '1px solid rgba(59,130,246,0.25)',
              backgroundColor: 'rgba(59,130,246,0.06)',
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
                {t('common.addEmailPrompt')}
              </p>
            </div>
            <Link
              href="/settings"
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}
            >
              {t('common.addEmail')}
            </Link>
            <button
              onClick={dismissEmailPrompt}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-colors hover:bg-black/5"
              aria-label={t('common.close')}
              style={{ color: 'var(--hm-fg-muted)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── "Needs your attention" queue ── THE HERO. Replaces the passive
           KPI count strip with a worklist: each row is a task to DO, not a
           number to read, sorted by urgency (client engaged → get paid →
           start work). When nothing's pending, a calm "all caught up" row
           turns the idle state into the growth prompt. */}
      <motion.section variants={itemVariants} className="mb-6">
        <SectionHeader title={t("mySpace.attention")} count={actionItems.length} />
        {actionItems.length > 0 ? (
          <div className="space-y-2">
            {actionItems.map((a, i) => (
              <ActionRow
                key={a.key}
                index={i}
                icon={a.icon}
                accent={a.accent}
                title={a.title}
                subtitle={a.subtitle}
                count={a.count}
                href={a.href}
              />
            ))}
          </div>
        ) : (
          <Link
            href={cl("/jobs")}
            className="group flex items-center gap-3 px-3.5 py-3.5 rounded-xl w-full transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.99]"
            style={{
              backgroundColor: "var(--hm-bg-elevated)",
              border: "1px solid var(--hm-border-subtle)",
              boxShadow:
                "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #16A34A1f 0%, #16A34A0a 100%)",
                boxShadow: "inset 0 0 0 1px #16A34A1a",
              }}
            >
              <CheckCircle2 className="w-[18px] h-[18px]" style={{ color: "#16A34A" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-tight" style={{ color: "var(--hm-fg-primary)" }}>
                {t("mySpace.allCaughtUp")}
              </p>
              <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--hm-fg-muted)" }}>
                {t("mySpace.allCaughtUpSub", { count: newJobsTotal })}
              </p>
            </div>
            <ArrowRight
              className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              style={{ color: ACCENT_COLOR }}
            />
          </Link>
        )}
      </motion.section>

      {/* ── Active Work (pro + admin) ── The "is my money safe?" anchor.
           Promoted directly under the KPIs so won work is in the first
           screen. Empty state CTAs straight into Find Jobs (next step,
           not a dead-end). */}
      {(isPro || isAdmin) && (
        <motion.section variants={itemVariants} className="mb-6">
          {/* Pending project-engagement invites (renders nothing when empty). */}
          <ProjectInvitations />
          <SectionHeader
            title={t("mySpace.myWork")}
            count={workList.length}
          />
          {/* Active / Completed tabs - the full work list (was a separate
              /my-work page) now lives here. */}
          <div className="mb-3 flex gap-2">
            {(["active", "completed"] as const).map((tab) => {
              const n = tab === "active" ? activeWork.length : completedWork.length;
              const on = workTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setWorkTab(tab)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    on
                      ? "bg-[var(--hm-brand-500)] text-white"
                      : "bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)]"
                  }`}
                >
                  {tab === "active"
                    ? t("mySpace.activeWork")
                    : t("common.completed")}
                  {n > 0 && (
                    <span className="tabular-nums opacity-80">{n}</span>
                  )}
                </button>
              );
            })}
          </div>
          {workList.length > 0 ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
              {workList.map((p, i) => renderWorkCard(p, i))}
            </motion.div>
          ) : workTab === "active" ? (
            <EmptyBlock
              icon={Briefcase}
              text={t("mySpace.noActiveWork")}
              subtext={t("mySpace.workWillAppear")}
              actionLabel={t("mySpace.findNewJobs")}
              actionHref={cl("/jobs")}
            />
          ) : (
            <EmptyBlock
              icon={Briefcase}
              text={t("mySpace.noCompletedWork")}
            />
          )}
        </motion.section>
      )}

      {/* ── Milestone payments ── propose schedules + mark work done, per
           engagement. Renders nothing when the pro has no payable work. */}
      <ProMilestonePayments />

      {/* ── Find New Jobs ── the growth engine, kept prominent right
           below active work. */}
      <motion.section variants={itemVariants} className="mb-6">
        <SectionHeader
          title={t("mySpace.findNewJobs")}
          viewAllHref={cl("/jobs")}
          viewAllLabel={t("common.viewAll")}
        />
        {newJobs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {newJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <JobCard
                  job={job}
                  onSave={handleSaveJob}
                  isSaved={savedJobIds.has(job.id)}
                  hasApplied={appliedJobIds.has(job.id)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyBlock icon={Briefcase} text={t("mySpace.browseAvailableJobs")} />
        )}
      </motion.section>

      {/* ── Profile Completion (pro only) ── Demoted below the work
           sections: it's a nudge, not the hero. The goal-gradient % ring
           stays (it's psychologically effective), but the card is slimmer
           and lower-contrast so it doesn't compete with work. */}
      {isPro && completionItems.length > 0 && (
        <ProfileCompletionCard
          items={completionItems}
          onAvatarUpload={() => avatarInputRef.current?.click()}
          onShareReviewLink={() => setShowReviewsModal(true)}
        />
      )}

      {/* ── Modals ── */}
      <SidePanel isOpen={showReviewsModal} onClose={() => setShowReviewsModal(false)} title={t("mySpace.manageReviews")}>
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
                  <h3 className="text-xs font-bold" style={{ color: "var(--hm-fg-primary)" }}>{t("reviews.requestReviews")}</h3>
                  <p className="text-[11px]" style={{ color: "var(--hm-fg-muted)" }}>{t("reviews.shareWithClients")}</p>
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
                  {isCopied ? <CheckCircle className="w-3.5 h-3.5 text-[var(--hm-success-500)]" /> : <Copy className="w-3.5 h-3.5" />}
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
                  placeholder={phonePlaceholder}
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
                <p className="text-[10px] mt-2" style={{ color: "var(--hm-fg-muted)" }}>
                  {t("reviews.invitationsRemaining", { count: 10 - (reviewStats.pendingInvitations || 0) })}
                </p>
              )}
            </div>
          )}

          {/* Reviews list */}
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)] p-3">
                  <ReviewItem review={review} locale={locale as "en" | "ka" | "ru"} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Star className="w-6 h-6 mx-auto mb-2 text-[var(--hm-fg-muted)]" />
              <p className="text-xs font-medium" style={{ color: "var(--hm-fg-muted)" }}>{t("mySpace.noReviewsYet")}</p>
            </div>
          )}
        </div>
      </SidePanel>

      {features.bookings && (
        <SchedulePanel isOpen={showSchedule} onClose={() => setShowSchedule(false)} />
      )}
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
