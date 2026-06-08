"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Select from "@/components/common/Select";
import { ADMIN_THEME as THEME } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface FunnelData {
  days: number;
  country: string;
  counts: {
    jobsPosted: number;
    withProposal: number;
    firstProposalIn24h: number;
    hired: number;
    completed: number;
    reviewed: number;
  };
  rates: {
    proposalIn24hRate: number;
    anyProposalRate: number;
    hireRate: number;
    completionRate: number;
    reviewRate: number;
  };
  avgHoursToFirstProposal: number | null;
  byCategory: SegRow[];
  byCountry: SegRow[];
}

interface SegRow {
  key: string;
  jobsPosted: number;
  withProposal: number;
  hired: number;
  anyProposalRate: number;
  proposalIn24hRate: number;
  hireRate: number;
}

function AdminFunnelContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const [days, setDays] = useState("30");
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<FunnelData>(`/admin/funnel?days=${days}`)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);
  useEffect(() => {
    load();
  }, [load]);

  const c = data?.counts;
  const r = data?.rates;
  const posted = c?.jobsPosted ?? 0;

  const stages = c
    ? [
        { key: "posted", label: t("adminFunnel.stages.posted"), count: c.jobsPosted, color: THEME.info },
        { key: "withProposal", label: t("adminFunnel.stages.withProposal"), count: c.withProposal, color: THEME.primary },
        { key: "firstProposal24h", label: t("adminFunnel.stages.firstProposal24h"), count: c.firstProposalIn24h, color: THEME.warning },
        { key: "hired", label: t("adminFunnel.stages.hired"), count: c.hired, color: THEME.success },
        { key: "completed", label: t("adminFunnel.stages.completed"), count: c.completed, color: THEME.success },
        { key: "reviewed", label: t("adminFunnel.stages.reviewed"), count: c.reviewed, color: THEME.warning },
      ]
    : [];

  const metric = (
    label: string,
    value: string | number,
    sub: string,
    accent?: string,
    highlight?: boolean,
  ) => (
    <div
      className="rounded-2xl p-4"
      style={{
        background: THEME.surfaceLight,
        border: `1px solid ${highlight ? THEME.warning : THEME.border}`,
      }}
    >
      <p className="text-xs" style={{ color: THEME.textDim }}>
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-bold tabular-nums"
        style={{ color: accent ?? THEME.text }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px]" style={{ color: THEME.textMuted }}>
        {sub}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: THEME.surface }}>
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
            <h1
              className="text-base sm:text-lg font-semibold truncate"
              style={{ color: THEME.text }}
            >
              {t("adminFunnel.title")}
            </h1>
            <p className="text-xs hidden sm:block" style={{ color: THEME.textDim }}>
              {t("adminFunnel.subtitle")}
            </p>
          </div>
          <div className="w-36">
            <Select
              value={days}
              onChange={(v) => setDays(v)}
              options={[
                { value: "30", label: t("adminFunnel.last30Days") },
                { value: "90", label: t("adminFunnel.last90Days") },
                { value: "365", label: t("adminFunnel.lastYear") },
              ]}
              size="sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {loading ? (
          <p className="py-16 text-center text-sm" style={{ color: THEME.textDim }}>
            {t("common.loading")}
          </p>
        ) : !data || !c || !r ? (
          <p className="py-16 text-center text-sm" style={{ color: THEME.textDim }}>
            {t("common.error")}
          </p>
        ) : (
          <>
            {/* Headline metrics - the 24h first-proposal rate is the liquidity
                vital sign, so it's highlighted. */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {metric(
                t("adminFunnel.jobsPosted"),
                posted,
                t("adminFunnel.inWindow", { days: data.days }),
              )}
              {metric(
                t("adminFunnel.proposalIn24h"),
                `${r.proposalIn24hRate}%`,
                data.avgHoursToFirstProposal != null
                  ? t("adminFunnel.avgHours", { h: data.avgHoursToFirstProposal })
                  : t("adminFunnel.liquidityVital"),
                THEME.warning,
                true,
              )}
              {metric(
                t("adminFunnel.hireRate"),
                `${r.hireRate}%`,
                t("adminFunnel.ofPosted"),
                THEME.success,
              )}
              {metric(
                t("adminFunnel.completionRate"),
                `${r.completionRate}%`,
                t("adminFunnel.ofHired"),
                THEME.success,
              )}
              {metric(
                t("adminFunnel.reviewRate"),
                `${r.reviewRate}%`,
                t("adminFunnel.ofCompleted"),
                THEME.warning,
              )}
            </div>

            {/* Funnel bars - width = share of posted; the trailing % is the
                step-to-step conversion from the previous stage. */}
            <div
              className="rounded-2xl p-4 sm:p-5"
              style={{
                background: THEME.surfaceLight,
                border: `1px solid ${THEME.border}`,
              }}
            >
              <h2 className="mb-4 text-sm font-semibold" style={{ color: THEME.text }}>
                {t("adminFunnel.funnelTitle")}
              </h2>
              {posted === 0 ? (
                <p className="py-6 text-center text-sm" style={{ color: THEME.textDim }}>
                  {t("adminFunnel.noJobs")}
                </p>
              ) : (
                <div className="space-y-3">
                  {stages.map((s, i) => {
                    const pct = posted > 0 ? (s.count / posted) * 100 : 0;
                    const prev = i > 0 ? stages[i - 1].count : s.count;
                    const stepPct = prev > 0 ? Math.round((s.count / prev) * 100) : 0;
                    return (
                      <div key={s.key}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span style={{ color: THEME.textMuted }}>{s.label}</span>
                          <span className="tabular-nums" style={{ color: THEME.text }}>
                            {s.count}
                            <span className="ml-2" style={{ color: THEME.textDim }}>
                              {Math.round(pct)}%
                              {i > 0 && ` · →${stepPct}%`}
                            </span>
                          </span>
                        </div>
                        <div
                          className="h-2.5 rounded-full overflow-hidden"
                          style={{ background: THEME.surface }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(pct, s.count > 0 ? 2 : 0)}%`,
                              background: s.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Where liquidity is weak: per-segment breakdown, worst-first by
                volume. The "got a proposal" rate is each segment's health flag
                (green = supply responding, red = supply gap). */}
            {(
              [
                { title: t("adminFunnel.byCategory"), colKey: t("adminFunnel.colCategory"), rows: data.byCategory, hint: t("adminFunnel.byCategoryHint") },
                ...(data.byCountry.length > 1
                  ? [{ title: t("adminFunnel.byCountry"), colKey: t("adminFunnel.colCountry"), rows: data.byCountry, hint: "" }]
                  : []),
              ] as { title: string; colKey: string; rows: SegRow[]; hint: string }[]
            )
              .filter((b) => b.rows.length > 0)
              .map((b) => (
                <div
                  key={b.title}
                  className="rounded-2xl p-4 sm:p-5"
                  style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
                >
                  <h2 className="text-sm font-semibold" style={{ color: THEME.text }}>
                    {b.title}
                  </h2>
                  {b.hint && (
                    <p className="mb-3 mt-0.5 text-[11px]" style={{ color: THEME.textDim }}>
                      {b.hint}
                    </p>
                  )}
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ color: THEME.textDim }}>
                          <th className="py-1.5 pr-3 text-left font-medium">{b.colKey}</th>
                          <th className="py-1.5 px-2 text-right font-medium">{t("adminFunnel.colJobs")}</th>
                          <th className="py-1.5 px-2 text-right font-medium">{t("adminFunnel.colProposal")}</th>
                          <th className="py-1.5 px-2 text-right font-medium">{t("adminFunnel.colIn24h")}</th>
                          <th className="py-1.5 pl-2 text-right font-medium">{t("adminFunnel.colHire")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.rows.map((row) => {
                          const health =
                            row.anyProposalRate >= 50
                              ? THEME.success
                              : row.anyProposalRate >= 20
                                ? THEME.warning
                                : THEME.error;
                          return (
                            <tr key={row.key} style={{ borderTop: `1px solid ${THEME.border}` }}>
                              <td className="py-1.5 pr-3 capitalize" style={{ color: THEME.text }}>
                                {row.key}
                              </td>
                              <td className="py-1.5 px-2 text-right tabular-nums" style={{ color: THEME.textMuted }}>
                                {row.jobsPosted}
                              </td>
                              <td className="py-1.5 px-2 text-right font-semibold tabular-nums" style={{ color: health }}>
                                {row.anyProposalRate}%
                              </td>
                              <td className="py-1.5 px-2 text-right tabular-nums" style={{ color: THEME.textMuted }}>
                                {row.proposalIn24hRate}%
                              </td>
                              <td className="py-1.5 pl-2 text-right tabular-nums" style={{ color: THEME.textMuted }}>
                                {row.hireRate}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminFunnelPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminFunnelContent />
    </AuthGuard>
  );
}
