"use client";

import AppBackground from "@/components/common/AppBackground";
import Header, { HeaderSpacer } from "@/components/common/Header";
import MediaLightbox, { MediaItem } from "@/components/common/MediaLightbox";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MultiStarDisplay } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COMPANY_ACCENT as ACCENT, COMPANY_ACCENT_HOVER as ACCENT_HOVER } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { storage } from "@/services/storage";
import type { BaseEntity } from "@/types/shared";
import { formatTimeAgo } from "@/utils/dateUtils";
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
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface TeamMember extends BaseEntity {
  name: string;
  avatar?: string;
  title?: string;
  role: "owner" | "manager" | "employee";
}

interface PortfolioProject extends BaseEntity {
  title: string;
  description?: string;
  images: string[];
  category?: string;
  completedDate?: string;
}

interface CompanyProfile {
  id: string;
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

interface PageReview extends BaseEntity {
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
  const { t, locale } = useLanguage();
  const toast = useToast();
  const { categories: CATEGORIES } = useCategories();

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [reviews, setReviews] = useState<PageReview[]>([]);
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
      } catch (err) {
        const error = err as { message?: string };
        setError(error.message || "Failed to load company");
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
      if (!profile?.id) return;
      setReviewsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reviews/company/${profile.id}`
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
    if (profile?.id) fetchReviews();
  }, [profile?.id]);

  const handleContact = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    router.push(`/messages?company=${profile?.id}`);
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
            companyId: profile?.id,
            message: message,
          }),
        }
      );

      if (response.ok) {
        setShowContactModal(false);
        setMessage("");
        toast.success(
          t('common.messageSent')
        );
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setIsSending(false);
    }
  };

  const getCategoryLabel = (categoryKey: string) => {
    if (!categoryKey) return "";
    const category = CATEGORIES.find((cat) => cat.key === categoryKey);
    if (category) {
      return ({ ka: category.nameKa, en: category.name, ru: category.name }[locale] ?? category.name);
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
        return ({ ka: subcategory.nameKa, en: subcategory.name, ru: subcategory.name }[locale] ?? subcategory.name);
      }
      for (const sub of category.subcategories) {
        if (sub.children) {
          const subSub = sub.children.find(
            (child) => child.key === subcategoryKey
          );
          if (subSub) {
            return ({ ka: subSub.nameKa, en: subSub.name, ru: subSub.name }[locale] ?? subSub.name);
          }
        }
      }
    }
    return subcategoryKey
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const cityTranslations: Record<string, { ka: string; en?: string; ru?: string }> = {
    tbilisi: { ka: "თბილისი" },
    rustavi: { ka: "რუსთავი" },
    batumi: { ka: "ბათუმი" },
    kutaisi: { ka: "ქუთაისი" },
    gori: { ka: "გორი" },
    zugdidi: { ka: "ზუგდიდი" },
    nationwide: { ka: "საქართველოს მასშტაბით" },
  };

  const translateCity = (city: string) => {
    const lowerCity = city.toLowerCase().trim();
    const hit = cityTranslations[lowerCity];
    if (hit) return hit[locale] ?? hit.en ?? hit.ru ?? city;
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
            <LoadingSpinner size="xl" color={ACCENT} />
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {t('common.loading')}
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
              {t('companies.companyNotFound')}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-8">
              {t('companies.sorryThisCompanyDoesntExist')}
            </p>
            <Button
              onClick={() => router.push("/browse")}
              size="lg"
            >
              {t('companies.browseCompanies')}
            </Button>
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
        return t('companies.constructionCompany');
      case "service_agency":
        return t('companies.serviceAgency');
      case "both":
        return t('companies.constructionService');
      default:
        return t('common.company');
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
            <Image
              src={storage.getFileUrl(profile.coverImage)}
              alt="Company cover"
              fill
              className="object-cover"
              sizes="100vw"
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
                      <Image
                        src={storage.getFileUrl(logoUrl)}
                        alt={profile.name}
                        width={144}
                        height={144}
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
                        <Badge variant="info" size="sm" icon={<BadgeCheck className="w-3.5 h-3.5" />}>
                          {t('common.verified')}
                        </Badge>
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
                            {t('common.reviews')})
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
                            {t('companies.employees')}
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
                              {t('common.projects')}
                            </span>
                          </div>
                        )}

                      {/* Founded Year */}
                      {profile.foundedYear && (
                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                          <Calendar className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                          <span>
                            {t("companies.foundedYear", { year: profile.foundedYear })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex sm:hidden items-center gap-3 mt-6 pt-6 border-t border-[var(--color-border-subtle)]">
                  <Button
                    onClick={handleContact}
                    className="flex-1"
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                  >
                    {t('common.message')}
                  </Button>
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
                    {t('companies.aboutCompany')}
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
                    {t('common.customSkills')}
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
                    {t('companies.ourTeam')}
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {profile.teamMembers.slice(0, 8).map((member) => (
                    <div
                      key={member.id}
                      className="p-4 rounded-xl bg-[var(--color-bg-tertiary)] text-center"
                    >
                      {member.avatar ? (
                        <Image
                          src={storage.getFileUrl(member.avatar)}
                          alt={member.name}
                          width={64}
                          height={64}
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
                  <Button
                    variant="secondary"
                    className="w-full mt-4"
                  >
                    {t("companies.viewAllTeam", { count: profile.teamMembers.length })}
                  </Button>
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
                      {t('companies.portfolio')}
                    </h2>
                  </div>
                  {portfolioImages.length > 6 && (
                    <button
                      className="text-sm font-semibold flex items-center gap-1 transition-colors hover:gap-2"
                      style={{ color: ACCENT }}
                    >
                      {t('common.viewAll')}
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
                      <Image
                        src={storage.getFileUrl(img.url)}
                        alt={img.title || "Portfolio image"}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 50vw, 300px"
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
                        {t('common.reviews')}
                      </h2>
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        {t("companies.reviewsCount", { count: profile.totalReviews })}
                      </p>
                    </div>
                  </div>

                  {/* Rating Summary */}
                  {profile.avgRating > 0 && (
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--color-bg-tertiary)]">
                      <MultiStarDisplay rating={profile.avgRating} size="md" />
                      <span className="font-bold text-[var(--color-text-primary)]">
                        {profile.avgRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {reviews.slice(0, 4).map((review, idx) => (
                    <div
                      key={review.id}
                      className={`${idx < Math.min(reviews.length, 4) - 1 ? "pb-6 border-b border-[var(--color-border-subtle)]" : ""}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        {review.clientId.avatar ? (
                          <Image
                            src={storage.getFileUrl(review.clientId.avatar)}
                            alt="Client"
                            width={48}
                            height={48}
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
                                  ? t('common.anonymous')
                                  : review.clientId.name}
                              </p>
                              <p className="text-xs text-[var(--color-text-muted)]">
                                {formatTimeAgo(review.createdAt, t)}
                              </p>
                            </div>
                            {/* Stars */}
                            <MultiStarDisplay rating={review.rating} size="md" />
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
                                  <Image
                                    src={storage.getFileUrl(photo)}
                                    alt="Review photo"
                                    fill
                                    className="object-cover"
                                    sizes="80px"
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
                  <Button
                    variant="outline"
                    className="w-full mt-6"
                  >
                    {t("companies.readAllReviews", { count: profile.totalReviews })}
                  </Button>
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
                <Button
                  onClick={handleContact}
                  className="w-full"
                  size="lg"
                  leftIcon={<MessageSquare className="w-4 h-4" />}
                >
                  {t('companies.contactUs')}
                </Button>

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
                          {t('common.phone')}
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
                          {t('common.email')}
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
                          {t('common.website')}
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
                      <span>{t('companies.response')}</span>
                    </div>
                    <p className="font-bold text-[var(--color-text-primary)]">
                      &lt;1 {t('companies.hour')}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t('common.member')}</span>
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
                  {t('companies.trustSafety')}
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
                          {t('companies.verifiedCompany')}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {t('companies.companyVerifiedByHomico')}
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
                          {t('companies.premiumCompany')}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {t('companies.trustedExperienced')}
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
                          {t('common.topRated')}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {t("companies.topRatedSummary", {
                            rating: profile.avgRating.toFixed(1),
                            count: profile.totalReviews,
                          })}
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
                            {t('companies.experiencedCompany')}
                          </p>
                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            {t("companies.completedProjectsPlus", { count: profile.completedProjects })}
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
                        {t('companies.serviceAreas')}
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
        getImageUrl={storage.getFileUrl}
        locale={locale as "en" | "ka" | "ru"}
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
                  {t('common.sendMessage')}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowContactModal(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Company Info */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-bg-tertiary)] mb-6">
                {logoUrl ? (
                  <Image
                    src={storage.getFileUrl(logoUrl)}
                    alt={profile.name}
                    width={56}
                    height={56}
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
                  t('companies.helloImInterestedInYour')
                }
                className="w-full px-4 py-4 text-[15px] rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:border-[var(--color-border-hover)] transition-colors"
                rows={4}
              />

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowContactModal(false)}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !message.trim()}
                  loading={isSending}
                  className="flex-1"
                >
                  {isSending
                    ? (t('common.sending'))
                    : (t('common.send'))}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
