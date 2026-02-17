"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Avatar from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ADMIN_THEME as THEME } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { formatDateTimeShort } from "@/utils/dateUtils";
import { getAdminRoleColor, getAdminRoleLabel } from "@/utils/statusUtils";
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  ExternalLink,
  Eye,
  Facebook,
  Filter,
  Globe,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  RefreshCw,
  Shield,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: "client" | "pro" | "admin";
  avatar?: string;
  isVerified?: boolean;
  isActive?: boolean;
  isSuspended?: boolean;
  location?: string;
  createdAt: string;
  lastLoginAt?: string;
  verificationStatus?: "pending" | "submitted" | "verified" | "rejected";
  idDocumentUrl?: string;
  idDocumentBackUrl?: string;
  selfieWithIdUrl?: string;
  verificationSubmittedAt?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

interface UserStats {
  total: number;
  clients: number;
  pros: number;
  companies: number;
  admins: number;
  verifiedPros: number;
  suspended: number;
  thisWeek: number;
  thisMonth: number;
}

function AdminUsersPageContent() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();
  const toast = useToast();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showVerificationModal, setShowVerificationModal] = useState<User | null>(null);
  const [verificationAction, setVerificationAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isProcessingVerification, setIsProcessingVerification] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const getUserId = useCallback((u: User) => u._id || u.id || "", []);

  const getUserProfileHref = useCallback(
    (u: User) => {
      const id = getUserId(u);
      if (!id) return null;
      if (u.role === "pro") return `/professionals/${id}`;
      return `/users/${id}`;
    },
    [getUserId]
  );

  const lastFetchKeyRef = useRef<string>("");
  const lastFetchAtRef = useRef<number>(0);
  const hasLoadedOnceRef = useRef<boolean>(false);

  const fetchData = useCallback(
    async (showRefresh = false) => {
      const fetchKey = `${page}-${roleFilter}-${verificationFilter}`;
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
        if (roleFilter !== "all") params.set("role", roleFilter);
        if (verificationFilter !== "all")
          params.set("verificationStatus", verificationFilter);

        const statsRes = await api.get(`/admin/stats`).catch((err) => {
          console.error("Failed to fetch /admin/stats:", err.response?.status, err.response?.data || err.message);
          return { data: { users: {} } };
        });

        let usersData: User[] = [];
        let totalPagesData = 1;

        try {
          const usersRes = await api.get(`/admin/users?${params.toString()}`);
          usersData = usersRes.data.users || [];
          totalPagesData = usersRes.data.totalPages || 1;
        } catch (err) {
          const apiErr = err as { response?: { status?: number; data?: unknown }; message?: string };
          console.error("Failed to fetch /admin/users:", apiErr.response?.status, apiErr.response?.data || apiErr.message);
          try {
            const recentRes = await api.get(`/admin/recent-users?limit=50`);
            usersData = recentRes.data || [];
          } catch (fallbackErr) {
            console.error("Fallback also failed:", fallbackErr);
          }
        }

        setUsers(usersData);
        setTotalPages(totalPagesData);
        setStats({
          total: statsRes.data.users?.total || 0,
          clients: statsRes.data.users?.clients || 0,
          pros: statsRes.data.users?.pros || 0,
          companies: statsRes.data.users?.companies || 0,
          admins: statsRes.data.users?.admins || 0,
          verifiedPros: statsRes.data.users?.verifiedPros || 0,
          suspended: statsRes.data.users?.suspended || 0,
          thisWeek: statsRes.data.users?.thisWeek || 0,
          thisMonth: statsRes.data.users?.thisMonth || 0,
        });
      } catch (err) {
        console.error("Failed to fetch users:", err);
        toast.error(locale === "ka" ? "ვერ მოხერხდა მომხმარებლების ჩატვირთვა" : "Failed to load users");
      } finally {
        hasLoadedOnceRef.current = true;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, roleFilter, verificationFilter, toast, locale]
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, verificationFilter]);

  const getRoleColor = (role: string) => getAdminRoleColor(role);
  const getRoleLabel = (role: string) => getAdminRoleLabel(role, locale as "en" | "ka" | "ru");

  const handleVerificationAction = async (action: "approve" | "reject") => {
    if (!showVerificationModal) return;

    setIsProcessingVerification(true);
    try {
      await api.patch(`/admin/users/${showVerificationModal._id}/verification`, {
        status: action === "approve" ? "verified" : "rejected",
        rejectionNote: action === "reject" ? rejectionNote : undefined,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u._id === showVerificationModal._id
            ? { ...u, verificationStatus: action === "approve" ? "verified" : "rejected" }
            : u
        )
      );

      toast.success(
        action === "approve"
          ? locale === "ka" ? "დამტკიცებულია" : "Approved"
          : locale === "ka" ? "უარყოფილია" : "Rejected"
      );

      setShowVerificationModal(null);
      setVerificationAction(null);
      setRejectionNote("");
    } catch (err) {
      console.error("Failed to update verification:", err);
      toast.error(locale === "ka" ? "ვერ მოხერხდა განახლება" : "Failed to update");
    } finally {
      setIsProcessingVerification(false);
    }
  };

  const statCards = useMemo(
    () => [
      { label: t("admin.totalUsers"), value: stats?.total || 0, icon: Users, color: THEME.primary, role: "all" },
      { label: t("admin.clients"), value: stats?.clients || 0, icon: UserCheck, color: THEME.success, role: "client" },
      { label: t("admin.professionals"), value: stats?.pros || 0, icon: Shield, color: THEME.info, role: "pro" },
    ],
    [stats?.clients, stats?.companies, stats?.pros, stats?.total, t]
  );

  const getStatusBadge = (user: User) => {
    if (user.isSuspended) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
          style={{ background: `${THEME.error}20`, color: THEME.error }}
        >
          <Ban className="w-3 h-3" />
          {t("admin.suspended")}
        </span>
      );
    }

    if (user.role === "pro") {
      if (user.verificationStatus === "submitted") {
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowVerificationModal(user);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-transform active:scale-95"
            style={{ background: `${THEME.warning}20`, color: THEME.warning }}
          >
            <Clock className="w-3 h-3" />
            {t("admin.review")}
          </button>
        );
      }
      if (user.verificationStatus === "verified") {
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
            style={{ background: `${THEME.success}20`, color: THEME.success }}
          >
            <BadgeCheck className="w-3 h-3" />
            {t("admin.verified")}
          </span>
        );
      }
      if (user.verificationStatus === "rejected") {
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
            style={{ background: `${THEME.error}20`, color: THEME.error }}
          >
            <XCircle className="w-3 h-3" />
            {t("common.rejected")}
          </span>
        );
      }
    }

    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
        style={{ background: `${THEME.success}20`, color: THEME.success }}
      >
        <CheckCircle className="w-3 h-3" />
        {t("common.active")}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: THEME.surface }}>
        <div className="text-center">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto animate-pulse"
            style={{ background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark})` }}
          >
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <p className="mt-4 text-sm" style={{ color: THEME.textMuted }}>
            {t("admin.loadingUsers")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: THEME.surface }}>
      {/* Header - Mobile First */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: `${THEME.surface}E6`, borderBottom: `1px solid ${THEME.border}` }}
      >
        <div className="max-w-[1800px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => router.push("/admin")}
                className="shrink-0 w-9 h-9 sm:w-10 sm:h-10"
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: THEME.textMuted }} />
              </Button>
              <div className="min-w-0">
                <h1
                  className="text-base sm:text-xl font-semibold tracking-tight truncate"
                  style={{ color: THEME.text, fontFamily: "'Inter', sans-serif" }}
                >
                  {t("admin.userManagement")}
                </h1>
                <p className="text-xs sm:text-sm hidden sm:block" style={{ color: THEME.textMuted }}>
                  {stats?.total.toLocaleString() || 0} {t("admin.usersTotal")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Filter Toggle */}
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden w-9 h-9"
                style={{
                  background: showFilters ? `${THEME.primary}20` : THEME.surfaceLight,
                  border: `1px solid ${showFilters ? THEME.primary : THEME.border}`,
                }}
              >
                <Filter className="w-4 h-4" style={{ color: showFilters ? THEME.primary : THEME.textMuted }} />
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

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t sm:hidden" style={{ borderColor: THEME.border }}>
              <div className="flex flex-wrap gap-2">
                {statCards.map((stat) => (
                  <button
                    key={stat.role}
                    onClick={() => {
                      setRoleFilter((prev) => (prev === stat.role ? "all" : stat.role));
                      setPage(1);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: roleFilter === stat.role ? `${stat.color}20` : THEME.surfaceLight,
                      color: roleFilter === stat.role ? stat.color : THEME.textMuted,
                      border: `1px solid ${roleFilter === stat.role ? stat.color : THEME.border}`,
                    }}
                  >
                    <stat.icon className="w-3 h-3" />
                    {stat.label}
                    <span className="font-bold">{stat.value}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Stats Grid - Desktop */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: THEME.surfaceLight,
                border: `1px solid ${stat.role === roleFilter ? `${stat.color}66` : THEME.border}`,
                boxShadow: stat.role === roleFilter ? `0 0 0 3px ${stat.color}14` : undefined,
              }}
              onClick={() => {
                setRoleFilter((prev) => (prev === stat.role ? "all" : stat.role));
                setPage(1);
              }}
              type="button"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `radial-gradient(circle at top right, ${stat.color}10, transparent 70%)` }}
              />
              <div className="relative flex items-center gap-3 sm:gap-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}20` }}
                >
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: stat.color }} />
                </div>
                <div className="text-left">
                  <p
                    className="text-xl sm:text-2xl font-bold tracking-tight"
                    style={{ color: THEME.text, fontFamily: "'JetBrains Mono', monospace" }}
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

        {/* Mobile Stats Summary */}
        <div className="sm:hidden flex items-center justify-between mb-4 px-1">
          <p className="text-sm font-medium" style={{ color: THEME.text }}>
            {stats?.total.toLocaleString() || 0} {t("admin.usersTotal")}
          </p>
          {roleFilter !== "all" && (
            <button
              onClick={() => setRoleFilter("all")}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{ background: `${THEME.primary}20`, color: THEME.primary }}
            >
              <X className="w-3 h-3" />
              {t("common.clearFilter")}
            </button>
          )}
        </div>

        {/* Users List */}
        <div
          className="rounded-xl sm:rounded-2xl overflow-hidden"
          style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
        >
          {/* Table Header - Desktop Only */}
          <div
            className="hidden md:grid px-4 sm:px-6 py-3 sm:py-4 grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider"
            style={{ borderBottom: `1px solid ${THEME.border}`, color: THEME.textDim }}
          >
            <div className="col-span-4">{t("admin.user")}</div>
            <div className="col-span-2">{t("admin.role")}</div>
            <div className="col-span-2">{t("common.status")}</div>
            <div className="col-span-2">{t("admin.joined")}</div>
            <div className="col-span-2 text-right">{t("admin.actions")}</div>
          </div>

          {/* Empty State */}
          {users.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: THEME.textDim }} />
              <p className="text-base sm:text-lg font-medium" style={{ color: THEME.textMuted }}>
                {t("admin.noUsersFound")}
              </p>
              <p className="text-sm mt-1" style={{ color: THEME.textDim }}>
                {t("admin.tryAdjustingYourSearchOr")}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y" style={{ borderColor: THEME.border }}>
                {users.map((user, index) => (
                  <div
                    key={getUserId(user) || `user-${index}`}
                    className="p-4 active:bg-opacity-50 transition-colors"
                    style={{ background: "transparent" }}
                    onClick={() => {
                      const href = getUserProfileHref(user);
                      if (href) router.push(href);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar src={user.avatar} name={user.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate" style={{ color: THEME.text }}>
                            {user.name}
                          </p>
                          {user.isVerified && (
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: THEME.success }} />
                          )}
                        </div>
                        <p className="text-xs truncate mb-2" style={{ color: THEME.textDim }}>
                          {user.email}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                            style={{ background: `${getRoleColor(user.role)}20`, color: getRoleColor(user.role) }}
                          >
                            {user.role === "admin" && <Crown className="w-3 h-3" />}
                            {getRoleLabel(user.role)}
                          </span>
                          {getStatusBadge(user)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p
                          className="text-[10px] whitespace-nowrap"
                          style={{ color: THEME.textDim, fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {formatDateTimeShort(user.createdAt, locale as "en" | "ka" | "ru")}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const href = getUserProfileHref(user);
                            if (href) router.push(href);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform active:scale-90"
                          style={{ background: `${THEME.info}20` }}
                        >
                          <Eye className="w-4 h-4" style={{ color: THEME.info }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                {users.map((user, index) => (
                  <div
                    key={getUserId(user) || `user-${index}`}
                    className="px-4 sm:px-6 py-3 sm:py-4 grid grid-cols-12 gap-4 items-center transition-colors cursor-pointer"
                    style={{ borderBottom: index < users.length - 1 ? `1px solid ${THEME.border}` : "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surfaceHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => {
                      const href = getUserProfileHref(user);
                      if (href) router.push(href);
                    }}
                  >
                    {/* User Info */}
                    <div className="col-span-4 flex items-center gap-3">
                      <Avatar src={user.avatar} name={user.name} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate" style={{ color: THEME.text }}>
                            {user.name}
                          </p>
                          {user.isVerified && (
                            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: THEME.success }} />
                          )}
                        </div>
                        <p className="text-xs truncate" style={{ color: THEME.textDim }}>
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="col-span-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ background: `${getRoleColor(user.role)}20`, color: getRoleColor(user.role) }}
                      >
                        {user.role === "admin" && <Crown className="w-3 h-3" />}
                        {getRoleLabel(user.role)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">{getStatusBadge(user)}</div>

                    {/* Joined */}
                    <div className="col-span-2">
                      <p
                        className="text-sm"
                        style={{ color: THEME.textMuted, fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {formatDateTimeShort(user.createdAt, locale as "en" | "ka" | "ru")}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const href = getUserProfileHref(user);
                          if (href) router.push(href);
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: `${THEME.info}20` }}
                        title={t("admin.viewProfile")}
                      >
                        <Eye className="w-4 h-4" style={{ color: THEME.info }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 sm:mt-6 px-1">
            <p className="text-xs sm:text-sm" style={{ color: THEME.textMuted }}>
              {locale === "ka" ? `გვერდი ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 sm:w-10 sm:h-10"
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: THEME.textMuted }} />
              </Button>

              {/* Page Numbers - Desktop Only */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                        background: page === pageNum ? THEME.primary : "transparent",
                        color: page === pageNum ? "#fff" : THEME.textMuted,
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="secondary"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 sm:w-10 sm:h-10"
                style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: THEME.textMuted }} />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowVerificationModal(null);
              setVerificationAction(null);
              setRejectionNote("");
            }}
          />
          <div
            className="relative w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
            style={{ background: THEME.surfaceLight, border: `1px solid ${THEME.border}` }}
          >
            {/* Mobile Handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: THEME.border }} />
            </div>

            {/* Header */}
            <div
              className="sticky top-0 z-10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between"
              style={{ background: THEME.surfaceLight, borderBottom: `1px solid ${THEME.border}` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={showVerificationModal.avatar} name={showVerificationModal.name} size="md" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate" style={{ color: THEME.text }}>
                    {showVerificationModal.name}
                  </h3>
                  <p className="text-xs sm:text-sm truncate" style={{ color: THEME.textMuted }}>
                    {showVerificationModal.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowVerificationModal(null);
                  setVerificationAction(null);
                  setRejectionNote("");
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
                style={{ background: THEME.surface }}
              >
                <XCircle className="w-5 h-5" style={{ color: THEME.textMuted }} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* ID Documents Section */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: THEME.text }}>
                  <ImageIcon className="w-4 h-4" style={{ color: THEME.primary }} />
                  {t("admin.idDocuments")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* ID Front */}
                  <div className="rounded-xl p-3" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
                    <p className="text-xs mb-2" style={{ color: THEME.textDim }}>
                      {t("admin.idFront")}
                    </p>
                    {showVerificationModal.idDocumentUrl ? (
                      <a
                        href={showVerificationModal.idDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block aspect-video rounded-lg overflow-hidden bg-black/20 active:opacity-80 transition-opacity"
                      >
                        <NextImage
                          src={showVerificationModal.idDocumentUrl}
                          alt="ID Front"
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      </a>
                    ) : (
                      <div className="aspect-video rounded-lg flex items-center justify-center" style={{ background: THEME.surfaceHover }}>
                        <p className="text-xs" style={{ color: THEME.textDim }}>
                          {t("admin.notUploaded")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ID Back */}
                  <div className="rounded-xl p-3" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
                    <p className="text-xs mb-2" style={{ color: THEME.textDim }}>
                      {t("admin.idBack")}
                    </p>
                    {showVerificationModal.idDocumentBackUrl ? (
                      <a
                        href={showVerificationModal.idDocumentBackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block aspect-video rounded-lg overflow-hidden bg-black/20 active:opacity-80 transition-opacity"
                      >
                        <NextImage
                          src={showVerificationModal.idDocumentBackUrl}
                          alt="ID Back"
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      </a>
                    ) : (
                      <div className="aspect-video rounded-lg flex items-center justify-center" style={{ background: THEME.surfaceHover }}>
                        <p className="text-xs" style={{ color: THEME.textDim }}>
                          {t("admin.notUploaded")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Selfie with ID */}
                  <div className="rounded-xl p-3" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
                    <p className="text-xs mb-2" style={{ color: THEME.textDim }}>
                      {t("admin.selfieWithId")}
                    </p>
                    {showVerificationModal.selfieWithIdUrl ? (
                      <a
                        href={showVerificationModal.selfieWithIdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block aspect-video rounded-lg overflow-hidden bg-black/20 active:opacity-80 transition-opacity"
                      >
                        <NextImage
                          src={showVerificationModal.selfieWithIdUrl}
                          alt="Selfie with ID"
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      </a>
                    ) : (
                      <div className="aspect-video rounded-lg flex items-center justify-center" style={{ background: THEME.surfaceHover }}>
                        <p className="text-xs" style={{ color: THEME.textDim }}>
                          {t("admin.notUploaded")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Links Section */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: THEME.text }}>
                  <Globe className="w-4 h-4" style={{ color: THEME.primary }} />
                  {t("admin.socialLinks")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {showVerificationModal.facebookUrl && (
                    <a
                      href={showVerificationModal.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all active:scale-[0.98]"
                      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                    >
                      <Facebook className="w-5 h-5" style={{ color: "#1877F2" }} />
                      <span className="text-sm truncate flex-1" style={{ color: THEME.text }}>
                        Facebook
                      </span>
                      <ExternalLink className="w-3 h-3" style={{ color: THEME.textDim }} />
                    </a>
                  )}
                  {showVerificationModal.instagramUrl && (
                    <a
                      href={showVerificationModal.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all active:scale-[0.98]"
                      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                    >
                      <Instagram className="w-5 h-5" style={{ color: "#E4405F" }} />
                      <span className="text-sm truncate flex-1" style={{ color: THEME.text }}>
                        Instagram
                      </span>
                      <ExternalLink className="w-3 h-3" style={{ color: THEME.textDim }} />
                    </a>
                  )}
                  {showVerificationModal.linkedinUrl && (
                    <a
                      href={showVerificationModal.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all active:scale-[0.98]"
                      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                    >
                      <Linkedin className="w-5 h-5" style={{ color: "#0A66C2" }} />
                      <span className="text-sm truncate flex-1" style={{ color: THEME.text }}>
                        LinkedIn
                      </span>
                      <ExternalLink className="w-3 h-3" style={{ color: THEME.textDim }} />
                    </a>
                  )}
                  {showVerificationModal.websiteUrl && (
                    <a
                      href={showVerificationModal.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all active:scale-[0.98]"
                      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
                    >
                      <Globe className="w-5 h-5" style={{ color: THEME.primary }} />
                      <span className="text-sm truncate flex-1" style={{ color: THEME.text }}>
                        Website
                      </span>
                      <ExternalLink className="w-3 h-3" style={{ color: THEME.textDim }} />
                    </a>
                  )}
                  {!showVerificationModal.facebookUrl &&
                    !showVerificationModal.instagramUrl &&
                    !showVerificationModal.linkedinUrl &&
                    !showVerificationModal.websiteUrl && (
                      <p className="col-span-full text-sm py-4 text-center" style={{ color: THEME.textDim }}>
                        {t("admin.noSocialLinksAdded")}
                      </p>
                    )}
                </div>
              </div>

              {/* Rejection Note */}
              {verificationAction === "reject" && (
                <div>
                  <h4 className="text-sm font-medium mb-3" style={{ color: THEME.text }}>
                    {t("admin.rejectionReason")}
                  </h4>
                  <Textarea
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder={t("admin.enterRejectionReason")}
                    rows={3}
                    style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, color: THEME.text }}
                  />
                </div>
              )}

              {/* Submitted Date */}
              {showVerificationModal.verificationSubmittedAt && (
                <p className="text-xs" style={{ color: THEME.textDim }}>
                  {t("admin.submitted")} {formatDateTimeShort(showVerificationModal.verificationSubmittedAt, locale as "en" | "ka" | "ru")}
                </p>
              )}
            </div>

            {/* Footer Actions */}
            <div
              className="sticky bottom-0 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-3"
              style={{ background: THEME.surfaceLight, borderTop: `1px solid ${THEME.border}` }}
            >
              {verificationAction === "reject" ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setVerificationAction(null)}
                    className="order-2 sm:order-1"
                    style={{ background: THEME.surface, color: THEME.textMuted }}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleVerificationAction("reject")}
                    disabled={isProcessingVerification || !rejectionNote.trim()}
                    loading={isProcessingVerification}
                    className="order-1 sm:order-2"
                  >
                    {t("admin.confirmReject")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setVerificationAction("reject")}
                    leftIcon={<XCircle className="w-4 h-4" />}
                    className="order-2 sm:order-1"
                    style={{ background: `${THEME.error}20`, color: THEME.error, borderColor: THEME.error }}
                  >
                    {t("admin.reject")}
                  </Button>
                  <Button
                    onClick={() => handleVerificationAction("approve")}
                    disabled={isProcessingVerification}
                    loading={isProcessingVerification}
                    leftIcon={!isProcessingVerification ? <BadgeCheck className="w-4 h-4" /> : undefined}
                    className="order-1 sm:order-2"
                    style={{
                      background: `linear-gradient(135deg, ${THEME.success}, #16A34A)`,
                      boxShadow: `0 4px 16px ${THEME.success}40`,
                    }}
                  >
                    {t("admin.approve")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AdminUsersPageContent />
    </AuthGuard>
  );
}
