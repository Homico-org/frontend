"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Avatar from "@/components/common/Avatar";
import BackButton from "@/components/common/BackButton";
import Header, { HeaderSpacer } from "@/components/common/Header";
import HiringChoiceModal from "@/components/proposals/HiringChoiceModal";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmModal } from "@/components/ui/Modal";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { api } from "@/lib/api";
import type { Proposal } from "@/types/shared";
import { isHighLevelCategory } from "@/utils/categoryHelpers";
import { formatTimeAgoCompact } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/currency";
import { extractApiErrorMessage } from "@/utils/errorUtils";
import {
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Phone,
  Star,
  Undo2,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
// Minimal job info for this page
interface JobSummary {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  status: string;
  clientId: string;
  country?: string;
}

function ProposalsPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const { t } = useLanguage();
  const { getCategoryLabel, locale } = useCategoryLabels();
  const toast = useToast();
  const { trackEvent } = useAnalytics();

  const [job, setJob] = useState<JobSummary | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );
  const [showHiringModal, setShowHiringModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState<string | null>(
    null
  );

  const jobId = params.jobId as string;
  const isHighLevel = job ? isHighLevelCategory(job.category) : false;

  useEffect(() => {
    // AbortController replaces the isMounted flag - it ALSO cancels the
    // actual network requests so Strict Mode double-mount no longer
    // fires four requests (two duplicates per endpoint). The
    // mark-as-viewed POST runs unguarded so the server-side counter
    // update completes even if the user navigates away mid-load.
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [jobRes, proposalsRes] = await Promise.all([
          api.get(`/jobs/${jobId}`, { signal: controller.signal }),
          api.get(`/jobs/${jobId}/proposals`, { signal: controller.signal }),
        ]);

        if (controller.signal.aborted) return;

        setJob(jobRes.data);
        setProposals(proposalsRes.data);

        // Mark proposals as viewed (fire-and-forget; intentionally not
        // tied to the abort signal so the server-side counter still
        // updates even if the user navigates away mid-load).
        api.post(`/jobs/counters/mark-proposals-viewed/${jobId}`).catch(() => {});
      } catch (error) {
        const name = (error as { name?: string })?.name;
        const code = (error as { code?: string })?.code;
        if (name === "CanceledError" || code === "ERR_CANCELED") return;
        console.error("Failed to fetch data:", error);
        toast.error(t("common.error"), t("job.failedToLoadData"));
        router.push("/my-jobs");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    if (jobId) {
      fetchData();
    }

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleShortlist = useCallback(
    async (proposal: Proposal) => {
      setSelectedProposal(proposal);
      setShowHiringModal(true);
    },
    [],
  );

  const handleHiringChoice = useCallback(
    async (choice: "homico" | "direct") => {
      if (!selectedProposal) return;

      setIsProcessing(true);
      try {
        const response = await api.post(
          `/jobs/proposals/${selectedProposal.id}/shortlist`,
          {
            hiringChoice: choice,
          }
        );

        // Update proposal in list
        setProposals((prev) =>
          prev.map((p) =>
            p.id === selectedProposal.id
              ? {
                  ...p,
                  status: "shortlisted",
                  hiringChoice: choice,
                  contactRevealed: choice === "direct",
                  proId: response.data.proId || p.proId,
                }
              : p
          )
        );

        setShowHiringModal(false);
        setSelectedProposal(null);

        if (choice === "direct") {
          toast.success(t("common.success"), t("job.phoneNumberRevealed"));
        } else {
          toast.success(t("common.success"), t("job.markedAsInterested"));
        }
      } catch (error) {
        toast.error(
          t("common.error"),
          extractApiErrorMessage(error, t("job.failedToProcess"))
        );
      } finally {
        setIsProcessing(false);
      }
    },
    // `t` is a stable selector from useLanguage tied to `locale`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedProposal, locale, toast]
  );

  const handleReject = useCallback(
    async (proposalId: string) => {
      setIsProcessing(true);
      try {
        await api.post(`/jobs/proposals/${proposalId}/reject`);

        setProposals((prev) =>
          prev.map((p) =>
            p.id === proposalId ? { ...p, status: "rejected" } : p
          )
        );

        setShowRejectConfirm(null);
        toast.success(
          t("common.success"),
          t("job.proposalRejected")
        );
      } catch (error) {
        toast.error(
          t("common.error"),
          extractApiErrorMessage(error, t("job.failedToReject"))
        );
      } finally {
        setIsProcessing(false);
      }
    },
    // `t` is a stable selector from useLanguage tied to `locale`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, toast]
  );

  const handleAccept = useCallback(
    async (proposalId: string) => {
      setIsProcessing(true);
      try {
        const { data } = await api.post<{ paymentRedirectUrl?: string | null }>(
          `/jobs/proposals/${proposalId}/accept`,
        );

        // Look up the accepted proposal so we can include the amount in the
        // analytics event. The list state holds plain Proposal objects whose
        // id field is `id`; backend may also surface `_id`, so cast loosely.
        const accepted = proposals.find(
          (p) => (p as { _id?: string; id?: string })._id === proposalId || p.id === proposalId,
        );
        trackEvent(AnalyticsEvent.PROPOSAL_ACCEPT, {
          jobId,
          proposalId,
          proposalAmount: typeof accepted?.proposedPrice === "number" ? accepted.proposedPrice : undefined,
        });

        // Escrow-at-hire: when the backend returns a payment URL, the hire is
        // not final until the client pays - send them straight to the provider.
        // Hard navigation is more reliable than router.push from here.
        if (data?.paymentRedirectUrl) {
          window.location.href = data.paymentRedirectUrl;
          return;
        }

        toast.success(
          t("common.success"),
          t("job.projectStartedRedirectingToProject")
        );

        // No payment needed (unpriced proposal): go to the project tracker.
        setTimeout(() => {
          router.push(`/jobs/${jobId}`);
        }, 1500);
      } catch (error) {
        toast.error(
          t("common.error"),
          extractApiErrorMessage(error, t("job.failedToAccept"))
        );
        setIsProcessing(false);
      }
    },
    // `t` is a stable selector from useLanguage tied to `locale`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, toast, router, jobId]
  );

  const handleRevertToPending = useCallback(
    async (proposalId: string) => {
      setIsProcessing(true);
      try {
        await api.post(`/jobs/proposals/${proposalId}/revert-to-pending`);

        setProposals((prev) =>
          prev.map((p) =>
            p.id === proposalId
              ? {
                  ...p,
                  status: "pending",
                  hiringChoice: undefined,
                  contactRevealed: false,
                }
              : p
          )
        );

        toast.success(
          t("common.success"),
          t("job.revertedToNewProposals")
        );
      } catch (error) {
        toast.error(
          t("common.error"),
          extractApiErrorMessage(error, t("job.failedToRevert"))
        );
      } finally {
        setIsProcessing(false);
      }
    },
    // `t` is a stable selector from useLanguage tied to `locale`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, toast]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--hm-bg-elevated)]">
        <Header />
        <HeaderSpacer />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Skeleton className="w-32 h-6 mb-6" />
          <Skeleton className="w-64 h-8 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} variant="horizontal" className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingProposals = proposals.filter((p) => p.status === "pending");
  const shortlistedProposals = proposals.filter(
    (p) => p.status === "shortlisted"
  );
  const rejectedProposals = proposals.filter(
    (p) => p.status === "rejected" || p.status === "withdrawn"
  );

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)] flex flex-col">
      <Header />
      <HeaderSpacer />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-4 pb-20 lg:pb-8">
        {/* Back Button */}
        <BackButton href="/my-jobs" variant="minimal" className="mb-4" />

        {/* Page Header with Stats */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--hm-fg-primary)] mb-1">
                {t("job.proposals")}
              </h1>
              {job && (
                <Link
                  href={`/${(job.country ?? 'GE').toLowerCase()}/jobs/${job.id}`}
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] transition-colors"
                >
                  {job.title}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            {job && (
              <Badge variant="premium" size="xl">
                {getCategoryLabel(job.category)}
              </Badge>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card variant="default" size="sm" className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-[var(--hm-brand-500)]/10 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-[var(--hm-brand-500)]" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-[var(--hm-fg-primary)]">
                  {pendingProposals.length}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--hm-fg-muted)]">
                {t("common.new")}
              </p>
            </Card>
            <Card variant="default" size="sm" className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-[var(--hm-success-500)]/10 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-[var(--hm-success-500)]" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-[var(--hm-fg-primary)]">
                  {shortlistedProposals.length}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--hm-fg-muted)]">
                {t("job.shortlisted")}
              </p>
            </Card>
            <Card variant="default" size="sm" className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-[var(--hm-bg-tertiary)] flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-[var(--hm-fg-muted)]" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-[var(--hm-fg-primary)]">
                  {rejectedProposals.length}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--hm-fg-muted)]">
                {t("common.rejected")}
              </p>
            </Card>
          </div>
        </div>

        {/* Info Banner for Low-Level Categories */}
        {!isHighLevel && (
          <Alert
            variant="warning"
            size="sm"
            title={t("job.directContactCategory")}
            className="mb-6"
          >
            {t("job.forThisCategoryYouCan")}
          </Alert>
        )}

        {/* Proposals List */}
        {proposals.length === 0 ? (
          <Card variant="default" size="lg" className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--hm-bg-tertiary)] flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[var(--hm-fg-muted)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--hm-fg-primary)] mb-2">
              {t("job.noProposalsYet")}
            </h3>
            <p className="text-sm text-[var(--hm-fg-muted)] max-w-xs mx-auto">
              {t("job.whenProfessionalsSendProposalsThey")}
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Pending Proposals */}
            {pendingProposals.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--hm-brand-500)]/10">
                    <FileText className="w-4 h-4 text-[var(--hm-brand-500)]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm sm:text-base font-semibold text-[var(--hm-fg-primary)]">
                      {t("job.newProposals")}
                    </h2>
                  </div>
                  <Badge variant="default" size="sm">
                    {pendingProposals.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {pendingProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      locale={locale}
                      jobCountry={job?.country}
                      onShortlist={() => handleShortlist(proposal)}
                      onReject={() => setShowRejectConfirm(proposal.id)}
                      isHighLevel={isHighLevel}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Interested Proposals */}
            {shortlistedProposals.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--hm-success-500)]/10">
                    <Check className="w-4 h-4 text-[var(--hm-success-500)]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm sm:text-base font-semibold text-[var(--hm-fg-primary)]">
                      {t("job.shortlisted")}
                    </h2>
                    <p className="text-xs text-[var(--hm-fg-muted)]">
                      {t("job.selectOneToStartThe")}
                    </p>
                  </div>
                  <Badge variant="success" size="sm">
                    {shortlistedProposals.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {shortlistedProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      locale={locale}
                      jobCountry={job?.country}
                      isShortlisted
                      isHighLevel={isHighLevel}
                      onAccept={() => handleAccept(proposal.id)}
                      onRevert={() => handleRevertToPending(proposal.id)}
                      isProcessing={isProcessing}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Rejected Proposals */}
            {rejectedProposals.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--hm-bg-tertiary)]">
                    <X className="w-4 h-4 text-[var(--hm-fg-muted)]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm sm:text-base font-semibold text-[var(--hm-fg-muted)]">
                      {t("common.rejected")}
                    </h2>
                  </div>
                  <Badge variant="default" size="sm">
                    {rejectedProposals.length}
                  </Badge>
                </div>
                <div className="space-y-3 opacity-60 hover:opacity-80 transition-opacity">
                  {rejectedProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      locale={locale}
                      jobCountry={job?.country}
                      isRejected
                      isHighLevel={isHighLevel}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Hiring Choice Modal */}
      <HiringChoiceModal
        isOpen={showHiringModal}
        onClose={() => {
          setShowHiringModal(false);
          setSelectedProposal(null);
        }}
        onChooseHomico={() => handleHiringChoice("homico")}
        onChooseDirect={() => handleHiringChoice("direct")}
        proName={selectedProposal?.proId?.name || ""}
        proPhone={selectedProposal?.proId?.phone}
        isLoading={isProcessing}
      />

      {/* Reject Confirmation Modal */}
      <ConfirmModal
        isOpen={!!showRejectConfirm}
        onClose={() => setShowRejectConfirm(null)}
        onConfirm={() => showRejectConfirm && handleReject(showRejectConfirm)}
        title={t("job.rejectProposal")}
        description={t("job.thisActionCannotBeUndone")}
        icon={<X className="w-6 h-6 text-[var(--hm-error-500)]" />}
        variant="danger"
        cancelLabel={t("common.cancel")}
        confirmLabel={t("job.reject")}
        isLoading={isProcessing}
        loadingLabel="..."
      />
    </div>
  );
}

function ProposalCard({
  proposal,
  locale,
  jobCountry,
  onShortlist,
  onReject,
  onAccept,
  onRevert,
  isShortlisted = false,
  isRejected = false,
  isHighLevel = true,
  isProcessing = false,
}: {
  proposal: Proposal;
  locale: string;
  // Country the parent job lives in - drives the currency symbol on
  // proposed prices so a US job's proposals don't render in ₾.
  jobCountry?: string;
  onShortlist?: () => void;
  onReject?: () => void;
  onAccept?: () => void;
  onRevert?: () => void;
  isShortlisted?: boolean;
  isRejected?: boolean;
  isHighLevel?: boolean;
  isProcessing?: boolean;
}) {
  const { t } = useLanguage();
  const pro = proposal.proId;

  return (
    <Card
      variant="default"
      size="md"
      className={
        isShortlisted
          ? "ring-2 ring-emerald-500/20 border-[var(--hm-success-500)]/20"
          : ""
      }
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar with Link */}
        <Link href={`/${(pro?.country ?? 'GE').toLowerCase()}/professionals/${pro?.id}`} className="flex-shrink-0">
          <Avatar
            src={pro?.avatar}
            name={pro?.name || "Pro"}
            size="lg"
            className="w-12 h-12 sm:w-14 sm:h-14 ring-2 ring-white shadow-sm"
          />
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/${(pro?.country ?? 'GE').toLowerCase()}/professionals/${pro?.id}`}
                  className="text-sm sm:text-base font-semibold text-[var(--hm-fg-primary)] hover:text-[var(--hm-brand-500)] transition-colors truncate"
                >
                  {pro?.name || "Professional"}
                </Link>
                {/* Verified badge - makes the trusted pro obvious when
                    comparing multiple proposals side by side. */}
                {(pro as { verificationStatus?: string })?.verificationStatus === 'verified' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--hm-success-500)] flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs text-[var(--hm-fg-muted)]">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  {formatTimeAgoCompact(
                    proposal.createdAt,
                    locale as "en" | "ka" | "ru"
                  )}
                </span>
                {/* "Last active X ago" - tells the owner whether this
                    pro is still around or submitted and disappeared. */}
                {(() => {
                  const lastLogin = (pro as { lastLoginAt?: string })?.lastLoginAt;
                  if (!lastLogin) return null;
                  const diffMin = Math.floor(
                    (Date.now() - new Date(lastLogin).getTime()) / 60000,
                  );
                  if (diffMin < 5) {
                    return (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--hm-success-500)] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--hm-success-500)]" />
                        {t('professional.activeNow')}
                      </span>
                    );
                  }
                  if (diffMin >= 60 * 24 * 30) return null; // >30 days, skip
                  let label: string;
                  if (diffMin < 60) label = t('professional.lastSeenMinutes', { count: diffMin });
                  else if (diffMin < 60 * 24) label = t('professional.lastSeenHours', { count: Math.floor(diffMin / 60) });
                  else label = t('professional.lastSeenDays', { count: Math.floor(diffMin / 60 / 24) });
                  return (
                    <span className="text-xs text-[var(--hm-fg-muted)]">{label}</span>
                  );
                })()}
                {/* Response-time pill - if pro replies fast, surface
                    that as a positive trust signal in the comparison
                    view. */}
                {(() => {
                  const t1 = (pro as { avgResponseTime?: number })?.avgResponseTime;
                  if (t1 == null || !Number.isFinite(t1) || t1 <= 0 || t1 > 24) return null;
                  const text = t1 < 1
                    ? t('professional.repliesWithinHour')
                    : t1 <= 4
                      ? t('professional.repliesWithinHours', { count: 4 })
                      : t('professional.repliesWithinHours', { count: 24 });
                  return (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--hm-success-500)] font-medium">
                      <Zap className="w-3 h-3" />
                      {text}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Status Badge */}
            {isShortlisted && (
              <Badge
                variant="success"
                size="sm"
                icon={<Check className="w-3 h-3" />}
              >
                {proposal.hiringChoice === "direct"
                  ? t("job.direct")
                  : t("job.homico")}
              </Badge>
            )}
            {isRejected && (
              <Badge
                variant="default"
                size="sm"
                icon={<X className="w-3 h-3" />}
              >
                {t("common.rejected")}
              </Badge>
            )}
          </div>

          {/* Price & Duration - More prominent */}
          <div className="flex items-center flex-wrap gap-3 mb-3">
            {proposal.proposedPrice && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--hm-brand-500)]/10">
                <span className="text-base sm:text-lg font-bold text-[var(--hm-brand-500)]">
                  {/* `formatCurrency` puts the symbol on the right for
                      ₾/₽ (native convention) and on the left for $/€/£;
                      the previous concat unconditionally prefixed the
                      symbol so Georgian users saw "₾800" instead of
                      "800₾". */}
                  {formatCurrency(proposal.proposedPrice, {
                    country: jobCountry ?? 'GE',
                  })}
                </span>
              </div>
            )}
            {proposal.estimatedDuration && (
              <div className="flex items-center gap-1.5 text-sm text-[var(--hm-fg-muted)]">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {proposal.estimatedDuration}{" "}
                  {proposal.estimatedDurationUnit === "days"
                    ? t("common.days")
                    : proposal.estimatedDurationUnit === "weeks"
                      ? t("job.weeks")
                      : t("common.months")}
                </span>
              </div>
            )}
          </div>

          {/* Cover Letter */}
          {proposal.coverLetter && (
            <p className="text-sm text-[var(--hm-fg-secondary)] mb-4 line-clamp-2 sm:line-clamp-3">
              {proposal.coverLetter}
            </p>
          )}

          {/* Phone Number (if revealed) */}
          {isShortlisted && proposal.contactRevealed && pro?.phone && (
            <div className="mb-4 p-3 rounded-xl bg-[var(--hm-success-50)]/20 border border-[var(--hm-success-500)]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--hm-success-500)]/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[var(--hm-success-500)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--hm-success-500)] font-medium mb-0.5">
                    {t("common.phone")}
                  </p>
                  <a
                    href={`tel:${pro.phone}`}
                    className="text-lg font-semibold text-[var(--hm-success-500)] hover:underline"
                  >
                    {pro.phone}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Actions for Pending */}
          {!isShortlisted && !isRejected && (
            <div className="flex items-center flex-wrap gap-2">
              <Button
                onClick={onShortlist}
                size="sm"
                leftIcon={<Check className="w-4 h-4" />}
              >
                {t("job.interested")}
              </Button>
              <Button
                onClick={onReject}
                variant="outline"
                size="sm"
                leftIcon={<X className="w-4 h-4" />}
              >
                {t("job.reject")}
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${(pro?.country ?? 'GE').toLowerCase()}/professionals/${pro?.id}`}>
                  {t("common.profile")}
                </Link>
              </Button>
            </div>
          )}

          {/* Actions for Shortlisted */}
          {isShortlisted && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Accept/Start Project Button - Primary Action */}
              <Button
                onClick={onAccept}
                disabled={isProcessing}
                loading={isProcessing}
                size="sm"
                leftIcon={
                  !isProcessing ? <Check className="w-4 h-4" /> : undefined
                }
                className="shadow-lg"
              >
                {t("job.startProject")}
              </Button>

              {proposal.contactRevealed && pro?.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-[var(--hm-success-500)]/20 text-[var(--hm-success-500)] hover:bg-[var(--hm-success-50)]"
                >
                  <a href={`tel:${pro.phone}`}>
                    <Phone className="w-4 h-4 mr-1.5" />
                    {t("job.call")}
                  </a>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${(pro?.country ?? 'GE').toLowerCase()}/professionals/${pro?.id}`}>
                  {t("common.profile")}
                </Link>
              </Button>
              {/* Revert to Pending Button */}
              {onRevert && (
                <Button
                  onClick={onRevert}
                  disabled={isProcessing}
                  variant="outline"
                  size="sm"
                  leftIcon={<Undo2 className="w-4 h-4" />}
                  className="border-[var(--hm-warning-500)]/20 text-[var(--hm-warning-500)] hover:bg-[var(--hm-warning-50)]"
                >
                  {t("job.revert")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function ProposalsPage() {
  return (
    <AuthGuard allowedRoles={["client", "pro", "admin"]}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[var(--hm-bg-elevated)]">
            <LoadingSpinner size="lg" color={ACCENT_COLOR} />
          </div>
        }
      >
        <ProposalsPageContent />
      </Suspense>
    </AuthGuard>
  );
}
