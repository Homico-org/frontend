"use client";

import AuthGuard from "@/components/common/AuthGuard";
import { ADMIN_THEME as THEME } from "@/constants/theme";
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
  users: { pros: number; clients: number; signups7d: number };
}

const fmtGel = (minor: number) =>
  `${Math.round(minor / 100)
    .toLocaleString("en-US")
    .replace(/,/g, " ")} ₾`;

function TractionContent() {
  const router = useRouter();
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
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: THEME.text }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-semibold truncate" style={{ color: THEME.text }}>
              Traction
            </h1>
            <p className="text-xs hidden sm:block" style={{ color: THEME.textDim }}>
              The 0 to 10 view - get to 10 active projects
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm hover:opacity-80 transition-opacity"
            style={{ background: THEME.surfaceLight, color: THEME.text }}
          >
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {loading && !data ? (
          <div className="text-sm" style={{ color: THEME.textDim }}>
            Loading...
          </div>
        ) : !data ? (
          <div className="text-sm" style={{ color: THEME.textDim }}>
            Could not load traction.
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
                North star
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
                {data.northStar.label}
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
                Projects
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {metric("Active (7d)", data.projects.active7d, "real team, moved", THEME.success)}
                {metric("With a team", data.projects.withTeam, "any engagement")}
                {metric("Total", data.projects.total, "non-draft")}
                {metric("Created 7d", data.projects.created7d)}
                {metric("Created 30d", data.projects.created30d)}
              </div>
            </div>

            {/* Funnel: jobs + orders + users */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: THEME.textDim }}>
                Pipeline
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {metric("Jobs hired", data.jobs.hired, `of ${data.jobs.total} posted`)}
                {metric("Jobs posted 7d", data.jobs.posted7d)}
                {metric("Orders paid", data.orders.paid, fmtGel(data.orders.gmvMinor) + " GMV", THEME.success)}
                {metric("Signups 7d", data.users.signups7d)}
                {metric("Pros", data.users.pros)}
                {metric("Clients", data.users.clients)}
              </div>
            </div>

            <p className="text-[11px]" style={{ color: THEME.textMuted }}>
              Live from the database. Active project = non-draft, has a team, updated in the last 7 days.
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
