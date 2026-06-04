"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCountryLink } from "@/hooks/useCountry";
import { CheckCircle, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Return URL after a premium subscription payment. The paymentId is stashed in
 * sessionStorage by the checkout (the provider returns to a fixed URL that
 * can't carry it). Polls /payments/:id/reconcile until the charge clears - the
 * reconcile triggers the server-side premium grant - then routes to success.
 */
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30_000;
type Phase = "polling" | "success" | "failed" | "timeout";

export default function PremiumReturnPage() {
  const search = useSearchParams();
  const router = useRouter();
  const cl = useCountryLink();
  const { t } = useLanguage();
  const tier = search.get("tier") || "pro";

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("polling");
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    const pid = sessionStorage.getItem("premiumPaymentId");
    if (pid) setPaymentId(pid);
    else setPhase("failed");
  }, []);

  const pollOnce = useCallback(async (): Promise<Phase | null> => {
    if (!paymentId) return null;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/payments/${paymentId}/reconcile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { status?: string };
      if (data.status === "succeeded") return "success";
      if (data.status === "failed" || data.status === "cancelled") return "failed";
      return null;
    } catch {
      return null;
    }
  }, [paymentId]);

  useEffect(() => {
    if (phase !== "polling" || !paymentId) return;
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
  }, [pollOnce, phase, paymentId]);

  useEffect(() => {
    if (phase !== "success") return;
    sessionStorage.removeItem("premiumPaymentId");
    const id = setTimeout(() => router.push(cl(`/pro/premium/success?tier=${tier}`)), 2000);
    return () => clearTimeout(id);
  }, [phase, router, cl, tier]);

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
              <h2 className="text-2xl font-bold" style={{ color: "var(--hm-fg-primary)" }}>
                {t("pay.successTitle")}
              </h2>
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
                onClick={() => router.push(cl("/pro/premium"))}
              >
                {t("pay.tryAgain")}
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
              <Button variant="ghost" className="w-full" onClick={() => router.push(cl("/pro/premium"))}>
                {t("pay.goToBookings")}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
