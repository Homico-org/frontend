'use client';

import AuthGuard from '@/components/common/AuthGuard';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import {
  CheckCircle,
  Copy,
  ExternalLink,
  Globe,
  MessageSquare,
  Send,
  ShieldCheck,
  Star,
  Users
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ReviewStats {
  totalReviews: number;
  homicoReviews: number;
  externalReviews: number;
  averageRating: number;
  pendingInvitations: number;
}

interface Review {
  _id: string;
  rating: number;
  text?: string;
  source: 'homico' | 'external';
  isAnonymous?: boolean;
  externalClientName?: string;
  projectTitle?: string;
  clientId?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

function ProReviewsPageContent() {
  const { t } = useLanguage();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewLink, setReviewLink] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Invitation form
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, reviewLinkRes] = await Promise.all([
        api.get('/reviews/stats/my'),
        api.get('/reviews/request-link'),
      ]);
      setStats(statsRes.data);
      setReviewLink(reviewLinkRes.data.link);
    } catch (err) {
      console.error('Failed to fetch review data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Copy link to clipboard
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(reviewLink);
      setIsCopied(true);
      toast.success(t('common.success'), t('reviews.linkCopied'));
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      toast.error(t('common.error'), t('common.tryAgain'));
    }
  };

  // Send invitation
  const sendInvitation = async () => {
    if (!invitePhone.trim()) {
      toast.error(t('common.error'), t('common.required'));
      return;
    }

    setIsSendingInvite(true);
    try {
      await api.post('/reviews/send-invitation', {
        phone: invitePhone.trim(),
        name: inviteName.trim() || undefined,
      });

      toast.success(t('common.success'), t('reviews.invitationSent'));
      setInvitePhone('');
      setInviteName('');

      // Refresh stats
      fetchData();
    } catch (err: any) {
      const message = err.response?.data?.message || t('common.error');
      toast.error(t('common.error'), message);
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Share on WhatsApp
  const shareOnWhatsApp = () => {
    const message = `${t('reviews.leaveReview')}: ${reviewLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-dark-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-neutral-50">
            {t('common.reviews')}
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
            {t('reviews.seeWhatClientsAreSaying')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2.5 rounded-xl">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('reviews.average')}
                </p>
                <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  {stats?.averageRating ? stats.averageRating.toFixed(1) : '-'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="bg-forest-800 p-2.5 rounded-xl">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('reviews.total')}
                </p>
                <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  {stats?.totalReviews || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#C4735B] p-2.5 rounded-xl">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('reviews.homicoReviews')}
                </p>
                <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  {stats?.homicoReviews || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2.5 rounded-xl">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('reviews.externalReviews')}
                </p>
                <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  {stats?.externalReviews || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Request Reviews Section */}
        <div className="bg-gradient-to-br from-[#C4735B]/10 to-[#C4735B]/5 dark:from-[#C4735B]/20 dark:to-[#C4735B]/10 rounded-2xl border border-[#C4735B]/20 p-6 mb-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="bg-[#C4735B] p-3 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {t('reviews.requestReviews')}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {t('reviews.shareWithClients')}
              </p>
            </div>
          </div>

          {/* Review Link */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('reviews.yourReviewLink')}
            </label>
            <div className="flex gap-2">
              <Input
                value={reviewLink}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={copyLink}
                className="shrink-0"
              >
                {isCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                onClick={shareOnWhatsApp}
                className="shrink-0 hidden sm:flex"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Send Invitation */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t('reviews.sendInvitationSms')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder={t('reviews.clientName')}
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
              <Input
                type="tel"
                placeholder="+995 555 123 456"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
              />
              <Button
                onClick={sendInvitation}
                disabled={isSendingInvite || !invitePhone.trim()}
                className="bg-[#C4735B] hover:bg-[#B5654D]"
              >
                {isSendingInvite ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t('common.send')}
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              {t('reviews.invitationsRemaining', { count: 10 - (stats?.pendingInvitations || 0) })}
            </p>
          </div>
        </div>

        {/* Reviews List or Empty State */}
        {stats && stats.totalReviews > 0 ? (
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              {t('reviews.yourReviews')}
            </h3>
            {/* Reviews would be fetched and displayed here */}
            <p className="text-neutral-500 text-sm">
              {t('common.loading')}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none">
            <EmptyState
              icon={Star}
              title="No reviews yet"
              titleKa="შეფასებები ჯერ არ არის"
              description="Share your review link with past clients or complete jobs on Homico to receive reviews"
              descriptionKa="გააზიარეთ ლინკი ძველ კლიენტებთან ან შეასრულეთ შეკვეთები Homico-ზე"
              actionLabel="Find Jobs"
              actionLabelKa="სამუშაოების ძებნა"
              actionHref="/jobs"
              variant="illustrated"
              size="md"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProReviewsPage() {
  return (
    <AuthGuard allowedRoles={['pro', 'admin']}>
      <ProReviewsPageContent />
    </AuthGuard>
  );
}
