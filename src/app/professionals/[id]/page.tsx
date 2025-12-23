'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import AppBackground from '@/components/common/AppBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useAnalytics, AnalyticsEvent } from '@/hooks/useAnalytics';
import {
  Briefcase, CheckCircle, Clock, MapPin, MessageSquare, Shield, Star, Trophy,
  ChevronLeft, ChevronRight, X, ExternalLink, Phone, Calendar, Award, Sparkles
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

// Helper function to get proper image URL
const getImageUrl = (path: string | undefined): string => {
  if (!path) return '';
  if (path.startsWith('data:')) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  if (path.startsWith('/')) return `${apiUrl}${path}`;
  return `${apiUrl}/uploads/${path}`;
};

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
  projectType: 'quick' | 'project' | 'job';
  status: 'completed' | 'in_progress';
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
  avatar?: string;
  city?: string;
  whatsapp?: string;
  telegram?: string;
  title: string;
  companyName?: string;
  description: string;
  categories: string[];
  subcategories?: string[];
  yearsExperience: number;
  serviceAreas: string[];
  pricingModel: 'hourly' | 'project_based' | 'from' | 'sqm' | 'daily';
  basePrice: number;
  maxPrice?: number;
  currency: string;
  avgRating: number;
  totalReviews: number;
  completedJobs?: number;
  externalCompletedJobs?: number;
  isAvailable: boolean;
  status?: 'active' | 'busy' | 'away';
  coverImage?: string;
  certifications: string[];
  languages: string[];
  tagline?: string;
  responseTime?: string;
  createdAt?: string;
  isPremium?: boolean;
  premiumTier?: 'none' | 'basic' | 'pro' | 'elite';
  portfolioProjects?: PortfolioProject[];
  isVerified?: boolean;
  isInsured?: boolean;
  insuranceAmount?: number;
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
  const { t, locale } = useLanguage();
  const toast = useToast();
  const { trackEvent } = useAnalytics();
  const { categories: CATEGORIES } = useCategories();

  const [profile, setProfile] = useState<ProProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/pros/${params.id}`);
        if (!response.ok) throw new Error('Profile not found');
        const data = await response.json();
        setProfile(data);
        trackEvent(AnalyticsEvent.PROFILE_VIEW, {
          proId: data._id || data.id,
          proName: data.name,
          category: data.categories?.[0],
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
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
    return () => { document.title = 'Homico'; };
  }, [profile?.name]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!profile?._id) return;
      setPortfolioLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/portfolio/pro/${profile._id}`);
        if (response.ok) {
          const data = await response.json();
          setPortfolio(data);
        }
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
      } finally {
        setPortfolioLoading(false);
      }
    };
    if (profile?._id) fetchPortfolio();
  }, [profile?._id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!profile?._id) return;
      setReviewsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/pro/${profile._id}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
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
    router.push(`/messages?recipient=${profile?._id}`);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    setIsSending(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          proId: profile?._id,
          message: message
        })
      });

      if (response.ok) {
        setShowContactModal(false);
        setMessage('');
        toast.success(locale === 'ka' ? 'შეტყობინება გაგზავნილია!' : 'Message sent!');
        trackEvent(AnalyticsEvent.CONVERSATION_START, {
          proId: profile?._id,
          proName: profile?.name,
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      toast.error(locale === 'ka' ? 'შეცდომა' : 'Error');
    } finally {
      setIsSending(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    if (!category) return '';
    const translated = t(`categories.${category}`);
    if (translated === `categories.${category}`) {
      return category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return translated;
  };

  const getSubcategoryLabel = (subcategoryKey: string) => {
    if (!subcategoryKey) return '';
    if (subcategoryKey.startsWith('custom:')) {
      return subcategoryKey.replace('custom:', '');
    }
    for (const category of CATEGORIES) {
      const subcategory = category.subcategories.find(sub => sub.key === subcategoryKey);
      if (subcategory) {
        return locale === 'ka' ? subcategory.nameKa : subcategory.name;
      }
    }
    return subcategoryKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (locale === 'ka') {
      if (diffDays < 7) return `${diffDays} დღის წინ`;
      if (diffWeeks < 4) return `${diffWeeks} კვირის წინ`;
      return `${diffMonths} თვის წინ`;
    }
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  };

  // Get all portfolio images with metadata
  const getAllPortfolioImages = useCallback(() => {
    const images: { url: string; title?: string; description?: string }[] = [];

    portfolio.forEach(item => {
      if (item.imageUrl) {
        images.push({ url: item.imageUrl, title: item.title, description: item.description });
      }
      if (item.images) {
        item.images.filter(img => img !== item.imageUrl).forEach(img => {
          images.push({ url: img, title: item.title });
        });
      }
    });

    profile?.portfolioProjects?.forEach(project => {
      if (project.images) {
        project.images.forEach((img, idx) => {
          images.push({
            url: img,
            title: project.title,
            description: idx === 0 ? project.description : undefined
          });
        });
      }
    });

    return images;
  }, [portfolio, profile?.portfolioProjects]);

  // Group subcategories by parent category
  const getGroupedServices = useCallback(() => {
    const groups: Record<string, string[]> = {};

    profile?.categories.forEach(cat => {
      groups[cat] = [];
    });

    profile?.subcategories?.forEach(sub => {
      for (const category of CATEGORIES) {
        const found = category.subcategories.find(s => s.key === sub);
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
      case 'hourly': return locale === 'ka' ? '/სთ' : '/hr';
      case 'daily': return locale === 'ka' ? '/დღე' : '/day';
      case 'sqm': return '/m²';
      default: return '';
    }
  };

  const totalCompletedJobs = (profile?.completedJobs || 0) + (profile?.externalCompletedJobs || 0);

  // Lightbox navigation
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const nextImage = () => {
    const images = getAllPortfolioImages();
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = getAllPortfolioImages();
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <Header />
        <HeaderSpacer />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-[#E07B4F]/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#E07B4F] animate-spin" />
            </div>
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
        <div className="py-16 text-center">
          <div className="max-w-md mx-auto px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              {locale === 'ka' ? 'პროფილი ვერ მოიძებნა' : 'Profile not found'}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {locale === 'ka' ? 'სამწუხაროდ, ეს გვერდი არ არსებობს' : 'Sorry, this page doesn\'t exist'}
            </p>
            <button
              onClick={() => router.push('/browse')}
              className="px-6 py-3 text-sm font-semibold rounded-xl text-white bg-[#E07B4F] hover:bg-[#D26B3F] transition-colors"
            >
              {locale === 'ka' ? 'პროფესიონალების ნახვა' : 'Browse Professionals'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = profile.avatar;
  const portfolioImages = getAllPortfolioImages();
  const groupedServices = getGroupedServices();

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <AppBackground />
      <Header />
      <HeaderSpacer />

      {/* Main Content */}
      <main className={`relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-6">

            {/* Hero Card with Teal Cover */}
            <div
              className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm"
              style={{ animationDelay: '0.1s' }}
            >
              {/* Teal Cover Background */}
              <div className="h-36 sm:h-44 relative bg-gradient-to-br from-[#4A9B9B] via-[#3D8A8A] to-[#2D7A7A] overflow-hidden">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Floating shapes */}
                <div className="absolute top-4 right-8 w-24 h-24 rounded-full bg-white/5 blur-xl" />
                <div className="absolute bottom-8 left-12 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

                {profile.coverImage && (
                  <img
                    src={getImageUrl(profile.coverImage)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
                  />
                )}

                {/* Premium badge */}
                {profile.isPremium && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    PRO
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="px-5 sm:px-6 pb-6 -mt-14 sm:-mt-16 relative">
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                  {avatarUrl ? (
                    <img
                      src={getImageUrl(avatarUrl)}
                      alt={profile.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-[var(--color-bg-elevated)] shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-[var(--color-bg-elevated)] shadow-xl flex items-center justify-center text-white text-3xl font-bold bg-gradient-to-br from-[#4A9B9B] to-[#3D8585]">
                      {profile.name.charAt(0)}
                    </div>
                  )}

                  {/* Online indicator */}
                  {profile.isAvailable && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-3 border-[var(--color-bg-elevated)] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>

                {/* Name & Title */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-1 tracking-tight">
                      {profile.name}
                    </h1>
                    <p className="text-lg font-medium text-[#E07B4F] mb-3">
                      {profile.title}
                    </p>

                    {/* Location & Rating Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      {profile.serviceAreas.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                          <MapPin className="w-4 h-4 text-[var(--color-text-muted)]" />
                          <span>{profile.serviceAreas[0]}, Georgia</span>
                        </div>
                      )}

                      {profile.avgRating > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-[var(--color-text-primary)]">{profile.avgRating.toFixed(1)}</span>
                          <span className="text-[var(--color-text-muted)]">
                            ({profile.totalReviews} {locale === 'ka' ? 'შეფასება' : 'reviews'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            {profile.description && (
              <div
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-5 sm:p-6 shadow-sm"
                style={{ animationDelay: '0.2s' }}
              >
                <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E07B4F]/10 flex items-center justify-center">
                    <Award className="w-4 h-4 text-[#E07B4F]" />
                  </div>
                  {locale === 'ka' ? `${profile.name.split(' ')[0]}-ს შესახებ` : `About ${profile.name.split(' ')[0]}`}
                </h2>
                <div className="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {profile.description}
                </div>
              </div>
            )}

            {/* Services Offered Section */}
            {profile.subcategories && profile.subcategories.length > 0 && (
              <div
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-5 sm:p-6 shadow-sm"
                style={{ animationDelay: '0.3s' }}
              >
                <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#4A9B9B]/10 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-[#4A9B9B]" />
                  </div>
                  {locale === 'ka' ? 'შეთავაზებული სერვისები' : 'Services Offered'}
                </h2>

                <div className="space-y-5">
                  {Object.entries(groupedServices).map(([categoryKey, subcats]) => {
                    if (subcats.length === 0) return null;
                    return (
                      <div key={categoryKey}>
                        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                          {getCategoryLabel(categoryKey)}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {subcats.map((sub, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] hover:border-[#E07B4F]/30 hover:bg-[#E07B4F]/5 transition-colors cursor-default"
                            >
                              {getSubcategoryLabel(sub)}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Portfolio Gallery Section */}
            {portfolioImages.length > 0 && (
              <div
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-5 sm:p-6 shadow-sm"
                style={{ animationDelay: '0.4s' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {locale === 'ka' ? 'ბოლო პროექტები' : 'Recent Projects'}
                  </h2>
                  {portfolioImages.length > 6 && (
                    <button className="text-sm font-medium text-[#E07B4F] hover:text-[#D26B3F] transition-colors flex items-center gap-1">
                      {locale === 'ka' ? 'ყველას ნახვა' : 'View All'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Masonry-style grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {portfolioImages.slice(0, 6).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => openLightbox(idx)}
                      className={`relative rounded-xl overflow-hidden bg-[var(--color-bg-tertiary)] group cursor-pointer ${
                        idx === 0 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-square'
                      }`}
                    >
                      <img
                        src={getImageUrl(img.url)}
                        alt={img.title || ''}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Title on hover */}
                      {img.title && idx === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-white font-medium text-sm truncate">{img.title}</p>
                        </div>
                      )}

                      {/* View icon */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      {/* More indicator */}
                      {idx === 5 && portfolioImages.length > 6 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-lg font-bold">+{portfolioImages.length - 6}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Client Reviews Section */}
            {reviews.length > 0 && (
              <div
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-5 sm:p-6 shadow-sm"
                style={{ animationDelay: '0.5s' }}
              >
                <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Star className="w-4 h-4 text-emerald-500" />
                  </div>
                  {locale === 'ka' ? 'კლიენტების შეფასებები' : 'Client Reviews'}
                </h2>

                <div className="space-y-5">
                  {reviews.slice(0, 3).map((review, idx) => (
                    <div
                      key={review._id}
                      className={`pb-5 ${idx < Math.min(reviews.length, 3) - 1 ? 'border-b border-[var(--color-border-subtle)]' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        {review.clientId.avatar ? (
                          <img
                            src={getImageUrl(review.clientId.avatar)}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[var(--color-bg-muted)] flex items-center justify-center">
                            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                              {review.isAnonymous ? '?' : review.clientId.name.charAt(0)}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div>
                              <p className="font-semibold text-[var(--color-text-primary)] text-sm">
                                {review.isAnonymous ? (locale === 'ka' ? 'ანონიმური' : 'Anonymous') : review.clientId.name}
                              </p>
                              <p className="text-xs text-[var(--color-text-muted)]">{formatTimeAgo(review.createdAt)}</p>
                            </div>
                            {/* Stars */}
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-[var(--color-border)]'}`}
                                />
                              ))}
                            </div>
                          </div>

                          {review.text && (
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mt-2">
                              {review.text}
                            </p>
                          )}

                          {/* Review photos */}
                          {review.photos && review.photos.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {review.photos.slice(0, 3).map((photo, pIdx) => (
                                <div key={pIdx} className="w-16 h-16 rounded-lg overflow-hidden">
                                  <img src={getImageUrl(photo)} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Read All Reviews Link */}
                {profile.totalReviews > 3 && (
                  <button className="w-full mt-5 text-center text-sm font-semibold py-3 rounded-xl text-[#E07B4F] hover:bg-[#E07B4F]/5 transition-colors border border-[var(--color-border-subtle)]">
                    {locale === 'ka' ? `ყველა ${profile.totalReviews} შეფასების ნახვა` : `Read all ${profile.totalReviews} reviews`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-5">

              {/* Pricing & CTA Card */}
              <div
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-5 shadow-sm"
                style={{ animationDelay: '0.15s' }}
              >
                {/* Starting Rate */}
                {profile.basePrice > 0 && (
                  <div className="flex items-baseline justify-between mb-5">
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {locale === 'ka' ? 'საწყისი ფასი' : 'Starting Rate'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[var(--color-text-primary)]">{profile.basePrice}</span>
                      <span className="text-xl text-[var(--color-text-secondary)]">₾</span>
                      <span className="text-sm text-[var(--color-text-muted)]">{getPricingLabel()}</span>
                    </div>
                  </div>
                )}

                {/* Request Quote Button */}
                <button
                  onClick={handleContact}
                  className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all bg-[#E07B4F] hover:bg-[#D26B3F] shadow-lg shadow-[#E07B4F]/20 hover:shadow-xl hover:shadow-[#E07B4F]/25 mb-3"
                >
                  {locale === 'ka' ? 'ფასის მოთხოვნა' : 'Request Quote'}
                </button>

                {/* Message Button */}
                <button
                  onClick={handleContact}
                  className="w-full py-3 rounded-xl font-medium text-sm border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  {locale === 'ka' ? 'შეტყობინება' : 'Message'}
                </button>

                {/* Divider */}
                <div className="border-t border-[var(--color-border-subtle)] my-5" />

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="p-3 rounded-xl bg-[var(--color-bg-tertiary)]">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{locale === 'ka' ? 'პასუხი' : 'Response'}</span>
                    </div>
                    <p className="font-bold text-[var(--color-text-primary)]">&lt; 1 {locale === 'ka' ? 'სთ' : 'hr'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--color-bg-tertiary)]">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{locale === 'ka' ? 'გამოცდილება' : 'Experience'}</span>
                    </div>
                    <p className="font-bold text-[var(--color-text-primary)]">{profile.yearsExperience}+ {locale === 'ka' ? 'წელი' : 'Years'}</p>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="space-y-3">
                  {/* Identity Verified */}
                  {profile.isVerified !== false && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                      <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4.5 h-4.5 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                          {locale === 'ka' ? 'პირადობა დადასტურებული' : 'Identity Verified'}
                        </p>
                        <p className="text-xs text-rose-600/70 dark:text-rose-400/70">
                          {locale === 'ka' ? 'სახელმწიფო ID შემოწმებული' : 'Government ID checked'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Insured */}
                  {profile.isInsured !== false && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4.5 h-4.5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                          {locale === 'ka' ? 'დაზღვეული' : 'Insured'}
                        </p>
                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                          {locale === 'ka' ? '10,000₾-მდე დაფარვა' : 'Covered up to 10k ₾'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Top Rated */}
                  {profile.avgRating >= 4.5 && profile.totalReviews >= 5 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-4.5 h-4.5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                          {locale === 'ka' ? 'ტოპ რეიტინგი' : 'Top Rated Pro'}
                        </p>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                          {locale === 'ka' ? 'თბილისის ტოპ 5%-ში' : 'Top 5% in Tbilisi'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Map Card */}
              <div
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm"
                style={{ animationDelay: '0.25s' }}
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-[#E8F4F4] to-[#D4EBEB] dark:from-[#1a2f2f] dark:to-[#152525] relative">
                  {/* Stylized map background */}
                  <div className="absolute inset-0 opacity-30">
                    <svg className="w-full h-full" viewBox="0 0 200 150" preserveAspectRatio="none">
                      <path d="M0,75 Q50,50 100,75 T200,75" fill="none" stroke="#4A9B9B" strokeWidth="0.5" opacity="0.5"/>
                      <path d="M0,85 Q50,60 100,85 T200,85" fill="none" stroke="#4A9B9B" strokeWidth="0.5" opacity="0.3"/>
                      <path d="M0,95 Q50,70 100,95 T200,95" fill="none" stroke="#4A9B9B" strokeWidth="0.5" opacity="0.2"/>
                      <circle cx="100" cy="75" r="15" fill="#4A9B9B" opacity="0.1"/>
                      <circle cx="100" cy="75" r="8" fill="#4A9B9B" opacity="0.2"/>
                    </svg>
                  </div>

                  {/* Location pin */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#E07B4F] shadow-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-[#3D8585] dark:text-[#6BB5B5]">
                        {profile.serviceAreas[0] || 'Tbilisi'}, Georgia
                      </p>
                    </div>
                  </div>
                </div>

                {/* Service areas list */}
                {profile.serviceAreas.length > 1 && (
                  <div className="p-4 border-t border-[var(--color-border-subtle)]">
                    <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                      {locale === 'ka' ? 'მომსახურების ზონები' : 'Service Areas'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.serviceAreas.slice(0, 4).map((area, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs rounded-md bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                          {area}
                        </span>
                      ))}
                      {profile.serviceAreas.length > 4 && (
                        <span className="px-2 py-1 text-xs rounded-md bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                          +{profile.serviceAreas.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxOpen && portfolioImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Navigation arrows */}
          {portfolioImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* Image container */}
          <div
            className="max-w-5xl max-h-[85vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(portfolioImages[lightboxIndex].url)}
              alt={portfolioImages[lightboxIndex].title || ''}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />

            {/* Caption */}
            {(portfolioImages[lightboxIndex].title || portfolioImages[lightboxIndex].description) && (
              <div className="mt-4 text-center">
                {portfolioImages[lightboxIndex].title && (
                  <h3 className="text-white font-semibold text-lg">{portfolioImages[lightboxIndex].title}</h3>
                )}
                {portfolioImages[lightboxIndex].description && (
                  <p className="text-white/70 text-sm mt-1">{portfolioImages[lightboxIndex].description}</p>
                )}
              </div>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm">
              {lightboxIndex + 1} / {portfolioImages.length}
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowContactModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-md bg-[var(--color-bg-elevated)] rounded-t-2xl sm:rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden w-10 h-1 bg-[var(--color-border)] rounded-full mx-auto mt-3" />

            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  {locale === 'ka' ? 'შეტყობინება' : 'Send Message'}
                </h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center hover:bg-[var(--color-bg-muted)] transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
                </button>
              </div>

              {/* Pro Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-tertiary)] mb-4">
                {avatarUrl ? (
                  <img src={getImageUrl(avatarUrl)} alt="" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold bg-gradient-to-br from-[#4A9B9B] to-[#3D8585]">
                    {profile.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">{profile.name}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{profile.title}</p>
                </div>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={locale === 'ka' ? 'გამარჯობა! მაინტერესებს თქვენი მომსახურება...' : 'Hello! I\'m interested in your services...'}
                className="w-full px-4 py-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[#E07B4F]/30 focus:border-[#E07B4F]/50 transition-all"
                rows={4}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !message.trim()}
                  className="flex-1 py-3 text-sm font-semibold rounded-xl text-white bg-[#E07B4F] hover:bg-[#D26B3F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSending ? (locale === 'ka' ? 'იგზავნება...' : 'Sending...') : (locale === 'ka' ? 'გაგზავნა' : 'Send')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
