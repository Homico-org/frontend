'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, ChevronRight, Plus } from 'lucide-react';
import PollCard, { Poll } from './PollCard';
import CreatePollModal from './CreatePollModal';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinnerCentered } from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';
import { ACCENT_COLOR as ACCENT } from '@/constants/theme';

// Helper to get ID from object (handles both id and _id)
const getId = (obj: { id?: string; _id?: string } | undefined): string => {
  if (!obj) return '';
  return obj.id || obj._id || '';
};

interface PollsTabProps {
  jobId: string;
  isPro: boolean;
  isClient: boolean;
  userId?: string;
  locale: string;
  embedded?: boolean; // When true, shows content directly without accordion
}

export default function PollsTab({
  jobId,
  isPro,
  isClient,
  userId,
  locale,
  embedded = false,
}: PollsTabProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(embedded); // Auto-expand if embedded
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchPolls = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/jobs/${jobId}/polls`);
      setPolls(response.data);
      setHasLoaded(true);
    } catch (err) {
      console.error('Failed to fetch polls:', err);
      setError(locale === 'ka' ? 'გამოკითხვების ჩატვირთვა ვერ მოხერხდა' : 'Failed to load polls');
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [jobId, locale]);

  useEffect(() => {
    if ((isExpanded || embedded) && !hasLoaded) {
      fetchPolls();
    }
  }, [isExpanded, embedded, hasLoaded, fetchPolls]);

  const handleCreatePoll = async (data: { title: string; description?: string; options: { text?: string; imageUrl?: string }[] }) => {
    const response = await api.post(`/jobs/${jobId}/polls`, data);
    setPolls([response.data, ...polls]);
  };

  const handleVote = async (pollId: string, optionId: string) => {
    await api.post(`/jobs/polls/${pollId}/vote`, { optionId });
    setPolls(polls.map(p =>
      getId(p) === pollId ? { ...p, clientVote: optionId } : p
    ));
  };

  const handleApprove = async (pollId: string, optionId: string) => {
    await api.post(`/jobs/polls/${pollId}/approve`, { optionId });
    setPolls(polls.map(p =>
      getId(p) === pollId ? { ...p, status: 'approved', selectedOption: optionId } : p
    ));
  };

  const handleClose = async (pollId: string) => {
    await api.post(`/jobs/polls/${pollId}/close`);
    setPolls(polls.map(p =>
      getId(p) === pollId ? { ...p, status: 'closed' } : p
    ));
  };

  const handleDelete = async (pollId: string) => {
    await api.delete(`/jobs/polls/${pollId}`);
    setPolls(polls.filter(p => getId(p) !== pollId));
  };

  const activePollsCount = polls.filter(p => p.status === 'active').length;

  // Render content section (shared between accordion and embedded modes)
  const renderContent = () => (
    <>

      {/* Content */}
      <div className={embedded ? "" : "p-4"}>
        {isLoading ? (
          <LoadingSpinnerCentered size="lg" color={ACCENT} />
        ) : error ? (
          <Alert variant="error" size="sm" showIcon={false}>{error}</Alert>
        ) : polls.length > 0 ? (
          <div className="space-y-4">
            {polls.map((poll) => (
              <PollCard
                key={poll.id || poll._id}
                poll={poll}
                isPro={isPro}
                isClient={isClient}
                userId={userId}
                locale={locale}
                onVote={handleVote}
                onApprove={handleApprove}
                onClose={handleClose}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-tertiary)]">
            <BarChart3 className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm font-medium">
              {locale === 'ka' ? 'გამოკითხვები არ არის' : 'No polls yet'}
            </p>
            <p className="text-xs mt-1">
              {isPro
                ? (locale === 'ka' ? 'შექმენით გამოკითხვა კლიენტის არჩევანისთვის' : 'Create a poll for client to choose from')
                : (locale === 'ka' ? 'პროფესიონალი შექმნის გამოკითხვას' : 'Professional will create polls for your decisions')}
            </p>
            {isPro && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: ACCENT }}
              >
                <Plus className="w-4 h-4" />
                {locale === 'ka' ? 'შექმნა' : 'Create Poll'}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );

  // Embedded mode: show content directly
  if (embedded) {
    return (
      <div>
        {renderContent()}
        <CreatePollModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePoll}
          locale={locale}
        />
      </div>
    );
  }

  // Accordion mode (default)
  return (
    <div className="border-t border-[var(--color-border)]">
      {/* Header Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: `${ACCENT}15` }}>
            <BarChart3 className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="text-sm font-semibold" style={{ color: ACCENT }}>
              {locale === 'ka' ? 'გამოკითხვები' : 'Polls'}
            </span>
            {polls.length > 0 && (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
                {polls.length}
              </span>
            )}
          </div>
          {activePollsCount > 0 && (
            <span className="text-xs text-[var(--color-text-tertiary)] hidden sm:inline">
              {activePollsCount} {locale === 'ka' ? 'აქტიური' : 'active'}
            </span>
          )}
        </div>
        <ChevronRight
          className={`w-5 h-5 text-[var(--color-text-tertiary)] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-[var(--color-bg-tertiary)]/30 rounded-2xl border border-[var(--color-border)] overflow-hidden">
            {renderContent()}
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePoll}
        locale={locale}
      />
    </div>
  );
}
