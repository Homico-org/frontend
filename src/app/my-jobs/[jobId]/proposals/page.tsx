'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import Header, { HeaderSpacer } from '@/components/common/Header';
import HiringChoiceModal from '@/components/proposals/HiringChoiceModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useCategoryLabels } from '@/hooks/useCategoryLabels';
import { isHighLevelCategory } from '@/utils/categoryHelpers';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  ArrowLeft,
  Check,
  Clock,
  Phone,
  Star,
  MessageCircle,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

const ACCENT_COLOR = '#C4735B';

interface Proposal {
  _id: string;
  coverLetter: string;
  proposedPrice?: number;
  estimatedDuration?: number;
  estimatedDurationUnit?: string;
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';
  hiringChoice?: 'homico' | 'direct';
  contactRevealed?: boolean;
  viewedByClient: boolean;
  createdAt: string;
  proId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
  };
}

interface Job {
  _id: string;
  title: string;
  category: string;
  subcategory?: string;
  status: string;
  clientId: string;
}

function getTimeAgo(dateStr: string, locale: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (locale === 'ka') {
    if (diffMins < 60) return `${diffMins} წუთის წინ`;
    if (diffHours < 24) return `${diffHours} საათის წინ`;
    return `${diffDays} დღის წინ`;
  }

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function ProposalsPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getCategoryLabel, locale } = useCategoryLabels();
  const toast = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showHiringModal, setShowHiringModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState<string | null>(null);

  const jobId = params.jobId as string;
  const isHighLevel = job ? isHighLevelCategory(job.category) : false;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [jobRes, proposalsRes] = await Promise.all([
          api.get(`/jobs/${jobId}`),
          api.get(`/jobs/${jobId}/proposals`),
        ]);

        setJob(jobRes.data);
        setProposals(proposalsRes.data);

        // Mark proposals as viewed
        await api.post(`/jobs/counters/mark-proposals-viewed/${jobId}`);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error(
          locale === 'ka' ? 'შეცდომა' : 'Error',
          locale === 'ka' ? 'მონაცემების ჩატვირთვა ვერ მოხერხდა' : 'Failed to load data'
        );
        router.push('/my-jobs');
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchData();
    }
  }, [jobId, locale, router, toast]);

  const handleShortlist = useCallback((proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowHiringModal(true);
  }, []);

  const handleHiringChoice = useCallback(async (choice: 'homico' | 'direct') => {
    if (!selectedProposal) return;

    setIsProcessing(true);
    try {
      const response = await api.post(`/jobs/proposals/${selectedProposal._id}/shortlist`, {
        hiringChoice: choice,
      });

      // Update proposal in list
      setProposals(prev =>
        prev.map(p =>
          p._id === selectedProposal._id
            ? { ...p, status: 'shortlisted', hiringChoice: choice, contactRevealed: choice === 'direct', proId: response.data.proId || p.proId }
            : p
        )
      );

      setShowHiringModal(false);
      setSelectedProposal(null);

      if (choice === 'direct') {
        toast.success(
          locale === 'ka' ? 'წარმატება' : 'Success',
          locale === 'ka' ? 'ტელეფონის ნომერი გამოჩნდა' : 'Phone number revealed'
        );
      } else {
        toast.success(
          locale === 'ka' ? 'წარმატება' : 'Success',
          locale === 'ka' ? 'შორტლისტში დაემატა' : 'Added to shortlist'
        );
      }
    } catch (error: any) {
      toast.error(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        error.response?.data?.message || (locale === 'ka' ? 'ვერ მოხერხდა' : 'Failed to process')
      );
    } finally {
      setIsProcessing(false);
    }
  }, [selectedProposal, locale, toast]);

  const handleReject = useCallback(async (proposalId: string) => {
    setIsProcessing(true);
    try {
      await api.post(`/jobs/proposals/${proposalId}/reject`);

      setProposals(prev =>
        prev.map(p =>
          p._id === proposalId
            ? { ...p, status: 'rejected' }
            : p
        )
      );

      setShowRejectConfirm(null);
      toast.success(
        locale === 'ka' ? 'წარმატება' : 'Success',
        locale === 'ka' ? 'შეთავაზება უარყოფილია' : 'Proposal rejected'
      );
    } catch (error: any) {
      toast.error(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        error.response?.data?.message || (locale === 'ka' ? 'ვერ მოხერხდა' : 'Failed to reject')
      );
    } finally {
      setIsProcessing(false);
    }
  }, [locale, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Header />
        <HeaderSpacer />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="w-32 h-6 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse mb-6" />
          <div className="w-64 h-8 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-neutral-50 dark:bg-neutral-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const shortlistedProposals = proposals.filter(p => p.status === 'shortlisted');
  const rejectedProposals = proposals.filter(p => p.status === 'rejected' || p.status === 'withdrawn');

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      <Header />
      <HeaderSpacer />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {/* Back Link */}
        <Link
          href="/my-jobs"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === 'ka' ? 'უკან' : 'Back to Jobs'}
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            {locale === 'ka' ? 'შეთავაზებები' : 'Proposals'}
          </h1>
          {job && (
            <p className="text-neutral-500 dark:text-neutral-400">
              {job.title} • <span style={{ color: ACCENT_COLOR }}>{getCategoryLabel(job.category)}</span>
            </p>
          )}
        </div>

        {/* Info Banner for Low-Level Categories */}
        {!isHighLevel && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {locale === 'ka' ? 'პირდაპირი კონტაქტი' : 'Direct Contact Category'}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  {locale === 'ka'
                    ? 'ამ კატეგორიაში სპეციალისტებთან პირდაპირ ტელეფონით დაკავშირდებით. Homico-ს მეშვეობით დაქირავებისას მიიღებთ გარანტიას.'
                    : 'For this category, you can contact professionals directly by phone. Hiring through Homico gives you quality guarantee.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Proposals List */}
        {proposals.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">
              {locale === 'ka' ? 'შეთავაზებები ჯერ არ არის' : 'No proposals yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Proposals */}
            {pendingProposals.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
                  {locale === 'ka' ? 'ახალი შეთავაზებები' : 'New Proposals'} ({pendingProposals.length})
                </h2>
                <div className="space-y-4">
                  {pendingProposals.map(proposal => (
                    <ProposalCard
                      key={proposal._id}
                      proposal={proposal}
                      locale={locale}
                      onShortlist={() => handleShortlist(proposal)}
                      onReject={() => setShowRejectConfirm(proposal._id)}
                      isHighLevel={isHighLevel}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Shortlisted Proposals */}
            {shortlistedProposals.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
                  {locale === 'ka' ? 'შერჩეული' : 'Shortlisted'} ({shortlistedProposals.length})
                </h2>
                <div className="space-y-4">
                  {shortlistedProposals.map(proposal => (
                    <ProposalCard
                      key={proposal._id}
                      proposal={proposal}
                      locale={locale}
                      isShortlisted
                      isHighLevel={isHighLevel}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Proposals */}
            {rejectedProposals.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-4">
                  {locale === 'ka' ? 'უარყოფილი' : 'Rejected'} ({rejectedProposals.length})
                </h2>
                <div className="space-y-4 opacity-60">
                  {rejectedProposals.map(proposal => (
                    <ProposalCard
                      key={proposal._id}
                      proposal={proposal}
                      locale={locale}
                      isRejected
                      isHighLevel={isHighLevel}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Hiring Choice Modal */}
      <HiringChoiceModal
        isOpen={showHiringModal}
        onClose={() => {
          setShowHiringModal(false);
          setSelectedProposal(null);
        }}
        onChooseHomico={() => handleHiringChoice('homico')}
        onChooseDirect={() => handleHiringChoice('direct')}
        proName={selectedProposal?.proId?.name || ''}
        proPhone={selectedProposal?.proId?.phone}
        isLoading={isProcessing}
      />

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRejectConfirm(null)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              {locale === 'ka' ? 'შეთავაზების უარყოფა' : 'Reject Proposal?'}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
              {locale === 'ka'
                ? 'ეს მოქმედება ვერ გაუქმდება.'
                : 'This action cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectConfirm(null)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                onClick={() => handleReject(showRejectConfirm)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isProcessing ? '...' : locale === 'ka' ? 'უარყოფა' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProposalCard({
  proposal,
  locale,
  onShortlist,
  onReject,
  isShortlisted = false,
  isRejected = false,
  isHighLevel = true,
}: {
  proposal: Proposal;
  locale: string;
  onShortlist?: () => void;
  onReject?: () => void;
  isShortlisted?: boolean;
  isRejected?: boolean;
  isHighLevel?: boolean;
}) {
  const pro = proposal.proId;

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-2xl border ${isShortlisted ? 'border-green-200 dark:border-green-800' : 'border-neutral-100 dark:border-neutral-800'} p-5`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar
          src={pro?.avatar}
          name={pro?.name || 'Pro'}
          size="lg"
          className="w-14 h-14"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <Link
                href={`/professionals/${pro?._id}`}
                className="text-base font-semibold text-neutral-900 dark:text-white hover:underline"
              >
                {pro?.name || 'Professional'}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock className="w-3 h-3 text-neutral-400" />
                <span className="text-xs text-neutral-400">{getTimeAgo(proposal.createdAt, locale)}</span>
              </div>
            </div>

            {/* Status Badge */}
            {isShortlisted && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: ACCENT_COLOR }}
              >
                <Check className="w-3 h-3" />
                {proposal.hiringChoice === 'direct'
                  ? (locale === 'ka' ? 'პირდაპირი' : 'Direct')
                  : (locale === 'ka' ? 'Homico' : 'Homico')}
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                <X className="w-3 h-3" />
                {locale === 'ka' ? 'უარყოფილი' : 'Rejected'}
              </span>
            )}
          </div>

          {/* Cover Letter */}
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3 line-clamp-3">
            {proposal.coverLetter}
          </p>

          {/* Price & Duration */}
          <div className="flex items-center gap-4 mb-4">
            {proposal.proposedPrice && (
              <span className="text-lg font-bold" style={{ color: ACCENT_COLOR }}>
                ₾{proposal.proposedPrice.toLocaleString()}
              </span>
            )}
            {proposal.estimatedDuration && (
              <span className="text-sm text-neutral-500">
                {proposal.estimatedDuration}{' '}
                {proposal.estimatedDurationUnit === 'days'
                  ? locale === 'ka' ? 'დღე' : 'days'
                  : proposal.estimatedDurationUnit === 'weeks'
                    ? locale === 'ka' ? 'კვირა' : 'weeks'
                    : locale === 'ka' ? 'თვე' : 'months'}
              </span>
            )}
          </div>

          {/* Phone Number (if revealed) */}
          {isShortlisted && proposal.contactRevealed && pro?.phone && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-0.5">
                    {locale === 'ka' ? 'ტელეფონი' : 'Phone'}
                  </p>
                  <a
                    href={`tel:${pro.phone}`}
                    className="text-lg font-semibold text-green-700 dark:text-green-300 hover:underline"
                  >
                    {pro.phone}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Actions for Pending */}
          {!isShortlisted && !isRejected && (
            <div className="flex items-center gap-2">
              <button
                onClick={onShortlist}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: ACCENT_COLOR }}
              >
                <Check className="w-4 h-4" />
                {locale === 'ka' ? 'შორტლისტში' : 'Shortlist'}
              </button>
              <button
                onClick={onReject}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
                {locale === 'ka' ? 'უარყოფა' : 'Reject'}
              </button>
              <Link
                href={`/professionals/${pro?._id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {locale === 'ka' ? 'პროფილი' : 'Profile'}
              </Link>
            </div>
          )}

          {/* Actions for Shortlisted */}
          {isShortlisted && (
            <div className="flex items-center gap-2">
              {proposal.hiringChoice === 'homico' && isHighLevel && (
                <Link
                  href={`/messages?recipient=${pro?._id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  <MessageCircle className="w-4 h-4" />
                  {locale === 'ka' ? 'მიწერა' : 'Message'}
                </Link>
              )}
              {proposal.contactRevealed && pro?.phone && (
                <a
                  href={`tel:${pro.phone}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {locale === 'ka' ? 'დარეკვა' : 'Call'}
                </a>
              )}
              <Link
                href={`/professionals/${pro?._id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {locale === 'ka' ? 'პროფილი' : 'Profile'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProposalsPage() {
  return (
    <AuthGuard allowedRoles={['client', 'pro', 'company', 'admin']}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: ACCENT_COLOR }} />
        </div>
      }>
        <ProposalsPageContent />
      </Suspense>
    </AuthGuard>
  );
}
