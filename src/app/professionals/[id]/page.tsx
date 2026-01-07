"use client";

import { Button } from "@/components/ui/button";
import Header, { HeaderSpacer } from "@/components/common/Header";
import ContactModal from "@/components/professionals/ContactModal";
import AboutTab from "@/components/professionals/AboutTab";
import PortfolioTab from "@/components/professionals/PortfolioTab";
import ReviewsTab from "@/components/professionals/ReviewsTab";
import { Review } from "@/components/professionals/ReviewItem";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import {
  BadgeCheck,
  Briefcase,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Link2,
  Linkedin,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  Star,
  X
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { storage } from "@/services/storage";
import { formatTimeAgo } from "@/utils/dateUtils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { ACCENT_COLOR } from "@/constants/theme";
import Avatar from "@/components/common/Avatar";
import { MultiStarDisplay } from "@/components/ui/StarRating";

interface PortfolioProject {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  images: string[];
  videos?: string[];
  beforeAfterPairs?: { id?: string; beforeImage: string; afterImage: string }[];
}

interface PortfolioItem {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  images?: string[];
  tags?: string[];
  projectDate?: string;
  completedDate?: string;
  location?: string;
  projectType: "quick" | "project" | "job";
  status: "completed" | "in_progress";
  category?: string;
  rating?: number;
  review?: string;
  beforeImage?: string;
  afterImage?: string;
}

interface ProProfile {
  _id: string;
  uid?: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  city?: string;
  whatsapp?: string;
  telegram?: string;
  title: string;
  companyName?: string;
  description: string;
  categories: string[];
  subcategories?: string[];
  customServices?: string[];
  yearsExperience: number;
  serviceAreas: string[];
  pricingModel: "hourly" | "project_based" | "from" | "sqm" | "daily";
  basePrice: number;
  maxPrice?: number;
  currency: string;
  avgRating: number;
  totalReviews: number;
  completedJobs?: number;
  externalCompletedJobs?: number;
  isAvailable: boolean;
  status?: "active" | "busy" | "away";
  coverImage?: string;
  certifications: string[];
  languages: string[];
  tagline?: string;
  responseTime?: string;
  createdAt?: string;
  isPremium?: boolean;
  premiumTier?: "none" | "basic" | "pro" | "elite";
  portfolioProjects?: PortfolioProject[];
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  verificationStatus?: "pending" | "submitted" | "verified" | "rejected";
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

interface Review {
  _id: string;
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

export default function ProfessionalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { locale } = useLanguage();
  const toast = useToast();
  const { trackEvent } = useAnalytics();
  const { categories: CATEGORIES } = useCategories();

  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<{
    images: string[];
    videos: string[];
    title: string;
    currentIndex: number;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "portfolio" | "reviews">(
    "about"
  );

  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setShowFloatingButton(heroBottom < 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/pros/${params.id}`
        );
        if (!response.ok) throw new Error("Profile not found");
        const data = await response.json();
        setProfile(data);
        trackEvent(AnalyticsEvent.PROFILE_VIEW, {
          proId: data._id || data.id,
          proName: data.name,
          category: data.categories?.[0],
        });
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchProfile();
  }, [params.id]);

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
      if (!profile?._id) return;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/portfolio/pro/${profile._id}`
        );
        if (response.ok) {
          const data = await response.json();
          setPortfolio(data);
        }
      } catch (err) {
        console.error("Failed to fetch portfolio:", err);
      }
    };
    if (profile?._id) fetchPortfolio();
  }, [profile?._id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!profile?._id) return;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reviews/pro/${profile._id}`
        );
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      }
    };
    if (profile?._id) fetchReviews();
  }, [profile?._id]);

  const isBasicTier =
    !profile?.premiumTier ||
    profile?.premiumTier === "none" ||
    profile?.premiumTier === "basic";

  const handleContact = () => {
    if (!user) {
      openLoginModal();
      return;
    }

    // For basic tier pros, reveal phone number instead of messaging
    if (isBasicTier && profile?.phone) {
      setPhoneRevealed(true);
      trackEvent(AnalyticsEvent.CONTACT_REVEAL, {
        proId: profile._id,
        proName: profile.name,
      });
      return;
    }

    router.push(`/messages?recipient=${profile?._id}`);
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
      toast.success(locale === "ka" ? "ლინკი დაკოპირდა!" : "Link copied!");
      setTimeout(() => setCopySuccess(false), 2000);
      setShowShareMenu(false);
    } catch {
      toast.error(locale === "ka" ? "შეცდომა" : "Error");
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
    date?: string;
  }

  const getUnifiedProjects = useCallback((): UnifiedProject[] => {
    const projects: UnifiedProject[] = [];
    const seenTitles = new Set<string>();

    // Add from portfolio items (fetched separately)
    portfolio.forEach((item) => {
      const titleKey = item.title?.toLowerCase().trim() || item._id;
      if (seenTitles.has(titleKey)) return;
      seenTitles.add(titleKey);

      const images: string[] = [];
      if (item.imageUrl) images.push(item.imageUrl);
      if (item.images) {
        item.images.forEach((img) => {
          if (!images.includes(img)) images.push(img);
        });
      }

      if (images.length > 0) {
        projects.push({
          id: item._id,
          title: item.title,
          description: item.description,
          location: item.location,
          images,
          videos: [],
          date: item.completedDate || item.projectDate,
        });
      }
    });

    // Add from profile's embedded portfolioProjects (avoid duplicates by title)
    profile?.portfolioProjects?.forEach((project, idx) => {
      const titleKey = project.title?.toLowerCase().trim() || `project-${idx}`;
      if (seenTitles.has(titleKey)) return;
      seenTitles.add(titleKey);

      const hasMedia = (project.images && project.images.length > 0) || (project.videos && project.videos.length > 0);
      if (hasMedia) {
        projects.push({
          id: project.id || `embedded-${idx}`,
          title: project.title,
          description: project.description,
          location: project.location,
          images: project.images || [],
          videos: project.videos || [],
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

  const getPricingLabel = () => {
    switch (profile?.pricingModel) {
      case "hourly":
        return locale === "ka" ? "/სთ" : "/hr";
      case "daily":
        return locale === "ka" ? "/დღე" : "/day";
      case "sqm":
        return "/m²";
      default:
        return "";
    }
  };

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

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  const nextImage = () => {
    const images = getAllPortfolioImages();
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = getAllPortfolioImages();
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

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
  }, [lightboxOpen, selectedProject]);

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
              {locale === "ka" ? "პროფილი ვერ მოიძებნა" : "Profile not found"}
            </h2>
            <Button
              onClick={() => router.push("/browse")}
              className="mt-6"
            >
              {locale === "ka" ? "უკან დაბრუნება" : "Go Back"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = profile.avatar;
  const portfolioImages = getAllPortfolioImages();
  const groupedServices = getGroupedServices();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A]">
      <Header />
      <HeaderSpacer />

      {/* ========== HERO SECTION ========== */}
      <section
        ref={heroRef}
        className={`relative transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F0ED] via-[#FAFAFA] to-[#FAFAFA] dark:from-[#1A1612] dark:via-[#0A0A0A] dark:to-[#0A0A0A]" />

        {/* Back button */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.back()}
            className="rounded-full bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            {locale === "ka" ? "უკან" : "Back"}
          </Button>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-5">
              {avatarUrl ? (
                <img
                  src={storage.getFileUrl(avatarUrl)}
                  alt={profile.name}
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-white dark:ring-neutral-900 shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center text-white text-5xl font-bold bg-gradient-to-br from-[#C4735B] to-[#A65D47] ring-4 ring-white dark:ring-neutral-900 shadow-xl">
                  {profile.name.charAt(0)}
                </div>
              )}

              {/* Verified badge */}
              {profile.verificationStatus === "verified" && (
                <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-emerald-500 border-4 border-white dark:border-neutral-900 flex items-center justify-center shadow-lg">
                  <BadgeCheck className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Online indicator */}
              {profile.isAvailable && !profile.verificationStatus && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white dark:border-neutral-900 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-1">
              {profile.name}
            </h1>

            {/* Title */}
            <p className="text-base sm:text-lg text-[#C4735B] font-medium mb-4">
              {profile.title}
            </p>

            {/* Stats Row */}
            <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-6 text-sm mb-6">
              {profile.avgRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {profile.avgRating.toFixed(1)}
                  </span>
                  <span className="text-neutral-500">
                    ({profile.totalReviews})
                  </span>
                </div>
              )}

              {profile.serviceAreas.length > 0 && (
                <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                  <MapPin className="w-4 h-4" />
                  <span>{translateCity(profile.serviceAreas[0])}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <Briefcase className="w-4 h-4" />
                <span>
                  {profile.yearsExperience}+ {locale === "ka" ? "წელი" : "yrs"}
                </span>
              </div>

              {profile.createdAt && (
                <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                  <span className="text-neutral-400">•</span>
                  <span>
                    {locale === "ka" ? "წევრი" : "Member"}{" "}
                    {new Date(profile.createdAt).getFullYear()}-
                    {locale === "ka" ? "დან" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Price Display */}
            {profile.basePrice > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-bold text-neutral-900 dark:text-white">
                  {profile.pricingModel === "from" &&
                    (locale === "ka" ? "" : "from ")}
                  {profile.basePrice}₾
                  {profile.pricingModel === "from" &&
                    (locale === "ka" ? "-დან" : "")}
                  {getPricingLabel()}
                </span>
                <Badge variant="secondary" size="xs">
                  {profile.pricingModel === "hourly" &&
                    (locale === "ka" ? "საათობრივი" : "Hourly")}
                  {profile.pricingModel === "daily" &&
                    (locale === "ka" ? "დღიური" : "Daily")}
                  {profile.pricingModel === "project_based" &&
                    (locale === "ka" ? "პროექტით" : "Per Project")}
                  {profile.pricingModel === "from" &&
                    (locale === "ka" ? "საწყისი ფასი" : "Starting Price")}
                  {profile.pricingModel === "sqm" &&
                    (locale === "ka" ? "კვ.მ" : "Per sqm")}
                </Badge>
              </div>
            )}

            {/* CTA Button */}
            {phoneRevealed && profile.phone ? (
              <a
                href={`tel:${profile.phone}`}
                className="px-8 py-3 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {profile.phone}
                </span>
              </a>
            ) : (
              <Button
                onClick={handleContact}
                className="rounded-full"
                leftIcon={isBasicTier ? <Phone className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              >
                {isBasicTier
                  ? locale === "ka"
                    ? "ტელეფონის ნახვა"
                    : "Show Phone"
                  : locale === "ka"
                    ? "დაკავშირება"
                    : "Contact"}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ========== TAB NAVIGATION ========== */}
      <div className="sticky top-[60px] z-30 bg-[#FAFAFA]/80 dark:bg-[#0A0A0A]/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {[
              { key: "about", label: locale === "ka" ? "შესახებ" : "About" },
              {
                key: "portfolio",
                label: locale === "ka" ? "ნამუშევრები" : "Portfolio",
                count: portfolioImages.length,
              },
              {
                key: "reviews",
                label: locale === "ka" ? "შეფასებები" : "Reviews",
                count: profile.totalReviews,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`relative px-4 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-[#C4735B]"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <Badge
                      variant={activeTab === tab.key ? "premium" : "secondary"}
                      size="xs"
                    >
                      {tab.count}
                    </Badge>
                  )}
                </span>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C4735B] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 lg:pb-12">
        {/* ABOUT TAB */}
        {activeTab === "about" && (
          <AboutTab
            description={profile.description}
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
            locale={locale as 'en' | 'ka'}
          />
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === "portfolio" && (
          <PortfolioTab
            projects={getUnifiedProjects().map(p => ({
              id: p.id,
              title: p.title,
              description: p.description,
              location: p.location,
              images: p.images,
              videos: p.videos,
            }))}
            onProjectClick={setSelectedProject}
            locale={locale as 'en' | 'ka'}
          />
        )}

        {/* REVIEWS TAB */}
        {activeTab === "reviews" && (
          <ReviewsTab
            reviews={reviews as Review[]}
            avgRating={profile.avgRating}
            totalReviews={profile.totalReviews}
            locale={locale as 'en' | 'ka'}
          />
        )}
      </main>

      {/* ========== FLOATING SHARE BUTTON ========== */}
      <div className="fixed bottom-6 right-4 z-50 lg:bottom-8 lg:right-8">
        <div className="relative">
          {/* Share menu */}
          {showShareMenu && (
            <div className="absolute bottom-14 right-0 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-2 min-w-[180px] animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                <span>{locale === "ka" ? "ლინკის კოპირება" : "Copy Link"}</span>
              </button>
            </div>
          )}

          {/* Share button */}
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setShowShareMenu(!showShareMenu)}
            className={`w-12 h-12 rounded-full shadow-lg ${
              showShareMenu
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rotate-45"
                : ""
            }`}
          >
            {showShareMenu ? (
              <X className="w-5 h-5" />
            ) : (
              <Share2 className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

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
            leftIcon={isBasicTier ? <Phone className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          >
            {isBasicTier
              ? locale === "ka"
                ? "ტელეფონის ნახვა"
                : "Show Phone"
              : locale === "ka"
                ? "დაკავშირება"
                : "Contact"}
          </Button>
        )}
      </div>

      {/* ========== PROJECT LIGHTBOX ========== */}
      {selectedProject && (() => {
        const allMedia = [...selectedProject.images, ...selectedProject.videos];
        const totalMedia = allMedia.length;
        const currentItem = allMedia[selectedProject.currentIndex];
        const isVideo = selectedProject.currentIndex >= selectedProject.images.length;

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
                                (prev.currentIndex - 1 + totalMedia) % totalMedia,
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
                              currentIndex: (prev.currentIndex + 1) % totalMedia,
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
                <div className="flex justify-center gap-2 overflow-x-auto pb-2">
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
                      <img
                        src={storage.getFileUrl(img)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                  {/* Video thumbnails */}
                  {selectedProject.videos.map((vid, idx) => {
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
                          <svg className="w-2.5 h-2.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
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
              body: JSON.stringify({ proId: profile?._id, message: msg }),
            }
          );
          if (response.ok) {
            setShowContactModal(false);
            toast.success(
              locale === "ka" ? "შეტყობინება გაგზავნილია!" : "Message sent!"
            );
            trackEvent(AnalyticsEvent.CONVERSATION_START, {
              proId: profile?._id,
              proName: profile?.name,
            });
          } else {
            throw new Error("Failed to send message");
          }
        }}
        name={profile?.name || ""}
        title={profile?.title || ""}
        avatar={avatarUrl}
        locale={locale as "en" | "ka"}
      />
    </div>
  );
}
