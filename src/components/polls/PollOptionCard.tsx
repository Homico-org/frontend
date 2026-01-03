'use client';

import { Check } from 'lucide-react';
import { storage } from '@/services/storage';
import { cn } from '@/lib/utils';

export interface PollOption {
  _id: string;
  text?: string;
  imageUrl?: string;
}

interface PollOptionCardProps {
  option: PollOption;
  isSelected: boolean;
  isApproved: boolean;
  disabled: boolean;
  onSelect: (optionId: string) => void;
  locale: string;
}

export default function PollOptionCard({
  option,
  isSelected,
  isApproved,
  disabled,
  onSelect,
  locale,
}: PollOptionCardProps) {
  const hasImage = !!option.imageUrl;

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(option._id)}
      disabled={disabled}
      className={cn(
        'relative group rounded-xl overflow-hidden transition-all duration-300',
        'border-2',
        hasImage ? 'aspect-square' : 'p-4',
        isSelected || isApproved
          ? 'border-[#C4735B] ring-2 ring-[#C4735B]/20'
          : 'border-neutral-200 dark:border-neutral-700 hover:border-[#C4735B]/50',
        disabled && !isApproved ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        isApproved && 'border-emerald-500 ring-2 ring-emerald-500/20'
      )}
    >
      {/* Image option */}
      {hasImage && (
        <div className="absolute inset-0">
          <img
            src={option.imageUrl?.startsWith('http') ? option.imageUrl : storage.getFileUrl(option.imageUrl || '')}
            alt={option.text || 'Option'}
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Text label at bottom */}
          {option.text && (
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white text-sm font-medium truncate">
                {option.text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Text-only option */}
      {!hasImage && (
        <div className="flex items-center justify-center min-h-[60px]">
          <p className={cn(
            'text-sm font-medium text-center',
            isSelected || isApproved
              ? 'text-[#C4735B]'
              : 'text-neutral-700 dark:text-neutral-300'
          )}>
            {option.text}
          </p>
        </div>
      )}

      {/* Selection indicator */}
      {(isSelected || isApproved) && (
        <div className={cn(
          'absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center',
          isApproved ? 'bg-emerald-500' : 'bg-[#C4735B]'
        )}>
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Approved badge */}
      {isApproved && (
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
          {locale === 'ka' ? 'დამტკიცებული' : 'Approved'}
        </div>
      )}

      {/* Hover effect overlay */}
      {!disabled && !isApproved && (
        <div className={cn(
          'absolute inset-0 transition-opacity duration-300',
          hasImage ? 'bg-[#C4735B]/0 group-hover:bg-[#C4735B]/10' : 'bg-transparent group-hover:bg-[#C4735B]/5'
        )} />
      )}
    </button>
  );
}
