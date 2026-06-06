"use client";

import AuthGuard from "@/components/common/AuthGuard";
import BackButton from "@/components/common/BackButton";
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
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  RefreshCw,
  ShieldOff,
  Split,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type DisputeStatus =
  | "open"
  | "resolved_for_client"
  | "resolved_for_pro"
  | "split"
  | "rejected";

type DisputeType = "pro_noshow" | "client_noshow" | "quality" | "cancellation" | "other";

interface Dispute {
  _id: string;
  entityType: "booking" | "project_milestone";
  entityId: string;
  escrowId: string;
  raisedByUserId: string;
  raisedAgainstUserId: string;
  type: DisputeType;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  resolution?: string;
  refundAmountMinor: number;
  payoutAmountMinor: number;
  createdAt: string;
}

interface Escrow {
  _id: string;
  amountHeldMinor: number;
  currency: string;
  payerUserId: string;
  payeeUserId: string;
  status: string;
}

interface ListResponse {
  data: Dispute[];
  total: number;
  openCount: number;
  page: number;
  limit: number;
}

interface DetailResponse {
  dispute: Dispute;
  escrow: Escrow | null;
}

type Resolution = "resolved_for_client" | "resolved_for_pro" | "split" | "rejected";

/**
 * Admin queue for dispute resolution. Each dispute holds an escrow frozen
 * until the admin picks a resolution. The split mode lets the admin set
 * the exact refund + payout split as long as it sums to the held amount.
 */
export default function AdminDisputesPage() {
  const { t } = useLanguage();
  const toast = useToast();

  const [list, setList] = useState<ListResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("open");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Shared abort ref - admin can toggle status filters rapidly. Without
  // cancellation, switching from "open" to "all" to "resolved" in quick
  // succession queues parallel requests and the last to RESOLVE
  // (not the last initiated) wins the setList race.
  const loadAbortRef = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const { data } = await api.get<ListResponse>(
        `/payments/admin/disputes?${params.toString()}`,
        { signal: controller.signal },
      );
      setList(data);
      // Auto-select first open dispute for fast triage.
      if (!selectedId && data.data.length > 0) {
        setSelectedId(data.data[0]._id);
      }
    } catch (err) {
      const name = (err as { name?: string })?.name;
      const code = (err as { code?: string })?.code;
      if (name === "CanceledError" || code === "ERR_CANCELED") return;
      console.error("Failed to load disputes:", err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("common.somethingWentWrong");
      toast.error(t("common.error"), message);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [statusFilter, selectedId, t, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div
        className="min-h-screen px-3 py-5 sm:px-6 sm:py-8"
        style={{ backgroundColor: "var(--hm-bg-page)" }}
      >
        <div className="max-w-7xl mx-auto">
          <BackButton href="/admin" variant="minimal" label={t("common.back")} className="mb-4" />

          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h1
                className="text-2xl font-semibold flex items-center gap-2"
                style={{ color: "var(--hm-text-primary)" }}
              >
                <AlertTriangle size={22} color="#EF4E24" />
                {t("adminDispute.title")}
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--hm-text-secondary)" }}
              >
                {t("adminDispute.subtitle")}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void load()}>
              <RefreshCw size={14} />
              {t("admin.refresh")}
            </Button>
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(["open", "all", "resolved_for_client", "resolved_for_pro", "split", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setSelectedId(null);
                }}
                className="text-sm rounded-full px-3 py-1.5 transition-colors"
                style={{
                  backgroundColor:
                    statusFilter === s
                      ? "rgba(239, 78, 36, 0.12)"
                      : "var(--hm-bg-elevated)",
                  border: `1px solid ${statusFilter === s ? "#EF4E24" : "var(--hm-border-subtle)"}`,
                  color:
                    statusFilter === s ? "#EF4E24" : "var(--hm-text-primary)",
                }}
              >
                {t(`adminDispute.status.${s}`)}
                {s === "open" && list?.openCount ? ` (${list.openCount})` : ""}
              </button>
            ))}
          </div>

          {loading && !list ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner size="md" />
            </div>
          ) : (list?.data.length ?? 0) === 0 ? (
            <Card variant="elevated">
              <CardBody>
                <p
                  className="text-sm text-center py-6"
                  style={{ color: "var(--hm-text-tertiary)" }}
                >
                  {t("adminDispute.empty")}
                </p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
              {/* Queue */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>
                    {t("adminDispute.queueTitle")} ({list?.total ?? 0})
                  </CardTitle>
                </CardHeader>
                <CardBody className="!p-0">
                  <ul>
                    {list?.data.map((d) => (
                      <li key={d._id}>
                        <button
                          onClick={() => setSelectedId(d._id)}
                          className="w-full text-left px-3 py-2.5 transition-colors"
                          style={{
                            backgroundColor:
                              selectedId === d._id
                                ? "rgba(239, 78, 36, 0.08)"
                                : "transparent",
                            borderLeft: `3px solid ${
                              d.status === "open"
                                ? "#EF4E24"
                                : "transparent"
                            }`,
                          }}
                        >
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--hm-text-primary)" }}
                          >
                            {t(`dispute.type.${d.type}`)}
                          </p>
                          <p
                            className="text-xs truncate"
                            style={{ color: "var(--hm-text-tertiary)" }}
                          >
                            {new Date(d.createdAt).toLocaleString()}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>

              {/* Detail */}
              {selectedId && (
                <DisputeDetailPanel
                  disputeId={selectedId}
                  onResolved={() => {
                    setSelectedId(null);
                    void load();
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

// ---- Detail panel (extracted to keep the parent legible) ----

function DisputeDetailPanel({
  disputeId,
  onResolved,
}: {
  disputeId: string;
  onResolved: () => void;
}) {
  const { t } = useLanguage();
  const toast = useToast();

  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState<Resolution>("resolved_for_client");
  const [refundMinor, setRefundMinor] = useState<string>("");
  const [payoutMinor, setPayoutMinor] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<DetailResponse>(
        `/payments/admin/disputes/${disputeId}`,
      );
      setDetail(data);
      // Pre-fill split inputs with 50/50 of held amount as a sensible default.
      const half = Math.floor((data.escrow?.amountHeldMinor ?? 0) / 2);
      setRefundMinor(String(half));
      setPayoutMinor(String((data.escrow?.amountHeldMinor ?? 0) - half));
    } catch (err) {
      console.error("Failed to load dispute detail:", err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("common.somethingWentWrong");
      toast.error(t("common.error"), message);
    } finally {
      setLoading(false);
    }
  }, [disputeId, t, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const formatMinor = (minor: number, currency = "GEL") =>
    `${(minor / 100).toFixed(2)} ${currency}`;

  const submit = useCallback(async () => {
    if (!detail) return;
    setSubmitting(true);
    try {
      const body: {
        resolution: Resolution;
        note?: string;
        refundAmountMinor?: number;
        payoutAmountMinor?: number;
      } = {
        resolution,
        note: note.trim() || undefined,
      };
      if (resolution === "split") {
        body.refundAmountMinor = parseInt(refundMinor, 10) || 0;
        body.payoutAmountMinor = parseInt(payoutMinor, 10) || 0;
      }
      await api.post(`/payments/admin/disputes/${disputeId}/resolve`, body);
      toast.success(t("adminDispute.resolvedToast"));
      onResolved();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("common.error");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [detail, resolution, note, refundMinor, payoutMinor, disputeId, toast, t, onResolved]);

  if (loading) {
    return (
      <Card variant="elevated">
        <CardBody>
          <div className="flex justify-center py-10">
            <LoadingSpinner size="md" />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card variant="elevated">
        <CardBody>
          <Alert variant="error">{t("common.error")}</Alert>
        </CardBody>
      </Card>
    );
  }

  const { dispute, escrow } = detail;
  const heldAmount = escrow?.amountHeldMinor ?? 0;
  const currency = escrow?.currency ?? "GEL";
  const isOpen = dispute.status === "open";
  const splitSum = (parseInt(refundMinor, 10) || 0) + (parseInt(payoutMinor, 10) || 0);
  const splitValid = resolution !== "split" || splitSum === heldAmount;

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>{t(`dispute.type.${dispute.type}`)}</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="space-y-5">
          {/* Status + meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor:
                  dispute.status === "open"
                    ? "rgba(239, 78, 36, 0.12)"
                    : "var(--hm-bg-elevated)",
                color:
                  dispute.status === "open"
                    ? "#EF4E24"
                    : "var(--hm-text-secondary)",
              }}
            >
              {t(`adminDispute.status.${dispute.status}`)}
            </span>
            <span style={{ color: "var(--hm-text-tertiary)" }}>
              {new Date(dispute.createdAt).toLocaleString()}
            </span>
            <Link
              href={`/bookings/${dispute.entityId}`}
              className="inline-flex items-center gap-1 hover:underline"
              style={{ color: "var(--hm-text-secondary)" }}
            >
              {t("adminDispute.viewBooking")}
              <ExternalLink size={12} />
            </Link>
          </div>

          {/* Description */}
          <div>
            <p
              className="text-xs uppercase tracking-wide mb-1"
              style={{ color: "var(--hm-text-tertiary)" }}
            >
              {t("adminDispute.description")}
            </p>
            <p
              className="text-sm whitespace-pre-line"
              style={{ color: "var(--hm-text-primary)" }}
            >
              {dispute.description}
            </p>
          </div>

          {/* Evidence */}
          {dispute.evidenceUrls.length > 0 && (
            <div>
              <p
                className="text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5"
                style={{ color: "var(--hm-text-tertiary)" }}
              >
                <ImageIcon size={12} />
                {t("adminDispute.evidence")} ({dispute.evidenceUrls.length})
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {dispute.evidenceUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-lg overflow-hidden"
                    style={{ border: "1px solid var(--hm-border-subtle)" }}
                  >
                    <Image
                      src={url}
                      alt="evidence"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Escrow context */}
          {escrow && (
            <div
              className="rounded-lg p-3 grid grid-cols-2 gap-3 text-sm"
              style={{ backgroundColor: "var(--hm-bg-elevated)" }}
            >
              <div>
                <p
                  className="text-xs uppercase tracking-wide mb-1"
                  style={{ color: "var(--hm-text-tertiary)" }}
                >
                  {t("adminDispute.amountHeld")}
                </p>
                <p
                  className="text-lg font-semibold"
                  style={{ color: "var(--hm-text-primary)" }}
                >
                  {formatMinor(heldAmount, currency)}
                </p>
              </div>
              <div>
                <p
                  className="text-xs uppercase tracking-wide mb-1"
                  style={{ color: "var(--hm-text-tertiary)" }}
                >
                  {t("adminDispute.escrowStatus")}
                </p>
                <p style={{ color: "var(--hm-text-primary)" }}>{escrow.status}</p>
              </div>
            </div>
          )}

          {/* Past resolution (if already resolved) */}
          {!isOpen && (
            <Alert variant="info">
              <div>
                <p className="font-semibold">
                  {t("adminDispute.alreadyResolvedTitle")}
                </p>
                {dispute.resolution && (
                  <p className="text-sm mt-1">{dispute.resolution}</p>
                )}
                <p className="text-xs mt-2">
                  {t("adminDispute.refundLabel")}:{" "}
                  {formatMinor(dispute.refundAmountMinor, currency)} ·{" "}
                  {t("adminDispute.payoutLabel")}:{" "}
                  {formatMinor(dispute.payoutAmountMinor, currency)}
                </p>
              </div>
            </Alert>
          )}

          {/* Resolution form (only when status === 'open') */}
          {isOpen && (
            <div
              className="pt-5 border-t space-y-4"
              style={{ borderColor: "var(--hm-border-subtle)" }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--hm-text-primary)" }}
              >
                {t("adminDispute.resolveTitle")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ResolutionOption
                  value="resolved_for_client"
                  current={resolution}
                  onSelect={setResolution}
                  icon={<CheckCircle2 size={16} color="rgb(22, 163, 74)" />}
                  label={t("adminDispute.option.resolved_for_client")}
                />
                <ResolutionOption
                  value="resolved_for_pro"
                  current={resolution}
                  onSelect={setResolution}
                  icon={<CheckCircle2 size={16} color="#EF4E24" />}
                  label={t("adminDispute.option.resolved_for_pro")}
                />
                <ResolutionOption
                  value="split"
                  current={resolution}
                  onSelect={setResolution}
                  icon={<Split size={16} color="rgb(202, 138, 4)" />}
                  label={t("adminDispute.option.split")}
                />
                <ResolutionOption
                  value="rejected"
                  current={resolution}
                  onSelect={setResolution}
                  icon={<ShieldOff size={16} color="var(--hm-text-secondary)" />}
                  label={t("adminDispute.option.rejected")}
                />
              </div>

              {resolution === "split" && (() => {
                // Live visual: a single horizontal bar split into the
                // refund (green) and payout (amber) portions in real
                // time as the admin types. Way more intuitive than
                // reading the two number inputs side by side - the
                // admin instantly sees "I'm giving 70% back to the
                // client" without doing the math.
                const refundPct = heldAmount > 0 ? Math.min(100, (Number(refundMinor) / heldAmount) * 100) : 0;
                const payoutPct = heldAmount > 0 ? Math.min(100, (Number(payoutMinor) / heldAmount) * 100) : 0;
                const overflow = refundPct + payoutPct > 100;
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5"
                          style={{ color: "var(--hm-fg-muted)" }}
                        >
                          {t("adminDispute.refundAmountMinor")}
                        </label>
                        <Input
                          type="number"
                          value={refundMinor}
                          onChange={(e) => setRefundMinor(e.target.value)}
                          min="0"
                          max={heldAmount}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5"
                          style={{ color: "var(--hm-fg-muted)" }}
                        >
                          {t("adminDispute.payoutAmountMinor")}
                        </label>
                        <Input
                          type="number"
                          value={payoutMinor}
                          onChange={(e) => setPayoutMinor(e.target.value)}
                          min="0"
                          max={heldAmount}
                        />
                      </div>
                    </div>

                    {/* Visual split bar */}
                    <div
                      className="relative h-2.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: "var(--hm-bg-tertiary)" }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 transition-all"
                        style={{
                          width: `${refundPct}%`,
                          background:
                            "linear-gradient(180deg, rgb(34,197,94) 0%, rgb(22,163,74) 100%)",
                        }}
                        aria-hidden="true"
                      />
                      <div
                        className="absolute inset-y-0 transition-all"
                        style={{
                          left: `${refundPct}%`,
                          width: `${payoutPct}%`,
                          background:
                            "linear-gradient(180deg, rgb(245,158,11) 0%, rgb(202,138,4) 100%)",
                        }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex justify-between text-[10.5px] font-semibold uppercase tracking-wide">
                      <span style={{ color: "rgb(22,163,74)" }}>
                        ↤ {t("cancel.refundLabel")} {refundPct.toFixed(0)}%
                      </span>
                      <span style={{ color: "rgb(180,83,9)" }}>
                        {t("cancel.payoutLabel")} {payoutPct.toFixed(0)}% ↦
                      </span>
                    </div>

                    {/* Validation - subtle when valid, alert-level when not */}
                    {splitValid ? (
                      <p
                        className="text-xs flex items-center gap-1.5"
                        style={{ color: "rgb(22,163,74)" }}
                      >
                        <CheckCircle2 size={12} />
                        {t("adminDispute.splitMustSum", {
                          total: formatMinor(heldAmount, currency),
                          sum: formatMinor(splitSum, currency),
                        })}
                      </p>
                    ) : (
                      <Alert variant={overflow ? "error" : "warning"} size="sm">
                        {t("adminDispute.splitMustSum", {
                          total: formatMinor(heldAmount, currency),
                          sum: formatMinor(splitSum, currency),
                        })}
                      </Alert>
                    )}
                  </div>
                );
              })()}

              <div>
                <label
                  className="block text-xs uppercase tracking-wide mb-1"
                  style={{ color: "var(--hm-text-tertiary)" }}
                >
                  {t("adminDispute.noteLabel")}
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("adminDispute.notePlaceholder")}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <Button
                variant="default"
                className="w-full"
                onClick={submit}
                disabled={submitting || !splitValid}
                loading={submitting}
              >
                {t("adminDispute.applyResolution")}
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function ResolutionOption({
  value,
  current,
  onSelect,
  icon,
  label,
}: {
  value: Resolution;
  current: Resolution;
  onSelect: (v: Resolution) => void;
  icon: React.ReactNode;
  label: string;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`text-left rounded-xl px-3 py-3 text-sm flex items-center gap-2.5 transition-all duration-150 ${
        selected ? "-translate-y-[1px]" : "hover:-translate-y-[1px] hover:shadow-sm"
      }`}
      style={
        selected
          ? {
              background:
                "linear-gradient(180deg, rgba(239,78,36,0.12) 0%, rgba(239,78,36,0.04) 100%)",
              border: "1px solid rgba(239,78,36,0.45)",
              color: "#EF4E24",
              boxShadow:
                "0 4px 10px -2px rgba(239,78,36,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
            }
          : {
              backgroundColor: "var(--hm-bg-elevated)",
              border: "1px solid var(--hm-border-subtle)",
              color: "var(--hm-fg-primary)",
              boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
            }
      }
      aria-pressed={selected}
    >
      {/* Small radio-style indicator for tactile "I picked this one"
          affordance, same pattern as the dispute-type picker. */}
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-full shrink-0 transition-all"
        style={{
          backgroundColor: selected ? "#EF4E24" : "transparent",
          border: `2px solid ${selected ? "#EF4E24" : "var(--hm-border)"}`,
        }}
      >
        {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
      <span className="shrink-0">{icon}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}
