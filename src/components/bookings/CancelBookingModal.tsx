"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface CancellationQuote {
  cancellable: boolean;
  isProCancelling: boolean;
  currency: string;
  refundMinor: number;
  payoutMinor: number;
  refundPercent: number;
  payoutPercent: number;
  policy:
    | "pro_cancel"
    | "client_unconfirmed"
    | "client_24h"
    | "client_2h"
    | "client_late"
    | "no_payment";
  hoursUntilBooking: number;
}

interface CancelBookingModalProps {
  bookingId: string | null;
  onClose: () => void;
  /** Called with the cancelled booking when the cancel API succeeds. */
  onCancelled?: () => void;
}

/**
 * Confirm-cancel modal with a live refund preview. On open it fetches a
 * cancellation quote from the backend - the same calculator that runs
 * server-side when the user confirms - so the displayed split is exactly
 * what will happen.
 *
 * Renders six distinct quote shapes:
 *   pro_cancel         -> "Full refund + we'll record this against the pro"
 *   client_unconfirmed -> "Full refund - the pro hasn't accepted yet"
 *   client_24h         -> "Full refund (>24h before booking)"
 *   client_2h          -> "50% refund / 50% to pro (within 24h)"
 *   client_late        -> "No refund (less than 2h before booking)"
 *   no_payment         -> "Nothing was paid yet, nothing to refund"
 *
 * Reason field is optional but encouraged - admins read it during disputes
 * and pro-strike reviews.
 */
export default function CancelBookingModal({
  bookingId,
  onClose,
  onCancelled,
}: CancelBookingModalProps) {
  const { t } = useLanguage();
  const toast = useToast();

  const [quote, setQuote] = useState<CancellationQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isOpen = bookingId !== null;

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<CancellationQuote>(
          `/bookings/${bookingId}/cancellation-quote`,
        );
        if (!cancelled) setQuote(data);
      } catch (err) {
        if (cancelled) return;
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? t("common.error");
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [bookingId, t]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    setQuote(null);
    setReason("");
    setError(null);
    onClose();
  }, [submitting, onClose]);

  const handleConfirm = useCallback(async () => {
    if (!bookingId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/bookings/${bookingId}/cancel`, {
        reason: reason.trim() || undefined,
      });
      toast.success(t("cancel.successToast"));
      onCancelled?.();
      handleClose();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("common.error");
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [bookingId, reason, toast, t, onCancelled, handleClose]);

  // ---- helpers ----

  const formatMinor = (minor: number, currency: string) =>
    `${(minor / 100).toFixed(2)} ${currency}`;

  const policyMessage = (q: CancellationQuote): { variant: "info" | "warning" | "error" | "success"; body: string } => {
    if (q.policy === "no_payment") {
      return { variant: "info", body: t("cancel.policyNoPayment") };
    }
    if (q.policy === "pro_cancel") {
      return { variant: "info", body: t("cancel.policyProCancel") };
    }
    if (q.policy === "client_unconfirmed") {
      return { variant: "success", body: t("cancel.policyClientUnconfirmed") };
    }
    if (q.policy === "client_24h") {
      return { variant: "success", body: t("cancel.policyClient24h") };
    }
    if (q.policy === "client_2h") {
      return { variant: "warning", body: t("cancel.policyClient2h") };
    }
    // client_late
    return { variant: "error", body: t("cancel.policyClientLate") };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      showCloseButton
      preventClose={submitting}
      ariaLabel={t("cancel.title")}
    >
      <ModalHeader
        title={t("cancel.title")}
        description={t("cancel.subtitle")}
      />
      <ModalBody>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : !quote ? (
          <Alert variant="error">{error ?? t("common.error")}</Alert>
        ) : !quote.cancellable ? (
          <Alert variant="warning">{t("cancel.notCancellable")}</Alert>
        ) : (
          <div className="space-y-4">
            {(() => {
              const m = policyMessage(quote);
              return <Alert variant={m.variant}>{m.body}</Alert>;
            })()}

            {quote.policy !== "no_payment" && (() => {
              // The refund line is the focal number for the user. Promote it
              // to a receipt-style hero row (matches the total treatment on
              // the bookings card), and put the payout line as a secondary
              // breakdown beneath. Background gradient tints the whole
              // block based on the outcome so the user reads the verdict
              // at a glance: green = good news, amber = mixed, red = none.
              const isFullRefund = quote.refundPercent === 100;
              const isNoRefund = quote.refundPercent === 0;
              const tint = isFullRefund
                ? {
                    bg: "linear-gradient(180deg, rgba(34,197,94,0.10) 0%, rgba(34,197,94,0.03) 100%)",
                    border: "rgba(34,197,94,0.25)",
                    refundColor: "rgb(22, 163, 74)",
                  }
                : isNoRefund
                  ? {
                      bg: "linear-gradient(180deg, rgba(239,68,68,0.10) 0%, rgba(239,68,68,0.03) 100%)",
                      border: "rgba(239,68,68,0.25)",
                      refundColor: "rgb(185, 28, 28)",
                    }
                  : {
                      bg: "linear-gradient(180deg, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0.03) 100%)",
                      border: "rgba(245,158,11,0.25)",
                      refundColor: "rgb(180, 83, 9)",
                    };
              return (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: tint.bg,
                    border: `1px solid ${tint.border}`,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                  }}
                >
                  {/* Hero refund row - this is what the user came to see */}
                  <div className="flex items-baseline justify-between">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                      style={{ color: "var(--hm-fg-muted)" }}
                    >
                      {t("cancel.refundLabel")}
                    </span>
                    <span
                      className="text-2xl font-bold tabular-nums leading-none"
                      style={{ color: tint.refundColor }}
                    >
                      {formatMinor(quote.refundMinor, quote.currency)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-end mt-1">
                    <span
                      className="text-xs tabular-nums font-medium"
                      style={{ color: tint.refundColor, opacity: 0.7 }}
                    >
                      {quote.refundPercent}%
                    </span>
                  </div>

                  {/* Secondary payout line - only shows when there's a
                      non-zero payout to the pro. Demoted to text-sm with a
                      thin divider so it reads as a breakdown line, not a
                      competing total. */}
                  {quote.payoutMinor > 0 && (
                    <div
                      className="flex items-baseline justify-between mt-3 pt-3"
                      style={{
                        borderTop: `1px solid ${tint.border}`,
                      }}
                    >
                      <span
                        className="text-xs"
                        style={{ color: "var(--hm-fg-secondary)" }}
                      >
                        {t("cancel.payoutLabel")}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-sm font-semibold tabular-nums"
                          style={{ color: "var(--hm-fg-primary)" }}
                        >
                          {formatMinor(quote.payoutMinor, quote.currency)}
                        </span>
                        <span
                          className="text-[11px] tabular-nums"
                          style={{ color: "var(--hm-fg-muted)" }}
                        >
                          ({quote.payoutPercent}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--hm-text-secondary)" }}
              >
                {t("cancel.reasonLabel")}
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("cancel.reasonPlaceholder")}
                rows={3}
                disabled={submitting}
              />
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {/* Link out to the public policy - useful for clients who want
                to read the full rules before clicking confirm. */}
            <p className="text-xs text-center" style={{ color: 'var(--hm-text-tertiary)' }}>
              <Link
                href="/refund-policy"
                target="_blank"
                rel="noopener"
                className="underline hover:opacity-80"
                style={{ color: 'var(--hm-text-secondary)' }}
              >
                {t('cancel.readPolicy')}
              </Link>
            </p>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        {/* Mobile-first footer: at narrow widths (<480px) stack the
            primary above the secondary so neither button compresses
            below the 44px iOS HIG comfort target. At sm+ widths
            revert to the desktop pattern (secondary left, primary
            right) which puts the commit action at the end of the
            reading direction. */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {t("cancel.dismiss")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || submitting || !quote?.cancellable}
            loading={submitting}
            className="w-full sm:w-auto"
          >
            {t("cancel.confirm")}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
