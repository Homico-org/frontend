"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Select from "@/components/common/Select";
import { ConfirmModal } from "@/components/ui/Modal";
import { ADMIN_THEME as THEME } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Database,
  Eye,
  Loader2,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Star,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// -----------------------------------------------------------------------------
// Types matching the /analytics/* endpoints
// -----------------------------------------------------------------------------

interface OverviewRow {
  event: string;
  count: number;
}

interface SummaryRow {
  target: string;
  label: string;
  count: number;
}

interface FunnelRow {
  step: string;
  count: number;
}

// -----------------------------------------------------------------------------
// Event metadata table. Maps the raw event name (from the analytics_events
// collection) to the icon + i18n label key the dashboard renders. Keep this
// the single source of truth for event presentation - the tile grid, funnel
// section, and top-N headers all index into it.
// -----------------------------------------------------------------------------

const EVENT_META: Record<
  string,
  { icon: typeof Eye; i18nKey: string; color: string }
> = {
  profile_view: { icon: Eye, i18nKey: "adminAnalytics.events.profileView", color: THEME.info },
  contact_reveal: { icon: Phone, i18nKey: "adminAnalytics.events.contactReveal", color: THEME.success },
  phone_click: { icon: Phone, i18nKey: "adminAnalytics.events.phoneClick", color: THEME.success },
  whatsapp_click: { icon: MessageSquare, i18nKey: "adminAnalytics.events.whatsappClick", color: "#25D366" },
  job_view: { icon: BarChart3, i18nKey: "adminAnalytics.events.jobView", color: THEME.info },
  job_search: { icon: Sparkles, i18nKey: "adminAnalytics.events.jobSearch", color: THEME.warning },
  proposal_submit: { icon: Send, i18nKey: "adminAnalytics.events.proposalSubmit", color: THEME.info },
  proposal_accepted: { icon: CheckCircle2, i18nKey: "adminAnalytics.events.proposalAccepted", color: THEME.success },
  booking_created: { icon: TrendingUp, i18nKey: "adminAnalytics.events.bookingCreated", color: THEME.info },
  booking_payment_confirmed: { icon: Wallet, i18nKey: "adminAnalytics.events.bookingPaymentConfirmed", color: THEME.success },
  booking_started: { icon: TrendingUp, i18nKey: "adminAnalytics.events.bookingStarted", color: THEME.info },
  booking_completed: { icon: CheckCircle2, i18nKey: "adminAnalytics.events.bookingCompleted", color: THEME.success },
  booking_cancelled: { icon: BarChart3, i18nKey: "adminAnalytics.events.bookingCancelled", color: THEME.error },
  review_submit: { icon: Star, i18nKey: "adminAnalytics.events.reviewSubmit", color: THEME.warning },
  register_pro: { icon: UserPlus, i18nKey: "adminAnalytics.events.registerPro", color: THEME.primary },
  register_client: { icon: UserPlus, i18nKey: "adminAnalytics.events.registerClient", color: THEME.info },
};

// Overview tile grid - 8 events the founder cares about most. Order matters
// for visual scanning (top row = traffic + intent; bottom row = money + retention).
const OVERVIEW_TILES: string[] = [
  "profile_view",
  "contact_reveal",
  "job_view",
  "proposal_submit",
  "booking_payment_confirmed",
  "booking_completed",
  "review_submit",
  "register_pro",
];

type DaysFilter = "7d" | "30d" | "90d";

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

function AdminAnalyticsPageContent() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const router = useRouter();

  const [days, setDays] = useState<DaysFilter>("7d");
  const [overview, setOverview] = useState<OverviewRow[]>([]);
  const [clientFunnel, setClientFunnel] = useState<FunnelRow[]>([]);
  const [proFunnel, setProFunnel] = useState<FunnelRow[]>([]);
  const [topProsByContact, setTopProsByContact] = useState<SummaryRow[]>([]);
  const [topProsByView, setTopProsByView] = useState<SummaryRow[]>([]);
  const [topJobsByView, setTopJobsByView] = useState<SummaryRow[]>([]);
  const [topCategoriesBySearch, setTopCategoriesBySearch] = useState<SummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  // Backfill state - one-shot historical event seeding from the existing
  // Booking / Proposal / Review / User collections. Confirms before running
  // because it touches the analytics_events collection (though idempotent).
  const [backfillModalOpen, setBackfillModalOpen] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);

  const daysNum = useMemo(() => parseInt(days, 10), [days]);

  const fetchAll = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setIsLoading(true);
      const q = `?days=${daysNum}`;
      const [
        overviewRes,
        clientFunnelRes,
        proFunnelRes,
        topContactRes,
        topViewRes,
        topJobRes,
        topCatRes,
      ] = await Promise.all([
        api.get<OverviewRow[]>(`/analytics/overview${q}`),
        api.get<FunnelRow[]>(`/analytics/funnel${q}&kind=client`),
        api.get<FunnelRow[]>(`/analytics/funnel${q}&kind=pro`),
        api.get<SummaryRow[]>(`/analytics/summary?event=contact_reveal&days=${daysNum}&limit=10`),
        api.get<SummaryRow[]>(`/analytics/summary?event=profile_view&days=${daysNum}&limit=10`),
        api.get<SummaryRow[]>(`/analytics/summary?event=job_view&days=${daysNum}&limit=10`),
        api.get<SummaryRow[]>(`/analytics/summary?event=category_select&days=${daysNum}&limit=10`),
      ]);
      setOverview(overviewRes.data || []);
      setClientFunnel(clientFunnelRes.data || []);
      setProFunnel(proFunnelRes.data || []);
      setTopProsByContact(topContactRes.data || []);
      setTopProsByView(topViewRes.data || []);
      setTopJobsByView(topJobRes.data || []);
      setTopCategoriesBySearch(topCatRes.data || []);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      toast.error(t("adminAnalytics.loadFailed"));
    } finally {
      hasLoadedRef.current = true;
      setIsLoading(false);
    }
    // `t` and `toast` are stable, daysNum changes trigger refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysNum]);

  useEffect(() => {
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated, fetchAll]);

  const handleBackfill = useCallback(async () => {
    setIsBackfilling(true);
    try {
      const res = await api.post<{ totalRowsWritten: number }>("/analytics/backfill");
      const written = res.data?.totalRowsWritten ?? 0;
      toast.success(t("adminAnalytics.backfillSuccess", { count: written }));
      setBackfillModalOpen(false);
      // Refresh the dashboard so the backfilled counts show up immediately.
      await fetchAll();
    } catch (err) {
      console.error("Backfill failed:", err);
      toast.error(t("adminAnalytics.backfillFailed"));
    } finally {
      setIsBackfilling(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAll]);

  // Counts indexed by event for quick lookup in the overview tile grid.
  const countsByEvent = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of overview) map[row.event] = row.count;
    return map;
  }, [overview]);

  // Formatter: 8000 -> "8 000" per the Homico convention (space thousand-sep).
  const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");

  return (
    <div className="min-h-screen" style={{ background: THEME.surface }}>
      {/* Header - translucent + blur matches the activity-logs / reports
          admin convention so the header reads as page chrome rather than
          a sibling card. */}
      <div
        className="sticky top-0 z-10 backdrop-blur-xl"
        style={{
          background: `${THEME.surface}E6`,
          borderBottom: `1px solid ${THEME.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ background: THEME.surfaceLight }}
            aria-label={t("common.back")}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: THEME.text }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-semibold truncate" style={{ color: THEME.text }}>
              {t("adminAnalytics.title")}
            </h1>
            <p className="text-xs hidden sm:block" style={{ color: THEME.textDim }}>
              {t("adminAnalytics.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBackfillModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              background: THEME.surfaceLight,
              color: THEME.textMuted,
              border: `1px solid ${THEME.border}`,
            }}
            title={t("adminAnalytics.backfillDescription")}
          >
            <Database className="w-3.5 h-3.5" />
            {t("adminAnalytics.backfill")}
          </button>
          <div className="w-36">
            <Select
              value={days}
              onChange={(v) => setDays(v as DaysFilter)}
              options={[
                { value: "7d", label: t("adminAnalytics.last7Days") },
                { value: "30d", label: t("adminAnalytics.last30Days") },
                { value: "90d", label: t("adminAnalytics.last90Days") },
              ]}
              size="sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: THEME.primary }} />
          </div>
        ) : (
          <>
            {/* Overview tiles */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: THEME.textDim }}>
                {t("adminAnalytics.overview")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {OVERVIEW_TILES.map((event) => {
                  const meta = EVENT_META[event];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  const count = countsByEvent[event] ?? 0;
                  return (
                    <div
                      key={event}
                      className="rounded-xl p-3 sm:p-4"
                      style={{
                        background: THEME.surfaceLight,
                        border: `1px solid ${THEME.border}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <div
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center"
                          style={{ background: `${meta.color}20`, color: meta.color }}
                        >
                          <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </div>
                        <p className="text-[10px] sm:text-xs font-medium truncate" style={{ color: THEME.textDim }}>
                          {t(meta.i18nKey)}
                        </p>
                      </div>
                      <p className="text-lg sm:text-2xl font-semibold tabular-nums" style={{ color: THEME.text }}>
                        {fmt(count)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Funnels */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <FunnelBlock
                title={t("adminAnalytics.funnelClient")}
                rows={clientFunnel}
                fmt={fmt}
                t={t}
              />
              <FunnelBlock
                title={t("adminAnalytics.funnelPro")}
                rows={proFunnel}
                fmt={fmt}
                t={t}
              />
            </section>

            {/* Top-N */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <TopList
                title={t("adminAnalytics.topProsByContact")}
                rows={topProsByContact}
                fmt={fmt}
                emptyLabel={t("adminAnalytics.noData")}
                hrefPrefix="/ge/professionals/"
              />
              <TopList
                title={t("adminAnalytics.topProsByView")}
                rows={topProsByView}
                fmt={fmt}
                emptyLabel={t("adminAnalytics.noData")}
                hrefPrefix="/ge/professionals/"
              />
              <TopList
                title={t("adminAnalytics.topJobsByView")}
                rows={topJobsByView}
                fmt={fmt}
                emptyLabel={t("adminAnalytics.noData")}
                hrefPrefix="/ge/jobs/"
              />
              <TopList
                title={t("adminAnalytics.topCategoriesBySearch")}
                rows={topCategoriesBySearch}
                fmt={fmt}
                emptyLabel={t("adminAnalytics.noData")}
              />
            </section>

            {/* Other events not in the headline tile grid - shown as a flat
                list so the founder can spot anything missed. */}
            {overview.length > OVERVIEW_TILES.length && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: THEME.textDim }}>
                  {t("adminAnalytics.otherEvents")}
                </h2>
                <div
                  className="rounded-xl divide-y"
                  style={{
                    background: THEME.surfaceLight,
                    border: `1px solid ${THEME.border}`,
                    // Tailwind's `divide-` needs the children's border color
                    // to be explicit when using inline THEME colors.
                  }}
                >
                  {overview
                    .filter((row) => !OVERVIEW_TILES.includes(row.event))
                    .map((row) => {
                      const meta = EVENT_META[row.event];
                      const label = meta ? t(meta.i18nKey) : row.event;
                      return (
                        <div
                          key={row.event}
                          className="flex items-center justify-between px-4 py-2.5"
                          style={{ borderColor: THEME.border }}
                        >
                          <span className="text-sm" style={{ color: THEME.text }}>
                            {label}
                          </span>
                          <span className="text-sm font-semibold tabular-nums" style={{ color: THEME.textDim }}>
                            {fmt(row.count)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={backfillModalOpen}
        onClose={() => !isBackfilling && setBackfillModalOpen(false)}
        onConfirm={handleBackfill}
        title={t("adminAnalytics.backfill")}
        description={t("adminAnalytics.backfillDescription")}
        icon={<Database className="w-6 h-6" style={{ color: THEME.info }} />}
        variant="info"
        cancelLabel={t("common.cancel")}
        confirmLabel={t("adminAnalytics.backfillRun")}
        isLoading={isBackfilling}
        loadingLabel={t("adminAnalytics.backfillRunning")}
        confirmIcon={<Database className="w-4 h-4" />}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// FunnelBlock - one column of step rows with horizontal bars. Each bar width
// is proportional to the funnel's MAX (so step 1 is full-width and you can
// eyeball drop-off step by step).
// -----------------------------------------------------------------------------

function FunnelBlock({
  title,
  rows,
  fmt,
  t,
}: {
  title: string;
  rows: FunnelRow[];
  fmt: (n: number) => string;
  t: (key: string) => string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: THEME.surfaceLight,
        border: `1px solid ${THEME.border}`,
      }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: THEME.text }}>
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-xs py-4 text-center" style={{ color: THEME.textDim }}>
          {t("adminAnalytics.noData")}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const meta = EVENT_META[row.step];
            const label = meta ? t(meta.i18nKey) : row.step;
            const widthPct = (row.count / max) * 100;
            return (
              <div key={row.step}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: THEME.text }}>{label}</span>
                  <span className="tabular-nums" style={{ color: THEME.textDim }}>
                    {fmt(row.count)}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: THEME.surface }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${widthPct}%`,
                      background: meta?.color ?? THEME.primary,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// TopList - ranked list. Each row links to the entity (pro/job/category) so
// the founder can drill in.
// -----------------------------------------------------------------------------

function TopList({
  title,
  rows,
  fmt,
  emptyLabel,
  hrefPrefix,
}: {
  title: string;
  rows: SummaryRow[];
  fmt: (n: number) => string;
  emptyLabel: string;
  hrefPrefix?: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: THEME.surfaceLight,
        border: `1px solid ${THEME.border}`,
      }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: THEME.text }}>
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-xs py-4 text-center" style={{ color: THEME.textDim }}>
          {emptyLabel}
        </p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((row, i) => {
            const display = row.label?.trim() || row.target;
            const content = (
              <>
                <span
                  className="w-5 text-[10px] font-semibold tabular-nums"
                  style={{ color: THEME.textDim }}
                >
                  {i + 1}.
                </span>
                <span
                  className="flex-1 text-sm truncate"
                  style={{ color: THEME.text }}
                  title={display}
                >
                  {display}
                </span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: THEME.text }}>
                  {fmt(row.count)}
                </span>
              </>
            );
            return (
              <li key={`${row.target}-${i}`}>
                {hrefPrefix && row.target && row.target.length === 24 ? (
                  <a
                    href={`${hrefPrefix}${row.target}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ background: "transparent" }}
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  >
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminAnalyticsPageContent />
    </AuthGuard>
  );
}
