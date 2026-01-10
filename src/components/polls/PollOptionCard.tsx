'use client';

import { cn } from '@/lib/utils';
import { storage } from '@/services/storage';
import { Badge } from '@/components/ui/badge';
import { Check, ZoomIn } from 'lucide-react';
import { useState } from 'react';

export interface PollOption {
  id?: string;
  _id?: string;
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
  const [showFullImage, setShowFullImage] = useState(false);

  const imageUrl = option.imageUrl?.startsWith('http')
    ? option.imageUrl
    : storage.getFileUrl(option.imageUrl || '');

  return (
    <>
      <button
        type="button"
        onClick={() => !disabled && onSelect(option.id || option._id || '')}
        disabled={disabled}
        className={cn(
          'relative group rounded-2xl overflow-hidden transition-all duration-300',
          'border-2 bg-white dark:bg-neutral-900',
          'flex flex-col',
          isSelected || isApproved
            ? 'border-[#C4735B] shadow-lg shadow-[#C4735B]/10'
            : 'border-neutral-200 dark:border-neutral-700 hover:border-[#C4735B]/50 hover:shadow-md',
          disabled && !isApproved ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
          isApproved && 'border-emerald-500 shadow-lg shadow-emerald-500/10'
        )}
      >
        {/* Image section */}
        {hasImage && (
          <div
            className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800"
            onClick={(e) => {
              if (disabled) {
                e.stopPropagation();
                setShowFullImage(true);
              }
            }}
          >
            <img
              src={imageUrl}
              alt={option.text || 'Option'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Zoom button - always visible for image preview */}
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setShowFullImage(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  setShowFullImage(true);
                }
              }}
              className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </div>

            {/* Selection indicator on image */}
            {(isSelected || isApproved) && (
              <div className={cn(
                'absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg',
                isApproved ? 'bg-emerald-500' : 'bg-[#C4735B]'
              )}>
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Approved badge on image */}
            {isApproved && (
              <div className="absolute bottom-2 left-2">
                <Badge variant="success" size="sm" icon={<Check className="w-3 h-3" />} className="shadow-lg">
                  {locale === 'ka' ? 'არჩეული' : 'Approved'}
                </Badge>
              </div>
            )}

            {/* Gradient overlay for better text visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Text section - always visible, never truncated */}
        <div className={cn(
          'relative flex-1 p-4',
          hasImage && 'border-t border-neutral-100 dark:border-neutral-800',
          !hasImage && 'min-h-[80px] flex items-center justify-center'
        )}>
          {option.text && (
            <p className={cn(
              'text-sm font-medium leading-relaxed',
              hasImage ? 'text-left' : 'text-center',
              isSelected || isApproved
                ? isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#C4735B]'
                : 'text-neutral-700 dark:text-neutral-300'
            )}>
              {option.text}
            </p>
          )}

          {/* Selection indicator for text-only */}
          {!hasImage && (isSelected || isApproved) && (
            <div className={cn(
              'absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center',
              isApproved ? 'bg-emerald-500' : 'bg-[#C4735B]'
            )}>
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          )}

          {/* Approved badge for text-only */}
          {!hasImage && isApproved && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-semibold">
              {locale === 'ka' ? '✓' : '✓'}
            </div>
          )}
        </div>

        {/* Hover overlay */}
        {!disabled && !isApproved && (
          <div className="absolute inset-0 bg-[#C4735B]/0 group-hover:bg-[#C4735B]/5 transition-colors duration-300 pointer-events-none" />
        )}
      </button>

      {/* Full Image Modal */}
      {showFullImage && hasImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={imageUrl}
            alt={option.text || 'Option'}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
          {option.text && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/70 backdrop-blur-sm rounded-xl text-white text-center max-w-lg">
              <p className="text-sm font-medium">{option.text}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
