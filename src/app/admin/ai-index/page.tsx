"use client";

import AuthGuard from "@/components/common/AuthGuard";
import BackButton from "@/components/common/BackButton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { RefreshCw, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface IndexStats {
  ready: boolean;
  building: boolean;
  rowCount: number;
  hash: string | null;
  lastBuiltAt: string | null;
  source: "memory" | "disk" | "fresh" | "none";
}

/**
 * Admin: rebuild the AI catalog vector index used by both /categories/ai-search
 * and the chat assistant's tool calls. The index lives in backend memory and
 * normally rebuilds on boot; this button lets you force a rebuild after editing
 * the Service Catalog without needing a redeploy.
 */
export default function AiIndexAdminPage() {
  const { t, locale } = useLanguage();
  const { success, error } = useToast();
  const [stats, setStats] = useState<IndexStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get<IndexStats>("/categories/admin/ai-index-stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load AI index stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Light polling so the user sees state changes (e.g. background
    // build finishing) without needing to refresh.
    //
    // Self-rescheduling chain (not setInterval) with visibility +
    // 429 awareness:
    //   - Skip when the admin tab is hidden (no point updating a UI
    //     the user isn't looking at)
    //   - Double the next-attempt delay on 429, capped at 60s, so a
    //     forgotten admin tab never contributes to a rate-limit storm
    //
    // Previously a bare `setInterval(loadStats, 4000)` would burn
    // 900 requests/hour while idle and provided no relief when the
    // backend pushed back.
    loadStats();
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let delay = 4000;
    const tick = async () => {
      if (cancelled) return;
      if (typeof document !== 'undefined' && document.hidden) {
        timerId = setTimeout(tick, delay);
        return;
      }
      try {
        const res = await api.get<IndexStats>("/categories/admin/ai-index-stats");
        setStats(res.data);
        delay = 4000;
      } catch (err) {
        const status =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
        if (status === 429) {
          delay = Math.min(delay * 2, 60000);
        }
        console.error("Failed to load AI index stats:", err);
      } finally {
        setLoading(false);
      }
      if (!cancelled) timerId = setTimeout(tick, delay);
    };
    timerId = setTimeout(tick, delay);
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [loadStats]);

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      await api.post("/categories/admin/rebuild-ai-index");
      success(t("admin.aiIndexRebuildSuccess"));
      await loadStats();
    } catch (err) {
      console.error("Rebuild failed:", err);
      error(t("admin.aiIndexRebuildFailed"));
    } finally {
      setRebuilding(false);
    }
  };

  const formatLastBuilt = (iso: string | null): string => {
    if (!iso) return t("admin.aiIndexNever");
    const d = new Date(iso);
    return d.toLocaleString(
      locale === "ka" ? "ka-GE" : locale === "ru" ? "ru-RU" : "en-US",
      { dateStyle: "medium", timeStyle: "short" },
    );
  };

  const sourceLabel = (source: IndexStats["source"]): string => {
    switch (source) {
      case "fresh":
        return t("admin.aiIndexSourceFresh");
      case "disk":
        return t("admin.aiIndexSourceDisk");
      case "memory":
        return t("admin.aiIndexSourceMemory");
      default:
        return t("admin.aiIndexSourceNone");
    }
  };

  const statusLabel = (s: IndexStats): { text: string; tone: "success" | "warning" | "default" } => {
    if (s.building) return { text: t("admin.aiIndexBuilding"), tone: "warning" };
    if (s.ready) return { text: t("admin.aiIndexReady"), tone: "success" };
    return { text: t("admin.aiIndexNotReady"), tone: "default" };
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div
        className="min-h-screen px-4 py-6 sm:px-6 sm:py-8"
        style={{ backgroundColor: "var(--hm-bg-page)" }}
      >
        <div className="max-w-3xl mx-auto">
          <BackButton href="/admin" variant="minimal" label={t("common.back")} className="mb-4" />

          <div className="flex items-start gap-3 mb-6">
            <div
              className="rounded-xl p-2.5 flex-shrink-0"
              style={{ backgroundColor: "rgba(168, 85, 247, 0.12)" }}
            >
              <Zap size={22} color="#A855F7" />
            </div>
            <div>
              <h1
                className="text-2xl font-semibold"
                style={{ color: "var(--hm-text-primary)" }}
              >
                {t("admin.aiIndexTitle")}
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--hm-text-secondary)" }}
              >
                {t("admin.aiIndexDesc")}
              </p>
            </div>
          </div>

          <Alert variant="info" className="mb-6">
            {t("admin.aiIndexExplain")}
          </Alert>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>{t("admin.aiIndexStatus")}</CardTitle>
            </CardHeader>
            <CardBody>
              {loading && !stats ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : stats ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <StatRow
                    label={t("admin.aiIndexStatus")}
                    value={
                      <StatusPill {...statusLabel(stats)} />
                    }
                  />
                  <StatRow
                    label={t("admin.aiIndexRowCount")}
                    value={stats.rowCount.toLocaleString()}
                  />
                  <StatRow
                    label={t("admin.aiIndexLastBuilt")}
                    value={formatLastBuilt(stats.lastBuiltAt)}
                  />
                  <StatRow
                    label={t("admin.aiIndexSource")}
                    value={sourceLabel(stats.source)}
                  />
                  <StatRow
                    label={t("admin.aiIndexHash")}
                    value={
                      <code
                        className="text-xs font-mono"
                        style={{ color: "var(--hm-text-tertiary)" }}
                      >
                        {stats.hash ? stats.hash.slice(0, 12) : "-"}
                      </code>
                    }
                  />
                </dl>
              ) : (
                <p style={{ color: "var(--hm-text-secondary)" }}>
                  {t("admin.aiIndexNotReady")}
                </p>
              )}

              <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--hm-border-subtle)" }}>
                <Button
                  variant="default"
                  onClick={handleRebuild}
                  disabled={rebuilding || stats?.building}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw
                    size={16}
                    className={rebuilding ? "animate-spin" : ""}
                  />
                  {rebuilding
                    ? t("admin.aiIndexRebuilding")
                    : t("admin.aiIndexRebuild")}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt
        className="text-xs uppercase tracking-wide mb-1"
        style={{ color: "var(--hm-text-tertiary)" }}
      >
        {label}
      </dt>
      <dd
        className="text-sm font-medium"
        style={{ color: "var(--hm-text-primary)" }}
      >
        {value}
      </dd>
    </div>
  );
}

function StatusPill({ text, tone }: { text: string; tone: "success" | "warning" | "default" }) {
  const styles =
    tone === "success"
      ? { bg: "rgba(34, 197, 94, 0.12)", fg: "rgb(22, 163, 74)" }
      : tone === "warning"
        ? { bg: "rgba(234, 179, 8, 0.12)", fg: "rgb(202, 138, 4)" }
        : { bg: "var(--hm-bg-elevated)", fg: "var(--hm-text-secondary)" };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: styles.bg, color: styles.fg }}
    >
      {text}
    </span>
  );
}
