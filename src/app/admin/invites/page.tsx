"use client";

import AuthGuard from "@/components/common/AuthGuard";
import { Button } from "@/components/ui/button";
import { ADMIN_THEME as THEME } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { formatDateTimeShort } from "@/utils/dateUtils";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface Invite {
  _id: string;
  name: string;
  phone: string;
  category?: string;
  categoryKa?: string;
  subcategory?: string;
  subcategoryKa?: string;
  city?: string;
  type: "professional" | "service" | "tool-rental";
  status: "pending" | "sms_sent" | "opened" | "activated";
  openCount?: number;
  createdAt: string;
}

interface InviteStats {
  total: number;
  smsSent: number;
  opened: number;
  activated: number;
}

type StatusFilter = "all" | "pending" | "sms_sent" | "opened" | "activated";
type TypeFilter = "all" | "professional" | "service" | "tool-rental";

function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.length < 6) return phone;
  const first = cleaned.slice(0, 4);
  const last = cleaned.slice(-2);
  return `${first} ••• ${last}`;
}

function AdminInvitesPageContent() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();
  const toast = useToast();
  const router = useRouter();

  const [invites, setInvites] = useState<Invite[]>([]);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const lastFetchKeyRef = useRef<string>("");
  const lastFetchAtRef = useRef<number>(0);
  const hasLoadedOnceRef = useRef<boolean>(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(
    async (showRefresh = false) => {
      const fetchKey = `${page}-${search}-${statusFilter}-${typeFilter}`;
      const now = Date.now();
      if (
        !showRefresh &&
        lastFetchKeyRef.current === fetchKey &&
        now - lastFetchAtRef.current < 800
      ) {
        return;
      }
      lastFetchKeyRef.current = fetchKey;
      lastFetchAtRef.current = now;

      try {
        if (showRefresh || hasLoadedOnceRef.current) setIsRefreshing(true);
        else setIsLoading(true);

        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "20");
        if (search) params.set("search", search);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (typeFilter !== "all") params.set("type", typeFilter);

        const [invitesRes, statsRes] = await Promise.all([
          api.get(`/admin/invites?${params.toString()}`),
          api.get(`/admin/invites/stats`).catch(() => ({ data: null })),
        ]);

        setInvites(invitesRes.data.invites || invitesRes.data || []);
        setTotalPages(invitesRes.data.totalPages || 1);
        setTotalCount(invitesRes.data.total || 0);

        if (statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch invites:", err);
        toast.error(t("admin.failedToLoadInvites"));
      } finally {
        hasLoadedOnceRef.current = true;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, search, statusFilter, typeFilter, toast, t]
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(value);
    }, 400);
  };

  const handleResend = async (invite: Invite) => {
    setResendingId(invite._id);
    try {
      await api.patch(`/admin/invites/${invite._id}/resend`);
      setInvites((prev) =>
        prev.map((i) =>
          i._id === invite._id ? { ...i, status: "sms_sent" } : i
        )
      );
      toast.success(t("admin.inviteResent"));
    } catch (err) {
      console.error("Failed to resend invite:", err);
      toast.error(t("common.error"));
    } finally {
      setResendingId(null);
    }
  };

  const handleDelete = async (invite: Invite) => {
    if (!window.confirm(t("admin.confirmDeleteInvite"))) return;
    setDeletingId(invite._id);
    try {
      await api.delete(`/admin/invites/${invite._id}`);
      setInvites((prev) => prev.filter((i) => i._id !== invite._id));
      setTotalCount((c) => Math.max(0, c - 1));
      toast.success(t("admin.inviteDeleted"));
    } catch (err) {
      console.error("Failed to delete invite:", err);
      toast.error(t("common.error"));
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: Invite["status"]) => {
    switch (status) {
      case "pending":
        return THEME.textDim;
      case "sms_sent":
        return THEME.info;
      case "opened":
        return THEME.warning;
      case "activated":
        return THEME.success;
    }
  };

  const getStatusLabel = (status: Invite["status"]) => {
    switch (status) {
      case "pending":
        return t("admin.pending");
      case "sms_sent":
        return t("admin.smsSent");
      case "opened":
        return t("admin.opened");
      case "activated":
        return t("admin.activated");
    }
  };

  const getTypeColor = (type: Invite["type"]) => {
    switch (type) {
      case "professional":
        return THEME.info;
      case "service":
        return THEME.success;
      case "tool-rental":
        return "#F97316";
    }
  };

  const getTypeLabel = (type: Invite["type"]) => {
    switch (type) {
      case "professional":
        return t("admin.professional");
      case "service":
        return t("admin.service");
      case "tool-rental":
        return t("admin.toolRental");
    }
  };

  const getCategoryDisplay = (invite: Invite) => {
    const cat = locale === "ka" ? invite.categoryKa || invite.category : invite.category;
    const sub = locale === "ka" ? invite.subcategoryKa || invite.subcategory : invite.subcategory;
    if (cat && sub) return `${cat} · ${sub}`;
    return cat || sub || "—";
  };

  const statCards = [
    {
      label: t("admin.totalInvites"),
      value: stats?.total ?? totalCount,
      icon: Users,
      color: THEME.primary,
      filter: "all" as StatusFilter,
    },
    {
      label: t("admin.smsSent"),
      value: stats?.smsSent ?? 0,
      icon: Send,
      color: THEME.info,
      filter: "sms_sent" as StatusFilter,
    },
    {
      label: t("admin.opened"),
      value: stats?.opened ?? 0,
      icon: Mail,
      color: THEME.warning,
      filter: "opened" as StatusFilter,
    },
    {
      label: t("admin.activated"),
      value: stats?.activated ?? 0,
      icon: MessageSquare,
      color: THEME.success,
      filter: "activated" as StatusFilter,
    },
  ];

  const statusPills: { value: StatusFilter; label: string }[] = [
    { value: "all", label: t("common.all") || "All" },
    { value: "pending", label: t("admin.pending") },
    { value: "sms_sent", label: t("admin.smsSent") },
    { value: "opened", label: t("admin.opened") },
    { value: "activated", label: t("admin.activated") },
  ];

  const typePills: { value: TypeFilter; label: string }[] = [
    { value: "all", label: t("common.all") || "All" },
    { value: "professional", label: t("admin.professional") },
    { value: "service", label: t("admin.service") },
    { value: "tool-rental", label: t("admin.toolRental") },
  ];

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: THEME.surface }}
      >
        <div className="text-center">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
            }}
          >
            <Send className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <p className="mt-4 text-sm" style={{ color: THEME.textMuted }}>
            {t("admin.loadingInvites")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: THEME.surface }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: `${THEME.surface}E6`,
          borderBottom: `1px solid ${THEME.border}`,
        }}
      >
        <div className="max-w-[1800px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => router.push("/admin")}
                className="shrink-0 w-9 h-9 sm:w-10 sm:h-10"
                style={{
                  background: THEME.surfaceLight,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <ArrowLeft
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  style={{ color: THEME.textMuted }}
                />
              </Button>
              <div className="min-w-0">
                <h1
                  className="text-base sm:text-xl font-semibold tracking-tight truncate"
                  style={{
                    color: THEME.text,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {t("admin.inviteManagement")}
                </h1>
                <p
                  className="text-xs sm:text-sm hidden sm:block"
                  style={{ color: THEME.textMuted }}
                >
                  {t("admin.inviteManagementSubtitle")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden w-9 h-9"
                style={{
                  background: showFilters
                    ? `${THEME.primary}20`
                    : THEME.surfaceLight,
                  border: `1px solid ${
                    showFilters ? THEME.primary : THEME.border
                  }`,
                }}
              >
                <Filter
                  className="w-4 h-4"
                  style={{
                    color: showFilters ? THEME.primary : THEME.textMuted,
                  }}
                />
              </Button>

              <Button
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                loading={isRefreshing}
                size="sm"
                className="h-9 px-3 sm:px-4"
                style={{
                  background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})`,
                  boxShadow: `0 4px 16px ${THEME.primary}40`,
                }}
              >
                {!isRefreshing && <RefreshCw className="w-4 h-4 sm:mr-2" />}
                <span className="hidden sm:inline">{t("admin.refresh")}</span>
              </Button>
            </div>
          </div>

          {/* Mobile filters panel */}
          {showFilters && (
            <div
              className="mt-3 pt-3 border-t sm:hidden space-y-3"
              style={{ borderColor: THEME.border }}
            >
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={`${t("common.search")}...`}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: THEME.surfaceHover,
                  border: `1px solid ${THEME.border}`,
                  color: THEME.text,
                }}
              />
              <div className="flex flex-wrap gap-1.5">
                {statusPills.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setStatusFilter(p.value);
                      setPage(1);
                    }}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background:
                        statusFilter === p.value
                          ? `${THEME.primary}20`
                          : THEME.surfaceLight,
                      color:
                        statusFilter === p.value
                          ? THEME.primary
                          : THEME.textMuted,
                      border: `1px solid ${
                        statusFilter === p.value ? THEME.primary : THEME.border
                      }`,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              type="button"
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left"
              style={{
                background: THEME.surfaceLight,
                border: `1px solid ${
                  statusFilter === stat.filter
                    ? `${stat.color}66`
                    : THEME.border
                }`,
                boxShadow:
                  statusFilter === stat.filter
                    ? `0 0 0 3px ${stat.color}14`
                    : undefined,
              }}
              onClick={() => {
                setStatusFilter((prev) =>
                  prev === stat.filter ? "all" : stat.filter
                );
                setPage(1);
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `radial-gradient(circle at top right, ${stat.color}10, transparent 70%)`,
                }}
              />
              <div className="relative flex items-center gap-3 sm:gap-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}20` }}
                >
                  <stat.icon
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    style={{ color: stat.color }}
                  />
                </div>
                <div>
                  <p
                    className="text-xl sm:text-2xl font-bold tracking-tight"
                    style={{
                      color: THEME.text,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm" style={{ color: THEME.textMuted }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Filter Bar - Desktop */}
        <div
          className="hidden sm:flex items-center gap-3 mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl"
          style={{
            background: THEME.surfaceLight,
            border: `1px solid ${THEME.border}`,
          }}
        >
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={`${t("common.search")}...`}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{
                background: THEME.surfaceHover,
                border: `1px solid ${THEME.border}`,
                color: THEME.text,
              }}
            />
            <Filter
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: THEME.textDim }}
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5" style={{ color: THEME.textDim }} />
              </button>
            )}
          </div>

          {/* Divider */}
          <div
            className="w-px h-6 shrink-0"
            style={{ background: THEME.border }}
          />

          {/* Status pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusPills.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setStatusFilter(p.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background:
                    statusFilter === p.value
                      ? `${THEME.primary}20`
                      : "transparent",
                  color:
                    statusFilter === p.value ? THEME.primary : THEME.textMuted,
                  border: `1px solid ${
                    statusFilter === p.value ? THEME.primary : THEME.border
                  }`,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div
            className="w-px h-6 shrink-0"
            style={{ background: THEME.border }}
          />

          {/* Type pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {typePills.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setTypeFilter(p.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background:
                    typeFilter === p.value
                      ? `${THEME.info}20`
                      : "transparent",
                  color:
                    typeFilter === p.value ? THEME.info : THEME.textMuted,
                  border: `1px solid ${
                    typeFilter === p.value ? THEME.info : THEME.border
                  }`,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Invite List */}
        <div
          className="rounded-xl sm:rounded-2xl overflow-hidden"
          style={{
            background: THEME.surfaceLight,
            border: `1px solid ${THEME.border}`,
          }}
        >
          {/* Table header - desktop only */}
          <div
            className="hidden md:grid px-4 sm:px-6 py-3 sm:py-4 grid-cols-12 gap-3 text-xs font-medium uppercase tracking-wider"
            style={{
              borderBottom: `1px solid ${THEME.border}`,
              color: THEME.textDim,
            }}
          >
            <div className="col-span-3">{t("admin.user")}</div>
            <div className="col-span-3">{t("admin.inviteCategory")}</div>
            <div className="col-span-1">{t("admin.inviteCity")}</div>
            <div className="col-span-1">{t("admin.inviteType")}</div>
            <div className="col-span-1">{t("admin.inviteStatus")}</div>
            <div className="col-span-1">{t("admin.inviteOpenCount")}</div>
            <div className="col-span-1">{t("admin.joined")}</div>
            <div className="col-span-1 text-right">{t("admin.actions")}</div>
          </div>

          {/* Empty state */}
          {invites.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Send
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4"
                style={{ color: THEME.textDim }}
              />
              <p
                className="text-base sm:text-lg font-medium"
                style={{ color: THEME.textMuted }}
              >
                {t("admin.noInvitesFound")}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div
                className="md:hidden divide-y"
                style={{ borderColor: THEME.border }}
              >
                {invites.map((invite) => {
                  const statusColor = getStatusColor(invite.status);
                  const typeColor = getTypeColor(invite.type);
                  const canResend =
                    invite.status === "pending" ||
                    invite.status === "sms_sent" ||
                    invite.status === "opened";
                  return (
                    <div key={invite._id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                          style={{ background: `${typeColor}20`, color: typeColor }}
                        >
                          {invite.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p
                              className="font-medium text-sm"
                              style={{ color: THEME.text }}
                            >
                              {invite.name}
                            </p>
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium"
                              style={{
                                background: `${typeColor}20`,
                                color: typeColor,
                              }}
                            >
                              {getTypeLabel(invite.type)}
                            </span>
                          </div>
                          <p
                            className="text-xs mb-1.5"
                            style={{
                              color: THEME.textDim,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {maskPhone(invite.phone)}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium"
                              style={{
                                background: `${statusColor}20`,
                                color: statusColor,
                              }}
                            >
                              {getStatusLabel(invite.status)}
                            </span>
                            {invite.city && (
                              <span
                                className="text-[10px]"
                                style={{ color: THEME.textDim }}
                              >
                                {invite.city}
                              </span>
                            )}
                            {(invite.openCount ?? 0) > 0 && (
                              <span
                                className="text-[10px]"
                                style={{ color: THEME.warning }}
                              >
                                {invite.openCount}x
                              </span>
                            )}
                          </div>
                          {getCategoryDisplay(invite) !== "—" && (
                            <p
                              className="text-[10px] mt-1 truncate"
                              style={{ color: THEME.textDim }}
                            >
                              {getCategoryDisplay(invite)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p
                            className="text-[10px] whitespace-nowrap"
                            style={{
                              color: THEME.textDim,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {formatDateTimeShort(
                              invite.createdAt,
                              locale as "en" | "ka" | "ru"
                            )}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {canResend && (
                              <button
                                onClick={() => handleResend(invite)}
                                disabled={resendingId === invite._id}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50"
                                style={{ background: `${THEME.info}20` }}
                                title={t("admin.resendSms")}
                              >
                                {resendingId === invite._id ? (
                                  <RefreshCw
                                    className="w-3.5 h-3.5 animate-spin"
                                    style={{ color: THEME.info }}
                                  />
                                ) : (
                                  <Send
                                    className="w-3.5 h-3.5"
                                    style={{ color: THEME.info }}
                                  />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(invite)}
                              disabled={deletingId === invite._id}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50"
                              style={{ background: `${THEME.error}20` }}
                              title={t("common.delete")}
                            >
                              <Trash2
                                className="w-3.5 h-3.5"
                                style={{ color: THEME.error }}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block">
                {invites.map((invite, index) => {
                  const statusColor = getStatusColor(invite.status);
                  const typeColor = getTypeColor(invite.type);
                  const canResend =
                    invite.status === "pending" ||
                    invite.status === "sms_sent" ||
                    invite.status === "opened";
                  return (
                    <div
                      key={invite._id}
                      className="px-4 sm:px-6 py-3 sm:py-4 grid grid-cols-12 gap-3 items-center transition-colors"
                      style={{
                        borderBottom:
                          index < invites.length - 1
                            ? `1px solid ${THEME.border}`
                            : "none",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = THEME.surfaceHover)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {/* Name + phone */}
                      <div className="col-span-3 flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                          style={{
                            background: `${typeColor}20`,
                            color: typeColor,
                          }}
                        >
                          {invite.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-medium text-sm truncate"
                            style={{ color: THEME.text }}
                          >
                            {invite.name}
                          </p>
                          <p
                            className="text-xs"
                            style={{
                              color: THEME.textDim,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {maskPhone(invite.phone)}
                          </p>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="col-span-3">
                        <p
                          className="text-xs truncate"
                          style={{ color: THEME.textMuted }}
                          title={getCategoryDisplay(invite)}
                        >
                          {getCategoryDisplay(invite)}
                        </p>
                      </div>

                      {/* City */}
                      <div className="col-span-1">
                        <p
                          className="text-xs truncate"
                          style={{ color: THEME.textMuted }}
                        >
                          {invite.city || "—"}
                        </p>
                      </div>

                      {/* Type badge */}
                      <div className="col-span-1">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
                          style={{
                            background: `${typeColor}20`,
                            color: typeColor,
                          }}
                        >
                          {getTypeLabel(invite.type)}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div className="col-span-1">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
                          style={{
                            background: `${statusColor}20`,
                            color: statusColor,
                          }}
                        >
                          {getStatusLabel(invite.status)}
                        </span>
                      </div>

                      {/* Open count */}
                      <div className="col-span-1">
                        <p
                          className="text-sm font-medium"
                          style={{
                            color:
                              (invite.openCount ?? 0) > 0
                                ? THEME.warning
                                : THEME.textDim,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {invite.openCount ?? 0}
                        </p>
                      </div>

                      {/* Created date */}
                      <div className="col-span-1">
                        <p
                          className="text-xs whitespace-nowrap"
                          style={{
                            color: THEME.textMuted,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {formatDateTimeShort(
                            invite.createdAt,
                            locale as "en" | "ka" | "ru"
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-end gap-2">
                        {canResend && (
                          <button
                            onClick={() => handleResend(invite)}
                            disabled={resendingId === invite._id}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                            style={{ background: `${THEME.info}20` }}
                            title={t("admin.resendSms")}
                          >
                            {resendingId === invite._id ? (
                              <RefreshCw
                                className="w-4 h-4 animate-spin"
                                style={{ color: THEME.info }}
                              />
                            ) : (
                              <Send
                                className="w-4 h-4"
                                style={{ color: THEME.info }}
                              />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(invite)}
                          disabled={deletingId === invite._id}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                          style={{ background: `${THEME.error}20` }}
                          title={t("common.delete")}
                        >
                          <Trash2
                            className="w-4 h-4"
                            style={{ color: THEME.error }}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 sm:mt-6 px-1">
            <p className="text-xs sm:text-sm" style={{ color: THEME.textMuted }}>
              {locale === "ka"
                ? `გვერდი ${page} / ${totalPages}`
                : `Page ${page} of ${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 sm:w-10 sm:h-10"
                style={{
                  background: THEME.surfaceLight,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <ChevronLeft
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  style={{ color: THEME.textMuted }}
                />
              </Button>

              <div className="hidden sm:flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, totalPages) },
                  (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className="w-9 h-9 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background:
                            page === pageNum ? THEME.primary : "transparent",
                          color:
                            page === pageNum ? "#fff" : THEME.textMuted,
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              <Button
                variant="secondary"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 sm:w-10 sm:h-10"
                style={{
                  background: THEME.surfaceLight,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <ChevronRight
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  style={{ color: THEME.textMuted }}
                />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminInvitesPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminInvitesPageContent />
    </AuthGuard>
  );
}
