"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { extractApiErrorMessage } from "@/utils/errorUtils";
import { ArrowLeft, CreditCard, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface PaymentSummary {
  paymentId: string;
  status: "pending" | "succeeded" | "failed" | "cancelled" | "refunded" | "partially_refunded";
  amountMinor: number;
  currency: string;
  provider: string;
  redirectUrl?: string;
}

/**
 * Pre-redirect "Review and pay" screen. Shows the total + provider name +
 * "Pay" button that hard-redirects to the provider's hosted page.
 *
 * Handles three states:
 *  - Pending intent with valid redirectUrl   -> show Pay button
 *  - Already-succeeded payment               -> show "Already paid" + link
 *                                                back to /bookings
 *  - Failed / cancelled / no redirect URL    -> show "Try again" button
 *                                                that mints a new intent
 *
 * The actual payment happens off-site (BoG / Stripe hosted page) or on the
 * mock-confirm page in dev. After payment the provider redirects to
 * /bookings/[id]/pay/return.
 */
export default function PayPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const toast = useToast();
  const bookingId = params.id;

  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<PaymentSummary | null>(
        `/bookings/${bookingId}/payment`,
      );
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(extractApiErrorMessage(err, t("common.error")));
    } finally {
      setLoading(false);
    }
  }, [bookingId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePay = useCallback(() => {
    if (!summary?.redirectUrl) return;
    // Hard navigation - the provider page lives outside our SPA and we
    // want a clean back-button experience after they return.
    window.location.href = summary.redirectUrl;
  }, [summary]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      const { data } = await api.post<{ paymentId: string; redirectUrl: string }>(
        `/bookings/${bookingId}/retry-payment`,
      );
      window.location.href = data.redirectUrl;
    } catch (err) {
      console.error('[bookings/pay] Retry-payment failed', err);
      toast.error(extractApiErrorMessage(err, t("common.error")));
      setRetrying(false);
    }
  }, [bookingId, toast, t]);

  // ---- render ----

  const formatAmount = (minor: number, currency: string) => {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  };

  const providerLabel = (name: string) => {
    switch (name) {
      case "bog":
        return "Bank of Georgia";
      case "tbc":
        return "TBC Bank";
      case "stripe":
        return "Stripe";
      case "pay-ge":
        return "Pay.ge";
      case "mock":
        return t("pay.mockProviderLabel");
      default:
        return name;
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-6 sm:px-6 sm:py-8"
      style={{ backgroundColor: "var(--hm-bg-page)" }}
    >
      <div className="max-w-lg mx-auto">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 text-sm mb-4 hover:opacity-80 transition-opacity"
          style={{ color: "var(--hm-text-secondary)" }}
        >
          <ArrowLeft size={16} />
          {t("common.back")}
        </Link>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>{t("pay.title")}</CardTitle>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner size="md" />
              </div>
            ) : error ? (
              <Alert variant="error">{error}</Alert>
            ) : !summary ? (
              <Alert variant="warning">{t("pay.noIntent")}</Alert>
            ) : summary.status === "succeeded" ? (
              <div className="space-y-4">
                <Alert variant="success">{t("pay.alreadyPaid")}</Alert>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => router.push("/bookings")}
                >
                  {t("pay.viewBooking")}
                </Button>
              </div>
            ) : summary.status === "pending" && summary.redirectUrl ? (
              <div className="space-y-5">
                {/* Total - receipt-hero treatment matching the bookings
                    card's total row. Brand-orange + tabular for the
                    number, small-caps muted label, gradient surface. */}
                <div
                  className="rounded-xl px-4 py-4"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(239,78,36,0.10) 0%, rgba(239,78,36,0.03) 100%)",
                    border: "1px solid rgba(239,78,36,0.20)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
                  }}
                >
                  <div className="flex items-baseline justify-between">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                      style={{ color: "var(--hm-fg-muted)" }}
                    >
                      {t("pay.total")}
                    </span>
                    <span
                      className="text-3xl font-bold tabular-nums leading-none"
                      style={{ color: "var(--hm-brand-500)" }}
                    >
                      {formatAmount(summary.amountMinor, summary.currency)}
                    </span>
                  </div>
                </div>

                {/* Trust-signal stack. Two compact rows: (1) provider is
                    secure, (2) money sits in escrow until you confirm.
                    Both are critical reassurance before the user clicks
                    a "send money" button and gets redirected off-site. */}
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{
                      backgroundColor: "var(--hm-bg-elevated)",
                      border: "1px solid var(--hm-border-subtle)",
                    }}
                  >
                    <Lock
                      size={14}
                      className="shrink-0"
                      style={{ color: "var(--hm-fg-secondary)" }}
                    />
                    <p
                      className="text-xs leading-tight"
                      style={{ color: "var(--hm-fg-secondary)" }}
                    >
                      {t("pay.secureRedirect", {
                        provider: providerLabel(summary.provider),
                      })}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{
                      backgroundColor: "var(--hm-bg-elevated)",
                      border: "1px solid var(--hm-border-subtle)",
                    }}
                  >
                    <ShieldCheck
                      size={14}
                      className="shrink-0"
                      style={{ color: "rgb(22, 163, 74)" }}
                    />
                    <p
                      className="text-xs leading-tight"
                      style={{ color: "var(--hm-fg-secondary)" }}
                    >
                      {t("pay.escrowReassurance")}
                    </p>
                  </div>
                </div>

                {/* Primary CTA - premium variant for the strongest treatment
                    in the app. This is a "send money" moment, deserves the
                    full accent + glow. */}
                <Button
                  variant="premium"
                  size="lg"
                  className="w-full"
                  onClick={handlePay}
                  leftIcon={<CreditCard />}
                >
                  {t("pay.payButton", { provider: providerLabel(summary.provider) })}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push("/bookings")}
                >
                  {t("common.cancel")}
                </Button>

                {/* Surface the public policy before the user commits. */}
                <p
                  className="text-xs text-center"
                  style={{ color: "var(--hm-text-tertiary)" }}
                >
                  <Link
                    href="/refund-policy"
                    target="_blank"
                    rel="noopener"
                    className="underline hover:opacity-80"
                    style={{ color: "var(--hm-text-secondary)" }}
                  >
                    {t("pay.readPolicy")}
                  </Link>
                </p>
              </div>
            ) : (
              // Failed / cancelled / no redirect URL: offer retry
              <div className="space-y-4">
                <Alert variant="warning">
                  {summary.status === "failed"
                    ? t("pay.failedRetry")
                    : t("pay.expiredRetry")}
                </Alert>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={handleRetry}
                  disabled={retrying}
                  loading={retrying}
                >
                  <RefreshCw size={16} className={retrying ? "animate-spin" : ""} />
                  {t("pay.retry")}
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
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
