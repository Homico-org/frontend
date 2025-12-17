'use client';

import Header from '@/components/common/Header';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

// Navy professional color palette
const COLORS = {
  navy: '#1a2744',
  navyLight: '#2d3a52',
  navyDark: '#0f172a',
  accent: '#c4735b',
  accentLight: '#d4937b',
  gold: '#d4a574',
};

interface Company {
  name: string;
  logo?: string;
  role?: string;
}

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
  clientId?: string;
  clientName?: string;
  clientAvatar?: string;
  clientCity?: string;
  duration?: string;
  category?: string;
  rating?: number;
  review?: string;
  beforeImage?: string;
  afterImage?: string;
}

interface ProProfile {
  _id: string;
  userId: {
    _id: string;
    uid?: number;
    name: string;
    email: string;
    avatar?: string;
    city?: string;
    whatsapp?: string;
    telegram?: string;
  };
  title: string;
  companyName?: string;
  description: string;
  categories: string[];
  subcategories?: string[];
  yearsExperience: number;
  serviceAreas: string[];
  pricingModel: 'hourly' | 'project_based' | 'from';
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
  companies?: Company[];
  responseTime?: string;
  createdAt?: string;
  avatar?: string;
  isPremium?: boolean;
  premiumTier?: 'none' | 'basic' | 'pro' | 'elite';
  portfolioProjects?: PortfolioProject[];
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
  workImages?: string[];
}

// Service package interface for tiered pricing
interface ServicePackage {
  id: string;
  name: string;
  nameKa: string;
  description: string;
  descriptionKa: string;
  price: number;
  features: string[];
  featuresKa: string[];
  popular?: boolean;
}

export default function ProfessionalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const toast = useToast();

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
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Sticky header state
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Before/After slider state
  const [sliderPositions, setSliderPositions] = useState<Record<string, number>>({});

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const heroHeight = heroRef.current?.offsetHeight || 400;

      // Show sticky header after scrolling past hero
      if (currentScrollY > heroHeight) {
        // On mobile: hide on scroll down, show on scroll up
        if (window.innerWidth < 768) {
          if (currentScrollY > lastScrollY) {
            setShowStickyHeader(false);
          } else {
            setShowStickyHeader(true);
          }
        } else {
          setShowStickyHeader(true);
        }
      } else {
        setShowStickyHeader(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pro-profiles/${params.id}`);
        if (!response.ok) throw new Error('Profile not found');
        const data = await response.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchProfile();
  }, [params.id]);

  useEffect(() => {
    if (profile?.userId?.name) {
      document.title = `${profile.userId.name} | Homico`;
    }
    return () => { document.title = 'Homico'; };
  }, [profile?.userId?.name]);

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
    setShowContactModal(true);
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
          proId: profile?.userId._id,
          message: message
        })
      });

      if (response.ok) {
        setShowContactModal(false);
        setMessage('');
        toast.success(locale === 'ka' ? 'შეტყობინება გაგზავნილია!' : 'Message sent!');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      toast.error(locale === 'ka' ? 'შეცდომა' : 'Error');
    } finally {
      setIsSending(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.userId.name,
          text: profile?.title,
          url: window.location.href,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(locale === 'ka' ? 'ბმული დაკოპირებულია!' : 'Link copied!');
    }
  };

  const handleSave = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    setIsSaved(!isSaved);
    toast.success(isSaved
      ? (locale === 'ka' ? 'წაიშალა შენახულებიდან' : 'Removed from saved')
      : (locale === 'ka' ? 'შენახულია!' : 'Saved!')
    );
  };

  const getCategoryLabel = (category: string) => {
    const translated = t(`categories.${category}`);
    if (translated === `categories.${category}`) {
      return category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return translated;
  };

  const getSubcategoryLabel = (subcategoryKey: string) => {
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

  const openGallery = useCallback((images: string[], startIndex: number = 0) => {
    setGalleryImages(images);
    setGalleryIndex(startIndex);
    setIsGalleryOpen(true);
  }, []);

  const closeGallery = useCallback(() => {
    setIsGalleryOpen(false);
    setGalleryImages([]);
    setGalleryIndex(0);
  }, []);

  const navigateGallery = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setGalleryIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
    } else {
      setGalleryIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
    }
  }, [galleryImages.length]);

  useEffect(() => {
    if (!isGalleryOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowLeft') navigateGallery('prev');
      if (e.key === 'ArrowRight') navigateGallery('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, closeGallery, navigateGallery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (locale === 'ka') {
      const months = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getMemberSince = () => {
    if (profile?.createdAt) {
      return formatDate(profile.createdAt);
    }
    return '';
  };

  const getStatusLabel = () => {
    if (!profile) return '';
    if (profile.status === 'active' || profile.isAvailable) {
      return locale === 'ka' ? 'თავისუფალი' : 'Available';
    }
    if (profile.status === 'busy') {
      return locale === 'ka' ? 'დაკავებული' : 'Busy';
    }
    return locale === 'ka' ? 'არ არის' : 'Away';
  };

  const getStatusColor = () => {
    if (!profile) return 'bg-neutral-400';
    if (profile.status === 'active' || profile.isAvailable) return 'bg-emerald-500';
    if (profile.status === 'busy') return 'bg-amber-500';
    return 'bg-neutral-400';
  };

  // Calculate total completed jobs
  const totalCompletedJobs = (profile?.completedJobs || 0) + (profile?.externalCompletedJobs || 0);

  // Get all portfolio images for masonry
  const getAllPortfolioImages = () => {
    const images: { url: string; title: string; isBeforeAfter?: boolean; beforeImage?: string; afterImage?: string }[] = [];

    // From portfolio items
    portfolio.forEach(item => {
      if (item.beforeImage && item.afterImage) {
        images.push({
          url: item.afterImage,
          title: item.title,
          isBeforeAfter: true,
          beforeImage: item.beforeImage,
          afterImage: item.afterImage
        });
      } else if (item.imageUrl) {
        images.push({ url: item.imageUrl, title: item.title });
      }
      if (item.images) {
        item.images.forEach(img => {
          if (img !== item.imageUrl) {
            images.push({ url: img, title: item.title });
          }
        });
      }
    });

    // From embedded portfolio projects
    profile?.portfolioProjects?.forEach(project => {
      if (project.beforeAfterPairs && project.beforeAfterPairs.length > 0) {
        project.beforeAfterPairs.forEach(pair => {
          images.push({
            url: pair.afterImage,
            title: project.title,
            isBeforeAfter: true,
            beforeImage: pair.beforeImage,
            afterImage: pair.afterImage
          });
        });
      }
      project.images?.forEach(img => {
        images.push({ url: img, title: project.title });
      });
    });

    return images;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-neutral-200 dark:border-neutral-800" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#1a2744] dark:border-t-white animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Header />
        <div className="py-16 text-center">
          <div className="max-w-md mx-auto px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
              <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              {locale === 'ka' ? 'პროფილი ვერ მოიძებნა' : 'Profile not found'}
            </h2>
            <p className="text-neutral-500 mb-6">
              {locale === 'ka' ? 'სამწუხაროდ, ეს გვერდი არ არსებობს' : 'Sorry, this page doesn\'t exist'}
            </p>
            <button
              onClick={() => router.push('/browse')}
              className="px-6 py-3 text-sm font-semibold rounded-lg bg-[#1a2744] text-white hover:bg-[#2d3a52] transition-colors"
            >
              {locale === 'ka' ? 'პროფესიონალების ნახვა' : 'Browse Professionals'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = profile.avatar || profile.userId.avatar;
  const portfolioImages = getAllPortfolioImages();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header />

      {/* Sticky Header - Navy Professional Style */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{ backgroundColor: COLORS.navy }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Avatar + Info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profile.userId.name} className="w-10 h-10 rounded-full object-cover border-2 border-white/20" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white font-semibold">{profile.userId.name.charAt(0)}</span>
                  </div>
                )}
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[${COLORS.navy}] ${getStatusColor()}`} />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-white font-semibold text-sm leading-tight">{profile.userId.name}</h2>
                <p className="text-white/60 text-xs">{profile.title}</p>
              </div>
            </div>

            {/* Center: Key Stats */}
            <div className="hidden md:flex items-center gap-6">
              {profile.avgRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-white font-semibold text-sm">{profile.avgRating.toFixed(1)}</span>
                  <span className="text-white/50 text-xs">({profile.totalReviews})</span>
                </div>
              )}
              {profile.basePrice > 0 && (
                <div className="text-white/80 text-sm">
                  <span className="font-semibold">{profile.basePrice}₾</span>
                  <span className="text-white/50">/{profile.pricingModel === 'hourly' ? (locale === 'ka' ? 'სთ' : 'hr') : (locale === 'ka' ? 'პროექტი' : 'project')}</span>
                </div>
              )}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                profile.status === 'active' || profile.isAvailable
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : profile.status === 'busy'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-neutral-500/20 text-neutral-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor()}`} />
                {getStatusLabel()}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg
                  className={`w-5 h-5 ${isSaved ? 'text-amber-400' : 'text-white/70'}`}
                  fill={isSaved ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
              </button>
              <button
                onClick={handleContact}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{ backgroundColor: COLORS.accent, color: 'white' }}
              >
                {locale === 'ka' ? 'დაკავშირება' : 'Contact'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20">
        {/* Hero Section */}
        <div ref={heroRef} className="relative" style={{ backgroundColor: COLORS.navy }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">{locale === 'ka' ? 'უკან' : 'Back'}</span>
            </button>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Left: Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={profile.userId.name}
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white/10"
                      />
                    ) : (
                      <div
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center border-4 border-white/10"
                        style={{ backgroundColor: COLORS.navyLight }}
                      >
                        <span className="text-4xl font-bold text-white">{profile.userId.name.charAt(0)}</span>
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor()}`}>
                      {getStatusLabel()}
                    </div>
                    {/* Premium Badge */}
                    {profile.isPremium && (
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                        PRO
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                          {profile.userId.name}
                        </h1>
                        <p className="text-white/70 text-lg mb-3">{profile.title}</p>

                        {/* Category Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {profile.categories.slice(0, 3).map((cat, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-white/80"
                            >
                              {getCategoryLabel(cat)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/80">
                      {profile.avgRating > 0 && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-bold text-white">{profile.avgRating.toFixed(1)}</span>
                          <span className="text-white/50">({profile.totalReviews} {locale === 'ka' ? 'შეფასება' : 'reviews'})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{profile.yearsExperience} {locale === 'ka' ? 'წლის გამოცდილება' : 'years exp.'}</span>
                      </div>
                      {totalCompletedJobs > 0 && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{totalCompletedJobs} {locale === 'ka' ? 'დასრულებული' : 'completed'}</span>
                        </div>
                      )}
                      {profile.responseTime && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>{profile.responseTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Price & Actions */}
              <div className="lg:w-72 flex-shrink-0">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                  {/* Price */}
                  {profile.basePrice > 0 && (
                    <div className="text-center mb-5 pb-5 border-b border-white/10">
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                        {profile.pricingModel === 'from'
                          ? (locale === 'ka' ? 'დაწყებული' : 'Starting from')
                          : profile.pricingModel === 'hourly'
                            ? (locale === 'ka' ? 'საათობრივი განაკვეთი' : 'Hourly rate')
                            : (locale === 'ka' ? 'ფასი' : 'Price')}
                      </p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-white">{profile.basePrice}</span>
                        <span className="text-xl text-white/70">₾</span>
                        {profile.pricingModel === 'hourly' && (
                          <span className="text-white/50 text-sm">/{locale === 'ka' ? 'სთ' : 'hr'}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleContact}
                      className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: COLORS.accent }}
                    >
                      {locale === 'ka' ? 'დაკავშირება' : 'Contact Now'}
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                          isSaved
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill={isSaved ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                        <span className="text-sm">{isSaved ? (locale === 'ka' ? 'შენახული' : 'Saved') : (locale === 'ka' ? 'შენახვა' : 'Save')}</span>
                      </button>

                      <button
                        onClick={handleShare}
                        className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                    </div>

                    {/* Social Links */}
                    {(profile.userId.whatsapp || profile.userId.telegram) && (
                      <div className="flex gap-2 pt-2">
                        {profile.userId.whatsapp && (
                          <a
                            href={`https://wa.me/${profile.userId.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20 flex items-center justify-center gap-2 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            <span className="text-sm font-medium">WhatsApp</span>
                          </a>
                        )}
                        {profile.userId.telegram && (
                          <a
                            href={`https://t.me/${profile.userId.telegram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 rounded-xl bg-[#0088cc]/10 text-[#0088cc] border border-[#0088cc]/20 hover:bg-[#0088cc]/20 flex items-center justify-center gap-2 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                            <span className="text-sm font-medium">Telegram</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Location & Member Since */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                    {profile.serviceAreas.length > 0 && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span>{profile.serviceAreas[0]}</span>
                      </div>
                    )}
                    {getMemberSince() && (
                      <span>{locale === 'ka' ? 'წევრი ' : 'Since '}{getMemberSince()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">

          {/* Portfolio Gallery - Masonry Style */}
          {portfolioImages.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: COLORS.navy }} />
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {locale === 'ka' ? 'პორტფოლიო' : 'Portfolio'}
                  </h2>
                  <span className="text-sm text-neutral-500">({portfolioImages.length})</span>
                </div>
              </div>

              {/* Masonry Grid */}
              <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                {portfolioImages.slice(0, 12).map((item, idx) => (
                  <div
                    key={idx}
                    className="break-inside-avoid group cursor-pointer"
                    onClick={() => {
                      if (item.isBeforeAfter) {
                        // Handle before/after
                      } else {
                        openGallery([item.url], 0);
                      }
                    }}
                  >
                    <div className="relative rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                      {item.isBeforeAfter ? (
                        // Before/After Slider
                        <div
                          className="relative aspect-[4/3] cursor-ew-resize select-none"
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
                            setSliderPositions(prev => ({ ...prev, [idx]: x }));
                          }}
                        >
                          <img src={item.afterImage} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: `${sliderPositions[idx] || 50}%` }}
                          >
                            <img
                              src={item.beforeImage}
                              alt="Before"
                              className="absolute inset-0 h-full object-cover"
                              style={{ width: `${10000 / (sliderPositions[idx] || 50)}%`, maxWidth: 'none' }}
                            />
                          </div>
                          {/* Slider Handle */}
                          <div
                            className="absolute inset-y-0"
                            style={{ left: `${sliderPositions[idx] || 50}%` }}
                          >
                            <div className="absolute inset-y-0 w-0.5 bg-white -translate-x-1/2 shadow-lg" />
                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                              </svg>
                            </div>
                          </div>
                          {/* B/A Badge */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/60 text-white backdrop-blur-sm">
                            B/A
                          </div>
                        </div>
                      ) : (
                        // Regular Image
                        <div className="relative">
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            style={{ aspectRatio: idx % 3 === 0 ? '3/4' : idx % 3 === 1 ? '4/3' : '1/1' }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                            <p className="text-white text-sm font-medium line-clamp-1">{item.title}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {portfolioImages.length > 12 && (
                <div className="text-center mt-6">
                  <button className="px-6 py-2.5 rounded-lg text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    {locale === 'ka' ? 'ყველას ნახვა' : 'View All'} ({portfolioImages.length})
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Services - Tiered Packages */}
          {profile.subcategories && profile.subcategories.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: COLORS.navy }} />
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {locale === 'ka' ? 'სერვისები' : 'Services'}
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.subcategories.slice(0, 6).map((sub, idx) => (
                  <div
                    key={idx}
                    className={`relative p-5 rounded-xl border transition-all hover:shadow-lg ${
                      idx === 1
                        ? 'border-2 bg-white dark:bg-neutral-900'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
                    }`}
                    style={idx === 1 ? { borderColor: COLORS.navy } : {}}
                  >
                    {idx === 1 && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: COLORS.navy }}
                      >
                        {locale === 'ka' ? 'პოპულარული' : 'Popular'}
                      </div>
                    )}
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                      {getSubcategoryLabel(sub)}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                      {locale === 'ka' ? 'პროფესიონალური მომსახურება' : 'Professional service'}
                    </p>
                    <button
                      onClick={handleContact}
                      className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={idx === 1
                        ? { backgroundColor: COLORS.navy, color: 'white' }
                        : { backgroundColor: 'transparent', border: `1px solid ${COLORS.navy}`, color: COLORS.navy }
                      }
                    >
                      {locale === 'ka' ? 'შეკითხვა' : 'Inquire'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* About / Description */}
          {profile.description && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: COLORS.navy }} />
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {locale === 'ka' ? 'შესახებ' : 'About'}
                </h2>
              </div>
              <div className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {profile.description}
                </p>
              </div>
            </section>
          )}

          {/* Certifications & Experience */}
          {(profile.certifications.length > 0 || profile.languages.length > 0 || profile.yearsExperience > 0) && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: COLORS.navy }} />
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {locale === 'ka' ? 'კვალიფიკაცია' : 'Qualifications'}
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Experience */}
                <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${COLORS.navy}10` }}>
                    <svg className="w-5 h-5" style={{ color: COLORS.navy }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                    {locale === 'ka' ? 'გამოცდილება' : 'Experience'}
                  </h3>
                  <p className="text-2xl font-bold" style={{ color: COLORS.navy }}>
                    {profile.yearsExperience}+ {locale === 'ka' ? 'წელი' : 'years'}
                  </p>
                </div>

                {/* Completed Jobs */}
                {totalCompletedJobs > 0 && (
                  <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${COLORS.navy}10` }}>
                      <svg className="w-5 h-5" style={{ color: COLORS.navy }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                      {locale === 'ka' ? 'დასრულებული' : 'Completed'}
                    </h3>
                    <p className="text-2xl font-bold" style={{ color: COLORS.navy }}>
                      {totalCompletedJobs} {locale === 'ka' ? 'პროექტი' : 'projects'}
                    </p>
                  </div>
                )}

                {/* Languages */}
                {profile.languages.length > 0 && (
                  <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${COLORS.navy}10` }}>
                      <svg className="w-5 h-5" style={{ color: COLORS.navy }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                      {locale === 'ka' ? 'ენები' : 'Languages'}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {profile.languages.join(', ')}
                    </p>
                  </div>
                )}

                {/* Certifications */}
                {profile.certifications.length > 0 && (
                  <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 sm:col-span-2 lg:col-span-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${COLORS.navy}10` }}>
                      <svg className="w-5 h-5" style={{ color: COLORS.navy }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">
                      {locale === 'ka' ? 'სერტიფიკატები' : 'Certifications'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium"
                          style={{ backgroundColor: `${COLORS.navy}10`, color: COLORS.navy }}
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Reviews - Minimal/Expandable */}
          {reviews.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: COLORS.navy }} />
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {locale === 'ka' ? 'შეფასებები' : 'Reviews'}
                  </h2>
                </div>

                {/* Overall Rating */}
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(profile.avgRating) ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-white">{profile.avgRating.toFixed(1)}</span>
                  <span className="text-neutral-500">({profile.totalReviews})</span>
                </div>
              </div>

              {/* Reviews List - Collapsed by default */}
              {showAllReviews ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review._id}
                      className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                    >
                      <div className="flex items-start gap-4">
                        {review.clientId.avatar ? (
                          <img src={review.clientId.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                              {review.isAnonymous ? '?' : review.clientId.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div>
                              <p className="font-semibold text-neutral-900 dark:text-white">
                                {review.isAnonymous ? (locale === 'ka' ? 'ანონიმური' : 'Anonymous') : review.clientId.name}
                              </p>
                              <p className="text-xs text-neutral-500">{formatDate(review.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          {review.text && (
                            <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                              {review.text}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setShowAllReviews(true)}
                  className="w-full p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-left hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white mb-1">
                        {locale === 'ka' ? 'ნახე ყველა შეფასება' : 'See all reviews'}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {profile.totalReviews} {locale === 'ka' ? 'შეფასება კლიენტებისგან' : 'reviews from clients'}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              )}
            </section>
          )}

          {/* Social Proof Stats */}
          <section className="p-6 rounded-xl" style={{ backgroundColor: `${COLORS.navy}05`, border: `1px solid ${COLORS.navy}15` }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: COLORS.navy }}>{profile.yearsExperience}+</p>
                <p className="text-sm text-neutral-500">{locale === 'ka' ? 'წლის გამოცდილება' : 'Years Experience'}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: COLORS.navy }}>{totalCompletedJobs}</p>
                <p className="text-sm text-neutral-500">{locale === 'ka' ? 'დასრულებული პროექტი' : 'Projects Completed'}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: COLORS.navy }}>{profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—'}</p>
                <p className="text-sm text-neutral-500">{locale === 'ka' ? 'საშუალო რეიტინგი' : 'Avg. Rating'}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: COLORS.navy }}>{profile.responseTime || '< 1hr'}</p>
                <p className="text-sm text-neutral-500">{locale === 'ka' ? 'პასუხის დრო' : 'Response Time'}</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowContactModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-3" />

            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {locale === 'ka' ? 'შეტყობინება' : 'Send Message'}
                </h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Pro Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 mb-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: COLORS.navy }}>
                    {profile.userId.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{profile.userId.name}</p>
                  <p className="text-sm text-neutral-500">{profile.title}</p>
                </div>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={locale === 'ka' ? 'გამარჯობა! მაინტერესებს თქვენი მომსახურება...' : 'Hello! I\'m interested in your services...'}
                className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                style={{ '--tw-ring-color': COLORS.navy } as any}
                rows={4}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !message.trim()}
                  className="flex-1 py-3 text-sm font-semibold rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ backgroundColor: COLORS.navy }}
                >
                  {isSending ? (locale === 'ka' ? 'იგზავნება...' : 'Sending...') : (locale === 'ka' ? 'გაგზავნა' : 'Send')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Lightbox */}
      {isGalleryOpen && galleryImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeGallery}
        >
          {/* Close button */}
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
            {galleryIndex + 1} / {galleryImages.length}
          </div>

          {/* Image */}
          <img
            src={galleryImages[galleryIndex]}
            alt=""
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation */}
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateGallery('prev'); }}
                className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateGallery('next'); }}
                className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
