"use client";

import AppBackground from "@/components/common/AppBackground";
import Header, { HeaderSpacer } from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  Trophy,
  Users,
  X,
} from "lucide-react";
import MediaLightbox, { MediaItem } from "@/components/common/MediaLightbox";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// Terracotta accent colors
const ACCENT = "#E07B4F";
const ACCENT_HOVER = "#D26B3F";

// Helper function to get proper image URL
const getImageUrl = (path: string | undefined): string => {
  if (!path) return "";
  if (path.startsWith("data:")) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  if (path.startsWith("/")) return `${apiUrl}${path}`;
  return `${apiUrl}/uploads/${path}`;
};

interface TeamMember {
  _id: string;
  name: string;
  avatar?: string;
  title?: string;
  role: "owner" | "manager" | "employee";
}

interface PortfolioProject {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  category?: string;
  completedDate?: string;
}

interface CompanyProfile {
  _id: string;
  name: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  tagline?: string;
  companyType: "construction" | "service_agency" | "both";
  categories: string[];
  subcategories?: string[];
  serviceAreas: string[];
  foundedYear?: number;
  teamSize?: number;
  completedProjects?: number;
  avgRating: number;
  totalReviews: number;
  isVerified?: boolean;
  isPremium?: boolean;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  workingHours?: string;
  certifications?: string[];
  teamMembers?: TeamMember[];
  portfolioProjects?: PortfolioProject[];
  createdAt?: string;
}

interface Review {
  _id: string;
  clientId: {
    name: string;
    avatar?: string;
  };
  rating: number;
  text?: string;
  photos?: string[];
  createdAt: string;
  projectTitle?: string;
  isAnonymous?: boolean;
}

export default function CompanyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { locale } = useLanguage();
  const toast = useToast();
  const { categories: CATEGORIES } = useCategories();

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/companies/${params.id}/public`
        );
        if (!response.ok) throw new Error("Company not found");
        const data = await response.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message || "Failed to load company");
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
    const fetchReviews = async () => {
      if (!profile?._id) return;
      setReviewsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reviews/company/${profile._id}`
        );
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };
    if (profile?._id) fetchReviews();
  }, [profile?._id]);

  const handleContact = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    router.push(`/messages?company=${profile?._id}`);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    setIsSending(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/conversations/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            companyId: profile?._id,
            message: message,
          }),
        }
      );

      if (response.ok) {
        setShowContactModal(false);
        setMessage("");
        toast.success(
          locale === "ka" ? "შეტყობინება გაგზავნილია!" : "Message sent!"
        );
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      toast.error(locale === "ka" ? "შეცდომა" : "Error");
    } finally {
      setIsSending(false);
    }
  };

  const getCategoryLabel = (categoryKey: string) => {
    if (!categoryKey) return "";
    const category = CATEGORIES.find((cat) => cat.key === categoryKey);
    if (category) {
      return locale === "ka" ? category.nameKa : category.name;
    }
    return categoryKey
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getSubcategoryLabel = (subcategoryKey: string) => {
    if (!subcategoryKey) return "";
    if (subcategoryKey.startsWith("custom:")) {
      return subcategoryKey.replace("custom:", "");
    }
    for (const category of CATEGORIES) {
      const subcategory = category.subcategories.find(
        (sub) => sub.key === subcategoryKey
      );
      if (subcategory) {
        return locale === "ka" ? subcategory.nameKa : subcategory.name;
      }
      for (const sub of category.subcategories) {
        if (sub.children) {
          const subSub = sub.children.find(
            (child) => child.key === subcategoryKey
          );
          if (subSub) {
            return locale === "ka" ? subSub.nameKa : subSub.name;
          }
        }
      }
    }
    return subcategoryKey
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (locale === "ka") {
      if (diffDays < 7) return `${diffDays} დღის წინ`;
      if (diffWeeks < 4) return `${diffWeeks} კვირის წინ`;
      return `${diffMonths} თვის წინ`;
    }
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  };

  const cityTranslations: Record<string, string> = {
    tbilisi: "თბილისი",
    rustavi: "რუსთავი",
    batumi: "ბათუმი",
    kutaisi: "ქუთაისი",
    gori: "გორი",
    zugdidi: "ზუგდიდი",
    nationwide: "საქართველოს მასშტაბით",
  };

  const translateCity = (city: string) => {
    if (locale === "ka") {
      const lowerCity = city.toLowerCase().trim();
      if (cityTranslations[lowerCity]) {
        return cityTranslations[lowerCity];
      }
    }
    return city;
  };

  // Get all portfolio images
  const getAllPortfolioImages = useCallback((): MediaItem[] => {
    const images: MediaItem[] = [];
    profile?.portfolioProjects?.forEach((project) => {
      project.images.forEach((img, idx) => {
        images.push({
          url: img,
          title: project.title,
          description: idx === 0 ? project.description : undefined,
        });
      });
    });
    return images;
  }, [profile?.portfolioProjects]);

  // Lightbox navigation
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <Header />
        <HeaderSpacer />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-3 border-[#E07B4F]/20" />
              <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-[#E07B4F] animate-spin" />
            </div>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {locale === "ka" ? "იტვირთება..." : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <Header />
        <HeaderSpacer />
        <div className="py-20 text-center">
          <div className="max-w-md mx-auto px-4">
            <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[var(--color-bg-muted)] flex items-center justify-center">
              <Building2 className="w-12 h-12 text-[var(--color-text-muted)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
              {locale === "ka" ? "კომპანია ვერ მოიძებნა" : "Company not found"}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-8">
              {locale === "ka"
                ? "სამწუხაროდ, ეს კომპანია არ არსებობს"
                : "Sorry, this company doesn't exist"}
            </p>
            <button
              onClick={() => router.push("/browse")}
              className="px-8 py-4 text-sm font-bold rounded-2xl text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              style={{ backgroundColor: ACCENT }}
            >
              {locale === "ka" ? "კომპანიების ნახვა" : "Browse Companies"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const logoUrl = profile.logo;
  const portfolioImages = getAllPortfolioImages();

  const getCompanyTypeLabel = () => {
    switch (profile.companyType) {
      case "construction":
        return locale === "ka" ? "სამშენებლო კომპანია" : "Construction Company";
      case "service_agency":
        return locale === "ka" ? "სერვისის სააგენტო" : "Service Agency";
      case "both":
        return locale === "ka"
          ? "სამშენებლო & სერვისი"
          : "Construction & Service";
      default:
        return locale === "ka" ? "კომპანია" : "Company";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <AppBackground />
      <Header />
      <HeaderSpacer />

      {/* Hero Section */}
      <section
        className={`relative transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {/* Cover Image */}
        {profile.coverImage && (
          <div className="relative h-48 sm:h-64 lg:h-80 overflow-hidden">
            <img
              src={getImageUrl(profile.coverImage)}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        {/* Profile Card */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div
            className={`relative ${profile.coverImage ? "-mt-20" : "pt-6 sm:pt-8"} mb-8`}
          >
            <div className="bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border-subtle)] shadow-2xl shadow-black/5 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                  {/* Logo */}
                  <div className="relative flex-shrink-0 self-start">
                    {logoUrl ? (
                      <img
                        src={getImageUrl(logoUrl)}
                        alt={profile.name}
                        className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-4 border-[var(--color-bg-elevated)] shadow-xl ring-4 ring-white/50 dark:ring-white/10"
                      />
                    ) : (
                      <div
                        className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-[var(--color-bg-elevated)] shadow-xl flex items-center justify-center text-white text-4xl font-bold"
                        style={{
                          background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_HOVER} 100%)`,
                        }}
                      >
                        {profile.name.charAt(0)}
                      </div>
                    )}

                    {/* Premium Badge */}
                    {profile.isPremium && (
                      <div className="absolute -top-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 border-4 border-[var(--color-bg-elevated)] flex items-center justify-center shadow-lg">
                        <Star className="w-5 h-5 text-white fill-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Name & Verification */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
                        {profile.name}
                      </h1>
                      {profile.isVerified && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <BadgeCheck className="w-4 h-4" />
                          <span className="text-xs font-semibold">
                            {locale === "ka" ? "დადასტურებული" : "Verified"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tagline or Type */}
                    <p
                      className="text-lg sm:text-xl font-medium mb-4"
                      style={{ color: ACCENT }}
                    >
                      {profile.tagline || getCompanyTypeLabel()}
                    </p>

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                      {/* Rating */}
                      {profile.avgRating > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {profile.avgRating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-[var(--color-text-tertiary)]">
                            ({profile.totalReviews}{" "}
                            {locale === "ka" ? "შეფასება" : "reviews"})
                          </span>
                        </div>
                      )}

                      {/* Location */}
                      {(profile.city || profile.serviceAreas.length > 0) && (
                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                          <MapPin className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                          <span>
                            {translateCity(
                              profile.city || profile.serviceAreas[0]
                            )}
                          </span>
                        </div>
                      )}

                      {/* Team Size */}
                      {profile.teamSize && profile.teamSize > 0 && (
                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                          <Users className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                          <span>
                            {profile.teamSize}{" "}
                            {locale === "ka" ? "თანამშრომელი" : "employees"}
                          </span>
                        </div>
                      )}

                      {/* Completed Projects */}
                      {profile.completedProjects &&
                        profile.completedProjects > 0 && (
                          <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span>
                              {profile.completedProjects}{" "}
                              {locale === "ka" ? "პროექტი" : "projects"}
                            </span>
                          </div>
                        )}

                      {/* Founded Year */}
                      {profile.foundedYear && (
                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                          <Calendar className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                          <span>
                            {locale === "ka"
                              ? `დაარსდა ${profile.foundedYear}`
                              : `Est. ${profile.foundedYear}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex sm:hidden items-center gap-3 mt-6 pt-6 border-t border-[var(--color-border-subtle)]">
                  <button
                    onClick={handleContact}
                    className="flex-1 py-3.5 rounded-xl text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {locale === "ka" ? "შეტყობინება" : "Message"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-8">
            {/* About Section */}
            {profile.description && (
              <section className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${ACCENT}15` }}
                  >
                    <Building2 className="w-5 h-5" style={{ color: ACCENT }} />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    {locale === "ka" ? "კომპანიის შესახებ" : "About Company"}
                  </h2>
                </div>
                <div className="text-[var(--color-text-secondary)] leading-relaxed text-[15px] whitespace-pre-wrap">
                  {profile.description}
                </div>
              </section>
            )}

            {/* Services Section */}
            {profile.subcategories && profile.subcategories.length > 0 && (
              <section className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#4A9B9B]/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-[#4A9B9B]" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    {locale === "ka" ? "სერვისები" : "Services"}
                  </h2>
                </div>

                <div className="space-y-6">
                  {profile.categories.map((categoryKey) => {
                    const subcats =
                      profile.subcategories?.filter((sub) => {
                        for (const category of CATEGORIES) {
                          if (category.key === categoryKey) {
                            return category.subcategories.some(
                              (s) => s.key === sub
                            );
                          }
                        }
                        return false;
                      }) || [];

                    if (subcats.length === 0) return null;

                    return (
                      <div key={categoryKey}>
                        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: ACCENT }}
                          />
                          {getCategoryLabel(categoryKey)}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {subcats.map((sub, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] transition-colors"
                            >
                              {getSubcategoryLabel(sub)}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Team Section */}
            {profile.teamMembers && profile.teamMembers.length > 0 && (
              <section className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-500" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    {locale === "ka" ? "გუნდი" : "Our Team"}
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {profile.teamMembers.slice(0, 8).map((member) => (
                    <div
                      key={member._id}
                      className="p-4 rounded-xl bg-[var(--color-bg-tertiary)] text-center"
                    >
                      {member.avatar ? (
                        <img
                          src={getImageUrl(member.avatar)}
                          alt={member.name}
                          className="w-16 h-16 rounded-xl object-cover mx-auto mb-3"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-xl mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold"
                          style={{
                            background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_HOVER} 100%)`,
                          }}
                        >
                          {member.name.charAt(0)}
                        </div>
                      )}
                      <p className="font-semibold text-[var(--color-text-primary)] text-sm truncate">
                        {member.name}
                      </p>
                      {member.title && (
                        <p className="text-xs text-[var(--color-text-tertiary)] truncate mt-0.5">
                          {member.title}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {profile.teamMembers.length > 8 && (
                  <button className="w-full mt-4 py-3 text-sm font-semibold rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                    {locale === "ka"
                      ? `ყველას ნახვა (${profile.teamMembers.length})`
                      : `View All (${profile.teamMembers.length})`}
                  </button>
                )}
              </section>
            )}

            {/* Portfolio Section */}
            {portfolioImages.length > 0 && (
              <section className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-amber-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                      {locale === "ka" ? "პორტფოლიო" : "Portfolio"}
                    </h2>
                  </div>
                  {portfolioImages.length > 6 && (
                    <button
                      className="text-sm font-semibold flex items-center gap-1 transition-colors hover:gap-2"
                      style={{ color: ACCENT }}
                    >
                      {locale === "ka" ? "ყველას ნახვა" : "View All"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {portfolioImages.slice(0, 6).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => openLightbox(idx)}
                      className={`relative rounded-2xl overflow-hidden bg-[var(--color-bg-tertiary)] group cursor-pointer ${
                        idx === 0
                          ? "col-span-2 row-span-2 aspect-[4/3]"
                          : "aspect-square"
                      }`}
                    >
                      <img
                        src={getImageUrl(img.url)}
                        alt={img.title || ""}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* View Icon */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                          <ExternalLink className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      {/* Title */}
                      {img.title && idx === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-white font-semibold truncate">
                            {img.title}
                          </p>
                        </div>
                      )}

                      {/* More Indicator */}
                      {idx === 5 && portfolioImages.length > 6 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">
                            +{portfolioImages.length - 6}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews Section */}
            {reviews.length > 0 && (
              <section className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Star className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === "ka" ? "შეფასებები" : "Reviews"}
                      </h2>
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        {profile.totalReviews}{" "}
                        {locale === "ka" ? "შეფასება" : "reviews"}
                      </p>
                    </div>
                  </div>

                  {/* Rating Summary */}
                  {profile.avgRating > 0 && (
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--color-bg-tertiary)]">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= Math.round(profile.avgRating) ? "fill-amber-400 text-amber-400" : "text-[var(--color-border)]"}`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {profile.avgRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {reviews.slice(0, 4).map((review, idx) => (
                    <div
                      key={review._id}
                      className={`${idx < Math.min(reviews.length, 4) - 1 ? "pb-6 border-b border-[var(--color-border-subtle)]" : ""}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        {review.clientId.avatar ? (
                          <img
                            src={getImageUrl(review.clientId.avatar)}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[var(--color-bg-muted)] flex items-center justify-center">
                            <span className="text-lg font-semibold text-[var(--color-text-secondary)]">
                              {review.isAnonymous
                                ? "?"
                                : review.clientId.name.charAt(0)}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="font-semibold text-[var(--color-text-primary)]">
                                {review.isAnonymous
                                  ? locale === "ka"
                                    ? "ანონიმური"
                                    : "Anonymous"
                                  : review.clientId.name}
                              </p>
                              <p className="text-xs text-[var(--color-text-muted)]">
                                {formatTimeAgo(review.createdAt)}
                              </p>
                            </div>
                            {/* Stars */}
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-[var(--color-border)]"}`}
                                />
                              ))}
                            </div>
                          </div>

                          {review.text && (
                            <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
                              {review.text}
                            </p>
                          )}

                          {/* Review photos */}
                          {review.photos && review.photos.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {review.photos.slice(0, 3).map((photo, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="w-20 h-20 rounded-xl overflow-hidden"
                                >
                                  <img
                                    src={getImageUrl(photo)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {review.photos.length > 3 && (
                                <div className="w-20 h-20 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center text-sm font-semibold text-[var(--color-text-tertiary)]">
                                  +{review.photos.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View All Reviews */}
                {profile.totalReviews > 4 && (
                  <button className="w-full mt-6 py-4 rounded-xl font-semibold text-sm border-2 border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border)] transition-all">
                    {locale === "ka"
                      ? `ყველა ${profile.totalReviews} შეფასების ნახვა`
                      : `Read all ${profile.totalReviews} reviews`}
                  </button>
                )}
              </section>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:w-[340px] flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Quick Contact Card */}
              <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
                {/* CTA Button */}
                <button
                  onClick={handleContact}
                  className="w-full py-4 rounded-xl text-white font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  style={{ backgroundColor: ACCENT }}
                >
                  <MessageSquare className="w-4 h-4" />
                  {locale === "ka" ? "შეტყობინება" : "Contact Us"}
                </button>

                {/* Contact Info */}
                <div className="mt-6 space-y-3">
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-muted)] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {locale === "ka" ? "ტელეფონი" : "Phone"}
                        </p>
                        <p className="font-semibold text-[var(--color-text-primary)]">
                          {profile.phone}
                        </p>
                      </div>
                    </a>
                  )}

                  {profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-muted)] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {locale === "ka" ? "ელფოსტა" : "Email"}
                        </p>
                        <p className="font-semibold text-[var(--color-text-primary)] truncate">
                          {profile.email}
                        </p>
                      </div>
                    </a>
                  )}

                  {profile.website && (
                    <a
                      href={
                        profile.website.startsWith("http")
                          ? profile.website
                          : `https://${profile.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-muted)] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {locale === "ka" ? "ვებსაიტი" : "Website"}
                        </p>
                        <p className="font-semibold text-[var(--color-text-primary)] truncate">
                          {profile.website}
                        </p>
                      </div>
                    </a>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{locale === "ka" ? "პასუხი" : "Response"}</span>
                    </div>
                    <p className="font-bold text-[var(--color-text-primary)]">
                      &lt;1 {locale === "ka" ? "სთ" : "hour"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{locale === "ka" ? "წევრობა" : "Member"}</span>
                    </div>
                    <p className="font-bold text-[var(--color-text-primary)]">
                      {profile.createdAt
                        ? new Date(profile.createdAt).getFullYear()
                        : new Date().getFullYear()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4">
                  {locale === "ka" ? "სანდოობა" : "Trust & Safety"}
                </h3>

                <div className="space-y-3">
                  {/* Verified Company */}
                  {profile.isVerified && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <BadgeCheck className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {locale === "ka"
                            ? "ვერიფიცირებული კომპანია"
                            : "Verified Company"}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {locale === "ka"
                            ? "კომპანია შემოწმებულია"
                            : "Company verified by Homico"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Premium */}
                  {profile.isPremium && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Star className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {locale === "ka"
                            ? "პრემიუმ კომპანია"
                            : "Premium Company"}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {locale === "ka"
                            ? "სანდო და გამოცდილი"
                            : "Trusted & experienced"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Top Rated */}
                  {profile.avgRating >= 4.5 && profile.totalReviews >= 5 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {locale === "ka" ? "ტოპ რეიტინგი" : "Top Rated"}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {locale === "ka"
                            ? `${profile.avgRating.toFixed(1)} ★ (${profile.totalReviews} შეფასება)`
                            : `${profile.avgRating.toFixed(1)} ★ from ${profile.totalReviews} reviews`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Completed Projects Badge */}
                  {profile.completedProjects &&
                    profile.completedProjects >= 10 && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-500/5 border border-teal-500/10">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-teal-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {locale === "ka"
                              ? "გამოცდილი კომპანია"
                              : "Experienced Company"}
                          </p>
                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            {locale === "ka"
                              ? `${profile.completedProjects}+ დასრულებული პროექტი`
                              : `${profile.completedProjects}+ completed projects`}
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Service Areas */}
              {profile.serviceAreas.length > 0 && (
                <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
                  {/* Map Illustration */}
                  <div
                    className="aspect-[16/10] relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT}10 0%, ${ACCENT}05 100%)`,
                    }}
                  >
                    {/* Decorative Map Lines */}
                    <svg
                      className="absolute inset-0 w-full h-full opacity-30"
                      viewBox="0 0 200 125"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0,60 Q50,40 100,60 T200,60"
                        fill="none"
                        stroke={ACCENT}
                        strokeWidth="0.5"
                        opacity="0.5"
                      />
                      <path
                        d="M0,70 Q50,50 100,70 T200,70"
                        fill="none"
                        stroke={ACCENT}
                        strokeWidth="0.5"
                        opacity="0.3"
                      />
                      <circle
                        cx="100"
                        cy="60"
                        r="20"
                        fill={ACCENT}
                        opacity="0.1"
                      />
                      <circle
                        cx="100"
                        cy="60"
                        r="10"
                        fill={ACCENT}
                        opacity="0.15"
                      />
                    </svg>

                    {/* Location Pin */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div
                          className="w-14 h-14 mx-auto mb-2 rounded-2xl shadow-xl flex items-center justify-center"
                          style={{ backgroundColor: ACCENT }}
                        >
                          <MapPin className="w-7 h-7 text-white" />
                        </div>
                        <p
                          className="text-sm font-bold"
                          style={{ color: ACCENT }}
                        >
                          {translateCity(
                            profile.city || profile.serviceAreas[0]
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Areas List */}
                  {profile.serviceAreas.length > 1 && (
                    <div className="p-4 border-t border-[var(--color-border-subtle)]">
                      <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                        {locale === "ka"
                          ? "მომსახურების ზონები"
                          : "Service Areas"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {profile.serviceAreas.slice(0, 5).map((area, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                          >
                            {translateCity(area)}
                          </span>
                        ))}
                        {profile.serviceAreas.length > 5 && (
                          <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                            +{profile.serviceAreas.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      <MediaLightbox
        items={portfolioImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onIndexChange={setLightboxIndex}
        getImageUrl={getImageUrl}
        locale={locale as "en" | "ka"}
        showThumbnails={false}
      />

      {/* Contact Modal */}
      {showContactModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowContactModal(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-lg bg-[var(--color-bg-elevated)] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden w-12 h-1.5 bg-[var(--color-border)] rounded-full mx-auto mt-3" />

            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                  {locale === "ka" ? "შეტყობინება" : "Send Message"}
                </h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="w-10 h-10 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center hover:bg-[var(--color-bg-muted)] transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>
              </div>

              {/* Company Info */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-bg-tertiary)] mb-6">
                {logoUrl ? (
                  <img
                    src={getImageUrl(logoUrl)}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_HOVER} 100%)`,
                    }}
                  >
                    {profile.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-[var(--color-text-primary)]">
                    {profile.name}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {getCompanyTypeLabel()}
                  </p>
                </div>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  locale === "ka"
                    ? "გამარჯობა! მაინტერესებს თქვენი მომსახურება..."
                    : "Hello! I'm interested in your services..."
                }
                className="w-full px-4 py-4 text-[15px] rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:border-[var(--color-border-hover)] transition-colors"
                rows={4}
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 py-4 rounded-xl text-sm font-semibold border-2 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  {locale === "ka" ? "გაუქმება" : "Cancel"}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !message.trim()}
                  className="flex-1 py-4 text-sm font-bold rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:hover:translate-y-0"
                  style={{ backgroundColor: ACCENT }}
                >
                  {isSending
                    ? locale === "ka"
                      ? "იგზავნება..."
                      : "Sending..."
                    : locale === "ka"
                      ? "გაგზავნა"
                      : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
