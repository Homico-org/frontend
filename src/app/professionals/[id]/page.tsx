'use client';

import Header from '@/components/common/Header';
import RatingBar from '@/components/common/RatingBar';
import SimilarProfessionals from '@/components/professionals/SimilarProfessionals';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Company {
  name: string;
  logo?: string;
  role?: string;
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
  yearsExperience: number;
  serviceAreas: string[];
  pricingModel: 'hourly' | 'project_based' | 'from';
  basePrice: number;
  currency: string;
  avgRating: number;
  totalReviews: number;
  completedJobs?: number;
  isAvailable: boolean;
  coverImage?: string;
  certifications: string[];
  languages: string[];
  tagline?: string;
  companies?: Company[];
  responseTime?: string;
  createdAt?: string;
  avatar?: string; // Profile-level avatar (fallback)
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

interface ReviewWithWork extends Review {
  workImages?: string[];
  workDescription?: string;
  budget?: number;
  duration?: string;
}

// No mock data - using real data from API only

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
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewWithWork[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);
  const [projectTypeFilter, setProjectTypeFilter] = useState<'all' | 'quick' | 'project' | 'job'>('all');
  const [selectedReview, setSelectedReview] = useState<ReviewWithWork | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pro-profiles/${params.id}`);
        if (!response.ok) throw new Error('პროფილი ვერ მოიძებნა');
        const data = await response.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'პროფილის ჩატვირთვა ვერ მოხერხდა');
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchProfile();
  }, [params.id]);

  // Update document title when profile loads
  useEffect(() => {
    if (profile?.userId?.name) {
      document.title = `${profile.userId.name} | Homico`;
    }
    return () => {
      document.title = 'Homico - იპოვე შენი იდეალური სახლის პროფესიონალი';
    };
  }, [profile?.userId?.name]);

  // Fetch portfolio when profile loads
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

  // Fetch reviews when profile loads
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

  // Filter portfolio by project type
  const filteredPortfolio = projectTypeFilter === 'all'
    ? portfolio
    : portfolio.filter(item => item.projectType === projectTypeFilter);

  // Group portfolio by project type for stats
  const portfolioStats = {
    quick: portfolio.filter(p => p.projectType === 'quick').length,
    project: portfolio.filter(p => p.projectType === 'project').length,
    job: portfolio.filter(p => p.projectType === 'job').length,
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'quick': return 'სწრაფი შეკეთება';
      case 'project': return 'პროექტი';
      case 'job': return 'დიდი სამუშაო';
      default: return type;
    }
  };

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'quick':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'project':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'job':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case 'quick': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'project': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'job': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const handleContact = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    setShowContactModal(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!user) {
      toast.error(
        locale === 'ka' ? 'გთხოვთ გაიაროთ ავტორიზაცია' : 'Please login',
        locale === 'ka' ? 'შეტყობინების გასაგზავნად საჭიროა ავტორიზაცია' : 'You need to login to send a message'
      );
      openLoginModal();
      return;
    }

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
        toast.success(
          locale === 'ka' ? 'შეტყობინება გაგზავნილია!' : 'Message sent!',
          locale === 'ka' ? 'პროფესიონალი მალე დაგიკავშირდებათ' : 'The professional will contact you soon'
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to send message:', errorData);
        throw new Error(errorData.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        locale === 'ka' ? 'შეტყობინების გაგზავნა ვერ მოხერხდა' : 'Failed to send message'
      );
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

  const getMemberSince = () => {
    if (profile?.createdAt) {
      const date = new Date(profile.createdAt);
      return date.toLocaleDateString('ka-GE', { month: 'short', year: 'numeric' });
    }
    return 'ნოემბ. 2024';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-text-primary)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>პროფილი იტვირთება...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <Header />
        <div className="container-custom py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <svg className="w-8 h-8" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>პროფილი ვერ მოიძებნა</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--color-text-tertiary)' }}>პროფესიონალი რომელსაც ეძებთ არ არსებობს ან წაშლილია.</p>
            <button onClick={() => router.push('/browse')} className="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors" style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-bg-secondary)' }}>
              პროფესიონალების ნახვა
            </button>
          </div>
        </div>
      </div>
    );
  }

  const primaryCompany = profile.companies && profile.companies.length > 0 ? profile.companies[0] : null;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <Header />

      {/* Hero Section */}
      <div style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container-custom">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm py-3 overflow-hidden">
            <Link href="/browse" className="transition-colors hover:opacity-80 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>პროფესიონალები</Link>
            <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-border)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{profile.userId.name}</span>
          </nav>

          {/* Profile Header */}
          <div className="pb-4 sm:pb-6">
            <div className="flex gap-3 sm:gap-5 lg:gap-6">
              {/* Avatar Section */}
              <div className="flex-shrink-0">
                <div className="relative">
                  {(profile.avatar || profile.userId.avatar) ? (
                    <img
                      src={profile.avatar || profile.userId.avatar}
                      alt={profile.userId.name}
                      className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-xl object-cover"
                      style={{ boxShadow: '0 0 0 1px var(--color-border)' }}
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-xl flex items-center justify-center text-2xl sm:text-4xl lg:text-5xl font-semibold" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                      {profile.userId.name.charAt(0)}
                    </div>
                  )}
                  {/* Company badge on avatar */}
                  {primaryCompany && (
                    <div className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)', boxShadow: '0 0 0 1px var(--color-border)' }}>
                      {primaryCompany.logo ? (
                        <img src={primaryCompany.logo} alt={primaryCompany.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-emerald-500 flex items-center justify-center">
                          <span className="text-[10px] sm:text-xs font-semibold text-white">{primaryCompany.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Online indicator */}
                  {profile.isAvailable && !primaryCompany && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full" style={{ boxShadow: '0 0 0 2px var(--color-bg-secondary)' }} />
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    {/* Name row */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                      <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold truncate max-w-[200px] sm:max-w-none" style={{ color: 'var(--color-text-primary)' }}>{profile.userId.name}</h1>
                      {profile.avgRating >= 4.8 && profile.totalReviews >= 5 && (
                        <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400 text-[9px] sm:text-[10px] font-semibold rounded-full uppercase tracking-wide flex-shrink-0">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Top
                        </span>
                      )}
                      {profile.isAvailable && (
                        <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-400 text-[9px] sm:text-[10px] font-medium rounded-full flex-shrink-0">
                          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" />
                          <span className="hidden sm:inline">ხელმისაწვდომია</span>
                          <span className="sm:hidden">აქტიური</span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <p className="text-xs sm:text-sm mb-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>{profile.title}</p>

                    {/* Company */}
                    {primaryCompany && (
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 text-xs sm:text-sm">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="font-medium truncate" style={{ color: 'var(--color-text-secondary)' }}>{primaryCompany.name}</span>
                        {primaryCompany.role && (
                          <span className="truncate hidden sm:inline" style={{ color: 'var(--color-text-tertiary)' }}>· {primaryCompany.role}</span>
                        )}
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-1.5 mt-1.5 sm:mt-2 text-xs sm:text-sm">
                      {profile.totalReviews > 0 && (
                        <RatingBar rating={profile.avgRating} reviewCount={profile.totalReviews} size="sm" />
                      )}
                      <div className="flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{profile.yearsExperience}+ წ</span>
                      </div>
                      {profile.completedJobs && profile.completedJobs > 0 && (
                        <div className="flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{profile.completedJobs}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="hidden sm:inline">{profile.responseTime || '< 1 საათი'}</span>
                        <span className="sm:hidden">&lt;1სთ</span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2 text-xs sm:text-sm overflow-hidden" style={{ color: 'var(--color-text-tertiary)' }}>
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="truncate">{profile.serviceAreas.slice(0, 2).join(' · ')}</span>
                      {profile.serviceAreas.length > 2 && (
                        <span className="flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>+{profile.serviceAreas.length - 2}</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons - desktop */}
                  <div className="hidden sm:flex items-center gap-2 relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors"
                      style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span className="text-sm font-medium">გაზიარება</span>
                    </button>

                    {/* Share dropdown */}
                    {showShareMenu && (
                      <div className="absolute top-full right-0 mt-2 rounded-lg shadow-md z-50 p-1" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            setShowShareMenu(false);
                            toast.success('ბმული დაკოპირებულია!');
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 transition-colors"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm">კოპირება</span>
                        </button>
                        {profile.userId?.whatsapp && (
                          <a
                            href={`https://wa.me/${profile.userId.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setShowShareMenu(false)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 transition-colors"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            <svg className="w-4 h-4 opacity-60" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            <span className="text-sm">WhatsApp</span>
                          </a>
                        )}
                        {profile.userId?.telegram && (
                          <a
                            href={`https://t.me/${profile.userId.telegram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setShowShareMenu(false)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 transition-colors"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            <svg className="w-4 h-4 opacity-60" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                            <span className="text-sm">Telegram</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {profile.categories.map((cat, i) => (
                    <Link
                      key={i}
                      href={`/browse?category=${cat}`}
                      className="px-2.5 py-1 text-xs rounded-md font-medium transition-colors hover:opacity-80"
                      style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
                    >
                      {getCategoryLabel(cat)}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container-custom py-4 sm:py-6 pb-24 lg:pb-6">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            {/* Tabs */}
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <nav className="flex">
                  {(['about', 'portfolio', 'reviews'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="flex-1 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors relative touch-manipulation"
                      style={{ color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
                    >
                      <span className="flex items-center justify-center gap-1 sm:gap-1.5">
                        {tab === 'about' && (
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                        {tab === 'portfolio' && (
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        {tab === 'reviews' && (
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        )}
                        <span className="hidden sm:inline">
                          {tab === 'about' && 'შესახებ'}
                          {tab === 'portfolio' && `სამუშაოები (${portfolio.length})`}
                          {tab === 'reviews' && `შეფასებები (${profile.totalReviews})`}
                        </span>
                        <span className="sm:hidden">
                          {tab === 'about' && 'შესახებ'}
                          {tab === 'portfolio' && `(${portfolio.length})`}
                          {tab === 'reviews' && `(${profile.totalReviews})`}
                        </span>
                      </span>
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-2 right-2 sm:left-4 sm:right-4 h-0.5 rounded-full" style={{ backgroundColor: 'var(--color-text-primary)' }} />
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-3 sm:p-5">
                {/* About Tab */}
                {activeTab === 'about' && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Tagline */}
                    {profile.tagline && (
                      <div className="relative pl-3 sm:pl-4" style={{ borderLeft: '2px solid var(--color-border)' }}>
                        <p className="text-sm sm:text-base italic" style={{ color: 'var(--color-text-secondary)' }}>"{profile.tagline}"</p>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'var(--color-text-primary)' }}>შესახებ</h3>
                      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{profile.description}</p>
                    </div>

                    {/* Highlights Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {/* Experience Card */}
                      <div className="p-2.5 sm:p-3.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-subtle)' }}>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-accent-soft)' }}>
                            <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color: 'var(--color-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>{profile.yearsExperience}+</p>
                            <p className="text-[10px] sm:text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>წელი</p>
                          </div>
                        </div>
                      </div>

                      {/* Jobs Card */}
                      <div className="p-2.5 sm:p-3.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-subtle)' }}>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-accent-soft)' }}>
                            <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color: 'var(--color-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>{profile.completedJobs || 0}</p>
                            <p className="text-[10px] sm:text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>პროექტი</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Service Areas */}
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'var(--color-text-primary)' }}>მომსახურების არეალი</h3>
                      <div className="flex flex-wrap gap-1 sm:gap-1.5">
                        {profile.serviceAreas.map((area, i) => (
                          <span key={i} className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Certifications */}
                    {profile.certifications.length > 0 && (
                      <div>
                        <h3 className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'var(--color-text-primary)' }}>სერტიფიკატები</h3>
                        <div className="space-y-1 sm:space-y-1.5">
                          {profile.certifications.map((cert, i) => (
                            <div key={i} className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-highlight-soft)' }}>
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: 'var(--color-highlight)' }} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-xs sm:text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>{cert}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Portfolio/Work Tab */}
                {activeTab === 'portfolio' && (
                  <div className="space-y-6">
                    {portfolioLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
                      </div>
                    ) : portfolio.length > 0 ? (
                      <>
                        {/* Project Type Stats */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          <button
                            onClick={() => setProjectTypeFilter(projectTypeFilter === 'quick' ? 'all' : 'quick')}
                            className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border transition-all ${
                              projectTypeFilter === 'quick'
                                ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500 dark:bg-emerald-500/20 dark:border-emerald-500/40'
                                : 'bg-white dark:bg-dark-card border-neutral-200 dark:border-dark-border hover:border-emerald-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mb-1">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-100 dark:bg-emerald-500/20 rounded-md flex items-center justify-center">
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <span className="text-[10px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 text-center leading-tight">სწრაფი</span>
                            </div>
                            <p className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">{portfolioStats.quick}</p>
                          </button>
                          <button
                            onClick={() => setProjectTypeFilter(projectTypeFilter === 'project' ? 'all' : 'project')}
                            className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border transition-all ${
                              projectTypeFilter === 'project'
                                ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500 dark:bg-blue-500/20 dark:border-blue-500/40'
                                : 'bg-white dark:bg-dark-card border-neutral-200 dark:border-dark-border hover:border-blue-200 hover:bg-blue-50/50 dark:hover:bg-blue-500/10'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mb-1">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 dark:bg-blue-500/20 rounded-md flex items-center justify-center">
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </div>
                              <span className="text-[10px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 text-center leading-tight">პროექტი</span>
                            </div>
                            <p className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">{portfolioStats.project}</p>
                          </button>
                          <button
                            onClick={() => setProjectTypeFilter(projectTypeFilter === 'job' ? 'all' : 'job')}
                            className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border transition-all ${
                              projectTypeFilter === 'job'
                                ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-500 dark:bg-purple-500/20 dark:border-purple-500/40'
                                : 'bg-white dark:bg-dark-card border-neutral-200 dark:border-dark-border hover:border-purple-200 hover:bg-purple-50/50 dark:hover:bg-purple-500/10'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mb-1">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-100 dark:bg-purple-500/20 rounded-md flex items-center justify-center">
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <span className="text-[10px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 text-center leading-tight">დიდი</span>
                            </div>
                            <p className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50">{portfolioStats.job}</p>
                          </button>
                        </div>

                        {/* Filter indicator */}
                        {projectTypeFilter !== 'all' && (
                          <div className="flex items-center justify-between bg-neutral-50 rounded-xl px-4 py-3">
                            <span className="text-sm text-neutral-600">
                              ნაჩვენებია <span className="font-medium">{getProjectTypeLabel(projectTypeFilter)}</span> ({filteredPortfolio.length})
                            </span>
                            <button
                              onClick={() => setProjectTypeFilter('all')}
                              className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                            >
                              ფილტრის გასუფთავება
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}

                        {/* Project List */}
                        <div className="space-y-3 sm:space-y-4">
                          {filteredPortfolio.map((item) => (
                            <div
                              key={item._id}
                              onClick={() => setSelectedProject(item)}
                              className="group bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-xl sm:rounded-2xl overflow-hidden hover:border-neutral-300 dark:hover:border-dark-50 hover:shadow-lg transition-all cursor-pointer"
                            >
                              <div className="flex flex-col sm:flex-row">
                                {/* Image */}
                                <div className="sm:w-48 h-40 sm:h-auto relative flex-shrink-0">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                  {/* Project type badge */}
                                  <div className={`absolute top-2 sm:top-3 left-2 sm:left-3 inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium border ${getProjectTypeColor(item.projectType)}`}>
                                    {getProjectTypeIcon(item.projectType)}
                                    <span className="hidden sm:inline">{getProjectTypeLabel(item.projectType)}</span>
                                  </div>
                                  {/* Before/After indicator */}
                                  {item.beforeImage && item.afterImage && (
                                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/70 text-white text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg">
                                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span className="hidden sm:inline">მანამდე/მერე</span>
                                    </div>
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-3 sm:p-5 min-w-0">
                                  <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                                    <div className="min-w-0 flex-1">
                                      <h4 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-50 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-all duration-200 ease-out truncate">{item.title}</h4>
                                      {item.location && (
                                        <div className="flex items-center gap-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 sm:mt-1">
                                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          </svg>
                                          <span className="truncate">{item.location}</span>
                                        </div>
                                      )}
                                    </div>
                                    {item.rating && (
                                      <RatingBar rating={item.rating} size="xs" showValue={true} />
                                    )}
                                  </div>

                                  {item.description && (
                                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-2 sm:mb-4">{item.description}</p>
                                  )}

                                  {/* Duration and Client */}
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                    {item.duration && (
                                      <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {item.duration}
                                      </div>
                                    )}
                                    {item.completedDate && (
                                      <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(item.completedDate).toLocaleDateString('ka-GE', { month: 'short', year: 'numeric' })}
                                      </div>
                                    )}
                                  </div>

                                  {/* Client info */}
                                  {item.clientName && (
                                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-neutral-100 dark:border-dark-border">
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        {item.clientAvatar ? (
                                          <img src={item.clientAvatar} alt={item.clientName} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0" />
                                        ) : (
                                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-600 dark:to-neutral-700 flex items-center justify-center text-white text-xs sm:text-sm font-medium flex-shrink-0">
                                            {item.clientName.charAt(0)}
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">{item.clientName}</p>
                                          {item.clientCity && (
                                            <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 truncate">{item.clientCity}</p>
                                          )}
                                        </div>
                                        {item.review && (
                                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-400 dark:text-neutral-500 flex-shrink-0">
                                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                            <span className="hidden sm:inline">შეფასება</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {filteredPortfolio.length === 0 && projectTypeFilter !== 'all' && (
                          <div className="text-center py-12">
                            <p className="text-neutral-500">{getProjectTypeLabel(projectTypeFilter)} ვერ მოიძებნა</p>
                            <button
                              onClick={() => setProjectTypeFilter('all')}
                              className="mt-2 text-sm text-neutral-600 hover:text-neutral-800 underline"
                            >
                              ყველას ნახვა
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-10 h-10 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-neutral-500 font-medium">სამუშაო ნიმუშები ჯერ არ არის</p>
                        <p className="text-neutral-400 text-sm mt-1">ამ პროფესიონალს ჯერ არ აქვს დამატებული დასრულებული პროექტები</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {/* Rating Summary - Refined Card */}
                    <div className="relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Left: Score Display */}
                        <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
                          <div className="relative">
                            {/* Glow effect behind score */}
                            <div className="absolute inset-0 blur-2xl opacity-20 bg-amber-400 dark:bg-amber-500 rounded-full scale-150" />
                            <div className="relative flex items-baseline gap-1">
                              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                {profile.avgRating.toFixed(1)}
                              </span>
                              <span className="text-base sm:text-lg text-neutral-400 dark:text-neutral-500 font-medium">/5</span>
                            </div>
                          </div>
                          {/* Stars */}
                          <div className="flex items-center gap-0.5 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${star <= Math.round(profile.avgRating) ? 'text-amber-400' : 'text-neutral-200 dark:text-neutral-700'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
                            {profile.totalReviews} შეფასება
                          </p>
                        </div>

                        {/* Right: Distribution Bars */}
                        <div className="flex-1 space-y-1.5 sm:space-y-2">
                          {[5, 4, 3, 2, 1].map((ratingValue) => {
                            const count = reviews.filter(r => r.rating === ratingValue).length;
                            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                            return (
                              <div key={ratingValue} className="flex items-center gap-2.5 group">
                                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 w-3 text-right">{ratingValue}</span>
                                <svg className="w-3 h-3 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-[#2a2a2f] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-400 rounded-full transition-all duration-700 ease-out group-hover:opacity-80"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 w-6 text-right tabular-nums">
                                  {count > 0 ? count : '–'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-neutral-100 dark:bg-[#2e2e33]" />

                    {/* Review List */}
                    <div className="space-y-3 sm:space-y-4">
                      {reviews.map((review, index) => (
                        <div
                          key={review._id}
                          className={`group relative p-3 sm:p-4 rounded-lg border transition-all duration-200 ${
                            review.workImages && review.workImages.length > 0
                              ? 'cursor-pointer border-neutral-200 dark:border-[#3f3f46] hover:border-neutral-300 dark:hover:border-[#52525b] hover:bg-neutral-50/50 dark:hover:bg-[#2a2a2f]/50'
                              : 'border-transparent bg-neutral-50 dark:bg-[#2a2a2f]/50'
                          }`}
                          onClick={() => review.workImages && review.workImages.length > 0 && setSelectedReview(review)}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* Click indicator for reviews with images */}
                          {review.workImages && review.workImages.length > 0 && (
                            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[9px] sm:text-[10px] font-medium rounded-md">
                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span className="hidden sm:inline">ნახვა</span>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 sm:gap-3">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              {review.isAnonymous ? (
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-neutral-200 dark:bg-[#3f3f46] flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              ) : review.clientId.avatar ? (
                                <img src={review.clientId.avatar} alt={review.clientId.name} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover" />
                              ) : (
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-neutral-200 dark:bg-[#3f3f46] flex items-center justify-center text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm font-medium">
                                  {review.clientId.name.charAt(0)}
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Header Row */}
                              <div className="flex items-start justify-between gap-2 mb-1 sm:mb-1.5">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                                    <span className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                      {review.isAnonymous ? 'ანონიმური' : review.clientId.name}
                                    </span>
                                    {review.isAnonymous && (
                                      <span className="inline-flex items-center px-1 sm:px-1.5 py-0.5 bg-neutral-100 dark:bg-[#3f3f46] text-neutral-500 dark:text-neutral-400 text-[8px] sm:text-[9px] font-medium rounded">
                                        დამალული
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                                    {!review.isAnonymous && review.clientId.city && (
                                      <>
                                        <span className="truncate max-w-[80px] sm:max-w-none">{review.clientId.city}</span>
                                        <span className="w-0.5 h-0.5 rounded-full bg-neutral-300 dark:bg-neutral-600 flex-shrink-0" />
                                      </>
                                    )}
                                    <span className="flex-shrink-0">{new Date(review.createdAt).toLocaleDateString('ka-GE', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                                </div>

                                {/* Rating Badge */}
                                <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white dark:bg-dark-card rounded-md border border-neutral-100 dark:border-dark-border flex-shrink-0">
                                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="text-[10px] sm:text-xs font-semibold text-neutral-900 dark:text-neutral-100">{review.rating}</span>
                                </div>
                              </div>

                              {/* Project Badge */}
                              {review.projectTitle && (
                                <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 text-[9px] sm:text-[10px] font-medium rounded mb-1.5 sm:mb-2 max-w-full">
                                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  <span className="truncate">{review.projectTitle}</span>
                                </div>
                              )}

                              {/* Review Text */}
                              {review.text && (
                                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3 sm:line-clamp-none">
                                  {review.text}
                                </p>
                              )}

                              {/* Work Images Preview */}
                              {review.workImages && review.workImages.length > 0 && (
                                <div className="mt-2 sm:mt-3 flex gap-1 sm:gap-1.5">
                                  {review.workImages.slice(0, 4).map((img, idx) => (
                                    <div
                                      key={idx}
                                      className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-md overflow-hidden ring-1 ring-neutral-200 dark:ring-[#3f3f46] group-hover:ring-neutral-300 dark:group-hover:ring-[#52525b] transition-all"
                                    >
                                      <img src={img} alt={`Work ${idx + 1}`} className="w-full h-full object-cover" />
                                      {idx === 3 && review.workImages!.length > 4 && (
                                        <div className="absolute inset-0 bg-neutral-900/60 dark:bg-black/60 flex items-center justify-center">
                                          <span className="text-white text-[10px] sm:text-xs font-medium">+{review.workImages!.length - 4}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Empty State */}
                    {reviews.length === 0 && (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-neutral-100 dark:bg-[#2a2a2f] rounded-xl mb-4">
                          <svg className="w-6 h-6 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">შეფასებები ჯერ არ არის</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">იყავით პირველი ვინც დატოვებს შეფასებას</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Hidden on mobile since we have fixed bottom bar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-3 sm:space-y-4">
              {/* Contact Card */}
              <div className="rounded-lg p-3 sm:p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                {/* CTA Buttons */}
                <div className="space-y-2 sm:space-y-2.5">
                  <button
                    onClick={handleContact}
                    className="w-full py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
                    style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-bg-secondary)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    დაკავშირება
                  </button>
                  <button className="w-full py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    ფასის მოთხოვნა
                  </button>
                </div>

                {/* WhatsApp & Telegram - if available */}
                {(profile.userId?.whatsapp || profile.userId?.telegram) && (
                  <div className="mt-3 flex items-center gap-2">
                    {profile.userId?.whatsapp && (
                      <a
                        href={`https://wa.me/${profile.userId.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </a>
                    )}
                    {profile.userId?.telegram && (
                      <a
                        href={`https://t.me/${profile.userId.telegram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                        Telegram
                      </a>
                    )}
                  </div>
                )}

                {/* Divider */}
                <div className="my-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

                {/* Quick Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs">პასუხის დრო</span>
                    </div>
                    <span className="font-medium text-xs" style={{ color: 'var(--color-text-primary)' }}>{profile.responseTime || '< 1 საათი'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs">წევრია</span>
                    </div>
                    <span className="font-medium text-xs" style={{ color: 'var(--color-text-primary)' }}>{getMemberSince()}</span>
                  </div>
                </div>
              </div>

              {/* Trust Badges - Hidden on mobile to save space */}
              <div className="hidden sm:block rounded-lg p-3 sm:p-4" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-accent-soft)' }}>
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'var(--color-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-xs" style={{ color: 'var(--color-text-primary)' }}>ვერიფიცირებული</p>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>პირადობა დადასტურებულია</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-xs" style={{ color: 'var(--color-text-primary)' }}>უსაფრთხო გადახდა</p>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>თანხის დაბრუნების გარანტია</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-highlight-soft)' }}>
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'var(--color-highlight)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-xs" style={{ color: 'var(--color-text-primary)' }}>24/7 მხარდაჭერა</p>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>ყოველთვის მზად ვართ</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report link */}
              <div className="text-center">
                <button className="text-xs transition-colors hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
                  პროფილის შეტყობინება
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Professionals Section */}
        {profile && profile.categories.length > 0 && (
          <SimilarProfessionals
            currentProId={profile._id}
            categories={profile.categories}
          />
        )}
      </main>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowContactModal(false)}>
          <div className="rounded-lg p-5 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>შეტყობინების გაგზავნა</h3>
              <button onClick={() => setShowContactModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ backgroundColor: 'transparent' }}>
                <svg className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              {(profile.avatar || profile.userId.avatar) ? (
                <img src={profile.avatar || profile.userId.avatar} alt="" className="w-11 h-11 rounded-lg object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-lg flex items-center justify-center font-semibold text-lg" style={{ backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)' }}>
                  {profile.userId.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{profile.userId.name}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{profile.title}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <p className="text-[10px] text-emerald-600">პასუხობს {profile.responseTime || '1 საათში'}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>თქვენი შეტყობინება</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="გამარჯობა! მაინტერესებს თქვენი მომსახურება..."
                className="w-full px-3 py-2.5 text-sm rounded-lg resize-none focus:outline-none transition-colors"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
                rows={4}
              />
            </div>

            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                გაუქმება
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isSending || !message.trim()}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-bg-secondary)' }}
              >
                {isSending ? 'იგზავნება...' : 'გაგზავნა'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95" onClick={() => setSelectedImage(null)}>
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={selectedImage} alt="" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Project Detail Modal - Soft Minimal Design */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedProject(null)}
          style={{
            background: 'rgba(28, 26, 23, 0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Modal Container */}
          <div
            className="w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-bg-elevated)',
              boxShadow: 'var(--shadow-xl)',
              animation: 'softModalSlide 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Hero Image */}
            <div className="relative flex-shrink-0 overflow-hidden" style={{ height: '240px' }}>
              {selectedProject.images && selectedProject.images.length > 1 ? (
                <div className="h-full flex gap-0.5">
                  <div className="flex-1 relative overflow-hidden">
                    <img
                      src={selectedProject.images[0]}
                      alt={selectedProject.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-20 flex flex-col gap-0.5">
                    {selectedProject.images.slice(1, 3).map((img, idx) => (
                      <div key={idx} className="flex-1 relative overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        {idx === 1 && selectedProject.images && selectedProject.images.length > 3 && (
                          <div
                            className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold"
                            style={{ background: 'rgba(28, 26, 23, 0.6)' }}
                          >
                            +{selectedProject.images.length - 3}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedProject.beforeImage && selectedProject.afterImage ? (
                <div className="h-full flex">
                  <div className="w-1/2 relative">
                    <img src={selectedProject.beforeImage} alt="მანამდე" className="w-full h-full object-cover" />
                    <span
                      className="absolute bottom-3 left-3 px-2.5 py-1 text-xs font-medium rounded-md"
                      style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-secondary)' }}
                    >
                      მანამდე
                    </span>
                  </div>
                  <div className="w-1/2 relative" style={{ borderLeft: '2px solid var(--color-bg-elevated)' }}>
                    <img src={selectedProject.afterImage} alt="შემდეგ" className="w-full h-full object-cover" />
                    <span
                      className="absolute bottom-3 right-3 px-2.5 py-1 text-xs font-medium rounded-md text-white"
                      style={{ background: 'var(--color-accent)' }}
                    >
                      შემდეგ
                    </span>
                  </div>
                </div>
              ) : (
                <img
                  src={selectedProject.imageUrl}
                  alt={selectedProject.title}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-105"
                style={{
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text-secondary)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Project Type Badge */}
              <div
                className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: 'var(--color-bg-elevated)',
                  color: selectedProject.projectType === 'quick'
                    ? 'var(--color-accent)'
                    : selectedProject.projectType === 'project'
                    ? '#3b82f6'
                    : '#8b5cf6',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {getProjectTypeIcon(selectedProject.projectType)}
                {getProjectTypeLabel(selectedProject.projectType)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-5">
                {/* Header */}
                <div className="mb-5">
                  <h2
                    className="text-xl font-semibold mb-1.5"
                    style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}
                  >
                    {selectedProject.title}
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    {selectedProject.location && (
                      <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="text-sm">{selectedProject.location}</span>
                      </div>
                    )}
                    {selectedProject.rating && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#f59e0b' }}>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          {selectedProject.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meta Pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {selectedProject.duration && (
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                      style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-tertiary)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {selectedProject.duration}
                    </div>
                  )}
                  {selectedProject.completedDate && (
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                      style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-tertiary)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(selectedProject.completedDate).toLocaleDateString('ka-GE', { month: 'short', year: 'numeric' })}
                    </div>
                  )}
                  {selectedProject.category && (
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm capitalize"
                      style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
                    >
                      {selectedProject.category.replace(/-/g, ' ')}
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedProject.description && (
                  <div className="mb-5">
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {selectedProject.description}
                    </p>
                  </div>
                )}

                {/* Client Review */}
                {selectedProject.clientName && (
                  <div
                    className="p-4 rounded-xl"
                    style={{ background: 'var(--color-bg-secondary)' }}
                  >
                    <div className="flex items-start gap-3">
                      {selectedProject.clientAvatar ? (
                        <img
                          src={selectedProject.clientAvatar}
                          alt={selectedProject.clientName}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                          style={{ background: 'var(--color-accent)' }}
                        >
                          {selectedProject.clientName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {selectedProject.clientName}
                          </span>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-accent)' }}>
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        {selectedProject.clientCity && (
                          <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                            {selectedProject.clientCity}
                          </p>
                        )}
                        {selectedProject.review && (
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                            "{selectedProject.review}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedProject.tags && selectedProject.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {selectedProject.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 text-xs rounded-md"
                        style={{
                          background: 'var(--color-bg-tertiary)',
                          color: 'var(--color-text-tertiary)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer CTA */}
            <div
              className="flex-shrink-0 p-4"
              style={{ borderTop: '1px solid var(--color-border-subtle)' }}
            >
              <button
                onClick={() => {
                  setSelectedProject(null);
                  handleContact();
                }}
                className="w-full py-3.5 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  boxShadow: 'var(--shadow-button)',
                }}
              >
                <span>მსგავსი პროექტის შეკვეთა</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes softModalSlide {
              from {
                opacity: 0;
                transform: translateY(24px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}

      {/* Review Work Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => setSelectedReview(null)}>
          <div
            className="w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="relative">
              {/* Image Gallery */}
              {selectedReview.workImages && selectedReview.workImages.length > 0 ? (
                <div className="relative h-64 sm:h-72 overflow-hidden">
                  {selectedReview.workImages.length === 1 ? (
                    <img
                      src={selectedReview.workImages[0]}
                      alt="სამუშაო"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full">
                      <div className="w-2/3 h-full">
                        <img
                          src={selectedReview.workImages[0]}
                          alt="სამუშაო"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="w-1/3 h-full flex flex-col">
                        {selectedReview.workImages.slice(1, 3).map((img, idx) => (
                          <div key={idx} className="flex-1 border-l-2 border-white">
                            <img
                              src={img}
                              alt={`სამუშაო ${idx + 2}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-200 ease-out"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="relative h-16 flex items-center justify-between px-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>შეფასების დეტალები</h3>
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ease-out hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              {/* Project Title */}
              {selectedReview.projectTitle && (
                <h3 className="text-xl font-bold text-neutral-50 mb-4">{selectedReview.projectTitle}</h3>
              )}

              {/* Project Meta */}
              <div className="flex flex-wrap gap-4 mb-6">
                {selectedReview.budget && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">ბიუჯეტი</p>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-50">{selectedReview.budget.toLocaleString()} ₾</p>
                    </div>
                  </div>
                )}
                {selectedReview.duration && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">ხანგრძლივობა</p>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-50">{selectedReview.duration}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">რეიტინგი</p>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-50">{selectedReview.rating}/5</p>
                  </div>
                </div>
              </div>

              {/* Work Description */}
              {selectedReview.workDescription && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">შესრულებული სამუშაო</h4>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{selectedReview.workDescription}</p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 my-6" />

              {/* Client Review */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">მაძიებელის შეფასება</h4>
                <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    {selectedReview.isAnonymous ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    ) : selectedReview.clientId.avatar ? (
                      <img
                        src={selectedReview.clientId.avatar}
                        alt={selectedReview.clientId.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-white font-medium">
                        {selectedReview.clientId.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-50">
                          {selectedReview.isAnonymous ? 'ანონიმური' : selectedReview.clientId.name}
                        </p>
                        {selectedReview.isAnonymous && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                            დამალული
                          </span>
                        )}
                      </div>
                      {!selectedReview.isAnonymous && selectedReview.clientId.city && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{selectedReview.clientId.city}</p>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < selectedReview.rating ? 'text-amber-400' : 'text-neutral-200 dark:text-neutral-700'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  {selectedReview.text && (
                    <p className="text-neutral-600 dark:text-neutral-400 italic">"{selectedReview.text}"</p>
                  )}
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3">
                    {new Date(selectedReview.createdAt).toLocaleDateString('ka-GE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer - sticky at bottom */}
            <div className="flex-shrink-0 border-t border-neutral-800 p-4 bg-[var(--color-bg-secondary)]">
              <button
                onClick={() => {
                  setSelectedReview(null);
                  handleContact();
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 ease-out flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                დაკავშირება მსგავსი სამუშაოსთვის
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 flex gap-2.5 z-40" style={{ backgroundColor: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)' }}>
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="p-2.5 rounded-lg transition-colors"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          {/* Mobile Share Menu */}
          {showShareMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-52 rounded-lg shadow-lg z-50 overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <div className="p-1.5">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setShowShareMenu(false);
                    toast.success('ბმული დაკოპირებულია!');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-colors text-left active:bg-black/5"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <svg className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>ბმულის კოპირება</span>
                </button>
                <button
                  onClick={() => {
                    window.open(`https://wa.me/?text=Check out this professional: ${encodeURIComponent(window.location.href)}`, '_blank');
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-colors text-left active:bg-black/5"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>WhatsApp</span>
                </button>
                <button
                  onClick={() => {
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-colors text-left active:bg-black/5"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Facebook</span>
                </button>
                <button
                  onClick={() => {
                    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=Check out this professional!`, '_blank');
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-colors text-left active:bg-black/5"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <svg className="w-4 h-4" style={{ color: 'var(--color-text-primary)' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>X (Twitter)</span>
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleContact}
          className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-bg-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          დაკავშირება
        </button>
      </div>
    </div>
  );
}
