"use client";

import AddressPicker from "@/components/common/AddressPicker";
import Header, { HeaderSpacer } from "@/components/common/Header";
import Select from "@/components/common/Select";
import AboutTab from "@/components/professionals/AboutTab";
import ContactModal from "@/components/professionals/ContactModal";
import InviteProToJobModal from "@/components/professionals/InviteProToJobModal";
import PortfolioTab from "@/components/professionals/PortfolioTab";
import {
  type ProfileSidebarTab,
} from "@/components/professionals/ProfileSidebar";
import ReviewsTab from "@/components/professionals/ReviewsTab";
import SimilarProfessionals from "@/components/professionals/SimilarProfessionals";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmModal, Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import type { BaseEntity, Job, PortfolioItem, ProProfile } from "@/types/shared";
import { PricingModel } from "@/types/shared";
import { backOrNavigate } from "@/utils/navigationUtils";
import { formatGeorgianPhoneDisplay } from "@/utils/validationUtils";
import {
  BadgeCheck,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Facebook,
  Link2,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Share2,
  Star,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
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
  source?: 'homico' | 'external';
  externalClientName?: string;
  externalClientPhone?: string;
  externalVerifiedAt?: string;
  isVerified?: boolean;
}

/** Animated counter that counts up from 0 */
function AnimatedCounter({ value, decimals = 0, duration = 1.2 }: { value: number; decimals?: number; duration?: number }) {
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
  const { t, locale } = useLanguage();
  const toast = useToast();
  const { trackEvent } = useAnalytics();
  const { categories: CATEGORIES } = useCategories();

  const [profile, setProfile] = useState<ProProfile | null>(initialProfile ?? null);
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [reviews, setReviews] = useState<PageReview[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<{
    images: string[];
    videos?: string[];
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
    PricingModel.FIXED
  );
  const [editedBasePrice, setEditedBasePrice] = useState("");
  const [editedMaxPrice, setEditedMaxPrice] = useState("");

  // Admin verification panel state
  const [showAdminVerificationModal, setShowAdminVerificationModal] = useState(false);
  const [adminVerificationStatus, setAdminVerificationStatus] = useState<string>("");
  const [adminVerificationNotes, setAdminVerificationNotes] = useState("");
  const [adminNotifyUser, setAdminNotifyUser] = useState(true);
  const [isAdminSaving, setIsAdminSaving] = useState(false);

  // Check if current user is viewing their own profile
  const isOwner = user?.id === profile?.id;
  const isAdmin = user?.role === "admin";

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
        }))
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
      (profile.categories?.length ? profile.categories : profile.selectedCategories) ||
      [];
    return cats.filter(Boolean);
  }, [profile]);

  const proSubcategories = useMemo(() => {
    if (!profile) return [];
    const subcats =
      (profile.subcategories?.length ? profile.subcategories : profile.selectedSubcategories) ||
      [];
    return subcats.filter(Boolean);
  }, [profile]);

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
        const list = Array.isArray(response.data) ? (response.data as Job[]) : [];
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
    const model = (profile.pricingModel as unknown as string | undefined) || undefined;
    const base = typeof profile.basePrice === "number" ? profile.basePrice : undefined;
    const max = typeof profile.maxPrice === "number" ? profile.maxPrice : undefined;
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
      return { typeLabel: t("common.negotiable"), valueLabel: null as string | null };
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
      "width=600,height=400"
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
    if (!isOwner || !profile || !editedName.trim()) return;
    if (editedName.trim() === profile.name) {
      setIsEditingName(false);
      return;
    }
    setIsSaving(true);
    try {
      await api.patch("/users/me", { name: editedName.trim() });
      setProfile((prev) =>
        prev ? { ...prev, name: editedName.trim() } : prev
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
    if (!isOwner || !profile) return;
    const newTitle = editedTitle.trim();
    if (newTitle === (profile.title || "")) {
      setIsEditingTitle(false);
      return;
    }
    setIsSaving(true);
    try {
      await api.patch("/users/me/pro-profile", { title: newTitle || null });
      setProfile((prev) =>
        prev ? { ...prev, title: newTitle || undefined } : prev
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
    if (!isOwner || !profile) return;
    const model = (profile.pricingModel as unknown as string | undefined) || "byAgreement";
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
      typeof profile.basePrice === "number" ? String(profile.basePrice) : ""
    );
    setEditedMaxPrice(
      typeof profile.maxPrice === "number" ? String(profile.maxPrice) : ""
    );
    setIsEditingPricing(true);
  };

  const handleSavePricing = async () => {
    if (!isOwner || !profile) return;

    const base = editedBasePrice ? Number(editedBasePrice) : undefined;
    const max = editedMaxPrice ? Number(editedMaxPrice) : undefined;

    const baseValid = base !== undefined && Number.isFinite(base) && base > 0;
    const maxValid = max !== undefined && Number.isFinite(max) && max > 0;

    if (editedPricingModel === PricingModel.BY_AGREEMENT) {
      // ok
    } else if (editedPricingModel === PricingModel.RANGE) {
      if (!baseValid || !maxValid || max! < base!) {
        toast.error(t("common.error"), t("common.invalidPriceRange") || t("common.invalid"));
        return;
      }
    } else {
      // fixed or per_sqm
      if (!baseValid) {
        toast.error(t("common.error"), t("common.invalidPrice") || t("common.invalid"));
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
        basePrice: editedPricingModel === PricingModel.BY_AGREEMENT ? null : base,
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
                basePrice: editedPricingModel === PricingModel.BY_AGREEMENT ? undefined : base,
                maxPrice: editedPricingModel === PricingModel.RANGE ? max : undefined,
              }
            : prev
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
      console.log('[Admin] Updating verification for pro:', profile.id, 'to status:', adminVerificationStatus);
      const response = await api.patch(`/admin/pros/${profile.id}/verification`, {
        status: adminVerificationStatus,
        notes: adminVerificationNotes || undefined,
        notifyUser: adminNotifyUser,
      });

      const updated = response?.data as ProProfile | undefined;
      console.log('[Admin] Update response:', updated?.verificationStatus);

      if (updated) {
        setProfile((prev) => {
          if (!prev) return updated;
          return { ...prev, verificationStatus: updated.verificationStatus, verificationNotes: updated.verificationNotes };
        });
      }

      setShowAdminVerificationModal(false);
      toast.success(t("admin.verificationUpdated") || "Verification status updated");
    } catch (err) {
      console.error('[Admin] Update failed:', err);
      toast.error(t("admin.verificationUpdateFailed") || "Failed to update verification");
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
    if (!isOwner || !profile) return;
    setIsSaving(true);
    try {
      await api.patch("/users/me/pro-profile", {
        description: data.description,
      });
      setProfile((prev) =>
        prev ? { ...prev, description: data.description } : prev
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
    if (!isOwner || !profile) return;
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
    if (!isOwner || !editingProject || !profile?.id) return;
    setIsSaving(true);
    try {
      // Check if this project exists in the portfolio collection
      const existsInPortfolio = portfolio.some(
        (p) => p.id === editingProject.id
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
              : p
          )
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
    if (!isOwner || !deleteProjectId) return;
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
        (p) => p.id === deleteProjectId || (p as any)._id === deleteProjectId
      );

      if (existsInPortfolio) {
        console.log(
          "[handleDeleteProject] Deleting from portfolio collection:",
          deleteProjectId
        );
        await api.delete(`/portfolio/${deleteProjectId}`);
        setPortfolio((prev) =>
          prev.filter(
            (p) =>
              p.id !== deleteProjectId && (p as any)._id !== deleteProjectId
          )
        );
      } else {
        // Check if it's an embedded project in profile.portfolioProjects
        const embeddedIdx = profile?.portfolioProjects?.findIndex(
          (p, idx) =>
            p.id === deleteProjectId || `embedded-${idx}` === deleteProjectId
        );

        if (
          embeddedIdx !== undefined &&
          embeddedIdx >= 0 &&
          profile?.portfolioProjects
        ) {
          // Remove from embedded portfolioProjects via profile update
          const updatedProjects = profile.portfolioProjects.filter(
            (_, idx) => idx !== embeddedIdx
          );
          await api.patch("/users/me/pro-profile", {
            portfolioProjects: updatedProjects,
          });
          setProfile((prev) =>
            prev ? { ...prev, portfolioProjects: updatedProjects } : prev
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
        ({ ka: category.nameKa, en: category.name, ru: category.name }[locale] ??
          category.name)
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
        cat.key === lowerTitle
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
      (s) => s.key === subcategoryKey
    );
    return service?.experience || null;
  };

  const getSubcategoryLabel = (subcategoryKey: string) => {
    if (!subcategoryKey) return "";
    if (subcategoryKey.startsWith("custom:"))
      return subcategoryKey.replace("custom:", "");
    for (const category of CATEGORIES) {
      const subcategory = category.subcategories.find(
        (sub) => sub.key === subcategoryKey
      );
      if (subcategory)
        return (
          ({
            ka: subcategory.nameKa,
            en: subcategory.name,
            ru: subcategory.name,
          }[locale] ?? subcategory.name)
        );
      for (const sub of category.subcategories) {
        if (sub.children) {
          const subSub = sub.children.find(
            (child) => child.key === subcategoryKey
          );
          if (subSub)
            return (
              ({ ka: subSub.nameKa, en: subSub.name, ru: subSub.name }[locale] ??
                subSub.name)
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
    source?: "external" | "homico"; // 'homico' = from completed jobs, not editable
  }

  const getUnifiedProjects = useCallback((): UnifiedProject[] => {
    const projects: UnifiedProject[] = [];
    const seenTitles = new Set<string>();

    // Add from portfolio items (fetched separately)
    portfolio.forEach((item) => {
      const titleKey = item.title?.toLowerCase().trim() || item.id;
      if (seenTitles.has(titleKey)) return;
      seenTitles.add(titleKey);

      const images: string[] = [];
      if (item.imageUrl) images.push(item.imageUrl);
      if (item.images) {
        item.images.forEach((img) => {
          if (!images.includes(img)) images.push(img);
        });
      }

      // Convert beforeAfterPairs (with beforeImage/afterImage) to beforeAfter (with before/after)
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
          source: item.source, // Pass through the source field
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
    "საქართველო": "Georgia",
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
    return city;
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
    setLightboxIndex((prev) => (images.length ? (prev + 1) % images.length : 0));
  }, [getAllPortfolioImages]);

  const prevImage = useCallback(() => {
    const images = getAllPortfolioImages();
    setLightboxIndex((prev) =>
      images.length ? (prev - 1 + images.length) % images.length : 0
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
              : null
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
              : null
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
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A]">
        <Header />
        <HeaderSpacer />
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-neutral-200/60 dark:border-neutral-800 shadow-lg shadow-neutral-900/[0.03]">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl sm:rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                <div className="h-7 sm:h-8 w-48 sm:w-56 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
                <div className="h-4 sm:h-5 w-32 sm:w-40 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-8 sm:h-9 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
                  <div className="h-8 sm:h-9 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
                  <div className="h-8 sm:h-9 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
                </div>
                <div className="flex gap-1.5">
                  <div className="h-7 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
                  <div className="h-7 w-20 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          {/* Tab skeleton */}
          <div className="flex gap-3 mt-6">
            <div className="h-10 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
            <div className="h-10 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
            <div className="h-10 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
          </div>
          <div className="mt-6 space-y-4">
            <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
            <div className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-app)] dark:bg-[#0A0A0A]">
        <Header />
        <HeaderSpacer />
        <div className="py-20 text-center">
          <div className="max-w-md mx-auto px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#F5F0ED] dark:bg-neutral-900 flex items-center justify-center">
              <X className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              {t("professional.profileNotFound")}
            </h2>
            {error && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                {error}
              </p>
            )}
            <Button onClick={() => router.push("/professionals")} className="mt-6">
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
    <div className="min-h-screen bg-[var(--color-bg-app)] dark:bg-[#0A0A0A]">
      <Header />
      <HeaderSpacer />

      {/* Pending Approval Banner - Only visible to the pro owner */}
      {isOwner && profile && profile.verificationStatus !== 'verified' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-full bg-amber-100 dark:bg-amber-800/30 flex-shrink-0">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                {t("professional.pendingApprovalTitle")}
              </p>
              <p className="text-[10px] sm:text-sm text-amber-700 dark:text-amber-300 line-clamp-2 sm:line-clamp-none">
                {t("professional.pendingApprovalDescription")}
              </p>
              {profile.verificationNotes && (
                <p className="text-[10px] sm:text-sm mt-1.5 sm:mt-2 p-1.5 sm:p-2 bg-amber-100 dark:bg-amber-800/40 rounded text-amber-800 dark:text-amber-200">
                  <span className="font-medium">{t("admin.noteFromAdmin") || "Note from admin"}:</span> {profile.verificationNotes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejected Profile Banner */}
      {isOwner && profile && profile.adminRejectionReason && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-full bg-red-100 dark:bg-red-800/30 flex-shrink-0">
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm text-red-800 dark:text-red-200">
                {t("professional.needsUpdatesTitle")}
              </p>
              <p className="text-[10px] sm:text-sm text-red-700 dark:text-red-300 line-clamp-2 sm:line-clamp-none">
                {profile.adminRejectionReason}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => router.push("/pro/profile-setup")}
              className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm flex-shrink-0"
            >
              {t("professional.editProfile")}
            </Button>
          </div>
        </div>
      )}

      {/* Admin Verification Panel - Only visible to admins */}
      {isAdmin && profile && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-full bg-indigo-100 dark:bg-indigo-800/30 flex-shrink-0">
              <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm text-indigo-800 dark:text-indigo-200">
                {t("admin.verificationPanel") || "Admin Verification Panel"}
              </p>
              <p className="text-[10px] sm:text-sm text-indigo-700 dark:text-indigo-300 truncate sm:whitespace-normal">
                {t("admin.currentStatus") || "Current Status"}: <span className="font-semibold capitalize">{profile.verificationStatus || "pending"}</span>
                {profile.verificationNotes && (
                  <span className="hidden sm:inline ml-2">| {t("admin.notes") || "Notes"}: {profile.verificationNotes}</span>
                )}
              </p>
            </div>
            <Button
              size="sm"
              onClick={openAdminVerificationModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm flex-shrink-0"
            >
              {t("admin.updateStatus") || "Update Status"}
            </Button>
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
              className="rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all h-9 sm:h-10 px-2.5 sm:px-3"
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">{t("common.back")}</span>
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all h-9 sm:h-10 px-2.5 sm:px-3"
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">{t("common.share")}</span>
              </Button>

              {showShareMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-1.5 sm:py-2 min-w-[160px] sm:min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <button
                    onClick={handleShareFacebook}
                    className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                      <Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <span>Facebook</span>
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                      {copySuccess ? (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                      ) : (
                        <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600 dark:text-neutral-400" />
                      )}
                    </div>
                    <span>{t("common.copyLink")}</span>
                  </button>
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
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-900/[0.08] dark:shadow-black/30 border border-neutral-200/60 dark:border-neutral-800 p-4 sm:p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <button type="button" onClick={() => setShowAvatarZoom(true)} className="cursor-zoom-in group">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-neutral-900 shadow-xl">
                    <Image src={avatarSrc} alt={profile.name} width={96} height={96} className="w-full h-full object-cover" />
                  </div>
                </button>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-br from-[#C4735B] to-[#A85D4A] ring-4 ring-white dark:ring-neutral-900 shadow-xl">
                  {profile.name.charAt(0)}
                </div>
              )}
              {profile.verificationStatus === "verified" && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-[3px] border-white dark:border-neutral-900 flex items-center justify-center shadow-lg">
                  <BadgeCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name */}
              {isOwner && isEditingName ? (
                <div className="flex items-center gap-2 mb-1">
                  <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} className="text-lg font-bold max-w-[180px]" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setIsEditingName(false); }} />
                  <Button size="sm" onClick={handleSaveName} disabled={isSaving || !editedName.trim()}><Check className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight truncate">{profile.name}</h1>
                  {isOwner && (
                    <button onClick={() => { setEditedName(profile.name); setIsEditingName(true); }} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0">
                      <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  )}
                </div>
              )}

              {/* Title */}
              {profile.title && !isCategoryBasedTitle(profile.title) && (
                <p className="text-sm text-[#C4735B] font-medium mb-1 truncate">{profile.title}</p>
              )}

              {/* Availability + Location */}
              {profile.isAvailable && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {locale === "ka" ? "ხელმისაწვდომია" : "Available Now"}
                </span>
              )}
              {profile.serviceAreas?.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-neutral-500">
                  <MapPin className="w-3 h-3" />
                  <span>{translateCity(profile.serviceAreas[0])}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile pricing */}
          {pricingMeta && pricingMeta.valueLabel && (
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-400">{pricingMeta.typeLabel}</span>
                <p className="text-lg font-bold text-[#C4735B]">{pricingMeta.valueLabel}</p>
              </div>
              {isOwner && (
                <button onClick={openPricingEdit} className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#C4735B]">
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Mobile pricing edit */}
          {isOwner && isEditingPricing && (
            <div className="mt-3 space-y-2">
              <Select size="sm" value={editedPricingModel} onChange={(val) => setEditedPricingModel(val as PricingModel)} options={[
                { value: PricingModel.FIXED, label: t("common.fixed") },
                { value: PricingModel.RANGE, label: t("common.priceRange") },
                { value: PricingModel.PER_SQUARE_METER, label: t("professional.perSqm") },
                { value: PricingModel.BY_AGREEMENT, label: t("common.negotiable") },
              ]} />
              {editedPricingModel !== PricingModel.BY_AGREEMENT && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₾</span>
                    <input type="number" min="0" inputMode="numeric" value={editedBasePrice} onChange={(e) => setEditedBasePrice(e.target.value)} className="w-full pl-7 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C4735B]/30" placeholder="0" />
                  </div>
                  {editedPricingModel === PricingModel.RANGE && (
                    <>
                      <span className="text-neutral-400">—</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₾</span>
                        <input type="number" min="0" inputMode="numeric" value={editedMaxPrice} onChange={(e) => setEditedMaxPrice(e.target.value)} className="w-full pl-7 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C4735B]/30" placeholder="0" />
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditingPricing(false)} disabled={isSaving}><X className="w-4 h-4 mr-1" />{t("common.cancel")}</Button>
                <Button size="sm" onClick={handleSavePricing} loading={isSaving}><Check className="w-4 h-4 mr-1" />{t("common.save")}</Button>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-around mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <div className="text-center">
              <p className="text-base font-bold text-neutral-900 dark:text-white">{profile.profileViewCount ?? 0}</p>
              <p className="text-[10px] text-neutral-500">{locale === "ka" ? "ნახვები" : "Views"}</p>
            </div>
            {profile.avgRating > 0 && (
              <div className="text-center">
                <p className="text-base font-bold text-neutral-900 dark:text-white flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {profile.avgRating.toFixed(1)}
                </p>
                <p className="text-[10px] text-neutral-500">{reviews.length || profile.totalReviews} {locale === "ka" ? "შეფასებები" : "Reviews"}</p>
              </div>
            )}
            {totalCompletedJobs > 0 && (
              <div className="text-center">
                <p className="text-base font-bold text-neutral-900 dark:text-white">{totalCompletedJobs}</p>
                <p className="text-[10px] text-neutral-500">{locale === "ka" ? "დასრულებული" : "Jobs"}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ========== MOBILE TAB NAVIGATION ========== */}
      <div className="lg:hidden sticky top-[56px] sm:top-[60px] z-30 bg-[var(--color-bg-app)]/95 dark:bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-800/50 px-3 sm:px-6">
        <nav className="flex gap-6 overflow-x-auto scrollbar-hide" aria-label="Profile sections">
          {([
            { key: "portfolio" as ProfileSidebarTab, label: locale === "ka" ? "ნამუშევრები" : "Portfolio", count: portfolioProjects.length },
            { key: "about" as ProfileSidebarTab, label: locale === "ka" ? "შესახებ" : "About" },
            { key: "reviews" as ProfileSidebarTab, label: locale === "ka" ? "შეფასებები" : "Reviews", count: profile.totalReviews },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative whitespace-nowrap pb-3 pt-3 text-sm font-medium transition-colors ${activeTab === tab.key ? "text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="text-xs text-neutral-400">{tab.count}</span>
                )}
              </span>
              {activeTab === tab.key && (
                <motion.span layoutId="mobile-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C4735B] rounded-full" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ========== MAIN LAYOUT: SIDEBAR + CONTENT (Behance-style) ========== */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-32 sm:pb-32 lg:pb-12">
        <div className="flex gap-6 lg:gap-8">

          {/* ====== DESKTOP SIDEBAR (Behance-style) ====== */}
          <motion.aside
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="hidden lg:block w-72 flex-shrink-0"
          >
            <div className="sticky top-20 space-y-4 pb-6">

              {/* Profile Card */}
              <motion.div
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-lg shadow-neutral-900/[0.05] dark:shadow-black/20"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }}
              >
                <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.35 }} className="p-5 flex flex-col items-center">
                  {/* Avatar */}
                  <div className="relative mb-3">
                    {avatarUrl ? (
                      <button type="button" onClick={() => setShowAvatarZoom(true)} className="cursor-zoom-in group">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-neutral-900 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                          <Image src={avatarSrc} alt={profile.name} width={96} height={96} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold bg-gradient-to-br from-[#C4735B] to-[#A85D4A] ring-4 ring-white dark:ring-neutral-900 shadow-xl">
                        {profile.name.charAt(0)}
                      </div>
                    )}
                    {profile.verificationStatus === "verified" && (
                      <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 border-[3px] border-white dark:border-neutral-900 flex items-center justify-center shadow-lg">
                        <BadgeCheck className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {profile.isAvailable && profile.verificationStatus !== "verified" && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-white dark:border-neutral-900" />
                    )}
                  </div>

                  {/* Name */}
                  {isOwner && isEditingName ? (
                    <div className="flex items-center gap-1.5 mb-1 w-full">
                      <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} className="text-base font-bold flex-1" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setIsEditingName(false); }} />
                      <Button size="sm" onClick={handleSaveName} disabled={isSaving || !editedName.trim()}><Check className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}><X className="w-3.5 h-3.5" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h1 className="text-lg font-bold text-neutral-900 dark:text-white text-center">{profile.name}</h1>
                      {isOwner && (
                        <button onClick={() => { setEditedName(profile.name); setIsEditingName(true); }} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                          <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Availability */}
                  {profile.isAvailable && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {locale === "ka" ? "ხელმისაწვდომია" : "Available Now"}
                    </span>
                  )}

                  {/* Title/Tagline */}
                  {isOwner ? (
                    isEditingTitle ? (
                      <div className="flex items-center gap-1.5 mb-2 w-full">
                        <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} placeholder={t("professional.addTagline")} className="text-sm flex-1" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSaveTitle(); if (e.key === "Escape") setIsEditingTitle(false); }} />
                        <Button size="sm" onClick={handleSaveTitle} disabled={isSaving}><Check className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}><X className="w-3.5 h-3.5" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mb-2">
                        {profile.title && !isCategoryBasedTitle(profile.title) ? (
                          <p className="text-sm text-[#C4735B] font-medium text-center">{profile.title}</p>
                        ) : (
                          <p className="text-xs text-neutral-400 italic">{t("professional.addTagline")}</p>
                        )}
                        <button onClick={() => { setEditedTitle(profile.title && !isCategoryBasedTitle(profile.title) ? profile.title : ""); setIsEditingTitle(true); }} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                          <Edit3 className="w-3 h-3 text-neutral-400" />
                        </button>
                      </div>
                    )
                  ) : (
                    profile.title && !isCategoryBasedTitle(profile.title) && (
                      <p className="text-sm text-[#C4735B] font-medium text-center mb-2">{profile.title}</p>
                    )
                  )}

                  {/* Location */}
                  {profile.serviceAreas?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-3">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{translateCity(profile.serviceAreas[0])}</span>
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
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            onClick={handleContact}
                            className="relative w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-[#C4735B] via-[#B5624A] to-[#A85D4A] shadow-lg shadow-[#C4735B]/25 overflow-hidden"
                          >
                            {/* Shine sweep */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                              initial={{ x: '-100%' }}
                              animate={{ x: '200%' }}
                              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                            />
                            <span className="relative flex items-center gap-2">
                              {isBasicTier ? (
                                <motion.span animate={{ rotate: [0, -12, 12, -8, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}>
                                  <Phone className="w-4 h-4" />
                                </motion.span>
                              ) : <MessageSquare className="w-4 h-4" />}
                              {isBasicTier ? t("professional.showPhone") : t("professional.contact")}
                            </span>
                          </motion.button>
                        )}
                      </AnimatePresence>
                      {myOpenJobsLoaded && myMatchingOpenJobs.length > 0 && (
                        <motion.button
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShowInviteToJobModal(true)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-neutral-700 dark:text-neutral-200 font-medium text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-[#C4735B]/30 hover:bg-[#C4735B]/5 transition-colors"
                        >
                          <Briefcase className="w-4 h-4" />
                          {t("professional.inviteToJob")}
                        </motion.button>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Pricing */}
                {pricingMeta && (
                  <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.35 }} className="border-t border-neutral-100 dark:border-neutral-800 px-5 py-3">
                    {!isOwner || !isEditingPricing ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">{pricingMeta.typeLabel}</span>
                          {pricingMeta.valueLabel && (
                            <p className="text-xl font-bold text-[#C4735B] dark:text-[#D4937B]">{pricingMeta.valueLabel}</p>
                          )}
                        </div>
                        {isOwner && (
                          <button onClick={openPricingEdit} className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#C4735B] transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Select size="sm" value={editedPricingModel} onChange={(val) => setEditedPricingModel(val as PricingModel)} options={[
                          { value: PricingModel.FIXED, label: t("common.fixed") },
                          { value: PricingModel.RANGE, label: t("common.priceRange") },
                          { value: PricingModel.PER_SQUARE_METER, label: t("professional.perSqm") },
                          { value: PricingModel.BY_AGREEMENT, label: t("common.negotiable") },
                        ]} />
                        {editedPricingModel !== PricingModel.BY_AGREEMENT && (
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₾</span>
                              <input type="number" min="0" inputMode="numeric" value={editedBasePrice} onChange={(e) => setEditedBasePrice(e.target.value)} className="w-full pl-7 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C4735B]/30" placeholder="0" />
                            </div>
                            {editedPricingModel === PricingModel.RANGE && (
                              <>
                                <span className="text-neutral-400 text-sm">—</span>
                                <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₾</span>
                                  <input type="number" min="0" inputMode="numeric" value={editedMaxPrice} onChange={(e) => setEditedMaxPrice(e.target.value)} className="w-full pl-7 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C4735B]/30" placeholder="0" />
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setIsEditingPricing(false)} disabled={isSaving}><X className="w-3.5 h-3.5 mr-1" />{t("common.cancel")}</Button>
                          <Button size="sm" onClick={handleSavePricing} loading={isSaving}><Check className="w-3.5 h-3.5 mr-1" />{t("common.save")}</Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Stats Grid */}
                <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.35 }} className="border-t border-neutral-100 dark:border-neutral-800 px-5 py-3">
                  <div className="grid grid-cols-2 gap-2">
                    <motion.div whileHover={{ scale: 1.05, backgroundColor: 'rgba(196,115,91,0.06)' }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="text-center p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 cursor-default">
                      <p className="text-base font-bold text-neutral-900 dark:text-white"><AnimatedCounter value={profile.profileViewCount ?? 0} /></p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{locale === "ka" ? "ნახვები" : "Views"}</p>
                    </motion.div>
                    {profile.avgRating > 0 && (
                      <motion.div whileHover={{ scale: 1.05, backgroundColor: 'rgba(196,115,91,0.06)' }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="text-center p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 cursor-default">
                        <p className="text-base font-bold text-neutral-900 dark:text-white flex items-center justify-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <AnimatedCounter value={profile.avgRating} decimals={1} />
                        </p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{reviews.length || profile.totalReviews} {locale === "ka" ? "შეფასებები" : "Reviews"}</p>
                      </motion.div>
                    )}
                    {totalCompletedJobs > 0 && (
                      <motion.div whileHover={{ scale: 1.05, backgroundColor: 'rgba(196,115,91,0.06)' }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="text-center p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 cursor-default">
                        <p className="text-base font-bold text-neutral-900 dark:text-white"><AnimatedCounter value={totalCompletedJobs} /></p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{locale === "ka" ? "დასრულებული" : "Jobs"}</p>
                      </motion.div>
                    )}
                    {(() => {
                      let maxYears = profile.yearsExperience || 0;
                      if (profile.selectedServices && profile.selectedServices.length > 0) {
                        const experienceToYears: Record<string, number> = { "1-2": 2, "3-5": 5, "5-10": 10, "10+": 15 };
                        const calcMax = Math.max(...profile.selectedServices.map((s) => experienceToYears[s.experience] || 0));
                        if (calcMax > maxYears) maxYears = calcMax;
                      }
                      return maxYears > 0 ? (
                        <motion.div whileHover={{ scale: 1.05, backgroundColor: 'rgba(196,115,91,0.06)' }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="text-center p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 cursor-default">
                          <p className="text-base font-bold text-neutral-900 dark:text-white"><AnimatedCounter value={maxYears} />+</p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">{locale === "ka" ? "წლის გამოცდ." : "Years Exp."}</p>
                        </motion.div>
                      ) : null;
                    })()}
                  </div>
                </motion.div>

                {/* Services */}
                {((profile.selectedServices?.length ?? 0) > 0 || proSubcategories.length > 0) && (
                  <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.35 }} className="border-t border-neutral-100 dark:border-neutral-800 px-5 py-3">
                    <h3 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">{locale === "ka" ? "სერვისები და გამოცდილება" : "Services & Experience"}</h3>
                    <motion.div className="flex flex-wrap gap-1.5" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.5 } } }}>
                      {profile.selectedServices && profile.selectedServices.length > 0 ? (
                        profile.selectedServices.map((service, idx) => (
                          <motion.div
                            key={`svc-${idx}`}
                            variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            whileHover={{ scale: 1.05, y: -1 }}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-xs cursor-default hover:border-[#C4735B]/30 hover:bg-[#C4735B]/5 transition-colors"
                          >
                            <span className="font-medium text-neutral-700 dark:text-neutral-200">
                              {({ ka: service.nameKa, en: service.name, ru: service.name }[locale] ?? service.name)}
                            </span>
                            <span className="text-[10px] font-bold text-[#C4735B] bg-[#C4735B]/10 px-1 py-0.5 rounded">{getExperienceLabel(service.experience)}</span>
                          </motion.div>
                        ))
                      ) : (
                        proSubcategories.map((sub, idx) => {
                          const experience = getServiceExperience(sub);
                          return (
                            <motion.div
                              key={`sub-${idx}`}
                              variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                              whileHover={{ scale: 1.05, y: -1 }}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-xs cursor-default hover:border-[#C4735B]/30 hover:bg-[#C4735B]/5 transition-colors"
                            >
                              <span className="font-medium text-neutral-700 dark:text-neutral-200">{getSubcategoryLabel(sub)}</span>
                              {experience && <span className="text-[10px] font-bold text-[#C4735B] bg-[#C4735B]/10 px-1 py-0.5 rounded">{getExperienceLabel(experience)}</span>}
                            </motion.div>
                          );
                        })
                      )}
                    </motion.div>
                    {proCategories.length > 0 && (
                      <motion.div className="flex flex-wrap gap-1.5 mt-2" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.7 } } }}>
                        {proCategories.map((cat, idx) => (
                          <motion.span
                            key={`cat-${idx}`}
                            variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            whileHover={{ scale: 1.08 }}
                            className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gradient-to-r from-[#C4735B] to-[#D4937B] text-white cursor-default"
                          >
                            {getCategoryLabel(cat)}
                          </motion.span>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Member since */}
                {profile.createdAt && (
                  <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.35 }} className="border-t border-neutral-100 dark:border-neutral-800 px-5 py-3">
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider" suppressHydrationWarning>
                      {locale === "ka" ? "წევრია" : "Member since"}: {new Date(profile.createdAt).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.aside>

          {/* ====== CONTENT AREA ====== */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="flex-1 min-w-0"
          >
            {/* Desktop Tab Navigation - Behance style horizontal underline tabs */}
            <div className="hidden lg:block border-b border-neutral-200 dark:border-neutral-800 mb-6">
              <nav className="flex gap-8" aria-label="Profile sections">
                {([
                  { key: "portfolio" as ProfileSidebarTab, label: locale === "ka" ? "ნამუშევრები" : "Portfolio", count: portfolioProjects.length },
                  { key: "about" as ProfileSidebarTab, label: locale === "ka" ? "შესახებ" : "About" },
                  { key: "reviews" as ProfileSidebarTab, label: locale === "ka" ? "შეფასებები" : "Reviews", count: reviews.length || profile.totalReviews },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative pb-3 text-sm font-medium transition-colors ${activeTab === tab.key ? "text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
                  >
                    <span className="flex items-center gap-2">
                      {tab.label}
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className="text-xs text-neutral-400">{tab.count}</span>
                      )}
                    </span>
                    {activeTab === tab.key && (
                      <motion.span layoutId="desktop-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C4735B] rounded-full" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-6 sm:space-y-8"
              >
                {/* ABOUT TAB */}
                {activeTab === "about" && (
                  <div className="min-h-[300px]">
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
                      isOwner={isOwner}
                      onSaveBio={async (bio) => {
                        await api.patch("/users/me/pro-profile", { bio });
                        setProfile((prev) => (prev ? { ...prev, bio } : prev));
                        toast.success(t("professional.saved"));
                      }}
                      onSaveServices={async (customServices) => {
                        await api.patch("/users/me/pro-profile", { customServices });
                        setProfile((prev) => prev ? { ...prev, customServices } : prev);
                        toast.success(t("common.saved"));
                      }}
                      onSaveSocialLinks={async (socialLinks) => {
                        await api.patch("/users/me/pro-profile", socialLinks);
                        setProfile((prev) => prev ? { ...prev, ...socialLinks } : prev);
                        toast.success(t("common.saved"));
                      }}
                    />
                  </div>
                )}

                {/* PORTFOLIO TAB */}
                {activeTab === "portfolio" && (
                  <div className="min-h-[300px]">
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
                      onDeleteProject={(projectId) => setDeleteProjectId(projectId)}
                    />
                  </div>
                )}

                {/* REVIEWS TAB */}
                {activeTab === "reviews" && (
                  <div className="min-h-[300px]">
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
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
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
            className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 mb-2 rounded-xl sm:rounded-2xl text-neutral-700 dark:text-neutral-200 font-semibold text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg shadow-neutral-900/10 dark:shadow-black/30"
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
              className="relative w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-white font-semibold text-sm sm:text-base bg-gradient-to-r from-[#C4735B] to-[#A85D4A] shadow-xl shadow-[#C4735B]/30 overflow-hidden"
            >
              {/* Shine sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
              />
              <span className="relative flex items-center justify-center gap-2">
                {isBasicTier ? (
                  <motion.span animate={{ rotate: [0, -12, 12, -8, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}>
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.span>
                ) : (
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                {isBasicTier ? t("professional.showPhone") : t("professional.contact")}
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
          const allMedia = [
            ...selectedProject.images,
            ...(selectedProject.videos || []),
          ];
          const totalMedia = allMedia.length;
          const currentItem = allMedia[selectedProject.currentIndex];
          const isVideo =
            selectedProject.currentIndex >= selectedProject.images.length;

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
                            : null
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
                            : null
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
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={storage.getOptimizedImageUrl(currentItem, 'lightbox')}
                    alt=""
                    loading="eager"
                    fetchPriority="high"
                    className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-lg"
                  />
                )}
              </div>

              {/* Thumbnail Strip */}
              {totalMedia > 1 && (
                <div className="p-2 sm:p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-start gap-1.5 sm:gap-2 overflow-x-auto pb-2">
                    {/* Image thumbnails */}
                    {selectedProject.images.map((img, idx) => (
                      <button
                        key={`img-${idx}`}
                        onClick={() =>
                          setSelectedProject((prev) =>
                            prev ? { ...prev, currentIndex: idx } : null
                          )
                        }
                        className={`relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md sm:rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                          idx === selectedProject.currentIndex
                            ? "ring-2 ring-[#C4735B] ring-offset-1 sm:ring-offset-2 ring-offset-black"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={storage.getOptimizedImageUrl(img, 'thumbnailSmall')}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                    {/* Video thumbnails */}
                    {(selectedProject.videos || []).map((vid, idx) => {
                      const mediaIdx = selectedProject.images.length + idx;
                      return (
                        <button
                          key={`vid-${idx}`}
                          onClick={() =>
                            setSelectedProject((prev) =>
                              prev ? { ...prev, currentIndex: mediaIdx } : null
                            )
                          }
                          className={`relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md sm:rounded-lg overflow-hidden flex-shrink-0 transition-all ${
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
                            <svg
                              className="w-2.5 h-2.5 text-white ml-0.5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </button>
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAvatarZoom(false);
            }}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            aria-label={t("common.close") || "Close"}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

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
              }
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
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
            {t("admin.updateVerificationStatus") || "Update Verification Status"}
          </h2>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t("admin.verificationStatus") || "Verification Status"}
            </label>
            <Select
              value={adminVerificationStatus}
              onChange={(value: string) => setAdminVerificationStatus(value)}
              options={[
                { value: "pending", label: t("admin.statusPending") || "Pending" },
                { value: "submitted", label: t("admin.statusSubmitted") || "Submitted" },
                { value: "verified", label: t("admin.statusVerified") || "Verified" },
                { value: "rejected", label: t("admin.statusRejected") || "Rejected" },
              ]}
              placeholder={t("admin.selectStatus") || "Select status"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t("admin.verificationNotes") || "Notes (visible to professional)"}
            </label>
            <textarea
              value={adminVerificationNotes}
              onChange={(e) => setAdminVerificationNotes(e.target.value)}
              placeholder={t("admin.notesPlaceholder") || "Add notes for the professional..."}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none"
              rows={3}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={adminNotifyUser}
              onChange={(e) => setAdminNotifyUser(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              {t("admin.notifyUserSms") || "Notify user via SMS"}
            </span>
          </label>

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
    initialData?.description || ""
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
    null
  );
  const [pendingBeforeImage, setPendingBeforeImage] = useState<string | null>(
    null
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
    return typeof err === "object" && err !== null && (err as any).name === "NotReadableError";
  };

  const fileReadErrorText =
    locale === "ka"
      ? "ფაილი ვერ წაიკითხა. სცადეთ ისევ არჩევა (iCloud-იდან გადმოწერეთ და შემდეგ ატვირთეთ)."
      : locale === "ru"
        ? "Не удалось прочитать файл. Выберите заново (если iCloud — сначала скачайте)."
        : "Couldn't read the file. Please reselect it (if it's from iCloud, download it first).";

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
      toast.error(
        t("common.error"),
        t("professional.titleIsRequired")
      );
      return;
    }
    if (
      images.length === 0 &&
      videos.length === 0 &&
      beforeAfterPairs.length === 0
    ) {
      toast.error(
        t("common.error"),
        t("professional.atLeastOneMediaItem")
      );
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
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-br from-[#C4735B] via-[#B8654D] to-[#A65D47]">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-0 left-0 w-32 h-16 rounded-full bg-black/5 blur-2xl" />
          </div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white">{modalTitle}</h2>
              <p className="text-white/70 text-xs sm:text-sm mt-0.5">
                {t("professional.showcaseYourBestWork")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-5 px-4 sm:px-6 py-4 sm:py-6 pb-6 sm:pb-6">
          {/* Title */}
          <div>
            <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 sm:mb-2">
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center text-[#C4735B] text-[10px] sm:text-xs">
                1
              </span>
              {t("common.title")}
              <span className="text-red-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("professional.egKitchenRenovation")}
            />
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 sm:mb-2">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C4735B]" />
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
            <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 sm:mb-2">
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center text-[#C4735B] text-[10px] sm:text-xs">
                2
              </span>
              {t("common.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("professional.whatDidYouDoMaterials")}
              rows={2}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-sm sm:text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B] focus:border-transparent focus:bg-white dark:focus:bg-neutral-800 resize-none transition-all"
            />
          </div>

          {/* Media Section */}
          <div className="bg-neutral-50 dark:bg-neutral-800/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center text-[#C4735B] text-[10px] sm:text-xs">
                  3
                </span>
                {t("professional.mediaFiles")}
                <span className="text-red-400">*</span>
              </label>
              {totalMedia > 0 && (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-[#C4735B] text-white text-[10px] sm:text-xs font-medium rounded-full">
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
                  <button
                    key={tab.key}
                    onClick={() => setActiveMediaTab(tab.key)}
                    className={`relative flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all ${
                      isActive
                        ? "border-[#C4735B] bg-[#C4735B]/5 shadow-sm"
                        : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? "text-[#C4735B]" : "text-neutral-400"}`}
                    />
                    <span
                      className={`text-[10px] sm:text-xs font-medium ${isActive ? "text-[#C4735B]" : "text-neutral-500"}`}
                    >
                      {tab.label}
                    </span>
                    {tab.count > 0 && (
                      <span
                        className={`absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center ${
                          isActive
                            ? "bg-[#C4735B] text-white"
                            : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Images Tab */}
            {activeMediaTab === "images" && (
              <div className="space-y-2 sm:space-y-3">
                {images.length === 0 ? (
                  // Empty State - Large Upload Area
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-8 sm:py-10 rounded-lg sm:rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800/50 flex flex-col items-center justify-center text-neutral-400 hover:border-[#C4735B] hover:text-[#C4735B] hover:bg-[#C4735B]/5 transition-all group"
                  >
                    {isUploading && uploadingType === "images" ? (
                      <LoadingSpinner size="lg" color="#C4735B" />
                    ) : (
                      <>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-[#C4735B]/10 group-hover:scale-110 transition-all">
                          <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium">
                          {t("professional.choosePhotos")}
                        </span>
                        <span className="text-[10px] sm:text-xs mt-1 text-neutral-400">
                          {t("professional.orDragAndDrop")}
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  // Image Grid with Add Button
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl overflow-hidden group ring-1 ring-neutral-200 dark:ring-neutral-700"
                      >
                        <Image
                          src={storage.getFileUrl(img)}
                          alt=""
                          fill
                          className="rounded-full object-cover"
                          sizes="40px"
                        />

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 flex items-center justify-center shadow-lg"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploading}
                      className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center text-neutral-400 hover:border-[#C4735B] hover:text-[#C4735B] hover:bg-[#C4735B]/5 transition-all"
                    >
                      {isUploading && uploadingType === "images" ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Plus className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
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
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-8 sm:py-10 rounded-lg sm:rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800/50 flex flex-col items-center justify-center text-neutral-400 hover:border-[#C4735B] hover:text-[#C4735B] hover:bg-[#C4735B]/5 transition-all group"
                  >
                    {isUploading && uploadingType === "videos" ? (
                      <LoadingSpinner size="lg" color="#C4735B" />
                    ) : (
                      <>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-[#C4735B]/10 group-hover:scale-110 transition-all">
                          <Video className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium">
                          {t("professional.uploadVideo")}
                        </span>
                        <span className="text-[10px] sm:text-xs mt-1 text-neutral-400">
                          MP4, MOV, WebM
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {videos.map((vid, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-video rounded-xl overflow-hidden group ring-1 ring-neutral-200 dark:ring-neutral-700 bg-neutral-900"
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
                        <button
                          onClick={() => removeVideo(idx)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 flex items-center justify-center shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      disabled={isUploading}
                      className="aspect-video rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center text-neutral-400 hover:border-[#C4735B] hover:text-[#C4735B] hover:bg-[#C4735B]/5 transition-all"
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
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
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
                    className="relative flex gap-3 p-3 rounded-xl bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                  >
                    <div className="flex-1 space-y-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        {t("common.before")}
                      </span>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-700">
                        <Image
                          src={storage.getFileUrl(pair.before)}
                          alt=""
                          fill
                          className="rounded-full object-cover"
                          sizes="40px"
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-[#C4735B]/10 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-[#C4735B]" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {t("common.after")}
                      </span>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-700">
                        <Image
                          src={storage.getFileUrl(pair.after)}
                          alt=""
                          fill
                          className="rounded-full object-cover"
                          sizes="40px"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeBeforeAfter(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add new pair */}
                {pendingBeforeImage ? (
                  <div className="relative flex gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300 dark:border-amber-700">
                    <div className="flex-1 space-y-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-amber-600 bg-amber-100 dark:bg-amber-800/30 px-2 py-0.5 rounded-full">
                        ✓ {t("common.before")}
                      </span>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden ring-2 ring-amber-300 dark:ring-amber-600">
                        <Image
                          src={storage.getFileUrl(pendingBeforeImage)}
                          alt=""
                          fill
                          className="rounded-full object-cover"
                          sizes="40px"
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center animate-pulse">
                        <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-amber-600 bg-amber-100 dark:bg-amber-800/30 px-2 py-0.5 rounded-full">
                        {t("common.after")}?
                      </span>
                      <button
                        onClick={() => afterInputRef.current?.click()}
                        disabled={isUploading}
                        className="aspect-[4/3] w-full rounded-lg border-2 border-dashed border-amber-400 dark:border-amber-600 flex flex-col items-center justify-center text-amber-500 bg-white/50 dark:bg-neutral-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
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
                      </button>
                    </div>
                    <button
                      onClick={() => setPendingBeforeImage(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-neutral-500 text-white flex items-center justify-center shadow-lg hover:bg-neutral-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => beforeInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-8 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800/50 flex flex-col items-center justify-center text-neutral-400 hover:border-[#C4735B] hover:text-[#C4735B] hover:bg-[#C4735B]/5 transition-all group"
                  >
                    {isUploading && uploadingType === "before" ? (
                      <LoadingSpinner size="lg" color="#C4735B" />
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-red-400" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-[#C4735B] transition-colors" />
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-emerald-400" />
                          </div>
                        </div>
                        <span className="text-sm font-medium">
                          {t("professional.addComparison")}
                        </span>
                        <span className="text-xs mt-1 text-neutral-400">
                          {t("professional.startWithBeforeImage")}
                        </span>
                      </>
                    )}
                  </button>
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
        <div className="flex items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
          <p className="text-[10px] sm:text-xs text-neutral-400 hidden sm:block">
            {totalMedia === 0
              ? t("professional.addAtLeastOneFile")
              : `${totalMedia} ${t("professional.filesReady")}`}
          </p>
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button variant="ghost" onClick={onClose} disabled={isLoading} className="flex-1 sm:flex-none text-sm">
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
