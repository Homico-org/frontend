'use client';

import Avatar from '@/components/common/Avatar';
import Header, { HeaderSpacer } from '@/components/common/Header';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { CheckCircle, Clock, MapPin, MessageSquare, Shield, Star, Trophy, Briefcase } from 'lucide-react';

// Helper function to get proper image URL
const getImageUrl = (path: string | undefined): string => {
  if (!path) return '';
  // Handle base64 data URLs
  if (path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  if (path.startsWith('/')) {
    return `${apiUrl}${path}`;
  }
  return `${apiUrl}/uploads/${path}`;
};
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// Warm terracotta color palette matching the design
const COLORS = {
  primary: '#C4735B',      // Terracotta/coral for buttons
  primaryLight: '#D4937B',
  teal: '#4A9B9B',         // Teal for cover background
  tealDark: '#3D8585',
  text: '#1F2937',         // Dark text
  textLight: '#6B7280',    // Gray text
  border: '#E5E7EB',       // Light border
  background: '#FFFFFF',
  cardBg: '#FFFFFF',
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
  responseTime?: string;
  createdAt?: string;
  avatar?: string;
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

  // Get all portfolio images
  const getAllPortfolioImages = () => {
    const images: string[] = [];
    portfolio.forEach(item => {
      if (item.imageUrl) images.push(item.imageUrl);
      if (item.images) images.push(...item.images.filter(img => img !== item.imageUrl));
    });
    profile?.portfolioProjects?.forEach(project => {
      if (project.images) images.push(...project.images);
    });
    return images;
  };

  // Group subcategories by parent category
  const getGroupedServices = () => {
    const groups: Record<string, string[]> = {};

    profile?.categories.forEach(cat => {
      groups[cat] = [];
    });

    profile?.subcategories?.forEach(sub => {
      // Find parent category
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
  };

  const totalCompletedJobs = (profile?.completedJobs || 0) + (profile?.externalCompletedJobs || 0);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
      <HeaderSpacer />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-neutral-200" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: COLORS.primary }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
      <HeaderSpacer />
        <div className="py-16 text-center">
          <div className="max-w-md mx-auto px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-neutral-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              {locale === 'ka' ? 'პროფილი ვერ მოიძებნა' : 'Profile not found'}
            </h2>
            <p className="text-neutral-500 mb-6">
              {locale === 'ka' ? 'სამწუხაროდ, ეს გვერდი არ არსებობს' : 'Sorry, this page doesn\'t exist'}
            </p>
            <button
              onClick={() => router.push('/browse')}
              className="px-6 py-3 text-sm font-semibold rounded-lg text-white transition-colors"
              style={{ backgroundColor: COLORS.primary }}
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
  const groupedServices = getGroupedServices();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeaderSpacer />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-6">

            {/* Hero Card with Cover */}
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
              {/* Teal Cover Background */}
              <div
                className="h-32 sm:h-40 relative"
                style={{ backgroundColor: COLORS.teal }}
              >
                {profile.coverImage && (
                  <img
                    src={getImageUrl(profile.coverImage)}
                    alt=""
                    className="w-full h-full object-cover opacity-30"
                  />
                )}
              </div>

              {/* Profile Info */}
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-12 sm:-mt-14 relative">
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                  {avatarUrl ? (
                    <img
                      src={getImageUrl(avatarUrl)}
                      alt={profile.userId.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-bold"
                      style={{ backgroundColor: COLORS.teal }}
                    >
                      {profile.userId.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Name & Title */}
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1">
                  {profile.userId.name}
                </h1>
                <p className="text-base sm:text-lg mb-3" style={{ color: COLORS.primary }}>
                  {profile.title}
                </p>

                {/* Location & Rating */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                  {profile.serviceAreas.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-neutral-400" />
                      <span>{profile.serviceAreas[0]}, Georgia</span>
                    </div>
                  )}
                  {profile.avgRating > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-neutral-900">{profile.avgRating.toFixed(1)}</span>
                      <span className="text-neutral-400">({profile.totalReviews} {locale === 'ka' ? 'შეფასება' : 'reviews'})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* About Section */}
            {profile.description && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-bold text-neutral-900 mb-4">
                  {locale === 'ka' ? `${profile.userId.name.split(' ')[0]}-ს შესახებ` : `About ${profile.userId.name.split(' ')[0]}`}
                </h2>
                <div className="text-neutral-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {profile.description}
                </div>
              </div>
            )}

            {/* Services Offered Section */}
            {profile.subcategories && profile.subcategories.length > 0 && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-bold text-neutral-900 mb-5">
                  {locale === 'ka' ? 'შეთავაზებული სერვისები' : 'Services Offered'}
                </h2>

                <div className="space-y-5">
                  {Object.entries(groupedServices).map(([categoryKey, subcats]) => {
                    if (subcats.length === 0) return null;
                    return (
                      <div key={categoryKey}>
                        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                          {getCategoryLabel(categoryKey)}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {subcats.map((sub, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 rounded-full text-sm font-medium bg-neutral-100 text-neutral-700 border border-neutral-200"
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

            {/* Recent Projects Section */}
            {portfolioImages.length > 0 && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-neutral-900">
                    {locale === 'ka' ? 'ბოლო პროექტები' : 'Recent Projects'}
                  </h2>
                  {portfolioImages.length > 3 && (
                    <button
                      className="text-sm font-medium transition-colors"
                      style={{ color: COLORS.primary }}
                    >
                      {locale === 'ka' ? 'ყველას ნახვა' : 'View All Projects'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {portfolioImages.slice(0, 3).map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-xl overflow-hidden bg-neutral-100 cursor-pointer group"
                    >
                      <img
                        src={getImageUrl(img)}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Client Reviews Section */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-bold text-neutral-900 mb-5">
                  {locale === 'ka' ? 'კლიენტების შეფასებები' : 'Client Reviews'}
                </h2>

                <div className="space-y-5">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review._id} className="pb-5 border-b border-neutral-100 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        {review.clientId.avatar ? (
                          <img
                            src={getImageUrl(review.clientId.avatar)}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                            <span className="text-sm font-semibold text-neutral-600">
                              {review.isAnonymous ? '?' : review.clientId.name.charAt(0)}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div>
                              <p className="font-semibold text-neutral-900 text-sm">
                                {review.isAnonymous ? (locale === 'ka' ? 'ანონიმური' : 'Anonymous') : review.clientId.name}
                              </p>
                              <p className="text-xs text-neutral-400">{formatTimeAgo(review.createdAt)}</p>
                            </div>
                            {/* Stars */}
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}`}
                                />
                              ))}
                            </div>
                          </div>

                          {review.text && (
                            <p className="text-sm text-neutral-600 leading-relaxed mt-2">
                              {review.text}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Read All Reviews Link */}
                {profile.totalReviews > 3 && (
                  <button
                    className="w-full mt-5 text-center text-sm font-medium py-3 rounded-xl transition-colors"
                    style={{ color: COLORS.primary }}
                  >
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
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
                {/* Starting Rate */}
                {profile.basePrice > 0 && (
                  <div className="flex items-baseline justify-between mb-5">
                    <span className="text-sm text-neutral-500">
                      {locale === 'ka' ? 'საწყისი ფასი' : 'Starting Rate'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-neutral-900">{profile.basePrice}</span>
                      <span className="text-lg text-neutral-500">₾</span>
                      <span className="text-sm text-neutral-400">
                        /{profile.pricingModel === 'hourly' ? (locale === 'ka' ? 'სთ' : 'hr') : (locale === 'ka' ? 'პროექტი' : 'project')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Request Quote Button */}
                <button
                  onClick={handleContact}
                  className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 mb-3"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {locale === 'ka' ? 'ფასის მოთხოვნა' : 'Request Quote'}
                </button>

                {/* Message Button */}
                <button
                  onClick={handleContact}
                  className="w-full py-3 rounded-xl font-medium text-sm border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  {locale === 'ka' ? 'შეტყობინება' : 'Message'}
                </button>

                {/* Divider */}
                <div className="border-t border-neutral-100 my-5" />

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{locale === 'ka' ? 'პასუხი' : 'RESPONSE'}</span>
                    </div>
                    <p className="font-semibold text-neutral-900">{profile.responseTime || '< 1 hr'}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{locale === 'ka' ? 'გამოცდ.' : 'EXP.'}</span>
                    </div>
                    <p className="font-semibold text-neutral-900">{profile.yearsExperience}+ {locale === 'ka' ? 'წელი' : 'Years'}</p>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="space-y-3">
                  {/* Identity Verified */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {locale === 'ka' ? 'პირადობა დადასტურებული' : 'Identity Verified'}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {locale === 'ka' ? 'სახელმწიფო ID შემოწმებული' : 'Government ID checked'}
                      </p>
                    </div>
                  </div>

                  {/* Insured */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {locale === 'ka' ? 'დაზღვეული' : 'Insured'}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {locale === 'ka' ? '10,000₾-მდე დაფარვა' : 'Covered up to 10k ₾'}
                      </p>
                    </div>
                  </div>

                  {/* Top Rated */}
                  {profile.avgRating >= 4.5 && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {locale === 'ka' ? 'ტოპ რეიტინგი' : 'Top Rated Pro'}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {locale === 'ka' ? 'თბილისის ტოპ 5%-ში' : 'Top 5% in Tbilisi'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Map Card */}
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="aspect-[4/3] bg-neutral-100 relative">
                  {/* Placeholder map - you can integrate Google Maps or Mapbox here */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.primary }} />
                      <p className="text-sm font-medium text-neutral-700">
                        {profile.serviceAreas[0] || 'Tbilisi'}, Georgia
                      </p>
                    </div>
                  </div>
                  {/* Map image placeholder */}
                  <img
                    src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${41.7151},${44.8271},11,0/400x300?access_token=pk.placeholder`}
                    alt="Map"
                    className="w-full h-full object-cover opacity-50"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowContactModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden w-10 h-1 bg-neutral-300 rounded-full mx-auto mt-3" />

            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-neutral-900">
                  {locale === 'ka' ? 'შეტყობინება' : 'Send Message'}
                </h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                >
                  <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Pro Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 mb-4">
                {avatarUrl ? (
                  <img src={getImageUrl(avatarUrl)} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: COLORS.teal }}>
                    {profile.userId.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-neutral-900">{profile.userId.name}</p>
                  <p className="text-sm text-neutral-500">{profile.title}</p>
                </div>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={locale === 'ka' ? 'გამარჯობა! მაინტერესებს თქვენი მომსახურება...' : 'Hello! I\'m interested in your services...'}
                className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                style={{ '--tw-ring-color': COLORS.primary } as any}
                rows={4}
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !message.trim()}
                  className="flex-1 py-3 text-sm font-semibold rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ backgroundColor: COLORS.primary }}
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
