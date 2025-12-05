'use client';

import { useState, useCallback } from 'react';

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
  const [particles, setParticles] = useState<Array<{ id: number; angle: number; distance: number }>>([]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isAnimating) return;

    setIsAnimating(true);

    // Create burst particles when liking
    if (!isLiked) {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        angle: (i * 45) + (Math.random() * 20 - 10),
        distance: 20 + Math.random() * 15,
      }));
      setParticles(newParticles);

      // Clear particles after animation
      setTimeout(() => setParticles([]), 600);
    }

    onToggle();

    // Reset animation after it completes
    setTimeout(() => setIsAnimating(false), 500);
  }, [disabled, isAnimating, isLiked, onToggle]);

  const sizeConfig = {
    sm: {
      button: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-[11px]',
      gap: 'gap-1',
      particle: 'w-1 h-1',
    },
    md: {
      button: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-xs',
      gap: 'gap-1.5',
      particle: 'w-1.5 h-1.5',
    },
    lg: {
      button: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-sm',
      gap: 'gap-2',
      particle: 'w-2 h-2',
    },
  };

  const config = sizeConfig[size];

  // Animated heart SVG with morphing effect
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
        style={{
          transformOrigin: 'center',
        }}
      />
    </svg>
  );

  // Sparkle component for extra delight
  const Sparkle = ({ delay, size: sparkleSize }: { delay: number; size: number }) => (
    <svg
      className="absolute text-amber-400 animate-sparkle"
      style={{
        animationDelay: `${delay}ms`,
        width: sparkleSize,
        height: sparkleSize,
      }}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );

  // Ring ripple effect
  const RingRipple = () => (
    <div
      className={`
        absolute inset-0 rounded-full border-2
        ${isLiked ? 'border-rose-400' : 'border-transparent'}
        animate-ring-expand
      `}
    />
  );

  // Overlay variant - for on top of images (most common use)
  if (variant === 'overlay') {
    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          group relative flex flex-col items-center ${config.gap}
          transition-all duration-300
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={isLiked ? 'Unlike' : 'Like'}
      >
        {/* Main button container */}
        <div
          className={`
            relative ${config.button} rounded-full
            flex items-center justify-center
            transition-all duration-300 ease-out
            ${isLiked
              ? 'bg-rose-500/90 shadow-lg shadow-rose-500/30'
              : 'bg-black/40 backdrop-blur-md hover:bg-black/60'
            }
            ${isAnimating && isLiked ? 'scale-110' : 'hover:scale-105'}
            border border-white/20
          `}
        >
          {/* Glow effect when liked */}
          {isLiked && (
            <div className="absolute inset-0 rounded-full bg-rose-400/30 animate-pulse-glow" />
          )}

          {/* Ring ripple on click */}
          {isAnimating && <RingRipple />}

          {/* Heart icon with animation */}
          <HeartIcon
            filled={isLiked}
            className={`
              ${config.icon}
              transition-all duration-300 ease-out
              ${isLiked ? 'text-white' : 'text-white/90 group-hover:text-white'}
              ${isAnimating ? (isLiked ? 'scale-125 animate-heartbeat' : 'scale-90') : ''}
            `}
          />

          {/* Burst particles */}
          {particles.map((particle) => (
            <div
              key={particle.id}
              className={`
                absolute ${config.particle} rounded-full
                bg-gradient-to-br from-rose-400 to-pink-500
                animate-particle-burst
              `}
              style={{
                '--particle-angle': `${particle.angle}deg`,
                '--particle-distance': `${particle.distance}px`,
              } as React.CSSProperties}
            />
          ))}

          {/* Sparkles on like */}
          {isAnimating && isLiked && (
            <>
              <Sparkle delay={0} size={10} />
              <Sparkle delay={100} size={8} />
              <Sparkle delay={200} size={6} />
            </>
          )}
        </div>

        {/* Like count with animation */}
        {showCount && likeCount > 0 && (
          <span
            className={`
              ${config.text} font-semibold
              transition-all duration-300
              ${isLiked ? 'text-white' : 'text-white/80'}
              drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]
              ${isAnimating ? 'scale-110' : ''}
            `}
          >
            {likeCount}
          </span>
        )}
      </button>
    );
  }

  // Minimal variant - just icon and count (for lists, comments, etc.)
  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          group inline-flex items-center ${config.gap}
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          py-1 px-1 -mx-1 rounded-lg
          hover:bg-rose-50 dark:hover:bg-rose-500/10
        `}
        aria-label={isLiked ? 'Unlike' : 'Like'}
      >
        <div className="relative">
          <HeartIcon
            filled={isLiked}
            className={`
              ${config.icon}
              transition-all duration-300 ease-out
              ${isLiked
                ? 'text-rose-500'
                : 'text-[var(--color-text-tertiary)] group-hover:text-rose-400'
              }
              ${isAnimating ? (isLiked ? 'scale-125 animate-heartbeat' : 'scale-90') : 'group-hover:scale-110'}
            `}
          />

          {/* Burst particles for minimal */}
          {particles.map((particle) => (
            <div
              key={particle.id}
              className={`
                absolute top-1/2 left-1/2 w-1 h-1 rounded-full
                bg-rose-400
                animate-particle-burst-mini
              `}
              style={{
                '--particle-angle': `${particle.angle}deg`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {showCount && (
          <span
            className={`
              ${config.text} font-medium tabular-nums
              transition-all duration-300
              ${isLiked ? 'text-rose-500' : 'text-[var(--color-text-tertiary)]'}
              ${isAnimating ? 'scale-110' : ''}
            `}
          >
            {likeCount}
          </span>
        )}
      </button>
    );
  }

  // Default variant - contained button (for standalone use)
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative inline-flex items-center ${config.gap} px-4 py-2 rounded-full
        transition-all duration-300 ease-out
        ${isLiked
          ? 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-500/15 dark:to-pink-500/15 border border-rose-200 dark:border-rose-500/30 shadow-sm shadow-rose-100 dark:shadow-rose-500/10'
          : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] hover:shadow-md'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isAnimating && isLiked ? 'scale-105' : 'hover:scale-[1.02]'}
        overflow-hidden
      `}
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      {/* Shimmer effect on hover when not liked */}
      {!isLiked && (
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}

      {/* Heart with particles */}
      <div className="relative">
        <HeartIcon
          filled={isLiked}
          className={`
            ${config.icon}
            transition-all duration-300 ease-out
            ${isLiked ? 'text-rose-500' : 'text-[var(--color-text-tertiary)] group-hover:text-rose-400'}
            ${isAnimating ? (isLiked ? 'scale-125 animate-heartbeat' : 'scale-90') : ''}
          `}
        />

        {/* Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-rose-400 animate-particle-burst-mini"
            style={{
              '--particle-angle': `${particle.angle}deg`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Count with counter animation */}
      {showCount && (
        <span
          className={`
            ${config.text} font-semibold tabular-nums relative
            transition-all duration-300
            ${isLiked ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--color-text-secondary)]'}
          `}
        >
          <span className={isAnimating ? 'animate-count-bump' : ''}>{likeCount}</span>
        </span>
      )}
    </button>
  );
}
