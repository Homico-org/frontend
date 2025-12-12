'use client';

import AppBackground from '@/components/common/AppBackground';
import BackButton from '@/components/common/BackButton';
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
const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  'open': { label: 'აქტიური', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  'in_progress': { label: 'მიმდინარე', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  'completed': { label: 'დასრულებული', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  'cancelled': { label: 'გაუქმებული', color: 'text-neutral-500', bg: 'bg-neutral-500/10' },
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
  'cleaning': 'დალაგება',
  'moving': 'გადაზიდვა',
  'gardening': 'მებაღეობა',
  'appliance-repair': 'ტექნიკის შეკეთება',
  'pest-control': 'დეზინსექცია',
  'window-cleaning': 'ფანჯრების წმენდა',
  'interior': 'ინტერიერი',
  'exterior': 'ექსტერიერი',
  'landscape-design': 'ლანდშაფტის დიზაინი',
  '3d-visualization': '3D ვიზუალიზაცია',
  'furniture-design': 'ავეჯის დიზაინი',
  'residential-arch': 'საცხოვრებელი',
  'commercial-arch': 'კომერციული',
  'industrial-arch': 'სამრეწველო',
  'reconstruction': 'რეკონსტრუქცია',
  'project-documentation': 'საპროექტო დოკუმენტაცია',
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

  // Collect all specs for display
  const specs = [];
  if (job?.propertyType) specs.push({ label: 'ტიპი', value: propertyTypeMap[job.propertyType] || job.propertyType });
  if (job?.areaSize) specs.push({ label: 'ფართი', value: `${job.areaSize} მ²` });
  if (job?.roomCount) specs.push({ label: 'ოთახები', value: String(job.roomCount) });
  if (job?.floorCount) specs.push({ label: 'სართულები', value: String(job.floorCount) });
  if (job?.deadline) specs.push({ label: 'ვადა', value: new Date(job.deadline).toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' }) });

  // Collect features
  const features = [];
  if (job?.furnitureIncluded) features.push('ავეჯის შერჩევა');
  if (job?.visualizationNeeded) features.push('3D ვიზუალიზაცია');
  if (job?.materialsProvided) features.push('მასალები უზრუნველყოფილია');
  if (job?.occupiedDuringWork) features.push('დაკავებული სამუშაოს დროს');

  if (isLoading) {
    return (
      <div className="min-h-screen relative bg-[var(--color-bg-primary)]">
        <AppBackground />
        <Header />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-10 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="aspect-[2/1] rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
              ))}
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
    <div className="min-h-screen relative bg-[var(--color-bg-primary)]">
      <AppBackground />
      <Header />

      {/* Success Toast */}
      {success && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <main className={`relative z-10 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Breadcrumb */}
        <div className="border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <BackButton href="/browse/jobs" label="სამუშაოები" />
            <div className="flex items-center gap-3 text-sm">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {statusInfo.label}
              </span>
              <span className="text-neutral-400 dark:text-neutral-500">{getTimeAgo(job.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* Header */}
              <header>
                <div className="flex items-center gap-2 text-sm text-[#B8860B] dark:text-[#DAA520] mb-3">
                  <span className="font-medium">{categoryMap[job.category] || job.category}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight leading-tight mb-4">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
                  {job.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {job.viewCount} ნახვა
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {job.proposalCount} შეთავაზება
                  </span>
                </div>
              </header>

              {/* Media Gallery */}
              {allMedia.length > 0 && (
                <div className="space-y-3">
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 group">
                    {currentMedia?.type === 'video' ? (
                      <div className="w-full h-full">
                        {isVideoPlaying ? (
                          <video src={storage.getFileUrl(currentMedia.url)} className="w-full h-full object-contain bg-black" controls autoPlay onEnded={() => setIsVideoPlaying(false)} />
                        ) : (
                          <div className="relative w-full h-full">
                            {currentMedia.thumbnail ? (
                              <img src={storage.getFileUrl(currentMedia.thumbnail)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                                <svg className="w-16 h-16 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <button onClick={() => setIsVideoPlaying(true)} className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                                <svg className="w-7 h-7 ml-1 text-neutral-900" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <img
                        src={currentMedia ? storage.getFileUrl(currentMedia.url) : ''}
                        alt={job.title}
                        className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02]"
                        onClick={() => currentMedia && setSelectedMedia(currentMedia)}
                      />
                    )}

                    {allMedia.length > 1 && (
                      <>
                        <button
                          onClick={prevMedia}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-105"
                        >
                          <svg className="w-5 h-5 text-neutral-700 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={nextMedia}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-105"
                        >
                          <svg className="w-5 h-5 text-neutral-700 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-white text-xs font-medium">
                          {currentMediaIndex + 1} / {allMedia.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnail strip */}
                  {allMedia.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {allMedia.map((media, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setCurrentMediaIndex(idx); setIsVideoPlaying(false); }}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                            idx === currentMediaIndex
                              ? 'ring-2 ring-[#B8860B] ring-offset-2 ring-offset-white dark:ring-offset-neutral-900'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          {media.type === 'video' ? (
                            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                              <svg className="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
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

              {/* Quick Specs */}
              {specs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {specs.map((spec, i) => (
                    <div key={i} className="px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                      <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">{spec.label}</p>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{spec.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              {job.description && (
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">აღწერა</h2>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>
              )}

              {/* Tags Section - Work Types, Skills, Design */}
              {((job.workTypes && job.workTypes.length > 0) || (job.skills && job.skills.length > 0) || job.designStyle || (job.roomsToDesign && job.roomsToDesign.length > 0)) && (
                <div className="space-y-4 pt-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
                  {job.workTypes && job.workTypes.length > 0 && (
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">სამუშაოს ტიპები</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.workTypes.map((type) => (
                          <span key={type} className="px-3 py-1.5 rounded-lg text-sm bg-[#B8860B]/10 text-[#8B6914] dark:text-[#DAA520] font-medium">
                            {workTypeMap[type] || type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.skills && job.skills.length > 0 && (
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">უნარები</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill) => (
                          <span key={skill} className="px-3 py-1.5 rounded-lg text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                            {skillMap[skill] || skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(job.designStyle || (job.roomsToDesign && job.roomsToDesign.length > 0)) && (
                    <div className="flex flex-wrap gap-6">
                      {job.designStyle && (
                        <div>
                          <h3 className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">დიზაინის სტილი</h3>
                          <span className="inline-flex px-3 py-1.5 rounded-lg text-sm bg-purple-500/10 text-purple-700 dark:text-purple-400 font-medium">
                            {skillMap[job.designStyle] || job.designStyle}
                          </span>
                        </div>
                      )}
                      {job.roomsToDesign && job.roomsToDesign.length > 0 && (
                        <div>
                          <h3 className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">ოთახები</h3>
                          <div className="flex flex-wrap gap-2">
                            {job.roomsToDesign.map((room) => (
                              <span key={room} className="px-3 py-1.5 rounded-lg text-sm bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">
                                {skillMap[room] || room}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Features */}
              {features.length > 0 && (
                <div className="pt-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
                  <h3 className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">დამატებითი</h3>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* References */}
              {job.references && job.references.length > 0 && (
                <div className="pt-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
                  <h3 className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">რეფერენსები</h3>
                  <div className="space-y-2">
                    {job.references.map((ref, idx) => (
                      <a
                        key={idx}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-neutral-700 shadow-sm">
                          {ref.type === 'pinterest' ? (
                            <svg className="w-5 h-5" style={{ color: '#E60023' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
                          ) : ref.type === 'instagram' ? (
                            <svg className="w-5 h-5" style={{ color: '#E4405F' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                          ) : (
                            <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white truncate group-hover:text-[#B8860B] transition-colors">
                            {ref.title || new URL(ref.url).hostname}
                          </p>
                          <p className="text-xs text-neutral-400 truncate">{ref.url}</p>
                        </div>
                        <svg className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* My Proposal Banner */}
              {myProposal && user?.role === 'pro' && (
                <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between border-b border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white">თქვენი შეთავაზება</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">გაგზავნილია {getTimeAgo(myProposal.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                      myProposal.status === 'pending' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                      myProposal.status === 'accepted' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                      'bg-red-500/15 text-red-500'
                    }`}>
                      {myProposal.status === 'pending' ? 'განხილვაში' : myProposal.status === 'accepted' ? 'მიღებული' : myProposal.status === 'rejected' ? 'უარყოფილი' : 'გაუქმებული'}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{myProposal.coverLetter}</p>
                    {(myProposal.proposedPrice || myProposal.estimatedDuration) && (
                      <div className="mt-4 pt-4 flex gap-8 border-t border-emerald-500/20">
                        {myProposal.proposedPrice && (
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">თქვენი ფასი</p>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{myProposal.proposedPrice.toLocaleString()} ₾</p>
                          </div>
                        )}
                        {myProposal.estimatedDuration && (
                          <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">ვადა</p>
                            <p className="text-xl font-bold text-neutral-900 dark:text-white">
                              {myProposal.estimatedDuration} {myProposal.estimatedDurationUnit === 'days' ? 'დღე' : myProposal.estimatedDurationUnit === 'weeks' ? 'კვირა' : 'თვე'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Proposal Form */}
              {user?.role === 'pro' && job.status === 'open' && !myProposal && (
                <div className="pt-6 border-t border-neutral-200/50 dark:border-neutral-800/50">
                  {!showProposalForm ? (
                    <button
                      onClick={() => setShowProposalForm(true)}
                      className="w-full py-4 text-sm font-semibold rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#9A7209] hover:to-[#B8860B] text-white shadow-lg shadow-[#B8860B]/25"
                    >
                      წინადადების გაგზავნა
                    </button>
                  ) : (
                    <form onSubmit={handleSubmitProposal} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
                      <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                        <h2 className="font-semibold text-neutral-900 dark:text-white">წინადადების გაგზავნა</h2>
                        <button type="button" onClick={() => setShowProposalForm(false)} className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="p-5 space-y-5">
                        {error && (
                          <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                            {error}
                          </div>
                        )}

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                            სამოტივაციო წერილი
                          </label>
                          <textarea
                            rows={5}
                            required
                            value={proposalData.coverLetter}
                            onChange={(e) => setProposalData({ ...proposalData, coverLetter: e.target.value })}
                            className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B8860B]/50 focus:border-[#B8860B] transition-all resize-none"
                            placeholder="წარმოადგინეთ თქვენი გამოცდილება და მიდგომა ამ პროექტისთვის..."
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                              ფასი (₾)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={proposalData.proposedPrice}
                              onChange={(e) => setProposalData({ ...proposalData, proposedPrice: e.target.value })}
                              className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B8860B]/50 focus:border-[#B8860B] transition-all"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                              ვადა
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={proposalData.estimatedDuration}
                              onChange={(e) => setProposalData({ ...proposalData, estimatedDuration: e.target.value })}
                              className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B8860B]/50 focus:border-[#B8860B] transition-all"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                              ერთეული
                            </label>
                            <select
                              value={proposalData.estimatedDurationUnit}
                              onChange={(e) => setProposalData({ ...proposalData, estimatedDurationUnit: e.target.value })}
                              className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B8860B]/50 focus:border-[#B8860B] transition-all appearance-none cursor-pointer"
                            >
                              <option value="days">დღე</option>
                              <option value="weeks">კვირა</option>
                              <option value="months">თვე</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="px-5 py-4 flex gap-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                        <button
                          type="button"
                          onClick={() => setShowProposalForm(false)}
                          className="flex-1 py-3 text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          გაუქმება
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow-lg shadow-[#B8860B]/25 hover:from-[#9A7209] hover:to-[#B8860B] disabled:opacity-50 transition-all"
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
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-24 space-y-4">
                {/* Budget Card */}
                {budgetDisplay && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#B8860B]/10 via-[#DAA520]/5 to-transparent border border-[#B8860B]/20">
                    <p className="text-xs uppercase tracking-wider text-[#8B6914] dark:text-[#DAA520]/70 mb-2">ბიუჯეტი</p>
                    <p className="text-3xl font-bold text-[#8B6914] dark:text-[#DAA520]">{budgetDisplay}</p>
                    {job.budgetType === 'per_sqm' && job.areaSize && job.pricePerUnit && (
                      <p className="text-sm mt-2 text-neutral-500 dark:text-neutral-400">
                        ≈ {(job.areaSize * job.pricePerUnit).toLocaleString()} ₾ სულ
                      </p>
                    )}
                  </div>
                )}

                {/* Client Card */}
                {job.clientId && (
                  <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium">მაძიებელი</p>
                      <span className="text-[10px] px-2 py-1 rounded-md font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                        {job.clientId.accountType === 'organization' ? 'კომპანია' : 'ფიზიკური პირი'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {job.clientId.avatar ? (
                        <img src={job.clientId.avatar} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-neutral-100 dark:ring-neutral-800" />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold bg-gradient-to-br from-[#B8860B] to-[#DAA520] text-white">
                          {job.clientId.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 dark:text-white truncate">
                          {job.clientId.accountType === 'organization' ? job.clientId.companyName || job.clientId.name : job.clientId.name}
                        </p>
                        {job.clientId.city && (
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">{job.clientId.city}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Info */}
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">ID</span>
                    <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">{job._id.slice(-8)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">თარიღი</span>
                    <span className="text-neutral-900 dark:text-white">{new Date(job.createdAt).toLocaleDateString('ka-GE')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">კატეგორია</span>
                    <span className="text-neutral-900 dark:text-white">{categoryMap[job.category] || job.category}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Lightbox */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-in fade-in duration-200"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
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
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); const idx = (currentMediaIndex + 1) % allMedia.length; setCurrentMediaIndex(idx); setSelectedMedia(allMedia[idx]); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
                {currentMediaIndex + 1} / {allMedia.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
