'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, ImagePlus, Star, X, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Avatar from '@/components/common/Avatar';
import { formatDate } from '@/utils/dateUtils';

interface BookingDetail {
  id: string;
  _id?: string;
  date: string;
  startHour: number;
  endHour: number;
  note?: string;
  status: string;
  professional: {
    id?: string;
    _id: string;
    name: string;
    avatar?: string;
    title?: string;
  };
  client: {
    id?: string;
    _id: string;
    name: string;
  };
}

interface PhotoPreview {
  id: string;
  file: File;
  preview: string;
}

type PageState = 'loading' | 'form' | 'submitting' | 'success' | 'error' | 'already-reviewed';

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`;
}

export default function BookingReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t, locale } = useLanguage();
  const toast = useToast();
  const bookingId = params.bookingId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pageState, setPageState] = useState<PageState>('loading');
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/`);
      return;
    }
    fetchBooking();
  }, [authLoading, user]);

  const fetchBooking = async () => {
    try {
      const { data } = await api.get<BookingDetail>(`/bookings/${bookingId}`);
      if (data.status !== 'completed') {
        setErrorMessage(t('reviews.bookingNotCompleted') || 'This booking is not yet completed.');
        setPageState('error');
        return;
      }
      setBooking(data);
      setPageState('form');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 409) {
        setPageState('already-reviewed');
      } else {
        setErrorMessage(axiosErr.response?.data?.message || t('common.error'));
        setPageState('error');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploadError('');

    const newPhotos: PhotoPreview[] = [];
    Array.from(files).forEach((file) => {
      if (photos.length + newPhotos.length >= 8) {
        setUploadError('Maximum 8 photos allowed');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Each photo must be under 10MB');
        return;
      }
      newPhotos.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
      });
    });

    if (newPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFilesFromDrop(e.dataTransfer.files);
  };

  const handleFilesFromDrop = (files: FileList) => {
    setUploadError('');
    const newPhotos: PhotoPreview[] = [];
    Array.from(files).forEach((file) => {
      if (photos.length + newPhotos.length >= 8) {
        setUploadError('Maximum 8 photos allowed');
        return;
      }
      if (!file.type.startsWith('image/')) return;
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Each photo must be under 10MB');
        return;
      }
      newPhotos.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
      });
    });
    if (newPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(t('reviews.pleaseSelectRating'));
      return;
    }
    setPageState('submitting');

    try {
      const uploadedUrls: string[] = [];
      for (const photo of photos) {
        const formData = new FormData();
        formData.append('file', photo.file);
        const res = await api.post<{ url: string }>('/upload', formData);
        uploadedUrls.push(res.data.url);
      }

      await api.post(`/reviews/booking/${bookingId}`, {
        rating,
        text: reviewText.trim() || undefined,
      });

      toast.success(t('reviews.reviewSubmitted'));
      setPageState('success');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 409) {
        setPageState('already-reviewed');
      } else {
        toast.error(axiosErr.response?.data?.message || t('reviews.failedToSubmit'));
        setPageState('form');
      }
    }
  };

  const proId = booking?.professional?.id || booking?.professional?._id;
  const displayRating = hoverRating || rating;

  const getRatingLabel = (r: number): string => {
    switch (r) {
      case 5: return t('reviews.ratingExcellent');
      case 4: return t('reviews.ratingVeryGood');
      case 3: return t('reviews.ratingGood');
      case 2: return t('reviews.ratingFair');
      case 1: return t('reviews.ratingPoor');
      default: return '';
    }
  };

  if (pageState === 'loading' || authLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-base)' }}>
        <LoadingSpinner size="lg" color="#C4735B" />
      </div>
    );
  }

  if (pageState === 'already-reviewed') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg-base)' }}>
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center shadow-sm"
          style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
        >
          <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('reviews.alreadyReviewed')}
          </h1>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => proId ? router.push(`/professionals/${proId}`) : router.push('/')}
          >
            {t('reviews.viewProfile')}
          </Button>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg-base)' }}>
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center shadow-sm"
          style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
        >
          <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h1 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('common.error')}
          </h1>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            {errorMessage}
          </p>
          <Button variant="outline" onClick={() => router.push('/')}>
            {t('reviews.goToHomepage')}
          </Button>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg-base)' }}>
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center shadow-sm"
          style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
        >
          <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('reviews.thankYouForReview')}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {t('reviews.reviewAddedToProfile', { name: booking?.professional.name || '' })}
          </p>
          <div className="flex gap-3 justify-center">
            {proId && (
              <Button variant="outline" onClick={() => router.push(`/professionals/${proId}`)}>
                {t('reviews.viewProfile')}
              </Button>
            )}
            <Button onClick={() => router.push('/')}>
              {t('reviews.homepage')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] py-10 px-4" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2 max-w-lg mx-auto mb-8">
        <div className="w-7 h-7 rounded-lg bg-[#C4735B] flex items-center justify-center">
          <span className="text-white text-xs font-black">H</span>
        </div>
        <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Homico</span>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        {/* Pro info card */}
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-4">
            <Avatar
              src={booking?.professional.avatar}
              name={booking?.professional.name || ''}
              size="xl"
            />
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                {booking?.professional.name}
              </h2>
              {booking?.professional.title && (
                <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
                  {booking.professional.title}
                </p>
              )}
              {booking && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  {formatDate(booking.date, locale as 'en' | 'ka' | 'ru')}
                  {' · '}
                  {formatHour(booking.startHour)} — {formatHour(booking.endHour)}
                </p>
              )}
            </div>
          </div>
          {booking?.note && (
            <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {booking.note}
            </p>
          )}
        </div>

        {/* Review form card */}
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
        >
          <h1 className="text-xl font-bold mb-5" style={{ color: 'var(--color-text-primary)' }}>
            {t('reviews.howWasExperience')}
          </h1>

          {/* Star rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              {t('reviews.rateYourExperience')} *
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4735B] rounded"
                  aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= displayRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-neutral-300 dark:text-neutral-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <p className="text-sm mt-1.5 font-medium text-[#C4735B]">
                {getRatingLabel(displayRating)}
              </p>
            )}
          </div>

          {/* Review text */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {t('reviews.yourReview')}
              <span className="font-normal ml-1" style={{ color: 'var(--color-text-tertiary)' }}>
                ({t('common.optional')})
              </span>
            </label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={t('reviews.tellOthers')}
              rows={4}
            />
          </div>

          {/* Photos removed — pro uploads photos during work completion */}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={pageState === 'submitting' || rating === 0}
            className="w-full"
            size="lg"
          >
            {pageState === 'submitting' ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              t('reviews.submitReview')
            )}
          </Button>
        </div>

        <p className="text-center text-xs pb-4" style={{ color: 'var(--color-text-tertiary)' }}>
          {t('reviews.reviewCollectedVia')}{' '}
          <a href="https://homico.ge" className="text-[#C4735B] hover:underline">
            Homico
          </a>
        </p>
      </div>
    </div>
  );
}
