'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/common/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import Avatar from '@/components/common/Avatar';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  MessageSquare,
  Clock,
  CheckCircle,
  Calendar,
  ThumbsUp,
  Image as ImageIcon,
  MoreVertical,
  Edit3,
  Trash2,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface Review {
  _id: string;
  proId: {
    _id: string;
    name: string;
    avatar?: string;
    title: string;
  };
  projectId?: {
    _id: string;
    title: string;
  };
  rating: number;
  text?: string;
  photos: string[];
  createdAt: string;
}

interface PendingReview {
  _id: string;
  jobId: {
    _id: string;
    title: string;
  };
  proId: {
    _id: string;
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

  const [reviews, setReviews] = useState<Review[]>([]);
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
      const reviewsRes = await api.get('/reviews/my-reviews');
      setReviews(reviewsRes.data || []);

      // Fetch pending reviews (completed jobs without reviews)
      // This would need a backend endpoint - for now we'll use empty array
      setPendingReviews([]);
    } catch (err: any) {
      console.error('Failed to fetch reviews:', err);
      // Don't redirect on error, just show empty state
      if (err?.response?.status !== 401) {
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-neutral-200 dark:text-neutral-700'
            }`}
          />
        ))}
      </div>
    );
  };

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-[3px] border-neutral-200 dark:border-neutral-700"></div>
            <div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-transparent border-t-forest-600 dark:border-t-primary-400 animate-spin"></div>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'შეფასებები იტვირთება...' : 'Loading reviews...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header Section */}
      <div className="border-b" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/browse')}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {language === 'ka' ? 'უკან' : 'Back'}
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-neutral-50">
                {language === 'ka' ? 'ჩემი შეფასებები' : 'My Reviews'}
              </h1>
              <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                {language === 'ka' ? 'შეფასებები, რომლებიც დაწერეთ პროფესიონალებისთვის' : "Reviews you've written for professionals"}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stats.total}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'დაწერილი' : 'Reviews Given'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-forest-100 dark:bg-forest-900/30">
                  <ThumbsUp className="h-5 w-5 text-forest-600 dark:text-forest-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stats.avgRating}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'საშ. შეფასება' : 'Avg. Rating'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stats.pending}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'მოლოდინში' : 'Pending'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30">
                  <ImageIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{stats.withPhotos}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{language === 'ka' ? 'ფოტოებით' : 'With Photos'}</p>
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
                ? 'bg-forest-600 dark:bg-primary-500 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            style={activeTab !== 'given' ? { backgroundColor: 'var(--color-bg-secondary)' } : {}}
          >
            {language === 'ka' ? 'დაწერილი' : 'Reviews Given'} ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-forest-600 dark:bg-primary-500 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            style={activeTab !== 'pending' ? { backgroundColor: 'var(--color-bg-secondary)' } : {}}
          >
            {language === 'ka' ? 'მოლოდინში' : 'Pending'} ({stats.pending})
          </button>
        </div>

        {/* Reviews List */}
        {activeTab === 'given' && (
          <>
            {reviews.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  {language === 'ka' ? 'შეფასებები ჯერ არ არის' : 'No reviews yet'}
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
                  {language === 'ka' ? 'პროფესიონალებთან პროექტების დასრულების შემდეგ შეგიძლიათ შეფასებების დაწერა' : 'Once you complete projects with professionals, you can leave reviews to help others'}
                </p>
                <Link
                  href="/browse"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-forest-600 dark:bg-primary-500 text-white rounded-xl hover:bg-forest-700 dark:hover:bg-primary-600 transition-colors font-medium"
                >
                  <Sparkles className="h-5 w-5" />
                  {language === 'ka' ? 'სპეციალისტების ნახვა' : 'Find Professionals'}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="rounded-2xl overflow-hidden transition-shadow hover:shadow-md"
                    style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start gap-4">
                        {/* Pro Avatar */}
                        <Link href={`/professionals/${review.proId._id}`} className="flex-shrink-0">
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
                                href={`/professionals/${review.proId._id}`}
                                className="font-medium text-neutral-900 dark:text-neutral-50 hover:text-forest-600 dark:hover:text-primary-400 transition-colors"
                              >
                                {review.proId.name}
                              </Link>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {review.proId.title}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                {renderStars(review.rating, 'sm')}
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {formatDate(review.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Actions Menu */}
                            <div className="relative">
                              <button
                                onClick={() => setActionMenuId(actionMenuId === review._id ? null : review._id)}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              >
                                <MoreVertical className="h-5 w-5 text-neutral-400" />
                              </button>
                              {actionMenuId === review._id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setActionMenuId(null)}
                                  />
                                  <div
                                    className="absolute right-0 top-full mt-1 w-40 rounded-xl shadow-lg overflow-hidden z-20"
                                    style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                                  >
                                    <button
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                      {language === 'ka' ? 'რედაქტირება' : 'Edit Review'}
                                    </button>
                                    <button
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
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
                            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                              {review.text}
                            </p>
                          )}

                          {/* Review Photos */}
                          {review.photos && review.photos.length > 0 && (
                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                              {review.photos.map((photo, idx) => (
                                <div key={idx} className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                                  <img src={photo} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Project Reference */}
                          {review.projectId && (
                            <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {language === 'ka' ? 'პროექტი' : 'Project'}: <span className="font-medium text-neutral-700 dark:text-neutral-300">{review.projectId.title}</span>
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
              <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <div className="w-16 h-16 rounded-2xl bg-[#E07B4F]/5 dark:bg-[#E07B4F]/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-[#E07B4F]" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  {language === 'ka' ? 'ყველაფერი შესრულებულია!' : 'All caught up!'}
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                  {language === 'ka' ? 'მოლოდინში მყოფი შეფასებები არ გაქვთ. პროფესიონალებთან პროექტების დასრულების შემდეგ შეგიძლიათ შეფასებების დაწერა.' : 'You have no pending reviews. Complete more projects to leave feedback for professionals.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReviews.map((pending) => (
                  <div
                    key={pending._id}
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
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
                              <p className="font-medium text-neutral-900 dark:text-neutral-50">
                                {pending.proId.name}
                              </p>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {pending.proId.title}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                {language === 'ka' ? 'დასრულდა' : 'Completed on'} {formatDate(pending.completedAt)}
                              </p>
                            </div>
                            <button
                              className="inline-flex items-center gap-2 px-4 py-2 bg-forest-600 dark:bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-forest-700 dark:hover:bg-primary-600 transition-colors"
                            >
                              <Star className="h-4 w-4" />
                              {language === 'ka' ? 'შეფასების დაწერა' : 'Write Review'}
                            </button>
                          </div>
                          <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
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
