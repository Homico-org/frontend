'use client';

import Avatar from '@/components/common/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatTimeAgoCompact } from '@/utils/dateUtils';
import { Check, Clock, MoreVertical, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import PollOptionCard, { PollOption } from './PollOptionCard';

export interface Poll {
  _id: string;
  jobId: string;
  title: string;
  description?: string;
  options: PollOption[];
  status: 'active' | 'closed' | 'approved';
  selectedOption?: string;
  clientVote?: string;
  createdBy: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  closedAt?: string;
}

interface PollCardProps {
  poll: Poll;
  isPro: boolean;
  isClient: boolean;
  userId?: string;
  locale: string;
  onVote: (pollId: string, optionId: string) => Promise<void>;
  onApprove: (pollId: string, optionId: string) => Promise<void>;
  onClose: (pollId: string) => Promise<void>;
  onDelete: (pollId: string) => Promise<void>;
}

export default function PollCard({
  poll,
  isPro,
  isClient,
  userId,
  locale,
  onVote,
  onApprove,
  onClose,
  onDelete,
}: PollCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(poll.clientVote || null);
  const [isVoting, setIsVoting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isActive = poll.status === 'active';
  const isApproved = poll.status === 'approved';
  const isClosed = poll.status === 'closed';
  const isOwner = poll.createdBy._id === userId;
  const hasImages = poll.options.some(opt => opt.imageUrl);

  const handleOptionSelect = async (optionId: string) => {
    if (!isClient || !isActive) return;

    setSelectedOption(optionId);
    setIsVoting(true);
    try {
      await onVote(poll._id, optionId);
    } catch (error) {
      setSelectedOption(poll.clientVote || null);
    } finally {
      setIsVoting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedOption || !isClient) return;

    setIsApproving(true);
    try {
      await onApprove(poll._id, selectedOption);
    } finally {
      setIsApproving(false);
    }
  };

  const handleClose = async () => {
    setIsClosing(true);
    try {
      await onClose(poll._id);
      setShowMenu(false);
    } finally {
      setIsClosing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(poll._id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn(
      'rounded-2xl border overflow-hidden transition-all',
      'bg-white dark:bg-neutral-900',
      isApproved
        ? 'border-emerald-200 dark:border-emerald-800'
        : isClosed
          ? 'border-neutral-200 dark:border-neutral-800 opacity-75'
          : 'border-neutral-200 dark:border-neutral-700'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Status badge */}
              {isApproved && (
                <Badge variant="success" size="xs" icon={<Check className="w-3 h-3" />}>
                  {locale === 'ka' ? 'არჩეული' : 'Approved'}
                </Badge>
              )}
              {isClosed && (
                <Badge variant="default" size="xs" icon={<X className="w-3 h-3" />}>
                  {locale === 'ka' ? 'დახურული' : 'Closed'}
                </Badge>
              )}
              {isActive && (
                <Badge variant="warning" size="xs" icon={<Clock className="w-3 h-3" />}>
                  {locale === 'ka' ? 'აქტიური' : 'Active'}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
              {poll.title}
            </h3>
            {poll.description && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                {poll.description}
              </p>
            )}
          </div>

          {/* Menu for Pro (owner) */}
          {isPro && isOwner && isActive && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-neutral-400" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 min-w-[140px]">
                    <button
                      onClick={handleClose}
                      disabled={isClosing}
                      className="w-full px-3 py-2 text-left text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                    >
                      {isClosing ? <LoadingSpinner size="sm" color="currentColor" /> : <X className="w-4 h-4" />}
                      {locale === 'ka' ? 'დახურვა' : 'Close Poll'}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      {isDeleting ? <LoadingSpinner size="sm" color="currentColor" /> : <Trash2 className="w-4 h-4" />}
                      {locale === 'ka' ? 'წაშლა' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Options grid */}
      <div className="p-4">
        <div className={cn(
          'grid gap-4',
          hasImages
            ? poll.options.length <= 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : poll.options.length === 3
                ? 'grid-cols-1 sm:grid-cols-3'
                : 'grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2'
        )}>
          {poll.options.map((option) => (
            <PollOptionCard
              key={option._id}
              option={option}
              isSelected={selectedOption === option._id}
              isApproved={isApproved && poll.selectedOption === option._id}
              disabled={!isClient || !isActive || isVoting}
              onSelect={handleOptionSelect}
              locale={locale}
            />
          ))}
        </div>

        {/* Voting indicator */}
        {isVoting && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-neutral-500">
            <LoadingSpinner size="sm" color="currentColor" />
            {locale === 'ka' ? 'ინახება...' : 'Saving...'}
          </div>
        )}
      </div>

      {/* Approve button for client */}
      {isClient && isActive && selectedOption && (
        <div className="px-4 pb-4">
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="w-full py-3 rounded-xl bg-[#C4735B] hover:bg-[#B5624A] text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isApproving ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                {locale === 'ka' ? 'მტკიცდება...' : 'Approving...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {locale === 'ka' ? 'არჩევანის დამტკიცება' : 'Approve Selection'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Footer with creator info */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <Avatar
            src={poll.createdBy.avatar}
            name={poll.createdBy.name}
            size="xs"
          />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {poll.createdBy.name} • {formatTimeAgoCompact(poll.createdAt, locale as 'en' | 'ka')}
          </span>
        </div>
      </div>
    </div>
  );
}
