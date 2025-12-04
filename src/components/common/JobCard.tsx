'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { storage } from '@/services/storage';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  location: string;
  areaSize?: number;
  sizeUnit?: string;
  roomCount?: number;
  budgetType: string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
  pricePerUnit?: number;
  deadline?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  images: string[];
  media: MediaItem[];
  proposalCount: number;
  viewCount: number;
  createdAt: string;
  clientId: {
    _id: string;
    name: string;
    avatar?: string;
    city?: string;
    accountType?: 'individual' | 'organization';
    companyName?: string;
  };
}

interface JobCardProps {
  job: Job;
  variant?: 'default' | 'compact' | 'list';
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
}

export default function JobCard({ job, variant = 'default', onSave, isSaved = false }: JobCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    // Check if job is new (less than 24 hours old)
    const createdDate = new Date(job.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    setIsNew(hoursDiff < 24);

    // Calculate countdown if deadline exists
    if (job.deadline) {
      const updateCountdown = () => {
        const deadline = new Date(job.deadline!);
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft('დასრულებულია');
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}დ ${hours}სთ ${minutes}წთ`);
        } else {
          setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [job.createdAt, job.deadline]);

  const formatBudget = () => {
    if (job.budgetType === 'fixed' && job.budgetAmount) {
      return `₾${job.budgetAmount.toLocaleString()}`;
    } else if (job.budgetType === 'per_sqm' && job.pricePerUnit) {
      const total = job.areaSize ? job.pricePerUnit * job.areaSize : null;
      if (total) {
        return `₾${total.toLocaleString()}`;
      }
      return `₾${job.pricePerUnit}/მ²`;
    } else if (job.budgetType === 'range') {
      if (job.budgetMin && job.budgetMax) {
        return `₾${job.budgetMin.toLocaleString()} - ₾${job.budgetMax.toLocaleString()}`;
      }
      return 'შეთანხმებით';
    } else if (job.budgetType === 'negotiable') {
      return 'შეთანხმებით';
    }
    return 'არ არის მითითებული';
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'ახლახანს';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} წუთის წინ`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} საათის წინ`;
    return `${Math.floor(seconds / 86400)} დღის წინ`;
  };

  // Compact variant for grid view
  if (variant === 'compact') {
    const allMedia: MediaItem[] = [
      ...(job.media || []),
      ...(job.images || []).filter(img => !job.media?.some(m => m.url === img)).map(url => ({ type: 'image' as const, url }))
    ];
    const rawThumbnailUrl = allMedia[0]?.thumbnail || (allMedia[0]?.type === 'image' ? allMedia[0]?.url : null);
    const thumbnailUrl = rawThumbnailUrl ? storage.getFileUrl(rawThumbnailUrl) : null;

    return (
      <Link
        href={`/jobs/${job._id}`}
        className="group block rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] touch-manipulation"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Image */}
        <div className="aspect-[4/3] relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--color-bg-elevated), var(--color-bg-tertiary))' }}>
              <svg className="w-8 h-8 sm:w-12 sm:h-12" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Price badge */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-bold bg-white/95 text-emerald-600 backdrop-blur-sm">
            {formatBudget()}
          </div>
          {/* New badge */}
          {isNew && (
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold bg-amber-400 text-amber-900 flex items-center gap-0.5 sm:gap-1">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
              ახალი
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2.5 sm:p-4">
          <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-2 mb-1.5 sm:mb-2 group-hover:text-emerald-400 transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-zinc-400">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="truncate">{job.location}</span>
            <span className="text-zinc-600 flex-shrink-0">·</span>
            <span className="flex-shrink-0">{getTimeAgo(job.createdAt)}</span>
          </div>
        </div>
      </Link>
    );
  }

  // List variant
  if (variant === 'list') {
    return (
      <Link
        href={`/jobs/${job._id}`}
        className="group block rounded-xl p-5 transition-all duration-300 hover:scale-[1.01]"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)'
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-base group-hover:text-emerald-500 transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                {job.title}
              </h3>
              {isNew && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-400 text-amber-900">ახალი</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {job.location}
              </span>
              <span>·</span>
              <span>{getTimeAgo(job.createdAt)}</span>
              {job.proposalCount > 0 && (
                <>
                  <span>·</span>
                  <span>{job.proposalCount} წინადადება</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-bold text-lg text-emerald-500">{formatBudget()}</div>
            <span className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
              {job.category}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant - Full featured card matching reference design
  return (
    <div
      className="relative rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.01]"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Main content */}
      <div className="p-4 sm:p-6">
        {/* Header with avatar and title */}
        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-5">
          {/* Client avatar */}
          <div className="flex-shrink-0">
            <Avatar
              src={job.clientId?.avatar}
              name={job.clientId?.name || 'Client'}
              size="lg"
              rounded="full"
              className="ring-2 ring-zinc-700 w-12 h-12 sm:w-14 sm:h-14"
            />
          </div>

          {/* Title and badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg lg:text-xl text-white mb-1 sm:mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                  {job.title}
                </h3>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Location badge */}
                  <div className="flex items-center gap-1 text-zinc-400 text-xs sm:text-sm">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="truncate max-w-[100px] sm:max-w-none">{job.location}</span>
                  </div>
                  {/* New job badge */}
                  {isNew && (
                    <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-amber-400/90 text-amber-900 text-[10px] sm:text-xs font-semibold">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                      </svg>
                      ახალი
                    </div>
                  )}
                </div>
              </div>
              {/* Price */}
              <div className="flex-shrink-0 text-right">
                <div className="text-base sm:text-lg lg:text-xl font-bold text-emerald-400">
                  {formatBudget()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3">
          {job.description}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={`/jobs/${job._id}`}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm font-medium transition-colors touch-manipulation"
            style={{ backgroundColor: 'var(--color-bg-elevated)' }}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="hidden sm:inline">დეტალები</span>
            <span className="sm:hidden">ნახვა</span>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave?.(job._id);
            }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
              isSaved
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-white'
            }`}
            style={!isSaved ? { backgroundColor: 'var(--color-bg-elevated)' } : {}}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="hidden sm:inline">შენახვა</span>
          </button>
          <Link
            href={`/users/${job.clientId?._id}`}
            className="hidden sm:flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium transition-colors touch-manipulation"
            style={{ backgroundColor: 'var(--color-bg-elevated)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            მაძიებელი
          </Link>
        </div>
      </div>

      {/* Countdown footer */}
      {job.deadline && timeLeft && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#84cc16] flex items-center justify-center gap-1.5 sm:gap-2">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-zinc-900 font-medium text-xs sm:text-sm">
            დარჩა: {timeLeft}
          </span>
        </div>
      )}
    </div>
  );
}
