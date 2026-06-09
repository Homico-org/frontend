"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { CheckCircle, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface BookingReconcileResponse {
  _id?: string;
  status: string;
  paymentStatus: string;
}

/**
 * Return URL after the user finishes/cancels at the provider's hosted page.
 *
 * Polls /bookings/:id/reconcile-payment every 1.5s for up to 30s. The
 * reconcile endpoint asks the provider for the real status and updates our
 * booking accordingly - so we don't have to wait for the webhook.
 *
 * Three terminal outcomes:
 *  - booking.paymentStatus === 'paid'    -> show success, route to /bookings
 *  - booking.status === 'cancelled'      -> show failure, offer retry
 *  - timeout (status still UNPAID after 30s) -> show "still processing"
 *    with manual refresh button
 */

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30_000;

type Phase = "polling" | "success" | "failed" | "timeout";

export default function PayReturnPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const bookingId = params.id;

  const [phase, setPhase] = useState<Phase>("polling");
  const startedAtRef = useRef<number>(Date.now());

  const pollOnce = useCallback(async (): Promise<Phase | null> => {
    try {
      const { data } = await api.post<BookingReconcileResponse>(
        `/bookings/${bookingId}/reconcile-payment`,
      );
      if (data.paymentStatus === "paid") return "success";
      if (data.status === "cancelled") return "failed";
      return null; // still pending, keep polling
    } catch {
      // Network blip - keep polling, don't abort.
      return null;
    }
  }, [bookingId]);

  useEffect(() => {
    // Only run the polling loop while we're in the polling phase.
    // Without this gate the effect re-fires on every phase change,
    // and (more importantly) when the user hits "Check again" from
    // the timeout phase, setting phase back to "polling" needs to
    // restart the loop - previously the deps were `[pollOnce]`
    // only, so the retry button did nothing visible: spinner came
    // back, no poll ever fired.
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

  // Auto-redirect on success after a brief pause so the user sees the
  // confirmation tick.
  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => router.push("/bookings"), 2500);
    return () => clearTimeout(t);
  }, [phase, router]);

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
              <p
                className="text-sm font-medium"
                style={{ color: "var(--hm-fg-secondary)" }}
              >
                {t("pay.checkingStatus")}
              </p>
            </div>
          )}

          {phase === "success" && (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              {/* Success "halo" - radial gradient behind the icon plus a
                  fade-in animation gives the moment the celebratory beat
                  it deserves. The user just spent money; a flat green
                  check feels transactional, the halo feels confident. */}
              <div className="relative animate-fade-in">
                <div
                  className="absolute inset-0 rounded-full blur-2xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(34,197,94,0.35) 0%, transparent 70%)",
                  }}
                  aria-hidden="true"
                />
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(180deg, rgb(34,197,94) 0%, rgb(22,163,74) 100%)",
                    boxShadow:
                      "0 12px 32px -8px rgba(34,197,94,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  <CheckCircle size={42} color="white" strokeWidth={2.25} />
                </div>
              </div>
              <div>
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: "var(--hm-fg-primary)" }}
                >
                  {t("pay.successTitle")}
                </h2>
                <p
                  className="text-sm leading-relaxed max-w-xs mx-auto"
                  style={{ color: "var(--hm-fg-secondary)" }}
                >
                  {t("pay.successBody")}
                </p>
              </div>
              <Button
                variant="premium"
                size="lg"
                className="w-full"
                onClick={() => router.push("/bookings")}
              >
                {t("pay.viewBooking")}
              </Button>
            </div>
          )}

          {phase === "failed" && (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              {/* Mirror the success halo but in error red. Same visual
                  weight so failure doesn't read as "smaller" than success
                  - the user's attention needs to land here. */}
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full blur-2xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(239,68,68,0.30) 0%, transparent 70%)",
                  }}
                  aria-hidden="true"
                />
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(180deg, rgb(239,68,68) 0%, rgb(220,38,38) 100%)",
                    boxShadow:
                      "0 12px 32px -8px rgba(239,68,68,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  <XCircle size={42} color="white" strokeWidth={2.25} />
                </div>
              </div>
              <div>
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: "var(--hm-fg-primary)" }}
                >
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
                onClick={() => router.push(`/bookings/${bookingId}/pay`)}
              >
                {t("pay.tryAgain")}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => router.push("/bookings")}
              >
                {t("common.cancel")}
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
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => router.push("/bookings")}
              >
                {t("pay.goToBookings")}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
