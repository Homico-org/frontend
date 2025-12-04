'use client';

import { useState } from 'react';

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  variant?: 'default' | 'overlay' | 'minimal';
  disabled?: boolean;
}

export default function LikeButton({
  isLiked,
  likeCount,
  onToggle,
  size = 'md',
  showCount = true,
  variant = 'default',
  disabled = false,
}: LikeButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    setIsAnimating(true);
    onToggle();

    // Reset animation after it completes
    setTimeout(() => setIsAnimating(false), 400);
  };

  const sizeConfig = {
    sm: {
      button: 'w-7 h-7',
      icon: 'w-3.5 h-3.5',
      text: 'text-[10px]',
      gap: 'gap-0.5',
    },
    md: {
      button: 'w-9 h-9',
      icon: 'w-4.5 h-4.5',
      text: 'text-xs',
      gap: 'gap-1',
    },
    lg: {
      button: 'w-11 h-11',
      icon: 'w-5 h-5',
      text: 'text-sm',
      gap: 'gap-1.5',
    },
  };

  const config = sizeConfig[size];

  const HeartIcon = ({ filled, className }: { filled: boolean; className: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );

  // Overlay variant - for on top of images
  if (variant === 'overlay') {
    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          group relative flex flex-col items-center ${config.gap}
          transition-transform duration-200
          ${isAnimating ? 'scale-125' : 'hover:scale-110'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div
          className={`
            ${config.button} rounded-full
            flex items-center justify-center
            bg-black/30 backdrop-blur-sm
            border border-white/20
            transition-all duration-200
            ${isLiked ? 'bg-rose-500/80 border-rose-400/50' : 'hover:bg-black/50'}
          `}
        >
          <HeartIcon
            filled={isLiked}
            className={`
              ${config.icon}
              transition-all duration-200
              ${isLiked ? 'text-white' : 'text-white/90'}
              ${isAnimating ? 'scale-0' : 'scale-100'}
            `}
          />
          {isAnimating && (
            <HeartIcon
              filled={true}
              className={`
                absolute ${config.icon} text-rose-500
                animate-ping
              `}
            />
          )}
        </div>
        {showCount && likeCount > 0 && (
          <span className={`${config.text} font-medium text-white drop-shadow-lg`}>
            {likeCount}
          </span>
        )}
      </button>
    );
  }

  // Minimal variant - just icon and count
  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          group inline-flex items-center ${config.gap}
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="relative">
          <HeartIcon
            filled={isLiked}
            className={`
              ${config.icon}
              transition-all duration-200
              ${isLiked ? 'text-rose-500' : 'text-[var(--color-text-tertiary)] group-hover:text-rose-400'}
              ${isAnimating ? 'scale-125' : 'group-hover:scale-110'}
            `}
          />
          {isAnimating && isLiked && (
            <>
              {/* Burst particles */}
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-rose-400 rounded-full animate-burst"
                    style={{
                      transform: `rotate(${i * 60}deg) translateY(-12px)`,
                      animationDelay: `${i * 30}ms`,
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        {showCount && (
          <span
            className={`
              ${config.text} font-medium
              transition-colors duration-200
              ${isLiked ? 'text-rose-500' : 'text-[var(--color-text-tertiary)]'}
            `}
          >
            {likeCount}
          </span>
        )}
      </button>
    );
  }

  // Default variant - contained button
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        group inline-flex items-center ${config.gap} px-3 py-1.5 rounded-full
        transition-all duration-200
        ${isLiked
          ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30'
          : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
      `}
    >
      <div className="relative">
        <HeartIcon
          filled={isLiked}
          className={`
            ${config.icon}
            transition-all duration-200
            ${isLiked ? 'text-rose-500' : 'text-[var(--color-text-tertiary)] group-hover:text-rose-400'}
            ${isAnimating ? 'scale-125' : ''}
          `}
        />
      </div>
      {showCount && (
        <span
          className={`
            ${config.text} font-medium
            transition-colors duration-200
            ${isLiked ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--color-text-secondary)]'}
          `}
        >
          {likeCount}
        </span>
      )}
    </button>
  );
}
