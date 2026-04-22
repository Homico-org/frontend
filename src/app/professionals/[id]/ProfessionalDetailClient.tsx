"use client";

import ServiceBookingModal from "@/components/booking/ServiceBookingModal";
import AddressPicker from "@/components/common/AddressPicker";
import Checkbox from "@/components/ui/Checkbox";
import Header, { HeaderSpacer } from "@/components/common/Header";
import Select from "@/components/common/Select";
import AboutTab from "@/components/professionals/AboutTab";
import BookingModal from "@/components/professionals/BookingModal";
import ContactModal from "@/components/professionals/ContactModal";
import InviteProToJobModal from "@/components/professionals/InviteProToJobModal";
import PortfolioTab from "@/components/professionals/PortfolioTab";
import { type ProfileSidebarTab } from "@/components/professionals/ProfileSidebar";
import ReviewsTab from "@/components/professionals/ReviewsTab";
import SimilarProfessionals from "@/components/professionals/SimilarProfessionals";
import SchedulePanel from "@/components/settings/SchedulePanel";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmModal, Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { features } from "@/config/features";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import dynamic from "next/dynamic";

const MobileProServicesCard = dynamic(() => import("./MobileProServicesCard"), {
  ssr: false,
});
import type {
  BaseEntity,
  Job,
  PortfolioItem,
  ProProfile,
} from "@/types/shared";
import { PricingModel } from "@/types/shared";
import { formatDate } from "@/utils/dateUtils";
import { backOrNavigate } from "@/utils/navigationUtils";
import { formatGeorgianPhoneDisplay } from "@/utils/validationUtils";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Briefcase,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Facebook,
  Link2,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Play,
  Plus,
  Settings,
  Share2,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// API response types for before/after pairs (supports both formats)
interface ApiBeforeAfterPair {
  before?: string;
  after?: string;
  beforeImage?: string;
  afterImage?: string;
}

// Extended PortfolioItem with beforeAfterPairs from API
interface ExtendedPortfolioItem extends PortfolioItem {
  beforeAfterPairs?: ApiBeforeAfterPair[];
}

// Extended embedded project type
interface ExtendedEmbeddedProject {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  images?: string[];
  videos?: string[];
  beforeAfter?: { before: string; after: string }[];
  beforeAfterPairs?: ApiBeforeAfterPair[];
}

// Page-specific review with populated client info
interface PageReview extends BaseEntity {
  clientId?: {
    name: string;
    avatar?: string;
    city?: string;
  };
  rating: number;
  text?: string;
  photos?: string[];
  createdAt: string;
  projectTitle?: string;
  isAnonymous?: boolean;
  source?: "homico" | "external";
  externalClientName?: string;
  externalClientPhone?: string;
  externalVerifiedAt?: string;
  isVerified?: boolean;
}

/** Animated counter that counts up from 0 */
function AnimatedCounter({
  value,
  decimals = 0,
  duration = 1.2,
}: {
  value: number;
  decimals?: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    let startTime: number;
    let frame: number;
    const animate = (t: number) => {
      if (!startTime) startTime = t;
      const progress = Math.min((t - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay((eased * value).toFixed(decimals));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, decimals, duration]);
  return <>{display}</>;
}

export default function ProfessionalDetailClient({
  initialProfile,
}: {
  initialProfile?: ProProfile | null;
}) {
  const params = useParams();
  const paramId = useMemo(() => {
    const raw = (params as any)?.id as string | string[] | undefined;
    if (!raw) return undefined;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, locale, pick } = useLanguage();
  const toast = useToast();
  const { trackEvent } = useAnalytics();
  const { categories: CATEGORIES } = useCategories();

  const [profile, setProfile] = useState<ProProfile | null>(
    initialProfile ?? null,
  );
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showServiceBookingModal, setShowServiceBookingModal] = useState(false);
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [existingBookings, setExistingBookings] = useState<
    { id: string; date: string; startHour: number; status: string }[]
  >([]);
  const [reviews, setReviews] = useState<PageReview[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<{
    images: string[];
    videos?: string[];
    beforeAfter?: { before: string; after: string }[];
    title: string;
    currentIndex: number;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileSidebarTab>("portfolio");

  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [showAvatarZoom, setShowAvatarZoom] = useState(false);

  // Invite-to-job (client -> pro)
  const [myMatchingOpenJobs, setMyMatchingOpenJobs] = useState<Job[]>([]);
  const [myOpenJobsLoaded, setMyOpenJobsLoaded] = useState(false);
  const [showInviteToJobModal, setShowInviteToJobModal] = useState(false);
  // Owner edit states
  const [showEditAboutModal, setShowEditAboutModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<{
    id: string;
    title: string;
    description?: string;
    location?: string;
    images: string[];
    videos?: string[];
    beforeAfter?: { before: string; after: string }[];
  } | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  // Title/tagline editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Pricing editing state (owner)
  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [editedPricingModel, setEditedPricingModel] = useState<PricingModel>(
    PricingModel.FIXED,
  );
  const [editedBasePrice, setEditedBasePrice] = useState("");
  const [editedMaxPrice, setEditedMaxPrice] = useState("");

  // Admin verification panel state
  const [showAdminVerificationModal, setShowAdminVerificationModal] =
    useState(false);
  const [adminVerificationStatus, setAdminVerificationStatus] =
    useState<string>("");
  const [adminVerificationNotes, setAdminVerificationNotes] = useState("");
  const [adminNotifyUser, setAdminNotifyUser] = useState(true);
  const [isAdminSaving, setIsAdminSaving] = useState(false);

  // Client-only mount flag. The desktop sidebar aside has many conditional
  // buttons (edit icons, booking CTAs, phone reveal, etc.) that depend on
  // user auth state populated by AuthContext's useEffect. React 18 concurrent
  // rendering occasionally flushes those setState updates into the hydration
  // pass, producing "server HTML contains <button>" mismatches. Gating the
  // aside behind `mounted` skips SSR for the whole subtree — there's nothing
  // for React to reconcile, so the mismatch can't happen.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Check if current user is viewing their own profile
  const isOwner = user?.id === profile?.id;
  const isAdmin = user?.role === "admin";
  const canEdit = isOwner || isAdmin;

  const fetchProfileAbortRef = useRef<AbortController | null>(null);
  const profileFetchInFlightRef = useRef<string | null>(null);
  const profileViewTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
    // Show floating button immediately on mobile for visitors
    const isMobile = window.innerWidth < 1024;
    if (isMobile && !isOwner) {
      setShowFloatingButton(true);
    }

    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        // On mobile, always show for visitors; on desktop, show after hero is scrolled
        const isMobileNow = window.innerWidth < 1024;
        if (isMobileNow && !isOwner) {
          setShowFloatingButton(true);
        } else {
          setShowFloatingButton(heroBottom < 100);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOwner]);

  useEffect(() => {
    if (!paramId) return;
    // If server already provided the right profile, avoid an extra client fetch.
    if (
      profile &&
      (profile.id === paramId ||
        (profile.uid !== undefined && String(profile.uid) === String(paramId)))
    ) {
      setIsLoading(false);
      return;
    }
    // Dedupe in React 18 StrictMode / rapid rerenders
    if (profileFetchInFlightRef.current === paramId) return;
    profileFetchInFlightRef.current = paramId;

    fetchProfileAbortRef.current?.abort();
    const controller = new AbortController();
    fetchProfileAbortRef.current = controller;

    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/pros/${paramId}`, {
          signal: controller.signal,
        });
        const data = response.data;
        setProfile(data);
      } catch (err) {
        // Ignore aborts (navigation / StrictMode cleanup)
        if ((err as any)?.name === "CanceledError") return;
        if ((err as any)?.code === "ERR_CANCELED") return;

        const error = err as {
          message?: string;
          response?: { status?: number };
        };
        if (error.response?.status === 404) {
          setError("Profile not found");
        } else {
          setError(error.message || "Failed to load profile");
        }
      } finally {
        setIsLoading(false);
        if (profileFetchInFlightRef.current === paramId) {
          profileFetchInFlightRef.current = null;
        }
      }
    };
    fetchProfile();

    return () => {
      controller.abort();
    };
  }, [paramId, profile]);

  // Fetch existing bookings with this pro (for clients)
  useEffect(() => {
    if (!profile?.id || !user || isOwner || !features.bookings) return;
    api
      .get("/bookings/my")
      .then((res) => {
        const all = res.data || [];
        const withThisPro = all.filter(
          (b: {
            professional?: { _id?: string; id?: string };
            status: string;
          }) => {
            const proId = b.professional?.id || b.professional?._id;
            return (
              proId === profile.id &&
              (b.status === "pending" || b.status === "confirmed")
            );
          },
        );
        setExistingBookings(
          withThisPro.map(
            (b: {
              _id?: string;
              id?: string;
              date: string;
              startHour: number;
              status: string;
            }) => ({
              id: b.id || b._id || "",
              date: b.date,
              startHour: b.startHour,
              status: b.status,
            }),
          ),
        );
      })
      .catch(() => {});
  }, [profile?.id, user, isOwner]);

  useEffect(() => {
    if (!profile?.id) return;
    if (profileViewTrackedRef.current === profile.id) return;
    profileViewTrackedRef.current = profile.id;

    trackEvent(AnalyticsEvent.PROFILE_VIEW, {
      proId: profile.id,
      proName: profile.name,
      category: profile.categories?.[0],
    });

    // Optimistically increment view count since backend increments it async
    // This ensures the displayed count reflects that this visit was counted
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        profileViewCount: (prev.profileViewCount ?? 0) + 1,
      };
    });
  }, [profile?.id, profile?.name, profile?.categories, trackEvent]);

  useEffect(() => {
    if (profile?.name) {
      document.title = `${profile.name} | Homico`;
    }
    return () => {
      document.title = "Homico";
    };
  }, [profile?.name]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!profile?.id) return;
      try {
        const response = await api.get(`/portfolio/pro/${profile.id}`);
        const portfolioData = Array.isArray(response.data) ? response.data : [];
        // Transform _id to id for frontend consistency
        const transformedData = portfolioData.map((item: any) => ({
          ...item,
          id: item.id || item._id,
        }));
        setPortfolio(transformedData);
      } catch (err) {
        console.error("Failed to fetch portfolio:", err);
      }
    };
    if (profile?.id) fetchPortfolio();
  }, [profile?.id]);

  const fetchReviews = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const response = await api.get(`/reviews/pro/${profile.id}`);
      // Ensure reviews have proper id field
      const reviewsData = Array.isArray(response.data) ? response.data : [];
      setReviews(
        reviewsData.map((r: PageReview & { _id?: string }) => ({
          ...r,
          id: r.id || r._id || "",
        })),
      );
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) fetchReviews();
  }, [profile?.id, fetchReviews]);

  // Close avatar zoom on Escape
  useEffect(() => {
    if (!showAvatarZoom) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAvatarZoom(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showAvatarZoom]);

  const proCategories = useMemo(() => {
    if (!profile) return [];
    const cats =
      (profile.categories?.length
        ? profile.categories
        : profile.selectedCategories) || [];
    const knownKeys = new Set(CATEGORIES.map((c) => c.key));
    return cats.filter((c) => c && knownKeys.has(c));
  }, [profile, CATEGORIES]);

  const proSubcategories = useMemo(() => {
    if (!profile) return [];
    const subcats =
      (profile.subcategories?.length
        ? profile.subcategories
        : profile.selectedSubcategories) || [];
    const knownSubKeys = new Set<string>();
    for (const cat of CATEGORIES) {
      for (const sub of cat.subcategories) {
        knownSubKeys.add(sub.key);
        if (sub.children) {
          for (const child of sub.children) {
            knownSubKeys.add(child.key);
          }
        }
      }
    }
    return subcats.filter(
      (s) => s && (knownSubKeys.has(s) || s.startsWith("custom:")),
    );
  }, [profile, CATEGORIES]);

  // Fetch my open jobs to decide whether to show "Invite to job" CTA
  useEffect(() => {
    if (!user || isOwner) {
      setMyMatchingOpenJobs([]);
      setMyOpenJobsLoaded(false);
      return;
    }

    let cancelled = false;
    const fetchMyOpenJobs = async () => {
      try {
        const response = await api.get("/jobs/my-jobs?status=open");
        const list = Array.isArray(response.data)
          ? (response.data as Job[])
          : [];
        if (!cancelled) {
          const normalize = (s: string) => s.trim().toLowerCase();
          const proSet = new Set(proSubcategories.map(normalize));

          const getJobKeys = (job: Job): string[] => {
            const skills = Array.isArray(job.skills) ? job.skills : [];
            const sub = (job.subcategory || "").toString();
            // Some legacy jobs may encode the "skill" in category; include it for matching.
            const cat = (job.category || "").toString();
            return [...skills, sub, cat].filter(Boolean).map(normalize);
          };

          const matches = list.filter((job) => {
            if (proSet.size === 0) return false;
            const keys = getJobKeys(job);
            return keys.some((k) => proSet.has(k));
          });

          setMyMatchingOpenJobs(matches);
        }
      } catch (err) {
        console.error("Failed to fetch my open jobs:", err);
        if (!cancelled) setMyMatchingOpenJobs([]);
      } finally {
        if (!cancelled) setMyOpenJobsLoaded(true);
      }
    };

    fetchMyOpenJobs();
    return () => {
      cancelled = true;
    };
  }, [user, isOwner, proSubcategories]);

  const isBasicTier =
    !profile?.premiumTier ||
    profile?.premiumTier === "none" ||
    profile?.premiumTier === "basic";

  const pricingMeta = useMemo(() => {
    if (!profile) return null;
    const model =
      (profile.pricingModel as unknown as string | undefined) || undefined;
    const base =
      typeof profile.basePrice === "number" ? profile.basePrice : undefined;
    const max =
      typeof profile.maxPrice === "number" ? profile.maxPrice : undefined;
    const hasBase = typeof base === "number" && base > 0;
    const hasMax = typeof max === "number" && max > 0;

    // Normalize legacy values
    const normalizedIncoming =
      model === "hourly"
        ? "byAgreement"
        : model === "per_sqm" || model === "sqm"
          ? "per_sqm"
          : model === "daily" || model === "from"
            ? "fixed"
            : model === "project_based"
              ? "range"
              : model;

    const normalized =
      normalizedIncoming === "range"
        ? hasBase && hasMax && max! > base!
          ? "range"
          : hasBase || hasMax
            ? "fixed"
            : "byAgreement"
        : normalizedIncoming === "per_sqm"
          ? hasBase || hasMax
            ? "per_sqm"
            : "byAgreement"
          : normalizedIncoming === "fixed"
            ? hasBase || hasMax
              ? "fixed"
              : "byAgreement"
            : normalizedIncoming === "byAgreement"
              ? "byAgreement"
              : undefined;

    if (normalized === "byAgreement") {
      return {
        typeLabel: t("common.negotiable"),
        valueLabel: null as string | null,
      };
    }
    if (normalized === "per_sqm" && (hasBase || hasMax)) {
      const val = hasBase ? base! : max!;
      return {
        typeLabel: t("professional.perSqm"),
        valueLabel: `${val}₾${t("timeUnits.perSqm")}`,
      };
    }
    if (normalized === "range" && hasBase && hasMax) {
      return {
        typeLabel: t("common.priceRange"),
        valueLabel: `${base}₾ - ${max}₾`,
      };
    }
    if (normalized === "fixed" && (hasBase || hasMax)) {
      const val = hasBase ? base! : max!;
      return {
        typeLabel: t("common.fixed"),
        valueLabel: `${val}₾`,
      };
    }
    return null;
  }, [profile, t]);

  const handleContact = () => {
    if (!user) {
      openLoginModal();
      return;
    }

    // For basic tier pros, reveal phone number instead of messaging
    if (isBasicTier && profile?.phone) {
      setPhoneRevealed(true);
      trackEvent(AnalyticsEvent.CONTACT_REVEAL, {
        proId: profile.id,
        proName: profile.name,
      });
      return;
    }

    router.push(`/messages?recipient=${profile?.id}`);
  };

  // Share functions
  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  };

  const getShareText = () => {
    if (!profile) return "";
    return `${profile.name} - ${profile.title} | Homico`;
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
      "width=600,height=400",
    );
    setShowShareMenu(false);
  };

  const handleShareWhatsApp = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
    setShowShareMenu(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopySuccess(true);
      toast.success(t("common.linkCopied"));
      setTimeout(() => setCopySuccess(false), 2000);
      setShowShareMenu(false);
    } catch (err) {
      // Some browsers (notably iOS Safari) can throw NotReadableError / NotAllowedError
      // even on user gesture. Fall back to legacy copy if possible.
      try {
        const input = document.createElement("input");
        input.value = getShareUrl();
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        setCopySuccess(true);
        toast.success(t("common.linkCopied"));
        setTimeout(() => setCopySuccess(false), 2000);
        setShowShareMenu(false);
        return;
      } catch {
        // ignore
      }

      console.error("Failed to copy link:", err);
      toast.error(t("common.error"));
    }
  };

  // === OWNER CRUD FUNCTIONS ===
  const handleSaveName = async () => {
    if (!canEdit || !profile || !editedName.trim()) return;
    if (editedName.trim() === profile.name) {
      setIsEditingName(false);
      return;
    }
    setIsSaving(true);
    try {
      await api.patch("/users/me", { name: editedName.trim() });
      setProfile((prev) =>
        prev ? { ...prev, name: editedName.trim() } : prev,
      );
      setIsEditingName(false);
      toast.success(t("professional.savedSuccessfully"));
    } catch (err) {
      toast.error(t("professional.failedToSave"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!canEdit || !profile) return;
    const newTitle = editedTitle.trim();
    if (newTitle === (profile.title || "")) {
      setIsEditingTitle(false);
      return;
    }
    setIsSaving(true);
    try {
      await api.patch("/users/me/pro-profile", { title: newTitle || null });
      setProfile((prev) =>
        prev ? { ...prev, title: newTitle || undefined } : prev,
      );
      setIsEditingTitle(false);
      toast.success(t("professional.savedSuccessfully"));
    } catch (err) {
      toast.error(t("professional.failedToSave"));
    } finally {
      setIsSaving(false);
    }
  };

  const openPricingEdit = () => {
    if (!canEdit || !profile) return;
    const model =
      (profile.pricingModel as unknown as string | undefined) || "byAgreement";
    const normalized: PricingModel =
      model === "sqm" || model === PricingModel.PER_SQUARE_METER
        ? PricingModel.PER_SQUARE_METER
        : model === PricingModel.RANGE
          ? PricingModel.RANGE
          : model === PricingModel.BY_AGREEMENT || model === "hourly"
            ? PricingModel.BY_AGREEMENT
            : PricingModel.FIXED;

    setEditedPricingModel(normalized);
    setEditedBasePrice(
      typeof profile.basePrice === "number" ? String(profile.basePrice) : "",
    );
    setEditedMaxPrice(
      typeof profile.maxPrice === "number" ? String(profile.maxPrice) : "",
    );
    setIsEditingPricing(true);
  };

  const handleSavePricing = async () => {
    if (!canEdit || !profile) return;

    const base = editedBasePrice ? Number(editedBasePrice) : undefined;
    const max = editedMaxPrice ? Number(editedMaxPrice) : undefined;

    const baseValid = base !== undefined && Number.isFinite(base) && base > 0;
    const maxValid = max !== undefined && Number.isFinite(max) && max > 0;

    if (editedPricingModel === PricingModel.BY_AGREEMENT) {
      // ok
    } else if (editedPricingModel === PricingModel.RANGE) {
      if (!baseValid || !maxValid || max! < base!) {
        toast.error(
          t("common.error"),
          t("common.invalidPriceRange") || t("common.invalid"),
        );
        return;
      }
    } else {
      // fixed or per_sqm
      if (!baseValid) {
        toast.error(
          t("common.error"),
          t("common.invalidPrice") || t("common.invalid"),
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      // Abort any in-flight profile fetch so it can't overwrite our just-saved values.
      fetchProfileAbortRef.current?.abort();
      profileFetchInFlightRef.current = null;

      const response = await api.patch("/users/me/pro-profile", {
        pricingModel: editedPricingModel,
        basePrice:
          editedPricingModel === PricingModel.BY_AGREEMENT ? null : base,
        maxPrice:
          editedPricingModel === PricingModel.BY_AGREEMENT
            ? null
            : editedPricingModel === PricingModel.RANGE
              ? max
              : null,
      });

      // Prefer backend-normalized payload (ensures enums/fields match what server stores).
      const updated = response?.data as ProProfile | undefined;
      if (updated) {
        setProfile((prev) => {
          if (!prev) return updated;
          const prevViews = prev.profileViewCount ?? 0;
          const updatedViews = (updated as any)?.profileViewCount ?? 0;
          return {
            ...prev,
            ...updated,
            profileViewCount: Math.max(prevViews, updatedViews),
          };
        });
      } else {
        // Fallback (shouldn't happen): optimistic local update
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                pricingModel: editedPricingModel,
                basePrice:
                  editedPricingModel === PricingModel.BY_AGREEMENT
                    ? undefined
                    : base,
                maxPrice:
                  editedPricingModel === PricingModel.RANGE ? max : undefined,
              }
            : prev,
        );
      }
      setIsEditingPricing(false);
      toast.success(t("professional.savedSuccessfully"));
    } catch (err) {
      toast.error(t("professional.failedToSave"));
    } finally {
      setIsSaving(false);
    }
  };

  // Admin verification update handler
  const handleAdminVerificationUpdate = async () => {
    if (!isAdmin || !profile?.id) return;
    setIsAdminSaving(true);
    try {
      console.log(
        "[Admin] Updating verification for pro:",
        profile.id,
        "to status:",
        adminVerificationStatus,
      );
      const response = await api.patch(
        `/admin/pros/${profile.id}/verification`,
        {
          status: adminVerificationStatus,
          notes: adminVerificationNotes || undefined,
          notifyUser: adminNotifyUser,
        },
      );

      const updated = response?.data as ProProfile | undefined;
      console.log("[Admin] Update response:", updated?.verificationStatus);

      if (updated) {
        setProfile((prev) => {
          if (!prev) return updated;
          return {
            ...prev,
            verificationStatus: updated.verificationStatus,
            verificationNotes: updated.verificationNotes,
          };
        });
      }

      setShowAdminVerificationModal(false);
      toast.success(
        t("admin.verificationUpdated") || "Verification status updated",
      );
    } catch (err) {
      console.error("[Admin] Update failed:", err);
      toast.error(
        t("admin.verificationUpdateFailed") || "Failed to update verification",
      );
    } finally {
      setIsAdminSaving(false);
    }
  };

  const openAdminVerificationModal = () => {
    setAdminVerificationStatus(profile?.verificationStatus || "pending");
    setAdminVerificationNotes(profile?.verificationNotes || "");
    setAdminNotifyUser(true);
    setShowAdminVerificationModal(true);
  };

  const handleSaveAbout = async (data: { description: string }) => {
    if (!canEdit || !profile) return;
    setIsSaving(true);
    try {
      await api.patch("/users/me/pro-profile", {
        description: data.description,
      });
      setProfile((prev) =>
        prev ? { ...prev, description: data.description } : prev,
      );
      setShowEditAboutModal(false);
      toast.success(t("professional.savedSuccessfully"));
    } catch (err) {
      toast.error(t("professional.failedToSave"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProject = async (data: {
    title: string;
    description?: string;
    location?: string;
    images: string[];
    videos?: string[];
    beforeAfter?: { before: string; after: string }[];
  }) => {
    if (!canEdit || !profile) return;
    setIsSaving(true);
    try {
      const response = await api.post(`/portfolio?proId=${profile.id}`, {
        title: data.title,
        description: data.description,
        location: data.location,
        images: data.images,
        videos: data.videos,
        beforeAfter: data.beforeAfter,
      });
      setPortfolio((prev) => [...prev, response.data]);
      setShowAddProjectModal(false);
      toast.success(t("professional.projectAdded"));
    } catch (err) {
      toast.error(t("professional.failedToAddProject"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProject = async (data: {
    title: string;
    description?: string;
    location?: string;
    images: string[];
    videos?: string[];
    beforeAfter?: { before: string; after: string }[];
  }) => {
    if (!canEdit || !editingProject || !profile?.id) return;
    setIsSaving(true);
    try {
      // Check if this project exists in the portfolio collection
      const existsInPortfolio = portfolio.some(
        (p) => p.id === editingProject.id,
      );

      if (existsInPortfolio) {
        // Update existing portfolio item
        await api.patch(`/portfolio/${editingProject.id}`, {
          title: data.title,
          description: data.description,
          location: data.location,
          images: data.images,
          videos: data.videos,
          beforeAfter: data.beforeAfter,
        });
        setPortfolio((prev) =>
          prev.map((p) =>
            p.id === editingProject.id
              ? {
                  ...p,
                  title: data.title,
                  description: data.description,
                  location: data.location,
                  images: data.images,
                }
              : p,
          ),
        );
      } else {
        // Project is embedded in profile, create new portfolio item
        const response = await api.post(`/portfolio?proId=${profile.id}`, {
          title: data.title,
          description: data.description,
          location: data.location,
          images: data.images,
          videos: data.videos,
          beforeAfter: data.beforeAfter,
        });
        setPortfolio((prev) => [...prev, response.data]);
      }

      setEditingProject(null);
      toast.success(t("professional.projectUpdated"));
    } catch (err) {
      toast.error(t("professional.failedToUpdateProject"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!canEdit || !deleteProjectId) return;
    setIsSaving(true);

    console.log("[handleDeleteProject]", {
      deleteProjectId,
      portfolioIds: portfolio.map((p) => ({ id: p.id, _id: (p as any)._id })),
      embeddedProjectIds: profile?.portfolioProjects?.map((p, idx) => ({
        id: p.id,
        idx,
        fallbackId: `embedded-${idx}`,
      })),
    });

    try {
      // Check if this project exists in the portfolio collection
      // Check both id and _id in case the transformation didn't work
      const existsInPortfolio = portfolio.some(
        (p) => p.id === deleteProjectId || (p as any)._id === deleteProjectId,
      );

      if (existsInPortfolio) {
        console.log(
          "[handleDeleteProject] Deleting from portfolio collection:",
          deleteProjectId,
        );
        await api.delete(`/portfolio/${deleteProjectId}`);
        setPortfolio((prev) =>
          prev.filter(
            (p) =>
              p.id !== deleteProjectId && (p as any)._id !== deleteProjectId,
          ),
        );
      } else {
        // Check if it's an embedded project in profile.portfolioProjects
        const embeddedIdx = profile?.portfolioProjects?.findIndex(
          (p, idx) =>
            p.id === deleteProjectId || `embedded-${idx}` === deleteProjectId,
        );

        if (
          embeddedIdx !== undefined &&
          embeddedIdx >= 0 &&
          profile?.portfolioProjects
        ) {
          // Remove from embedded portfolioProjects via profile update
          const updatedProjects = profile.portfolioProjects.filter(
            (_, idx) => idx !== embeddedIdx,
          );
          await api.patch("/users/me/pro-profile", {
            portfolioProjects: updatedProjects,
          });
          setProfile((prev) =>
            prev ? { ...prev, portfolioProjects: updatedProjects } : prev,
          );
        }
      }

      setDeleteProjectId(null);
      toast.success(t("professional.projectDeleted"));
    } catch (err) {
      toast.error(t("professional.failedToDeleteProject"));
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryLabel = (categoryKey: string) => {
    if (!categoryKey) return "";
    const category = CATEGORIES.find((cat) => cat.key === categoryKey);
    if (category)
      return (
        { ka: category.nameKa, en: category.name, ru: category.name }[locale] ??
        category.name
      );
    return categoryKey
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Check if title is a category name (should not be displayed as tagline)
  const isCategoryBasedTitle = (title: string) => {
    if (!title) return false;
    const lowerTitle = title.toLowerCase().trim();
    return CATEGORIES.some(
      (cat) =>
        cat.name.toLowerCase() === lowerTitle ||
        cat.nameKa.toLowerCase() === lowerTitle ||
        cat.key === lowerTitle,
    );
  };

  // Experience level labels - matches StepSelectServices options
  const getExperienceLabel = (experience: string) => {
    const year = t("timeUnits.year");
    const labels: Record<string, string> = {
      "1-2": `1-2${year}`,
      "3-5": `3-5${year}`,
      "5-10": `5-10${year}`,
      "10+": `10+${year}`,
    };
    return labels[experience] || experience;
  };

  // Get service with experience from selectedServices array
  const getServiceExperience = (subcategoryKey: string) => {
    if (!profile?.selectedServices) return null;
    const service = profile.selectedServices.find(
      (s) => s.key === subcategoryKey,
    );
    return service?.experience || null;
  };

  const getSubcategoryLabel = (subcategoryKey: string) => {
    if (!subcategoryKey) return "";
    if (subcategoryKey.startsWith("custom:"))
      return subcategoryKey.replace("custom:", "");
    for (const category of CATEGORIES) {
      const subcategory = category.subcategories.find(
        (sub) => sub.key === subcategoryKey,
      );
      if (subcategory)
        return (
          {
            ka: subcategory.nameKa,
            en: subcategory.name,
            ru: subcategory.name,
          }[locale] ?? subcategory.name
        );
      for (const sub of category.subcategories) {
        if (sub.children) {
          const subSub = sub.children.find(
            (child) => child.key === subcategoryKey,
          );
          if (subSub)
            return (
              { ka: subSub.nameKa, en: subSub.name, ru: subSub.name }[locale] ??
              subSub.name
            );
        }
      }
    }
    return subcategoryKey
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  // Unified project structure for portfolio display
  interface UnifiedProject {
    id: string;
    title: string;
    description?: string;
    location?: string;
    images: string[];
    videos: string[];
    beforeAfter?: { before: string; after: string }[];
    date?: string;
    source?: "external" | "homico";
    clientName?: string;
    clientAvatar?: string;
    clientId?: string;
    rating?: number;
    review?: string;
    category?: string;
    completedDate?: string;
    projectType?: string;
  }

  const getUnifiedProjects = useCallback((): UnifiedProject[] => {
    const projects: UnifiedProject[] = [];
    const seenTitles = new Set<string>();

    // Add from portfolio items (fetched separately)
    portfolio.forEach((item) => {
      const titleKey = item.title?.toLowerCase().trim() || item.id;
      if (seenTitles.has(titleKey)) return;
      seenTitles.add(titleKey);

      // Convert beforeAfterPairs first so we can filter imageUrl
      const beforeAfterData: { before: string; after: string }[] = [];
      const extendedItem = item as ExtendedPortfolioItem;
      if (
        extendedItem.beforeAfterPairs &&
        extendedItem.beforeAfterPairs.length > 0
      ) {
        extendedItem.beforeAfterPairs.forEach((pair: ApiBeforeAfterPair) => {
          beforeAfterData.push({
            before: pair.beforeImage || pair.before || "",
            after: pair.afterImage || pair.after || "",
          });
        });
      } else if (item.beforeAfter && item.beforeAfter.length > 0) {
        beforeAfterData.push(...item.beforeAfter);
      }

      // Build images array, excluding any that are part of B/A pairs
      const baUrls = new Set(
        beforeAfterData.flatMap((p) => [p.before, p.after]),
      );
      const images: string[] = [];
      if (item.imageUrl && !baUrls.has(item.imageUrl))
        images.push(item.imageUrl);
      if (item.images) {
        item.images.forEach((img) => {
          if (!images.includes(img) && !baUrls.has(img)) images.push(img);
        });
      }

      const hasMedia = images.length > 0 || beforeAfterData.length > 0;
      if (hasMedia) {
        projects.push({
          id: item.id,
          title: item.title,
          description: item.description,
          location: item.location,
          images,
          videos: item.videos || [],
          beforeAfter: beforeAfterData,
          date: item.completedDate || item.projectDate,
          source: item.source,
          clientName:
            typeof item.clientId === "object" && item.clientId
              ? (item.clientId as Record<string, string>).name ||
                item.clientName
              : item.clientName,
          clientAvatar:
            typeof item.clientId === "object" && item.clientId
              ? (item.clientId as Record<string, string>).avatar
              : undefined,
          clientId:
            typeof item.clientId === "string"
              ? item.clientId
              : (item.clientId as Record<string, string>)?.id ||
                (item.clientId as Record<string, string>)?._id,
          rating: item.rating,
          review: item.review,
          category: item.category,
          completedDate: item.completedDate,
          projectType: item.projectType,
        });
      }
    });

    // Add from profile's embedded portfolioProjects (avoid duplicates by title)
    // These are typically external/manual additions
    profile?.portfolioProjects?.forEach((project, idx) => {
      const titleKey = project.title?.toLowerCase().trim() || `project-${idx}`;
      if (seenTitles.has(titleKey)) return;
      seenTitles.add(titleKey);

      // Convert beforeAfterPairs (with beforeImage/afterImage) to beforeAfter (with before/after)
      const beforeAfterData: { before: string; after: string }[] = [];
      const extendedProject = project as ExtendedEmbeddedProject;
      if (
        extendedProject.beforeAfterPairs &&
        extendedProject.beforeAfterPairs.length > 0
      ) {
        extendedProject.beforeAfterPairs.forEach((pair: ApiBeforeAfterPair) => {
          beforeAfterData.push({
            before: pair.beforeImage || pair.before || "",
            after: pair.afterImage || pair.after || "",
          });
        });
      } else if (
        extendedProject.beforeAfter &&
        extendedProject.beforeAfter.length > 0
      ) {
        beforeAfterData.push(...extendedProject.beforeAfter);
      }

      const hasMedia =
        (project.images && project.images.length > 0) ||
        (project.videos && project.videos.length > 0) ||
        beforeAfterData.length > 0;
      if (hasMedia) {
        projects.push({
          id: project.id || `embedded-${idx}`,
          title: project.title,
          description: project.description,
          location: project.location,
          images: project.images || [],
          videos: project.videos || [],
          beforeAfter: beforeAfterData,
          source: "external", // Embedded projects are manual/external
        });
      }
    });

    return projects;
  }, [portfolio, profile?.portfolioProjects]);

  // Flatten all images for lightbox navigation
  const getAllPortfolioImages = useCallback(() => {
    const images: { url: string; title?: string; description?: string }[] = [];
    getUnifiedProjects().forEach((project) => {
      project.images.forEach((img, idx) => {
        images.push({
          url: img,
          title: project.title,
          description: idx === 0 ? project.description : undefined,
        });
      });
    });
    return images;
  }, [getUnifiedProjects]);

  const getGroupedServices = useCallback(() => {
    const groups: Record<string, string[]> = {};
    profile?.categories.forEach((cat) => {
      groups[cat] = [];
    });
    profile?.subcategories?.forEach((sub) => {
      for (const category of CATEGORIES) {
        const found = category.subcategories.find((s) => s.key === sub);
        if (found) {
          if (!groups[category.key]) groups[category.key] = [];
          groups[category.key].push(sub);
          break;
        }
      }
    });
    return groups;
  }, [profile?.categories, profile?.subcategories, CATEGORIES]);

  const cityTranslationsKa: Record<string, string> = {
    tbilisi: "თბილისი",
    rustavi: "რუსთავი",
    mtskheta: "მცხეთა",
    batumi: "ბათუმი",
    kutaisi: "ქუთაისი",
    gori: "გორი",
    zugdidi: "ზუგდიდი",
    telavi: "თელავი",
    nationwide: "საქართველოს მასშტაბით",
    georgia: "საქართველო",
    countrywide: "საქართველოს მასშტაბით",
  };

  const cityTranslationsEn: Record<string, string> = {
    tbilisi: "Tbilisi",
    rustavi: "Rustavi",
    mtskheta: "Mtskheta",
    batumi: "Batumi",
    kutaisi: "Kutaisi",
    gori: "Gori",
    zugdidi: "Zugdidi",
    telavi: "Telavi",
    nationwide: "Nationwide",
    georgia: "Georgia",
    countrywide: "Nationwide",
    "საქართველოს მასშტაბით": "Nationwide",
    საქართველო: "Georgia",
  };

  const translateCity = (city: string) => {
    const lowerCity = city.toLowerCase().trim();
    const mapByLocale: Record<typeof locale, Record<string, string>> = {
      ka: cityTranslationsKa,
      en: cityTranslationsEn,
      ru: cityTranslationsEn,
    };
    const map = mapByLocale[locale] || cityTranslationsEn;
    return map[city] || map[lowerCity] || city;
  };

  const totalCompletedJobs =
    (profile?.completedJobs || 0) + (profile?.externalCompletedJobs || 0);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  }, []);

  const nextImage = useCallback(() => {
    const images = getAllPortfolioImages();
    setLightboxIndex((prev) =>
      images.length ? (prev + 1) % images.length : 0,
    );
  }, [getAllPortfolioImages]);

  const prevImage = useCallback(() => {
    const images = getAllPortfolioImages();
    setLightboxIndex((prev) =>
      images.length ? (prev - 1 + images.length) % images.length : 0,
    );
  }, [getAllPortfolioImages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle project lightbox navigation
      if (selectedProject) {
        if (e.key === "Escape") setSelectedProject(null);
        if (e.key === "ArrowRight") {
          setSelectedProject((prev) =>
            prev
              ? {
                  ...prev,
                  currentIndex: (prev.currentIndex + 1) % prev.images.length,
                }
              : null,
          );
        }
        if (e.key === "ArrowLeft") {
          setSelectedProject((prev) =>
            prev
              ? {
                  ...prev,
                  currentIndex:
                    (prev.currentIndex - 1 + prev.images.length) %
                    prev.images.length,
                }
              : null,
          );
        }
        return;
      }
      // Handle old lightbox
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, selectedProject, closeLightbox, nextImage, prevImage]);

  // Loading state - skeleton preview
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--hm-bg-page)]">
        <Header />
        <HeaderSpacer />
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
          <div className="bg-[var(--hm-bg-elevated)] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-[var(--hm-border-subtle)] shadow-lg shadow-[var(--hm-n-900)]/[0.03]">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl sm:rounded-2xl bg-[var(--hm-bg-tertiary)] animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                <div className="h-7 sm:h-8 w-48 sm:w-56 bg-[var(--hm-bg-tertiary)] rounded-lg animate-pulse" />
                <div className="h-4 sm:h-5 w-32 sm:w-40 bg-[var(--hm-bg-tertiary)] rounded animate-pulse" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-8 sm:h-9 w-16 bg-[var(--hm-bg-tertiary)] rounded-full animate-pulse" />
                  <div className="h-8 sm:h-9 w-24 bg-[var(--hm-bg-tertiary)] rounded-full animate-pulse" />
                  <div className="h-8 sm:h-9 w-20 bg-[var(--hm-bg-tertiary)] rounded-full animate-pulse" />
                </div>
                <div className="flex gap-1.5">
                  <div className="h-7 w-20 bg-[var(--hm-bg-tertiary)] rounded-full animate-pulse" />
                  <div className="h-7 w-20 bg-[var(--hm-bg-tertiary)] rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          {/* Tab skeleton */}
          <div className="flex gap-3 mt-6">
            <div className="h-10 w-24 bg-[var(--hm-bg-tertiary)] rounded-xl animate-pulse" />
            <div className="h-10 w-24 bg-[var(--hm-bg-tertiary)] rounded-xl animate-pulse" />
            <div className="h-10 w-24 bg-[var(--hm-bg-tertiary)] rounded-xl animate-pulse" />
          </div>
          <div className="mt-6 space-y-4">
            <div className="h-32 bg-[var(--hm-bg-tertiary)] rounded-2xl animate-pulse" />
            <div className="h-24 bg-[var(--hm-bg-tertiary)] rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--hm-bg-page)]">
        <Header />
        <HeaderSpacer />
        <div className="py-20 text-center">
          <div className="max-w-md mx-auto px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--hm-bg-tertiary)] flex items-center justify-center">
              <X className="w-8 h-8 text-[var(--hm-fg-muted)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--hm-fg-primary)] mb-2">
              {t("professional.profileNotFound")}
            </h2>
            {error && (
              <p className="text-sm text-[var(--hm-fg-muted)] mt-2">
                {error}
              </p>
            )}
            <Button
              onClick={() => router.push("/professionals")}
              className="mt-6"
            >
              {t("common.goBack")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = profile.avatar;
  const avatarSrc = avatarUrl ? storage.getFileUrl(avatarUrl) : "";
  const portfolioImages = getAllPortfolioImages();
  const portfolioProjects = getUnifiedProjects();
  const groupedServices = getGroupedServices();

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      {/* Pending Approval Banner - Only visible to the pro owner */}
      {canEdit && profile && profile.verificationStatus !== "verified" && (
        <div className="bg-[var(--hm-warning-50)]/20 border-b border-[var(--hm-warning-500)]/20">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-full bg-[var(--hm-warning-100)] flex-shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--hm-warning-500)]" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm text-[var(--hm-warning-500)]">
                {t("professional.pendingApprovalTitle")}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--hm-warning-500)] line-clamp-2 sm:line-clamp-none">
                {t("professional.pendingApprovalDescription")}
              </p>
              {profile.verificationNotes && (
                <p className="text-[10px] sm:text-sm mt-1.5 sm:mt-2 p-1.5 sm:p-2 bg-[var(--hm-warning-100)] rounded text-[var(--hm-warning-500)]">
                  <span className="font-medium">
                    {t("admin.noteFromAdmin") || "Note from admin"}:
                  </span>{" "}
                  {profile.verificationNotes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejected Profile Banner */}
      {canEdit && profile && profile.adminRejectionReason && (
        <div className="bg-[var(--hm-error-50)]/20 border-b border-[var(--hm-error-500)]/20">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-full bg-[var(--hm-error-100)] flex-shrink-0">
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--hm-error-500)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm text-[var(--hm-error-500)]">
                {t("professional.needsUpdatesTitle")}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--hm-error-500)] line-clamp-2 sm:line-clamp-none">
                {profile.adminRejectionReason}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                router.push(
                  isAdmin && !isOwner
                    ? `/pro/profile-setup?proId=${profile.id}`
                    : "/pro/profile-setup",
                )
              }
              className="bg-[var(--hm-error-500)] hover:bg-[var(--hm-error-500)]/90 text-white text-xs sm:text-sm flex-shrink-0"
            >
              {t("professional.editProfile")}
            </Button>
          </div>
        </div>
      )}

      {/* Admin Verification Panel - Only visible to admins */}
      {isAdmin && profile && (
        <div className="bg-[var(--hm-info-50)] border-b border-[var(--hm-info-500)]/20">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-full bg-[var(--hm-info-500)]/10 flex-shrink-0">
              <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--hm-info-500)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm text-[var(--hm-fg-primary)]">
                {t("admin.verificationPanel")}
              </p>
              <p className="text-[10px] sm:text-sm text-[var(--hm-fg-secondary)] truncate sm:whitespace-normal">
                {t("admin.currentStatus")}:{" "}
                <span className="font-semibold capitalize">
                  {profile.verificationStatus || "pending"}
                </span>
                {profile.verificationNotes && (
                  <span className="hidden sm:inline ml-2">
                    | {t("admin.notes")}: {profile.verificationNotes}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(`/pro/profile-setup?proId=${profile.id}`)
                }
                className="text-xs sm:text-sm"
              >
                <Settings className="w-3.5 h-3.5 mr-1" />
                {t("admin.editProfile")}
              </Button>
              <Button
                size="sm"
                onClick={openAdminVerificationModal}
                className="bg-[var(--hm-info-500)] hover:bg-[var(--hm-info-500)]/90 text-white text-xs sm:text-sm"
              >
                {t("admin.updateStatus")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========== TOP NAVIGATION BAR ========== */}
      <motion.section
        ref={heroRef}
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => backOrNavigate(router, "/professionals")}
              className="rounded-xl bg-[var(--hm-bg-tertiary)] border border-[var(--hm-border)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-border)] transition-all h-9 sm:h-10 px-2.5 sm:px-3"
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">{t("common.back")}</span>
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="rounded-xl bg-[var(--hm-bg-tertiary)] border border-[var(--hm-border)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-border)] transition-all h-9 sm:h-10 px-2.5 sm:px-3"
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">{t("common.share")}</span>
              </Button>

              {showShareMenu && (
                <div className="absolute top-full right-0 mt-2 bg-[var(--hm-bg-elevated)] rounded-xl shadow-xl border border-[var(--hm-border)] py-1.5 sm:py-2 min-w-[160px] sm:min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <Button
                    variant="ghost"
                    onClick={handleShareFacebook}
                    className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] justify-start h-auto rounded-none"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                      <Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <span>Facebook</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleShareWhatsApp}
                    className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] justify-start h-auto rounded-none"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                    <span>WhatsApp</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] justify-start h-auto rounded-none"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--hm-bg-tertiary)] flex items-center justify-center flex-shrink-0">
                      {copySuccess ? (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--hm-success-500)]" />
                      ) : (
                        <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--hm-fg-secondary)]" />
                      )}
                    </div>
                    <span>{t("common.copyLink")}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ========== MOBILE PROFILE CARD ========== */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="lg:hidden max-w-7xl mx-auto px-3 sm:px-6 mb-4"
      >
        <div className="bg-[var(--hm-bg-elevated)] rounded-2xl shadow-xl shadow-[var(--hm-n-900)]/[0.08] border border-[var(--hm-border-subtle)] p-4 sm:p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAvatarZoom(true)}
                  className="cursor-zoom-in group p-0 h-auto hover:bg-transparent"
                  aria-label={t("professional.zoomAvatar")}
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-[var(--hm-bg-elevated)] shadow-xl">
                    <Image
                      src={avatarSrc}
                      alt={profile.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Button>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-br from-[var(--hm-brand-500)] to-[#A92B08] ring-4 ring-[var(--hm-bg-elevated)] shadow-xl">
                  {profile.name.charAt(0)}
                </div>
              )}
              {profile.verificationStatus === "verified" && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--hm-success-500)] border-[3px] border-[var(--hm-bg-elevated)] flex items-center justify-center shadow-lg">
                  <BadgeCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name */}
              {canEdit && isEditingName ? (
                <div className="flex items-center gap-2 mb-1">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-lg font-bold max-w-[180px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveName}
                    disabled={isSaving || !editedName.trim()}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingName(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-lg sm:text-2xl font-bold text-[var(--hm-fg-primary)] tracking-tight leading-tight break-words line-clamp-2">
                    {profile.name}
                  </h1>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditedName(profile.name);
                        setIsEditingName(true);
                      }}
                      className="flex-shrink-0"
                      aria-label={t("common.edit")}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[var(--hm-fg-muted)]" />
                    </Button>
                  )}
                </div>
              )}

              {/* Title */}
              {profile.title && !isCategoryBasedTitle(profile.title) && (
                <p className="text-sm text-[var(--hm-brand-500)] font-medium mb-1 truncate">
                  {profile.title}
                </p>
              )}

              {/* Location */}
              {profile.serviceAreas?.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-[var(--hm-fg-muted)]">
                  <MapPin className="w-3 h-3" />
                  <span>{translateCity(profile.serviceAreas[0])}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile pricing — ONLY show legacy fixed-price summary when the pro
              has no per-service pricing. New flow renders in the Services &
              Pricing block further down. */}
          {pricingMeta && pricingMeta.valueLabel && (profile?.servicePricing?.length ?? 0) === 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--hm-border-subtle)] flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-[var(--hm-fg-muted)]">
                  {pricingMeta.typeLabel}
                </span>
                <p className="text-lg font-bold text-[var(--hm-brand-500)]">
                  {pricingMeta.valueLabel}
                </p>
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={openPricingEdit}
                  className="rounded-full bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)]"
                  aria-label={t("common.edit")}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Mobile pricing edit — also gated on no per-service pricing */}
          {canEdit && isEditingPricing && (profile?.servicePricing?.length ?? 0) === 0 && (
            <div className="mt-3 space-y-2">
              <Select
                size="sm"
                value={editedPricingModel}
                onChange={(val) => setEditedPricingModel(val as PricingModel)}
                options={[
                  { value: PricingModel.FIXED, label: t("common.fixed") },
                  { value: PricingModel.RANGE, label: t("common.priceRange") },
                  {
                    value: PricingModel.PER_SQUARE_METER,
                    label: t("professional.perSqm"),
                  },
                ]}
              />
              {editedPricingModel && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    inputSize="sm"
                    value={editedBasePrice}
                    onChange={(e) => setEditedBasePrice(e.target.value)}
                    leftIcon={<span className="text-sm">₾</span>}
                    placeholder="0"
                    className="flex-1"
                  />
                  {editedPricingModel === PricingModel.RANGE && (
                    <>
                      <span className="text-[var(--hm-fg-muted)]">—</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        inputSize="sm"
                        value={editedMaxPrice}
                        onChange={(e) => setEditedMaxPrice(e.target.value)}
                        leftIcon={<span className="text-sm">₾</span>}
                        placeholder="0"
                        className="flex-1"
                      />
                    </>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingPricing(false)}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-1" />
                  {t("common.cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePricing}
                  loading={isSaving}
                >
                  <Check className="w-4 h-4 mr-1" />
                  {t("common.save")}
                </Button>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-around mt-3 pt-3 border-t border-[var(--hm-border-subtle)]">
            <div className="text-center">
              <p className="text-base font-bold text-[var(--hm-fg-primary)]">
                {profile.profileViewCount ?? 0}
              </p>
              <p className="text-[10px] text-[var(--hm-fg-muted)]">
                {t("professional.viewsLabel")}
              </p>
            </div>
            {profile.avgRating > 0 && (
              <div className="text-center">
                <p className="text-base font-bold text-[var(--hm-fg-primary)] flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-[var(--hm-warning-500)]" />
                  {profile.avgRating.toFixed(1)}
                </p>
                <p className="text-[10px] text-[var(--hm-fg-muted)]">
                  {reviews.length || profile.totalReviews}{" "}
                  {t("professional.reviewsLabel")}
                </p>
              </div>
            )}
            {totalCompletedJobs > 0 && (
              <div className="text-center">
                <p className="text-base font-bold text-[var(--hm-fg-primary)]">
                  {totalCompletedJobs}
                </p>
                <p className="text-[10px] text-[var(--hm-fg-muted)]">
                  {t("professional.jobsLabel")}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ========== MOBILE SERVICES & PRICING CARD ========== */}
      {/* Client-only mirror of the desktop aside's services block so
          invited pros and clients actually see per-service prices on phones. */}
      {(profile?.servicePricing?.length ?? 0) > 0 && (
        <MobileProServicesCard profile={profile} />
      )}

      {/* ========== MAIN LAYOUT: SIDEBAR + CONTENT ========== */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-32 sm:pb-32 lg:pb-12">
        <div className="flex gap-6 lg:gap-8">
          {/* ====== DESKTOP SIDEBAR (Behance-style) ====== */}
          {mounted && (
          <motion.aside
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="hidden lg:block w-72 flex-shrink-0"
          >
            <div className="sticky top-20 space-y-4 pb-6">
              {/* Profile Card */}
              <motion.div
                className="bg-[var(--hm-bg-elevated)] rounded-2xl border border-[var(--hm-border-subtle)] shadow-lg shadow-[var(--hm-n-900)]/[0.05]"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: { staggerChildren: 0.06, delayChildren: 0.2 },
                  },
                }}
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.35 }}
                  className="p-5 flex flex-col items-center"
                >
                  {/* Avatar */}
                  <div className="relative mb-3">
                    {avatarUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowAvatarZoom(true)}
                        className="cursor-zoom-in group p-0 h-auto hover:bg-transparent"
                        aria-label={t("professional.zoomAvatar")}
                      >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-[var(--hm-bg-elevated)] shadow-xl group-hover:shadow-2xl transition-all duration-300">
                          <Image
                            src={avatarSrc}
                            alt={profile.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </Button>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold bg-gradient-to-br from-[var(--hm-brand-500)] to-[#A92B08] ring-4 ring-[var(--hm-bg-elevated)] shadow-xl">
                        {profile.name.charAt(0)}
                      </div>
                    )}
                    {profile.verificationStatus === "verified" && (
                      <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[var(--hm-success-500)] border-[3px] border-[var(--hm-bg-elevated)] flex items-center justify-center shadow-lg">
                        <BadgeCheck className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {/* Availability dot removed */}
                  </div>

                  {/* Name */}
                  {canEdit && isEditingName ? (
                    <div className="flex items-center gap-1.5 mb-1 w-full">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="text-base font-bold flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName();
                          if (e.key === "Escape") setIsEditingName(false);
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveName}
                        disabled={isSaving || !editedName.trim()}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingName(false)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h1 className="text-lg font-bold text-[var(--hm-fg-primary)] text-center">
                        {profile.name}
                      </h1>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditedName(profile.name);
                            setIsEditingName(true);
                          }}
                          aria-label={t("common.edit")}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[var(--hm-fg-muted)]" />
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Title/Tagline */}
                  {canEdit ? (
                    isEditingTitle ? (
                      <div className="flex items-center gap-1.5 mb-2 w-full">
                        <Input
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          placeholder={t("professional.addTagline")}
                          className="text-sm flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveTitle();
                            if (e.key === "Escape") setIsEditingTitle(false);
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveTitle}
                          disabled={isSaving}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditingTitle(false)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mb-2">
                        {profile.title &&
                        !isCategoryBasedTitle(profile.title) ? (
                          <p className="text-sm text-[var(--hm-brand-500)] font-medium text-center">
                            {profile.title}
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--hm-fg-muted)] italic">
                            {t("professional.addTagline")}
                          </p>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditedTitle(
                              profile.title &&
                                !isCategoryBasedTitle(profile.title)
                                ? profile.title
                                : "",
                            );
                            setIsEditingTitle(true);
                          }}
                          aria-label={t("common.edit")}
                        >
                          <Edit3 className="w-3 h-3 text-[var(--hm-fg-muted)]" />
                        </Button>
                      </div>
                    )
                  ) : (
                    profile.title &&
                    !isCategoryBasedTitle(profile.title) && (
                      <p className="text-sm text-[var(--hm-brand-500)] font-medium text-center mb-2">
                        {profile.title}
                      </p>
                    )
                  )}

                  {/* Location */}
                  {profile.serviceAreas?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--hm-fg-muted)] mb-3">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{translateCity(profile.serviceAreas[0])}</span>
                    </div>
                  )}

                  {/* Schedule button for owner */}
                  {features.bookings && canEdit && (
                    <div className="w-full mb-1">
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowSchedulePanel(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[var(--hm-brand-500)] font-medium text-sm bg-[var(--hm-brand-500)]/10 hover:bg-[var(--hm-brand-500)]/20 transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        {t("settings.availability")}
                      </motion.button>
                    </div>
                  )}

                  {/* CTA Buttons */}
                  {!isOwner && (
                    <div className="w-full space-y-2 mb-1">
                      <AnimatePresence mode="wait">
                        {phoneRevealed && profile.phone ? (
                          <motion.a
                            key="phone-revealed"
                            initial={{ scale: 0.9, opacity: 0, rotateX: -15 }}
                            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                            }}
                            href={`tel:${profile.phone.replace(/\s/g, "")}`}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25"
                            style={{ transformPerspective: 600 }}
                          >
                            <motion.span
                              animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                              transition={{ duration: 0.6, delay: 0.15 }}
                            >
                              <Phone className="w-4 h-4" />
                            </motion.span>
                            {formatGeorgianPhoneDisplay(profile.phone)}
                          </motion.a>
                        ) : (
                          <motion.button
                            key="contact-cta"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                            }}
                            onClick={handleContact}
                            className="relative w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[var(--hm-brand-500)] via-[#D13C14] to-[#A92B08] shadow-lg shadow-[var(--hm-brand-500)]/25 overflow-hidden"
                          >
                            {/* Shine sweep */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                              initial={{ x: "-100%" }}
                              animate={{ x: "200%" }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                repeatDelay: 4,
                                ease: "easeInOut",
                              }}
                            />
                            <span className="relative flex items-center gap-2">
                              {isBasicTier ? (
                                <motion.span
                                  animate={{ rotate: [0, -12, 12, -8, 0] }}
                                  transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    repeatDelay: 5,
                                  }}
                                >
                                  <Phone className="w-4 h-4" />
                                </motion.span>
                              ) : (
                                <MessageSquare className="w-4 h-4" />
                              )}
                              {isBasicTier
                                ? t("professional.showPhone")
                                : t("professional.contact")}
                            </span>
                          </motion.button>
                        )}
                      </AnimatePresence>
                      {myOpenJobsLoaded && myMatchingOpenJobs.length > 0 && (
                        <motion.button
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShowInviteToJobModal(true)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[var(--hm-fg-secondary)] font-medium text-sm bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)] hover:border-[var(--hm-brand-500)]/30 hover:bg-[var(--hm-brand-500)]/5 transition-colors"
                        >
                          <Briefcase className="w-4 h-4" />
                          {t("professional.inviteToJob")}
                        </motion.button>
                      )}
                      {/* Existing booking indicator */}
                      {features.bookings && existingBookings.length > 0 && (
                        <Link
                          href="/bookings"
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--hm-success-50)]/20 border border-[var(--hm-success-500)]/20 transition-colors hover:bg-[var(--hm-success-100)]"
                        >
                          <div className="w-8 h-8 rounded-full bg-[var(--hm-success-100)] flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-[var(--hm-success-500)]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-[var(--hm-success-500)]">
                              {existingBookings[0].status === "pending"
                                ? t("professional.pendingBooking")
                                : t("professional.confirmedBooking")}
                            </p>
                            <p className="text-[10px] text-[var(--hm-success-500)]">
                              {formatDate(
                                existingBookings[0].date,
                                locale as "en" | "ka" | "ru",
                              )}{" "}
                              · {existingBookings[0].startHour}:00
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--hm-success-500)] shrink-0" />
                        </Link>
                      )}
                      {features.bookings && !canEdit &&
                        (profile?.servicePricing?.filter(
                          (s) => s.isActive && s.price > 0,
                        ).length ?? 0) > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              if (!user) {
                                openLoginModal(
                                  `/professionals/${profile?.id || (profile as any)?._id}`,
                                );
                                return;
                              }
                              setShowServiceBookingModal(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm bg-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-600)] transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {t("booking.requestService")}
                          </motion.button>
                        )}
                      {canEdit && (
                        <>
                          {features.bookings && (
                            <motion.button
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setShowSchedulePanel(true)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[var(--hm-brand-500)] font-medium text-sm bg-[var(--hm-brand-500)]/10 hover:bg-[var(--hm-brand-500)]/20 transition-colors"
                            >
                              <Calendar className="w-4 h-4" />
                              {t("settings.availability")}
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setShowShareMenu(true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm border transition-colors"
                            style={{ borderColor: 'var(--hm-border-subtle)', color: 'var(--hm-fg-secondary)' }}
                          >
                            <Share2 className="w-4 h-4" />
                            {t("common.share")}
                          </motion.button>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Services & Pricing */}
                {((profile?.servicePricing?.length ?? 0) > 0 ||
                  pricingMeta) && (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.35 }}
                    className="border-t border-[var(--hm-border-subtle)] px-5 py-3"
                  >
                    {(profile?.servicePricing?.length ?? 0) > 0 ? (
                      (() => {
                        // Build lookups from catalog
                        const svcNameMap: Record<string, string> = {};
                        const subNameMap: Record<string, string> = {};
                        for (const cat of CATEGORIES) {
                          for (const sub of cat.subcategories || []) {
                            subNameMap[sub.key] = pick({ en: sub.name, ka: sub.nameKa });
                            for (const svc of sub.services || []) {
                              svcNameMap[svc.key] = pick({ en: svc.name, ka: svc.nameKa });
                            }
                          }
                        }

                        // Build set of valid service keys from current catalog
                        const validServiceKeys = new Set<string>();
                        for (const cat of CATEGORIES) {
                          for (const sub of cat.subcategories) {
                            validServiceKeys.add(sub.key);
                            for (const svc of sub.services || []) {
                              validServiceKeys.add(svc.key);
                            }
                          }
                        }

                        // Group services by subcategory — only show services that exist in current catalog
                        const activeServices = profile.servicePricing!.filter(
                          (s) =>
                            s.isActive &&
                            s.price > 0 &&
                            (validServiceKeys.has(s.serviceKey) ||
                              validServiceKeys.has(s.subcategoryKey)),
                        );
                        const grouped: Record<string, typeof activeServices> =
                          {};
                        for (const svc of activeServices) {
                          const key = svc.subcategoryKey || "_other";
                          if (!grouped[key]) grouped[key] = [];
                          grouped[key].push(svc);
                        }

                        // Get experience from selectedServices
                        const expMap: Record<string, string> = {};
                        if (profile.selectedServices) {
                          for (const s of profile.selectedServices) {
                            expMap[s.key] = s.experience;
                          }
                        }

                        const expLabels: Record<string, string> = {
                          "1-2": t("professional.years12"),
                          "3-5": t("professional.years35"),
                          "5-10": t("professional.years510"),
                          "10+": t("professional.years10plus"),
                        };

                        return (
                          <div className="space-y-3">
                            {Object.entries(grouped).map(
                              ([subKey, services]) => (
                                <div key={subKey}>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--hm-fg-muted)]">
                                      {subNameMap[subKey] || subKey}
                                    </span>
                                    {expMap[subKey] && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)] font-medium">
                                        {expLabels[expMap[subKey]] ||
                                          expMap[subKey]}
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-1.5">
                                    {(() => {
                                      // Group by serviceKey for multi-unit display
                                      const byService: Record<string, typeof services> = {};
                                      for (const svc of services) {
                                        if (!byService[svc.serviceKey]) byService[svc.serviceKey] = [];
                                        byService[svc.serviceKey].push(svc);
                                      }
                                      return Object.entries(byService).map(([svcKey, entries]) => {
                                        const svcName = svcNameMap[svcKey] || svcKey;
                                        // Find catalog service for unit labels
                                        let catalogSvc: { unitOptions?: { key: string; label: { en: string; ka: string } }[] } | undefined;
                                        for (const cat of CATEGORIES) {
                                          for (const sub of cat.subcategories) {
                                            const found = (sub.services || []).find(s => s.key === svcKey);
                                            if (found) { catalogSvc = found; break; }
                                          }
                                          if (catalogSvc) break;
                                        }

                                        return (
                                          <div
                                            key={svcKey}
                                            className="rounded-xl p-3"
                                            style={{
                                              backgroundColor: 'var(--hm-bg-elevated)',
                                              border: '1px solid var(--hm-border-subtle)',
                                            }}
                                          >
                                            {entries.length === 1 ? (
                                              <>
                                                {/* Single unit — simple display */}
                                                <div className="flex items-center justify-between">
                                                  <span className="text-sm font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
                                                    {svcName}
                                                  </span>
                                                  <span className="text-sm font-bold" style={{ color: 'var(--hm-brand-500)' }}>
                                                    {entries[0].price}₾
                                                    {(() => {
                                                      const unitOpt = catalogSvc?.unitOptions?.find(u => u.key === (entries[0] as Record<string, unknown>).unitKey);
                                                      const unitLabel = unitOpt ? pick({ en: unitOpt.label.en, ka: unitOpt.label.ka }) : '';
                                                      return unitLabel ? <span className="text-[10px] font-normal ml-1" style={{ color: 'var(--hm-fg-muted)' }}>/{unitLabel}</span> : null;
                                                    })()}
                                                  </span>
                                                </div>
                                                {/* Discount tiers */}
                                                {(() => {
                                                  const tiers = ((entries[0] as Record<string, unknown>).discountTiers as { minQuantity: number; percent: number }[]) || [];
                                                  if (tiers.length === 0) return null;
                                                  return (
                                                    <div className="mt-2 pt-2 space-y-1.5" style={{ borderTop: '1px dashed var(--hm-border-subtle)' }}>
                                                      {tiers.map((tier, i) => {
                                                        const discounted = Math.round(entries[0].price * (1 - tier.percent / 100));
                                                        const savings = entries[0].price - discounted;
                                                        return (
                                                          <div key={i} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[12px]" style={{ backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
                                                            <span className="font-semibold" style={{ color: 'var(--hm-fg-primary)' }}>{tier.minQuantity}+</span>
                                                            <span style={{ color: 'var(--hm-fg-muted)' }}>{t("professional.unitsShort")}</span>
                                                            <span className="mx-0.5" style={{ color: 'var(--hm-fg-muted)' }}>→</span>
                                                            <span className="font-bold text-[var(--hm-success-500)]">{discounted}₾</span>
                                                            <span className="text-[10px] line-through opacity-40" style={{ color: 'var(--hm-fg-secondary)' }}>{entries[0].price}₾</span>
                                                            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--hm-success-100)]/30 text-[var(--hm-success-500)] font-semibold">{t("professional.saveShort")} {savings}₾</span>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  );
                                                })()}
                                              </>
                                            ) : (
                                              <>
                                                {/* Multi-unit — show service name then each unit price */}
                                                <span className="text-sm font-medium block mb-2" style={{ color: 'var(--hm-fg-primary)' }}>
                                                  {svcName}
                                                </span>
                                                <div className="space-y-1.5">
                                                  {entries.map((entry) => {
                                                    const entryAny = entry as Record<string, unknown>;
                                                    const unitOpt = catalogSvc?.unitOptions?.find(u => u.key === entryAny.unitKey);
                                                    const unitLabel = unitOpt ? pick({ en: unitOpt.label.en, ka: unitOpt.label.ka }) : (entryAny.unitKey as string || '');
                                                    const tiers = (entryAny.discountTiers as { minQuantity: number; percent: number }[]) || [];
                                                    return (
                                                      <div key={entryAny.unitKey as string || entry.serviceKey}>
                                                        <div className="flex items-center justify-between py-1 px-2 rounded-lg" style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}>
                                                          <span className="text-[12px]" style={{ color: 'var(--hm-fg-secondary)' }}>{unitLabel}</span>
                                                          <span className="text-[13px] font-bold" style={{ color: 'var(--hm-brand-500)' }}>{entry.price}₾</span>
                                                        </div>
                                                        {tiers.length > 0 && (
                                                          <div className="ml-2 mt-1 space-y-0.5">
                                                            {tiers.map((tier, i) => {
                                                              const discounted = Math.round(entry.price * (1 - tier.percent / 100));
                                                              return (
                                                                <div key={i} className="flex items-center gap-1.5 text-[11px] px-2">
                                                                  <span className="font-semibold" style={{ color: 'var(--hm-fg-primary)' }}>{tier.minQuantity}+</span>
                                                                  <span className="mx-0.5" style={{ color: 'var(--hm-fg-muted)' }}>→</span>
                                                                  <span className="font-bold text-[var(--hm-success-500)]">{discounted}₾</span>
                                                                  <span className="text-[10px] opacity-40 line-through" style={{ color: 'var(--hm-fg-secondary)' }}>{entry.price}₾</span>
                                                                </div>
                                                              );
                                                            })}
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        );
                      })()
                    ) : !canEdit || !isEditingPricing ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--hm-fg-muted)]">
                            {pricingMeta?.typeLabel}
                          </span>
                          {pricingMeta?.valueLabel && (
                            <p className="text-xl font-bold text-[var(--hm-brand-500)]">
                              {pricingMeta.valueLabel}
                            </p>
                          )}
                        </div>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={openPricingEdit}
                            className="rounded-full bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)]"
                            aria-label={t("common.edit")}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Select
                          size="sm"
                          value={editedPricingModel}
                          onChange={(val) =>
                            setEditedPricingModel(val as PricingModel)
                          }
                          options={[
                            {
                              value: PricingModel.FIXED,
                              label: t("common.fixed"),
                            },
                            {
                              value: PricingModel.RANGE,
                              label: t("common.priceRange"),
                            },
                            {
                              value: PricingModel.PER_SQUARE_METER,
                              label: t("professional.perSqm"),
                            },
                          ]}
                        />
                        {editedPricingModel && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              inputMode="numeric"
                              inputSize="sm"
                              value={editedBasePrice}
                              onChange={(e) => setEditedBasePrice(e.target.value)}
                              leftIcon={<span className="text-sm">₾</span>}
                              placeholder="0"
                              className="flex-1"
                            />
                            {editedPricingModel === PricingModel.RANGE && (
                              <>
                                <span className="text-[var(--hm-fg-muted)] text-sm">
                                  —
                                </span>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  inputSize="sm"
                                  value={editedMaxPrice}
                                  onChange={(e) => setEditedMaxPrice(e.target.value)}
                                  leftIcon={<span className="text-sm">₾</span>}
                                  placeholder="0"
                                  className="flex-1"
                                />
                              </>
                            )}
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingPricing(false)}
                            disabled={isSaving}
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            {t("common.cancel")}
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSavePricing}
                            loading={isSaving}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            {t("common.save")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Stats Grid */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.35 }}
                  className="border-t border-[var(--hm-border-subtle)] px-5 py-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <motion.div
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "rgba(239,78,36,0.06)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                      className="text-center p-2.5 rounded-xl bg-[var(--hm-bg-tertiary)]/50 cursor-default"
                    >
                      <p className="text-base font-bold text-[var(--hm-fg-primary)]">
                        <AnimatedCounter
                          value={profile.profileViewCount ?? 0}
                        />
                      </p>
                      <p className="text-[10px] text-[var(--hm-fg-muted)] mt-0.5">
                        {t("professional.viewsLabel")}
                      </p>
                    </motion.div>
                    {profile.avgRating > 0 && (
                      <motion.div
                        whileHover={{
                          scale: 1.05,
                          backgroundColor: "rgba(239,78,36,0.06)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="text-center p-2.5 rounded-xl bg-[var(--hm-bg-tertiary)]/50 cursor-default"
                      >
                        <p className="text-base font-bold text-[var(--hm-fg-primary)] flex items-center justify-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-[var(--hm-warning-500)]" />
                          <AnimatedCounter
                            value={profile.avgRating}
                            decimals={1}
                          />
                        </p>
                        <p className="text-[10px] text-[var(--hm-fg-muted)] mt-0.5">
                          {reviews.length || profile.totalReviews}{" "}
                          {t("professional.reviewsLabel")}
                        </p>
                      </motion.div>
                    )}
                    {totalCompletedJobs > 0 && (
                      <motion.div
                        whileHover={{
                          scale: 1.05,
                          backgroundColor: "rgba(239,78,36,0.06)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="text-center p-2.5 rounded-xl bg-[var(--hm-bg-tertiary)]/50 cursor-default"
                      >
                        <p className="text-base font-bold text-[var(--hm-fg-primary)]">
                          <AnimatedCounter value={totalCompletedJobs} />
                        </p>
                        <p className="text-[10px] text-[var(--hm-fg-muted)] mt-0.5">
                          {t("professional.jobsLabel")}
                        </p>
                      </motion.div>
                    )}
                    {(() => {
                      let maxYears = profile.yearsExperience || 0;
                      if (
                        profile.selectedServices &&
                        profile.selectedServices.length > 0
                      ) {
                        const experienceToYears: Record<string, number> = {
                          "1-2": 2,
                          "3-5": 5,
                          "5-10": 10,
                          "10+": 15,
                        };
                        const calcMax = Math.max(
                          ...profile.selectedServices.map(
                            (s) => experienceToYears[s.experience] || 0,
                          ),
                        );
                        if (calcMax > maxYears) maxYears = calcMax;
                      }
                      return maxYears > 0 ? (
                        <motion.div
                          whileHover={{
                            scale: 1.05,
                            backgroundColor: "rgba(239,78,36,0.06)",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                          }}
                          className="text-center p-2.5 rounded-xl bg-[var(--hm-bg-tertiary)]/50 cursor-default"
                        >
                          <p className="text-base font-bold text-[var(--hm-fg-primary)]">
                            <AnimatedCounter value={maxYears} />+
                          </p>
                          <p className="text-[10px] text-[var(--hm-fg-muted)] mt-0.5">
                            {t("professional.yearsExpShort")}
                          </p>
                        </motion.div>
                      ) : null;
                    })()}
                  </div>
                </motion.div>

                {/* Member since */}
                {profile.createdAt && (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.35 }}
                    className="border-t border-[var(--hm-border-subtle)] px-5 py-3"
                  >
                    <p
                      className="text-[10px] text-[var(--hm-fg-muted)] uppercase tracking-wider"
                      suppressHydrationWarning
                    >
                      {t("professional.memberSince")}:{" "}
                      {(() => {
                        const d = new Date(profile.createdAt);
                        const monthKeys = [
                          "monthJanuary", "monthFebruary", "monthMarch", "monthApril",
                          "monthMay", "monthJune", "monthJuly", "monthAugust",
                          "monthSeptember", "monthOctober", "monthNovember", "monthDecember",
                        ];
                        return `${t(`professional.${monthKeys[d.getMonth()]}`)} ${d.getFullYear()}`;
                      })()}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.aside>
          )}

          {/* ====== CONTENT AREA ====== */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="flex-1 min-w-0"
          >
            {/* All sections stacked — no tabs */}
            <div className="space-y-8 sm:space-y-10">
              {/* PORTFOLIO SECTION */}
              {(portfolioProjects.length > 0 || isOwner) && (
                <section>
                  <h2 className="text-sm font-semibold text-[var(--hm-fg-primary)] mb-4 flex items-center gap-2">
                    {t("professional.portfolio")}
                    {portfolioProjects.length > 0 && (
                      <span className="text-xs font-normal text-[var(--hm-fg-muted)]">
                        {portfolioProjects.length}
                      </span>
                    )}
                  </h2>
                  <PortfolioTab
                    projects={getUnifiedProjects().map((p) => ({
                      id: p.id,
                      title: p.title,
                      description: p.description,
                      location: p.location,
                      images: p.images,
                      videos: p.videos,
                      beforeAfter: p.beforeAfter,
                      isEditable: p.source !== "homico",
                      source: p.source,
                      clientName: p.clientName,
                      clientAvatar: p.clientAvatar,
                      clientId: p.clientId,
                      rating: p.rating,
                      review: p.review,
                      category: p.category,
                      completedDate: p.completedDate,
                      projectType: p.projectType,
                    }))}
                    onProjectClick={setSelectedProject}
                    locale={locale as "en" | "ka" | "ru"}
                    isOwner={isOwner}
                    onAddProject={() => setShowAddProjectModal(true)}
                    onEditProject={(project) =>
                      setEditingProject({
                        id: project.id,
                        title: project.title,
                        description: project.description,
                        location: project.location,
                        images: project.images,
                        videos: project.videos,
                        beforeAfter: project.beforeAfter,
                      })
                    }
                    onDeleteProject={(projectId) =>
                      setDeleteProjectId(projectId)
                    }
                  />
                </section>
              )}

              {/* ABOUT SECTION */}
              <section>
                <h2 className="text-sm font-semibold text-[var(--hm-fg-primary)] mb-4">
                  {t("professional.about")}
                </h2>
                <AboutTab
                  bio={profile.bio}
                  customServices={profile.customServices}
                  groupedServices={groupedServices}
                  selectedServices={profile.selectedServices}
                  getCategoryLabel={getCategoryLabel}
                  getSubcategoryLabel={getSubcategoryLabel}
                  getExperienceLabel={getExperienceLabel}
                  whatsapp={profile.whatsapp}
                  telegram={profile.telegram}
                  facebookUrl={profile.facebookUrl}
                  instagramUrl={profile.instagramUrl}
                  linkedinUrl={profile.linkedinUrl}
                  websiteUrl={profile.websiteUrl}
                  locale={locale as "en" | "ka" | "ru"}
                  isAuthenticated={!!user}
                  onRequireAuth={() => openLoginModal(pathname)}
                  isOwner={canEdit}
                  onSaveBio={async (bio) => {
                    await api.patch("/users/me/pro-profile", { bio });
                    setProfile((prev) => (prev ? { ...prev, bio } : prev));
                    toast.success(t("professional.saved"));
                  }}
                  onSaveServices={async (customServices) => {
                    await api.patch("/users/me/pro-profile", {
                      customServices,
                    });
                    setProfile((prev) =>
                      prev ? { ...prev, customServices } : prev,
                    );
                    toast.success(t("common.saved"));
                  }}
                  onSaveSocialLinks={async (socialLinks) => {
                    await api.patch("/users/me/pro-profile", socialLinks);
                    setProfile((prev) =>
                      prev ? { ...prev, ...socialLinks } : prev,
                    );
                    toast.success(t("common.saved"));
                  }}
                />
              </section>

              {/* REVIEWS SECTION */}
              <section>
                <h2 className="text-sm font-semibold text-[var(--hm-fg-primary)] mb-4 flex items-center gap-2">
                  {t("professional.reviewsLabel")}
                  {(reviews.length || profile.totalReviews) > 0 && (
                    <span className="text-xs font-normal text-[var(--hm-fg-muted)]">
                      {reviews.length || profile.totalReviews}
                    </span>
                  )}
                </h2>
                <ReviewsTab
                  reviews={reviews}
                  avgRating={profile.avgRating}
                  totalReviews={reviews.length || profile.totalReviews}
                  locale={locale as "en" | "ka" | "ru"}
                  isOwner={isOwner}
                  proId={profile.id}
                  proName={profile.name}
                  onReviewSubmitted={fetchReviews}
                />
              </section>
            </div>
            {/* End of stacked sections */}
          </motion.div>
        </div>
      </main>

      {/* ========== SIMILAR PROFESSIONALS - Full width section ========== */}
      {(proSubcategories.length > 0 || proCategories.length > 0) && (
        <SimilarProfessionals
          categories={proCategories}
          subcategories={proSubcategories}
          currentProId={profile.id}
          locale={locale}
        />
      )}

      {/* Click outside to close share menu */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}

      {/* ========== FLOATING BUTTON - MOBILE ========== */}
      <div
        className={`lg:hidden fixed bottom-4 sm:bottom-6 left-3 right-3 sm:left-4 sm:right-4 z-40 transition-all duration-300 ${
          showFloatingButton
            ? "translate-y-0 opacity-100"
            : "translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        {/* Invite pro to job - mobile */}
        {myOpenJobsLoaded && myMatchingOpenJobs.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowInviteToJobModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 mb-2 rounded-xl sm:rounded-2xl text-[var(--hm-fg-secondary)] font-semibold text-sm bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)] shadow-lg shadow-neutral-900/10"
          >
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            {t("professional.inviteToJob")}
          </motion.button>
        )}
        <AnimatePresence mode="wait">
          {phoneRevealed && profile.phone ? (
            <motion.a
              key="mobile-phone-revealed"
              initial={{ scale: 0.92, opacity: 0, rotateX: -12 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              href={`tel:${profile.phone.replace(/\s/g, "")}`}
              className="block w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-white font-semibold text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/30 text-center"
              style={{ transformPerspective: 600 }}
            >
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                >
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.span>
                {formatGeorgianPhoneDisplay(profile.phone)}
              </span>
            </motion.a>
          ) : (
            <motion.button
              key="mobile-contact-cta"
              whileTap={{ scale: 0.97 }}
              onClick={handleContact}
              className="relative w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-white font-semibold text-sm sm:text-base bg-gradient-to-r from-[var(--hm-brand-500)] to-[#A92B08] shadow-xl shadow-[var(--hm-brand-500)]/30 overflow-hidden"
            >
              {/* Shine sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 4,
                  ease: "easeInOut",
                }}
              />
              <span className="relative flex items-center justify-center gap-2">
                {isBasicTier ? (
                  <motion.span
                    animate={{ rotate: [0, -12, 12, -8, 0] }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 5,
                    }}
                  >
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.span>
                ) : (
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                {isBasicTier
                  ? t("professional.showPhone")
                  : t("professional.contact")}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Invite modal */}
      {profile?.id && (
        <InviteProToJobModal
          isOpen={showInviteToJobModal}
          onClose={() => setShowInviteToJobModal(false)}
          proId={profile.id}
          proName={profile.name}
          initialJobs={myMatchingOpenJobs}
        />
      )}

      {/* ========== PROJECT LIGHTBOX ========== */}
      {selectedProject &&
        (() => {
          const baPairs = selectedProject.beforeAfter || [];
          const allMedia = [
            ...selectedProject.images,
            ...baPairs.map((p) => `__ba_${p.before}|${p.after}`),
            ...(selectedProject.videos || []),
          ];
          const totalMedia = allMedia.length;
          const currentItem = allMedia[selectedProject.currentIndex];
          const isBaItem = currentItem?.startsWith("__ba_");
          const currentBa = isBaItem
            ? (() => {
                const parts = currentItem.slice(5).split("|");
                return { before: parts[0], after: parts[1] };
              })()
            : null;
          const isVideo =
            selectedProject.currentIndex >=
            selectedProject.images.length + baPairs.length;

          return (
            <div
              className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
              onClick={() => setSelectedProject(null)}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4">
                <h3 className="text-white font-semibold text-sm sm:text-lg truncate max-w-[70%]">
                  {selectedProject.title}
                </h3>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelectedProject(null)}
                  className="rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              {/* Main Media */}
              <div
                className="flex-1 flex items-center justify-center relative px-2 sm:px-4"
                onClick={(e) => e.stopPropagation()}
              >
                {totalMedia > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject((prev) =>
                          prev
                            ? {
                                ...prev,
                                currentIndex:
                                  (prev.currentIndex - 1 + totalMedia) %
                                  totalMedia,
                              }
                            : null,
                        );
                      }}
                      className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:text-white z-10 w-9 h-9 sm:w-12 sm:h-12"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject((prev) =>
                          prev
                            ? {
                                ...prev,
                                currentIndex:
                                  (prev.currentIndex + 1) % totalMedia,
                              }
                            : null,
                        );
                      }}
                      className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:text-white z-10 w-9 h-9 sm:w-12 sm:h-12"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>
                  </>
                )}
                {isVideo ? (
                  <video
                    src={storage.getFileUrl(currentItem)}
                    controls
                    autoPlay
                    className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-lg"
                  />
                ) : currentBa ? (
                  /* Before/After split view in lightbox */
                  <div
                    className="flex gap-2 max-w-full max-h-[60vh] sm:max-h-[70vh]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative flex-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={storage.getOptimizedImageUrl(
                          currentBa.before,
                          "lightbox",
                        )}
                        alt="Before"
                        className="w-full h-full object-contain rounded-lg"
                      />
                      <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-[var(--hm-error-500)]/80 text-sm font-bold text-white">
                        Before
                      </span>
                    </div>
                    <div className="relative flex-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={storage.getOptimizedImageUrl(
                          currentBa.after,
                          "lightbox",
                        )}
                        alt="After"
                        className="w-full h-full object-contain rounded-lg"
                      />
                      <span className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-[var(--hm-success-500)]/80 text-sm font-bold text-white">
                        After
                      </span>
                    </div>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={storage.getOptimizedImageUrl(currentItem, "lightbox")}
                    alt=""
                    loading="eager"
                    fetchPriority="high"
                    className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-lg"
                  />
                )}
              </div>

              {/* Thumbnail Strip */}
              {totalMedia > 1 && (
                <div
                  className="p-2 sm:p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-start gap-1.5 sm:gap-2 overflow-x-auto pb-2">
                    {/* Image thumbnails */}
                    {selectedProject.images.map((img, idx) => (
                      <Button
                        key={`img-${idx}`}
                        variant="ghost"
                        onClick={() =>
                          setSelectedProject((prev) =>
                            prev ? { ...prev, currentIndex: idx } : null,
                          )
                        }
                        className={`relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md sm:rounded-lg overflow-hidden flex-shrink-0 p-0 h-auto hover:bg-transparent ${
                          idx === selectedProject.currentIndex
                            ? "ring-2 ring-[var(--hm-brand-500)] ring-offset-1 sm:ring-offset-2 ring-offset-black"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={storage.getOptimizedImageUrl(
                            img,
                            "thumbnailSmall",
                          )}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </Button>
                    ))}
                    {/* Before/After thumbnails */}
                    {baPairs.map((pair, idx) => {
                      const mediaIdx = selectedProject.images.length + idx;
                      return (
                        <Button
                          key={`ba-${idx}`}
                          variant="ghost"
                          onClick={() =>
                            setSelectedProject((prev) =>
                              prev ? { ...prev, currentIndex: mediaIdx } : null,
                            )
                          }
                          className={`relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md sm:rounded-lg overflow-hidden flex-shrink-0 flex p-0 h-auto hover:bg-transparent ${
                            mediaIdx === selectedProject.currentIndex
                              ? "ring-2 ring-[var(--hm-brand-500)] ring-offset-1 sm:ring-offset-2 ring-offset-black"
                              : "opacity-60 hover:opacity-100"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={storage.getOptimizedImageUrl(
                              pair.before,
                              "thumbnailSmall",
                            )}
                            alt=""
                            className="w-1/2 h-full object-cover"
                          />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={storage.getOptimizedImageUrl(
                              pair.after,
                              "thumbnailSmall",
                            )}
                            alt=""
                            className="w-1/2 h-full object-cover"
                          />
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded bg-black/70 text-[6px] font-bold text-white">
                            B/A
                          </span>
                        </Button>
                      );
                    })}
                    {/* Video thumbnails */}
                    {(selectedProject.videos || []).map((vid, idx) => {
                      const mediaIdx =
                        selectedProject.images.length + baPairs.length + idx;
                      return (
                        <Button
                          key={`vid-${idx}`}
                          variant="ghost"
                          onClick={() =>
                            setSelectedProject((prev) =>
                              prev ? { ...prev, currentIndex: mediaIdx } : null,
                            )
                          }
                          className={`relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md sm:rounded-lg overflow-hidden flex-shrink-0 p-0 h-auto hover:bg-transparent ${
                            mediaIdx === selectedProject.currentIndex
                              ? "ring-2 ring-indigo-500 ring-offset-1 sm:ring-offset-2 ring-offset-black"
                              : "opacity-60 hover:opacity-100"
                          }`}
                        >
                          <video
                            src={storage.getFileUrl(vid)}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                          {/* Play icon badge */}
                          <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-indigo-500/80 flex items-center justify-center pointer-events-none">
                            <Play className="w-2.5 h-2.5 text-white ml-0.5" fill="currentColor" />
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                  <div className="text-center mt-1.5 sm:mt-2">
                    <span className="text-white/60 text-xs sm:text-sm">
                      {selectedProject.currentIndex + 1} / {totalMedia}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      {/* ========== AVATAR ZOOM (FULLSCREEN) ========== */}
      {showAvatarZoom && avatarUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setShowAvatarZoom(false)}
          role="dialog"
          aria-modal="true"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowAvatarZoom(false);
            }}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-white"
            aria-label={t("common.close") || "Close"}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          <div
            className="relative w-full max-w-4xl h-[70vh] sm:h-[75vh] md:h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={avatarSrc}
              alt={profile.name}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}

      {/* ========== CONTACT MODAL ========== */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSend={async (msg: string) => {
          if (!user) return;
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/conversations/start`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify({ proId: profile?.id, message: msg }),
              },
            );
            if (!response.ok) {
              throw new Error("Failed to send message");
            }
            setShowContactModal(false);
            toast.success(t("common.messageSent"));
            trackEvent(AnalyticsEvent.CONVERSATION_START, {
              proId: profile?.id,
              proName: profile?.name,
            });
          } catch (err) {
            console.error("Failed to start conversation:", err);
            toast.error(t("common.error"));
          }
        }}
        name={profile?.name || ""}
        title={profile?.title || ""}
        avatar={avatarUrl}
        locale={locale as "en" | "ka" | "ru"}
      />

      {/* ========== BOOKING MODAL ========== */}
      {features.bookings && profile && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          professionalId={profile.id || (profile as any)._id}
          professionalName={profile.name || ""}
        />
      )}

      {/* ========== SERVICE BOOKING MODAL ========== */}
      {features.bookings && profile && (
        <ServiceBookingModal
          isOpen={showServiceBookingModal}
          onClose={() => setShowServiceBookingModal(false)}
          professional={{
            id: profile.id || (profile as any)._id,
            name: profile.name || "",
            avatar: profile.avatar,
            servicePricing: profile.servicePricing ?? [],
          }}
        />
      )}

      {/* ========== SCHEDULE PANEL (owner only) ========== */}
      {features.bookings && (
        <SchedulePanel
          isOpen={showSchedulePanel}
          onClose={() => setShowSchedulePanel(false)}
        />
      )}

      {/* ========== ADD/EDIT PROJECT MODAL ========== */}
      {(showAddProjectModal || editingProject) && (
        <ProjectFormModal
          isOpen={showAddProjectModal || !!editingProject}
          onClose={() => {
            setShowAddProjectModal(false);
            setEditingProject(null);
          }}
          onSubmit={editingProject ? handleUpdateProject : handleAddProject}
          isLoading={isSaving}
          locale={locale as "en" | "ka" | "ru"}
          initialData={editingProject || undefined}
        />
      )}

      {/* ========== DELETE PROJECT CONFIRM ========== */}
      <ConfirmModal
        isOpen={!!deleteProjectId}
        onClose={() => setDeleteProjectId(null)}
        onConfirm={handleDeleteProject}
        title={t("professional.deleteProject")}
        description={t("professional.areYouSureYouWant")}
        confirmLabel={t("common.delete")}
        variant="danger"
        isLoading={isSaving}
      />

      {/* ========== ADMIN VERIFICATION MODAL ========== */}
      <Modal
        isOpen={showAdminVerificationModal}
        onClose={() => setShowAdminVerificationModal(false)}
      >
        <div className="space-y-4 p-6">
          <h2 className="text-xl font-semibold text-[var(--hm-fg-primary)] mb-4">
            {t("admin.updateVerificationStatus") ||
              "Update Verification Status"}
          </h2>
          <div>
            <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1">
              {t("admin.verificationStatus") || "Verification Status"}
            </label>
            <Select
              value={adminVerificationStatus}
              onChange={(value: string) => setAdminVerificationStatus(value)}
              options={[
                {
                  value: "pending",
                  label: t("admin.statusPending") || "Pending",
                },
                {
                  value: "submitted",
                  label: t("admin.statusSubmitted") || "Submitted",
                },
                {
                  value: "verified",
                  label: t("admin.statusVerified") || "Verified",
                },
                {
                  value: "rejected",
                  label: t("admin.statusRejected") || "Rejected",
                },
              ]}
              placeholder={t("admin.selectStatus") || "Select status"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1">
              {t("admin.verificationNotes") ||
                "Notes (visible to professional)"}
            </label>
            <textarea
              value={adminVerificationNotes}
              onChange={(e) => setAdminVerificationNotes(e.target.value)}
              placeholder={
                t("admin.notesPlaceholder") ||
                "Add notes for the professional..."
              }
              className="w-full px-3 py-2 border border-[var(--hm-border-strong)] rounded-lg bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] resize-none"
              rows={3}
            />
          </div>

          <Checkbox
            checked={adminNotifyUser}
            onChange={setAdminNotifyUser}
            size="sm"
          >
            <span className="text-sm text-[var(--hm-fg-secondary)]">
              {t("admin.notifyUserSms") || "Notify user via SMS"}
            </span>
          </Checkbox>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowAdminVerificationModal(false)}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAdminVerificationUpdate}
              loading={isAdminSaving}
              disabled={!adminVerificationStatus}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {t("admin.saveChanges") || "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ========== PROJECT FORM MODAL COMPONENT ==========
import { Image as ImageIcon, SplitSquareHorizontal, Video } from "lucide-react";

interface MediaItem {
  url: string;
  type: "image" | "video" | "before_after";
  beforeUrl?: string; // For before/after type
}

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    location?: string;
    images: string[];
    videos?: string[];
    beforeAfter?: { before: string; after: string }[];
  }) => void;
  isLoading: boolean;
  locale: "en" | "ka" | "ru";
  initialData?: {
    title: string;
    description?: string;
    location?: string;
    images: string[];
    videos?: string[];
    beforeAfter?: { before: string; after: string }[];
  };
}

type MediaUploadType = "images" | "videos" | "before" | "after";

function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  locale,
  initialData,
}: ProjectFormModalProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [location, setLocation] = useState(initialData?.location || "");

  // Separate arrays for different media types
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [videos, setVideos] = useState<string[]>(initialData?.videos || []);
  const [beforeAfterPairs, setBeforeAfterPairs] = useState<
    { before: string; after: string }[]
  >(initialData?.beforeAfter || []);

  // Active tab
  const [activeMediaTab, setActiveMediaTab] = useState<
    "images" | "videos" | "before_after"
  >("images");

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState<MediaUploadType | null>(
    null,
  );
  const [pendingBeforeImage, setPendingBeforeImage] = useState<string | null>(
    null,
  );

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const isNotReadableError = (err: unknown): boolean => {
    // DOMException in browsers
    if (typeof DOMException !== "undefined" && err instanceof DOMException) {
      return err.name === "NotReadableError";
    }
    // Axios/other wrappers may serialize to plain object
    return (
      typeof err === "object" &&
      err !== null &&
      (err as any).name === "NotReadableError"
    );
  };

  const fileReadErrorText = t("professional.fileReadError");

  // File size limits
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

  // Allowed types
  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || "");
      setDescription(initialData?.description || "");
      setLocation(initialData?.location || "");
      setImages(initialData?.images || []);
      setVideos(initialData?.videos || []);
      setBeforeAfterPairs(initialData?.beforeAfter || []);
      setPendingBeforeImage(null);
    }
  }, [isOpen, initialData]);

  const validateFile = (file: File, type: "image" | "video"): string | null => {
    if (type === "image") {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return t("professional.onlyJpgPngWebpGif");
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return t("professional.imageTooLargeMax10mb");
      }
    } else {
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return t("professional.onlyMp4MovWebmAllowed");
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return t("professional.videoTooLargeMax100mb");
      }
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/upload", formData);
      return response.data.url || response.data.filename;
    } catch (err) {
      if (isNotReadableError(err)) {
        throw err;
      }
      return null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadingType("images");
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const error = validateFile(file, "image");
        if (error) {
          toast.error(t("common.error"), error);
          continue;
        }
        try {
          const url = await uploadFile(file);
          if (url) newImages.push(url);
        } catch (err) {
          if (isNotReadableError(err)) {
            toast.error(t("common.error"), fileReadErrorText);
          } else {
            toast.error(t("common.error"), t("common.uploadFailed"));
          }
        }
      }
      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (err) {
      if (isNotReadableError(err)) {
        toast.error(t("common.error"), fileReadErrorText);
      } else {
        toast.error(t("common.error"), t("common.uploadFailed"));
      }
      console.error("Image upload failed:", err);
    } finally {
      setIsUploading(false);
      setUploadingType(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadingType("videos");
    const newVideos: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const error = validateFile(file, "video");
        if (error) {
          toast.error(t("common.error"), error);
          continue;
        }
        try {
          const url = await uploadFile(file);
          if (url) newVideos.push(url);
        } catch (err) {
          if (isNotReadableError(err)) {
            toast.error(t("common.error"), fileReadErrorText);
          } else {
            toast.error(t("common.error"), t("common.uploadFailed"));
          }
        }
      }
      if (newVideos.length > 0) {
        setVideos((prev) => [...prev, ...newVideos]);
      }
    } catch (err) {
      if (isNotReadableError(err)) {
        toast.error(t("common.error"), fileReadErrorText);
      } else {
        toast.error(t("common.error"), t("common.uploadFailed"));
      }
      console.error("Video upload failed:", err);
    } finally {
      setIsUploading(false);
      setUploadingType(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleBeforeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, "image");
    if (error) {
      toast.error(t("common.error"), error);
      return;
    }

    setIsUploading(true);
    setUploadingType("before");
    try {
      const url = await uploadFile(file);
      if (url) {
        setPendingBeforeImage(url);
      }
    } catch (err) {
      if (isNotReadableError(err)) {
        toast.error(t("common.error"), fileReadErrorText);
      } else {
        toast.error(t("common.error"), t("common.uploadFailed"));
      }
      console.error("Before image upload failed:", err);
    } finally {
      setIsUploading(false);
      setUploadingType(null);
      if (beforeInputRef.current) beforeInputRef.current.value = "";
    }
  };

  const handleAfterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingBeforeImage) return;

    const error = validateFile(file, "image");
    if (error) {
      toast.error(t("common.error"), error);
      return;
    }

    setIsUploading(true);
    setUploadingType("after");
    try {
      const url = await uploadFile(file);
      if (url) {
        setBeforeAfterPairs((prev) => [
          ...prev,
          { before: pendingBeforeImage, after: url },
        ]);
        setPendingBeforeImage(null);
      }
    } catch (err) {
      if (isNotReadableError(err)) {
        toast.error(t("common.error"), fileReadErrorText);
      } else {
        toast.error(t("common.error"), t("common.uploadFailed"));
      }
      console.error("After image upload failed:", err);
    } finally {
      setIsUploading(false);
      setUploadingType(null);
      if (afterInputRef.current) afterInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) =>
    setImages((prev) => prev.filter((_, i) => i !== index));
  const removeVideo = (index: number) =>
    setVideos((prev) => prev.filter((_, i) => i !== index));
  const removeBeforeAfter = (index: number) =>
    setBeforeAfterPairs((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(t("common.error"), t("professional.titleIsRequired"));
      return;
    }
    if (
      images.length === 0 &&
      videos.length === 0 &&
      beforeAfterPairs.length === 0
    ) {
      toast.error(t("common.error"), t("professional.atLeastOneMediaItem"));
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      images,
      videos: videos.length > 0 ? videos : undefined,
      beforeAfter: beforeAfterPairs.length > 0 ? beforeAfterPairs : undefined,
    });
  };

  const modalTitle = initialData
    ? t("professional.editProject")
    : t("professional.addProject");

  const totalMedia = images.length + videos.length + beforeAfterPairs.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl">
        {/* Premium Header with Gradient */}
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-br from-[var(--hm-brand-500)] via-[#D13C14] to-[#A92B08]">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-0 left-0 w-32 h-16 rounded-full bg-black/5 blur-2xl" />
          </div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white">
                {modalTitle}
              </h2>
              <p className="text-white/70 text-xs sm:text-sm mt-0.5">
                {t("professional.showcaseYourBestWork")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="rounded-full text-white/70 hover:text-white hover:bg-white/10"
              aria-label={t("common.close")}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-5 px-4 sm:px-6 py-4 sm:py-6 pb-6 sm:pb-6">
          {/* Title */}
          <div>
            <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-[var(--hm-fg-primary)] mb-1.5 sm:mb-2">
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[var(--hm-brand-500)]/10 flex items-center justify-center text-[var(--hm-brand-500)] text-[10px] sm:text-xs">
                1
              </span>
              {t("common.title")}
              <span className="text-[var(--hm-error-500)]">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("professional.egKitchenRenovation")}
            />
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-[var(--hm-fg-primary)] mb-1.5 sm:mb-2">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--hm-brand-500)]" />
              {t("common.location")}
            </label>
            <AddressPicker
              value={location}
              onChange={(address) => setLocation(address)}
              locale={locale}
              className="[&_.map-container]:h-32 sm:[&_.map-container]:h-40"
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-[var(--hm-fg-primary)] mb-1.5 sm:mb-2">
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[var(--hm-brand-500)]/10 flex items-center justify-center text-[var(--hm-brand-500)] text-[10px] sm:text-xs">
                2
              </span>
              {t("common.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("professional.whatDidYouDoMaterials")}
              rows={2}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-[var(--hm-border)] bg-[var(--hm-bg-tertiary)]/50 text-sm sm:text-base text-[var(--hm-fg-primary)] placeholder:text-[var(--hm-fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--hm-brand-500)] focus:border-transparent focus:bg-[var(--hm-bg-elevated)] resize-none transition-all"
            />
          </div>

          {/* Media Section */}
          <div className="bg-[var(--hm-bg-tertiary)]/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[var(--hm-border-subtle)]">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-[var(--hm-fg-primary)]">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[var(--hm-brand-500)]/10 flex items-center justify-center text-[var(--hm-brand-500)] text-[10px] sm:text-xs">
                  3
                </span>
                {t("professional.mediaFiles")}
                <span className="text-[var(--hm-error-500)]">*</span>
              </label>
              {totalMedia > 0 && (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-[var(--hm-brand-500)] text-white text-[10px] sm:text-xs font-medium rounded-full">
                  {totalMedia} {t("common.files")}
                </span>
              )}
            </div>

            {/* Media Type Tabs - Premium Design */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {[
                {
                  key: "images" as const,
                  icon: ImageIcon,
                  label: t("common.photos"),
                  count: images.length,
                },
                {
                  key: "videos" as const,
                  icon: Video,
                  label: t("common.video"),
                  count: videos.length,
                },
                {
                  key: "before_after" as const,
                  icon: SplitSquareHorizontal,
                  label: t("professional.ba"),
                  count: beforeAfterPairs.length,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeMediaTab === tab.key;
                return (
                  <Button
                    key={tab.key}
                    variant="outline"
                    onClick={() => setActiveMediaTab(tab.key)}
                    className={`relative flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 h-auto ${
                      isActive
                        ? "border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/5 shadow-sm"
                        : "border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] hover:border-[var(--hm-border-strong)]"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? "text-[var(--hm-brand-500)]" : "text-[var(--hm-fg-muted)]"}`}
                    />
                    <span
                      className={`text-[10px] sm:text-xs font-medium ${isActive ? "text-[var(--hm-brand-500)]" : "text-[var(--hm-fg-muted)]"}`}
                    >
                      {tab.label}
                    </span>
                    {tab.count > 0 && (
                      <span
                        className={`absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center ${
                          isActive
                            ? "bg-[var(--hm-brand-500)] text-white"
                            : "bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)]"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Images Tab */}
            {activeMediaTab === "images" && (
              <div className="space-y-2 sm:space-y-3">
                {images.length === 0 ? (
                  // Empty State - Large Upload Area
                  <Button
                    variant="ghost"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-8 sm:py-10 h-auto rounded-lg sm:rounded-xl border-2 border-dashed border-[var(--hm-border-strong)] bg-[var(--hm-bg-elevated)]/50 flex flex-col items-center justify-center text-[var(--hm-fg-muted)] hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/5 group"
                  >
                    {isUploading && uploadingType === "images" ? (
                      <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
                    ) : (
                      <>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[var(--hm-bg-tertiary)] flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-[var(--hm-brand-500)]/10 group-hover:scale-110 transition-all">
                          <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium">
                          {t("professional.choosePhotos")}
                        </span>
                        <span className="text-[10px] sm:text-xs mt-1 text-[var(--hm-fg-muted)]">
                          {t("professional.orDragAndDrop")}
                        </span>
                      </>
                    )}
                  </Button>
                ) : (
                  // Image Grid with Add Button
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl overflow-hidden group ring-1 ring-neutral-200"
                      >
                        <Image
                          src={storage.getFileUrl(img)}
                          alt=""
                          fill
                          className="rounded-full object-cover"
                          sizes="40px"
                        />

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg"
                          aria-label={t("common.remove")}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploading}
                      className="aspect-square h-auto rounded-xl border-2 border-dashed border-[var(--hm-border-strong)] flex flex-col items-center justify-center text-[var(--hm-fg-muted)] hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/5"
                      aria-label={t("common.add")}
                    >
                      {isUploading && uploadingType === "images" ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Plus className="w-6 h-6" />
                      )}
                    </Button>
                  </div>
                )}
                <p className="text-[11px] text-[var(--hm-fg-muted)] flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-neutral-300" />
                  JPG, PNG, WebP, GIF
                  <span className="w-1 h-1 rounded-full bg-neutral-300" />
                  {t("professional.max")} 10MB
                </p>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Videos Tab */}
            {activeMediaTab === "videos" && (
              <div className="space-y-2 sm:space-y-3">
                {videos.length === 0 ? (
                  <Button
                    variant="ghost"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-8 sm:py-10 h-auto rounded-lg sm:rounded-xl border-2 border-dashed border-[var(--hm-border-strong)] bg-[var(--hm-bg-elevated)]/50 flex flex-col items-center justify-center text-[var(--hm-fg-muted)] hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/5 group"
                  >
                    {isUploading && uploadingType === "videos" ? (
                      <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
                    ) : (
                      <>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[var(--hm-bg-tertiary)] flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-[var(--hm-brand-500)]/10 group-hover:scale-110 transition-all">
                          <Video className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium">
                          {t("professional.uploadVideo")}
                        </span>
                        <span className="text-[10px] sm:text-xs mt-1 text-[var(--hm-fg-muted)]">
                          MP4, MOV, WebM
                        </span>
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {videos.map((vid, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-video rounded-xl overflow-hidden group ring-1 ring-neutral-200 bg-neutral-900"
                      >
                        <video
                          src={storage.getFileUrl(vid)}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Video className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => removeVideo(idx)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg"
                          aria-label={t("common.remove")}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={isUploading}
                      className="aspect-video h-auto rounded-xl border-2 border-dashed border-[var(--hm-border-strong)] flex flex-col items-center justify-center text-[var(--hm-fg-muted)] hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/5"
                    >
                      {isUploading && uploadingType === "videos" ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Plus className="w-6 h-6" />
                          <span className="text-xs mt-1">
                            {t("common.add")}
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <p className="text-[11px] text-[var(--hm-fg-muted)] flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-neutral-300" />
                  MP4, MOV, WebM
                  <span className="w-1 h-1 rounded-full bg-neutral-300" />
                  {t("common.max")} 100MB
                </p>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Before/After Tab */}
            {activeMediaTab === "before_after" && (
              <div className="space-y-3">
                {/* Existing pairs */}
                {beforeAfterPairs.map((pair, idx) => (
                  <div
                    key={idx}
                    className="relative flex gap-3 p-3 rounded-xl bg-[var(--hm-bg-elevated)]/50 border border-[var(--hm-border)] shadow-sm"
                  >
                    <div className="flex-1 space-y-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-[var(--hm-error-500)] bg-[var(--hm-error-50)]/20 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        {t("common.before")}
                      </span>
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden ring-1 ring-neutral-200">
                        <Image
                          src={storage.getFileUrl(pair.before)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-[var(--hm-brand-500)]/10 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-[var(--hm-brand-500)]" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-[var(--hm-success-500)] bg-[var(--hm-success-50)]/20 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {t("common.after")}
                      </span>
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden ring-1 ring-neutral-200">
                        <Image
                          src={storage.getFileUrl(pair.after)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => removeBeforeAfter(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full shadow-lg"
                      aria-label={t("common.remove")}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}

                {/* Add new pair */}
                {pendingBeforeImage ? (
                  <div className="relative flex gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-[var(--hm-warning-500)]/20">
                    <div className="flex-1 space-y-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-[var(--hm-warning-500)] bg-[var(--hm-warning-100)] px-2 py-0.5 rounded-full">
                        ✓ {t("common.before")}
                      </span>
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden ring-2 ring-amber-300">
                        <Image
                          src={storage.getFileUrl(pendingBeforeImage)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center animate-pulse">
                        <ChevronRight className="w-4 h-4 text-[var(--hm-warning-500)]" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-[var(--hm-warning-500)] bg-[var(--hm-warning-100)] px-2 py-0.5 rounded-full">
                        {t("common.after")}?
                      </span>
                      <Button
                        variant="ghost"
                        onClick={() => afterInputRef.current?.click()}
                        disabled={isUploading}
                        className="aspect-[4/3] w-full h-auto rounded-lg border-2 border-dashed border-amber-400 flex flex-col items-center justify-center text-[var(--hm-warning-500)] bg-[var(--hm-bg-elevated)]/50 hover:bg-[var(--hm-warning-50)] hover:text-[var(--hm-warning-500)]"
                      >
                        {isUploading && uploadingType === "after" ? (
                          <LoadingSpinner size="sm" color="#D97706" />
                        ) : (
                          <>
                            <Plus className="w-6 h-6" />
                            <span className="text-xs font-medium mt-1">
                              {t("common.select")}
                            </span>
                          </>
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setPendingBeforeImage(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--hm-fg-secondary)] text-white shadow-lg hover:bg-[var(--hm-fg-primary)] hover:text-white"
                      aria-label={t("common.cancel")}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => beforeInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-8 h-auto rounded-xl border-2 border-dashed border-[var(--hm-border-strong)] bg-[var(--hm-bg-elevated)]/50 flex flex-col items-center justify-center text-[var(--hm-fg-muted)] hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/5 group"
                  >
                    {isUploading && uploadingType === "before" ? (
                      <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--hm-error-50)]/20 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-[var(--hm-error-500)]" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--hm-fg-muted)] group-hover:text-[var(--hm-brand-500)] transition-colors" />
                          <div className="w-10 h-10 rounded-xl bg-[var(--hm-success-50)]/20 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-[var(--hm-success-500)]" />
                          </div>
                        </div>
                        <span className="text-sm font-medium">
                          {t("professional.addComparison")}
                        </span>
                        <span className="text-xs mt-1 text-[var(--hm-fg-muted)]">
                          {t("professional.startWithBeforeImage")}
                        </span>
                      </>
                    )}
                  </Button>
                )}

                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleBeforeUpload}
                  className="hidden"
                />
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAfterUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions - Fixed at Bottom */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--hm-border)] bg-[var(--hm-bg-tertiary)]/50">
          <p className="text-[10px] sm:text-xs text-[var(--hm-fg-muted)] hidden sm:block">
            {totalMedia === 0
              ? t("professional.addAtLeastOneFile")
              : `${totalMedia} ${t("professional.filesReady")}`}
          </p>
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 sm:flex-none text-sm"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              loading={isLoading}
              disabled={totalMedia === 0 || !title.trim()}
              className="flex-1 sm:flex-none sm:min-w-[120px] text-sm"
            >
              {initialData ? t("common.update") : t("professional.addProject")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
