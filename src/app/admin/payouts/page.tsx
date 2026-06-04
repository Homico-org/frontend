"use client";

import AuthGuard from "@/components/common/AuthGuard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface BankAccount {
  bankCode: string;
  accountNumber: string;
  holderName: string;
  verifiedAt?: string;
}

interface PendingEscrow {
  escrowId: string;
  entityType: "booking" | "project_milestone";
  entityId: string;
  amountHeldMinor: number;
  refundedAmountMinor: number;
  payoutAmountMinor: number;
  currency: string;
  createdAt: string;
}

interface PendingPro {
  proUserId: string;
  name: string;
  phone?: string;
  uid?: number;
  bankAccount: BankAccount | null;
  escrows: PendingEscrow[];
  totalPayoutMinor: number;
  currency: string;
}

interface PendingPayoutsResponse {
  pros: PendingPro[];
}

/**
 * Admin payouts queue. Lists all escrows in pending_release status,
 * grouped by pro, with each pro's bank account ready for the manual wire.
 *
 * Admin workflow:
 *   1. Open page, see all pros owed money
 *   2. For each: copy IBAN + amount, do the actual bank transfer
 *   3. Paste the transfer reference + click "Mark as paid" to close
 *
 * Pros without bank accounts show a warning - admin can't process those
 * until the pro fills out /settings/payouts.
 */
export default function AdminPayoutsPage() {
  const { t } = useLanguage();
  const toast = useToast();

  const [data, setData] = useState<PendingPayoutsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingProId, setProcessingProId] = useState<string | null>(null);
  const [transferReferences, setTransferReferences] = useState<
    Record<string, string>
  >({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Shared abort ref - load() is called from mount AND after every
  // `handleProcess` to refresh the queue. Without cancellation a fast
  // admin processing multiple payouts in a row used to queue several
  // overlapping pending-payouts reads racing for the same setData.
  const loadAbortRef = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    try {
      setLoading(true);
      const { data } = await api.get<PendingPayoutsResponse>(
        "/payments/admin/pending-payouts",
        { signal: controller.signal },
      );
      setData(data);
    } catch (err) {
      const name = (err as { name?: string })?.name;
      const code = (err as { code?: string })?.code;
      if (name === "CanceledError" || code === "ERR_CANCELED") return;
      console.error("Failed to load pending payouts:", err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("common.somethingWentWrong");
      toast.error(t("common.error"), message);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const formatMinor = (minor: number, currency = "GEL") =>
    `${(minor / 100).toFixed(2)} ${currency}`;

  const handleProcess = useCallback(
    async (pro: PendingPro) => {
      if (!pro.bankAccount) return;
      setProcessingProId(pro.proUserId);
      try {
        await api.post("/payments/admin/payouts", {
          proUserId: pro.proUserId,
          escrowIds: pro.escrows.map((e) => e.escrowId),
          transferReference: transferReferences[pro.proUserId]?.trim() || undefined,
          notes: notes[pro.proUserId]?.trim() || undefined,
        });
        toast.success(t("adminPayout.processedToast"));
        await load();
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? t("common.error");
        toast.error(msg);
      } finally {
        setProcessingProId(null);
      }
    },
    [transferReferences, notes, toast, t, load],
  );

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div
        className="min-h-screen px-3 py-5 sm:px-6 sm:py-8"
        style={{ backgroundColor: "var(--hm-bg-page)" }}
      >
        <div className="max-w-5xl mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm mb-4 hover:opacity-80 transition-opacity"
            style={{ color: "var(--hm-text-secondary)" }}
          >
            <ArrowLeft size={16} />
            {t("nav.back")}
          </Link>

          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h1
                className="text-2xl font-semibold flex items-center gap-2"
                style={{ color: "var(--hm-text-primary)" }}
              >
                <Banknote size={22} color="rgb(22, 163, 74)" />
                {t("adminPayout.title")}
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--hm-text-secondary)" }}
              >
                {t("adminPayout.subtitle")}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void load()}>
              <RefreshCw size={14} />
              {t("admin.refresh")}
            </Button>
          </div>

          {loading && !data ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner size="md" />
            </div>
          ) : !data || data.pros.length === 0 ? (
            <Card variant="elevated">
              <CardBody>
                <div className="text-center py-8">
                  <CheckCircle2
                    size={40}
                    color="rgb(22, 163, 74)"
                    className="mx-auto mb-3"
                  />
                  <p style={{ color: "var(--hm-text-primary)" }}>
                    {t("adminPayout.empty")}
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.pros.map((pro) => (
                <Card key={pro.proUserId} variant="elevated">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>
                          {pro.name}
                          {pro.uid ? (
                            <span
                              className="ml-2 text-xs font-mono"
                              style={{ color: "var(--hm-text-tertiary)" }}
                            >
                              #{pro.uid}
                            </span>
                          ) : null}
                          {/* Inline blocker tag - admins should see at a
                              glance which pros in the list can't be paid
                              today without scrolling into the body. */}
                          {!pro.bankAccount && (
                            <span
                              className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full align-middle"
                              style={{
                                backgroundColor: "rgba(220, 38, 38, 0.12)",
                                color: "rgb(185, 28, 28)",
                              }}
                            >
                              <AlertTriangle size={10} />
                              {t("adminPayout.blockedTag")}
                            </span>
                          )}
                        </CardTitle>
                        {pro.phone && (
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: "var(--hm-text-tertiary)" }}
                          >
                            {pro.phone}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p
                          className="text-xs uppercase tracking-wide"
                          style={{ color: "var(--hm-text-tertiary)" }}
                        >
                          {t("adminPayout.totalDue")}
                        </p>
                        <p
                          className="text-xl font-semibold"
                          style={{ color: "rgb(22, 163, 74)" }}
                        >
                          {formatMinor(pro.totalPayoutMinor, pro.currency)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    {!pro.bankAccount ? (
                      <Alert variant="error">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={16} className="mt-0.5" />
                          <div>
                            <p className="font-semibold">
                              {t("adminPayout.noBank")}
                            </p>
                            <p className="text-xs mt-1">
                              {t("adminPayout.noBankBody")}
                            </p>
                          </div>
                        </div>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        {/* Bank account snapshot */}
                        <div
                          className="rounded-lg p-3"
                          style={{ backgroundColor: "var(--hm-bg-elevated)" }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="text-xs uppercase tracking-wide"
                              style={{ color: "var(--hm-text-tertiary)" }}
                            >
                              {t("adminPayout.bankInfo")}
                            </span>
                            {pro.bankAccount.verifiedAt && (
                              <span
                                className="inline-flex items-center gap-0.5 text-xs"
                                style={{ color: "rgb(22, 163, 74)" }}
                              >
                                <BadgeCheck size={12} />
                                {t("adminPayout.verified")}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                            <div>
                              <p
                                className="text-xs"
                                style={{ color: "var(--hm-text-tertiary)" }}
                              >
                                {t("adminPayout.bank")}
                              </p>
                              <p style={{ color: "var(--hm-text-primary)" }}>
                                {pro.bankAccount.bankCode}
                              </p>
                            </div>
                            <div>
                              <p
                                className="text-xs"
                                style={{ color: "var(--hm-text-tertiary)" }}
                              >
                                {t("adminPayout.holder")}
                              </p>
                              <p style={{ color: "var(--hm-text-primary)" }}>
                                {pro.bankAccount.holderName}
                              </p>
                            </div>
                            <div>
                              <p
                                className="text-xs"
                                style={{ color: "var(--hm-text-tertiary)" }}
                              >
                                {t("adminPayout.account")}
                              </p>
                              <p
                                className="font-mono text-xs"
                                style={{ color: "var(--hm-text-primary)" }}
                              >
                                {pro.bankAccount.accountNumber}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Escrows being included in the batch */}
                        <div>
                          <p
                            className="text-xs uppercase tracking-wide mb-1.5"
                            style={{ color: "var(--hm-text-tertiary)" }}
                          >
                            {t("adminPayout.included")} ({pro.escrows.length})
                          </p>
                          <ul className="space-y-1">
                            {pro.escrows.map((e) => (
                              <li
                                key={e.escrowId}
                                className="flex items-center justify-between text-xs py-1.5 px-2 rounded"
                                style={{ backgroundColor: "var(--hm-bg-elevated)" }}
                              >
                                <Link
                                  href={`/bookings/${e.entityId}`}
                                  className="font-mono hover:underline"
                                  style={{ color: "var(--hm-text-secondary)" }}
                                >
                                  {e.entityType === "booking" ? "📅" : "💼"} {e.entityId.slice(-8)}
                                </Link>
                                <span style={{ color: "var(--hm-text-primary)" }}>
                                  {formatMinor(e.payoutAmountMinor, e.currency)}
                                  {e.refundedAmountMinor > 0 && (
                                    <span
                                      className="ml-2"
                                      style={{ color: "var(--hm-text-tertiary)" }}
                                    >
                                      ({t("adminPayout.partialRefunded")})
                                    </span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Transfer fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              className="block text-xs uppercase tracking-wide mb-1"
                              style={{ color: "var(--hm-text-tertiary)" }}
                            >
                              {t("adminPayout.transferRef")}
                            </label>
                            <Input
                              value={transferReferences[pro.proUserId] ?? ""}
                              onChange={(e) =>
                                setTransferReferences((prev) => ({
                                  ...prev,
                                  [pro.proUserId]: e.target.value,
                                }))
                              }
                              placeholder={t("adminPayout.transferRefPlaceholder")}
                            />
                          </div>
                          <div>
                            <label
                              className="block text-xs uppercase tracking-wide mb-1"
                              style={{ color: "var(--hm-text-tertiary)" }}
                            >
                              {t("adminPayout.notesLabel")}
                            </label>
                            <Textarea
                              value={notes[pro.proUserId] ?? ""}
                              onChange={(e) =>
                                setNotes((prev) => ({
                                  ...prev,
                                  [pro.proUserId]: e.target.value,
                                }))
                              }
                              rows={1}
                              placeholder={t("adminPayout.notesPlaceholder")}
                            />
                          </div>
                        </div>

                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => handleProcess(pro)}
                          disabled={processingProId === pro.proUserId}
                          loading={processingProId === pro.proUserId}
                        >
                          {t("adminPayout.markPaid", {
                            amount: formatMinor(pro.totalPayoutMinor, pro.currency),
                          })}
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
