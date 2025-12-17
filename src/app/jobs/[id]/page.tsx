'use client';

import Header from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { storage } from '@/services/storage';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

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

// Status config
const statusConfig: Record<string, { label: string; labelEn: string; color: string }> = {
  'open': { label: 'აქტიური', labelEn: 'Open', color: '#10b981' },
  'in_progress': { label: 'მიმდინარე', labelEn: 'In Progress', color: '#f59e0b' },
  'completed': { label: 'დასრულებული', labelEn: 'Completed', color: '#3b82f6' },
  'cancelled': { label: 'გაუქმებული', labelEn: 'Cancelled', color: '#6b7280' },
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

// Muted terracotta/coral color
const ACCENT_COLOR = '#C4735B';
const ACCENT_COLOR_LIGHT = 'rgba(196, 115, 91, 0.08)';
const ACCENT_COLOR_BORDER = 'rgba(196, 115, 91, 0.2)';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { locale } = useLanguage();
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Check if current user is the job owner
  const isOwner = user && job?.clientId && user.id === job.clientId._id;

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

      setSuccess(locale === 'ka' ? 'წინადადება წარმატებით გაიგზავნა' : 'Proposal submitted successfully');
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

  const handleDeleteJob = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${params.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      router.push('/my-jobs');
    } catch (err) {
      console.error('Failed to delete job:', err);
      setError(locale === 'ka' ? 'წაშლა ვერ მოხერხდა' : 'Failed to delete');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatBudget = (job: Job) => {
    switch (job.budgetType) {
      case 'fixed':
        return job.budgetAmount ? `${job.budgetAmount.toLocaleString()} ₾` : null;
      case 'range':
        return job.budgetMin && job.budgetMax ? `${job.budgetMin.toLocaleString()} – ${job.budgetMax.toLocaleString()} ₾` : null;
      case 'per_sqm':
        return job.pricePerUnit ? `${job.pricePerUnit} ₾/მ²` : null;
      case 'negotiable':
        return locale === 'ka' ? 'შეთანხმებით' : 'Negotiable';
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

    if (locale === 'ka') {
      if (diffInMins < 60) return `${diffInMins} წუთის წინ`;
      if (diffInHours < 24) return `${diffInHours} საათის წინ`;
      if (diffInDays < 7) return `${diffInDays} დღის წინ`;
      return date.toLocaleDateString('ka-GE');
    } else {
      if (diffInMins < 60) return `${diffInMins}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return date.toLocaleDateString('en-US');
    }
  };

  // Collect specs for vertical list with icons
  const specs = [];
  if (job?.propertyType) specs.push({
    label: locale === 'ka' ? 'ტიპი' : 'Type',
    value: propertyTypeMap[job.propertyType] || job.propertyType,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  });
  if (job?.areaSize) specs.push({
    label: locale === 'ka' ? 'ფართი' : 'Area',
    value: `${job.areaSize} მ²`,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    )
  });
  if (job?.roomCount) specs.push({
    label: locale === 'ka' ? 'ოთახები' : 'Rooms',
    value: String(job.roomCount),
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  });
  if (job?.floorCount) specs.push({
    label: locale === 'ka' ? 'სართულები' : 'Floors',
    value: String(job.floorCount),
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
      </svg>
    )
  });
  if (job?.deadline) specs.push({
    label: locale === 'ka' ? 'ვადა' : 'Deadline',
    value: new Date(job.deadline).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', { month: 'short', day: 'numeric' }),
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  });

  // Features
  const features = [];
  if (job?.furnitureIncluded) features.push(locale === 'ka' ? 'ავეჯის შერჩევა' : 'Furniture Selection');
  if (job?.visualizationNeeded) features.push(locale === 'ka' ? '3D ვიზუალიზაცია' : '3D Visualization');
  if (job?.materialsProvided) features.push(locale === 'ka' ? 'მასალები უზრუნველყოფილია' : 'Materials Provided');
  if (job?.occupiedDuringWork) features.push(locale === 'ka' ? 'დაკავებული სამუშაოს დროს' : 'Occupied During Work');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-app)]">
        <Header />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-4 w-24 rounded bg-[var(--color-bg-tertiary)]" />
            <div className="h-10 w-3/4 rounded bg-[var(--color-bg-tertiary)]" />
            <div className="h-4 w-1/2 rounded bg-[var(--color-bg-tertiary)]" />
            <div className="space-y-3 pt-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded bg-[var(--color-bg-tertiary)]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const budgetDisplay = formatBudget(job);
  const statusInfo = statusConfig[job.status] || statusConfig['open'];

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] pb-24">
      <Header />

      {/* Success Toast */}
      {success && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50">
          <div
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-500 text-white shadow-2xl"
            style={{ animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-[var(--color-bg-elevated)] rounded-2xl p-8 max-w-sm w-full">
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              {locale === 'ka' ? 'წაშლის დადასტურება' : 'Delete this job?'}
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6 text-sm">
              {locale === 'ka' ? 'ეს მოქმედება ვერ გაუქმდება.' : 'This action cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteJob}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? '...' : (locale === 'ka' ? 'წაშლა' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back Navigation */}
        <div className="py-6">
          <Link
            href="/browse/jobs"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            {locale === 'ka' ? 'უკან' : 'Back'}
          </Link>
        </div>

        {/* Header Section - Card-free, typography-focused */}
        <header className="pb-8">
          {/* Category & Status */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium" style={{ color: ACCENT_COLOR }}>
              {categoryMap[job.category] || job.category}
            </span>
            <span className="text-[var(--color-text-tertiary)]">·</span>
            <span className="text-sm text-[var(--color-text-tertiary)]">
              {getTimeAgo(job.createdAt)}
            </span>
            <span className="text-[var(--color-text-tertiary)]">·</span>
            <span
              className="text-sm font-medium flex items-center gap-1.5"
              style={{ color: statusInfo.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusInfo.color }} />
              {locale === 'ka' ? statusInfo.label : statusInfo.labelEn}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text-primary)] leading-tight mb-4">
            {job.title}
          </h1>

          {/* Location */}
          {job.location && (
            <p className="text-[var(--color-text-secondary)] flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {job.location}
            </p>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <div className="flex items-center gap-3 mt-6">
              <Link
                href={`/post-job?edit=${job._id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {locale === 'ka' ? 'რედაქტირება' : 'Edit'}
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {locale === 'ka' ? 'წაშლა' : 'Delete'}
              </button>
            </div>
          )}
        </header>

        {/* Budget - Subtle highlight */}
        {budgetDisplay && (
          <div
            className="py-4 px-5 rounded-xl mb-8"
            style={{ backgroundColor: ACCENT_COLOR_LIGHT }}
          >
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)] mb-1">
              {locale === 'ka' ? 'ბიუჯეტი' : 'Budget'}
            </p>
            <p className="text-2xl font-semibold" style={{ color: ACCENT_COLOR }}>
              {budgetDisplay}
            </p>
            {job.budgetType === 'per_sqm' && job.areaSize && job.pricePerUnit && (
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                ≈ {(job.areaSize * job.pricePerUnit).toLocaleString()} ₾ {locale === 'ka' ? 'სულ' : 'total'}
              </p>
            )}
          </div>
        )}

        {/* Specs - Vertical list with icons */}
        {specs.length > 0 && (
          <section className="mb-8">
            <div className="space-y-0">
              {specs.map((spec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-[var(--color-border-subtle)]"
                >
                  <span className="flex items-center gap-3 text-[var(--color-text-tertiary)]">
                    <span className="text-[var(--color-text-tertiary)] opacity-60">{spec.icon}</span>
                    {spec.label}
                  </span>
                  <span className="font-medium text-[var(--color-text-primary)]">{spec.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Description */}
        {job.description && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
              {locale === 'ka' ? 'აღწერა' : 'Description'}
            </h2>
            <p className="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </section>
        )}

        {/* Work Types & Skills */}
        {((job.workTypes && job.workTypes.length > 0) || (job.skills && job.skills.length > 0)) && (
          <section className="mb-8 space-y-6">
            {job.workTypes && job.workTypes.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
                  {locale === 'ka' ? 'სამუშაოს ტიპები' : 'Work Types'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.workTypes.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1.5 rounded-lg text-sm"
                      style={{
                        backgroundColor: ACCENT_COLOR_LIGHT,
                        color: ACCENT_COLOR,
                        border: `1px solid ${ACCENT_COLOR_BORDER}`
                      }}
                    >
                      {workTypeMap[type] || type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.skills && job.skills.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
                  {locale === 'ka' ? 'უნარები' : 'Skills'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-lg text-sm bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]"
                    >
                      {skillMap[skill] || skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Features */}
        {features.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
              {locale === 'ka' ? 'მოთხოვნები' : 'Requirements'}
            </h2>
            <div className="space-y-2">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Image Gallery - Horizontal Scroll */}
        {allMedia.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
              {locale === 'ka' ? 'ფოტოები' : 'Photos'} ({allMedia.length})
            </h2>
            <div
              ref={galleryRef}
              className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 scrollbar-hide"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {allMedia.map((media, idx) => (
                <button
                  key={idx}
                  onClick={() => { setCurrentMediaIndex(idx); setSelectedMedia(media); }}
                  className="flex-shrink-0 relative rounded-xl overflow-hidden group"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {media.type === 'video' ? (
                    <div className="w-40 h-32 sm:w-48 sm:h-36 bg-neutral-800 flex items-center justify-center">
                      {media.thumbnail ? (
                        <img src={storage.getFileUrl(media.thumbnail)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-10 h-10 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <svg className="w-4 h-4 ml-0.5" style={{ color: ACCENT_COLOR }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={storage.getFileUrl(media.url)}
                      alt=""
                      className="w-40 h-32 sm:w-48 sm:h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* References */}
        {job.references && job.references.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
              {locale === 'ka' ? 'რეფერენსები' : 'References'}
            </h2>
            <div className="space-y-2">
              {job.references.map((ref, idx) => (
                <a
                  key={idx}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-3 border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-tertiary)] -mx-2 px-2 rounded-lg transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-bg-tertiary)]">
                    {ref.type === 'pinterest' ? (
                      <svg className="w-4 h-4" style={{ color: '#E60023' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
                    ) : ref.type === 'instagram' ? (
                      <svg className="w-4 h-4" style={{ color: '#E4405F' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    ) : (
                      <svg className="w-4 h-4 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {ref.title || (() => { try { return new URL(ref.url).hostname; } catch { return ref.url; } })()}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="mb-8 py-4 border-t border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-6 text-sm text-[var(--color-text-tertiary)]">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {job.viewCount} {locale === 'ka' ? 'ნახვა' : 'views'}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {job.proposalCount} {locale === 'ka' ? 'შეთავაზება' : 'proposals'}
            </span>
            <span className="text-[var(--color-text-tertiary)]">
              ID: {job._id.slice(-8)}
            </span>
          </div>
        </section>

        {/* My Proposal */}
        {myProposal && user?.role === 'pro' && (
          <section className="mb-8 py-5 px-5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium text-[var(--color-text-primary)]">
                {locale === 'ka' ? 'თქვენი შეთავაზება' : 'Your Proposal'}
              </span>
              <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                myProposal.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                myProposal.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
              }`}>
                {myProposal.status === 'pending' ? (locale === 'ka' ? 'განხილვაში' : 'Pending') :
                 myProposal.status === 'accepted' ? (locale === 'ka' ? 'მიღებული' : 'Accepted') :
                 (locale === 'ka' ? 'უარყოფილი' : 'Rejected')}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">{myProposal.coverLetter}</p>
            {(myProposal.proposedPrice || myProposal.estimatedDuration) && (
              <div className="flex gap-6 text-sm">
                {myProposal.proposedPrice && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {myProposal.proposedPrice.toLocaleString()} ₾
                  </span>
                )}
                {myProposal.estimatedDuration && (
                  <span className="text-[var(--color-text-secondary)]">
                    {myProposal.estimatedDuration} {myProposal.estimatedDurationUnit === 'days' ? (locale === 'ka' ? 'დღე' : 'days') : myProposal.estimatedDurationUnit === 'weeks' ? (locale === 'ka' ? 'კვირა' : 'weeks') : (locale === 'ka' ? 'თვე' : 'months')}
                  </span>
                )}
              </div>
            )}
          </section>
        )}

        {/* Proposal Form */}
        {user?.role === 'pro' && job.status === 'open' && !myProposal && showProposalForm && (
          <section className="mb-8">
            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {locale === 'ka' ? 'წინადადების გაგზავნა' : 'Submit Proposal'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowProposalForm(false)}
                  className="p-2 hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">
                  {locale === 'ka' ? 'სამოტივაციო წერილი' : 'Cover Letter'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={proposalData.coverLetter}
                  onChange={(e) => setProposalData({ ...proposalData, coverLetter: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-text-tertiary)] transition-colors resize-none"
                  placeholder={locale === 'ka' ? 'წარმოადგინეთ თქვენი გამოცდილება...' : 'Describe your experience...'}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">
                    {locale === 'ka' ? 'ფასი (₾)' : 'Price (₾)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={proposalData.proposedPrice}
                    onChange={(e) => setProposalData({ ...proposalData, proposedPrice: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-text-tertiary)] transition-colors"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">
                    {locale === 'ka' ? 'ვადა' : 'Duration'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={proposalData.estimatedDuration}
                    onChange={(e) => setProposalData({ ...proposalData, estimatedDuration: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-text-tertiary)] transition-colors"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">
                    {locale === 'ka' ? 'ერთეული' : 'Unit'}
                  </label>
                  <select
                    value={proposalData.estimatedDurationUnit}
                    onChange={(e) => setProposalData({ ...proposalData, estimatedDurationUnit: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-text-tertiary)] transition-colors cursor-pointer"
                  >
                    <option value="days">{locale === 'ka' ? 'დღე' : 'Days'}</option>
                    <option value="weeks">{locale === 'ka' ? 'კვირა' : 'Weeks'}</option>
                    <option value="months">{locale === 'ka' ? 'თვე' : 'Months'}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProposalForm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  {isSubmitting ? '...' : (locale === 'ka' ? 'გაგზავნა' : 'Submit')}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>

      {/* Floating Contact Card - Employer */}
      {job.clientId && (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:block">
          <div className="bg-[var(--color-bg-elevated)] rounded-2xl shadow-xl border border-[var(--color-border-subtle)] p-4 w-64">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}, #9a5a47)` }}
              >
                {job.clientId.avatar ? (
                  <img src={job.clientId.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-lg font-semibold">
                    {job.clientId.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-[var(--color-text-primary)] truncate">
                  {job.clientId.accountType === 'organization' ? job.clientId.companyName || job.clientId.name : job.clientId.name}
                </p>
                {job.clientId.city && (
                  <p className="text-xs text-[var(--color-text-tertiary)]">{job.clientId.city}</p>
                )}
              </div>
            </div>
            <button
              className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: ACCENT_COLOR }}
            >
              {locale === 'ka' ? 'მიწერა' : 'Message'}
            </button>
          </div>
        </div>
      )}

      {/* Sticky Bottom CTA Bar */}
      {user?.role === 'pro' && job.status === 'open' && !myProposal && !showProposalForm && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-bg-elevated)] border-t border-[var(--color-border-subtle)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 xl:hidden">
              {job.clientId && (
                <>
                  <div
                    className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}, #9a5a47)` }}
                  >
                    {job.clientId.avatar ? (
                      <img src={job.clientId.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
                        {job.clientId.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {job.clientId.accountType === 'organization' ? job.clientId.companyName || job.clientId.name : job.clientId.name}
                    </p>
                    {budgetDisplay && (
                      <p className="text-xs" style={{ color: ACCENT_COLOR }}>{budgetDisplay}</p>
                    )}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setShowProposalForm(true)}
              className="flex-1 xl:flex-none xl:px-8 py-3 rounded-xl text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: ACCENT_COLOR }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {locale === 'ka' ? 'შეთავაზების გაგზავნა' : 'Submit Proposal'}
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {selectedMedia.type === 'video' ? (
            <video
              src={storage.getFileUrl(selectedMedia.url)}
              className="max-w-[90vw] max-h-[90vh] rounded-lg"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={storage.getFileUrl(selectedMedia.url)}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {allMedia.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = (currentMediaIndex - 1 + allMedia.length) % allMedia.length;
                  setCurrentMediaIndex(idx);
                  setSelectedMedia(allMedia[idx]);
                }}
                className="absolute left-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = (currentMediaIndex + 1) % allMedia.length;
                  setCurrentMediaIndex(idx);
                  setSelectedMedia(allMedia[idx]);
                }}
                className="absolute right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
                {currentMediaIndex + 1} / {allMedia.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* CSS */}
      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
