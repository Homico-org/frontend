'use client';

import AppBackground from '@/components/common/AppBackground';
import BackButton from '@/components/common/BackButton';
import Header from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/services/storage';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
const statusMap: Record<string, { label: string; class: string }> = {
  'open': { label: 'აქტიური', class: 'job-badge-status-open' },
  'in_progress': { label: 'მიმდინარე', class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25' },
  'completed': { label: 'დასრულებული', class: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25' },
  'cancelled': { label: 'გაუქმებული', class: 'bg-neutral-500/15 text-neutral-500 border border-neutral-500/25' },
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
  if (job?.propertyType) specs.push({ label: 'ტიპი', value: propertyTypeMap[job.propertyType] || job.propertyType, icon: 'building' });
  if (job?.areaSize) specs.push({ label: 'ფართი', value: `${job.areaSize} მ²`, icon: 'area' });
  if (job?.roomCount) specs.push({ label: 'ოთახები', value: String(job.roomCount), icon: 'rooms' });
  if (job?.floorCount) specs.push({ label: 'სართულები', value: String(job.floorCount), icon: 'floors' });
  if (job?.deadline) specs.push({ label: 'ვადა', value: new Date(job.deadline).toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' }), icon: 'calendar' });

  // Collect features
  const features = [];
  if (job?.furnitureIncluded) features.push('ავეჯის შერჩევა');
  if (job?.visualizationNeeded) features.push('3D ვიზუალიზაცია');
  if (job?.materialsProvided) features.push('მასალები უზრუნველყოფილია');
  if (job?.occupiedDuringWork) features.push('დაკავებული სამუშაოს დროს');

  // Icon component for specs
  const SpecIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'building':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 22h20M6 18V2h12v16M10 6h4M10 10h4M10 14h4" />
          </svg>
        );
      case 'area':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 3v18" strokeLinecap="round" />
          </svg>
        );
      case 'rooms':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M12 4v16M2 12h20" strokeLinecap="round" />
          </svg>
        );
      case 'floors':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            <path d="M6 4v16M18 4v16" strokeLinecap="round" />
          </svg>
        );
      case 'calendar':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative bg-[var(--color-bg-primary)]">
        <AppBackground />
        <Header />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="space-y-8">
            {/* Skeleton breadcrumb */}
            <div className="job-skeleton h-5 w-32 rounded-lg" />

            {/* Skeleton title */}
            <div className="space-y-3">
              <div className="job-skeleton h-6 w-48 rounded-lg" />
              <div className="job-skeleton h-12 w-3/4 rounded-xl" />
            </div>

            {/* Skeleton gallery */}
            <div className="job-skeleton aspect-[16/10] rounded-2xl" />

            {/* Skeleton specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="job-skeleton h-24 rounded-xl" />
              ))}
            </div>

            {/* Skeleton content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-4">
                <div className="job-skeleton h-6 w-full rounded-lg" />
                <div className="job-skeleton h-6 w-5/6 rounded-lg" />
                <div className="job-skeleton h-6 w-4/6 rounded-lg" />
              </div>
              <div className="lg:col-span-4">
                <div className="job-skeleton h-48 rounded-2xl" />
              </div>
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
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-job-scale-in">
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/30">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <main className={`relative z-10 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Hero Section with gradient */}
        <div className="job-hero">
          {/* Decorative corner elements */}
          <div className="job-corner-decoration top-left top-0 left-0" />
          <div className="job-corner-decoration top-right top-0 right-0" />

          {/* Breadcrumb */}
          <div className="border-b border-[var(--color-border-subtle)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
              <BackButton href="/browse/jobs" label="სამუშაოები" />
              <div className="flex items-center gap-3">
                <span className={`job-badge-status ${statusInfo.class}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {statusInfo.label}
                </span>
                <span className="text-sm text-[var(--color-text-tertiary)]">{getTimeAgo(job.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Title Section */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
            <div className="animate-job-fade-up" style={{ animationDelay: '0ms' }}>
              <span className="job-badge job-badge-category mb-4 inline-flex">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
                {categoryMap[job.category] || job.category}
              </span>
            </div>

            <h1 className="job-title animate-job-fade-up" style={{ animationDelay: '100ms' }}>
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-4 animate-job-fade-up" style={{ animationDelay: '200ms' }}>
              {job.location && (
                <span className="job-meta-pill">
                  <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.location}
                </span>
              )}
              <span className="job-meta-pill">
                <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {job.viewCount} ნახვა
              </span>
              <span className="job-meta-pill">
                <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {job.proposalCount} შეთავაზება
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* Media Gallery */}
              {allMedia.length > 0 && (
                <div className="space-y-3 animate-job-fade-up" style={{ animationDelay: '300ms' }}>
                  <div className="job-gallery aspect-[16/10] group">
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
                                <svg className="w-20 h-20 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <button onClick={() => setIsVideoPlaying(true)} className="absolute inset-0 flex items-center justify-center group/play">
                              <div className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover/play:scale-110">
                                <svg className="w-8 h-8 ml-1 text-[var(--color-accent)]" fill="currentColor" viewBox="0 0 24 24">
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
                        className="w-full h-full object-cover cursor-zoom-in transition-transform duration-700 group-hover:scale-[1.02]"
                        onClick={() => currentMedia && setSelectedMedia(currentMedia)}
                      />
                    )}

                    {allMedia.length > 1 && (
                      <>
                        <button onClick={prevMedia} className="job-gallery-nav left">
                          <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button onClick={nextMedia} className="job-gallery-nav right">
                          <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
                          {currentMediaIndex + 1} / {allMedia.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnail strip */}
                  {allMedia.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {allMedia.map((media, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setCurrentMediaIndex(idx); setIsVideoPlaying(false); }}
                          className={`job-thumb ${idx === currentMediaIndex ? 'job-thumb-active' : ''}`}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-job-fade-up" style={{ animationDelay: '400ms' }}>
                  {specs.map((spec, i) => (
                    <div key={i} className="job-spec-card">
                      <div className="flex items-center gap-2 mb-2 text-[var(--color-accent)]">
                        <SpecIcon type={spec.icon} />
                      </div>
                      <p className="job-spec-label">{spec.label}</p>
                      <p className="job-spec-value">{spec.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              {job.description && (
                <div className="animate-job-fade-up" style={{ animationDelay: '500ms' }}>
                  <h2 className="job-section-title">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    აღწერა
                  </h2>
                  <div className="job-description pl-4">
                    <p className="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap text-[15px]">
                      {job.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Tags Section */}
              {((job.workTypes && job.workTypes.length > 0) || (job.skills && job.skills.length > 0) || job.designStyle || (job.roomsToDesign && job.roomsToDesign.length > 0)) && (
                <div className="space-y-6 animate-job-fade-up" style={{ animationDelay: '600ms' }}>
                  <div className="job-divider" />

                  {job.workTypes && job.workTypes.length > 0 && (
                    <div>
                      <h3 className="job-section-title">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                        </svg>
                        სამუშაოს ტიპები
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.workTypes.map((type) => (
                          <span key={type} className="job-tag job-tag-terracotta">
                            {workTypeMap[type] || type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.skills && job.skills.length > 0 && (
                    <div>
                      <h3 className="job-section-title">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                        </svg>
                        უნარები
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill) => (
                          <span key={skill} className="job-tag">
                            {skillMap[skill] || skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(job.designStyle || (job.roomsToDesign && job.roomsToDesign.length > 0)) && (
                    <div className="flex flex-wrap gap-8">
                      {job.designStyle && (
                        <div>
                          <h3 className="job-section-title">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                            </svg>
                            დიზაინის სტილი
                          </h3>
                          <span className="job-tag job-tag-purple">
                            {skillMap[job.designStyle] || job.designStyle}
                          </span>
                        </div>
                      )}
                      {job.roomsToDesign && job.roomsToDesign.length > 0 && (
                        <div>
                          <h3 className="job-section-title">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                            </svg>
                            ოთახები
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {job.roomsToDesign.map((room) => (
                              <span key={room} className="job-tag job-tag-blue">
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
                <div className="animate-job-fade-up" style={{ animationDelay: '700ms' }}>
                  <div className="job-divider" />
                  <h3 className="job-section-title">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    დამატებითი
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature, i) => (
                      <span key={i} className="job-tag job-tag-emerald">
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
                <div className="animate-job-fade-up" style={{ animationDelay: '800ms' }}>
                  <div className="job-divider" />
                  <h3 className="job-section-title">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                    რეფერენსები
                  </h3>
                  <div className="space-y-2">
                    {job.references.map((ref, idx) => (
                      <a
                        key={idx}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="job-reference group"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-bg-tertiary)] group-hover:bg-[var(--color-accent-soft)] transition-colors">
                          {ref.type === 'pinterest' ? (
                            <svg className="w-5 h-5" style={{ color: '#E60023' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
                          ) : ref.type === 'instagram' ? (
                            <svg className="w-5 h-5" style={{ color: '#E4405F' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                          ) : (
                            <svg className="w-5 h-5 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                            {ref.title || new URL(ref.url).hostname}
                          </p>
                          <p className="text-xs text-[var(--color-text-tertiary)] truncate">{ref.url}</p>
                        </div>
                        <svg className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* My Proposal Banner */}
              {myProposal && user?.role === 'pro' && (
                <div className="job-proposal-card animate-job-fade-up" style={{ animationDelay: '900ms' }}>
                  <div className="px-6 py-4 flex items-center justify-between border-b border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--color-text-primary)]">თქვენი შეთავაზება</p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">გაგზავნილია {getTimeAgo(myProposal.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-4 py-2 rounded-full font-bold uppercase tracking-wide ${
                      myProposal.status === 'pending' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                      myProposal.status === 'accepted' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                      'bg-red-500/15 text-red-500'
                    }`}>
                      {myProposal.status === 'pending' ? 'განხილვაში' : myProposal.status === 'accepted' ? 'მიღებული' : myProposal.status === 'rejected' ? 'უარყოფილი' : 'გაუქმებული'}
                    </span>
                  </div>
                  <div className="p-6">
                    <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary)]">{myProposal.coverLetter}</p>
                    {(myProposal.proposedPrice || myProposal.estimatedDuration) && (
                      <div className="mt-6 pt-6 flex gap-10 border-t border-emerald-500/20">
                        {myProposal.proposedPrice && (
                          <div>
                            <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">თქვენი ფასი</p>
                            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{myProposal.proposedPrice.toLocaleString()} ₾</p>
                          </div>
                        )}
                        {myProposal.estimatedDuration && (
                          <div>
                            <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">ვადა</p>
                            <p className="text-3xl font-bold text-[var(--color-text-primary)]">
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
                <div className="animate-job-fade-up" style={{ animationDelay: '900ms' }}>
                  <div className="job-divider" />
                  {!showProposalForm ? (
                    <button
                      onClick={() => setShowProposalForm(true)}
                      className="job-submit-btn w-full"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        წინადადების გაგზავნა
                      </span>
                    </button>
                  ) : (
                    <form onSubmit={handleSubmitProposal} className="job-proposal-form">
                      <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                        <h2 className="font-semibold text-[var(--color-text-primary)]">წინადადების გაგზავნა</h2>
                        <button type="button" onClick={() => setShowProposalForm(false)} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors text-[var(--color-text-tertiary)]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="p-6 space-y-5">
                        {error && (
                          <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                          </div>
                        )}

                        <div>
                          <label className="block text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2 font-semibold">
                            სამოტივაციო წერილი
                          </label>
                          <textarea
                            rows={5}
                            required
                            value={proposalData.coverLetter}
                            onChange={(e) => setProposalData({ ...proposalData, coverLetter: e.target.value })}
                            className="job-proposal-input resize-none"
                            placeholder="წარმოადგინეთ თქვენი გამოცდილება და მიდგომა ამ პროექტისთვის..."
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2 font-semibold">
                              ფასი (₾)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={proposalData.proposedPrice}
                              onChange={(e) => setProposalData({ ...proposalData, proposedPrice: e.target.value })}
                              className="job-proposal-input"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2 font-semibold">
                              ვადა
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={proposalData.estimatedDuration}
                              onChange={(e) => setProposalData({ ...proposalData, estimatedDuration: e.target.value })}
                              className="job-proposal-input"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2 font-semibold">
                              ერთეული
                            </label>
                            <select
                              value={proposalData.estimatedDurationUnit}
                              onChange={(e) => setProposalData({ ...proposalData, estimatedDurationUnit: e.target.value })}
                              className="job-proposal-input cursor-pointer"
                            >
                              <option value="days">დღე</option>
                              <option value="weeks">კვირა</option>
                              <option value="months">თვე</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-4 flex gap-3 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                        <button
                          type="button"
                          onClick={() => setShowProposalForm(false)}
                          className="flex-1 py-3.5 text-sm font-medium rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--hover-bg)] transition-colors"
                        >
                          გაუქმება
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 job-submit-btn disabled:opacity-50"
                        >
                          <span>
                            {isSubmitting ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                იგზავნება...
                              </span>
                            ) : 'გაგზავნა'}
                          </span>
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
                  <div className="job-budget-card animate-job-fade-up" style={{ animationDelay: '400ms' }}>
                    <p className="text-xs uppercase tracking-[0.15em] font-semibold text-[var(--color-text-tertiary)] mb-3">ბიუჯეტი</p>
                    <p className="job-budget-value">{budgetDisplay}</p>
                    {job.budgetType === 'per_sqm' && job.areaSize && job.pricePerUnit && (
                      <p className="text-sm mt-3 text-[var(--color-text-secondary)] flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        ≈ {(job.areaSize * job.pricePerUnit).toLocaleString()} ₾ სულ
                      </p>
                    )}
                  </div>
                )}

                {/* Client Card */}
                {job.clientId && (
                  <div className="job-client-card animate-job-fade-up" style={{ animationDelay: '500ms' }}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs uppercase tracking-[0.15em] font-semibold text-[var(--color-text-tertiary)]">მაძიებელი</p>
                      <span className="text-[10px] px-2.5 py-1 rounded-lg font-semibold bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]">
                        {job.clientId.accountType === 'organization' ? 'კომპანია' : 'ფიზიკური პირი'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="job-client-avatar">
                        {job.clientId.avatar ? (
                          <img src={job.clientId.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-[#E07B4F] to-[#B8560E] text-white">
                            {job.clientId.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--color-text-primary)] truncate">
                          {job.clientId.accountType === 'organization' ? job.clientId.companyName || job.clientId.name : job.clientId.name}
                        </p>
                        {job.clientId.city && (
                          <p className="text-sm text-[var(--color-text-tertiary)] flex items-center gap-1 mt-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {job.clientId.city}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Info */}
                <div className="job-sidebar-card animate-job-fade-up" style={{ animationDelay: '600ms' }}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-tertiary)]">ID</span>
                      <span className="font-mono text-xs px-2 py-1 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]">{job._id.slice(-8)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-tertiary)]">თარიღი</span>
                      <span className="text-[var(--color-text-primary)] font-medium">{new Date(job.createdAt).toLocaleDateString('ka-GE')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-tertiary)]">კატეგორია</span>
                      <span className="text-[var(--color-text-primary)] font-medium">{categoryMap[job.category] || job.category}</span>
                    </div>
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
          className="job-lightbox animate-job-scale-in"
          onClick={() => setSelectedMedia(null)}
        >
          <button onClick={() => setSelectedMedia(null)} className="job-lightbox-close">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={storage.getFileUrl(selectedMedia.url)}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          {allMedia.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); const idx = (currentMediaIndex - 1 + allMedia.length) % allMedia.length; setCurrentMediaIndex(idx); setSelectedMedia(allMedia[idx]); }}
                className="job-lightbox-nav left"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); const idx = (currentMediaIndex + 1) % allMedia.length; setCurrentMediaIndex(idx); setSelectedMedia(allMedia[idx]); }}
                className="job-lightbox-nav right"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium">
                {currentMediaIndex + 1} / {allMedia.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
