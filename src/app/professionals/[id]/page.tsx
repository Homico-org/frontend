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
  ChevronLeft, ChevronRight, X, ExternalLink, Award, Sparkles, Heart,
  Calendar, Users, Verified, BadgeCheck, Quote, ArrowRight, Phone, Zap
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
  customServices?: string[]; // Custom services added by user during registration
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
  // Verification fields
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
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

  // Use categories context for proper translations
  const getCategoryLabel = (categoryKey: string) => {
    if (!categoryKey) return '';
    const category = CATEGORIES.find(cat => cat.key === categoryKey);
    if (category) {
      return locale === 'ka' ? category.nameKa : category.name;
    }
    // Fallback: format the key as readable text
    return categoryKey.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getSubcategoryLabel = (subcategoryKey: string) => {
    if (!subcategoryKey) return '';
    if (subcategoryKey.startsWith('custom:')) {
      return subcategoryKey.replace('custom:', '');
    }
    // Search through all categories to find the subcategory
    for (const category of CATEGORIES) {
      const subcategory = category.subcategories.find(sub => sub.key === subcategoryKey);
      if (subcategory) {
        return locale === 'ka' ? subcategory.nameKa : subcategory.name;
      }
      // Also check sub-subcategories (children)
      for (const sub of category.subcategories) {
        if (sub.children) {
          const subSub = sub.children.find(child => child.key === subcategoryKey);
          if (subSub) {
            return locale === 'ka' ? subSub.nameKa : subSub.name;
          }
        }
      }
    }
    // Fallback: format the key as readable text
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

  // City name translations (lowercase keys for case-insensitive matching)
  const cityTranslations: Record<string, string> = {
    'tbilisi': 'თბილისი',
    'rustavi': 'რუსთავი',
    'mtskheta': 'მცხეთა',
    'batumi': 'ბათუმი',
    'kutaisi': 'ქუთაისი',
    'gori': 'გორი',
    'zugdidi': 'ზუგდიდი',
    'poti': 'ფოთი',
    'telavi': 'თელავი',
    'akhaltsikhe': 'ახალციხე',
    'kobuleti': 'ქობულეთი',
    'ozurgeti': 'ოზურგეთი',
    'marneuli': 'მარნეული',
    'kaspi': 'კასპი',
    'chiatura': 'ჭიათურა',
    'tskhinvali': 'ცხინვალი',
    'samtredzia': 'სამტრედია',
    'borjomi': 'ბორჯომი',
    'khashuri': 'ხაშური',
    'senaki': 'სენაკი',
    'zestaponi': 'ზესტაფონი',
    'nationwide': 'მთელი საქართველო',
    'georgia': 'საქართველო',
    'saguramo': 'საგურამო',
    'gardabani': 'გარდაბანი',
    'sagarejo': 'საგარეჯო',
    'signagi': 'სიღნაღი',
    'lagodekhi': 'ლაგოდეხი',
    'gurjaani': 'გურჯაანი',
    'kvareli': 'ყვარელი',
    'dedoplistsqaro': 'დედოფლისწყარო',
    'tianeti': 'თიანეთი',
    'dusheti': 'დუშეთი',
    'kazbegi': 'ყაზბეგი',
    'stepantsminda': 'სტეფანწმინდა',
    'bolnisi': 'ბოლნისი',
    'dmanisi': 'დმანისი',
    'tetritskaro': 'თეთრიწყარო',
    'tsalka': 'წალკა',
  };

  const translateCity = (city: string) => {
    if (locale === 'ka') {
      const lowerCity = city.toLowerCase().trim();
      if (cityTranslations[lowerCity]) {
        return cityTranslations[lowerCity];
      }
    }
    return city;
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
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-3 border-[#E07B4F]/20" />
              <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-[#E07B4F] animate-spin" />
            </div>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {locale === 'ka' ? 'იტვირთება...' : 'Loading...'}
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
              <svg className="w-12 h-12 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
              {locale === 'ka' ? 'პროფილი ვერ მოიძებნა' : 'Profile not found'}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-8">
              {locale === 'ka' ? 'სამწუხაროდ, ეს გვერდი არ არსებობს' : 'Sorry, this page doesn\'t exist'}
            </p>
            <button
              onClick={() => router.push('/browse')}
              className="px-8 py-4 text-sm font-bold rounded-2xl text-white bg-[#E07B4F] hover:bg-[#D26B3F] transition-all shadow-lg shadow-[#E07B4F]/20 hover:shadow-xl hover:shadow-[#E07B4F]/30 hover:-translate-y-0.5"
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

  // Get tier color
  const getTierColor = () => {
    switch (profile.premiumTier) {
      case 'elite': return '#B8860B';
      case 'pro': return '#E07B4F';
      case 'basic': return '#4A9B9B';
      default: return '#4A9B9B';
    }
  };

  const tierColor = getTierColor();

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <AppBackground />
      <Header />
      <HeaderSpacer />

      {/* Hero Section */}
      <section className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Profile Info Card */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="relative mb-8">
            <div className="bg-[var(--color-bg-elevated)] rounded-3xl border border-[var(--color-border-subtle)] shadow-2xl shadow-black/5 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 self-start">
                    {avatarUrl ? (
                      <img
                        src={getImageUrl(avatarUrl)}
                        alt={profile.name}
                        className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-4 border-[var(--color-bg-elevated)] shadow-xl ring-4 ring-white/50 dark:ring-white/10"
                      />
                    ) : (
                      <div
                        className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-[var(--color-bg-elevated)] shadow-xl flex items-center justify-center text-white text-4xl font-bold"
                        style={{ background: `linear-gradient(135deg, ${tierColor} 0%, ${tierColor}CC 100%)` }}
                      >
                        {profile.name.charAt(0)}
                      </div>
                    )}

                    {/* Online Status */}
                    {profile.isAvailable && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-[var(--color-bg-elevated)] flex items-center justify-center shadow-lg">
                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
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
                      {(profile as any).isVerified !== false && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <BadgeCheck className="w-4 h-4" />
                          <span className="text-xs font-semibold">{locale === 'ka' ? 'დადასტურებული' : 'Verified'}</span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <p className="text-lg sm:text-xl font-medium mb-4" style={{ color: tierColor }}>
                      {profile.title}
                    </p>

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                      {/* Rating */}
                      {profile.avgRating > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            <span className="font-bold text-amber-600 dark:text-amber-400">{profile.avgRating.toFixed(1)}</span>
                          </div>
                          <span className="text-[var(--color-text-tertiary)]">
                            ({profile.totalReviews} {locale === 'ka' ? 'შეფასება' : 'reviews'})
                          </span>
                        </div>
                      )}

                      {/* Location */}
                      {profile.serviceAreas.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                          <MapPin className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                          <span>{translateCity(profile.serviceAreas[0])}</span>
                        </div>
                      )}

                      {/* Experience */}
                      <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                        <Briefcase className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        <span>{profile.yearsExperience}+ {locale === 'ka' ? 'წელი' : 'years'}</span>
                      </div>

                      {/* Completed Jobs */}
                      {totalCompletedJobs > 0 && (
                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>{totalCompletedJobs} {locale === 'ka' ? 'პროექტი' : 'projects'}</span>
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
                    style={{
                      backgroundColor: '#C4735B',
                      boxShadow: '0 10px 30px rgba(196, 115, 91, 0.3)',
                    }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {locale === 'ka' ? 'შეტყობინება' : 'Message'}
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
              <section
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 sm:p-8 shadow-sm"
                style={{ animationDelay: '0.1s' }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${tierColor}15` }}
                  >
                    <Award className="w-5 h-5" style={{ color: tierColor }} />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    {locale === 'ka' ? 'ჩემს შესახებ' : 'About Me'}
                  </h2>
                </div>
                <div className="text-[var(--color-text-secondary)] leading-relaxed text-[15px] whitespace-pre-wrap">
                  {profile.description}
                </div>
              </section>
            )}

            {/* Custom Services Section - Shows user-added services */}
            {profile.customServices && profile.customServices.length > 0 && (
              <section
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 sm:p-8 shadow-sm"
                style={{ animationDelay: '0.15s' }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#C4735B]/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#C4735B]" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    {locale === 'ka' ? 'სერვისები' : 'Services'}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.customServices.map((service, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium bg-[#C4735B]/10 text-[#C4735B] border border-[#C4735B]/20 hover:bg-[#C4735B]/15 transition-colors"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Skills/Subcategories Section */}
            {profile.subcategories && profile.subcategories.length > 0 && (
              <section
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 sm:p-8 shadow-sm"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#4A9B9B]/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-[#4A9B9B]" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    {locale === 'ka' ? 'უნარები' : 'Skills'}
                  </h2>
                </div>

                <div className="space-y-6">
                  {Object.entries(groupedServices).map(([categoryKey, subcats]) => {
                    if (subcats.length === 0) return null;
                    return (
                      <div key={categoryKey}>
                        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tierColor }} />
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

            {/* Portfolio Section */}
            {portfolioImages.length > 0 && (
              <section
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 sm:p-8 shadow-sm"
                style={{ animationDelay: '0.3s' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                      {locale === 'ka' ? 'პორტფოლიო' : 'Portfolio'}
                    </h2>
                  </div>
                  {portfolioImages.length > 6 && (
                    <button className="text-sm font-semibold flex items-center gap-1 transition-colors hover:gap-2" style={{ color: tierColor }}>
                      {locale === 'ka' ? 'ყველას ნახვა' : 'View All'}
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
                        idx === 0 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-square'
                      }`}
                    >
                      <img
                        src={getImageUrl(img.url)}
                        alt={img.title || ''}
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
                          <p className="text-white font-semibold truncate">{img.title}</p>
                        </div>
                      )}

                      {/* More Indicator */}
                      {idx === 5 && portfolioImages.length > 6 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">+{portfolioImages.length - 6}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews Section */}
            {reviews.length > 0 && (
              <section
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 sm:p-8 shadow-sm"
                style={{ animationDelay: '0.4s' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Star className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'შეფასებები' : 'Reviews'}
                      </h2>
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        {profile.totalReviews} {locale === 'ka' ? 'შეფასება' : 'reviews'}
                      </p>
                    </div>
                  </div>

                  {/* Rating Summary */}
                  {profile.avgRating > 0 && (
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--color-bg-tertiary)]">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= Math.round(profile.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-[var(--color-border)]'}`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-[var(--color-text-primary)]">{profile.avgRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {reviews.slice(0, 4).map((review, idx) => (
                    <div
                      key={review._id}
                      className={`${idx < Math.min(reviews.length, 4) - 1 ? 'pb-6 border-b border-[var(--color-border-subtle)]' : ''}`}
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
                              {review.isAnonymous ? '?' : review.clientId.name.charAt(0)}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="font-semibold text-[var(--color-text-primary)]">
                                {review.isAnonymous ? (locale === 'ka' ? 'ანონიმური' : 'Anonymous') : review.clientId.name}
                              </p>
                              <p className="text-xs text-[var(--color-text-muted)]">{formatTimeAgo(review.createdAt)}</p>
                            </div>
                            {/* Stars */}
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-[var(--color-border)]'}`}
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
                                <div key={pIdx} className="w-20 h-20 rounded-xl overflow-hidden">
                                  <img src={getImageUrl(photo)} alt="" className="w-full h-full object-cover" />
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
                    {locale === 'ka' ? `ყველა ${profile.totalReviews} შეფასების ნახვა` : `Read all ${profile.totalReviews} reviews`}
                  </button>
                )}
              </section>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:w-[340px] flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">

              {/* Quick Contact Card */}
              <div
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm"
                style={{ animationDelay: '0.15s' }}
              >
                {/* Pricing */}
                {profile.basePrice > 0 && (
                  <div className="mb-6 pb-6 border-b border-[var(--color-border-subtle)]">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {locale === 'ka' ? 'საწყისი ფასი' : 'Starting Rate'}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-[var(--color-text-primary)]">{profile.basePrice}</span>
                        <span className="text-lg text-[var(--color-text-secondary)]">₾</span>
                        <span className="text-sm text-[var(--color-text-muted)]">{getPricingLabel()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  onClick={handleContact}
                  className="w-full py-4 rounded-xl text-white font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: '#C4735B',
                    boxShadow: '0 10px 30px rgba(196, 115, 91, 0.3)',
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  {locale === 'ka' ? 'შეტყობინება' : 'Message'}
                </button>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{locale === 'ka' ? 'პასუხი' : 'Response'}</span>
                    </div>
                    <p className="font-bold text-[var(--color-text-primary)]">&lt;1 {locale === 'ka' ? 'სთ' : 'hour'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{locale === 'ka' ? 'წევრობა' : 'Member'}</span>
                    </div>
                    <p className="font-bold text-[var(--color-text-primary)]">2024</p>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 shadow-sm"
                style={{ animationDelay: '0.2s' }}
              >
                <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4">
                  {locale === 'ka' ? 'სანდოობა' : 'Trust & Safety'}
                </h3>

                <div className="space-y-3">
                  {/* Phone Verified */}
                  {profile.isPhoneVerified && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <BadgeCheck className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {locale === 'ka' ? 'ტელეფონი დადასტურებული' : 'Phone Verified'}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {locale === 'ka' ? 'ტელეფონის ნომერი შემოწმებული' : 'Phone number confirmed'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Email Verified */}
                  {profile.isEmailVerified && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {locale === 'ka' ? 'ელფოსტა დადასტურებული' : 'Email Verified'}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {locale === 'ka' ? 'ელფოსტის მისამართი შემოწმებული' : 'Email address confirmed'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Top Rated - only show if user actually has high rating */}
                  {profile.avgRating >= 4.5 && profile.totalReviews >= 5 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {locale === 'ka' ? 'ტოპ რეიტინგი' : 'Top Rated'}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {locale === 'ka'
                            ? `${profile.avgRating.toFixed(1)} ★ (${profile.totalReviews} შეფასება)`
                            : `${profile.avgRating.toFixed(1)} ★ from ${profile.totalReviews} reviews`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Experience Badge - show if 5+ years experience */}
                  {profile.yearsExperience >= 5 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {locale === 'ka' ? 'გამოცდილი' : 'Experienced'}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {locale === 'ka'
                            ? `${profile.yearsExperience}+ წლის გამოცდილება`
                            : `${profile.yearsExperience}+ years of experience`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Completed Jobs Badge - show if has completed jobs */}
                  {totalCompletedJobs >= 10 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-500/5 border border-teal-500/10">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-teal-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {locale === 'ka' ? 'აქტიური პროფესიონალი' : 'Active Professional'}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {locale === 'ka'
                            ? `${totalCompletedJobs}+ დასრულებული პროექტი`
                            : `${totalCompletedJobs}+ completed projects`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Areas */}
              <div
                className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm"
                style={{ animationDelay: '0.25s' }}
              >
                {/* Map Illustration */}
                <div className="aspect-[16/10] relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${tierColor}10 0%, ${tierColor}05 100%)` }}>
                  {/* Decorative Map Lines */}
                  <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 200 125" preserveAspectRatio="none">
                    <path d="M0,60 Q50,40 100,60 T200,60" fill="none" stroke={tierColor} strokeWidth="0.5" opacity="0.5"/>
                    <path d="M0,70 Q50,50 100,70 T200,70" fill="none" stroke={tierColor} strokeWidth="0.5" opacity="0.3"/>
                    <path d="M0,80 Q50,60 100,80 T200,80" fill="none" stroke={tierColor} strokeWidth="0.5" opacity="0.2"/>
                    <circle cx="100" cy="60" r="20" fill={tierColor} opacity="0.1"/>
                    <circle cx="100" cy="60" r="10" fill={tierColor} opacity="0.15"/>
                  </svg>

                  {/* Location Pin */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div
                        className="w-14 h-14 mx-auto mb-2 rounded-2xl shadow-xl flex items-center justify-center"
                        style={{ backgroundColor: tierColor }}
                      >
                        <MapPin className="w-7 h-7 text-white" />
                      </div>
                      <p className="text-sm font-bold" style={{ color: tierColor }}>
                        {translateCity(profile.serviceAreas[0] || 'Tbilisi')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Areas List */}
                {profile.serviceAreas.length > 1 && (
                  <div className="p-4 border-t border-[var(--color-border-subtle)]">
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                      {locale === 'ka' ? 'მომსახურების ზონები' : 'Service Areas'}
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
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxOpen && portfolioImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10 border border-white/10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation arrows */}
          {portfolioImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10 border border-white/10"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10 border border-white/10"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* Image container */}
          <div
            className="max-w-6xl max-h-[85vh] mx-4 sm:mx-8"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(portfolioImages[lightboxIndex].url)}
              alt={portfolioImages[lightboxIndex].title || ''}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />

            {/* Caption */}
            {(portfolioImages[lightboxIndex].title || portfolioImages[lightboxIndex].description) && (
              <div className="mt-6 text-center">
                {portfolioImages[lightboxIndex].title && (
                  <h3 className="text-white font-bold text-xl">{portfolioImages[lightboxIndex].title}</h3>
                )}
                {portfolioImages[lightboxIndex].description && (
                  <p className="text-white/70 text-sm mt-2 max-w-2xl mx-auto">{portfolioImages[lightboxIndex].description}</p>
                )}
              </div>
            )}

            {/* Image counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium border border-white/10">
              {lightboxIndex + 1} / {portfolioImages.length}
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowContactModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-lg bg-[var(--color-bg-elevated)] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden w-12 h-1.5 bg-[var(--color-border)] rounded-full mx-auto mt-3" />

            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                  {locale === 'ka' ? 'შეტყობინება' : 'Send Message'}
                </h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="w-10 h-10 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center hover:bg-[var(--color-bg-muted)] transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>
              </div>

              {/* Pro Info */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-bg-tertiary)] mb-6">
                {avatarUrl ? (
                  <img src={getImageUrl(avatarUrl)} alt="" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                    style={{ background: `linear-gradient(135deg, ${tierColor} 0%, ${tierColor}CC 100%)` }}
                  >
                    {profile.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-[var(--color-text-primary)]">{profile.name}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{profile.title}</p>
                </div>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={locale === 'ka' ? 'გამარჯობა! მაინტერესებს თქვენი მომსახურება...' : 'Hello! I\'m interested in your services...'}
                className="w-full px-4 py-4 text-[15px] rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:border-[var(--color-border-hover)] transition-colors"
                style={{ ['--tw-ring-color' as any]: tierColor }}
                rows={4}
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 py-4 rounded-xl text-sm font-semibold border-2 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !message.trim()}
                  className="flex-1 py-4 text-sm font-bold rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:hover:translate-y-0"
                  style={{
                    backgroundColor: tierColor,
                    boxShadow: `0 10px 30px ${tierColor}30`,
                  }}
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
