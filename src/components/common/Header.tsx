"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { CountBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ACCENT_COLOR } from "@/constants/theme";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import { useCartUI } from "@/contexts/CartUIContext";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useCountryLink } from "@/hooks/useCountry";
import { stripCountryPrefix } from "@/utils/countryLink";
import { useSupportUnread } from "@/hooks/useSupportUnread";
import { trackEvent } from "@/hooks/useTracker";
import { useMyProjects } from "@/hooks/useMyProjects";
import {
  ArrowRight,
  Activity,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  Check,
  ChevronRight,
  ExternalLink,
  Hammer,
  HelpCircle,
  Image as ImageIcon,
  ImagePlus,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  LogIn,
  LogOut,
  Menu,
  Package,
  Plus,
  Scale,
  Search,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Store,
  SlidersHorizontal,
  Star,
  UserPlus,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Avatar from "./Avatar";
import MarketplaceSelector from "./MarketplaceSelector";
import NotificationsDropdown from "./NotificationsDropdown";
import ThemeToggle from "./ThemeToggle";
import { features } from "@/config/features";

// Lightweight shape for the Shop mega-dropdown's recent-order cards.
type HeaderOrder = {
  id?: string;
  _id?: string;
  orderNumber: string;
  status: string;
  totalMinor: number;
  items?: { name: string; qty: number; imageUrl?: string }[];
};

export default function Header({
  fixed = true,
  showNav = true,
}: {
  fixed?: boolean;
  // The app shell (sidebar layout) passes `false` so the top bar doesn't
  // duplicate the sidebar's navigation - the sidebar is the single nav surface
  // there. Landing / public pages keep the centered nav (default true).
  showNav?: boolean;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t } = useLanguage();
  const { unreadCount, activityCounts } = useNotifications();
  // Country-aware nav. Keeps `/professionals`, `/jobs`, `/post-job`
  // links inside the active marketplace so clicks don't bounce
  // through the middleware redirect.
  const cl = useCountryLink();
  // Support-reply unread count. Polls every 60s + on tab refocus. Used to
  // surface a "support wrote back" indicator on both the Bell area (small
  // dot) and the profile-dropdown Help row (count badge).
  const { count: unreadSupportCount, firstUnreadId: firstUnreadSupportId } =
    useSupportUnread();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsTriggerRef = useRef<HTMLButtonElement>(null);
  const notificationsPanelRef = useRef<HTMLDivElement>(null);
  const notificationsSheetRef = useRef<HTMLDivElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<{
    top: number;
    right: number;
  } | null>(null);
  // Which top-bar mega-dropdown is open (null = none). Only one open at a
  // time - matches the convention every site enforces and keeps the close-
  // outside-on-click logic simple.
  type NavMenuKey =
    | "jobs"
    | "pros"
    | "plan"
    | "projects"
    | "shop"
    | "activity";
  const [openMenuKey, setOpenMenuKey] = useState<NavMenuKey | null>(null);
  // Projects come from a shared cache so the sidebar group and this dropdown
  // make ONE `/projects` request between them, not one each.
  const myProjects = useMyProjects(isAuthenticated);
  const [myOrders, setMyOrders] = useState<HeaderOrder[] | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  // Refs to the avatar trigger and the portaled dropdown panel. Click-outside
  // logic below has to exempt BOTH (the panel because it's the content; the
  // trigger because tapping it to open would otherwise immediately re-close).
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Each top-bar mega-dropdown gets its own trigger ref so the panel can
  // anchor under it. The PANEL ref is shared since only one is open at a
  // time. Looked up via openMenuKey to find the right trigger position.
  const jobsTriggerRef = useRef<HTMLButtonElement>(null);
  const prosTriggerRef = useRef<HTMLButtonElement>(null);
  const planTriggerRef = useRef<HTMLButtonElement>(null);
  const projectsTriggerRef = useRef<HTMLButtonElement>(null);
  const shopTriggerRef = useRef<HTMLButtonElement>(null);
  const activityTriggerRef = useRef<HTMLButtonElement>(null);
  const navMenuPanelRef = useRef<HTMLDivElement>(null);

  // Click-outside detection that excludes both the trigger and the portaled
  // panel. We can't use the single-ref `useClickOutside` hook because the
  // dropdown is rendered in document.body via createPortal, while the trigger
  // stays nested in the header - two distinct DOM subtrees.
  useEffect(() => {
    if (!showDropdown) return;
    const handle = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setShowDropdown(false);
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [showDropdown]);
  // Top + right offset (in px) of the dropdown panel. Recomputed on open
  // and on scroll/resize so the dropdown sticks to the trigger even after
  // layout changes. Null = not measured yet (e.g. first render).
  const [dropdownAnchor, setDropdownAnchor] = useState<{
    top: number;
    right: number;
  } | null>(null);

  // Recompute panel anchor whenever the dropdown is open. We anchor by
  // `right` (distance from the right edge of the viewport to the right
  // edge of the trigger) so the panel always aligns under the avatar even
  // if the surrounding flex layout reflows.
  useEffect(() => {
    if (!showDropdown) return;
    const computeAnchor = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setDropdownAnchor({
        top: rect.bottom + 8, // 8px gap (mirrors old `mt-2`)
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    computeAnchor();
    window.addEventListener("resize", computeAnchor);
    window.addEventListener("scroll", computeAnchor, true);
    return () => {
      window.removeEventListener("resize", computeAnchor);
      window.removeEventListener("scroll", computeAnchor, true);
    };
  }, [showDropdown]);

  // Notifications dropdown - click-outside + anchor (same portal pattern as
  // the avatar dropdown above, since the panel renders in document.body to
  // escape the header's backdrop-filter containing block).
  useEffect(() => {
    if (!showNotifications) return;
    const handle = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (notificationsTriggerRef.current?.contains(target)) return;
      if (notificationsPanelRef.current?.contains(target)) return;
      if (notificationsSheetRef.current?.contains(target)) return;
      setShowNotifications(false);
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [showNotifications]);
  useEffect(() => {
    if (!showNotifications) return;
    const computeAnchor = () => {
      const el = notificationsTriggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setNotificationsAnchor({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    computeAnchor();
    window.addEventListener("resize", computeAnchor);
    window.addEventListener("scroll", computeAnchor, true);
    return () => {
      window.removeEventListener("resize", computeAnchor);
      window.removeEventListener("scroll", computeAnchor, true);
    };
  }, [showNotifications]);

  // Unified click-outside + anchor for the 3 nav mega-dropdowns. Same
  // pattern as the avatar dropdown above. The anchor recomputes whenever
  // openMenuKey changes so the panel always drops under whichever trigger
  // the user just clicked.
  const getActiveNavMenuTrigger = () => {
    if (openMenuKey === "jobs") return jobsTriggerRef.current;
    if (openMenuKey === "pros") return prosTriggerRef.current;
    if (openMenuKey === "plan") return planTriggerRef.current;
    if (openMenuKey === "projects") return projectsTriggerRef.current;
    if (openMenuKey === "shop") return shopTriggerRef.current;
    if (openMenuKey === "activity") return activityTriggerRef.current;
    return null;
  };
  useEffect(() => {
    if (!openMenuKey) return;
    const handle = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const trigger = getActiveNavMenuTrigger();
      if (trigger?.contains(target)) return;
      if (navMenuPanelRef.current?.contains(target)) return;
      setOpenMenuKey(null);
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMenuKey]);

  // The Shop mega-dropdown shows recent orders, so fetch them once
  // authenticated (projects are handled by the shared `useMyProjects` hook).
  useEffect(() => {
    if (!isAuthenticated) {
      setMyOrders(null);
      return;
    }
    let cancelled = false;
    api
      .get("/orders")
      .then((r) => {
        if (!cancelled) setMyOrders((r.data as HeaderOrder[]) || []);
      })
      .catch(() => {
        if (!cancelled) setMyOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Check active routes for navigation highlighting. Country-scoped
  // pathnames (`/ge/professionals`) are stripped to their bare form
  // (`/professionals`) so the comparison works on both /ge and the
  // legacy bare URLs middleware redirects from.
  const localPath = stripCountryPrefix(pathname);
  const isNotificationsActive = localPath === "/notifications";
  const isHomeActive = localPath === "/" || /^\/[a-z]{2}$/i.test(pathname);
  const isProfessionalsActive =
    localPath === "/professionals" || localPath.startsWith("/professionals/");

  // Generic active-state matcher for the new role-aware top-bar tabs.
  // Matches exact paths AND nested routes so `/jobs/123` highlights the
  // Jobs tab. Country-stripped pathname already handled above.
  const isPathActive = (target: string) =>
    localPath === target || localPath.startsWith(`${target}/`);

  // The Shop tab owns the whole shop section: catalog (/shop) AND orders
  // (/orders), which live under the same sidebar group.
  const isShopActive = isPathActive("/shop") || isPathActive("/orders");

  // Three mega-dropdowns drive the entire top-bar navigation. Each top-
  // level label ("Jobs", "Professionals", "My activity") opens a panel
  // listing every related page so users see "what can I do here" without
  // having to remember the route or hunt through deep menus. Replaces the
  // previous flat-link-per-page model that crowded the top bar.
  type NavRole = "all" | "auth" | "client" | "pro" | "clientAndAdmin" | "proAndAdmin" | "admin";
  type DropdownItem = {
    key: string;
    href: string;
    label: string;
    description: string;
    icon: typeof Hammer;
    showFor: NavRole;
    // "create" gives the tile the vermillion dashed-border + filled-icon
    // treatment from the Paper sub-nav drawing (post-job / new-project).
    // Everything else renders as a default warm-tinted tile.
    variant?: "create";
  };
  const role = user?.role;
  const matchesRole = (showFor: NavRole) => {
    if (showFor === "all") return true;
    if (showFor === "auth") return isAuthenticated;
    if (showFor === "admin") return role === "admin";
    if (showFor === "client") return role === "client";
    if (showFor === "pro") return role === "pro";
    if (showFor === "clientAndAdmin") return role === "client" || role === "admin";
    if (showFor === "proAndAdmin") return role === "pro" || role === "admin";
    return false;
  };

  // Jobs mega-dropdown items - first row is the marketplace browse page,
  // the rest are related actions filtered by role so visitors see Post +
  // How-it-works, clients see Post + My posts, pros see My work.
  const jobsMenuItems: DropdownItem[] = [
    { key: "all-jobs", href: cl("/jobs"), label: t("header.allJobs"), description: t("header.descriptions.allJobs"), icon: Briefcase, showFor: "all" },
    { key: "post-job", href: cl("/post-job"), label: t("header.postJob"), description: t("header.descriptions.postJob"), icon: Plus, showFor: "all", variant: "create" },
    { key: "my-jobs", href: "/my-jobs", label: t("header.myJobs"), description: t("header.descriptions.myJobs"), icon: Hammer, showFor: "clientAndAdmin" },
    { key: "my-space-jobs", href: "/my-space", label: t("header.mySpace"), description: t("header.descriptions.mySpace"), icon: LayoutDashboard, showFor: "proAndAdmin" },
  ];
  const visibleJobsMenuItems = jobsMenuItems.filter((i) => matchesRole(i.showFor));

  // Professionals mega-dropdown items - first row is browse, then the
  // become-a-pro CTA + how-it-works + (for pros) their own profile.
  const prosMenuItems: DropdownItem[] = [
    { key: "all-professionals", href: cl("/professionals"), label: t("header.allProfessionals"), description: t("header.descriptions.allProfessionals"), icon: Users, showFor: "all" },
    { key: "become-pro", href: cl("/become-pro"), label: t("header.becomePro"), description: t("header.descriptions.becomePro"), icon: Briefcase, showFor: "all" },
    { key: "how-it-works", href: cl("/how-it-works"), label: t("header.howItWorks"), description: t("header.descriptions.howItWorks"), icon: HelpCircle, showFor: "all" },
    { key: "accountability", href: "/pro/accountability", label: t("header.accountability"), description: t("header.descriptions.accountability"), icon: Shield, showFor: "all" },
    { key: "my-profile", href: user?.id ? `/professionals/${user.id}` : "/professionals", label: t("header.myProfile"), description: t("header.descriptions.myProfile"), icon: ImageIcon, showFor: "proAndAdmin" },
  ];
  const visibleProsMenuItems = prosMenuItems.filter((i) => matchesRole(i.showFor));

  // Plan mega-dropdown - AI-powered planning tools. Shown to everyone since
  // both clients (estimating their renovation) and pros (validating bids)
  // benefit. Name deliberately avoids "tools" - in Georgian / Russian that
  // reads as physical hammers/saws given the renovation context.
  // Trimmed to the hub + the two tools that actually get used (calculator,
  // compare). The analyzer + price-database tools drew ~0 nav traffic, so they
  // no longer take a premium dropdown slot - they stay reachable via the
  // "all tools" hub, which lists every tool as a card.
  const planMenuItems: DropdownItem[] = [
    { key: "all-tools", href: cl("/tools"), label: t("header.allTools"), description: t("header.descriptions.allTools"), icon: LayoutGrid, showFor: "all" },
    { key: "calculator", href: cl("/tools/calculator"), label: t("header.renovationCalculator"), description: t("header.descriptions.renovationCalculator"), icon: Calculator, showFor: "all" },
    { key: "compare", href: cl("/tools/compare"), label: t("header.compareEstimates"), description: t("header.descriptions.compareEstimates"), icon: Scale, showFor: "all" },
    { key: "for-business", href: cl("/for-business"), label: t("header.forBusiness"), description: t("header.descriptions.forBusiness"), icon: Building2, showFor: "all" },
  ];
  const visiblePlanMenuItems = planMenuItems.filter((i) => matchesRole(i.showFor));

  // Projects mega-dropdown - the renovation command center. Auth-only;
  // mirrors the sidebar Projects group (browse + start a new project).
  const projectsMenuItems: DropdownItem[] = [
    { key: "all-projects", href: "/projects", label: t("header.projects"), description: t("header.descriptions.projects"), icon: ListChecks, showFor: "auth" },
    { key: "new-project", href: "/projects/new", label: t("header.newProject"), description: t("header.descriptions.newProject"), icon: Plus, showFor: "auth", variant: "create" },
  ];
  const visibleProjectsMenuItems = projectsMenuItems.filter((i) => matchesRole(i.showFor));

  // Shop mega-dropdown - catalog browse + the user's orders. Mirrors the
  // sidebar Shop group (Catalog / Orders). Catalog is public; Orders is
  // auth-only.
  const shopMenuItems: DropdownItem[] = [
    { key: "shop-catalog", href: "/shop", label: t("nav.shopCatalog"), description: t("header.descriptions.shopCatalog"), icon: Store, showFor: "all" },
    { key: "shop-orders", href: "/orders", label: t("header.orders"), description: t("header.descriptions.orders"), icon: Package, showFor: "auth" },
  ];
  const visibleShopMenuItems = shopMenuItems.filter((i) => matchesRole(i.showFor));

  // My activity mega-dropdown - authenticated personal nav. Same content
  // as previously shipped, just role-gated. Admin gets an extra Admin
  // Panel link appended (handled separately in the JSX).
  const dropdownActivityItems: DropdownItem[] = [
    { key: "my-space", href: "/my-space", label: t("header.mySpace"), description: t("header.descriptions.mySpace"), icon: LayoutDashboard, showFor: "proAndAdmin" },
    { key: "my-jobs-activity", href: "/my-jobs", label: t("header.myJobs"), description: t("header.descriptions.myJobs"), icon: Hammer, showFor: "clientAndAdmin" },
    { key: "my-proposals", href: "/my-proposals", label: t("header.myProposals"), description: t("header.descriptions.myProposals"), icon: ExternalLink, showFor: "proAndAdmin" },
    { key: "bookings", href: "/bookings", label: t("header.bookings"), description: t("header.descriptions.bookings"), icon: Calendar, showFor: "auth" },
    { key: "my-reviews", href: "/my-reviews", label: t("header.myReviews"), description: t("header.descriptions.myReviews"), icon: Star, showFor: "clientAndAdmin" },
    { key: "pro-reviews", href: "/pro/reviews", label: t("header.myReviews"), description: t("header.descriptions.myReviews"), icon: Star, showFor: "pro" },
    { key: "analytics", href: "/pro/analytics", label: t("header.analytics"), description: t("header.descriptions.analytics"), icon: BarChart3, showFor: "proAndAdmin" },
  ];
  const visibleDropdownActivityItems = dropdownActivityItems.filter((item) =>
    matchesRole(item.showFor),
  );

  // Live activity counts for the "My activity" mega-dropdown - tile badges +
  // footer summary. Exact server-side unread counts grouped into categories,
  // sourced from NotificationContext (GET /notifications/unread-counts-by-
  // category) so paginated feeds don't undercount. Refetched whenever the
  // unread total changes.

  // Which activity-category count (if any) badges a given tile.
  const tileBadgeCount = (key: string): number => {
    switch (key) {
      // Project-engagement invites now live in My Space (the retired
      // /my-work surface folded in), so they badge the My Space tiles.
      case "my-space":
      case "my-space-jobs":
        return activityCounts.invitations;
      case "my-jobs":
      case "my-jobs-activity":
        return activityCounts.newProposals;
      case "my-proposals":
        return activityCounts.proposalReplies;
      case "bookings":
        return activityCounts.bookings;
      case "my-reviews":
      case "pro-reviews":
        return activityCounts.reviews;
      default:
        return 0;
    }
  };

  // Logo always goes to the landing (`/`) regardless of auth/role — that
  // page is the concierge entry and what we want visitors/pros alike to
  // land on. Pros navigate to `/jobs` via the nav links, not the logo.
  const homeHref = "/";

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileMenu]);

  // Handle ESC key to close every transient surface
  const handleEscKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
      setOpenMenuKey(null);
      setShowMobileMenu(false);
      setShowNotifications(false);
    }
  }, []);

  useEffect(() => {
    if (showDropdown || showMobileMenu || openMenuKey || showNotifications) {
      document.addEventListener("keydown", handleEscKey);
    }
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showDropdown, showMobileMenu, openMenuKey, showNotifications, handleEscKey]);

  return (
    <header
      className={`${fixed ? "fixed top-0 left-0 right-0" : "relative"} z-50 h-14`}
      style={{
        borderBottom: "1px solid var(--hm-n-200)",
        // Editorial top bar - matches Paper canonical 1LF-0. Solid paper-tinted
        // background (no frosted glass), tighter padding, smaller wordmark.
        backgroundColor: "var(--hm-bg-elevated)",
      }}
    >
      <div className="h-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between">
        {/* Wordmark - matches Paper Browse top bar: "Homico" + diamond mark
            (dark rounded square with a vermillion rotated square inside). The
            square uses fg-primary so it inverts to a light mark in dark mode;
            the diamond stays brand vermillion. */}
        <div className="flex items-center flex-shrink-0">
          <Link
            href={homeHref}
            className="flex items-center gap-2 flex-shrink-0 group"
          >
            <span
              className="text-[21px] leading-none font-bold tracking-[-0.02em] transition-colors group-hover:text-[var(--hm-brand-500)]"
              style={{
                color: "var(--hm-fg-primary)",
              }}
            >
              Homico
            </span>
            <svg
              width="22"
              height="22"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
              aria-hidden
            >
              <rect
                x="6"
                y="6"
                width="88"
                height="88"
                rx="8"
                fill="var(--hm-fg-primary)"
              />
              <rect
                x="50"
                y="20"
                width="42"
                height="42"
                rx="2"
                transform="rotate(45 50 41)"
                fill="var(--hm-brand-500)"
              />
            </svg>
          </Link>

          {/* Unified nav-dropdown portal - one panel rendered at a time,
              content keyed off openMenuKey. Portal-to-body pattern matches
              the avatar dropdown so Safari's backdrop-filter compositing
              bug doesn't eat it. Anchored under whichever trigger is open. */}
          {openMenuKey &&
            typeof document !== "undefined" &&
            createPortal(
              (() => {
                const baseItems =
                  openMenuKey === "jobs"
                    ? visibleJobsMenuItems
                    : openMenuKey === "pros"
                      ? visibleProsMenuItems
                      : openMenuKey === "plan"
                        ? visiblePlanMenuItems
                        : openMenuKey === "projects"
                          ? visibleProjectsMenuItems
                          : openMenuKey === "shop"
                            ? visibleShopMenuItems
                            : visibleDropdownActivityItems;
                // Admin gets an extra tile appended to the activity menu. Push
                // it into the same array so the one tile renderer covers it.
                const adminItem: DropdownItem | null =
                  openMenuKey === "activity" && user?.role === "admin"
                    ? {
                        key: "admin",
                        href: "/admin",
                        label: t("header.adminPanel"),
                        description: t("header.descriptions.adminPanel"),
                        icon: LayoutGrid,
                        showFor: "admin",
                      }
                    : null;
                const tiles = adminItem ? [...baseItems, adminItem] : baseItems;
                const menuName =
                  openMenuKey === "jobs"
                    ? t("header.jobs")
                    : openMenuKey === "pros"
                      ? t("header.professionals")
                      : openMenuKey === "plan"
                        ? t("header.plan")
                        : openMenuKey === "projects"
                          ? t("header.projects")
                          : openMenuKey === "shop"
                            ? t("header.shop")
                            : t("header.myActivity");
                // "View all" footer links to the menu's primary destination -
                // always the first tile (the "all jobs / all pros / all tools /
                // projects" entry).
                const viewAllHref = tiles[0]?.href ?? "/";

                // The Projects menu is special: instead of static link tiles it
                // shows the user's real projects as image cards, plus a "new
                // project" create card. No "view all" footer - the cards ARE the
                // list.
                const isProjects = openMenuKey === "projects";
                const projectList = isProjects ? myProjects ?? [] : [];
                const newProjectItem = visibleProjectsMenuItems.find(
                  (i) => i.variant === "create",
                );
                // Simple, consistent rows: each project becomes a standard nav
                // tile (icon + name + a quiet status/progress line), rendered
                // through the same renderTile used by every other menu. No
                // cover images / progress bars - keeps the dropdown calm and
                // scannable. New-project tile sits last.
                const projectTiles: DropdownItem[] = projectList.map((p) => {
                  const pct = Math.max(
                    0,
                    Math.min(100, Math.round(p.progress ?? 0)),
                  );
                  const statusRaw = p.status
                    ? t(`status.${p.status}`)
                    : "";
                  const statusLabel =
                    statusRaw && !statusRaw.startsWith("status.")
                      ? statusRaw
                      : p.status || "";
                  return {
                    key: (p.id || p._id) as string,
                    href: `/projects/${p.id || p._id}`,
                    label: p.title || t("header.projects"),
                    description: [statusLabel, `${pct}%`]
                      .filter(Boolean)
                      .join(" · "),
                    icon: ListChecks,
                    showFor: "auth",
                  };
                });
                const projectMenuTiles = newProjectItem
                  ? [...projectTiles, newProjectItem]
                  : projectTiles;

                // The Shop menu mirrors Projects: a prominent "browse catalog"
                // card + the user's recent orders as cards, no "view all".
                const isShop = openMenuKey === "shop";
                const orderList = isShop ? (myOrders ?? []).slice(0, 7) : [];
                const catalogItem = visibleShopMenuItems.find(
                  (i) => i.key === "shop-catalog",
                );

                // Footer summary (activity menu only) - the top two non-zero
                // activity categories, sage-checked. Mirrors the Paper drawing's
                // "3 new invitations / 2 awaiting reply" stat row, driven by the
                // same real unread counts as the tile badges.
                const activityStats =
                  openMenuKey === "activity"
                    ? (
                        [
                          {
                            count: activityCounts.invitations,
                            label: t("header.statInvitations", {
                              count: activityCounts.invitations,
                            }),
                          },
                          {
                            count: activityCounts.newProposals,
                            label: t("header.statProposals", {
                              count: activityCounts.newProposals,
                            }),
                          },
                          {
                            count: activityCounts.proposalReplies,
                            label: t("header.statReplies", {
                              count: activityCounts.proposalReplies,
                            }),
                          },
                          {
                            count: activityCounts.bookings,
                            label: t("header.statBookings", {
                              count: activityCounts.bookings,
                            }),
                          },
                          {
                            count: activityCounts.reviews,
                            label: t("header.statReviews", {
                              count: activityCounts.reviews,
                            }),
                          },
                        ] as { count: number; label: string }[]
                      )
                        .filter((s) => s.count > 0)
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 2)
                    : [];

                // Single tile renderer - matches the Paper sub-nav drawing.
                // Three states: `create` (vermillion dashed border + filled
                // icon, for post-job / new-project), `active` (current route -
                // paper fill + hairline border + dark icon box), and default
                // (transparent, warm-tinted icon box, hover fill).
                const renderTile = (item: DropdownItem) => {
                  const Icon = item.icon;
                  const badge = tileBadgeCount(item.key);
                  const hrefBare = stripCountryPrefix(item.href);
                  const isCreate = item.variant === "create";
                  const isActiveTile =
                    !isCreate &&
                    (localPath === hrefBare ||
                      (hrefBare !== "/" &&
                        localPath.startsWith(`${hrefBare}/`)));
                  const tileStyle: React.CSSProperties = isCreate
                    ? {
                        background: `${ACCENT_COLOR}0A`,
                        border: `1px dashed ${ACCENT_COLOR}`,
                      }
                    : isActiveTile
                      ? {
                          background: "var(--hm-bg-page)",
                          border: "1px solid var(--hm-border)",
                        }
                      : { border: "1px solid transparent" };
                  const iconBoxStyle: React.CSSProperties = isCreate
                    ? { background: ACCENT_COLOR }
                    : isActiveTile
                      ? { background: "var(--hm-fg-primary)" }
                      : { background: "var(--hm-bg-tertiary)" };
                  const iconColor = isCreate
                    ? "#fff"
                    : isActiveTile
                      ? "var(--hm-bg-elevated)"
                      : "var(--hm-fg-primary)";
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      role="menuitem"
                      className="group flex items-start gap-3.5 rounded-xl p-4 transition-colors hover:bg-[var(--hm-bg-tertiary)]"
                      style={tileStyle}
                      onClick={() => {
                        setOpenMenuKey(null);
                        trackEvent("nav_click", item.key);
                      }}
                    >
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-[10px] flex items-center justify-center"
                        style={iconBoxStyle}
                      >
                        <Icon
                          className="w-[18px] h-[18px]"
                          style={{ color: iconColor }}
                          strokeWidth={1.8}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-bold tracking-[-0.005em] text-[var(--hm-fg-primary)]">
                            {item.label}
                          </span>
                          {badge > 0 && (
                            <span
                              className="inline-flex items-center justify-center rounded-full px-1.5 min-w-[16px] h-4"
                              style={{ background: ACCENT_COLOR }}
                            >
                              <span className="font-mono text-[9px] font-bold text-white tabular-nums">
                                {badge > 9 ? "9+" : badge}
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[12px] leading-snug text-[var(--hm-fg-secondary)]">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                };

                // A recent order rendered as a compact card: the first item's
                // thumbnail, the order number, a status pill, and the total.
                const renderOrderCard = (o: HeaderOrder) => {
                  const oid = o.id || o._id;
                  const thumb = o.items?.find((i) => i.imageUrl)?.imageUrl;
                  const count = (o.items ?? []).reduce(
                    (n, i) => n + (i.qty || 1),
                    0,
                  );
                  return (
                    <Link
                      key={oid}
                      href={`/orders/${oid}`}
                      role="menuitem"
                      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--hm-border)] bg-[var(--hm-bg-page)] transition-all hover:-translate-y-0.5 hover:border-[var(--hm-brand-500)] hover:shadow-[var(--hm-shadow-md)]"
                      onClick={() => {
                        setOpenMenuKey(null);
                        trackEvent("nav_click", "order-card");
                      }}
                    >
                      <div className="relative flex h-24 w-full items-center justify-center overflow-hidden bg-[var(--hm-bg-tertiary)]">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            referrerPolicy="no-referrer"
                            src={storage.getOptimizedImageUrl(thumb, "feedCard")}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <Package
                            className="h-7 w-7 text-[var(--hm-fg-muted)]"
                            strokeWidth={1.6}
                          />
                        )}
                        <span className="absolute left-2 top-2 rounded-full bg-[var(--hm-bg-elevated)]/90 px-2 py-0.5 text-[10px] font-semibold text-[var(--hm-fg-secondary)] backdrop-blur-sm">
                          {(() => {
                            const s = t(`orders.status.${o.status}`);
                            return s.startsWith("orders.status.")
                              ? o.status
                              : s;
                          })()}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-bold text-[var(--hm-fg-primary)]">
                            {o.orderNumber}
                          </span>
                          <span className="shrink-0 text-[12px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
                            {(o.totalMinor / 100).toLocaleString()} ₾
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[var(--hm-fg-muted)]">
                          {t("header.menuSectionCount", { count })}
                        </p>
                      </div>
                    </Link>
                  );
                };

                // Prominent "browse catalog" card that opens /shop - the shop
                // menu's primary action, sitting first in the order-card grid.
                const renderCatalogCard = (item: DropdownItem) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      role="menuitem"
                      className="group flex flex-col justify-between rounded-xl p-4 text-white transition-transform hover:-translate-y-0.5"
                      style={{ background: ACCENT_COLOR }}
                      onClick={() => {
                        setOpenMenuKey(null);
                        trackEvent("nav_click", item.key);
                      }}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/20">
                        <Icon
                          className="h-[18px] w-[18px] text-white"
                          strokeWidth={1.8}
                        />
                      </div>
                      <div className="mt-3">
                        <span className="block text-[14px] font-bold">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-white/80">
                          {item.description}
                        </span>
                      </div>
                    </Link>
                  );
                };

                return (
                  <div
                    ref={navMenuPanelRef}
                    role="menu"
                    style={{
                      position: "fixed",
                      top: 56,
                      left: 0,
                      right: 0,
                      zIndex: "var(--hm-z-modal)" as unknown as number,
                      background: "var(--hm-bg-elevated)",
                      borderBottom: "1px solid var(--hm-border)",
                      boxShadow: "var(--hm-shadow-lg)",
                    }}
                  >
                    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
                      {/* Eyebrow + hairline + section count - matches the
                          Paper sub-nav header row. */}
                      <div className="flex items-center gap-3 mb-6">
                        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--hm-fg-muted)] whitespace-nowrap">
                          {menuName}
                        </span>
                        <div className="grow h-px bg-[var(--hm-border)]" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--hm-fg-muted)] whitespace-nowrap">
                          {t("header.menuSectionCount", {
                            count: isProjects
                              ? projectList.length
                              : isShop
                                ? orderList.length
                                : tiles.length,
                          })}
                        </span>
                      </div>

                      {isProjects ? (
                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                          {projectMenuTiles.map(renderTile)}
                        </div>
                      ) : isShop ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {catalogItem && renderCatalogCard(catalogItem)}
                          {orderList.map(renderOrderCard)}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                          {tiles.map(renderTile)}
                        </div>
                      )}

                      {/* Footer - real activity stats (sage-checked) on the
                          left, "view all" link to the menu's primary
                          destination on the right. Hidden for Projects/Shop,
                          where the cards are the full list (no "view all"). */}
                      {!isProjects && !isShop && (
                      <div className="flex items-center justify-between gap-4 pt-5 mt-6 border-t border-[var(--hm-border)]">
                        <div className="flex items-center gap-5 min-w-0">
                          {activityStats.map((stat) => (
                            <span
                              key={stat.label}
                              className="inline-flex items-center gap-1.5 text-[12px] text-[var(--hm-fg-secondary)] whitespace-nowrap"
                            >
                              <Check
                                className="w-3 h-3 flex-shrink-0"
                                style={{ color: "var(--hm-success-500)" }}
                                strokeWidth={2.5}
                                aria-hidden
                              />
                              {stat.label}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={viewAllHref}
                          className="group inline-flex flex-shrink-0 items-center gap-1.5 text-[12px] font-semibold text-[var(--hm-fg-primary)] hover:text-[var(--hm-brand-500)] transition-colors"
                          onClick={() => {
                            setOpenMenuKey(null);
                            trackEvent("nav_click", `${openMenuKey}-view-all`);
                          }}
                        >
                          {t("header.seeEverything")}
                          <ArrowRight
                            className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
                            aria-hidden
                          />
                        </Link>
                      </div>
                      )}
                    </div>
                  </div>
                );
              })(),
              document.body,
            )}
        </div>

        {/* Primary nav - desktop only, centered between the wordmark and the
            actions (matches Paper Browse top bar). Three mega-dropdown
            triggers; each opens a panel listing every related page so users
            see at a glance what's available. Items inside each panel adapt to
            role (visitor / client / pro / admin). One panel open at a time
            via shared `openMenuKey`. `flex-1` lets the nav fill the middle so
            its items center; hidden on mobile so the bar collapses to
            wordmark + actions. */}
        {showNav && (
        <nav
          className="hidden md:flex flex-1 items-center justify-center gap-2.5 lg:gap-5"
          aria-label="Primary"
        >
          <NavTrigger
            triggerRef={jobsTriggerRef}
            active={openMenuKey === "jobs" || isPathActive("/jobs")}
            open={openMenuKey === "jobs"}
            onClick={() =>
              setOpenMenuKey(openMenuKey === "jobs" ? null : "jobs")
            }
            label={t("header.jobs")}
            icon={<Briefcase className="w-4 h-4" strokeWidth={1.7} />}
          />
          <NavTrigger
            triggerRef={prosTriggerRef}
            active={openMenuKey === "pros" || isProfessionalsActive}
            open={openMenuKey === "pros"}
            onClick={() =>
              setOpenMenuKey(openMenuKey === "pros" ? null : "pros")
            }
            label={t("header.professionals")}
            icon={<Users className="w-4 h-4" strokeWidth={1.7} />}
          />
          {/* Plan: AI-powered renovation planning. Named "Plan" instead of
              "Tools" - in renovation context the latter reads as physical
              hammers/saws in KA/RU. */}
          {/* Plan: AI-powered renovation planning. Named "Plan" instead of
              "Tools" - in renovation context the latter reads as physical
              hammers/saws in KA/RU. */}
          <NavTrigger
            triggerRef={planTriggerRef}
            active={openMenuKey === "plan" || isPathActive("/tools")}
            open={openMenuKey === "plan"}
            onClick={() =>
              setOpenMenuKey(openMenuKey === "plan" ? null : "plan")
            }
            label={t("header.plan")}
            icon={<LayoutGrid className="w-4 h-4" strokeWidth={1.7} />}
          />
          {/* Projects: the client's renovation command center. Auth-only -
              mirrors the sidebar Projects group so the top bar exposes it
              too (browse projects + start a new one). */}
          {isAuthenticated && visibleProjectsMenuItems.length > 0 && (
            <NavTrigger
              triggerRef={projectsTriggerRef}
              active={openMenuKey === "projects" || isPathActive("/projects")}
              open={openMenuKey === "projects"}
              onClick={() =>
                setOpenMenuKey(openMenuKey === "projects" ? null : "projects")
              }
              label={t("header.projects")}
              icon={<ListChecks className="w-4 h-4" strokeWidth={1.7} />}
            />
          )}
          {/* Shop: now a mega-dropdown (Catalog / Orders) to match the
              sidebar Shop group, instead of a single link. */}
          <NavTrigger
            triggerRef={shopTriggerRef}
            active={openMenuKey === "shop" || isShopActive}
            open={openMenuKey === "shop"}
            onClick={() =>
              setOpenMenuKey(openMenuKey === "shop" ? null : "shop")
            }
            label={t("header.shop")}
            icon={<ShoppingBag className="w-4 h-4" strokeWidth={1.7} />}
          />
          {isAuthenticated && visibleDropdownActivityItems.length > 0 && (
            <NavTrigger
              triggerRef={activityTriggerRef}
              active={openMenuKey === "activity"}
              open={openMenuKey === "activity"}
              onClick={() =>
                setOpenMenuKey(
                  openMenuKey === "activity" ? null : "activity",
                )
              }
              label={t("header.myActivity")}
              icon={<Activity className="w-4 h-4" strokeWidth={1.7} />}
            />
          )}
        </nav>
        )}

        {/* Right side - Actions + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0">
          {/* Global search trigger - opens the command palette. Desktop only
              (lg+) to match the Paper Browse top bar, whose mobile/tablet bars
              are just bell + avatar. Desktop users also have Cmd+K. */}
          <div className="hidden lg:flex">
            <CommandPaletteTrigger />
          </div>

          {/* Theme + Language - desktop only (lg+), matching the Paper
              mobile/tablet bars (bell + avatar only). On mobile/tablet both
              remain reachable via /settings; logged-out users also get the
              language chip in the burger menu. */}
          <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <MarketplaceSelector hideCountry={!features.marketplaceSelector} />
          </div>

          {/* Cart - shows only when it has items, opens the shared drawer from
              anywhere in the app. */}
          <CartButton />

          {isLoading ? (
            <Skeleton className="w-9 h-9 rounded-xl" />
          ) : isAuthenticated && user ? (
            <>
              {/* Notification Bell - opens an inline panel with recent items.
                  The full /notifications page is still reachable via the
                  panel's "Show all" footer. Anchored portal pattern matches
                  the avatar dropdown so Safari's backdrop-filter doesn't
                  composite the panel into the header layer. */}
              <button
                type="button"
                ref={notificationsTriggerRef}
                onClick={() => {
                  setShowNotifications((v) => !v);
                  trackEvent("nav_click", "notifications");
                }}
                className="relative flex items-center justify-center w-9 h-9 rounded-[10px] bg-[var(--hm-bg-tertiary)] transition-colors hover:bg-[var(--hm-n-200)]"
                style={
                  isNotificationsActive || showNotifications
                    ? { color: "var(--hm-brand-500)" }
                    : { color: "var(--hm-fg-primary)" }
                }
                aria-label={t("notifications.title")}
                aria-haspopup="dialog"
                aria-expanded={showNotifications}
              >
                <Bell className="w-4 h-4" strokeWidth={1.8} />
                <CountBadge
                  count={unreadCount}
                  className="absolute -top-1.5 -right-1.5 ring-2 ring-[var(--hm-bg-elevated)]"
                />
              </button>
              {showNotifications &&
                typeof document !== "undefined" &&
                createPortal(
                  <>
                    {/* Mobile (<lg): bottom sheet with dim backdrop. Bell
                        anchor isn't used here - the sheet slides up from
                        the bottom and spans full viewport width. */}
                    <div
                      className="lg:hidden fixed inset-0 bg-black/40 animate-fade-backdrop"
                      style={{
                        zIndex: "var(--hm-z-modal)" as unknown as number,
                      }}
                      onClick={() => setShowNotifications(false)}
                      aria-hidden
                    />
                    <div
                      ref={notificationsSheetRef}
                      role="dialog"
                      aria-modal="true"
                      aria-label={t("notifications.title")}
                      className="lg:hidden fixed left-0 right-0 bottom-0 rounded-t-2xl overflow-hidden animate-slide-up-sheet"
                      style={{
                        zIndex: "var(--hm-z-modal)" as unknown as number,
                        background: "var(--hm-bg-elevated)",
                        borderTop: "1px solid var(--hm-border)",
                        boxShadow: "var(--hm-shadow-lg)",
                        paddingBottom: "env(safe-area-inset-bottom)",
                      }}
                    >
                      {/* Drag handle */}
                      <div className="flex justify-center pt-2 pb-1">
                        <span className="block w-9 h-1 rounded-full bg-[var(--hm-border-strong)]" />
                      </div>
                      <NotificationsDropdown
                        onClose={() => setShowNotifications(false)}
                      />
                    </div>

                    {/* Desktop (lg+): anchored dropdown under the bell. */}
                    {notificationsAnchor && (
                      <div
                        ref={notificationsPanelRef}
                        role="dialog"
                        aria-label={t("notifications.title")}
                        className="hidden lg:block w-[360px] max-w-[calc(100vw-16px)] rounded-xl overflow-hidden"
                        style={{
                          position: "fixed",
                          top: notificationsAnchor.top,
                          right: notificationsAnchor.right,
                          zIndex: "var(--hm-z-modal)" as unknown as number,
                          background: "var(--hm-bg-elevated)",
                          border: "1px solid var(--hm-border)",
                          boxShadow: "var(--hm-shadow-lg)",
                        }}
                      >
                        <NotificationsDropdown
                          onClose={() => setShowNotifications(false)}
                        />
                      </div>
                    )}
                  </>,
                  document.body,
                )}

              {/* Profile Dropdown trigger.
                  The header carries `backdrop-filter: blur(...)` for the
                  frosted look. In Safari mobile that creates a containing
                  block for any `position: absolute` descendant, so a
                  dropdown nested here gets composited into the header's
                  filter layer and renders semi-transparent (the page
                  bleeds through). We keep only the TRIGGER here and
                  portal the panel to document.body below. */}
              <div className="relative" ref={triggerRef}>
                {/* Avatar + first name + chevron = a visibly clickable
                    menu trigger, not just a profile photo. Matches the
                    GitHub / Linear / Notion pattern: signals "this is a
                    menu" so users don't have to discover it by accident.
                    Name hidden on small screens to save room - avatar
                    alone is enough on mobile. */}
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="relative flex items-center gap-1.5 sm:gap-2 px-1 sm:pl-1 sm:pr-2 h-10 rounded-full hover:bg-[var(--hm-bg-tertiary)] transition-colors duration-200"
                  aria-label={
                    unreadSupportCount > 0
                      ? `Profile menu - ${unreadSupportCount} new support replies`
                      : "Profile menu"
                  }
                  aria-haspopup="menu"
                  aria-expanded={showDropdown}
                >
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    size="sm"
                    rounded="xl"
                    className="w-8 h-8 transition-all duration-300"
                  />
                  {/* Compact dot indicator on the avatar when support has
                      replied. Sits without count to keep the avatar clean -
                      the full count lives inside the dropdown next to Help. */}
                  {unreadSupportCount > 0 && (
                    <span
                      className="absolute top-1 left-7 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--hm-bg-elevated)]"
                      style={{ background: "var(--hm-brand-500)" }}
                      aria-hidden
                    />
                  )}
                  {/* First name - desktop only. Pulled from user.name and
                      split on whitespace so it works for both single-name
                      and "First Last" formats. */}
                  {user.name && (
                    <span
                      className="hidden lg:inline text-[13px] font-medium max-w-[8rem] truncate"
                      style={{ color: "var(--hm-fg-secondary)" }}
                    >
                      {user.name.split(" ")[0]}
                    </span>
                  )}
                </button>

                {showDropdown &&
                  dropdownAnchor &&
                  typeof document !== "undefined" &&
                  createPortal(
                    // Profile dropdown - PORTALED to document.body.
                    //
                    // Why portal: the parent <header> uses backdrop-filter:
                    // blur(12px) for the frosted look. In Safari mobile that
                    // promotes the header to a compositor layer AND makes it a
                    // containing block for any position:absolute descendant.
                    // Nested dropdowns inherit the filter context and render
                    // as semi-transparent ghosts with the page bleeding
                    // through (user-reported, 2026-05-16). Defensive flags
                    // (translateZ, isolation, backface-visibility) couldn't
                    // escape that containing block - only a portal does.
                    //
                    // Position: fixed at the computed (top, right) anchor of
                    // the avatar trigger. Recomputed on scroll/resize via the
                    // effect above. The dropdown lives outside the header's
                    // stacking context entirely, so it gets a normal solid
                    // background like any other body-level element.
                    <div
                      ref={dropdownRef}
                      className="w-72 rounded-xl overflow-hidden bg-[var(--hm-bg-elevated)]"
                      style={{
                        position: "fixed",
                        top: dropdownAnchor.top,
                        right: dropdownAnchor.right,
                        zIndex: "var(--hm-z-modal)",
                        backgroundColor: "var(--hm-bg-elevated)",
                        border: "1px solid var(--hm-border)",
                        boxShadow: "var(--hm-shadow-lg)",
                      }}
                    >
                      {/* User Info Header */}
                      {user.role === "pro" ? (
                        <Link
                          href={`/professionals/${user.id}`}
                          className="block px-4 py-3 relative overflow-hidden hover:opacity-90 transition-opacity"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--hm-brand-500) 0%, var(--hm-brand-700) 100%)",
                          }}
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="flex items-center gap-3 relative z-10">
                            <Avatar
                              src={user.avatar}
                              name={user.name}
                              size="md"
                              rounded="xl"
                              className="w-11 h-11"
                              style={{
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold text-white truncate">
                                  {user.name}
                                </p>
                                <ExternalLink className="w-3 h-3 text-white/70" />
                              </div>
                              <p className="text-xs text-white/80 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div
                          className="px-4 py-3 relative overflow-hidden"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--hm-brand-500) 0%, var(--hm-brand-700) 100%)",
                          }}
                        >
                          <div className="flex items-center gap-3 relative z-10">
                            <Avatar
                              src={user.avatar}
                              name={user.name}
                              size="md"
                              rounded="xl"
                              className="w-11 h-11"
                              style={{
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-white/80 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Menu Items */}
                      <div className="py-2">
                        {/* Personal nav items (My Work / My Reviews / Analytics
                            / etc.) moved to the new "My activity" mega-
                            dropdown in the top bar. Avatar dropdown is now
                            focused on ACCOUNT actions: Premium / Help /
                            Settings / Logout. Same items, different surface -
                            avoids the previous duplication and matches the
                            GitHub/Linear/Notion convention where the avatar
                            menu is just account/auth controls. */}

                        {/* Pro-specific items */}
                        {user.role === "pro" && (
                          <>
                            {/* Premium Plans - was dev-only; now shown to all
                                pros so the upgrade path is discoverable. */}
                            {true && (
                              <Link
                                href={cl("/pro/premium")}
                                className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 mx-2 rounded-xl"
                                style={{
                                  background: `linear-gradient(135deg, ${ACCENT_COLOR}12 0%, ${ACCENT_COLOR}08 100%)`,
                                  border: `1px solid ${ACCENT_COLOR}25`,
                                }}
                                onClick={() => setShowDropdown(false)}
                              >
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                                  style={{
                                    background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #D13C14 100%)`,
                                  }}
                                >
                                  <Shield
                                    className="w-4 h-4 text-white"
                                    strokeWidth={1.5}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span
                                    className="font-semibold block"
                                    style={{ color: ACCENT_COLOR }}
                                  >
                                    {t("header.premiumPlans")}
                                  </span>
                                  <span
                                    className="text-[10px]"
                                    style={{ color: `${ACCENT_COLOR}99` }}
                                  >
                                    {t("header.boostVisibility")}
                                  </span>
                                </div>
                              </Link>
                            )}

                            {/* Add portfolio work - pros kept reporting they
                                couldn't find where to add their work; the only
                                paths were My profile → portfolio tab or the
                                my-space nudge. Lands on the same editor. */}
                            <Link
                              href="/pro/profile-setup/portfolio"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)] transition-all duration-200"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--hm-bg-tertiary)]">
                                <ImagePlus
                                  className="w-4 h-4"
                                  style={{ color: ACCENT_COLOR }}
                                  strokeWidth={1.5}
                                />
                              </div>
                              <span>{t("header.addWork")}</span>
                            </Link>

                            {/* Edit services & pricing - lands on the
                                profile-setup services step where pros manage
                                the services they offer and their rates. */}
                            <Link
                              href="/pro/profile-setup/services"
                              className="group flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)] transition-all duration-200"
                              onClick={() => setShowDropdown(false)}
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--hm-bg-tertiary)]">
                                <Wrench
                                  className="w-4 h-4"
                                  style={{ color: ACCENT_COLOR }}
                                  strokeWidth={1.5}
                                />
                              </div>
                              <span>{t("header.editServices")}</span>
                            </Link>
                          </>
                        )}

                        {/* Client-specific items */}
                        {user.role === "client" && (
                          <Link
                            href={cl("/become-pro")}
                            className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 mx-2 rounded-xl"
                            style={{
                              background: `linear-gradient(135deg, ${ACCENT_COLOR}15 0%, ${ACCENT_COLOR}08 100%)`,
                              border: `1px solid ${ACCENT_COLOR}20`,
                            }}
                            onClick={() => setShowDropdown(false)}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ background: ACCENT_COLOR }}
                            >
                              <Briefcase
                                className="w-4 h-4 text-white"
                                strokeWidth={1.5}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span
                                className="font-semibold block"
                                style={{ color: ACCENT_COLOR }}
                              >
                                {t("header.becomePro")}
                              </span>
                              <span className="text-[10px] text-[var(--hm-fg-muted)]">
                                {t("header.startEarning")}
                              </span>
                            </div>
                          </Link>
                        )}

                        {/* Admin panel */}
                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            className="group flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)] transition-all duration-200"
                            onClick={() => setShowDropdown(false)}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--hm-bg-tertiary)]">
                              <LayoutGrid
                                className="w-4 h-4"
                                style={{ color: ACCENT_COLOR }}
                                strokeWidth={1.5}
                              />
                            </div>
                            <span>{t("header.adminPanel")}</span>
                          </Link>
                        )}

                        {/* The mobile-only theme + language pair that used to
                          live here was removed (2026-05-16) - it clutters the
                          dropdown and users said they didn't want it. Mobile
                          users still reach both controls via the language
                          chip on the unauthenticated mobile menu and via the
                          /settings page (linked below). Desktop top bar still
                          carries the inline controls. */}

                        {/* Help / Support - with unread reply badge when
                          support team has answered a ticket. Tapping deep-
                          links into the first unread ticket so the user gets
                          to the reply in one click. */}
                        <Link
                          href={
                            unreadSupportCount > 0 && firstUnreadSupportId
                              ? `/help/ticket/${firstUnreadSupportId}`
                              : "/help"
                          }
                          className="group flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)] transition-all duration-200 relative"
                          onClick={() => {
                            setShowDropdown(false);
                            trackEvent("nav_click", "help");
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--hm-bg-tertiary)] relative">
                            <HelpCircle
                              className="w-4 h-4"
                              style={{ color: ACCENT_COLOR }}
                              strokeWidth={1.5}
                            />
                            {unreadSupportCount > 0 && (
                              <span
                                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-[var(--hm-bg-elevated)]"
                                style={{
                                  background: "var(--hm-brand-500)",
                                  color: "#fff",
                                }}
                              >
                                {unreadSupportCount > 9
                                  ? "9+"
                                  : unreadSupportCount}
                              </span>
                            )}
                          </div>
                          <span className="flex-1">
                            {t("help.title") || "Help"}
                          </span>
                          {unreadSupportCount > 0 && (
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wider"
                              style={{ color: "var(--hm-brand-500)" }}
                            >
                              {unreadSupportCount === 1
                                ? t("help.unreadOne") || "1 new reply"
                                : (
                                    t("help.unreadMany") ||
                                    "{count} new replies"
                                  ).replace(
                                    "{count}",
                                    String(unreadSupportCount),
                                  )}
                            </span>
                          )}
                        </Link>

                        {/* Settings */}
                        <Link
                          href="/settings"
                          className="group flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)] transition-all duration-200"
                          onClick={() => {
                            setShowDropdown(false);
                            trackEvent("nav_click", "settings");
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--hm-bg-tertiary)]">
                            <SlidersHorizontal
                              className="w-4 h-4"
                              style={{ color: ACCENT_COLOR }}
                              strokeWidth={1.5}
                            />
                          </div>
                          <span>{t("common.settings")}</span>
                        </Link>

                        <div className="my-2 mx-4 h-px bg-[var(--hm-border-subtle)]" />

                        {/* Logout */}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowDropdown(false);
                            logout();
                          }}
                          className="group flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)] justify-start h-auto rounded-none"
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--hm-bg-tertiary)]">
                            <LogOut
                              className="w-4 h-4"
                              style={{ color: ACCENT_COLOR }}
                              strokeWidth={1.5}
                            />
                          </div>
                          <span>{t("header.signOut")}</span>
                        </Button>
                      </div>
                    </div>,
                    document.body,
                  )}
              </div>
            </>
          ) : (
            <>
              {/* Desktop (lg+): Login + Sign up + "Become a pro" outlined CTA.
                  Full-text buttons need the room a desktop bar gives; tablet
                  (640-1023) falls back to the compact icon buttons below so
                  the centered nav + actions don't overflow the bar. */}
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    openLoginModal();
                    trackEvent("nav_click", "login");
                  }}
                >
                  {t("common.login")}
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href="/register"
                    onClick={() => trackEvent("nav_click", "register")}
                  >
                    {t("header.signUp")}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={cl("/become-pro")}
                    onClick={() => trackEvent("nav_click", "become_pro")}
                  >
                    {t("header.becomePro")}
                  </Link>
                </Button>
              </div>

              {/* Tablet (640-1023): compact icon buttons */}
              <div className="hidden sm:flex lg:hidden items-center gap-1">
                <Button
                  variant="secondary"
                  size="icon-sm"
                  onClick={() => {
                    openLoginModal();
                    trackEvent("nav_click", "login");
                  }}
                  title={t("common.login")}
                >
                  <LogIn className="w-4 h-4" />
                </Button>
                <Button size="icon-sm" asChild title={t("header.signUp")}>
                  <Link
                    href="/register"
                    onClick={() => trackEvent("nav_click", "register")}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Link>
                </Button>
              </div>

              {/* Mobile: Hamburger menu */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowMobileMenu(true)}
                className="sm:hidden"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-[var(--hm-fg-secondary)]" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu &&
        !isAuthenticated &&
        typeof document !== "undefined" &&
        createPortal(
          // Mobile burger menu - PORTALED to document.body.
          // Same Safari containing-block bug as the profile dropdown: the
          // parent <header> uses backdrop-filter, so any descendant (even
          // position:fixed) gets composited onto the header's filter layer
          // and renders semi-transparent on Safari mobile. Portaling here
          // moves the panel into the body root, completely outside the
          // filter context, so the white background paints opaquely.
          <div className="fixed inset-0 z-[100] sm:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 animate-fade-in"
              style={{ backgroundColor: "rgba(21,17,12,0.55)" }}
              onClick={() => setShowMobileMenu(false)}
            />

            {/* Slide-in Panel */}
            <div
              ref={mobileMenuRef}
              className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[320px] shadow-2xl animate-slide-in-right"
              style={{
                backgroundColor: "var(--hm-bg-elevated)",
                animation:
                  "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              {/* Menu Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid var(--hm-border-subtle)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[18px] font-semibold tracking-[-0.02em]"
                    style={{
                      fontFamily: "var(--hm-font-display)",
                      color: "var(--hm-fg-primary)",
                    }}
                  >
                    Homico
                  </span>
                  <ThemeToggle />
                  <MarketplaceSelector hideCountry={!features.marketplaceSelector} />
                </div>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setShowMobileMenu(false)}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Menu Content */}
              <div className="flex flex-col p-5 gap-3">
                {/* Welcome text */}
                <div className="mb-4">
                  <p className="text-sm text-[var(--hm-fg-muted)]">
                    {t("header.welcomeToHomico")}
                  </p>
                  <p className="text-xs text-[var(--hm-fg-muted)] mt-1">
                    {t("header.signInOrCreateAn")}
                  </p>
                </div>

                {/* Login Button - uses `outline` variant (light bg, dark text)
                  not `secondary` (dark bg, light text). The inner spans set
                  their own dark text colors via `text-[var(--hm-fg-primary)]`
                  / `text-[var(--hm-fg-muted)]`, which made the previous dark
                  `secondary` button render dark-on-dark and unreadable on
                  Safari mobile. Outline matches the white menu surface and
                  keeps the inner text colors visible. */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMobileMenu(false);
                    openLoginModal();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 h-auto justify-start"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${ACCENT_COLOR}15` }}
                  >
                    <LogIn
                      className="w-5 h-5"
                      style={{ color: ACCENT_COLOR }}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="block font-medium text-[var(--hm-fg-primary)]">
                      {t("common.login")}
                    </span>
                    <span className="block text-xs text-[var(--hm-fg-muted)]">
                      {t("header.alreadyHaveAnAccount")}
                    </span>
                  </div>
                  <ChevronRight
                    className="w-5 h-5 text-[var(--hm-fg-muted)]"
                    strokeWidth={2}
                  />
                </Button>

                {/* Register Button */}
                <Link
                  href="/register"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: ACCENT_COLOR,
                    boxShadow: `0 4px 14px ${ACCENT_COLOR}40`,
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="block font-medium text-white">
                      {t("header.signUp")}
                    </span>
                    <span className="block text-xs text-white/70">
                      {t("header.createAFreeAccount")}
                    </span>
                  </div>
                  <ChevronRight
                    className="w-5 h-5 text-white/70"
                    strokeWidth={2}
                  />
                </Link>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[var(--hm-border-subtle)]" />
                  <span className="text-xs text-[var(--hm-fg-muted)]">
                    {t("header.or")}
                  </span>
                  <div className="flex-1 h-px bg-[var(--hm-border-subtle)]" />
                </div>

                {/* Post a Job as Guest - opens login modal. Pass the
                    post-job route as the redirect so the user lands on
                    the form after signing in, not on the home page. */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMobileMenu(false);
                    openLoginModal(cl("/post-job"));
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 h-auto rounded-xl border-2 border-dashed border-[var(--hm-border)] hover:border-[var(--hm-border-strong)] active:scale-[0.98] justify-start"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--hm-bg-tertiary)]">
                    <Plus className="w-5 h-5 text-[var(--hm-fg-secondary)]" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="block font-medium text-[var(--hm-fg-secondary)] text-left">
                      {t("header.postAJob")}
                    </span>
                    <span className="block text-xs text-[var(--hm-fg-muted)] text-left">
                      {t("header.findProfessionals")}
                    </span>
                  </div>
                </Button>

                {/* Discovery links - let unsigned visitors explore the
                    marketplace without bouncing through auth first. */}
                <Link
                  href={cl("/jobs")}
                  onClick={() => {
                    setShowMobileMenu(false);
                    trackEvent("nav_click", "jobs");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[var(--hm-bg-tertiary)]/50 transition-all"
                >
                  <Briefcase
                    className="w-5 h-5 text-[var(--hm-fg-muted)]"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm text-[var(--hm-fg-secondary)]">
                    {t("header.jobs")}
                  </span>
                </Link>
                <Link
                  href={cl("/professionals")}
                  onClick={() => {
                    setShowMobileMenu(false);
                    trackEvent("nav_click", "professionals");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[var(--hm-bg-tertiary)]/50 transition-all"
                >
                  <Users
                    className="w-5 h-5 text-[var(--hm-fg-muted)]"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm text-[var(--hm-fg-secondary)]">
                    {t("header.browseProfessionals")}
                  </span>
                </Link>
                <Link
                  href={cl("/tools")}
                  onClick={() => {
                    setShowMobileMenu(false);
                    trackEvent("nav_click", "plan");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[var(--hm-bg-tertiary)]/50 transition-all"
                >
                  <Calculator
                    className="w-5 h-5 text-[var(--hm-fg-muted)]"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm text-[var(--hm-fg-secondary)]">
                    {t("header.plan")}
                  </span>
                </Link>
                <Link
                  href="/shop"
                  onClick={() => {
                    setShowMobileMenu(false);
                    trackEvent("nav_click", "shop");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[var(--hm-bg-tertiary)]/50 transition-all"
                >
                  <Store
                    className="w-5 h-5 text-[var(--hm-fg-muted)]"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm text-[var(--hm-fg-secondary)]">
                    {t("header.shop")}
                  </span>
                </Link>
                <Link
                  href={cl("/for-business")}
                  onClick={() => {
                    setShowMobileMenu(false);
                    trackEvent("nav_click", "for-business");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[var(--hm-bg-tertiary)]/50 transition-all"
                >
                  <Building2
                    className="w-5 h-5 text-[var(--hm-fg-muted)]"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm text-[var(--hm-fg-secondary)]">
                    {t("header.forBusiness")}
                  </span>
                </Link>
                <Link
                  href={cl("/how-it-works")}
                  onClick={() => {
                    setShowMobileMenu(false);
                    trackEvent("nav_click", "how-it-works");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[var(--hm-bg-tertiary)]/50 transition-all"
                >
                  <ExternalLink
                    className="w-5 h-5 text-[var(--hm-fg-muted)]"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm text-[var(--hm-fg-secondary)]">
                    {t("header.howItWorks")}
                  </span>
                </Link>
                <Link
                  href="/help"
                  onClick={() => {
                    setShowMobileMenu(false);
                    trackEvent("nav_click", "help");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-[var(--hm-bg-tertiary)]/50 transition-all"
                >
                  <HelpCircle
                    className="w-5 h-5 text-[var(--hm-fg-muted)]"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm text-[var(--hm-fg-secondary)]">
                    {t("help.title") || "Help"}
                  </span>
                </Link>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]/50">
                <p className="text-xs text-[var(--hm-fg-muted)] text-center">
                  {t("header.findTheBestProfessionalsIn")}
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}

// Top-bar mega-dropdown trigger. Cleaner alternative to the previous
// orange-pill + chevron pattern - hover gives a subtle gray bg, active
// state is a 2px brand underline + brand-colored label. Underline rides
// on `::after` via a span so it doesn't shift layout when toggled.
function NavTrigger({
  triggerRef,
  active,
  open,
  onClick,
  label,
  icon,
}: {
  triggerRef: React.RefObject<HTMLButtonElement>;
  active: boolean;
  open: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      ref={triggerRef}
      onClick={onClick}
      aria-haspopup="menu"
      aria-expanded={open}
      className="relative inline-flex items-center gap-1.5 px-2.5 h-8 text-[13px] tracking-[-0.005em] transition-colors whitespace-nowrap hover:text-[var(--hm-brand-500)]"
      style={{
        color: active ? "var(--hm-brand-500)" : "var(--hm-fg-primary)",
        fontWeight: active ? 600 : 500,
      }}
    >
      {icon}
      {label}
      <span
        aria-hidden
        className="absolute left-2.5 right-2.5 -bottom-[1px] h-[2px] rounded-full transition-opacity duration-200"
        style={{
          background: "var(--hm-brand-500)",
          opacity: active ? 1 : 0,
        }}
      />
    </button>
  );
}

// Cart access for the whole app. Renders only when the cart has items, so it
// stays out of the way until you're actually shopping; then it surfaces the
// count and opens the shared cart drawer from any page.
function CartButton() {
  const { count } = useCart();
  const { openCart } = useCartUI();
  const { t } = useLanguage();
  if (count <= 0) return null;
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={t("projects.cartOpen")}
      className="relative flex items-center justify-center w-9 h-9 rounded-[10px] bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-primary)] transition-colors hover:bg-[var(--hm-n-200)] hover:text-[var(--hm-brand-500)]"
    >
      <ShoppingCart className="w-4 h-4" strokeWidth={1.8} />
      <span
        className="absolute -top-1.5 -right-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums text-white ring-2 ring-[var(--hm-bg-elevated)]"
        style={{ background: "var(--hm-brand-500)" }}
      >
        {count > 99 ? "99+" : count}
      </span>
    </button>
  );
}

// Small icon button that opens the global command palette. Mobile
// users can't reach Cmd+K, so this is their entry point. Pulled into
// its own component so the header markup stays scannable.
function CommandPaletteTrigger() {
  const { open } = useCommandPalette();
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={open}
      aria-label={t("commandPalette.openHint")}
      title={t("commandPalette.openHint")}
      className="flex items-center justify-center w-9 h-9 rounded-lg text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-brand-500)] transition-colors"
    >
      <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
    </button>
  );
}

// Spacer component to prevent content from going under fixed header.
// MUST stay in lockstep with the <header> height above (h-14 / 56px).
// Was previously h-12 (48px) which left an 8px gap - content slid
// under the bottom strip of the header on every page that didn't
// already have its own top offset. Same alignment fix flows through
// to the page-level `top-14` sticky bars (job detail, workspace tabs).
export function HeaderSpacer() {
  return (
    <div
      className="h-14 flex-shrink-0"
      style={{ backgroundColor: "var(--hm-bg-elevated)" }}
    />
  );
}
