"use client";

import AuthGuard from "@/components/common/AuthGuard";
import BackButton from "@/components/common/BackButton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import {
  CheckCircle2,
  Lightbulb,
  Phone,
  RefreshCw,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Status = "pending" | "approved" | "rejected";

interface Suggestion {
  _id: string;
  serviceName: string;
  description: string;
  suggestedCategoryKey?: string;
  suggestedPrice?: number;
  suggestedUnit?: string;
  photoUrl?: string;
  requestedByUserId: string;
  requestedByName: string;
  requestedByPhone: string;
  requestedByEmail?: string;
  requestedByUid?: number;
  locale?: string;
  status: Status;
  reviewerNote?: string;
  reviewedAt?: string;
  createdAt: string;
}

interface ListResponse {
  data: Suggestion[];
  total: number;
  pendingCount: number;
  page: number;
  limit: number;
}

/**
 * Admin review queue for pro-submitted catalog suggestions. Each item
 * has the pro's name + phone (so admin can call before deciding), the
 * requested service info, an optional photo, and a one-click Approve /
 * Reject with an optional internal note.
 *
 * "Approve" today just flips status - it doesn't auto-add the service
 * to the catalog (that happens manually via /admin/service-catalog after
 * decision). Future: we could wire approval to a service-catalog draft.
 */
export default function AdminCatalogSuggestionsPage() {
  const { t } = useLanguage();
  const toast = useToast();

  const [list, setList] = useState<ListResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const { data } = await api.get<ListResponse>(
        `/catalog-suggestions?${params.toString()}`,
      );
      setList(data);
    } catch (err) {
      console.error("Failed to load catalog suggestions:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = useCallback(
    async (id: string, status: "approved" | "rejected") => {
      setActionLoading(id);
      try {
        await api.patch(`/catalog-suggestions/${id}/status`, {
          status,
          reviewerNote: notes[id]?.trim() || undefined,
        });
        toast.success(
          status === "approved"
            ? t("adminCatalogSuggestion.approvedToast")
            : t("adminCatalogSuggestion.rejectedToast"),
        );
        await load();
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? t("common.error");
        toast.error(msg);
      } finally {
        setActionLoading(null);
      }
    },
    [notes, toast, t, load],
  );

  const formatPrice = (price?: number, unit?: string) => {
    if (price === undefined) return null;
    return `${price.toFixed(2)} GEL ${unit ? `(${t(`catalogRequest.unit.${unit}`) ?? unit})` : ""}`;
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div
        className="min-h-screen px-3 py-5 sm:px-6 sm:py-8"
        style={{ backgroundColor: "var(--hm-bg-page)" }}
      >
        <div className="max-w-5xl mx-auto">
          <BackButton href="/admin" variant="minimal" label={t("common.back")} className="mb-4" />

          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h1
                className="text-2xl font-semibold flex items-center gap-2"
                style={{ color: "var(--hm-text-primary)" }}
              >
                <Lightbulb size={22} color="#A855F7" />
                {t("adminCatalogSuggestion.title")}
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--hm-text-secondary)" }}
              >
                {t("adminCatalogSuggestion.subtitle")}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void load()}>
              <RefreshCw size={14} />
              {t("admin.refresh")}
            </Button>
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(["pending", "all", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="text-sm rounded-full px-3 py-1.5 transition-colors"
                style={{
                  backgroundColor:
                    statusFilter === s
                      ? "rgba(168, 85, 247, 0.12)"
                      : "var(--hm-bg-elevated)",
                  border: `1px solid ${statusFilter === s ? "#A855F7" : "var(--hm-border-subtle)"}`,
                  color:
                    statusFilter === s ? "#A855F7" : "var(--hm-text-primary)",
                }}
              >
                {t(`adminCatalogSuggestion.status.${s}`)}
                {s === "pending" && list?.pendingCount
                  ? ` (${list.pendingCount})`
                  : ""}
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
                  {t("adminCatalogSuggestion.empty")}
                </p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {list?.data.map((s) => (
                <Card key={s._id} variant="elevated">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle>{s.serviceName}</CardTitle>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--hm-text-tertiary)" }}
                        >
                          {new Date(s.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor:
                            s.status === "pending"
                              ? "rgba(168, 85, 247, 0.12)"
                              : s.status === "approved"
                                ? "rgba(22, 163, 74, 0.12)"
                                : "rgba(239, 68, 68, 0.12)",
                          color:
                            s.status === "pending"
                              ? "#A855F7"
                              : s.status === "approved"
                                ? "rgb(22, 163, 74)"
                                : "rgb(220, 38, 38)",
                        }}
                      >
                        {t(`adminCatalogSuggestion.status.${s.status}`)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      {/* Pro identity - prominent because admin needs it
                          to call/verify before deciding */}
                      <div
                        className="rounded-lg p-3 flex items-start justify-between gap-3"
                        style={{ backgroundColor: "var(--hm-bg-elevated)" }}
                      >
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "var(--hm-text-primary)" }}
                          >
                            {s.requestedByName}
                            {s.requestedByUid && (
                              <span
                                className="ml-2 text-xs font-mono font-normal"
                                style={{ color: "var(--hm-text-tertiary)" }}
                              >
                                #{s.requestedByUid}
                              </span>
                            )}
                          </p>
                          {s.requestedByEmail && (
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: "var(--hm-text-tertiary)" }}
                            >
                              {s.requestedByEmail}
                            </p>
                          )}
                        </div>
                        <a
                          href={`tel:${s.requestedByPhone}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                          style={{
                            backgroundColor: "var(--hm-brand-500)",
                            color: "white",
                          }}
                        >
                          <Phone size={14} />
                          {s.requestedByPhone}
                        </a>
                      </div>

                      {/* Description */}
                      <div>
                        <p
                          className="text-xs uppercase tracking-wide mb-1"
                          style={{ color: "var(--hm-text-tertiary)" }}
                        >
                          {t("adminCatalogSuggestion.description")}
                        </p>
                        <p
                          className="text-sm whitespace-pre-line"
                          style={{ color: "var(--hm-text-primary)" }}
                        >
                          {s.description}
                        </p>
                      </div>

                      {/* Hints row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p
                            className="text-xs uppercase tracking-wide mb-0.5"
                            style={{ color: "var(--hm-text-tertiary)" }}
                          >
                            {t("adminCatalogSuggestion.category")}
                          </p>
                          <p style={{ color: "var(--hm-text-primary)" }}>
                            {s.suggestedCategoryKey ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs uppercase tracking-wide mb-0.5"
                            style={{ color: "var(--hm-text-tertiary)" }}
                          >
                            {t("adminCatalogSuggestion.price")}
                          </p>
                          <p style={{ color: "var(--hm-text-primary)" }}>
                            {formatPrice(s.suggestedPrice, s.suggestedUnit) ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs uppercase tracking-wide mb-0.5"
                            style={{ color: "var(--hm-text-tertiary)" }}
                          >
                            {t("adminCatalogSuggestion.locale")}
                          </p>
                          <p style={{ color: "var(--hm-text-primary)" }}>
                            {s.locale ?? "-"}
                          </p>
                        </div>
                      </div>

                      {/* Photo */}
                      {s.photoUrl && (
                        <div>
                          <p
                            className="text-xs uppercase tracking-wide mb-1.5"
                            style={{ color: "var(--hm-text-tertiary)" }}
                          >
                            {t("adminCatalogSuggestion.photo")}
                          </p>
                          <a
                            href={s.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative inline-block w-32 h-32 rounded-lg overflow-hidden"
                            style={{ border: "1px solid var(--hm-border-subtle)" }}
                          >
                            <Image
                              src={s.photoUrl}
                              alt="suggestion"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </a>
                        </div>
                      )}

                      {/* Past reviewer note (read-only when already reviewed) */}
                      {s.status !== "pending" && s.reviewerNote && (
                        <Alert variant="info">
                          <p className="text-xs font-semibold mb-1">
                            {t("adminCatalogSuggestion.reviewerNote")}:
                          </p>
                          <p className="text-sm">{s.reviewerNote}</p>
                        </Alert>
                      )}

                      {/* Action row - only for pending */}
                      {s.status === "pending" && (
                        <div
                          className="pt-4 border-t space-y-3"
                          style={{ borderColor: "var(--hm-border-subtle)" }}
                        >
                          <div>
                            <label
                              className="block text-xs uppercase tracking-wide mb-1"
                              style={{ color: "var(--hm-text-tertiary)" }}
                            >
                              {t("adminCatalogSuggestion.noteLabel")}
                            </label>
                            <Textarea
                              value={notes[s._id] ?? ""}
                              onChange={(e) =>
                                setNotes((prev) => ({
                                  ...prev,
                                  [s._id]: e.target.value,
                                }))
                              }
                              placeholder={t("adminCatalogSuggestion.notePlaceholder")}
                              rows={2}
                              maxLength={500}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="destructive"
                              onClick={() => updateStatus(s._id, "rejected")}
                              disabled={actionLoading === s._id}
                            >
                              <XCircle size={16} />
                              {t("adminCatalogSuggestion.reject")}
                            </Button>
                            <Button
                              variant="success"
                              onClick={() => updateStatus(s._id, "approved")}
                              disabled={actionLoading === s._id}
                              loading={actionLoading === s._id}
                            >
                              <CheckCircle2 size={16} />
                              {t("adminCatalogSuggestion.approve")}
                            </Button>
                          </div>
                          <p
                            className="text-xs"
                            style={{ color: "var(--hm-text-tertiary)" }}
                          >
                            {t("adminCatalogSuggestion.approveHint")}
                          </p>
                        </div>
                      )}
                    </div>
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
