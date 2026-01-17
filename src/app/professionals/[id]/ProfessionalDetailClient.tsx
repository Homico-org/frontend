"use client";

import AddressPicker from "@/components/common/AddressPicker";
import Header, { HeaderSpacer } from "@/components/common/Header";
import AboutTab from "@/components/professionals/AboutTab";
import ContactModal from "@/components/professionals/ContactModal";
import PortfolioTab from "@/components/professionals/PortfolioTab";
import ProfileSidebar, {
  ProfileSidebarMobile,
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
import type { BaseEntity, PortfolioItem, ProProfile } from "@/types/shared";
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
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
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
  clientId: {
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
  const [activeTab, setActiveTab] = useState<ProfileSidebarTab>("about");

  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

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

  // Check if current user is viewing their own profile
  const isOwner = user?.id === profile?.id;

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

  useEffect(() => {
    const fetchReviews = async () => {
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
    };
    if (profile?.id) fetchReviews();
  }, [profile?.id]);

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
        : model === "daily" || model === "sqm" || model === "from"
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

  const proCategories = useMemo(() => {
    if (!profile) return [];
    const cats =
      (profile.categories?.length ? profile.categories : profile.selectedCategories) ||
      [];
    return cats.filter(Boolean);
  }, [profile]);

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
    return locale === "ka"
      ? `${profile.name} - ${profile.title} | Homico`
      : `${profile.name} - ${profile.title} | Homico`;
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
    } catch {
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
      const response = await api.post("/portfolio", {
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
    if (category) return locale === "ka" ? category.nameKa : category.name;
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
    const labels: Record<string, { en: string; ka: string }> = {
      "1-2": { en: "1-2y", ka: "1-2წ" },
      "3-5": { en: "3-5y", ka: "3-5წ" },
      "5-10": { en: "5-10y", ka: "5-10წ" },
      "10+": { en: "10+y", ka: "10+წ" },
    };
    return labels[experience]?.[locale === "ka" ? "ka" : "en"] || experience;
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
        return locale === "ka" ? subcategory.nameKa : subcategory.name;
      for (const sub of category.subcategories) {
        if (sub.children) {
          const subSub = sub.children.find(
            (child) => child.key === subcategoryKey
          );
          if (subSub) return locale === "ka" ? subSub.nameKa : subSub.name;
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

  const cityTranslations: Record<string, string> = {
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

  const translateCity = (city: string) => {
    if (locale === "ka") {
      const lowerCity = city.toLowerCase().trim();
      if (cityTranslations[lowerCity]) return cityTranslations[lowerCity];
    }
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A]">
        <Header />
        <HeaderSpacer />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="xl" variant="border" color={ACCENT_COLOR} />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A]">
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
            <Button onClick={() => router.push("/browse")} className="mt-6">
              {t("common.goBack")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = profile.avatar;
  const portfolioImages = getAllPortfolioImages();
  const portfolioProjects = getUnifiedProjects();
  const groupedServices = getGroupedServices();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A]">
      <Header />
      <HeaderSpacer />

      {/* Pending Approval Banner - Only visible to the pro owner */}
      {isOwner && profile && profile.isAdminApproved === false && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-800/30">
              <svg
                className="w-5 h-5 text-amber-600 dark:text-amber-400"
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
            <div className="flex-1">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                {locale === "ka"
                  ? "თქვენი პროფილი განხილვის პროცესშია"
                  : "Your profile is pending approval"}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {locale === "ka"
                  ? "ადმინისტრატორი განიხილავს თქვენს პროფილს. დამტკიცების შემდეგ გახდებით ხილული კლიენტებისთვის."
                  : "An administrator is reviewing your profile. Once approved, you will be visible to clients."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejected Profile Banner */}
      {isOwner && profile && profile.adminRejectionReason && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-800/30">
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">
                {locale === "ka"
                  ? "თქვენი პროფილი საჭიროებს გადახედვას"
                  : "Your profile needs updates"}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {profile.adminRejectionReason}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => router.push("/pro/profile-setup")}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {locale === "ka" ? "რედაქტირება" : "Edit Profile"}
            </Button>
          </div>
        </div>
      )}

      {/* ========== COMPACT HERO SECTION ========== */}
      <section
        ref={heroRef}
        className={`relative transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}
      >
        {/* Clean header (less busy, better on mobile) */}
        <div className="relative h-20 sm:h-24 md:h-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#F6F1EC] via-[#FAFAFA] to-[#FAFAFA] dark:from-neutral-950 dark:via-[#0A0A0A] dark:to-[#0A0A0A]" />
          {/* Subtle texture */}
          <div
            className="absolute inset-0 opacity-[0.10] dark:opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.18) 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
          />
          {/* Accent hairline */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4735B]/40 to-transparent" />
        </div>

        {/* Back button & Share - positioned over header */}
        <div className="absolute top-4 sm:top-5 left-0 right-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-md hover:bg-white dark:hover:bg-neutral-800"
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              {t("common.back")}
            </Button>

            {/* Share button with dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-md hover:bg-white dark:hover:bg-neutral-800"
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                {t("common.share")}
              </Button>

              {/* Share dropdown menu */}
              {showShareMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-2 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <button
                    onClick={handleShareFacebook}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center">
                      <Facebook className="w-4 h-4 text-white" />
                    </div>
                    <span>Facebook</span>
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                      {copySuccess ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Link2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      )}
                    </div>
                    <span>{t("common.copyLink")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile card - mobile-first layout */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 -mt-5 sm:-mt-7 pb-4">
          <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200/60 dark:border-neutral-800 p-4 md:p-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0 self-start">
                {avatarUrl ? (
                  <Image
                    src={storage.getFileUrl(avatarUrl)}
                    alt={profile.name}
                    width={96}
                    height={96}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover ring-2 ring-white dark:ring-neutral-800 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center text-white text-3xl font-bold bg-gradient-to-br from-[#C4735B] to-[#A65D47] ring-2 ring-white dark:ring-neutral-800 shadow-lg">
                    {profile.name.charAt(0)}
                  </div>
                )}
                {profile.verificationStatus === "verified" && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900 flex items-center justify-center shadow-md">
                    <BadgeCheck className="w-4 h-4 text-white" />
                  </div>
                )}
                {profile.isAvailable && !profile.verificationStatus && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                {isOwner && isEditingName ? (
                  <div className="flex items-center gap-2 mb-1">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-xl font-bold max-w-[200px]"
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
                  <div className="flex items-center justify-start gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white truncate">
                      {profile.name}
                    </h1>
                    {isOwner && (
                      <button
                        onClick={() => {
                          setEditedName(profile.name);
                          setIsEditingName(true);
                        }}
                        className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title={t("common.edit")}
                      >
                        <Edit3 className="w-4 h-4 text-neutral-500" />
                      </button>
                    )}
                  </div>
                )}
                {/* Title/Tagline - only show if user has explicitly set one, hide old category-based titles */}
                {isOwner ? (
                  isEditingTitle ? (
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        placeholder={t("professional.addTagline")}
                        className="text-sm max-w-[250px]"
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
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingTitle(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      {profile.title && !isCategoryBasedTitle(profile.title) ? (
                        <p className="text-sm sm:text-base text-[#C4735B] font-medium truncate">
                          {profile.title}
                        </p>
                      ) : (
                        <p className="text-sm text-neutral-400 italic">
                          {t("professional.addTagline")}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setEditedTitle(
                            profile.title &&
                              !isCategoryBasedTitle(profile.title)
                              ? profile.title
                              : ""
                          );
                          setIsEditingTitle(true);
                        }}
                        className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title={t("common.edit")}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                      </button>
                    </div>
                  )
                ) : (
                  profile.title &&
                  !isCategoryBasedTitle(profile.title) && (
                    <p className="text-sm sm:text-base text-[#C4735B] font-medium mb-2 truncate">
                      {profile.title}
                    </p>
                  )
                )}

                {/* Stats */}
                <div className="flex items-center justify-start flex-wrap gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {profile.profileViewCount ?? 0}
                    </span>
                  </div>
                  {profile.avgRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {profile.avgRating.toFixed(1)}
                      </span>
                      <span className="text-neutral-500">
                        ({profile.totalReviews})
                      </span>
                    </div>
                  )}
                  {profile.serviceAreas.length > 0 && (
                    <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{translateCity(profile.serviceAreas[0])}</span>
                    </div>
                  )}
                  {/* Show years of experience - calculated from selectedServices or yearsExperience */}
                  {(() => {
                    // Calculate max experience from selectedServices
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
                          (s) => experienceToYears[s.experience] || 0
                        )
                      );
                      if (calcMax > maxYears) maxYears = calcMax;
                    }

                    return maxYears > 0 ? (
                      <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>
                          {maxYears}+ {t("professional.yrs")}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Categories - Main expertise areas */}
                {profile.categories?.length > 0 && (
                  <div className="flex flex-wrap justify-start gap-1.5 mt-3">
                    {(profile.categories.length > 2
                      ? profile.categories.slice(0, 2)
                      : profile.categories
                    ).map((cat, idx) => (
                      <span
                        key={`cat-${idx}`}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#C4735B] to-[#D4937B] text-white shadow-sm"
                      >
                        {getCategoryLabel(cat)}
                      </span>
                    ))}
                    {profile.categories.length > 2 && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700">
                        +{profile.categories.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Services with Experience - mobile compact */}
                {((profile.selectedServices?.length ?? 0) > 0 ||
                  (profile.subcategories?.length ?? 0) > 0) && (
                  <div className="sm:hidden mt-3">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                      {locale === "ka"
                        ? "სერვისები და გამოცდილება"
                        : "Services & Experience"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.selectedServices && profile.selectedServices.length > 0 ? (
                        <>
                          {profile.selectedServices.slice(0, 3).map((service, idx) => (
                            <span
                              key={`m-svc-${idx}`}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700"
                            >
                              <span className="truncate max-w-[160px]">
                                {locale === "ka" ? service.nameKa : service.name}
                              </span>
                              <span className="text-[10px] font-semibold text-[#C4735B] bg-[#C4735B]/10 px-1.5 py-0.5 rounded">
                                {getExperienceLabel(service.experience)}
                              </span>
                            </span>
                          ))}
                          {profile.selectedServices.length > 3 && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700">
                              +{profile.selectedServices.length - 3}{" "}
                              {locale === "ka" ? "სხვა" : "more"}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {(profile.subcategories || []).slice(0, 3).map((sub, idx) => {
                            const experience = getServiceExperience(sub);
                            return (
                              <span
                                key={`m-sub-${idx}`}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700"
                              >
                                <span className="truncate max-w-[160px]">
                                  {getSubcategoryLabel(sub)}
                                </span>
                                {experience && (
                                  <span className="text-[10px] font-semibold text-[#C4735B] bg-[#C4735B]/10 px-1.5 py-0.5 rounded">
                                    {getExperienceLabel(experience)}
                                  </span>
                                )}
                              </span>
                            );
                          })}
                          {(profile.subcategories?.length || 0) > 3 && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700">
                              +{(profile.subcategories?.length || 0) - 3}{" "}
                              {locale === "ka" ? "სხვა" : "more"}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Services with Experience - Detailed skills (desktop) */}
                {((profile.selectedServices?.length ?? 0) > 0 ||
                  (profile.subcategories?.length ?? 0) > 0) && (
                  <div className="hidden sm:block mt-3 p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                      {locale === "ka"
                        ? "სერვისები და გამოცდილება"
                        : "Services & Experience"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.selectedServices &&
                      profile.selectedServices.length > 0 ? (
                        <>
                          {profile.selectedServices
                            .slice(0, 6)
                            .map((service, idx) => (
                              <div
                                key={`svc-${idx}`}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 shadow-sm"
                              >
                                <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                  {locale === "ka"
                                    ? service.nameKa
                                    : service.name}
                                </span>
                                <span className="text-[10px] font-semibold text-[#C4735B] bg-[#C4735B]/10 px-1.5 py-0.5 rounded">
                                  {getExperienceLabel(service.experience)}
                                </span>
                              </div>
                            ))}
                          {profile.selectedServices.length > 6 && (
                            <span className="flex items-center px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-xs font-medium text-neutral-500">
                              +{profile.selectedServices.length - 6}{" "}
                              {locale === "ka" ? "სხვა" : "more"}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {profile.subcategories
                            ?.slice(0, 6)
                            .map((sub, idx) => {
                              const experience = getServiceExperience(sub);
                              return (
                                <div
                                  key={`sub-${idx}`}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 shadow-sm"
                                >
                                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                    {getSubcategoryLabel(sub)}
                                  </span>
                                  {experience && (
                                    <span className="text-[10px] font-semibold text-[#C4735B] bg-[#C4735B]/10 px-1.5 py-0.5 rounded">
                                      {getExperienceLabel(experience)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          {(profile.subcategories?.length || 0) > 6 && (
                            <span className="flex items-center px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-xs font-medium text-neutral-500">
                              +{(profile.subcategories?.length || 0) - 6}{" "}
                              {locale === "ka" ? "სხვა" : "more"}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Price & CTA - Right side */}
              <div className="flex flex-col gap-3 flex-shrink-0 w-full sm:w-auto sm:items-end">
                {pricingMeta && (
                  <div className="text-left sm:text-right">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        {pricingMeta.typeLabel}
                      </span>
                      {pricingMeta.valueLabel && (
                        <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {pricingMeta.valueLabel}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {/* Visitor CTA: show inside hero on desktop; mobile uses the fixed bottom button */}
                {!isOwner && (
                  <div className="hidden lg:block">
                    {phoneRevealed && profile.phone ? (
                      <a
                        href={`tel:${profile.phone}`}
                        className="w-full sm:w-auto px-5 py-2 rounded-xl sm:rounded-full text-white font-medium text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25"
                      >
                        <span className="flex items-center justify-center sm:justify-start gap-2">
                          <Phone className="w-4 h-4" />
                          {profile.phone}
                        </span>
                      </a>
                    ) : (
                      <Button
                        onClick={handleContact}
                        size="sm"
                        className="w-full sm:w-auto rounded-xl sm:rounded-full"
                        leftIcon={
                          isBasicTier ? (
                            <Phone className="w-4 h-4" />
                          ) : (
                            <MessageSquare className="w-4 h-4" />
                          )
                        }
                      >
                        {isBasicTier
                          ? t("professional.showPhone")
                          : t("professional.contact")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== MOBILE TAB NAVIGATION ========== */}
      <div className="lg:hidden sticky top-[60px] z-30 bg-[#FAFAFA]/95 dark:bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-800/50 px-4 py-3">
        <ProfileSidebarMobile
          activeTab={activeTab}
          onTabChange={setActiveTab}
          locale={locale}
          portfolioCount={portfolioProjects.length}
          reviewsCount={profile.totalReviews}
        />
      </div>

      {/* ========== MAIN CONTENT WITH SIDEBAR ========== */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-12">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-[80px] bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 p-3 shadow-sm">
              <ProfileSidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                locale={locale}
                portfolioCount={portfolioProjects.length}
                reviewsCount={profile.totalReviews}
              />
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* ABOUT TAB */}
            {activeTab === "about" && (
              <div className="min-h-[300px]">
                <AboutTab
                  bio={profile.bio}
                  customServices={profile.customServices}
                  groupedServices={groupedServices}
                  getCategoryLabel={getCategoryLabel}
                  getSubcategoryLabel={getSubcategoryLabel}
                  whatsapp={profile.whatsapp}
                  telegram={profile.telegram}
                  facebookUrl={profile.facebookUrl}
                  instagramUrl={profile.instagramUrl}
                  linkedinUrl={profile.linkedinUrl}
                  websiteUrl={profile.websiteUrl}
                  locale={locale as "en" | "ka" | "ru"}
                  isOwner={isOwner}
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
                      prev ? { ...prev, customServices } : prev
                    );
                    toast.success(locale === "ka" ? "შენახულია" : "Saved");
                  }}
                  onSaveSocialLinks={async (socialLinks) => {
                    await api.patch("/users/me/pro-profile", socialLinks);
                    setProfile((prev) =>
                      prev ? { ...prev, ...socialLinks } : prev
                    );
                    toast.success(locale === "ka" ? "შენახულია" : "Saved");
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
                    isEditable: p.source !== "homico", // Only allow edit/delete for non-Homico projects
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
                  totalReviews={profile.totalReviews}
                  locale={locale as "en" | "ka" | "ru"}
                />
              </div>
            )}

            {/* ========== SIMILAR PROFESSIONALS ========== */}
            {proCategories.length > 0 && (
              <SimilarProfessionals
                categories={proCategories}
                currentProId={profile.id}
                locale={locale}
              />
            )}
          </div>
        </div>
      </main>

      {/* Click outside to close share menu */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}

      {/* ========== FLOATING BUTTON - MOBILE ========== */}
      <div
        className={`lg:hidden fixed bottom-6 left-4 right-4 z-40 transition-all duration-300 ${
          showFloatingButton
            ? "translate-y-0 opacity-100"
            : "translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        {phoneRevealed && profile.phone ? (
          <a
            href={`tel:${profile.phone}`}
            className="block w-full py-4 rounded-2xl text-white font-semibold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/30 text-center"
          >
            <span className="flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" />
              {profile.phone}
            </span>
          </a>
        ) : (
          <Button
            onClick={handleContact}
            size="lg"
            className="w-full rounded-2xl"
            leftIcon={
              isBasicTier ? (
                <Phone className="w-5 h-5" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )
            }
          >
            {isBasicTier
              ? t("professional.showPhone")
              : t("professional.contact")}
          </Button>
        )}
      </div>

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
              <div className="flex items-center justify-between p-4">
                <h3 className="text-white font-semibold text-lg truncate max-w-[70%]">
                  {selectedProject.title}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedProject(null)}
                  className="rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Main Media */}
              <div
                className="flex-1 flex items-center justify-center relative px-4"
                onClick={(e) => e.stopPropagation()}
              >
                {totalMedia > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-lg"
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
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:text-white z-10"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-lg"
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:text-white z-10"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </>
                )}
                {isVideo ? (
                  <video
                    src={storage.getFileUrl(currentItem)}
                    controls
                    autoPlay
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={storage.getFileUrl(currentItem)}
                    alt=""
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                )}
              </div>

              {/* Thumbnail Strip */}
              {totalMedia > 1 && (
                <div className="p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-start gap-2 overflow-x-auto pb-2">
                    {/* Image thumbnails */}
                    {selectedProject.images.map((img, idx) => (
                      <button
                        key={`img-${idx}`}
                        onClick={() =>
                          setSelectedProject((prev) =>
                            prev ? { ...prev, currentIndex: idx } : null
                          )
                        }
                        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                          idx === selectedProject.currentIndex
                            ? "ring-2 ring-[#C4735B] ring-offset-2 ring-offset-black"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={storage.getFileUrl(img)}
                          alt=""
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
                          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                            mediaIdx === selectedProject.currentIndex
                              ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-black"
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
                  <div className="text-center mt-2">
                    <span className="text-white/60 text-sm">
                      {selectedProject.currentIndex + 1} / {totalMedia}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      {/* ========== CONTACT MODAL ========== */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSend={async (msg: string) => {
          if (!user) return;
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
          if (response.ok) {
            setShowContactModal(false);
            toast.success(t("common.messageSent"));
            trackEvent(AnalyticsEvent.CONVERSATION_START, {
              proId: profile?.id,
              proName: profile?.name,
            });
          } else {
            throw new Error("Failed to send message");
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
    } catch {
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
        const url = await uploadFile(file);
        if (url) newImages.push(url);
      }
      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch {
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        t("common.uploadFailed")
      );
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
          toast.error(locale === "ka" ? "შეცდომა" : "Error", error);
          continue;
        }
        const url = await uploadFile(file);
        if (url) newVideos.push(url);
      }
      if (newVideos.length > 0) {
        setVideos((prev) => [...prev, ...newVideos]);
      }
    } catch {
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        locale === "ka" ? "ატვირთვა ვერ მოხერხდა" : "Upload failed"
      );
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
      toast.error(locale === "ka" ? "შეცდომა" : "Error", error);
      return;
    }

    setIsUploading(true);
    setUploadingType("before");
    try {
      const url = await uploadFile(file);
      if (url) {
        setPendingBeforeImage(url);
      }
    } catch {
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        locale === "ka" ? "ატვირთვა ვერ მოხერხდა" : "Upload failed"
      );
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
      toast.error(locale === "ka" ? "შეცდომა" : "Error", error);
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
    } catch {
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        locale === "ka" ? "ატვირთვა ვერ მოხერხდა" : "Upload failed"
      );
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
        locale === "ka" ? "შეცდომა" : "Error",
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
        locale === "ka" ? "შეცდომა" : "Error",
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
      <div className="max-h-[80vh] overflow-hidden flex flex-col">
        {/* Premium Header with Gradient */}
        <div className="relative px-6 py-5 bg-gradient-to-br from-[#C4735B] via-[#B8654D] to-[#A65D47]">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-0 left-0 w-32 h-16 rounded-full bg-black/5 blur-2xl" />
          </div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{modalTitle}</h2>
              <p className="text-white/70 text-sm mt-0.5">
                {t("professional.showcaseYourBestWork")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-5 px-6 py-6">
          {/* Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
              <span className="w-5 h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center text-[#C4735B] text-xs">
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
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
              <MapPin className="w-4 h-4 text-[#C4735B]" />
              {t("common.location")}
            </label>
            <AddressPicker
              value={location}
              onChange={(address) => setLocation(address)}
              locale={locale}
              className="[&_.map-container]:h-40"
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
              <span className="w-5 h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center text-[#C4735B] text-xs">
                2
              </span>
              {t("common.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("professional.whatDidYouDoMaterials")}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B] focus:border-transparent focus:bg-white dark:focus:bg-neutral-800 resize-none transition-all"
            />
          </div>

          {/* Media Section */}
          <div className="bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                <span className="w-5 h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center text-[#C4735B] text-xs">
                  3
                </span>
                {t("professional.mediaFiles")}
                <span className="text-red-400">*</span>
              </label>
              {totalMedia > 0 && (
                <span className="px-2.5 py-1 bg-[#C4735B] text-white text-xs font-medium rounded-full">
                  {totalMedia} {t("common.files")}
                </span>
              )}
            </div>

            {/* Media Type Tabs - Premium Design */}
            <div className="grid grid-cols-3 gap-2 mb-4">
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
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      isActive
                        ? "border-[#C4735B] bg-[#C4735B]/5 shadow-sm"
                        : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${isActive ? "text-[#C4735B]" : "text-neutral-400"}`}
                    />
                    <span
                      className={`text-xs font-medium ${isActive ? "text-[#C4735B]" : "text-neutral-500"}`}
                    >
                      {tab.label}
                    </span>
                    {tab.count > 0 && (
                      <span
                        className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
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
              <div className="space-y-3">
                {images.length === 0 ? (
                  // Empty State - Large Upload Area
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-10 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800/50 flex flex-col items-center justify-center text-neutral-400 hover:border-[#C4735B] hover:text-[#C4735B] hover:bg-[#C4735B]/5 transition-all group"
                  >
                    {isUploading && uploadingType === "images" ? (
                      <LoadingSpinner size="lg" color="#C4735B" />
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mb-3 group-hover:bg-[#C4735B]/10 group-hover:scale-110 transition-all">
                          <ImageIcon className="w-7 h-7" />
                        </div>
                        <span className="text-sm font-medium">
                          {t("professional.choosePhotos")}
                        </span>
                        <span className="text-xs mt-1 text-neutral-400">
                          {t("professional.orDragAndDrop")}
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  // Image Grid with Add Button
                  <div className="grid grid-cols-4 gap-2">
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
              <div className="space-y-3">
                {videos.length === 0 ? (
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-10 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800/50 flex flex-col items-center justify-center text-neutral-400 hover:border-[#C4735B] hover:text-[#C4735B] hover:bg-[#C4735B]/5 transition-all group"
                  >
                    {isUploading && uploadingType === "videos" ? (
                      <LoadingSpinner size="lg" color="#C4735B" />
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mb-3 group-hover:bg-[#C4735B]/10 group-hover:scale-110 transition-all">
                          <Video className="w-7 h-7" />
                        </div>
                        <span className="text-sm font-medium">
                          {t("professional.uploadVideo")}
                        </span>
                        <span className="text-xs mt-1 text-neutral-400">
                          MP4, MOV, WebM
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
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
                  {locale === "ka" ? "მაქს" : "Max"} 100MB
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
                        ✓ {locale === "ka" ? "მანამდე" : "Before"}
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
                        {locale === "ka" ? "შემდეგ" : "After"}?
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
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
          <p className="text-xs text-neutral-400 hidden sm:block">
            {totalMedia === 0
              ? t("professional.addAtLeastOneFile")
              : `${totalMedia} ${t("professional.filesReady")}`}
          </p>
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              loading={isLoading}
              disabled={totalMedia === 0 || !title.trim()}
              className="min-w-[120px]"
            >
              {initialData ? t("common.update") : t("professional.addProject")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
