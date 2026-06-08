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
  supply: {
    pros: number;
    clients: number;
    ratio: number | null;
    proSignups7d: number;
    clientSignups7d: number;
    proSignups30d: number;
    clientSignups30d: number;
    clientShare7d: number;
  };
  proQuality: {
    total: number;
    verified: number;
    withPortfolio: number;
    withPricing: number;
    withReviews: number;
    portfolioRate: number;
  };
  clientFunnel: {
    total: number;
    activated: number;
    activationRate: number;
    new7d: number;
    new30d: number;
  };
  invites: {
    sent: number;
    activated: number;
    activationRate: number;
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

            {/* Supply & demand - the cold-start health signal */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: THEME.textDim }}>
                {t("adminTraction.supplyTitle")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {metric(
                  t("adminTraction.ratio"),
                  data.supply.ratio != null ? `${data.supply.ratio}:1` : "-",
                  t("adminTraction.ratioSub", { pros: data.supply.pros, clients: data.supply.clients }),
                  (data.supply.ratio ?? 0) >= 5 ? THEME.error : (data.supply.ratio ?? 0) >= 2 ? THEME.warning : THEME.success,
                )}
                {metric(t("adminTraction.newPros7d"), data.supply.proSignups7d)}
                {metric(
                  t("adminTraction.newClients7d"),
                  data.supply.clientSignups7d,
                  undefined,
                  data.supply.clientSignups7d > 0 ? THEME.text : THEME.warning,
                )}
                {metric(
                  t("adminTraction.clientShare7d"),
                  `${data.supply.clientShare7d}%`,
                  t("adminTraction.clientShare7dSub"),
                  data.supply.clientShare7d >= 30 ? THEME.success : data.supply.clientShare7d >= 15 ? THEME.warning : THEME.error,
                )}
              </div>
            </div>

            {/* Client activation - the leak that matters */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: THEME.textDim }}>
                {t("adminTraction.activationTitle")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {metric(
                  t("adminTraction.activationRate"),
                  `${data.clientFunnel.activationRate}%`,
                  t("adminTraction.activationRateSub", { activated: data.clientFunnel.activated, total: data.clientFunnel.total }),
                  data.clientFunnel.activationRate >= 30 ? THEME.success : data.clientFunnel.activationRate >= 10 ? THEME.warning : THEME.error,
                )}
                {metric(t("adminTraction.clientsActivated"), data.clientFunnel.activated)}
                {metric(t("adminTraction.newClients7d"), data.clientFunnel.new7d)}
                {metric(t("adminTraction.newClients30d"), data.clientFunnel.new30d)}
              </div>
            </div>

            {/* Supply quality - empty profiles don't convert */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: THEME.textDim }}>
                {t("adminTraction.qualityTitle")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {metric(
                  t("adminTraction.withPortfolio"),
                  data.proQuality.withPortfolio,
                  t("adminTraction.portfolioRateSub", { rate: data.proQuality.portfolioRate }),
                  data.proQuality.portfolioRate >= 50 ? THEME.success : data.proQuality.portfolioRate >= 20 ? THEME.warning : THEME.error,
                )}
                {metric(t("adminTraction.withPricing"), data.proQuality.withPricing)}
                {metric(t("adminTraction.withReviews"), data.proQuality.withReviews)}
                {metric(t("adminTraction.verifiedPros"), data.proQuality.verified)}
              </div>
            </div>

            {/* Invite channel ROI */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: THEME.textDim }}>
                {t("adminTraction.inviteTitle")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {metric(t("adminTraction.invitesSent"), data.invites.sent.toLocaleString("en-US").replace(/,/g, " "))}
                {metric(t("adminTraction.invitesActivated"), data.invites.activated)}
                {metric(
                  t("adminTraction.inviteRate"),
                  `${data.invites.activationRate}%`,
                  t("adminTraction.inviteRateSub", { activated: data.invites.activated, sent: data.invites.sent }),
                  data.invites.activationRate >= 5 ? THEME.success : data.invites.activationRate >= 1 ? THEME.warning : THEME.error,
                )}
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
