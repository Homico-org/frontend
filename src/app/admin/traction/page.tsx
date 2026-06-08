"use client";

import AuthGuard from "@/components/common/AuthGuard";
import { ADMIN_THEME as THEME } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { ArrowLeft, RotateCcw, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Traction {
  goal: number;
  northStar: { activeProjects: number; label: string };
  projects: {
    total: number;
    withTeam: number;
    active7d: number;
    created7d: number;
    created30d: number;
  };
  jobs: { total: number; hired: number; posted7d: number };
  orders: { paid: number; gmvMinor: number };
  users: {
    pros: number;
    clients: number;
    signups7d: number;
    prosHired: number;
  };
}

const fmtGel = (minor: number) =>
  `${Math.round(minor / 100)
    .toLocaleString("en-US")
    .replace(/,/g, " ")} ₾`;

function TractionContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const [data, setData] = useState<Traction | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<Traction>("/admin/traction")
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const metric = (
    label: string,
    value: string | number,
    sub?: string,
    accent?: string,
  ) => (
    <div
      className="rounded-2xl p-4"
      style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
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
      {sub && (
        <p className="mt-0.5 text-[11px]" style={{ color: THEME.textMuted }}>
          {sub}
        </p>
      )}
    </div>
  );

  const ns = data?.northStar.activeProjects ?? 0;
  const goal = data?.goal ?? 10;
  const pct = Math.min(100, Math.round((ns / goal) * 100));

  return (
    <div className="min-h-screen" style={{ background: THEME.surface }}>
      <div
        className="sticky top-0 z-10 backdrop-blur-xl"
        style={{ background: `${THEME.surface}E6`, borderBottom: `1px solid ${THEME.border}` }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
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
              {t("adminTraction.title")}
            </h1>
            <p className="text-xs hidden sm:block" style={{ color: THEME.textDim }}>
              {t("adminTraction.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm hover:opacity-80 transition-opacity"
            style={{ background: THEME.surfaceLight, color: THEME.text }}
          >
            <RotateCcw className="w-4 h-4" />
            {t("adminTraction.refresh")}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {loading && !data ? (
          <div className="text-sm" style={{ color: THEME.textDim }}>
            {t("common.loading")}
          </div>
        ) : !data ? (
          <div className="text-sm" style={{ color: THEME.textDim }}>
            {t("adminTraction.loadError")}
          </div>
        ) : (
          <>
            {/* North star */}
            <div
              className="rounded-3xl p-6"
              style={{
                background: THEME.surfaceLight,
                border: `1px solid ${THEME.primary}`,
              }}
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: THEME.primary }}>
                <Target className="w-4 h-4" />
                {t("adminTraction.northStar")}
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-bold tabular-nums" style={{ color: THEME.text }}>
                  {ns}
                </span>
                <span className="pb-1 text-xl font-medium tabular-nums" style={{ color: THEME.textDim }}>
                  / {goal}
                </span>
              </div>
              <p className="mt-1 text-[13px]" style={{ color: THEME.textMuted }}>
                {t("adminTraction.northStarLabel")}
              </p>
              <div className="mt-4 h-2.5 w-full rounded-full overflow-hidden" style={{ background: THEME.border }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: THEME.primary }}
                />
              </div>
            </div>

            {/* Projects */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: THEME.textDim }}>
                {t("adminTraction.projects")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {metric(t("adminTraction.active7d"), data.projects.active7d, t("adminTraction.active7dSub"), THEME.success)}
                {metric(t("adminTraction.withTeam"), data.projects.withTeam, t("adminTraction.withTeamSub"))}
                {metric(t("adminTraction.total"), data.projects.total, t("adminTraction.totalSub"))}
                {metric(t("adminTraction.created7d"), data.projects.created7d)}
                {metric(t("adminTraction.created30d"), data.projects.created30d)}
              </div>
            </div>

            {/* Funnel: jobs + orders + users */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: THEME.textDim }}>
                {t("adminTraction.pipeline")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {metric(t("adminTraction.jobsHired"), data.jobs.hired, t("adminTraction.jobsHiredSub", { total: data.jobs.total }))}
                {metric(t("adminTraction.jobsPosted7d"), data.jobs.posted7d)}
                {metric(t("adminTraction.ordersPaid"), data.orders.paid, t("adminTraction.gmvSub", { amount: fmtGel(data.orders.gmvMinor) }), THEME.success)}
                {metric(
                  t("adminTraction.proUtilization"),
                  `${data.users.pros > 0 ? Math.round((data.users.prosHired / data.users.pros) * 100) : 0}%`,
                  t("adminTraction.proUtilizationSub", { hired: data.users.prosHired, total: data.users.pros }),
                  data.users.prosHired > 0 ? THEME.success : THEME.warning,
                )}
                {metric(t("adminTraction.signups7d"), data.users.signups7d)}
                {metric(t("adminTraction.clients"), data.users.clients)}
              </div>
            </div>

            <p className="text-[11px]" style={{ color: THEME.textMuted }}>
              {t("adminTraction.footer")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminTractionPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <TractionContent />
    </AuthGuard>
  );
}
