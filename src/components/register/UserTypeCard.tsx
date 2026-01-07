'use client';

import { Briefcase, Search } from 'lucide-react';
import Image from 'next/image';

export interface UserTypeCardProps {
  /** Type of card */
  type: 'client' | 'pro';
  /** Title text */
  title: string;
  /** Description text */
  description: string;
  /** CTA button text */
  ctaText: string;
  /** Badge text (optional, for pro cards) */
  badge?: string;
  /** Free label text */
  freeLabel?: string;
  /** Image URL */
  imageUrl: string;
  /** Click handler */
  onClick: () => void;
  /** Locale for translations */
  locale?: 'en' | 'ka';
  /** Custom className */
  className?: string;
  /** Variant - default is full card, compact is for mobile */
  variant?: 'default' | 'compact';
  /** Whether this option is selected (for compact variant) */
  selected?: boolean;
}

export default function UserTypeCard({
  type,
  title,
  description,
  ctaText,
  badge,
  freeLabel,
  imageUrl,
  onClick,
  className = '',
  variant = 'default',
  selected = false,
}: UserTypeCardProps) {
  // Compact variant for mobile - colorful card style
  if (variant === 'compact') {
    const isPro = type === 'pro';
    
    return (
      <button
        onClick={onClick}
        className={`
          relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 overflow-hidden
          ${selected
            ? isPro
              ? 'bg-gradient-to-br from-[#C4735B] to-[#A85D47] text-white shadow-lg shadow-[#C4735B]/30 scale-[1.02]'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
            : isPro
              ? 'bg-gradient-to-br from-[#C4735B]/10 to-[#A85D47]/5 hover:from-[#C4735B]/20 hover:to-[#A85D47]/10'
              : 'bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100'
          }
          ${className}
        `}
      >
        {/* Mini image */}
        <div className={`
          relative w-16 h-16 rounded-xl overflow-hidden mb-2 transition-all duration-300
          ${selected
            ? 'bg-white/20'
            : isPro
              ? 'bg-[#C4735B]/10'
              : 'bg-blue-500/10'
          }
        `}>
          <Image
            src={imageUrl}
            alt={title}
            fill
            className={`object-contain p-1 transition-all duration-300 ${selected ? 'scale-110' : 'scale-100'}`}
          />
        </div>
        
        {/* Title */}
        <span className={`font-bold text-sm mb-0.5 transition-colors ${
          selected 
            ? 'text-white' 
            : isPro 
              ? 'text-[#C4735B]' 
              : 'text-blue-600'
        }`}>
          {title}
        </span>
        
        {/* Description */}
        <span className={`text-[11px] font-medium transition-colors ${
          selected 
            ? 'text-white/80'
            : isPro
              ? 'text-[#C4735B]/60'
              : 'text-blue-500/60'
        }`}>
          {description}
        </span>
        
        {/* Selection checkmark */}
        {selected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center bg-white shadow-sm">
            <svg className={`w-3 h-3 ${isPro ? 'text-[#C4735B]' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        
        {/* Pro badge - sparkle icon */}
        {isPro && (
          <div className={`absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center ${
            selected ? 'bg-white/25' : 'bg-[#C4735B]/15'
          }`}>
            <svg className={`w-3 h-3 ${selected ? 'text-white' : 'text-[#C4735B]'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
            </svg>
          </div>
        )}
      </button>
    );
  }

  // Default full card variant
  if (type === 'pro') {
    return (
      <button
        onClick={onClick}
        className={`group relative bg-gradient-to-br from-[#C4735B] via-[#B86A52] to-[#A85D47] rounded-3xl p-2 text-left transition-all duration-500 hover:shadow-2xl hover:shadow-[#C4735B]/30 hover:-translate-y-1 overflow-hidden ${className}`}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        {/* Badge */}
        {badge && (
          <div className="absolute top-5 right-5 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold border border-white/10">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {badge}
            </span>
          </div>
        )}

        {/* Image Container */}
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm mb-5">
          <div className="absolute inset-0 bg-gradient-to-t from-[#C4735B]/20 to-transparent" />
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-contain object-center p-6 group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </div>

        {/* Content */}
        <div className="relative px-4 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>

          <p className="text-white/80 mb-5 leading-relaxed">{description}</p>

          <div className="flex items-center justify-between">
            {freeLabel && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{freeLabel}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-white font-semibold group-hover:gap-3 transition-all">
              <span>{ctaText}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Client card
  return (
    <button
      onClick={onClick}
      className={`group relative bg-white rounded-3xl border border-neutral-200/80 p-2 text-left transition-all duration-500 hover:shadow-2xl hover:shadow-neutral-200/50 hover:border-neutral-300 hover:-translate-y-1 ${className}`}
    >
      {/* Image Container with rounded corners */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 mb-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.08),transparent_50%)]" />
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-contain object-center p-6 group-hover:scale-105 transition-transform duration-700 ease-out"
        />
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-neutral-900">{title}</h3>
        </div>

        <p className="text-neutral-500 mb-5 leading-relaxed">{description}</p>

        <div className="flex items-center justify-between">
          {freeLabel && (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{freeLabel}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[#C4735B] font-semibold group-hover:gap-3 transition-all">
            <span>{ctaText}</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}
