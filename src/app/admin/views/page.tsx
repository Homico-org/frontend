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
import { Eye, Phone, RefreshCw, Trophy, List as ListIcon } from "lucide-react";
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
  _id?: string;
  name?: string;
  avatar?: string;
  uid?: number;
}
interface LogRow {
  _id: string;
  proId?: RefLite | null;
  viewerId?: RefLite | null;
  viewerName?: string | null;
  ip: string;
  createdAt: string;
}

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
};

function AdminViewsContent() {
  const { locale } = useLanguage();
  const toast = useToast();
  const L = (k: keyof typeof TXT) => TXT[k][(locale as "en" | "ka" | "ru")] || TXT[k].en;

  const [type, setType] = useState<ViewType>("phone");
  const [tab, setTab] = useState<Tab>("ranking");
  const [ranking, setRanking] = useState<RankRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (tab === "ranking") {
        const res = await api.get(`/admin/view-stats?type=${type}&limit=50`);
        setRanking(res.data.items || []);
      } else {
        const res = await api.get(`/admin/view-logs?type=${type}&limit=100`);
        setLogs(res.data.items || []);
      }
    } catch (err) {
      console.error("Failed to load view tracking:", err);
      toast.error(L("empty"));
    } finally {
      setIsLoading(false);
    }
  }, [type, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const Toggle = ({
    active,
    onClick,
    icon: Icon,
    label,
  }: {
    active: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }) => (
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
        <Button onClick={fetchData} size="sm" variant="secondary" className="h-9">
          <RefreshCw className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">{L("refresh")}</span>
        </Button>
      </div>

      {/* Type toggle: phone / profile */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Toggle active={type === "phone"} onClick={() => setType("phone")} icon={Phone} label={L("phone")} />
        <Toggle active={type === "profile"} onClick={() => setType("profile")} icon={Eye} label={L("profile")} />
      </div>

      {/* Tab toggle: ranking / journal */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Toggle active={tab === "ranking"} onClick={() => setTab("ranking")} icon={Trophy} label={L("ranking")} />
        <Toggle active={tab === "journal"} onClick={() => setTab("journal")} icon={ListIcon} label={L("journal")} />
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : tab === "ranking" ? (
        <RankingTable rows={ranking} L={L} />
      ) : (
        <JournalTable rows={logs} L={L} />
      )}
    </div>
  );
}

function RankingTable({ rows, L }: { rows: RankRow[]; L: (k: keyof typeof TXT) => string }) {
  if (!rows.length) return <EmptyState L={L} />;
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
              <td className="px-4 py-3" style={{ color: THEME.textMuted }}>{i + 1}</td>
              <td className="px-4 py-3">
                <Link href={`/professionals/${r.proId}`} className="flex items-center gap-2 hover:underline">
                  <Avatar src={r.proAvatar} name={r.proName || "?"} size="sm" />
                  <span>{r.proName || `#${r.proUid ?? "?"}`}</span>
                </Link>
              </td>
              <td className="px-4 py-3 text-right font-semibold">{r.count}</td>
              <td className="px-4 py-3 text-right hidden sm:table-cell" style={{ color: THEME.textMuted }}>
                {r.lastViewedAt ? formatDateTimeShort(r.lastViewedAt) : "—"}
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
            <tr key={r._id} style={{ borderTop: `1px solid ${THEME.border}`, color: THEME.text }}>
              <td className="px-4 py-3">
                {r.proId ? (
                  <Link href={`/professionals/${r.proId._id}`} className="flex items-center gap-2 hover:underline">
                    <Avatar src={r.proId.avatar} name={r.proId.name || "?"} size="sm" />
                    <span>{r.proId.name || `#${r.proId.uid ?? "?"}`}</span>
                  </Link>
                ) : (
                  <span style={{ color: THEME.textMuted }}>—</span>
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
