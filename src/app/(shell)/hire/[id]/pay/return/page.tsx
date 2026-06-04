"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { CheckCircle, XCircle } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Return URL after the client pays to hire a pro from a job proposal
 * (escrow-at-hire). Polls /jobs/proposals/:proposalId/reconcile-payment until
 * the escrow clears, then the hire is finalized server-side and we route to
 * the job/project view. Mirrors the booking pay/return flow.
 */
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30_000;
type Phase = "polling" | "success" | "failed" | "timeout";

export default function JobPayReturnPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const jobId = params.id;
  const proposalId = search.get("proposal");

  const [phase, setPhase] = useState<Phase>(proposalId ? "polling" : "failed");
  const startedAtRef = useRef<number>(Date.now());

  const pollOnce = useCallback(async (): Promise<Phase | null> => {
    if (!proposalId) return "failed";
    try {
      const { data } = await api.post<{ status: string; paid: boolean }>(
        `/jobs/proposals/${proposalId}/reconcile-payment`,
      );
      if (data.paid || data.status === "accepted") return "success";
      return null;
    } catch {
      return null;
    }
  }, [proposalId]);

  useEffect(() => {
    if (phase !== "polling") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (cancelled) return;
      const result = await pollOnce();
      if (cancelled) return;
      if (result === "success" || result === "failed") {
        setPhase(result);
        return;
      }
      if (Date.now() - startedAtRef.current >= POLL_TIMEOUT_MS) {
        setPhase("timeout");
        return;
      }
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pollOnce, phase]);

  useEffect(() => {
    if (phase !== "success") return;
    const id = setTimeout(() => router.push(`/jobs/${jobId}`), 2500);
    return () => clearTimeout(id);
  }, [phase, router, jobId]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--hm-bg-page)" }}
    >
      <Card variant="elevated" className="w-full max-w-md">
        <CardBody>
          {phase === "polling" && (
            <div className="flex flex-col items-center gap-5 py-10">
              <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
              <p className="text-sm font-medium" style={{ color: "var(--hm-fg-secondary)" }}>
                {t("pay.checkingStatus")}
              </p>
            </div>
          )}
          {phase === "success" && (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(180deg, rgb(34,197,94) 0%, rgb(22,163,74) 100%)" }}
              >
                <CheckCircle size={42} color="white" strokeWidth={2.25} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--hm-fg-primary)" }}>
                  {t("pay.successTitle")}
                </h2>
                <p
                  className="text-sm leading-relaxed max-w-xs mx-auto"
                  style={{ color: "var(--hm-fg-secondary)" }}
                >
                  {t("pay.hireSuccessBody")}
                </p>
              </div>
              <Button
                variant="premium"
                size="lg"
                className="w-full"
                onClick={() => router.push(`/jobs/${jobId}`)}
              >
                {t("pay.goToJob")}
              </Button>
            </div>
          )}
          {phase === "failed" && (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(180deg, rgb(239,68,68) 0%, rgb(220,38,38) 100%)" }}
              >
                <XCircle size={42} color="white" strokeWidth={2.25} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--hm-fg-primary)" }}>
                  {t("pay.failedTitle")}
                </h2>
                <p
                  className="text-sm leading-relaxed max-w-xs mx-auto"
                  style={{ color: "var(--hm-fg-secondary)" }}
                >
                  {t("pay.failedBody")}
                </p>
              </div>
              <Button
                variant="default"
                size="lg"
                className="w-full"
                onClick={() => router.push(`/my-jobs/${jobId}/proposals`)}
              >
                {t("pay.tryAgain")}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => router.push(`/jobs/${jobId}`)}>
                {t("pay.goToJob")}
              </Button>
            </div>
          )}
          {phase === "timeout" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <Alert variant="info">{t("pay.timeoutBody")}</Alert>
              <Button
                variant="default"
                className="w-full"
                onClick={() => {
                  startedAtRef.current = Date.now();
                  setPhase("polling");
                }}
              >
                {t("pay.checkAgain")}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => router.push(`/jobs/${jobId}`)}>
                {t("pay.goToJob")}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
