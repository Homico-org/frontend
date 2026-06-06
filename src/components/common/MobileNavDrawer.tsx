"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCountryLink } from "@/hooks/useCountry";
import { storage } from "@/services/storage";
import { UserRole } from "@/types/shared/enums";
import {
  Bell,
  Briefcase,
  HelpCircle,
  Home,
  Info,
  LayoutDashboard,
  ListChecks,
  LogIn,
  LogOut,
  Plus,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavLink {
  key: string;
  href?: string;
  label: string;
  icon: typeof Home;
  onClick?: () => void;
  external?: boolean;
  // Indented, muted sub-row (e.g. an individual project under "Projects").
  subtle?: boolean;
}

interface ProjectLite {
  id?: string;
  _id?: string;
  title: string;
}

interface NavSection {
  key: string;
  title?: string;
  items: NavLink[];
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
}: MobileNavDrawerProps) {
  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { openLoginModal } = useAuthModal();
  const cl = useCountryLink();

  const isPro = user?.role === UserRole.PRO;
  const isClient = user?.role === UserRole.CLIENT;
  const isAdmin = user?.role === UserRole.ADMIN;

  // The user's real projects, listed as sub-rows under "Projects".
  const [projects, setProjects] = useState<ProjectLite[] | null>(null);
  useEffect(() => {
    if (!isAuthenticated) {
      setProjects(null);
      return;
    }
    let cancelled = false;
    api
      .get("/projects")
      .then((r) => {
        if (!cancelled) setProjects((r.data as ProjectLite[]) || []);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Lock body scroll while open. Restore on close/unmount.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleNav = (action?: () => void) => () => {
    action?.();
    onClose();
  };

  const handleLogin = () => {
    onClose();
    openLoginModal();
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  // Build nav sections by auth state.
  const sections: NavSection[] = [];

  // BROWSE - always visible
  sections.push({
    key: "browse",
    title: t("nav.sectionWork"),
    items: [
      { key: "home", href: cl("/"), label: t("nav.home"), icon: Home },
      {
        key: "pros",
        href: cl("/professionals"),
        label: t("header.professionals"),
        icon: Users,
      },
      {
        key: "jobs",
        href: cl("/jobs"),
        label: t("nav.jobs"),
        icon: Briefcase,
      },
      {
        key: "shop",
        href: "/shop",
        label: t("header.shop"),
        icon: ShoppingBag,
      },
    ],
  });

  // PERSONAL - auth only
  if (isAuthenticated) {
    const personalItems: NavLink[] = [];
    personalItems.push({
      key: "projects",
      href: "/projects",
      label: t("header.projects"),
      icon: ListChecks,
    });
    // Each real project as an indented sub-row under "Projects".
    (projects ?? []).slice(0, 6).forEach((p) => {
      const pid = p.id || p._id;
      personalItems.push({
        key: `proj-${pid}`,
        href: `/projects/${pid}`,
        label: p.title || t("header.projects"),
        icon: ListChecks,
        subtle: true,
      });
    });
    if (isClient) {
      personalItems.push({
        key: "my-jobs",
        href: cl("/my-jobs"),
        label: t("header.myJobs"),
        icon: Briefcase,
      });
      personalItems.push({
        key: "post-job",
        href: cl("/post-job"),
        label: t("common.post"),
        icon: Plus,
      });
    }
    if (isPro) {
      personalItems.push({
        key: "my-work",
        href: cl("/my-work"),
        label: t("header.myWork"),
        icon: Briefcase,
      });
      personalItems.push({
        key: "my-proposals",
        href: cl("/my-proposals"),
        label: t("header.proposals"),
        icon: Star,
      });
    }
    personalItems.push({
      key: "notifications",
      href: cl("/notifications"),
      label: t("common.notifications"),
      icon: Bell,
    });
    personalItems.push({
      key: "settings",
      href: cl("/settings"),
      label: t("common.settings"),
      icon: Settings,
    });

    sections.push({
      key: "personal",
      title: t("nav.sectionAccount"),
      items: personalItems,
    });
  }

  // ADMIN - admin only
  if (isAdmin) {
    sections.push({
      key: "admin",
      title: "Admin",
      items: [
        {
          key: "admin",
          href: "/admin",
          label: "Admin",
          icon: LayoutDashboard,
        },
      ],
    });
  }

  // RESOURCES - always visible
  sections.push({
    key: "resources",
    items: [
      {
        key: "how",
        href: cl("/how-it-works"),
        label: t("header.howItWorks"),
        icon: Sparkles,
      },
      {
        key: "about",
        href: cl("/about"),
        label: t("common.about"),
        icon: Info,
      },
      {
        key: "help",
        href: cl("/help"),
        label: t("common.help"),
        icon: HelpCircle,
      },
    ],
  });

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className={`lg:hidden fixed inset-0 z-[60] bg-black/45 backdrop-blur-[1px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-[70] w-[80vw] max-w-sm bg-[var(--hm-bg-elevated)] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-[var(--hm-border-subtle)]">
          {isAuthenticated && user ? (
            <Link
              href={cl(isPro ? "/pro/profile" : "/settings")}
              onClick={onClose}
              className="flex items-center gap-3 min-w-0 flex-1"
            >
              <div className="relative w-11 h-11 rounded-full overflow-hidden bg-[var(--hm-bg-tertiary)] shrink-0">
                {user.avatar ? (
                  <Image
                    src={storage.getOptimizedImageUrl(user.avatar, "avatar")}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <UserCircle className="w-full h-full text-[var(--hm-fg-muted)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-[var(--hm-fg-primary)] truncate">
                  {user.name || user.email}
                </div>
                <div className="text-[12px] text-[var(--hm-fg-muted)] capitalize">
                  {isPro
                    ? t("common.professional")
                    : isAdmin
                      ? "Admin"
                      : t("common.client")}
                </div>
              </div>
            </Link>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-bold text-[var(--hm-fg-primary)] leading-tight">
                Homico
              </div>
              <div className="text-[12px] text-[var(--hm-fg-muted)] mt-0.5">
                {t("landing.heroTitle")}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="shrink-0 w-9 h-9 -mt-1 -mr-1 rounded-full flex items-center justify-center text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable nav list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {sections.map((section, sIdx) => (
            <div
              key={section.key}
              className={sIdx > 0 ? "mt-4" : ""}
            >
              {section.title && (
                <div className="px-3 pb-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--hm-fg-muted)]">
                  {section.title}
                </div>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const content = item.subtle ? (
                    <>
                      <span className="ml-[7px] mr-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hm-border-strong)]" />
                      <span className="flex-1 truncate text-[14px] text-[var(--hm-fg-secondary)]">
                        {item.label}
                      </span>
                    </>
                  ) : (
                    <>
                      <Icon
                        className="w-5 h-5 text-[var(--hm-fg-secondary)] shrink-0"
                        strokeWidth={1.75}
                      />
                      <span className="flex-1 text-[15px] font-medium text-[var(--hm-fg-primary)] truncate">
                        {item.label}
                      </span>
                    </>
                  );
                  const className = item.subtle
                    ? "flex items-center gap-3 w-full pl-7 pr-3 py-2 rounded-lg hover:bg-[var(--hm-bg-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40 transition-colors text-left"
                    : "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[var(--hm-bg-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40 transition-colors text-left";

                  if (item.onClick) {
                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                          onClick={handleNav(item.onClick)}
                          className={className}
                        >
                          {content}
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href || "#"}
                        onClick={onClose}
                        className={className}
                      >
                        {content}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="px-4 py-4 border-t border-[var(--hm-border-subtle)] space-y-2 safe-area-bottom">
          {!isPro && !isAdmin && (
            <Link
              href={cl("/become-pro")}
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)] text-white text-[14px] font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {t("header.becomePro")}
            </Link>
          )}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border border-[var(--hm-border)] text-[14px] font-semibold text-[var(--hm-fg-primary)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t("auth.logout")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border border-[var(--hm-border)] text-[14px] font-semibold text-[var(--hm-fg-primary)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {t("auth.login")}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
