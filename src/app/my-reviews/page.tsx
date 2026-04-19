'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MultiStarDisplay } from '@/components/ui/StarRating';
import { ACCENT_COLOR } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import type { BaseEntity } from '@/types/shared';
import { formatDateUK } from '@/utils/dateUtils';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Edit3,
  Image as ImageIcon,
  MoreVertical,
  Sparkles,
  Star,
  ThumbsUp,
  Trash2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// Page-specific review with populated fields
interface PageReview extends BaseEntity {
  proId: {
    id: string;
    name: string;
    avatar?: string;
    title: string;
  };
  projectId?: {
    id: string;
    title: string;
  };
  rating: number;
  text?: string;
  photos: string[];
  createdAt: string;
}

interface PendingReview extends BaseEntity {
  jobId: {
    id: string;
    title: string;
  };
  proId: {
    id: string;
    name: string;
    avatar?: string;
    title: string;
  };
  completedAt: string;
}

function MyReviewsPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale: language } = useLanguage();
  const router = useRouter();

  const [reviews, setReviews] = useState<PageReview[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'given' | 'pending'>('given');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== 'client' && user?.role !== 'admin'))) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch given reviews
      const reviewsRes = await api.get(`/reviews/my-reviews`);
      setReviews(reviewsRes.data || []);

      // Fetch pending reviews (completed jobs without reviews)
      // This would need a backend endpoint - for now we'll use empty array
      setPendingReviews([]);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      const apiErr = err as { response?: { status?: number } };
      // Don't redirect on error, just show empty state
      if (apiErr?.response?.status !== 401) {
        setReviews([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'client' || user?.role === 'admin')) {
      fetchReviews();
    }
  }, [isAuthenticated, user, fetchReviews]);


  const stats = {
    total: reviews.length,
    pending: pendingReviews.length,
    avgRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
    withPhotos: reviews.filter(r => r.photos && r.photos.length > 0).length,
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--hm-bg-page)' }}>
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="xl" variant="border" color={ACCENT_COLOR} />
          <p className="text-sm text-[var(--hm-fg-muted)]">{language === 'ka' ? 'შეფასებები იტვირთება...' : 'Loading reviews...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--hm-bg-page)' }}>
      {/* Header Section */}
      <div className="border-b" style={{ backgroundColor: 'var(--hm-bg-page)', borderColor: 'var(--hm-border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/portfolio')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="mb-4"
          >
            {language === 'ka' ? 'უკან' : 'Back'}
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)]">
                {language === 'ka' ? 'ჩემი შეფასებები' : 'My Reviews'}
              </h1>
              <p className="mt-1 text-[var(--hm-fg-muted)]">
                {language === 'ka' ? 'შეფასებები, რომლებიც დაწერეთ პროფესიონალებისთვის' : "Reviews you've written for professionals"}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--hm-bg-page)', border: '1px solid var(--hm-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--hm-warning-100)]/30">
                  <Star className="h-5 w-5 text-[var(--hm-warning-500)]" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[var(--hm-fg-primary)]">{stats.total}</p>
                  <p className="text-xs text-[var(--hm-fg-muted)]">{language === 'ka' ? 'დაწერილი' : 'Reviews Given'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--hm-bg-page)', border: '1px solid var(--hm-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--hm-bg-tertiary)]">
                  <ThumbsUp className="h-5 w-5 text-[var(--hm-fg-secondary)]" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[var(--hm-fg-primary)]">{stats.avgRating}</p>
                  <p className="text-xs text-[var(--hm-fg-muted)]">{language === 'ka' ? 'საშ. შეფასება' : 'Avg. Rating'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--hm-bg-page)', border: '1px solid var(--hm-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100">
                  <Clock className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[var(--hm-fg-primary)]">{stats.pending}</p>
                  <p className="text-xs text-[var(--hm-fg-muted)]">{language === 'ka' ? 'მოლოდინში' : 'Pending'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--hm-bg-page)', border: '1px solid var(--hm-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-100">
                  <ImageIcon className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[var(--hm-fg-primary)]">{stats.withPhotos}</p>
                  <p className="text-xs text-[var(--hm-fg-muted)]">{language === 'ka' ? 'ფოტოებით' : 'With Photos'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('given')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'given'
                ? 'bg-[var(--hm-n-700)] text-white shadow-sm'
                : 'text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]'
            }`}
            style={activeTab !== 'given' ? { backgroundColor: 'var(--hm-bg-page)' } : {}}
          >
            {language === 'ka' ? 'დაწერილი' : 'Reviews Given'} ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-[var(--hm-n-700)] text-white shadow-sm'
                : 'text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]'
            }`}
            style={activeTab !== 'pending' ? { backgroundColor: 'var(--hm-bg-page)' } : {}}
          >
            {language === 'ka' ? 'მოლოდინში' : 'Pending'} ({stats.pending})
          </button>
        </div>

        {/* Reviews List */}
        {activeTab === 'given' && (
          <>
            {reviews.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--hm-bg-page)', border: '1px solid var(--hm-border)' }}>
                <div className="w-16 h-16 rounded-2xl bg-[var(--hm-warning-50)]/20 flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-medium text-[var(--hm-fg-primary)] mb-2">
                  {language === 'ka' ? 'შეფასებები ჯერ არ არის' : 'No reviews yet'}
                </h3>
                <p className="text-[var(--hm-fg-muted)] mb-6 max-w-md mx-auto">
                  {language === 'ka' ? 'პროფესიონალებთან პროექტების დასრულების შემდეგ შეგიძლიათ შეფასებების დაწერა' : 'Once you complete projects with professionals, you can leave reviews to help others'}
                </p>
                <Link
                  href="/portfolio"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--hm-n-700)] text-white rounded-xl hover:bg-[var(--hm-n-700)] transition-colors font-medium"
                >
                  <Sparkles className="h-5 w-5" />
                  {language === 'ka' ? 'სპეციალისტების ნახვა' : 'Find Professionals'}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl overflow-hidden transition-shadow hover:shadow-md"
                    style={{ backgroundColor: 'var(--hm-bg-page)', border: '1px solid var(--hm-border)' }}
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        {/* Pro Avatar */}
                        <Link href={`/professionals/${review.proId.id}`} className="flex-shrink-0">
                          <Avatar
                            src={review.proId.avatar}
                            name={review.proId.name}
                            size="lg"
                          />
                        </Link>

                        {/* Review Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <Link
                                href={`/professionals/${review.proId.id}`}
                                className="font-medium text-[var(--hm-fg-primary)] hover:text-[var(--hm-fg-secondary)] transition-colors"
                              >
                                {review.proId.name}
                              </Link>
                              <p className="text-sm text-[var(--hm-fg-muted)]">
                                {review.proId.title}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <MultiStarDisplay rating={review.rating} size="sm" />
                                <span className="text-sm text-[var(--hm-fg-muted)]">
                                  {formatDateUK(review.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Actions Menu */}
                            <div className="relative">
                              <button
                                onClick={() => setActionMenuId(actionMenuId === review.id ? null : review.id)}
                                className="p-2 rounded-lg hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                              >
                                <MoreVertical className="h-5 w-5 text-[var(--hm-fg-muted)]" />
                              </button>
                              {actionMenuId === review.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setActionMenuId(null)}
                                  />
                                  <div
                                    className="absolute right-0 top-full mt-1 w-40 rounded-xl shadow-lg overflow-hidden z-20"
                                    style={{ backgroundColor: 'var(--hm-bg-page)', border: '1px solid var(--hm-border)' }}
                                  >
                                    <button
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                      {language === 'ka' ? 'რედაქტირება' : 'Edit Review'}
                                    </button>
                                    <button
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {language === 'ka' ? 'წაშლა' : 'Delete'}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Review Text */}
                          {review.text && (
                            <p className="mt-3 text-sm text-[var(--hm-fg-secondary)] leading-relaxed">
                              {review.text}
                            </p>
                          )}

                          {/* Review Photos */}
                          {review.photos && review.photos.length > 0 && (
                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                              {review.photos.map((photo, idx) => (
                                <div key={idx} className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                  <Image src={photo} alt="Review photo" fill className="object-cover" sizes="80px" />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Project Reference */}
                          {review.projectId && (
                            <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--hm-border)' }}>
                              <p className="text-xs text-[var(--hm-fg-muted)]">
                                {language === 'ka' ? 'პროექტი' : 'Project'}: <span className="font-medium text-[var(--hm-fg-secondary)]">{review.projectId.title}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pending Reviews */}
        {activeTab === 'pending' && (
          <>
            {pendingReviews.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--hm-bg-page)', border: '1px solid var(--hm-border)' }}>
                <div className="w-16 h-16 rounded-2xl bg-[var(--hm-brand-500)]/5 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-[var(--hm-brand-500)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--hm-fg-primary)] mb-2">
                  {language === 'ka' ? 'ყველაფერი შესრულებულია!' : 'All caught up!'}
                </h3>
                <p className="text-[var(--hm-fg-muted)] max-w-md mx-auto">
                  {language === 'ka' ? 'მოლოდინში მყოფი შეფასებები არ გაქვთ. პროფესიონალებთან პროექტების დასრულების შემდეგ შეგიძლიათ შეფასებების დაწერა.' : 'You have no pending reviews. Complete more projects to leave feedback for professionals.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReviews.map((pending) => (
                  <div
                    key={pending.id}
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: 'var(--hm-bg-page)', border: '1px solid var(--hm-border)' }}
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={pending.proId.avatar}
                          name={pending.proId.name}
                          size="lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-[var(--hm-fg-primary)]">
                                {pending.proId.name}
                              </p>
                              <p className="text-sm text-[var(--hm-fg-muted)]">
                                {pending.proId.title}
                              </p>
                              <p className="text-xs text-[var(--hm-fg-muted)] mt-1">
                                {language === 'ka' ? 'დასრულდა' : 'Completed on'} {formatDateUK(pending.completedAt)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              leftIcon={<Star className="h-4 w-4" />}
                            >
                              {language === 'ka' ? 'შეფასების დაწერა' : 'Write Review'}
                            </Button>
                          </div>
                          <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--hm-bg-page)' }}>
                            <p className="text-sm text-[var(--hm-fg-secondary)]">
                              {language === 'ka' ? 'პროექტი' : 'Project'}: <span className="font-medium">{pending.jobId.title}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MyReviewsPage() {
  return (
    <AuthGuard>
      <MyReviewsPageContent />
    </AuthGuard>
  );
}
