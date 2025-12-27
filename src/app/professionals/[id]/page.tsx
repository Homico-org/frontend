'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useAnalytics, AnalyticsEvent } from '@/hooks/useAnalytics';
import {
  Briefcase, CheckCircle, Clock, MapPin, MessageSquare, Shield, Star, Trophy,
  ChevronLeft, ChevronRight, X, ExternalLink, Award, Phone,
  Calendar, BadgeCheck, Zap,
  Facebook, Instagram, Linkedin, Globe, Camera, Sparkles
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';

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
  customServices?: string[];
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
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  verificationStatus?: 'pending' | 'submitted' | 'verified' | 'rejected';
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
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about');

  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setShowFloatingButton(heroBottom < 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/portfolio/pro/${profile._id}`);
        if (response.ok) {
          const data = await response.json();
          setPortfolio(data);
        }
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
      }
    };
    if (profile?._id) fetchPortfolio();
  }, [profile?._id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!profile?._id) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/pro/${profile._id}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
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
        body: JSON.stringify({ proId: profile?._id, message })
      });
      if (response.ok) {
        setShowContactModal(false);
        setMessage('');
        toast.success(locale === 'ka' ? 'შეტყობინება გაგზავნილია!' : 'Message sent!');
        trackEvent(AnalyticsEvent.CONVERSATION_START, { proId: profile?._id, proName: profile?.name });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      toast.error(locale === 'ka' ? 'შეცდომა' : 'Error');
    } finally {
      setIsSending(false);
    }
  };

  const getCategoryLabel = (categoryKey: string) => {
    if (!categoryKey) return '';
    const category = CATEGORIES.find(cat => cat.key === categoryKey);
    if (category) return locale === 'ka' ? category.nameKa : category.name;
    return categoryKey.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getSubcategoryLabel = (subcategoryKey: string) => {
    if (!subcategoryKey) return '';
    if (subcategoryKey.startsWith('custom:')) return subcategoryKey.replace('custom:', '');
    for (const category of CATEGORIES) {
      const subcategory = category.subcategories.find(sub => sub.key === subcategoryKey);
      if (subcategory) return locale === 'ka' ? subcategory.nameKa : subcategory.name;
      for (const sub of category.subcategories) {
        if (sub.children) {
          const subSub = sub.children.find(child => child.key === subcategoryKey);
          if (subSub) return locale === 'ka' ? subSub.nameKa : subSub.name;
        }
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

  const getAllPortfolioImages = useCallback(() => {
    const images: { url: string; title?: string; description?: string }[] = [];
    portfolio.forEach(item => {
      if (item.imageUrl) images.push({ url: item.imageUrl, title: item.title, description: item.description });
      if (item.images) item.images.filter(img => img !== item.imageUrl).forEach(img => images.push({ url: img, title: item.title }));
    });
    profile?.portfolioProjects?.forEach(project => {
      if (project.images) project.images.forEach((img, idx) => images.push({ url: img, title: project.title, description: idx === 0 ? project.description : undefined }));
    });
    return images;
  }, [portfolio, profile?.portfolioProjects]);

  const getGroupedServices = useCallback(() => {
    const groups: Record<string, string[]> = {};
    profile?.categories.forEach(cat => { groups[cat] = []; });
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

  const cityTranslations: Record<string, string> = {
    'tbilisi': 'თბილისი', 'rustavi': 'რუსთავი', 'mtskheta': 'მცხეთა', 'batumi': 'ბათუმი',
    'kutaisi': 'ქუთაისი', 'gori': 'გორი', 'zugdidi': 'ზუგდიდი', 'telavi': 'თელავი',
    'nationwide': 'მთელი საქართველო', 'georgia': 'საქართველო',
  };

  const translateCity = (city: string) => {
    if (locale === 'ka') {
      const lowerCity = city.toLowerCase().trim();
      if (cityTranslations[lowerCity]) return cityTranslations[lowerCity];
    }
    return city;
  };

  const totalCompletedJobs = (profile?.completedJobs || 0) + (profile?.externalCompletedJobs || 0);

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
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A]">
        <Header />
        <HeaderSpacer />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-[#E8E0DB] dark:border-neutral-800" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#C4735B] animate-spin" />
            </div>
          </div>
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
              {locale === 'ka' ? 'პროფილი ვერ მოიძებნა' : 'Profile not found'}
            </h2>
            <button
              onClick={() => router.push('/browse')}
              className="mt-6 px-6 py-3 text-sm font-medium rounded-full text-white bg-[#C4735B] hover:bg-[#B5654D] transition-colors"
            >
              {locale === 'ka' ? 'უკან დაბრუნება' : 'Go Back'}
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A]">
      <Header />
      <HeaderSpacer />

      {/* ========== HERO SECTION ========== */}
      <section
        ref={heroRef}
        className={`relative transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F0ED] via-[#FAFAFA] to-[#FAFAFA] dark:from-[#1A1612] dark:via-[#0A0A0A] dark:to-[#0A0A0A]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-5">
              {avatarUrl ? (
                <img
                  src={getImageUrl(avatarUrl)}
                  alt={profile.name}
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-white dark:ring-neutral-900 shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center text-white text-5xl font-bold bg-gradient-to-br from-[#C4735B] to-[#A65D47] ring-4 ring-white dark:ring-neutral-900 shadow-xl">
                  {profile.name.charAt(0)}
                </div>
              )}

              {/* Verified badge */}
              {profile.verificationStatus === 'verified' && (
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
            <div className="flex items-center justify-center gap-6 text-sm mb-6">
              {profile.avgRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-neutral-900 dark:text-white">{profile.avgRating.toFixed(1)}</span>
                  <span className="text-neutral-500">({profile.totalReviews})</span>
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
                <span>{profile.yearsExperience}+ {locale === 'ka' ? 'წელი' : 'yrs'}</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleContact}
              className="px-8 py-3 rounded-full text-white font-semibold text-sm bg-gradient-to-r from-[#C4735B] to-[#B5654D] hover:from-[#B5654D] hover:to-[#A65D47] transition-all shadow-lg shadow-[#C4735B]/25 hover:shadow-xl hover:shadow-[#C4735B]/30 hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {locale === 'ka' ? 'დაკავშირება' : 'Contact'}
                {profile.basePrice > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                    {locale === 'ka' ? 'დან' : 'from'} {profile.basePrice}₾
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ========== TAB NAVIGATION ========== */}
      <div className="sticky top-[60px] z-30 bg-[#FAFAFA]/80 dark:bg-[#0A0A0A]/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {[
              { key: 'about', label: locale === 'ka' ? 'შესახებ' : 'About' },
              { key: 'portfolio', label: locale === 'ka' ? 'ნამუშევრები' : 'Portfolio', count: portfolioImages.length },
              { key: 'reviews', label: locale === 'ka' ? 'შეფასებები' : 'Reviews', count: profile.totalReviews },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`relative px-4 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-[#C4735B]'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key
                        ? 'bg-[#C4735B]/10 text-[#C4735B]'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                    }`}>
                      {tab.count}
                    </span>
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
        {activeTab === 'about' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Description */}
            {profile.description && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {profile.description}
                </p>
              </div>
            )}

            {/* Services Grid */}
            {profile.customServices && profile.customServices.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                  {locale === 'ka' ? 'სერვისები' : 'Services'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.customServices.map((service, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 rounded-full text-sm font-medium bg-[#F5F0ED] dark:bg-neutral-800 text-[#8B5A42] dark:text-[#D4A489]"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills by Category */}
            {profile.subcategories && profile.subcategories.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                  {locale === 'ka' ? 'უნარები' : 'Skills'}
                </h3>
                <div className="space-y-4">
                  {Object.entries(groupedServices).map(([categoryKey, subcats]) => {
                    if (subcats.length === 0) return null;
                    return (
                      <div key={categoryKey}>
                        <p className="text-xs font-medium text-neutral-400 mb-2">{getCategoryLabel(categoryKey)}</p>
                        <div className="flex flex-wrap gap-2">
                          {subcats.map((sub, idx) => (
                            <span key={idx} className="px-3 py-1.5 rounded-lg text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
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

            {/* Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {profile.basePrice > 0 && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800">
                  <p className="text-xs text-neutral-500 mb-1">{locale === 'ka' ? 'ფასი' : 'Price'}</p>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">{profile.basePrice}₾<span className="text-sm font-normal text-neutral-500">{getPricingLabel()}</span></p>
                </div>
              )}

              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 mb-1">{locale === 'ka' ? 'პასუხი' : 'Response'}</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">&lt;1 <span className="text-sm font-normal text-neutral-500">{locale === 'ka' ? 'სთ' : 'hr'}</span></p>
              </div>

              {totalCompletedJobs > 0 && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800">
                  <p className="text-xs text-neutral-500 mb-1">{locale === 'ka' ? 'პროექტები' : 'Projects'}</p>
                  <p className="text-xl font-bold text-neutral-900 dark:text-white">{totalCompletedJobs}</p>
                </div>
              )}

              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 mb-1">{locale === 'ka' ? 'წევრობა' : 'Member since'}</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">2024</p>
              </div>
            </div>

            {/* Trust & Social */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Verification Badges */}
              {(profile.isPhoneVerified || profile.isEmailVerified || profile.verificationStatus === 'verified') && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                    {locale === 'ka' ? 'ვერიფიკაცია' : 'Verification'}
                  </h3>
                  <div className="space-y-2">
                    {profile.verificationStatus === 'verified' && (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <BadgeCheck className="w-4 h-4" />
                        <span className="text-sm font-medium">{locale === 'ka' ? 'პირადობა დადასტურებული' : 'Identity Verified'}</span>
                      </div>
                    )}
                    {profile.isPhoneVerified && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-medium">{locale === 'ka' ? 'ტელეფონი' : 'Phone'}</span>
                      </div>
                    )}
                    {profile.isEmailVerified && (
                      <div className="flex items-center gap-2 text-purple-600">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">{locale === 'ka' ? 'ელფოსტა' : 'Email'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(profile.facebookUrl || profile.instagramUrl || profile.linkedinUrl || profile.websiteUrl) && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                    {locale === 'ka' ? 'სოციალური' : 'Social'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.facebookUrl && (
                      <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors">
                        <Facebook className="w-4 h-4" />
                      </a>
                    )}
                    {profile.instagramUrl && (
                      <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#E4405F]/10 flex items-center justify-center text-[#E4405F] hover:bg-[#E4405F]/20 transition-colors">
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {profile.linkedinUrl && (
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#0A66C2]/10 flex items-center justify-center text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {profile.websiteUrl && (
                      <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div className="animate-in fade-in duration-300">
            {portfolioImages.length > 0 ? (
              <div className="columns-2 sm:columns-3 gap-3">
                {portfolioImages.map((img, idx) => {
                  const heights = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-[5/6]', 'aspect-square'];
                  return (
                    <button
                      key={idx}
                      onClick={() => openLightbox(idx)}
                      className={`relative w-full ${heights[idx % heights.length]} rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 group cursor-pointer mb-3 break-inside-avoid`}
                    >
                      <img
                        src={getImageUrl(img.url)}
                        alt={img.title || ''}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-neutral-700" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <Camera className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-500">{locale === 'ka' ? 'ნამუშევრები არ არის' : 'No portfolio items yet'}</p>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="animate-in fade-in duration-300">
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {/* Rating Summary */}
                {profile.avgRating > 0 && (
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800 text-center">
                    <div className="text-5xl font-bold text-neutral-900 dark:text-white mb-2">{profile.avgRating.toFixed(1)}</div>
                    <div className="flex justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-5 h-5 ${star <= Math.round(profile.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-neutral-500">{profile.totalReviews} {locale === 'ka' ? 'შეფასება' : 'reviews'}</p>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.map((review) => (
                  <div key={review._id} className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-start gap-4">
                      {review.clientId.avatar ? (
                        <img src={getImageUrl(review.clientId.avatar)} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          <span className="text-sm font-semibold text-neutral-500">{review.isAnonymous ? '?' : review.clientId.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-neutral-900 dark:text-white text-sm">
                            {review.isAnonymous ? (locale === 'ka' ? 'ანონიმური' : 'Anonymous') : review.clientId.name}
                          </p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-400 mb-2">{formatTimeAgo(review.createdAt)}</p>
                        {review.text && <p className="text-sm text-neutral-600 dark:text-neutral-400">{review.text}</p>}
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
            ) : (
              <div className="text-center py-16">
                <Star className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                <p className="text-neutral-500">{locale === 'ka' ? 'შეფასებები არ არის' : 'No reviews yet'}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========== FLOATING BUTTON - MOBILE ========== */}
      <div
        className={`lg:hidden fixed bottom-6 left-4 right-4 z-40 transition-all duration-300 ${
          showFloatingButton ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={handleContact}
          className="w-full py-4 rounded-2xl text-white font-semibold text-sm bg-gradient-to-r from-[#C4735B] to-[#B5654D] shadow-xl shadow-[#C4735B]/30"
        >
          <span className="flex items-center justify-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {locale === 'ka' ? 'დაკავშირება' : 'Contact'}
            {profile.basePrice > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {profile.basePrice}₾
              </span>
            )}
          </span>
        </button>
      </div>

      {/* ========== LIGHTBOX ========== */}
      {lightboxOpen && portfolioImages.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
          {portfolioImages.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <div className="max-w-4xl max-h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <img src={getImageUrl(portfolioImages[lightboxIndex].url)} alt="" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm">
            {lightboxIndex + 1} / {portfolioImages.length}
          </div>
        </div>
      )}

      {/* ========== CONTACT MODAL ========== */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowContactModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sm:hidden w-10 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center gap-3 mb-4">
              {avatarUrl ? (
                <img src={getImageUrl(avatarUrl)} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C4735B] to-[#A65D47] flex items-center justify-center text-white text-lg font-bold">
                  {profile.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">{profile.name}</p>
                <p className="text-sm text-neutral-500">{profile.title}</p>
              </div>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={locale === 'ka' ? 'დაწერეთ შეტყობინება...' : 'Write a message...'}
              className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#C4735B]"
              rows={3}
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowContactModal(false)} className="flex-1 py-3 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isSending || !message.trim()}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#C4735B] disabled:opacity-50"
              >
                {isSending ? '...' : (locale === 'ka' ? 'გაგზავნა' : 'Send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
