"use client";

import ConfettiBurst from "@/components/common/ConfettiBurst";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCountry } from "@/hooks/useCountry";
import { useHaptic } from "@/hooks/useHaptic";
import { useShareLink } from "@/hooks/useShareLink";
import { CheckCircle2, Eye, MessageSquare, Share2, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

/**
 * Confetti-light success state shown after a job is posted. The
 * previous flow dumped the user on `/my-jobs` with no context - they
 * just saw their job list and had no idea what to do next.
 *
 * Three obvious next-steps:
 *  - View the just-posted job (lands inside the marketplace listing)
 *  - Share the job link (clipboard copy + native share where available)
 *  - Browse pros while waiting for proposals
 *
 * The job ID rides in as `?id=...`. Without it (deep-link / refresh
 * after the flow), we still render the success page; the View Job
 * CTA falls back to the user's jobs list.
 */
function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const country = useCountry();
  const { t } = useLanguage();
  const haptic = useHaptic();
  const share = useShareLink();
  const jobId = searchParams.get("id");
  const [mounted, setMounted] = useState(false);

  // Fade-in on mount + light haptic confirmation. The success flow
  // is the rare moment where a deliberate physical "yes" feels
  // right - reinforces the just-completed action.
  useEffect(() => {
    setMounted(true);
    haptic("success");
  }, [haptic]);

  const countryPrefix = `/${country.toLowerCase()}`;
  const jobUrl = jobId ? `${countryPrefix}/jobs/${jobId}` : "/my-jobs";
  const proListUrl = `${countryPrefix}/professionals`;

  const handleShare = async () => {
    if (!jobId) return;
    const fullUrl =
      typeof window !== "undefined" ? `${window.location.origin}${jobUrl}` : jobUrl;
    // Native share where supported, clipboard everywhere else.
    // Centralized in `useShareLink` so future share buttons inherit
    // the same behavior + toast.
    await share({ url: fullUrl });
  };

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center px-4 py-12 sm:py-16 bg-[var(--hm-bg-page)]">
      {/* One-shot confetti burst tied to mount. Pure decoration -
          respects prefers-reduced-motion (no particles for users
          who've opted out). */}
      <ConfettiBurst active={mounted} />
      <Card
        className={`w-full max-w-lg p-6 sm:p-8 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Celebration mark */}
        <div className="flex items-center justify-center mb-5">
          <div className="relative w-20 h-20 rounded-full bg-[var(--hm-success-50)] flex items-center justify-center">
            <CheckCircle2
              className="w-10 h-10 text-[var(--hm-success-500)]"
              strokeWidth={1.75}
            />
            {/* Outer pulse ring */}
            <span className="absolute inset-0 rounded-full border-2 border-[var(--hm-success-500)]/30 animate-ping" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-center text-[var(--hm-fg-primary)] mb-2">
          {t("postJobSuccess.title")}
        </h1>
        <p className="text-sm sm:text-base text-center text-[var(--hm-fg-secondary)] mb-6 sm:mb-7">
          {t("postJobSuccess.subtitle")}
        </p>

        {/* "What happens next" expectation card. First-time clients
            often submit a job and stare at the empty proposals list
            wondering if the platform is broken. This sets concrete
            expectations: pros will respond, you'll pick one, money
            stays safe in escrow until you confirm. */}
        <div className="mb-6 sm:mb-7 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]/40 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--hm-fg-muted)]">
            {t("postJobSuccess.whatsNextTitle")}
          </p>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[var(--hm-brand-500)]/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-3.5 h-3.5 text-[var(--hm-brand-500)]" />
            </div>
            <p className="text-sm text-[var(--hm-fg-secondary)] pt-0.5">
              {t("postJobSuccess.whatsNextStep1")}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[var(--hm-brand-500)]/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-3.5 h-3.5 text-[var(--hm-brand-500)]" />
            </div>
            <p className="text-sm text-[var(--hm-fg-secondary)] pt-0.5">
              {t("postJobSuccess.whatsNextStep2")}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[var(--hm-success-50)] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--hm-success-500)]" />
            </div>
            <p className="text-sm text-[var(--hm-fg-secondary)] pt-0.5">
              {t("postJobSuccess.whatsNextStep3")}
            </p>
          </div>
        </div>

        {/* Primary CTA - View the just-posted job */}
        <div className="space-y-2.5">
          <Button asChild className="w-full" size="lg" leftIcon={<Eye className="w-4 h-4" />}>
            <Link href={jobUrl}>{t("postJobSuccess.viewJob")}</Link>
          </Button>

          {/* Secondary - share */}
          {jobId && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              leftIcon={<Share2 className="w-4 h-4" />}
              onClick={handleShare}
            >
              {t("postJobSuccess.share")}
            </Button>
          )}

          {/* Tertiary - explore while waiting */}
          <Button
            asChild
            variant="ghost"
            className="w-full"
            size="lg"
            leftIcon={<Users className="w-4 h-4" />}
          >
            <Link href={proListUrl}>{t("postJobSuccess.browsePros")}</Link>
          </Button>
        </div>

        {/* If the user came here from somewhere weird (no jobId), give
            them a quick way back. Keyboard users can hit Esc too. */}
        {!jobId && (
          <button
            type="button"
            onClick={() => router.push("/my-jobs")}
            className="mt-5 w-full text-xs text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] transition-colors"
          >
            {t("notFound.myJobs")}
          </button>
        )}
      </Card>
    </div>
  );
}

export default function PostJobSuccessPage() {
  // Suspense wrap because useSearchParams forces dynamic rendering.
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
