"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Avatar from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ADMIN_THEME as THEME } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { formatDateTimeShort } from "@/utils/dateUtils";
import {
  Eye,
  Phone,
  RefreshCw,
  Trophy,
  List as ListIcon,
  Users,
  Activity,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ViewType = "phone" | "profile";
type Tab = "ranking" | "journal";

interface RankRow {
  proId: string;
  count: number;
  lastViewedAt: string;
  proName?: string;
  proAvatar?: string;
  proUid?: number;
  proPhone?: string;
}

interface RefLite {
  id?: string;
  name?: string;
  avatar?: string;
  uid?: number;
}
interface LogRow {
  id: string;
  proId?: RefLite | null;
  viewerId?: RefLite | null;
  viewerName?: string | null;
  ip: string;
  createdAt: string;
}

interface TypeSummary {
  total: number;
  uniquePros: number;
  lastHour: number;
}
interface Summary {
  phone: TypeSummary;
  profile: TypeSummary;
}

const PAGE_SIZE = 50;

// Small inline i18n - this is an admin-only screen, kept self-contained.
const TXT = {
  title: { en: "View tracking", ka: "ნახვების მონიტორინგი", ru: "Отслеживание просмотров" },
  subtitle: {
    en: "Who opens pro profiles and phone numbers",
    ka: "ვინ ხსნის პროფილებსა და ტელეფონის ნომრებს",
    ru: "Кто открывает профили и номера телефонов",
  },
  phone: { en: "Phone opens", ka: "ტელეფონის ნახვები", ru: "Открытия телефона" },
  profile: { en: "Profile opens", ka: "პროფილის ნახვები", ru: "Открытия профиля" },
  ranking: { en: "Leaderboard", ka: "რეიტინგი", ru: "Рейтинг" },
  journal: { en: "Journal", ka: "ჟურნალი", ru: "Журнал" },
  pro: { en: "Pro", ka: "პრო", ru: "Про" },
  opens: { en: "Opens", ka: "ნახვები", ru: "Открытия" },
  last: { en: "Last", ka: "ბოლო", ru: "Последний" },
  visitor: { en: "Visitor", ka: "ვიზიტორი", ru: "Посетитель" },
  when: { en: "When", ka: "როდის", ru: "Когда" },
  anonymous: { en: "Anonymous", ka: "ანონიმური", ru: "Аноним" },
  empty: { en: "No data yet", ka: "მონაცემები ჯერ არ არის", ru: "Пока нет данных" },
  refresh: { en: "Refresh", ka: "განახლება", ru: "Обновить" },
  totalOpens: { en: "Total opens", ka: "სულ ნახვები", ru: "Всего открытий" },
  uniquePros: { en: "Unique pros", ka: "უნიკალური პრო", ru: "Уникальных про" },
  lastHour: { en: "Last hour", ka: "ბოლო საათი", ru: "За час" },
  avgPerPro: { en: "Avg / pro", ka: "საშ. / პრო", ru: "Сред. / про" },
  window24h: { en: "Rolling 24h", ka: "ბოლო 24 სთ", ru: "За 24 часа" },
  loadMore: { en: "Load more", ka: "მეტის ჩვენება", ru: "Показать ещё" },
  showing: { en: "Showing", ka: "ნაჩვენებია", ru: "Показано" },
  of: { en: "of", ka: "-დან", ru: "из" },
  export: { en: "Export CSV", ka: "CSV ექსპორტი", ru: "Экспорт CSV" },
  exporting: { en: "Exporting…", ka: "ექსპორტი…", ru: "Экспорт…" },
  rank: { en: "Rank", ka: "ადგილი", ru: "Место" },
  name: { en: "Name", ka: "სახელი", ru: "Имя" },
  uid: { en: "UID", ka: "UID", ru: "UID" },
  phoneCol: { en: "Phone", ka: "ტელეფონი", ru: "Телефон" },
};

function AdminViewsContent() {
  const { locale } = useLanguage();
  const toast = useToast();
  const L = (k: keyof typeof TXT) => TXT[k][(locale as "en" | "ka" | "ru")] || TXT[k].en;

  const [type, setType] = useState<ViewType>("phone");
  const [tab, setTab] = useState<Tab>("ranking");
  const [ranking, setRanking] = useState<RankRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaging, setIsPaging] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get("/admin/view-summary");
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to load view summary:", err);
    }
  }, []);

  // Load one page. `append` keeps prior rows (Load more); otherwise replaces.
  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      append ? setIsPaging(true) : setIsLoading(true);
      try {
        const path = tab === "ranking" ? "view-stats" : "view-logs";
        const res = await api.get(
          `/admin/${path}?type=${type}&page=${nextPage}&limit=${PAGE_SIZE}`,
        );
        const items = res.data.items || [];
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
        setPage(nextPage);
        if (tab === "ranking") {
          setRanking((prev) => (append ? [...prev, ...items] : items));
        } else {
          setLogs((prev) => (append ? [...prev, ...items] : items));
        }
      } catch (err) {
        console.error("Failed to load view tracking:", err);
        toast.error(L("empty"));
      } finally {
        setIsLoading(false);
        setIsPaging(false);
      }
    },
    [type, tab], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Reset to page 1 whenever the type or tab changes.
  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const refresh = useCallback(() => {
    fetchPage(1, false);
    fetchSummary();
  }, [fetchPage, fetchSummary]);

  const [isExporting, setIsExporting] = useState(false);

  // Pull every page for the current tab+type (capped for safety), then hand the
  // browser a CSV blob to download. Uses the same endpoints as the table.
  const exportCsv = useCallback(async () => {
    setIsExporting(true);
    try {
      const path = tab === "ranking" ? "view-stats" : "view-logs";
      const EXPORT_LIMIT = 200;
      const MAX_PAGES = 50; // hard cap: up to 10k rows
      const rows: any[] = [];
      let p = 1;
      let pages = 1;
      do {
        const res = await api.get(
          `/admin/${path}?type=${type}&page=${p}&limit=${EXPORT_LIMIT}`,
        );
        rows.push(...(res.data.items || []));
        pages = res.data.totalPages || 1;
        p += 1;
      } while (p <= pages && p <= MAX_PAGES);

      const esc = (v: unknown) => {
        const str = v == null ? "" : String(v);
        return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
      };

      let headers: string[];
      let lines: string[];
      if (tab === "ranking") {
        headers = [L("rank"), L("name"), L("uid"), L("phoneCol"), L("opens"), L("last")];
        lines = (rows as RankRow[]).map((r, i) =>
          [i + 1, r.proName ?? "", r.proUid ?? "", r.proPhone ?? "", r.count, r.lastViewedAt ?? ""]
            .map(esc)
            .join(","),
        );
      } else {
        headers = [L("when"), L("pro"), L("uid"), L("visitor"), "IP"];
        lines = (rows as LogRow[]).map((r) =>
          [
            r.createdAt ?? "",
            r.proId?.name ?? "",
            r.proId?.uid ?? "",
            r.viewerId?.name ?? r.viewerName ?? L("anonymous"),
            r.ip ?? "",
          ]
            .map(esc)
            .join(","),
        );
      }

      const csv = [headers.join(","), ...lines].join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `views-${type}-${tab}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export view tracking:", err);
      toast.error(L("empty"));
    } finally {
      setIsExporting(false);
    }
  }, [tab, type]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = summary?.[type];
  const hasMore = page < totalPages;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: THEME.text }}>
            {L("title")}
          </h1>
          <p className="text-sm" style={{ color: THEME.textMuted }}>
            {L("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportCsv}
            size="sm"
            variant="secondary"
            className="h-9"
            disabled={isExporting || isLoading}
          >
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {isExporting ? L("exporting") : L("export")}
            </span>
          </Button>
          <Button onClick={refresh} size="sm" variant="secondary" className="h-9">
            <RefreshCw className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{L("refresh")}</span>
          </Button>
        </div>
      </div>

      {/* Summary stat row (rolling 24h, reflects selected type) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={type === "phone" ? Phone : Eye}
          label={L("totalOpens")}
          value={s ? s.total.toLocaleString() : "—"}
          hint={L("window24h")}
          accent
        />
        <StatCard
          icon={Users}
          label={L("uniquePros")}
          value={s ? s.uniquePros.toLocaleString() : "—"}
        />
        <StatCard
          icon={Activity}
          label={L("lastHour")}
          value={s ? s.lastHour.toLocaleString() : "—"}
        />
        <StatCard
          icon={Trophy}
          label={L("avgPerPro")}
          value={s && s.uniquePros ? (s.total / s.uniquePros).toFixed(1) : "—"}
        />
      </div>

      {/* Type toggle: phone / profile */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Toggle active={type === "phone"} onClick={() => setType("phone")} icon={Phone} label={L("phone")} />
        <Toggle active={type === "profile"} onClick={() => setType("profile")} icon={Eye} label={L("profile")} />
      </div>

      {/* Tab toggle: ranking / journal */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div className="flex flex-wrap gap-2">
          <Toggle active={tab === "ranking"} onClick={() => setTab("ranking")} icon={Trophy} label={L("ranking")} />
          <Toggle active={tab === "journal"} onClick={() => setTab("journal")} icon={ListIcon} label={L("journal")} />
        </div>
        {!isLoading && total > 0 && (
          <span className="text-xs" style={{ color: THEME.textDim }}>
            {L("showing")} {(tab === "ranking" ? ranking.length : logs.length).toLocaleString()} {L("of")}{" "}
            {total.toLocaleString()}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : tab === "ranking" ? (
        <RankingTable rows={ranking} type={type} L={L} />
      ) : (
        <JournalTable rows={logs} L={L} />
      )}

      {!isLoading && hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={() => fetchPage(page + 1, true)}
            variant="secondary"
            size="sm"
            disabled={isPaging}
          >
            {isPaging ? <LoadingSpinner size="xs" /> : L("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3 sm:p-4"
      style={{
        background: accent ? `${THEME.primary}12` : THEME.surfaceLight,
        border: `1px solid ${accent ? `${THEME.primary}40` : THEME.border}`,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium" style={{ color: THEME.textMuted }}>
          {label}
        </span>
      </div>
      <div className="text-2xl font-semibold leading-none" style={{ color: THEME.text }}>
        {value}
      </div>
      {hint && (
        <div className="text-[11px] mt-1.5" style={{ color: THEME.textDim }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      style={{
        background: active ? `${THEME.primary}20` : THEME.surfaceLight,
        color: active ? THEME.primary : THEME.textMuted,
        border: `1px solid ${active ? THEME.primary : THEME.border}`,
      }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function RankingTable({
  rows,
  type,
  L,
}: {
  rows: RankRow[];
  type: ViewType;
  L: (k: keyof typeof TXT) => string;
}) {
  if (!rows.length) return <EmptyState L={L} />;
  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${THEME.border}` }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: THEME.surfaceLight, color: THEME.textMuted }}>
            <th className="text-left px-4 py-3 w-12">#</th>
            <th className="text-left px-4 py-3">{L("pro")}</th>
            <th className="text-right px-4 py-3">{L("opens")}</th>
            <th className="text-right px-4 py-3 hidden sm:table-cell">{L("last")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.proId} style={{ borderTop: `1px solid ${THEME.border}`, color: THEME.text }}>
              <td className="px-4 py-3 tabular-nums" style={{ color: THEME.textMuted }}>
                {medal(i) ?? i + 1}
              </td>
              <td className="px-4 py-3">
                <Link href={`/professionals/${r.proId}`} className="flex items-center gap-2 hover:underline">
                  <Avatar src={r.proAvatar} name={r.proName || "?"} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate">{r.proName || `#${r.proUid ?? "?"}`}</span>
                    {type === "phone" && r.proPhone && (
                      <span className="block font-mono text-xs" style={{ color: THEME.textDim }}>
                        {r.proPhone}
                      </span>
                    )}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">{r.count}</td>
              <td className="px-4 py-3 text-right hidden sm:table-cell" style={{ color: THEME.textMuted }}>
                {r.lastViewedAt ? formatDateTimeShort(r.lastViewedAt) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JournalTable({ rows, L }: { rows: LogRow[]; L: (k: keyof typeof TXT) => string }) {
  if (!rows.length) return <EmptyState L={L} />;
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${THEME.border}` }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: THEME.surfaceLight, color: THEME.textMuted }}>
            <th className="text-left px-4 py-3">{L("pro")}</th>
            <th className="text-left px-4 py-3">{L("visitor")}</th>
            <th className="text-right px-4 py-3">{L("when")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderTop: `1px solid ${THEME.border}`, color: THEME.text }}>
              <td className="px-4 py-3">
                {r.proId ? (
                  <Link href={`/professionals/${r.proId.id}`} className="flex items-center gap-2 hover:underline">
                    <Avatar src={r.proId.avatar} name={r.proId.name || "?"} size="sm" />
                    <span>{r.proId.name || `#${r.proId.uid ?? "?"}`}</span>
                  </Link>
                ) : (
                  <span style={{ color: THEME.textMuted }}>-</span>
                )}
              </td>
              <td className="px-4 py-3">
                {r.viewerId ? (
                  <span className="flex items-center gap-2">
                    <Avatar src={r.viewerId.avatar} name={r.viewerId.name || "?"} size="sm" />
                    <span>{r.viewerId.name || `#${r.viewerId.uid ?? "?"}`}</span>
                  </span>
                ) : (
                  <span style={{ color: THEME.textMuted }}>
                    {L("anonymous")} · <span className="font-mono text-xs">{r.ip}</span>
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right" style={{ color: THEME.textMuted }}>
                {formatDateTimeShort(r.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ L }: { L: (k: keyof typeof TXT) => string }) {
  return (
    <div className="py-16 text-center" style={{ color: THEME.textMuted }}>
      <Eye className="w-8 h-8 mx-auto mb-3 opacity-50" />
      {L("empty")}
    </div>
  );
}

export default function AdminViewsPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminViewsContent />
    </AuthGuard>
  );
}
