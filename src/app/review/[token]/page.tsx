'use client';

import Avatar from '@/components/common/Avatar';
import Header from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { CheckCircle, Star, XCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ReviewRequestInfo {
  proId: string;
  proName: string;
  proAvatar?: string;
  proTitle?: string;
  isValid: boolean;
  isUsed: boolean;
}

export default function ExternalReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const toast = useToast();
  const token = params.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<ReviewRequestInfo | null>(null);

  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Fetch review request info
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await api.get(`/reviews/request/${token}`);
        setRequestInfo(response.data);
        
        if (response.data.isUsed) {
          setError(t('reviews.linkAlreadyUsed'));
        } else if (!response.data.isValid) {
          setError(t('reviews.linkExpired'));
        }
      } catch (err) {
        setError(t('reviews.invalidLink'));
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchInfo();
    }
  }, [token, t]);

  const handleSubmit = async () => {
    // Validation
    if (rating === 0) {
      toast.error(t('common.error'), t('reviews.pleaseSelectRating'));
      return;
    }

    if (!clientName.trim() && !isAnonymous) {
      toast.error(t('common.error'), t('reviews.pleaseEnterName'));
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/reviews/external/${token}`, {
        rating,
        text: text.trim() || undefined,
        clientName: isAnonymous ? 'Anonymous' : clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        projectTitle: projectTitle.trim() || undefined,
        isAnonymous,
      });

      setIsSubmitted(true);
      toast.success(t('reviews.thankYou'), t('reviews.reviewSubmitted'));
    } catch (err: any) {
      const message = err.response?.data?.message || t('reviews.failedToSubmit');
      toast.error(t('common.error'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get rating label
  const getRatingLabel = (r: number) => {
    switch (r) {
      case 5: return t('reviews.ratingExcellent');
      case 4: return t('reviews.ratingVeryGood');
      case 3: return t('reviews.ratingGood');
      case 2: return t('reviews.ratingFair');
      case 1: return t('reviews.ratingPoor');
      default: return '';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Header />
        <div className="flex flex-col items-center justify-center pt-32 px-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              {t('reviews.invalidLinkTitle')}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {error}
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              {t('reviews.goToHomepage')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <Header />
        <div className="flex flex-col items-center justify-center pt-32 px-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              {t('reviews.thankYouForReview')}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {t('reviews.reviewAddedToProfile', { name: requestInfo?.proName || '' })}
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => router.push(`/professionals/${requestInfo?.proId}`)}
                variant="outline"
              >
                {t('reviews.viewProfile')}
              </Button>
              <Button onClick={() => router.push('/')}>
                {t('reviews.homepage')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Review form
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header />
      <div className="max-w-2xl mx-auto pt-24 pb-12 px-4">
        {/* Pro Info Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <Avatar
              src={requestInfo?.proAvatar}
              name={requestInfo?.proName || ''}
              size="lg"
            />
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {requestInfo?.proName}
              </h2>
              {requestInfo?.proTitle && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {requestInfo.proTitle}
                </p>
              )}
            </div>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            {t('reviews.requestedFeedback', { name: requestInfo?.proName || '' })}
          </p>
        </div>

        {/* Review Form */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
            {t('reviews.leaveReview')}
          </h1>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('reviews.rating')} *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-neutral-300 dark:text-neutral-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-neutral-500 mt-1">
                {getRatingLabel(rating)}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('reviews.yourReview')}
            </label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('reviews.describeExperience')}
              rows={4}
            />
          </div>

          {/* Project Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('reviews.projectName')}
              <span className="text-neutral-400 font-normal ml-1">
                ({t('common.optional')})
              </span>
            </label>
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder={t('reviews.projectNamePlaceholder')}
            />
          </div>

          {/* Divider */}
          <hr className="my-6 border-neutral-200 dark:border-neutral-700" />

          {/* Your Info */}
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
            {t('reviews.yourInformation')}
          </h3>

          {/* Anonymous Toggle */}
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-5 h-5 rounded border-neutral-300 text-[#C4735B] focus:ring-[#C4735B]"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {t('reviews.leaveAnonymously')}
              </span>
            </label>
          </div>

          {!isAnonymous && (
            <>
              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t('reviews.yourName')} *
                </label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="John D."
                />
              </div>

              {/* Phone (optional, for verification) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t('reviews.phoneNumber')}
                  <span className="text-neutral-400 font-normal ml-1">
                    ({t('reviews.optionalForVerification')})
                  </span>
                </label>
                <Input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+995 555 123 456"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {t('reviews.verifiedReviewsTrusted')}
                </p>
              </div>
            </>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              t('reviews.submitReview')
            )}
          </Button>
        </div>

        {/* Homico branding */}
        <p className="text-center text-sm text-neutral-400 mt-6">
          {t('reviews.reviewCollectedVia')}{' '}
          <a href="https://homico.ge" className="text-[#C4735B] hover:underline">
            Homico
          </a>
        </p>
      </div>
    </div>
  );
}
