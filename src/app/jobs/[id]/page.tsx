'use client';

import AppBackground from '@/components/common/AppBackground';
import Header from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

interface Reference {
  type: 'link' | 'image' | 'pinterest' | 'instagram';
  url: string;
  title?: string;
  thumbnail?: string;
}

interface Proposal {
  _id: string;
  coverLetter: string;
  proposedPrice?: number;
  estimatedDuration?: number;
  estimatedDurationUnit?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  location: string;
  propertyType?: 'apartment' | 'office' | 'building' | 'house' | 'other';
  areaSize?: number;
  sizeUnit?: 'sqm' | 'room' | 'unit' | 'floor' | 'item';
  roomCount?: number;
  budgetType: 'fixed' | 'range' | 'per_sqm' | 'negotiable';
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
  pricePerUnit?: number;
  cadastralId?: string;
  landArea?: string;
  floorCount?: number;
  projectPhase?: string;
  permitRequired?: boolean;
  currentCondition?: string;
  zoningType?: string;
  designStyle?: string;
  roomsToDesign?: string[];
  furnitureIncluded?: boolean;
  visualizationNeeded?: boolean;
  references?: Reference[];
  preferredColors?: string[];
  existingFurniture?: string;
  workTypes?: string[];
  materialsProvided?: boolean;
  materialsNote?: string;
  occupiedDuringWork?: boolean;
  deadline?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  images: string[];
  media: MediaItem[];
  proposalCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  clientId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    city?: string;
    phone?: string;
    accountType?: 'individual' | 'organization';
    companyName?: string;
  };
}

// Category translations
const categoryMap: Record<string, string> = {
  'architecture': 'არქიტექტურა',
  'interior-design': 'ინტერიერის დიზაინი',
  'craftsmen': 'ხელოსანი',
  'home-care': 'სერვისები',
  'renovation': 'რემონტი',
  'construction': 'მშენებლობა',
  'electrical': 'ელექტრობა',
  'plumbing': 'სანტექნიკა',
  'carpentry': 'ხის სამუშაოები',
  'painting': 'მოხატვა',
  'flooring': 'იატაკის სამუშაოები',
  'roofing': 'სახურავი',
  'landscaping': 'ლანდშაფტი',
  'smart-home': 'სმარტ სახლი',
  'furniture': 'ავეჯი',
  'cleaning': 'დასუფთავება',
};

// Property type translations
const propertyTypeMap: Record<string, string> = {
  'apartment': 'ბინა',
  'house': 'სახლი',
  'office': 'ოფისი',
  'building': 'შენობა',
  'other': 'სხვა',
};

// Status translations
const statusMap: Record<string, { label: string; color: string }> = {
  'open': { label: 'აქტიური', color: 'bg-terracotta-500/10 text-terracotta-600 dark:text-terracotta-400' },
  'in_progress': { label: 'მიმდინარე', color: 'bg-terracotta-400/10 text-terracotta-500 dark:text-terracotta-400' },
  'completed': { label: 'დასრულებული', color: 'bg-neutral-500/10 text-neutral-500' },
  'cancelled': { label: 'გაუქმებული', color: 'bg-red-500/10 text-red-500' },
};

// Work types translations
const workTypeMap: Record<string, string> = {
  'Demolition': 'დემონტაჟი',
  'Wall Construction': 'კედლების აშენება',
  'Electrical': 'ელექტროობა',
  'Plumbing': 'სანტექნიკა',
  'Flooring': 'იატაკი',
  'Painting': 'შეღებვა',
  'Tiling': 'კაფელი',
  'Ceiling': 'ჭერი',
  'Windows & Doors': 'ფანჯრები და კარები',
  'HVAC': 'კონდიცირება/გათბობა',
};

// Skills/subcategory translations
const skillMap: Record<string, string> = {
  // Craftsmen subcategories
  'electrical': 'ელექტრიკოსი',
  'plumbing': 'სანტექნიკოსი',
  'painting': 'მხატვარი',
  'tiling': 'მოკაფელე',
  'flooring': 'იატაკის სპეციალისტი',
  'plastering': 'მლესავი',
  'carpentry': 'დურგალი',
  'welding': 'შემდუღებელი',
  'hvac': 'გათბობა/გაგრილება',
  'roofing': 'გადამხურავი',
  // Home care subcategories
  'cleaning': 'დალაგება',
  'moving': 'გადაზიდვა',
  'gardening': 'მებაღეობა',
  'appliance-repair': 'ტექნიკის შეკეთება',
  'pest-control': 'დეზინსექცია',
  'window-cleaning': 'ფანჯრების წმენდა',
  // Interior design subcategories
  'interior': 'ინტერიერი',
  'exterior': 'ექსტერიერი',
  'landscape-design': 'ლანდშაფტის დიზაინი',
  '3d-visualization': '3D ვიზუალიზაცია',
  'furniture-design': 'ავეჯის დიზაინი',
  // Architecture subcategories
  'residential-arch': 'საცხოვრებელი',
  'commercial-arch': 'კომერციული',
  'industrial-arch': 'სამრეწველო',
  'reconstruction': 'რეკონსტრუქცია',
  'project-documentation': 'საპროექტო დოკუმენტაცია',
  // Design styles
  'Modern': 'მოდერნი',
  'Minimalist': 'მინიმალისტური',
  'Classic': 'კლასიკური',
  'Scandinavian': 'სკანდინავიური',
  'Industrial': 'ინდუსტრიული',
  'Bohemian': 'ბოჰემური',
  'Mid-Century Modern': 'შუა საუკუნის მოდერნი',
  'Contemporary': 'თანამედროვე',
  'Traditional': 'ტრადიციული',
  'Rustic': 'რუსტიკული',
  // Rooms
  'Living Room': 'მისაღები',
  'Bedroom': 'საძინებელი',
  'Kitchen': 'სამზარეულო',
  'Bathroom': 'სააბაზანო',
  'Dining Room': 'სასადილო',
  'Home Office': 'სამუშაო ოთახი',
  'Kids Room': 'საბავშვო',
  'Hallway': 'დერეფანი',
  'Balcony': 'აივანი',
  'Entire Space': 'მთლიანი სივრცე',
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myProposal, setMyProposal] = useState<Proposal | null>(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalData, setProposalData] = useState({
    coverLetter: '',
    proposedPrice: '',
    estimatedDuration: '',
    estimatedDurationUnit: 'days',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Combine all media
  const allMedia: MediaItem[] = job ? [
    ...(job.media || []),
    ...(job.images || []).filter(img => !job.media?.some(m => m.url === img)).map(url => ({ type: 'image' as const, url }))
  ] : [];

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${params.id}`);
        if (!response.ok) throw new Error('Job not found');
        const data = await response.json();
        setJob(data);
        setTimeout(() => setIsVisible(true), 100);
      } catch (err) {
        console.error('Failed to fetch job:', err);
        router.push('/browse');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchJob();
    }
  }, [params.id, router]);

  // Update document title when job loads
  useEffect(() => {
    if (job?.title) {
      document.title = `${job.title} | Homico`;
    }
    return () => {
      document.title = 'Homico - იპოვე შენი იდეალური სახლის პროფესიონალი';
    };
  }, [job?.title]);

  useEffect(() => {
    const fetchMyProposal = async () => {
      if (!user || user.role !== 'pro' || !params.id) return;

      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${params.id}/my-proposal`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setMyProposal(data);
        }
      } catch (err) {
        console.error('Failed to fetch my proposal:', err);
      }
    };

    if (user?.role === 'pro') {
      fetchMyProposal();
    }
  }, [user, params.id]);

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${params.id}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...proposalData,
          proposedPrice: proposalData.proposedPrice ? parseFloat(proposalData.proposedPrice) : undefined,
          estimatedDuration: proposalData.estimatedDuration ? parseInt(proposalData.estimatedDuration) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit proposal');
      }

      setSuccess('წინადადება წარმატებით გაიგზავნა');
      setShowProposalForm(false);
      setMyProposal(data);
      const jobResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${params.id}`);
      const jobData = await jobResponse.json();
      setJob(jobData);
    } catch (err: any) {
      setError(err.message || 'Failed to submit proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBudget = (job: Job) => {
    switch (job.budgetType) {
      case 'fixed':
        return job.budgetAmount ? `${job.budgetAmount.toLocaleString()} ₾` : null;
      case 'range':
        return job.budgetMin && job.budgetMax ? `${job.budgetMin.toLocaleString()} - ${job.budgetMax.toLocaleString()} ₾` : null;
      case 'per_sqm':
        return job.pricePerUnit ? `${job.pricePerUnit} ₾/მ²` : null;
      case 'negotiable':
        return 'შეთანხმებით';
      default:
        return null;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 60) return `${diffInMins} წუთის წინ`;
    if (diffInHours < 24) return `${diffInHours} საათის წინ`;
    if (diffInDays < 7) return `${diffInDays} დღის წინ`;
    return date.toLocaleDateString('ka-GE');
  };

  const nextMedia = () => {
    if (allMedia.length > 0) {
      setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
      setIsVideoPlaying(false);
    }
  };

  const prevMedia = () => {
    if (allMedia.length > 0) {
      setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
      setIsVideoPlaying(false);
    }
  };

  const currentMedia = allMedia[currentMediaIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <AppBackground />
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          {/* Skeleton loader */}
          <div className="animate-pulse">
            <div className="h-4 w-24 rounded-full mb-6 sm:mb-8" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
            <div className="h-7 sm:h-8 w-3/4 rounded-lg mb-3 sm:mb-4" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
            <div className="h-5 w-1/2 rounded-lg mb-8 sm:mb-12" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
            <div className="aspect-[4/3] sm:aspect-[16/9] rounded-xl sm:rounded-2xl mb-8 sm:mb-12" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
            <div className="space-y-3">
              <div className="h-4 w-full rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
              <div className="h-4 w-5/6 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
              <div className="h-4 w-4/6 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const budgetDisplay = formatBudget(job);
  const statusInfo = statusMap[job.status] || statusMap['open'];

  return (
    <div className="min-h-screen relative">
      <AppBackground />
      <Header />

      {/* Success Toast */}
      {success && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 bg-white dark:bg-neutral-900 border border-terracotta-200/50 dark:border-terracotta-700/30">
            <div className="w-5 h-5 rounded-full bg-terracotta-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-white">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-2 p-1 rounded-lg transition-colors text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <main ref={contentRef} className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Hero Section */}
        <div className="relative" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-4 sm:mb-6">
              <Link
                href="/browse"
                className="transition-colors duration-200 flex items-center gap-1.5 group touch-manipulation"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                სამუშაოები
              </Link>
            </nav>

            {/* Title & Meta */}
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {getTimeAgo(job.createdAt)}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight mb-3 sm:mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {job.location && (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {job.viewCount} ნახვა
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {job.proposalCount} წინადადება
                  </span>
                </div>
              </div>

              {/* Budget Card */}
              {budgetDisplay && (
                <div className="flex-shrink-0 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                  <p className="text-xs uppercase tracking-wider mb-1 text-terracotta-500/70 dark:text-terracotta-400/70">ბიუჯეტი</p>
                  <p className="text-lg sm:text-xl font-semibold text-terracotta-600 dark:text-terracotta-400">{budgetDisplay}</p>
                  {job.budgetType === 'per_sqm' && job.areaSize && job.pricePerUnit && (
                    <p className="text-sm mt-1 text-terracotta-500/60 dark:text-terracotta-400/60">
                      ≈ {(job.areaSize * job.pricePerUnit).toLocaleString()} ₾ სულ
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* My Proposal Banner */}
          {myProposal && user?.role === 'pro' && (
            <div className="mb-6 sm:mb-10 rounded-xl sm:rounded-2xl overflow-hidden animate-fade-in bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
              <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terracotta-200/30 dark:border-terracotta-700/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl flex items-center justify-center bg-terracotta-500 flex-shrink-0 shadow-md shadow-terracotta-500/20">
                    <svg className="w-4 sm:w-5 h-4 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base text-neutral-900 dark:text-white">თქვენი წინადადება</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">გაგზავნილია {getTimeAgo(myProposal.createdAt)}</p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium self-start sm:self-center ${
                  myProposal.status === 'pending' ? 'bg-terracotta-400/10 text-terracotta-500 dark:text-terracotta-400' :
                  myProposal.status === 'accepted' ? 'bg-terracotta-500/10 text-terracotta-600 dark:text-terracotta-400' :
                  'bg-red-500/10 text-red-500'
                }`}>
                  {myProposal.status === 'pending' ? 'განხილვაში' : myProposal.status === 'accepted' ? 'მიღებული' : myProposal.status === 'rejected' ? 'უარყოფილი' : 'გაუქმებული'}
                </span>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{myProposal.coverLetter}</p>
                {(myProposal.proposedPrice || myProposal.estimatedDuration) && (
                  <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 flex flex-wrap gap-6 sm:gap-8 border-t border-terracotta-200/30 dark:border-terracotta-700/20">
                    {myProposal.proposedPrice && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-terracotta-500/60 dark:text-terracotta-400/60">თქვენი ფასი</p>
                        <p className="text-base sm:text-lg font-semibold mt-1 text-terracotta-600 dark:text-terracotta-400">{myProposal.proposedPrice.toLocaleString()} ₾</p>
                      </div>
                    )}
                    {myProposal.estimatedDuration && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-terracotta-500/60 dark:text-terracotta-400/60">ვადა</p>
                        <p className="text-base sm:text-lg font-semibold mt-1 text-neutral-900 dark:text-white">
                          {myProposal.estimatedDuration} {myProposal.estimatedDurationUnit === 'days' ? 'დღე' : myProposal.estimatedDurationUnit === 'weeks' ? 'კვირა' : 'თვე'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-10">
              {/* Media Gallery */}
              {allMedia.length > 0 && (
                <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                  <div className="aspect-[4/3] sm:aspect-[16/10] relative group">
                    {currentMedia?.type === 'video' ? (
                      <div className="w-full h-full relative" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                        {isVideoPlaying ? (
                          <video src={storage.getFileUrl(currentMedia.url)} className="w-full h-full object-contain" controls autoPlay onEnded={() => setIsVideoPlaying(false)} />
                        ) : (
                          <>
                            {currentMedia.thumbnail ? (
                              <img src={storage.getFileUrl(currentMedia.thumbnail)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                                <svg className="w-16 h-16" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <button onClick={() => setIsVideoPlaying(true)} className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                <svg className="w-6 h-6 ml-1" style={{ color: 'var(--color-text-primary)' }} fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <img
                        src={currentMedia ? storage.getFileUrl(currentMedia.url) : ''}
                        alt=""
                        className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300"
                        onClick={() => currentMedia && setSelectedMedia(currentMedia)}
                      />
                    )}
                    {allMedia.length > 1 && (
                      <>
                        <button
                          onClick={prevMedia}
                          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-9 sm:w-10 h-9 sm:h-10 rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 active:scale-95 sm:hover:scale-105 touch-manipulation"
                          style={{ backgroundColor: 'var(--color-bg-elevated)', boxShadow: 'var(--shadow-md)' }}
                        >
                          <svg className="w-4 sm:w-5 h-4 sm:h-5" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={nextMedia}
                          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-9 sm:w-10 h-9 sm:h-10 rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 active:scale-95 sm:hover:scale-105 touch-manipulation"
                          style={{ backgroundColor: 'var(--color-bg-elevated)', boxShadow: 'var(--shadow-md)' }}
                        >
                          <svg className="w-4 sm:w-5 h-4 sm:h-5" style={{ color: 'var(--color-text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}>
                          {currentMediaIndex + 1} / {allMedia.length}
                        </div>
                      </>
                    )}
                  </div>
                  {allMedia.length > 1 && (
                    <div className="flex gap-2 p-2 sm:p-3 overflow-x-auto scrollbar-none snap-x snap-mandatory" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                      {allMedia.map((media, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setCurrentMediaIndex(idx); setIsVideoPlaying(false); }}
                          className={`flex-shrink-0 w-14 sm:w-16 h-14 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden transition-all duration-200 snap-start touch-manipulation ${
                            idx === currentMediaIndex ? 'ring-2 ring-offset-1 sm:ring-offset-2 ring-terracotta-500' : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          {media.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                              <svg className="w-4 sm:w-5 h-4 sm:h-5" style={{ color: 'var(--color-text-muted)' }} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          ) : (
                            <img src={storage.getFileUrl(media.url)} alt="" className="w-full h-full object-cover" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Specifications Grid */}
              {(job.propertyType || job.areaSize || job.roomCount || job.floorCount || job.deadline) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {job.propertyType && (
                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider mb-1 text-terracotta-500/60 dark:text-terracotta-400/60">ტიპი</p>
                      <p className="font-medium text-sm sm:text-base text-neutral-900 dark:text-white">{propertyTypeMap[job.propertyType] || job.propertyType}</p>
                    </div>
                  )}
                  {job.areaSize && (
                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider mb-1 text-terracotta-500/60 dark:text-terracotta-400/60">ფართი</p>
                      <p className="font-medium text-sm sm:text-base text-neutral-900 dark:text-white">{job.areaSize} მ²</p>
                    </div>
                  )}
                  {job.roomCount && (
                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider mb-1 text-terracotta-500/60 dark:text-terracotta-400/60">ოთახები</p>
                      <p className="font-medium text-sm sm:text-base text-neutral-900 dark:text-white">{job.roomCount}</p>
                    </div>
                  )}
                  {job.floorCount && (
                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider mb-1 text-terracotta-500/60 dark:text-terracotta-400/60">სართულები</p>
                      <p className="font-medium text-sm sm:text-base text-neutral-900 dark:text-white">{job.floorCount}</p>
                    </div>
                  )}
                  {job.deadline && (
                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider mb-1 text-terracotta-500/60 dark:text-terracotta-400/60">ვადა</p>
                      <p className="font-medium text-sm sm:text-base text-neutral-900 dark:text-white">
                        {new Date(job.deadline).toLocaleDateString('ka-GE', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {job.description && (
                <section className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-[3px] w-5 rounded-full bg-terracotta-500" />
                    <h2 className="text-xs uppercase tracking-wider font-medium text-terracotta-500/70 dark:text-terracotta-400/70">აღწერა</h2>
                  </div>
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                    {job.description}
                  </p>
                </section>
              )}

              {/* Work Types */}
              {job.workTypes && job.workTypes.length > 0 && (
                <section className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-[3px] w-5 rounded-full bg-terracotta-500" />
                    <h2 className="text-xs uppercase tracking-wider font-medium text-terracotta-500/70 dark:text-terracotta-400/70">სამუშაოს ტიპები</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.workTypes.map((type) => (
                      <span key={type} className="text-sm px-3 py-1.5 rounded-lg bg-terracotta-50 dark:bg-terracotta-500/10 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200/50 dark:border-terracotta-700/30 transition-colors hover:bg-terracotta-100 dark:hover:bg-terracotta-500/20">
                        {workTypeMap[type] || type}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Design Style & Rooms */}
              {(job.designStyle || (job.roomsToDesign && job.roomsToDesign.length > 0)) && (
                <section className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-[3px] w-5 rounded-full bg-terracotta-500" />
                    <h2 className="text-xs uppercase tracking-wider font-medium text-terracotta-500/70 dark:text-terracotta-400/70">დიზაინის დეტალები</h2>
                  </div>
                  <div className="space-y-4">
                    {job.designStyle && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">სტილი:</span>
                        <span className="text-sm font-medium px-3 py-1 rounded-lg bg-terracotta-100/70 dark:bg-terracotta-500/15 text-terracotta-600 dark:text-terracotta-400 border border-terracotta-200/50 dark:border-terracotta-600/30">
                          {skillMap[job.designStyle] || job.designStyle}
                        </span>
                      </div>
                    )}
                    {job.roomsToDesign && job.roomsToDesign.length > 0 && (
                      <div>
                        <span className="text-sm block mb-2 text-neutral-500 dark:text-neutral-400">ოთახები:</span>
                        <div className="flex flex-wrap gap-2">
                          {job.roomsToDesign.map((room) => (
                            <span key={room} className="text-sm px-3 py-1.5 rounded-lg bg-terracotta-50 dark:bg-terracotta-500/10 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200/50 dark:border-terracotta-700/30 transition-colors hover:bg-terracotta-100 dark:hover:bg-terracotta-500/20">
                              {skillMap[room] || room}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Additional Features */}
              {(job.furnitureIncluded || job.visualizationNeeded || job.materialsProvided !== undefined || job.occupiedDuringWork) && (
                <section className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-[3px] w-5 rounded-full bg-terracotta-500" />
                    <h2 className="text-xs uppercase tracking-wider font-medium text-terracotta-500/70 dark:text-terracotta-400/70">დამატებითი ინფორმაცია</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.furnitureIncluded && (
                      <span className="text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 bg-terracotta-50 dark:bg-terracotta-500/10 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200/50 dark:border-terracotta-700/30">
                        <svg className="w-4 h-4 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        ავეჯის შერჩევა
                      </span>
                    )}
                    {job.visualizationNeeded && (
                      <span className="text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 bg-terracotta-50 dark:bg-terracotta-500/10 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200/50 dark:border-terracotta-700/30">
                        <svg className="w-4 h-4 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        3D ვიზუალიზაცია
                      </span>
                    )}
                    {job.materialsProvided && (
                      <span className="text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 bg-terracotta-50 dark:bg-terracotta-500/10 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200/50 dark:border-terracotta-700/30">
                        <svg className="w-4 h-4 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        მასალები უზრუნველყოფილია
                      </span>
                    )}
                    {job.occupiedDuringWork && (
                      <span className="text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-700/30">
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        დაკავებული სამუშაოს დროს
                      </span>
                    )}
                  </div>
                </section>
              )}

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <section className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-[3px] w-5 rounded-full bg-terracotta-500" />
                    <h2 className="text-xs uppercase tracking-wider font-medium text-terracotta-500/70 dark:text-terracotta-400/70">უნარები</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <span key={skill} className="text-sm px-3 py-1.5 rounded-lg bg-terracotta-50 dark:bg-terracotta-500/10 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200/50 dark:border-terracotta-700/30 transition-colors hover:bg-terracotta-100 dark:hover:bg-terracotta-500/20">
                        {skillMap[skill] || skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* References */}
              {job.references && job.references.length > 0 && (
                <section className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-[3px] w-5 rounded-full bg-terracotta-500" />
                    <h2 className="text-xs uppercase tracking-wider font-medium text-terracotta-500/70 dark:text-terracotta-400/70">რეფერენსები</h2>
                  </div>
                  <div className="grid gap-2">
                    {job.references.map((ref, idx) => (
                      <a
                        key={idx}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group hover:scale-[1.01] bg-terracotta-50/50 dark:bg-terracotta-500/5 border border-terracotta-200/30 dark:border-terracotta-700/20 hover:border-terracotta-300 dark:hover:border-terracotta-600/50 hover:bg-terracotta-100/50 dark:hover:bg-terracotta-500/10"
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-terracotta-100/70 dark:bg-terracotta-500/15">
                          {ref.type === 'pinterest' ? (
                            <svg className="w-5 h-5" style={{ color: '#E60023' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
                          ) : ref.type === 'instagram' ? (
                            <svg className="w-5 h-5" style={{ color: '#E4405F' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                          ) : (
                            <svg className="w-5 h-5 text-terracotta-500 dark:text-terracotta-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-terracotta-600 dark:group-hover:text-terracotta-400 transition-colors text-neutral-900 dark:text-white">
                            {ref.title || new URL(ref.url).hostname}
                          </p>
                          <p className="text-xs truncate text-neutral-500 dark:text-neutral-400">{ref.url}</p>
                        </div>
                        <svg className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition-transform text-terracotta-400/50 dark:text-terracotta-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Proposal Form */}
              {user?.role === 'pro' && job.status === 'open' && !myProposal && (
                <section className="pt-8 border-t border-terracotta-200/30 dark:border-terracotta-700/20">
                  {!showProposalForm ? (
                    <button
                      onClick={() => setShowProposalForm(true)}
                      className="w-full py-4 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] bg-terracotta-500 hover:bg-terracotta-600 text-white shadow-md shadow-terracotta-500/25"
                    >
                      წინადადების გაგზავნა
                    </button>
                  ) : (
                    <form onSubmit={handleSubmitProposal} className="p-6 rounded-2xl space-y-6 animate-fade-in bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>წინადადების გაგზავნა</h2>
                        <button type="button" onClick={() => setShowProposalForm(false)} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {error && (
                        <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                          {error}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                          სამოტივაციო წერილი
                        </label>
                        <textarea
                          rows={5}
                          required
                          value={proposalData.coverLetter}
                          onChange={(e) => setProposalData({ ...proposalData, coverLetter: e.target.value })}
                          className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all resize-none"
                          style={{
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            '--tw-ring-color': 'var(--color-accent-soft)'
                          } as any}
                          placeholder="წარმოადგინეთ თქვენი გამოცდილება და მიდგომა ამ პროექტისთვის..."
                        />
                      </div>

                      <div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                              თქვენი შეთავაზება (₾)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={proposalData.proposedPrice}
                              onChange={(e) => setProposalData({ ...proposalData, proposedPrice: e.target.value })}
                              className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
                              style={{
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)'
                              }}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                              ვადა
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={proposalData.estimatedDuration}
                              onChange={(e) => setProposalData({ ...proposalData, estimatedDuration: e.target.value })}
                              className="w-full px-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
                              style={{
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)'
                              }}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                              ერთეული
                            </label>
                            <div className="relative">
                              <select
                                value={proposalData.estimatedDurationUnit}
                                onChange={(e) => setProposalData({ ...proposalData, estimatedDurationUnit: e.target.value })}
                                className="w-full px-4 py-3 pr-10 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all cursor-pointer appearance-none"
                                style={{
                                  border: '1px solid var(--color-border)',
                                  backgroundColor: 'var(--color-bg-primary)',
                                  color: 'var(--color-text-primary)'
                                }}
                              >
                                <option value="days">დღე</option>
                                <option value="weeks">კვირა</option>
                                <option value="months">თვე</option>
                              </select>
                              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] mt-2" style={{ color: 'var(--color-text-muted)' }}>მიუთითეთ თქვენი შეფასება და სავარაუდო შესრულების ვადა</p>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowProposalForm(false)}
                          className="flex-1 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 border border-terracotta-200/50 dark:border-terracotta-700/30 text-neutral-600 dark:text-neutral-400 hover:bg-terracotta-50 dark:hover:bg-terracotta-500/10"
                        >
                          გაუქმება
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 bg-terracotta-500 hover:bg-terracotta-600 text-white shadow-md shadow-terracotta-500/25"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              იგზავნება...
                            </span>
                          ) : 'გაგზავნა'}
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <div className="lg:sticky lg:top-24 space-y-3 sm:space-y-4">
                {/* Client Card */}
                {job.clientId && (
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-[3px] w-6 rounded-full bg-terracotta-500" />
                        <p className="text-xs uppercase tracking-wider font-medium text-terracotta-500/70 dark:text-terracotta-400/70">მაძიებელი</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-terracotta-100/50 dark:bg-terracotta-500/10 text-terracotta-600 dark:text-terracotta-400">
                        {job.clientId.accountType === 'organization' ? 'კომპანია' : 'ფიზიკური პირი'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {job.clientId.avatar ? (
                        <img src={job.clientId.avatar} alt="" className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl object-cover ring-2 ring-terracotta-200/50 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900" />
                      ) : (
                        <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl flex items-center justify-center text-base sm:text-lg font-semibold bg-terracotta-500 text-white shadow-md shadow-terracotta-500/20">
                          {job.clientId.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm sm:text-base text-neutral-900 dark:text-white">
                          {job.clientId.accountType === 'organization' ? job.clientId.companyName || job.clientId.name : job.clientId.name}
                        </p>
                        {job.clientId.city && (
                          <p className="text-sm truncate text-neutral-500 dark:text-neutral-400">{job.clientId.city}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Category & Quick Info - Combined on mobile */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
                  {/* Category */}
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25">
                    <p className="text-xs uppercase tracking-wider font-medium mb-1.5 sm:mb-2 text-terracotta-500/60 dark:text-terracotta-400/60">კატეგორია</p>
                    <p className="font-medium text-sm sm:text-base text-neutral-900 dark:text-white">
                      {categoryMap[job.category] || job.category}
                    </p>
                  </div>

                  {/* Quick Info */}
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/40 dark:bg-neutral-900/30 backdrop-blur-sm border border-terracotta-300/40 dark:border-terracotta-700/25 space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">ID</span>
                      <span className="font-mono text-xs text-terracotta-500/70 dark:text-terracotta-400/70">{job._id.slice(-8)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">თარიღი</span>
                      <span className="text-neutral-900 dark:text-white">{new Date(job.createdAt).toLocaleDateString('ka-GE')}</span>
                    </div>
                  </div>
                </div>

                {/* Back Link - Hidden on mobile (use browser back) */}
                <Link
                  href="/browse"
                  className="hidden lg:flex items-center justify-center gap-2 w-full py-3 text-sm font-medium rounded-xl transition-all duration-200 group touch-manipulation border border-terracotta-200/50 dark:border-terracotta-700/30 text-terracotta-600 dark:text-terracotta-400 hover:bg-terracotta-50 dark:hover:bg-terracotta-500/10"
                >
                  <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  ყველა სამუშაო
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={storage.getFileUrl(selectedMedia.url)}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {allMedia.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); const idx = (currentMediaIndex - 1 + allMedia.length) % allMedia.length; setCurrentMediaIndex(idx); setSelectedMedia(allMedia[idx]); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); const idx = (currentMediaIndex + 1) % allMedia.length; setCurrentMediaIndex(idx); setSelectedMedia(allMedia[idx]); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                {currentMediaIndex + 1} / {allMedia.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
