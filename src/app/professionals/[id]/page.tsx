'use client';

import Header from '@/components/common/Header';
import SimilarProfessionals from '@/components/professionals/SimilarProfessionals';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
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
  subcategories?: string[];
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
  avatar?: string;
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

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
    return () => {
      document.title = 'Homico';
    };
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
    if (!message.trim()) return;
    if (!user) {
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
      return date.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', { month: 'short', year: 'numeric' });
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--color-border)] opacity-20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--color-accent)] animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <Header />
        <div className="py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--color-bg-secondary)] flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              {locale === 'ka' ? 'პროფილი ვერ მოიძებნა' : 'Profile not found'}
            </h2>
            <p className="text-[var(--color-text-tertiary)] mb-6">
              {locale === 'ka' ? 'სამწუხაროდ, ეს გვერდი არ არსებობს' : 'Sorry, this page doesn\'t exist'}
            </p>
            <button onClick={() => router.push('/browse')} className="px-6 py-3 text-sm font-semibold rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity">
              {locale === 'ka' ? 'პროფესიონალების ნახვა' : 'Browse Professionals'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = profile.avatar || profile.userId.avatar;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap');

        .pro-page {
          --font-display: 'Syne', sans-serif;
          --font-body: 'Outfit', sans-serif;
        }

        .pro-page .font-display {
          font-family: var(--font-display);
        }

        .pro-page * {
          font-family: var(--font-body);
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-float { animation: float 6s ease-in-out infinite; }

        /* Infinite marquee for portfolio */
        .marquee-container {
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }

        .marquee-track {
          display: flex;
          gap: 16px;
          animation: marquee 30s linear infinite;
          width: fit-content;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        /* Glass morphism card */
        .glass-card {
          background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--color-bg-secondary) 80%, transparent) 0%,
            color-mix(in srgb, var(--color-bg-secondary) 60%, transparent) 100%
          );
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
        }

        /* Premium accent line */
        .accent-line {
          height: 3px;
          background: linear-gradient(90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 60%, #fff));
          border-radius: 2px;
        }

        /* Glowing button */
        .btn-glow {
          background: var(--color-accent);
          box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 40%, transparent);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px color-mix(in srgb, var(--color-accent) 35%, transparent);
        }

        /* Portfolio item with film strip aesthetic */
        .portfolio-slide {
          flex-shrink: 0;
          width: 180px;
          aspect-ratio: 3/4;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .portfolio-slide:hover {
          transform: scale(1.05) translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .portfolio-slide img {
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .portfolio-slide:hover img {
          transform: scale(1.1);
        }

        /* Stat pill */
        .stat-pill {
          background: var(--color-bg-tertiary);
          border-radius: 100px;
          padding: 8px 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        /* Review card with quote styling */
        .review-bubble {
          position: relative;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-subtle);
          border-radius: 16px;
          padding: 16px;
        }

        .review-bubble::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 24px;
          width: 40px;
          height: 3px;
          background: var(--color-accent);
          border-radius: 0 0 4px 4px;
        }

        /* Hide scrollbar */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Decorative grid background */
        .grid-bg {
          background-image:
            linear-gradient(color-mix(in srgb, var(--color-border) 30%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--color-border) 30%, transparent) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* Name highlight effect */
        .name-highlight {
          position: relative;
          display: inline-block;
        }

        .name-highlight::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 0;
          right: 0;
          height: 8px;
          background: color-mix(in srgb, var(--color-accent) 25%, transparent);
          z-index: -1;
          border-radius: 2px;
        }
      `}</style>

      <Header />

      {/* Main Content */}
      <main className="pro-page">
        <div
          className={`transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Two Column Layout */}
          <div className="flex flex-col lg:flex-row">

            {/* Left Column - Fixed Profile Card */}
            <div className="lg:w-[320px] xl:w-[360px] flex-shrink-0 lg:h-[calc(100vh-64px)] lg:sticky lg:top-[64px] lg:overflow-y-auto scrollbar-hide">
              <div className="p-4 lg:p-5">
                <div className="glass-card rounded-2xl overflow-hidden">
                  {/* Accent line at top */}
                  <div className="accent-line w-16 mx-auto mt-4" />

                  {/* Profile Content */}
                  <div className="p-5 pt-4">
                    {/* Avatar */}
                    <div className="flex justify-center mb-4">
                      <div className="relative animate-float" style={{ animationDelay: '0.2s' }}>
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={profile.userId.name}
                            className="w-20 h-20 rounded-full object-cover ring-2 ring-[var(--color-accent)]/20 ring-offset-2 ring-offset-[var(--color-bg-secondary)]"
                          />
                        ) : (
                          <div
                            className="w-20 h-20 rounded-full flex items-center justify-center ring-2 ring-[var(--color-accent)]/20 ring-offset-2 ring-offset-[var(--color-bg-secondary)]"
                            style={{ background: 'linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 70%, #000))' }}
                          >
                            <span className="font-display text-3xl font-bold text-white">
                              {profile.userId.name.charAt(0)}
                            </span>
                          </div>
                        )}

                        {/* Availability badge */}
                        {profile.isAvailable && (
                          <div className="absolute -bottom-0.5 -right-0.5 px-2 py-0.5 bg-emerald-500 rounded-full text-[9px] font-bold text-white uppercase tracking-wider shadow-lg">
                            {locale === 'ka' ? 'აქტ' : 'Avail'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name & Title */}
                    <div className="text-center mb-4">
                      <h1 className="font-display text-xl font-bold text-[var(--color-text-primary)] mb-1 name-highlight">
                        {profile.userId.name}
                      </h1>
                      <p className="text-sm text-[var(--color-text-secondary)] font-light">
                        {profile.title}
                      </p>
                    </div>

                    {/* Stats Pills */}
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {profile.totalReviews > 0 && (
                        <div className="stat-pill">
                          <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-semibold text-[var(--color-text-primary)]">{profile.avgRating.toFixed(1)}</span>
                        </div>
                      )}
                      <div className="stat-pill">
                        <span className="text-xs font-semibold text-[var(--color-text-primary)]">{profile.yearsExperience}</span>
                        <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase">{locale === 'ka' ? 'წელი' : 'yrs'}</span>
                      </div>
                      <div className="stat-pill">
                        <span className="text-xs font-semibold text-[var(--color-text-primary)]">{portfolio.length}</span>
                        <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase">{locale === 'ka' ? 'პროექტი' : 'works'}</span>
                      </div>
                    </div>

                    {/* Category Tags */}
                    <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                      {profile.categories.slice(0, 2).map((cat, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[10px] font-medium rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase tracking-wider"
                        >
                          {getCategoryLabel(cat)}
                        </span>
                      ))}
                    </div>

                    {/* Price - Editorial Style */}
                    {profile.basePrice > 0 && (
                      <div className="text-center py-4 border-y border-[var(--color-border-subtle)] mb-4">
                        <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">
                          {profile.pricingModel === 'from' ? (locale === 'ka' ? 'დაწყებული' : 'Starting') : (locale === 'ka' ? 'ფასი' : 'Rate')}
                        </p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="font-display text-3xl font-bold text-[var(--color-text-primary)]">{profile.basePrice}</span>
                          <span className="text-lg text-[var(--color-accent)]">₾</span>
                          {profile.pricingModel === 'hourly' && (
                            <span className="text-xs text-[var(--color-text-tertiary)]">/{locale === 'ka' ? 'სთ' : 'hr'}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={handleContact}
                        className="btn-glow w-full py-3 text-sm font-semibold rounded-xl text-white flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {locale === 'ka' ? 'დაკავშირება' : 'Get in Touch'}
                      </button>

                      <div className="flex gap-2">
                        {profile.userId?.whatsapp && (
                          <a
                            href={`https://wa.me/${profile.userId.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 transition-all text-xs font-medium"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </a>
                        )}
                        {profile.userId?.telegram && (
                          <a
                            href={`https://t.me/${profile.userId.telegram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#0088cc]/30 text-[#0088cc] hover:bg-[#0088cc]/10 transition-all text-xs font-medium"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                          </a>
                        )}
                        <button
                          onClick={handleShare}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-all text-xs font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="px-5 py-3 border-t border-[var(--color-border-subtle)]">
                    <div className="flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
                      {profile.serviceAreas.length > 0 && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="truncate max-w-[80px]">{profile.serviceAreas[0]}</span>
                        </div>
                      )}
                      {getMemberSince() && (
                        <span>{getMemberSince()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Scrollable Content */}
            <div className="flex-1 min-w-0">
              <div className="py-4 sm:py-5 lg:py-6 space-y-6">

              {/* About Section - Editorial Style */}
              <section className="px-4 sm:px-5 lg:px-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="accent-line flex-1 max-w-[40px]" />
                  <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                    {locale === 'ka' ? 'შესახებ' : 'About'}
                  </h2>
                </div>

                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap max-w-2xl">
                  {profile.description}
                </p>

                {/* Meta Info Pills */}
                {(profile.languages?.length > 0 || profile.serviceAreas?.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {profile.languages && profile.languages.length > 0 && (
                      <div className="stat-pill">
                        <svg className="w-3 h-3 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        <span className="text-[10px] text-[var(--color-text-secondary)]">{profile.languages.join(', ')}</span>
                      </div>
                    )}
                    {profile.serviceAreas && profile.serviceAreas.length > 0 && (
                      <div className="stat-pill">
                        <svg className="w-3 h-3 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="text-[10px] text-[var(--color-text-secondary)]">{profile.serviceAreas.slice(0, 2).join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Portfolio Section - Infinite Marquee */}
              {portfolio.length > 0 && (
                <section>
                  <div className="px-4 sm:px-5 lg:px-6 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="accent-line flex-1 max-w-[40px]" />
                      <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                        {locale === 'ka' ? 'ნამუშევრები' : 'Works'}
                      </h2>
                      <span className="text-[10px] text-[var(--color-accent)] font-medium ml-auto">{portfolio.length} {locale === 'ka' ? 'პროექტი' : 'projects'}</span>
                    </div>
                  </div>

                  {/* Infinite Scrolling Marquee */}
                  <div className="marquee-container py-2">
                    <div className="marquee-track">
                      {/* First set of items */}
                      {portfolio.map((item) => (
                        <div
                          key={`first-${item._id}`}
                          onClick={() => setSelectedProject(item)}
                          className="portfolio-slide"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          {/* Title */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white text-xs font-medium line-clamp-2 leading-snug">
                              {item.title}
                            </p>
                          </div>
                          {/* B/A Badge */}
                          {item.beforeImage && item.afterImage && (
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-white text-[8px] font-bold uppercase rounded text-neutral-700">
                              B/A
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Duplicate set for seamless loop */}
                      {portfolio.map((item) => (
                        <div
                          key={`second-${item._id}`}
                          onClick={() => setSelectedProject(item)}
                          className="portfolio-slide"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white text-xs font-medium line-clamp-2 leading-snug">
                              {item.title}
                            </p>
                          </div>
                          {item.beforeImage && item.afterImage && (
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-white text-[8px] font-bold uppercase rounded text-neutral-700">
                              B/A
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Reviews Section */}
              {reviews.length > 0 && (
                <section className="px-4 sm:px-5 lg:px-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="accent-line flex-1 max-w-[40px]" />
                    <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'შეფასებები' : 'Reviews'}
                    </h2>
                    <div className="flex items-center gap-1 ml-auto">
                      <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">{profile.avgRating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {reviews.slice(0, 4).map((review, idx) => (
                      <div
                        key={review._id}
                        className="review-bubble animate-fade-in"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          {review.isAnonymous ? (
                            <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          ) : review.clientId.avatar ? (
                            <img src={review.clientId.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                              style={{
                                background: `linear-gradient(135deg, hsl(${(review.clientId.name.charCodeAt(0) * 7) % 360}, 50%, 50%), hsl(${(review.clientId.name.charCodeAt(0) * 7 + 40) % 360}, 40%, 40%))`
                              }}
                            >
                              {review.clientId.name.charAt(0)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                                {review.isAnonymous ? (locale === 'ka' ? 'ანონიმური' : 'Anonymous') : review.clientId.name}
                              </p>
                              <span className="text-[9px] text-[var(--color-text-tertiary)]">
                                {new Date(review.createdAt).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', { month: 'short', year: 'numeric' })}
                              </span>
                              {/* Stars */}
                              <div className="flex items-center gap-0.5 ml-auto">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-2.5 h-2.5 ${star <= review.rating ? 'text-amber-400' : 'text-[var(--color-border)]'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>

                            {/* Review Text */}
                            {review.text && (
                              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                                {review.text}
                              </p>
                            )}

                            {/* Work Images */}
                            {review.workImages && review.workImages.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {review.workImages.slice(0, 3).map((img, imgIdx) => (
                                  <div
                                    key={imgIdx}
                                    onClick={(e) => { e.stopPropagation(); setSelectedImage(img); }}
                                    className="relative w-10 h-10 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                  >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                    {imgIdx === 2 && review.workImages!.length > 3 && (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-bold">
                                        +{review.workImages!.length - 3}
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
                </section>
              )}

              {/* Similar Professionals */}
              <div className="px-4 sm:px-5 lg:px-6">
                <SimilarProfessionals
                  currentProId={profile._id}
                  categories={profile.categories}
                  subcategories={profile.subcategories}
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <div
            className="relative w-full sm:max-w-sm glass-card rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden w-8 h-1 bg-[var(--color-border)] rounded-full mx-auto mt-2" />

            {/* Accent line */}
            <div className="accent-line w-12 mx-auto mt-4" />

            <div className="p-5 pt-3">
              <div className="text-center mb-4">
                <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)]">
                  {locale === 'ka' ? 'შეტყობინება' : 'Get in Touch'}
                </h3>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-tertiary)]/50 mb-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-display font-bold">
                    {profile.userId.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{profile.userId.name}</p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">{profile.title}</p>
                </div>
                <button onClick={() => setShowContactModal(false)} className="ml-auto w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  <svg className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={locale === 'ka' ? 'გამარჯობა! მაინტერესებს თქვენი მომსახურება...' : 'Hello! I\'m interested in your services...'}
                className="w-full px-4 py-3 text-sm rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all"
                rows={4}
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-all"
                >
                  {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !message.trim()}
                  className="flex-1 py-3 text-sm font-semibold rounded-xl btn-glow text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (locale === 'ka' ? 'იგზავნება...' : 'Sending...') : (locale === 'ka' ? 'გაგზავნა' : 'Send')}
                </button>
              </div>
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

      {/* Project Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div
            className="relative w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-hidden glass-card rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden w-8 h-1 bg-[var(--color-border)] rounded-full mx-auto mt-2" />

            <div className="relative aspect-[4/3] flex-shrink-0 overflow-hidden">
              {selectedProject.beforeImage && selectedProject.afterImage ? (
                <div
                  className="relative w-full h-full cursor-ew-resize"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                    setSliderPos(x);
                  }}
                  onTouchMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
                    setSliderPos(x);
                  }}
                >
                  <img src={selectedProject.afterImage} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                    <img src={selectedProject.beforeImage} alt="Before" className="absolute inset-0 h-full object-cover" style={{ width: `${10000 / sliderPos}%`, maxWidth: 'none' }} />
                  </div>
                  <div className="absolute inset-y-0" style={{ left: `${sliderPos}%` }}>
                    <div className="absolute inset-y-0 w-0.5 bg-white -translate-x-1/2" />
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </div>
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-white/90 text-[9px] font-bold uppercase tracking-wider rounded text-neutral-700">
                    {locale === 'ka' ? 'მანამდე' : 'Before'}
                  </span>
                  <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-[var(--color-accent)] text-[9px] font-bold uppercase tracking-wider rounded text-white">
                    {locale === 'ka' ? 'შემდეგ' : 'After'}
                  </span>
                </div>
              ) : (
                <img src={selectedProject.imageUrl} alt={selectedProject.title} className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-sm hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)] mb-1">{selectedProject.title}</h3>
              {selectedProject.location && (
                <div className="stat-pill inline-flex mb-3">
                  <svg className="w-3 h-3 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="text-[10px] text-[var(--color-text-secondary)]">{selectedProject.location}</span>
                </div>
              )}
              {selectedProject.description && (
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{selectedProject.description}</p>
              )}

              {selectedProject.images && selectedProject.images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide">
                  {selectedProject.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
