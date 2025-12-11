'use client';

import AppBackground from '@/components/common/AppBackground';
import Button, { ButtonIcons } from '@/components/common/Button';
import Header from '@/components/common/Header';
import SimilarProfessionals from '@/components/professionals/SimilarProfessionals';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);

  // Enhanced gallery viewer state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Portfolio gallery state - check if items fit or need scroll
  const portfolioContainerRef = useRef<HTMLDivElement>(null);
  const [portfolioFits, setPortfolioFits] = useState(true);

  // Check if portfolio items fit in container
  useEffect(() => {
    const checkFit = () => {
      if (portfolio.length > 0) {
        const itemWidth = window.innerWidth >= 640 ? 180 : 160;
        const gap = 14;
        const padding = 32; // 16px each side
        const totalContentWidth = (portfolio.length * itemWidth) + ((portfolio.length - 1) * gap);
        const containerWidth = window.innerWidth - padding;
        setPortfolioFits(totalContentWidth <= containerWidth);
      }
    };

    const timer = setTimeout(checkFit, 100);
    window.addEventListener('resize', checkFit);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkFit);
    };
  }, [portfolio]);

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

  // Open gallery viewer with all project images
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

  // Keyboard navigation for gallery
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

  // Touch swipe for gallery
  const touchStartX = useRef<number>(0);
  const handleGalleryTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleGalleryTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        navigateGallery('next');
      } else {
        navigateGallery('prev');
      }
    }
  }, [navigateGallery]);

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
    <div className="min-h-screen relative overflow-hidden">
      <AppBackground />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap');

        .pro-page {
          --font-display: 'Syne', sans-serif;
          --font-body: 'Outfit', sans-serif;

          /* Terracotta color palette override */
          --color-accent: #C87259;
          --color-accent-hover: #B86349;
          --color-accent-soft: rgba(200, 114, 89, 0.12);
          --color-accent-muted: rgba(200, 114, 89, 0.18);
        }

        :root:has(.pro-page) .dark .pro-page,
        .dark .pro-page {
          --color-accent: #E0917A;
          --color-accent-hover: #D4A08C;
          --color-accent-soft: rgba(224, 145, 122, 0.15);
          --color-accent-muted: rgba(224, 145, 122, 0.2);
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

        /* Portfolio horizontal scroll gallery */
        .portfolio-scroll-container {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          padding: 8px 16px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .portfolio-scroll-container::-webkit-scrollbar {
          display: none;
        }

        /* Center items when few */
        .portfolio-scroll-container.centered {
          justify-content: center;
        }

        /* Glass morphism card - Terracotta themed - transparent without gradients */
        .glass-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(210, 105, 30, 0.1);
        }

        .dark .glass-card {
          background: rgba(17, 24, 39, 0.4);
          border: 1px solid rgba(205, 133, 63, 0.15);
        }

        /* Premium accent line - Terracotta solid */
        .accent-line {
          height: 3px;
          background: #C96D4D;
          border-radius: 2px;
        }

        /* Glowing button - Terracotta solid */
        .btn-glow {
          background: #C96D4D;
          box-shadow: 0 4px 15px rgba(201, 109, 77, 0.3);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-glow:hover {
          background: #b85a3d;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(201, 109, 77, 0.4);
        }

        /* Portfolio item with refined aesthetic */
        .portfolio-slide {
          flex-shrink: 0;
          width: 160px;
          aspect-ratio: 3/4;
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          background: var(--color-bg-tertiary);
        }

        @media (min-width: 640px) {
          .portfolio-slide {
            width: 180px;
          }
        }

        .portfolio-slide:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 16px 32px rgba(0,0,0,0.15);
        }

        .portfolio-slide img {
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .portfolio-slide:hover img {
          transform: scale(1.08);
        }

        /* Stat pill - Terracotta tinted transparent */
        .stat-pill {
          background: rgba(201, 109, 77, 0.06);
          border: 1px solid rgba(201, 109, 77, 0.12);
          border-radius: 100px;
          padding: 8px 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }

        .stat-pill:hover {
          background: rgba(201, 109, 77, 0.1);
          border-color: rgba(201, 109, 77, 0.2);
        }

        .dark .stat-pill {
          background: rgba(201, 109, 77, 0.12);
          border: 1px solid rgba(201, 109, 77, 0.18);
        }

        .dark .stat-pill:hover {
          background: rgba(201, 109, 77, 0.18);
          border-color: rgba(201, 109, 77, 0.28);
        }

        /* Info card - Terracotta transparent bordered - no gradients */
        .info-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(210, 105, 30, 0.1);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .dark .info-card {
          background: rgba(17, 24, 39, 0.4);
          border: 1px solid rgba(205, 133, 63, 0.15);
        }

        .info-card:hover {
          border-color: rgba(210, 105, 30, 0.2);
        }

        .dark .info-card:hover {
          border-color: rgba(205, 133, 63, 0.25);
        }

        /* Review card with quote styling - Terracotta transparent - no gradients */
        .review-bubble {
          position: relative;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(210, 105, 30, 0.1);
          border-radius: 16px;
          padding: 16px;
        }

        .dark .review-bubble {
          background: rgba(17, 24, 39, 0.4);
          border: 1px solid rgba(205, 133, 63, 0.15);
        }

        .review-bubble::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 24px;
          width: 40px;
          height: 3px;
          background: #C96D4D;
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

        /* Immersive Gallery Viewer */
        @keyframes gallery-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes gallery-zoom-in {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes gallery-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .gallery-overlay {
          animation: gallery-fade-in 0.3s ease-out forwards;
        }

        .gallery-image-container {
          animation: gallery-zoom-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .gallery-controls {
          animation: gallery-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
          opacity: 0;
        }

        .gallery-nav-btn {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .gallery-nav-btn:hover {
          background: rgba(0, 0, 0, 0.6);
          transform: scale(1.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .gallery-nav-btn:active {
          transform: scale(0.95);
        }

        .gallery-thumbnail {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border: 2px solid transparent;
        }

        .gallery-thumbnail:hover {
          transform: scale(1.05);
        }

        .gallery-thumbnail.active {
          border-color: var(--color-accent);
          transform: scale(1.08);
          box-shadow: 0 0 20px color-mix(in srgb, var(--color-accent) 40%, transparent);
        }

        .gallery-counter {
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.1em;
        }

        /* Project Modal Styles */
        @keyframes modal-slide-up {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .project-modal-enter {
          animation: modal-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (min-width: 640px) {
          .project-modal-enter {
            border-radius: 24px;
          }
        }

        .project-hero-gradient {
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.85) 0%,
            rgba(0, 0, 0, 0.4) 40%,
            rgba(0, 0, 0, 0.1) 70%,
            transparent 100%
          );
        }

        .project-title-glow {
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
        }

        .meta-chip {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .meta-chip:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .review-quote::before {
          content: '"';
          position: absolute;
          top: -8px;
          left: 12px;
          font-size: 48px;
          font-family: Georgia, serif;
          color: #D2691E;
          opacity: 0.3;
          line-height: 1;
        }

        :is(.dark) .review-quote::before {
          color: #CD853F;
        }

        .gallery-thumb {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(210, 105, 30, 0.1);
        }

        :is(.dark) .gallery-thumb {
          border-color: rgba(205, 133, 63, 0.15);
        }

        .gallery-thumb:hover {
          transform: scale(1.03) translateY(-2px);
          box-shadow: 0 12px 24px -8px rgba(210, 105, 30, 0.2);
          border-color: rgba(210, 105, 30, 0.25);
        }

        :is(.dark) .gallery-thumb:hover {
          box-shadow: 0 12px 24px -8px rgba(205, 133, 63, 0.2);
          border-color: rgba(205, 133, 63, 0.3);
        }

        .tag-pill {
          background: rgba(210, 105, 30, 0.08);
          border: 1px solid rgba(210, 105, 30, 0.15);
          transition: all 0.2s ease;
        }

        :is(.dark) .tag-pill {
          background: rgba(205, 133, 63, 0.12);
          border-color: rgba(205, 133, 63, 0.18);
        }

        .tag-pill:hover {
          background: rgba(210, 105, 30, 0.15);
          border-color: rgba(210, 105, 30, 0.25);
          transform: translateY(-1px);
        }

        :is(.dark) .tag-pill:hover {
          background: rgba(205, 133, 63, 0.2);
          border-color: rgba(205, 133, 63, 0.3);
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
                <div>
                  {/* Accent line at top */}
                  <div className="accent-line w-16 mx-auto" />

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
                          <div className="absolute -bottom-0.5 -right-0.5 px-2 py-0.5 bg-gradient-to-r from-[#D2691E] to-[#CD853F] rounded-full text-[9px] font-bold text-white uppercase tracking-wider shadow-lg shadow-[#D2691E]/30">
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
                      {profile.userId.uid && (
                        <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1 font-mono">
                          ID: {profile.userId.uid}
                        </p>
                      )}
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

                    {/* Price - Luxury Editorial Style */}
                    {profile.basePrice > 0 && (
                      <div className="relative group mb-5">
                        {/* Decorative corner accents */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--color-accent)] opacity-60" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--color-accent)] opacity-60" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--color-accent)] opacity-60" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--color-accent)] opacity-60" />

                        {/* Inner content with gradient background */}
                        <div
                          className="relative text-center py-5 px-4 overflow-hidden"
                          style={{
                            background: 'linear-gradient(135deg, var(--color-accent-soft) 0%, transparent 50%, var(--color-accent-soft) 100%)',
                          }}
                        >
                          {/* Shimmer effect on hover */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                            style={{
                              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                              animation: 'shimmer 2s infinite',
                            }}
                          />

                          {/* Price label with decorative lines */}
                          <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--color-accent)] opacity-50" />
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-medium">
                              {profile.pricingModel === 'from'
                                ? (locale === 'ka' ? 'საწყისი ფასი' : 'Starting From')
                                : profile.pricingModel === 'hourly'
                                  ? (locale === 'ka' ? 'საათობრივი' : 'Per Hour')
                                  : (locale === 'ka' ? 'ფასი' : 'Rate')}
                            </p>
                            <div className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--color-accent)] opacity-50" />
                          </div>

                          {/* Price display with gradient text effect */}
                          <div className="flex items-baseline justify-center gap-1.5">
                            <span
                              className="font-display text-4xl font-bold tracking-tight"
                              style={{
                                background: 'linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent) 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                              }}
                            >
                              {profile.basePrice.toLocaleString()}
                            </span>
                            <span className="text-xl font-semibold text-[var(--color-accent)]">₾</span>
                            {profile.pricingModel === 'hourly' && (
                              <span className="text-sm text-[var(--color-text-tertiary)] font-medium">
                                /{locale === 'ka' ? 'სთ' : 'hr'}
                              </span>
                            )}
                          </div>

                          {/* Subtle tagline for 'from' pricing */}
                          {profile.pricingModel === 'from' && (
                            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-2 italic">
                              {locale === 'ka' ? 'პროექტის მიხედვით' : 'Based on project scope'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        onClick={handleContact}
                        variant="primary"
                        size="md"
                        fullWidth
                        showPulse
                        icon={<ButtonIcons.Chat />}
                        className="py-3 rounded-xl"
                      >
                        {locale === 'ka' ? 'დაკავშირება' : 'Get in Touch'}
                      </Button>

                      <div className="flex gap-2">
                        {profile.userId?.whatsapp && (
                          <a
                            href={`https://wa.me/${profile.userId.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                              background: 'linear-gradient(135deg, rgba(200, 114, 89, 0.08) 0%, rgba(200, 114, 89, 0.04) 100%)',
                              border: '1px solid rgba(200, 114, 89, 0.2)',
                              color: '#C87259',
                            }}
                          >
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </a>
                        )}
                        {profile.userId?.telegram && (
                          <a
                            href={`https://t.me/${profile.userId.telegram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                              background: 'linear-gradient(135deg, rgba(200, 114, 89, 0.08) 0%, rgba(200, 114, 89, 0.04) 100%)',
                              border: '1px solid rgba(200, 114, 89, 0.2)',
                              color: '#C87259',
                            }}
                          >
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                          </a>
                        )}
                        <button
                          onClick={handleShare}
                          className="group flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            background: 'linear-gradient(135deg, rgba(200, 114, 89, 0.08) 0%, rgba(200, 114, 89, 0.04) 100%)',
                            border: '1px solid rgba(200, 114, 89, 0.2)',
                            color: '#C87259',
                          }}
                        >
                          <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {/* About Section - Glassmorphic Transparent Card */}
              <section className="px-4 sm:px-5 lg:px-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-[3px] w-8 rounded-full bg-[#D2691E]" />
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D2691E]/50 dark:text-[#CD853F]/50">
                    {locale === 'ka' ? 'შესახებ' : 'About'}
                  </h2>
                </div>

                <div
                  className="p-4 sm:p-5 rounded-2xl backdrop-blur-md"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.15) 100%)',
                    border: '1px solid rgba(210, 105, 30, 0.1)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {profile.description}
                  </p>
                </div>
              </section>

              {/* Portfolio Section - Smart Gallery */}
              {(portfolio.length > 0 || portfolioLoading) && (
                <section>
                  <div className="px-4 sm:px-5 lg:px-6 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="accent-line flex-1 max-w-[40px]" />
                      <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                        {locale === 'ka' ? 'ნამუშევრები' : 'Works'}
                      </h2>
                      {!portfolioLoading && portfolio.length > 0 && (
                        <span className="text-[10px] text-[var(--color-accent)] font-medium ml-auto">{portfolio.length} {locale === 'ka' ? 'პროექტი' : 'projects'}</span>
                      )}
                    </div>
                  </div>

                  {/* Portfolio Loading Skeleton */}
                  {portfolioLoading ? (
                    <div className="px-4 sm:px-5 lg:px-6">
                      <div className="flex gap-3.5 overflow-hidden">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="flex-shrink-0 w-[160px] sm:w-[180px] aspect-[3/4] rounded-[14px] overflow-hidden relative"
                            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                          >
                            <div
                              className="absolute inset-0"
                              style={{
                                background: 'linear-gradient(90deg, transparent 0%, var(--color-bg-secondary) 50%, transparent 100%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite linear',
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : portfolio.length > 0 ? (
                    /* Portfolio Gallery - Simple scrollable */
                    <div
                      ref={portfolioContainerRef}
                      className={`portfolio-scroll-container ${portfolioFits ? 'centered' : ''}`}
                    >
                      {portfolio.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => setSelectedProject(item)}
                          className="portfolio-slide group/card"
                        >
                          <div className="absolute inset-0 bg-[var(--color-bg-tertiary)]">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white text-xs font-medium line-clamp-2 leading-snug drop-shadow-sm">
                              {item.title}
                            </p>
                          </div>
                          {item.beforeImage && item.afterImage && (
                            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-white/95 text-[8px] font-bold uppercase rounded-md text-neutral-700 shadow-sm backdrop-blur-sm">
                              B/A
                            </div>
                          )}
                          {item.images && item.images.length > 1 && (
                            <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 bg-black/50 text-[9px] font-medium rounded-md text-white/90 backdrop-blur-sm flex items-center gap-1">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {item.images.length}
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
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
                                    onClick={(e) => { e.stopPropagation(); openGallery(review.workImages!, imgIdx); }}
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

      {/* Immersive Gallery Viewer */}
      {isGalleryOpen && galleryImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex flex-col gallery-overlay"
          style={{ background: 'rgba(0, 0, 0, 0.97)' }}
          onClick={closeGallery}
        >
          {/* Ambient glow effect from image */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: `radial-gradient(ellipse at center, rgba(200, 114, 89, 0.2) 0%, transparent 70%)`,
              filter: 'blur(100px)',
            }}
          />

          {/* Top Controls */}
          <div className="relative z-10 flex items-center justify-between p-4 sm:p-6 gallery-controls">
            {/* Image counter */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10">
                <span className="gallery-counter text-sm font-medium text-white/90">
                  {galleryIndex + 1} / {galleryImages.length}
                </span>
              </div>
              {galleryImages.length > 1 && (
                <p className="hidden sm:block text-xs text-white/40">
                  {locale === 'ka' ? 'გამოიყენე ისრები ნავიგაციისთვის' : 'Use arrow keys to navigate'}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={closeGallery}
              className="gallery-nav-btn w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Main Image Area */}
          <div
            className="flex-1 flex items-center justify-center px-4 sm:px-16 relative"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleGalleryTouchStart}
            onTouchEnd={handleGalleryTouchEnd}
          >
            {/* Previous Button */}
            {galleryImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigateGallery('prev'); }}
                className="gallery-nav-btn absolute left-3 sm:left-8 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white/70 hover:text-white"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Image Container */}
            <div
              key={galleryIndex}
              className="gallery-image-container max-w-full max-h-full flex items-center justify-center"
            >
              <img
                src={galleryImages[galleryIndex]}
                alt={`Image ${galleryIndex + 1}`}
                className="max-w-full max-h-[75vh] sm:max-h-[80vh] object-contain rounded-lg sm:rounded-xl shadow-2xl"
                style={{
                  boxShadow: '0 25px 100px -20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                }}
              />
            </div>

            {/* Next Button */}
            {galleryImages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigateGallery('next'); }}
                className="gallery-nav-btn absolute right-3 sm:right-8 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white/70 hover:text-white"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="relative z-10 p-4 sm:p-6 gallery-controls" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide py-2 px-4">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setGalleryIndex(idx)}
                    className={`gallery-thumbnail flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden ${
                      idx === galleryIndex ? 'active' : 'opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Touch swipe hint for mobile */}
          {galleryImages.length > 1 && (
            <div className="sm:hidden absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-xs text-white/50 gallery-controls">
              {locale === 'ka' ? 'გადაფურცლე' : 'Swipe to navigate'}
            </div>
          )}
        </div>
      )}

      {/* Project Modal - Terracotta Transparent Design */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedProject(null)}
        >
          {/* Backdrop with terracotta tint */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          <div
            className="relative w-full sm:max-w-[520px] max-h-[95vh] sm:max-h-[92vh] overflow-hidden flex flex-col project-modal-enter bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t sm:border border-[#D2691E]/20 dark:border-[#CD853F]/20 sm:rounded-2xl rounded-t-2xl"
            style={{
              boxShadow: '0 -10px 60px -15px rgba(210, 105, 30, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag indicator */}
            <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 z-20 w-10 h-1 bg-[#D2691E]/30 rounded-full" />

            {/* Hero Image Section - Taller and more cinematic */}
            <div className="relative aspect-[4/3] sm:aspect-[16/9] flex-shrink-0 overflow-hidden">
              {selectedProject.beforeImage && selectedProject.afterImage ? (
                /* Before/After Comparison Slider */
                <div
                  className="relative w-full h-full cursor-ew-resize select-none"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
                    setSliderPos(x);
                  }}
                  onTouchMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(5, Math.min(95, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
                    setSliderPos(x);
                  }}
                >
                  <img src={selectedProject.afterImage} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                    <img src={selectedProject.beforeImage} alt="Before" className="absolute inset-0 h-full object-cover" style={{ width: `${10000 / sliderPos}%`, maxWidth: 'none' }} />
                  </div>
                  {/* Slider handle - refined design */}
                  <div className="absolute inset-y-0" style={{ left: `${sliderPos}%` }}>
                    <div className="absolute inset-y-0 w-[2px] bg-white -translate-x-1/2" style={{ boxShadow: '0 0 20px rgba(255,255,255,0.5)' }} />
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-white flex items-center justify-center" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                      <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </div>
                  {/* Minimal corner labels */}
                  <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-white/90" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                    {locale === 'ka' ? 'მანამდე' : 'Before'}
                  </div>
                  <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-white" style={{ background: 'var(--color-accent)' }}>
                    {locale === 'ka' ? 'შემდეგ' : 'After'}
                  </div>
                </div>
              ) : (
                /* Regular image with gradient overlay */
                <div className="relative w-full h-full group">
                  <img
                    src={selectedProject.imageUrl}
                    alt={selectedProject.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-zoom-in"
                    onClick={() => {
                      const allImages = [selectedProject.imageUrl];
                      if (selectedProject.images) {
                        allImages.push(...selectedProject.images.filter(img => img !== selectedProject.imageUrl));
                      }
                      openGallery(allImages, 0);
                    }}
                  />
                  {/* Cinematic gradient overlay */}
                  <div className="absolute inset-0 project-hero-gradient pointer-events-none" />

                  {/* Title overlaid on hero for cinematic effect */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex-1">
                        {/* Project type indicator */}
                        {selectedProject.projectType && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md mb-2 meta-chip">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              selectedProject.projectType === 'job' ? 'bg-blue-400' :
                              selectedProject.projectType === 'project' ? 'bg-purple-400' : 'bg-amber-400'
                            }`} />
                            <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
                              {selectedProject.projectType === 'job'
                                ? (locale === 'ka' ? 'სამუშაო' : 'Job')
                                : selectedProject.projectType === 'project'
                                  ? (locale === 'ka' ? 'პროექტი' : 'Project')
                                  : (locale === 'ka' ? 'სწრაფი' : 'Quick')}
                            </span>
                          </div>
                        )}
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight project-title-glow">
                          {selectedProject.title}
                        </h3>
                      </div>

                      {/* Status badge */}
                      {selectedProject.status && (
                        <div
                          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            selectedProject.status === 'completed'
                              ? 'bg-[#D2691E] text-white'
                              : 'bg-[#CD853F]/80 text-white'
                          }`}
                        >
                          {selectedProject.status === 'completed'
                            ? (locale === 'ka' ? 'დასრულებული' : 'Done')
                            : (locale === 'ka' ? 'მიმდინარე' : 'Active')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Close button - floating glass effect */}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:scale-110 transition-all duration-300 z-10"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Gallery indicator if multiple images */}
              {selectedProject.images && selectedProject.images.length > 0 && !(selectedProject.beforeImage && selectedProject.afterImage) && (
                <button
                  onClick={() => {
                    const allImages = [selectedProject.imageUrl];
                    if (selectedProject.images) {
                      allImages.push(...selectedProject.images.filter(img => img !== selectedProject.imageUrl));
                    }
                    openGallery(allImages, 0);
                  }}
                  className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg text-white/90 hover:text-white transition-all duration-300"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium">{selectedProject.images.length + 1}</span>
                </button>
              )}
            </div>

            {/* Content Section - Clean editorial layout */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="p-5 sm:p-6 space-y-5">

                {/* Meta info row - only show if has before/after (title not shown in hero) */}
                {selectedProject.beforeImage && selectedProject.afterImage && (
                  <div>
                    <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)] leading-tight mb-3">
                      {selectedProject.title}
                    </h3>
                  </div>
                )}

                {/* Contextual metadata chips */}
                {(selectedProject.location || selectedProject.completedDate || selectedProject.duration || selectedProject.category) && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.category && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D2691E]/10 dark:bg-[#CD853F]/15 border border-[#D2691E]/15 dark:border-[#CD853F]/20">
                        <span className="text-xs font-semibold text-[#D2691E] dark:text-[#CD853F]">{getCategoryLabel(selectedProject.category)}</span>
                      </div>
                    )}
                    {selectedProject.location && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-gray-800/40 border border-[#D2691E]/10 dark:border-[#CD853F]/15">
                        <svg className="w-3.5 h-3.5 text-[#D2691E]/60 dark:text-[#CD853F]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="text-xs text-[var(--color-text-secondary)]">{selectedProject.location}</span>
                      </div>
                    )}
                    {selectedProject.completedDate && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-gray-800/40 border border-[#D2691E]/10 dark:border-[#CD853F]/15">
                        <svg className="w-3.5 h-3.5 text-[#D2691E]/60 dark:text-[#CD853F]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          {new Date(selectedProject.completedDate).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {selectedProject.duration && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-gray-800/40 border border-[#D2691E]/10 dark:border-[#CD853F]/15">
                        <svg className="w-3.5 h-3.5 text-[#D2691E]/60 dark:text-[#CD853F]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-[var(--color-text-secondary)]">{selectedProject.duration}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Description with refined typography */}
                {selectedProject.description && (
                  <div className="relative">
                    <p
                      className="text-sm leading-[1.8] whitespace-pre-wrap"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {selectedProject.description}
                    </p>
                  </div>
                )}

                {/* Tags - Refined minimal style */}
                {selectedProject.tags && selectedProject.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProject.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="tag-pill px-2.5 py-1 text-[11px] font-medium rounded-md text-[var(--color-text-secondary)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Client Review - Editorial quote style */}
                {selectedProject.review && (
                  <div className="relative p-5 rounded-2xl overflow-hidden bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border border-[#D2691E]/10 dark:border-[#CD853F]/15">
                    {/* Decorative accent line */}
                    <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-[#D2691E]" />

                    <p
                      className="text-sm leading-relaxed mb-4 pl-2"
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontStyle: 'italic'
                      }}
                    >
                      {selectedProject.review}
                    </p>

                    <div className="flex items-center gap-3 pl-2">
                      {selectedProject.clientAvatar ? (
                        <img
                          src={selectedProject.clientAvatar}
                          alt={selectedProject.clientName || ''}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-[#D2691E]/20"
                        />
                      ) : selectedProject.clientName && (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white bg-[#D2691E]">
                          {selectedProject.clientName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {selectedProject.clientName && (
                          <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                            {selectedProject.clientName}
                          </p>
                        )}
                        {selectedProject.clientCity && (
                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            {selectedProject.clientCity}
                          </p>
                        )}
                      </div>
                      {selectedProject.rating && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#D2691E]/10 border border-[#D2691E]/10">
                          <svg className="w-3.5 h-3.5 text-[#D2691E]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-bold text-[#D2691E]">{selectedProject.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Gallery - Masonry-inspired layout */}
                {selectedProject.images && selectedProject.images.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-[#D2691E]/20 dark:bg-[#CD853F]/20" />
                      <span className="text-[10px] uppercase tracking-[0.15em] text-[#D2691E]/50 dark:text-[#CD853F]/50 font-medium">
                        {locale === 'ka' ? 'გალერეა' : 'Gallery'}
                      </span>
                      <div className="h-px flex-1 bg-[#D2691E]/20 dark:bg-[#CD853F]/20" />
                    </div>

                    <div className={`grid gap-2 ${
                      selectedProject.images.length === 1 ? 'grid-cols-1' :
                      selectedProject.images.length === 2 ? 'grid-cols-2' :
                      selectedProject.images.length === 4 ? 'grid-cols-2' :
                      'grid-cols-3'
                    }`}>
                      {selectedProject.images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => openGallery(selectedProject.images!, idx)}
                          className={`gallery-thumb relative overflow-hidden cursor-pointer rounded-xl bg-[var(--color-bg-tertiary)] ${
                            selectedProject.images!.length === 1 ? 'aspect-video' :
                            selectedProject.images!.length === 2 ? 'aspect-[4/3]' :
                            idx === 0 && selectedProject.images!.length === 3 ? 'col-span-2 row-span-2 aspect-square' :
                            'aspect-square'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${selectedProject.title} - ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/0 hover:bg-white/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300">
                              <svg className="w-5 h-5 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
