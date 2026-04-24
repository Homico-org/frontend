"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Header, { HeaderSpacer } from "@/components/common/Header";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { formatDateTimeShort } from "@/utils/dateUtils";
import {
  Calendar,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ServiceRequestStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "booked"
  | "dropped";

type Timing = "asap" | "this_week" | "flexible";

interface ServiceRequest {
  _id: string;
  category: string;
  subcategory?: string;
  description: string;
  cityKey: string;
  address?: string;
  timing: Timing;
  name: string;
  phone: string;
  email?: string;
  locale?: string;
  status: ServiceRequestStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Counts {
  new: number;
  contacted: number;
  quoted: number;
  booked: number;
  dropped: number;
}

interface ListResponse {
  items: ServiceRequest[];
  total: number;
  counts: Counts;
}

type StatusFilter = "all" | ServiceRequestStatus;

const STATUS_ORDER: ServiceRequestStatus[] = [
  "new",
  "contacted",
  "quoted",
  "booked",
  "dropped",
];

function statusColor(s: ServiceRequestStatus): {
  bg: string;
  fg: string;
} {
  switch (s) {
    case "new":
      return { bg: "var(--hm-info-50)", fg: "var(--hm-info-500)" };
    case "contacted":
      return { bg: "var(--hm-warning-50)", fg: "var(--hm-warning-500)" };
    case "quoted":
      return { bg: "var(--hm-brand-50)", fg: "var(--hm-brand-500)" };
    case "booked":
      return { bg: "var(--hm-success-50)", fg: "var(--hm-success-500)" };
    case "dropped":
      return { bg: "var(--hm-bg-tertiary)", fg: "var(--hm-fg-muted)" };
  }
}

function timingIcon(t: Timing): React.ReactElement {
  if (t === "asap") return <Sparkles className="w-3.5 h-3.5" />;
  if (t === "this_week") return <Clock className="w-3.5 h-3.5" />;
  return <Calendar className="w-3.5 h-3.5" />;
}

function timingLabel(t: Timing, tr: (k: string) => string): string {
  if (t === "asap") return tr("concierge.timingAsap");
  if (t === "this_week") return tr("concierge.timingThisWeek");
  return tr("concierge.timingFlexible");
}

function AdminRequestsPageContent(): React.ReactElement {
  const { t, locale } = useLanguage();
  const toast = useToast();

  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [counts, setCounts] = useState<Counts>({
    new: 0,
    contacted: 0,
    quoted: 0,
    booked: 0,
    dropped: 0,
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(
    async (showRefresh = false): Promise<void> => {
      if (showRefresh) setIsRefreshing(true);
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (statusFilter !== "all") params.set("status", statusFilter);
        const res = await api.get<ListResponse>(
          `/service-requests?${params.toString()}`,
        );
        setItems(res.data.items);
        setCounts(res.data.counts);
      } catch (err) {
        toast.error(
          (err as Error)?.message ?? t("common.somethingWentWrong"),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [statusFilter, toast, t],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function updateStatus(
    id: string,
    status: ServiceRequestStatus,
  ): Promise<void> {
    setUpdatingId(id);
    try {
      await api.patch(`/service-requests/${id}/status`, { status });
      toast.success(t("common.saved"));
      await fetchData();
    } catch (err) {
      toast.error((err as Error)?.message ?? t("common.somethingWentWrong"));
    } finally {
      setUpdatingId(null);
    }
  }

  const totalVisible =
    statusFilter === "all"
      ? Object.values(counts).reduce((a, b) => a + b, 0)
      : counts[statusFilter];

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)] tracking-tight">
              {t("adminRequests.title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--hm-fg-muted)]">
              {t("adminRequests.subtitle")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {t("common.refresh")}
          </Button>
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <FilterPill
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            label={t("common.all")}
            count={Object.values(counts).reduce((a, b) => a + b, 0)}
          />
          {STATUS_ORDER.map((s) => (
            <FilterPill
              key={s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              label={t(`adminRequests.status.${s}`)}
              count={counts[s]}
              color={statusColor(s)}
            />
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--hm-fg-muted)]">
              {t("adminRequests.empty")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((req) => (
              <RequestCard
                key={req._id}
                req={req}
                isUpdating={updatingId === req._id}
                onStatusChange={(s) => updateStatus(req._id, s)}
                t={t}
                locale={locale}
              />
            ))}
            <p className="text-xs text-[var(--hm-fg-muted)] text-center pt-4">
              {t("adminRequests.showing")} {items.length} {t("common.of")}{" "}
              {totalVisible}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: { bg: string; fg: string };
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[13px] font-medium transition-colors border"
      style={{
        backgroundColor: active
          ? color?.bg || "var(--hm-brand-500)"
          : "transparent",
        color: active
          ? color?.fg || "white"
          : "var(--hm-fg-secondary)",
        borderColor: active
          ? color?.fg || "var(--hm-brand-500)"
          : "var(--hm-border-subtle)",
      }}
    >
      {label}
      <span
        className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[11px] font-semibold"
        style={{
          backgroundColor: active
            ? "color-mix(in srgb, currentColor 15%, transparent)"
            : "var(--hm-bg-tertiary)",
        }}
      >
        {count}
      </span>
    </button>
  );
}

function RequestCard({
  req,
  isUpdating,
  onStatusChange,
  t,
  locale,
}: {
  req: ServiceRequest;
  isUpdating: boolean;
  onStatusChange: (s: ServiceRequestStatus) => void;
  t: (key: string) => string;
  locale: "en" | "ka" | "ru";
}): React.ReactElement {
  const c = statusColor(req.status);
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 border"
      style={{
        backgroundColor: "var(--hm-bg-elevated)",
        borderColor: "var(--hm-border-subtle)",
      }}
    >
      {/* Header row: name + phone + status */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--hm-bg-tertiary)]">
            <UserIcon className="w-4 h-4 text-[var(--hm-fg-secondary)]" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--hm-fg-primary)] truncate">
              {req.name}
            </p>
            <p className="text-[12px] text-[var(--hm-fg-muted)]">
              {formatDateTimeShort(req.createdAt, locale)}
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: c.bg, color: c.fg }}
        >
          {t(`adminRequests.status.${req.status}`)}
        </span>
      </div>

      {/* Body: category + description + address + timing + contact */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--hm-fg-muted)] mb-1">
            {t("adminRequests.field.category")}
          </p>
          <p className="text-sm text-[var(--hm-fg-primary)]">
            {req.category}
            {req.subcategory ? ` / ${req.subcategory}` : ""}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--hm-fg-muted)] mb-1">
            {t("adminRequests.field.timing")}
          </p>
          <p className="inline-flex items-center gap-1.5 text-sm text-[var(--hm-fg-primary)]">
            {timingIcon(req.timing)}
            {timingLabel(req.timing, t)}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-[10px] uppercase tracking-wider text-[var(--hm-fg-muted)] mb-1">
            {t("adminRequests.field.description")}
          </p>
          <p className="text-sm text-[var(--hm-fg-primary)] whitespace-pre-wrap">
            {req.description}
          </p>
        </div>
        {req.address && (
          <div className="sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--hm-fg-muted)] mb-1">
              {t("adminRequests.field.address")}
            </p>
            <p className="inline-flex items-center gap-1.5 text-sm text-[var(--hm-fg-primary)]">
              <MapPin className="w-3.5 h-3.5 text-[var(--hm-fg-muted)]" />
              {req.address}
            </p>
          </div>
        )}
      </div>

      {/* Contact + actions */}
      <div className="mt-4 pt-4 border-t border-[var(--hm-border-subtle)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <a
            href={`tel:${req.phone}`}
            className="inline-flex items-center gap-1.5 text-[var(--hm-fg-primary)] hover:text-[var(--hm-brand-500)] transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            {req.phone}
          </a>
          {req.email && (
            <a
              href={`mailto:${req.email}`}
              className="inline-flex items-center gap-1.5 text-[var(--hm-fg-primary)] hover:text-[var(--hm-brand-500)] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              {req.email}
            </a>
          )}
          <a
            href={`https://wa.me/${req.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[var(--hm-fg-primary)] hover:text-[var(--hm-brand-500)] transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        </div>

        {/* Status changer */}
        <select
          value={req.status}
          onChange={(e) =>
            onStatusChange(e.target.value as ServiceRequestStatus)
          }
          disabled={isUpdating}
          className="h-9 px-3 rounded-lg text-sm font-medium border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40"
          style={{
            backgroundColor: "var(--hm-bg-elevated)",
            borderColor: "var(--hm-border)",
            color: "var(--hm-fg-primary)",
          }}
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {t(`adminRequests.status.${s}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function AdminRequestsPage(): React.ReactElement {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminRequestsPageContent />
    </AuthGuard>
  );
}
