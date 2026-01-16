"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Select from "@/components/common/Select";
import { ADMIN_THEME as THEME } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { formatDateTimeShort } from "@/utils/dateUtils";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  FileText,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  Star,
  Trash2,
  User,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface ActivityLog {
  _id: string;
  type: string;
  userId: string;
  userEmail: string;
  userName: string;
  targetId?: string;
  targetType?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  createdAt: string;
}

interface ActivityStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  byType: { _id: string; count: number }[];
}

const ACTIVITY_ICONS: Record<string, any> = {
  "user.register": UserPlus,
  "user.login": LogIn,
  "user.logout": LogOut,
  "user.delete": UserMinus,
  "user.update": Edit3,
  "user.upgrade_to_pro": Star,
  "user.verification_submit": Shield,
  "user.verification_approved": Shield,
  "user.verification_rejected": Shield,
  "profile.update": Edit3,
  "profile.deactivate": AlertCircle,
  "profile.reactivate": Activity,
  "job.create": FileText,
  "job.update": Edit3,
  "job.delete": Trash2,
  "proposal.create": FileText,
  "proposal.accept": Activity,
  "proposal.reject": AlertCircle,
};

const ACTIVITY_COLORS: Record<string, string> = {
  "user.register": THEME.success,
  "user.login": THEME.info,
  "user.logout": THEME.textMuted,
  "user.delete": THEME.error,
  "user.update": THEME.warning,
  "user.upgrade_to_pro": THEME.primary,
  "user.verification_submit": THEME.warning,
  "user.verification_approved": THEME.success,
  "user.verification_rejected": THEME.error,
  "profile.update": THEME.info,
  "profile.deactivate": THEME.warning,
  "profile.reactivate": THEME.success,
  "job.create": THEME.success,
  "job.update": THEME.warning,
  "job.delete": THEME.error,
  "proposal.create": THEME.info,
  "proposal.accept": THEME.success,
  "proposal.reject": THEME.error,
};

function AdminActivityLogsPageContent() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();
  const toast = useToast();
  const router = useRouter();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "7d" | "30d">(
    "7d"
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const getStartDateForTimeFilter = useCallback(() => {
    const now = new Date();
    if (timeFilter === "today") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    if (timeFilter === "7d") {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    if (timeFilter === "30d") {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return null;
  }, [timeFilter]);

  const fetchData = useCallback(
    async (showRefresh = false) => {
      try {
        // First load: full-page loader
        // Filter/pagination changes: soft refresh (avoid "page reload" feeling)
        if (showRefresh || hasLoadedRef.current) setIsRefreshing(true);
      else setIsLoading(true);

      const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "30");
        if (searchQuery) params.set("q", searchQuery);
        if (typeFilter !== "all") params.set("type", typeFilter);
        const startDate = getStartDateForTimeFilter();
        if (startDate) params.set("startDate", startDate.toISOString());

      const [logsRes, statsRes, typesRes] = await Promise.all([
        api.get(`/admin/activity-logs?${params.toString()}`),
        api.get(`/admin/activity-stats`),
        api.get(`/admin/activity-types`),
      ]);

      setLogs(logsRes.data.logs || []);
      setTotalPages(logsRes.data.pages || 1);
      setTotal(logsRes.data.total || 0);
      setStats(statsRes.data);
      setActivityTypes(typesRes.data || []);
    } catch (err) {
        console.error("Failed to fetch activity logs:", err);
        toast.error(
          locale === "ka"
            ? "ვერ მოხერხდა აქტივობის ჩატვირთვა"
            : "Failed to load activity logs"
        );
    } finally {
        hasLoadedRef.current = true;
      setIsLoading(false);
      setIsRefreshing(false);
    }
    },
    [page, searchQuery, typeFilter, getStartDateForTimeFilter, toast, locale]
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter, timeFilter]);

  const formatActivityType = (type: string) => {
    return type.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getActivityIcon = (type: string) => {
    return ACTIVITY_ICONS[type] || Activity;
  };

  const getActivityColor = (type: string) => {
    return ACTIVITY_COLORS[type] || THEME.textMuted;
  };

  const safeString = (value: unknown) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const truncate = (value: string, max = 80) => {
    if (value.length <= max) return value;
    return `${value.slice(0, max)}…`;
  };

  const getTargetHref = (log: ActivityLog): string | null => {
    const targetId =
      log.targetId || (log.details?.targetId as string | undefined);
    const type = log.type || "";
    const targetType =
      log.targetType || (log.details?.targetType as string | undefined) || "";

    // Prefer explicit targetType/targetId when present
    if (targetId && /job/i.test(targetType)) return `/jobs/${targetId}`;
    if (targetId && /user/i.test(targetType)) return `/users/${targetId}`;

    // Heuristics by activity type
    if (targetId && type.startsWith("job.")) return `/jobs/${targetId}`;
    if (type.startsWith("profile.") || type.startsWith("user.")) {
      const maybeUserId = log.userId;
      return maybeUserId ? `/users/${maybeUserId}` : null;
    }
    return null;
  };

  const getKeyFacts = (
    log: ActivityLog
  ): Array<{ label: string; value: string }> => {
    const d = log.details || {};
    const facts: Array<{ label: string; value: string }> = [];

    if (log.targetType || log.targetId) {
      facts.push({
        label: "target",
        value: `${log.targetType || "unknown"}:${log.targetId || "-"}`,
      });
    }

    if (log.type === "user.login") {
      if (d.role) facts.push({ label: "role", value: safeString(d.role) });
      if (d.loginMethod)
        facts.push({ label: "login", value: safeString(d.loginMethod) });
    }

    if (log.type === "user.register") {
      if (d.registrationMethod)
        facts.push({ label: "via", value: safeString(d.registrationMethod) });
      if (d.role) facts.push({ label: "role", value: safeString(d.role) });
    }

    if (log.type === "profile.update") {
      const updatedFields = Array.isArray(d.updatedFields)
        ? d.updatedFields
        : [];
      if (updatedFields.length > 0)
        facts.push({ label: "fields", value: updatedFields.join(", ") });
    }

    if (d.status) facts.push({ label: "status", value: safeString(d.status) });
    if (d.category)
      facts.push({ label: "category", value: safeString(d.category) });

    if (log.ip) facts.push({ label: "ip", value: log.ip });

    return facts.slice(0, 3);
  };

  const getChanges = (
    log: ActivityLog
  ): Array<{ field: string; from: any; to: any }> => {
    const d = log.details || {};
    if (Array.isArray(d.changes)) return d.changes;
    const before = d.before;
    const after = d.after;
    if (
      before &&
      after &&
      typeof before === "object" &&
      typeof after === "object"
    ) {
      const keys = Array.from(
        new Set([...Object.keys(before), ...Object.keys(after)])
      );
      const diffs: Array<{ field: string; from: any; to: any }> = [];
      for (const k of keys) {
        const fromVal = (before as any)[k];
        const toVal = (after as any)[k];
        const same = JSON.stringify(fromVal) === JSON.stringify(toVal);
        if (!same) diffs.push({ field: k, from: fromVal, to: toVal });
      }
      return diffs;
    }
    return [];
  };

  const statCards = [
    {
      label: t("common.today"),
      value: stats?.today || 0,
      icon: Clock,
      color: THEME.success,
    },
    {
      label: t("common.thisWeek"),
      value: stats?.thisWeek || 0,
      icon: Calendar,
      color: THEME.info,
    },
    {
      label: t("common.thisMonth"),
      value: stats?.thisMonth || 0,
      icon: Activity,
      color: THEME.primary,
    },
    {
      label: t("admin.totalLogs"),
      value: total,
      icon: FileText,
      color: THEME.warning,
    },
  ];

  const isInitialLoading = isLoading && !hasLoadedRef.current;

  if (isInitialLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: THEME.surface }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
            }}
          >
            <Activity className="w-8 h-8 text-white" />
          </div>
          <p className="mt-4 text-sm" style={{ color: THEME.textMuted }}>
            {t("admin.loadingActivityLogs")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: THEME.surface }}>
      {/* Google Fonts */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap");
      `}</style>

      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: `${THEME.surface}E6`,
          borderBottom: `1px solid ${THEME.border}`,
        }}
      >
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin")}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{
                  background: THEME.surfaceLight,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <ArrowLeft
                  className="w-5 h-5"
                  style={{ color: THEME.textMuted }}
                />
              </button>
              <div>
                <h1
                  className="text-xl font-semibold tracking-tight"
                  style={{
                    color: THEME.text,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {t("admin.activityLogs")}
                </h1>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: THEME.textMuted }}
                >
                  {total.toLocaleString()} {t("admin.records")}
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
                color: "white",
                boxShadow: `0 4px 16px ${THEME.primary}40`,
              }}
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">{t("admin.refresh")}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: THEME.surfaceLight,
                border: `1px solid ${THEME.border}`,
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `radial-gradient(circle at top right, ${stat.color}10, transparent 70%)`,
                }}
              />
              <div className="relative flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}20` }}
                >
                  <stat.icon
                    className="w-6 h-6"
                    style={{ color: stat.color }}
                  />
                </div>
                <div>
                  <p
                    className="text-2xl font-bold tracking-tight"
                    style={{
                      color: THEME.text,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm" style={{ color: THEME.textMuted }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{
            background: THEME.surfaceLight,
            border: `1px solid ${THEME.border}`,
          }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: THEME.textDim }}
              />
              <input
                type="text"
                placeholder={
                  locale === "ka"
                    ? "ძებნა: ელ-ფოსტა / სახელი / userId / targetId"
                    : "Search: email / name / userId / targetId"
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{
                  background: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  color: THEME.text,
                }}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {(
                [
                  { key: "all", label: t("common.all") },
                  { key: "today", label: t("common.today") },
                  { key: "7d", label: locale === "ka" ? "7 დღე" : "7d" },
                  { key: "30d", label: locale === "ka" ? "30 დღე" : "30d" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTimeFilter(opt.key)}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background:
                      timeFilter === opt.key
                        ? `${THEME.primary}20`
                        : THEME.surface,
                    border: `1px solid ${timeFilter === opt.key ? `${THEME.primary}60` : THEME.border}`,
                    color:
                      timeFilter === opt.key ? THEME.primary : THEME.textMuted,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              size="sm"
              className="min-w-[200px]"
              options={[
                { value: "all", label: t("admin.allTypes") },
                ...activityTypes.map((type) => ({
                  value: type,
                  label: formatActivityType(type),
                })),
              ]}
            />
          </div>
        </div>

        {/* Activity Logs Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: THEME.surfaceLight,
            border: `1px solid ${THEME.border}`,
          }}
        >
          {/* Table Header */}
          <div
            className="px-6 py-4 grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider"
            style={{
              borderBottom: `1px solid ${THEME.border}`,
              color: THEME.textDim,
            }}
          >
            <div className="col-span-3">{t("admin.action")}</div>
            <div className="col-span-3">{t("admin.user")}</div>
            <div className="col-span-4 hidden lg:block">
              {t("common.details")}
            </div>
            <div className="col-span-1 hidden lg:block text-center">
              {t("common.view")}
            </div>
            <div className="col-span-6 lg:col-span-1 text-right">
              {t("common.time")}
            </div>
          </div>

          {/* Table Body */}
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: THEME.textDim }}
              />
              <p
                className="text-lg font-medium"
                style={{ color: THEME.textMuted }}
              >
                {t("admin.noLogsFound")}
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.textDim }}>
                {t("admin.tryAdjustingYourFilters")}
              </p>
            </div>
          ) : (
            logs.map((log, index) => {
              const Icon = getActivityIcon(log.type);
              const color = getActivityColor(log.type);
              const targetHref = getTargetHref(log);
              const facts = getKeyFacts(log);
              const changes = getChanges(log);

              return (
                <div
                  key={log._id}
                  className="px-6 py-4 grid grid-cols-12 gap-4 items-center transition-colors cursor-pointer"
                  style={{
                    borderBottom:
                      index < logs.length - 1
                        ? `1px solid ${THEME.border}`
                        : "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = THEME.surfaceHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  onClick={() => setSelectedLog(log)}
                >
                  {/* Action */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: THEME.text }}
                    >
                      {formatActivityType(log.type)}
                    </span>
                  </div>

                  {/* User */}
                  <div className="col-span-3">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: THEME.text }}
                    >
                      {log.userName || "Unknown"}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: THEME.textDim }}
                    >
                      {log.userEmail || log.userId}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="col-span-4 hidden lg:block">
                    <div className="space-y-1">
                      {facts.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {facts.map((f) => (
                            <span
                              key={f.label}
                              className="px-2 py-1 rounded-lg text-[11px] font-medium"
                              style={{
                                background: `${THEME.textDim}14`,
                                border: `1px solid ${THEME.border}`,
                                color: THEME.textMuted,
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                              title={f.value}
                            >
                              {f.label}: {truncate(f.value, 48)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: THEME.textDim }}
                        >
                          -
                        </span>
                      )}
                      {changes.length > 0 && (
                        <p className="text-xs" style={{ color: THEME.textDim }}>
                          {locale === "ka" ? "ცვლილებები:" : "Changes:"}{" "}
                          <span style={{ color: THEME.textMuted }}>
                            {changes
                              .map((c) => c.field)
                              .slice(0, 3)
                              .join(", ")}
                            {changes.length > 3 ? "…" : ""}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* View */}
                  <div className="col-span-1 hidden lg:flex justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (targetHref) router.push(targetHref);
                      }}
                      disabled={!targetHref}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40"
                      style={{
                        background: `${THEME.info}18`,
                        border: `1px solid ${THEME.info}30`,
                      }}
                      title={targetHref ? t("common.view") : ""}
                    >
                      <Eye className="w-4 h-4" style={{ color: THEME.info }} />
                    </button>
                  </div>

                  {/* Time */}
                  <div className="col-span-6 lg:col-span-1 text-right">
                    <p
                      className="text-sm"
                      style={{
                        color: THEME.textMuted,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {formatDateTimeShort(
                        log.timestamp || log.createdAt,
                        locale as "en" | "ka" | "ru"
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm" style={{ color: THEME.textMuted }}>
              {locale === "ka"
                ? `გვერდი ${page} / ${totalPages}`
                : `Page ${page} of ${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                style={{
                  background: THEME.surfaceLight,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <ChevronLeft
                  className="w-5 h-5"
                  style={{ color: THEME.textMuted }}
                />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                style={{
                  background: THEME.surfaceLight,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <ChevronRight
                  className="w-5 h-5"
                  style={{ color: THEME.textMuted }}
                />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{
              background: THEME.surfaceLight,
              border: `1px solid ${THEME.border}`,
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
              style={{
                background: THEME.surfaceLight,
                borderBottom: `1px solid ${THEME.border}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${getActivityColor(selectedLog.type)}20`,
                  }}
                >
                  {(() => {
                    const Icon = getActivityIcon(selectedLog.type);
                    return (
                      <Icon
                        className="w-6 h-6"
                        style={{ color: getActivityColor(selectedLog.type) }}
                      />
                    );
                  })()}
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: THEME.text }}>
                    {formatActivityType(selectedLog.type)}
                  </h3>
                  <p className="text-sm" style={{ color: THEME.textMuted }}>
                    {formatDateTimeShort(
                      selectedLog.timestamp || selectedLog.createdAt,
                      locale as "en" | "ka" | "ru"
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{ background: THEME.surface }}
              >
                <span style={{ color: THEME.textMuted }}>×</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div>
                <h4
                  className="text-sm font-medium mb-3 flex items-center gap-2"
                  style={{ color: THEME.text }}
                >
                  <User className="w-4 h-4" style={{ color: THEME.primary }} />
                  {locale === "ka" ? "მომხმარებელი" : "User"}
                </h4>
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: THEME.surface,
                    border: `1px solid ${THEME.border}`,
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs" style={{ color: THEME.textDim }}>
                        {t("common.name")}
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: THEME.text }}
                      >
                        {selectedLog.userName || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: THEME.textDim }}>
                        {t("common.email")}
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: THEME.text }}
                      >
                        {selectedLog.userEmail || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: THEME.textDim }}>
                        {t("admin.userId")}
                      </p>
                      <p
                        className="text-xs font-mono"
                        style={{ color: THEME.textMuted }}
                      >
                        {selectedLog.userId}
                      </p>
                    </div>
                    {selectedLog.ip && (
                      <div>
                        <p className="text-xs" style={{ color: THEME.textDim }}>
                          IP
                        </p>
                        <p
                          className="text-sm font-mono"
                          style={{ color: THEME.textMuted }}
                        >
                          {selectedLog.ip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              {selectedLog.details &&
                Object.keys(selectedLog.details).length > 0 && (
                  <>
                    {/* Changes (before/after) */}
                    <div>
                      <h4
                        className="text-sm font-medium mb-3 flex items-center gap-2"
                        style={{ color: THEME.text }}
                      >
                        <Edit3
                          className="w-4 h-4"
                          style={{ color: THEME.primary }}
                        />
                        {locale === "ka"
                          ? "ცვლილებები (Before / After)"
                          : "Changes (Before / After)"}
                      </h4>

                      {getChanges(selectedLog).length > 0 ? (
                        <div
                          className="rounded-xl overflow-hidden"
                          style={{
                            background: THEME.surface,
                            border: `1px solid ${THEME.border}`,
                          }}
                        >
                          <div
                            className="grid grid-cols-12 gap-0 px-4 py-2 text-[11px] font-semibold"
                            style={{
                              color: THEME.textDim,
                              borderBottom: `1px solid ${THEME.border}`,
                            }}
                          >
                            <div className="col-span-4">
                              {locale === "ka" ? "ველი" : "Field"}
                            </div>
                            <div className="col-span-4">
                              {locale === "ka" ? "Before" : "Before"}
                            </div>
                            <div className="col-span-4">
                              {locale === "ka" ? "After" : "After"}
                            </div>
                          </div>
                          {getChanges(selectedLog)
                            .slice(0, 50)
                            .map((c, idx) => (
                              <div
                                key={`${c.field}-${idx}`}
                                className="grid grid-cols-12 gap-0 px-4 py-3 text-xs"
                                style={{
                                  borderBottom:
                                    idx < getChanges(selectedLog).length - 1
                                      ? `1px solid ${THEME.border}`
                                      : "none",
                                }}
                              >
                                <div className="col-span-4 pr-3">
                                  <span
                                    style={{
                                      color: THEME.text,
                                      fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                  >
                                    {c.field}
                                  </span>
                                </div>
                                <div className="col-span-4 pr-3">
                                  <span
                                    style={{
                                      color: THEME.textMuted,
                                      fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                  >
                                    {truncate(safeString(c.from), 140) || "—"}
                                  </span>
                                </div>
                                <div className="col-span-4">
                                  <span
                                    style={{
                                      color: THEME.success,
                                      fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                  >
                                    {truncate(safeString(c.to), 140) || "—"}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div
                          className="rounded-xl p-4"
                          style={{
                            background: THEME.surface,
                            border: `1px solid ${THEME.border}`,
                          }}
                        >
                          <p
                            className="text-sm"
                            style={{ color: THEME.textMuted }}
                          >
                            {locale === "ka"
                              ? "ამ ჩანაწერს არ აქვს before/after ცვლილებები (ჯერ არ არის ჩაწერილი ლოგებში)."
                              : "This log does not include before/after changes (not recorded yet)."}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Raw Details (JSON) */}
                <div>
                      <h4
                        className="text-sm font-medium mb-3 flex items-center gap-2"
                        style={{ color: THEME.text }}
                      >
                        <FileText
                          className="w-4 h-4"
                          style={{ color: THEME.primary }}
                        />
                        {locale === "ka" ? "Raw დეტალები" : "Raw Details"}
                  </h4>
                  <div
                    className="rounded-xl p-4 overflow-x-auto"
                        style={{
                          background: THEME.surface,
                          border: `1px solid ${THEME.border}`,
                        }}
                  >
                    <pre
                      className="text-xs whitespace-pre-wrap"
                          style={{
                            color: THEME.textMuted,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                    >
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
                  </>
              )}

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div>
                  <h4
                    className="text-sm font-medium mb-3"
                    style={{ color: THEME.text }}
                  >
                    {t("admin.userAgent")}
                  </h4>
                  <p
                    className="text-xs break-all"
                    style={{ color: THEME.textDim }}
                  >
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminActivityLogsPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminActivityLogsPageContent />
    </AuthGuard>
  );
}
