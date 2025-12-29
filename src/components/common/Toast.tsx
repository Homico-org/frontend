'use client';

import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';

// Refined icons with more character
const icons = {
  success: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M8 12.5l2.5 2.5 5.5-5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-draw"
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M15 9l-6 6m0-6l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-draw"
      />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L2 21h20L12 3z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M12 9v4m0 4h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M12 16v-4m0-4h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

// Distinctive color schemes - Success GREEN, Error RED, Warning AMBER
const colorSchemes = {
  success: {
    // Vibrant emerald green
    gradient: 'from-emerald-500 to-green-600',
    bg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/80 dark:to-green-950/60',
    border: 'border-emerald-200/80 dark:border-emerald-700/50',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    title: 'text-emerald-900 dark:text-emerald-100',
    desc: 'text-emerald-700 dark:text-emerald-300',
    progress: 'bg-gradient-to-r from-emerald-500 to-green-500',
    glow: 'shadow-emerald-500/20 dark:shadow-emerald-500/10',
    ring: 'ring-emerald-500/20',
  },
  error: {
    // Bold red
    gradient: 'from-red-500 to-rose-600',
    bg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/80 dark:to-rose-950/60',
    border: 'border-red-200/80 dark:border-red-700/50',
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    title: 'text-red-900 dark:text-red-100',
    desc: 'text-red-700 dark:text-red-300',
    progress: 'bg-gradient-to-r from-red-500 to-rose-500',
    glow: 'shadow-red-500/20 dark:shadow-red-500/10',
    ring: 'ring-red-500/20',
  },
  warning: {
    // Warm amber
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/80 dark:to-orange-950/60',
    border: 'border-amber-200/80 dark:border-amber-700/50',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    title: 'text-amber-900 dark:text-amber-100',
    desc: 'text-amber-700 dark:text-amber-300',
    progress: 'bg-gradient-to-r from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20 dark:shadow-amber-500/10',
    ring: 'ring-amber-500/20',
  },
  info: {
    // Cool blue
    gradient: 'from-blue-500 to-indigo-500',
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/80 dark:to-indigo-950/60',
    border: 'border-blue-200/80 dark:border-blue-700/50',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    title: 'text-blue-900 dark:text-blue-100',
    desc: 'text-blue-700 dark:text-blue-300',
    progress: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    glow: 'shadow-blue-500/20 dark:shadow-blue-500/10',
    ring: 'ring-blue-500/20',
  },
};

interface ToastItemProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
  onRemove: (id: string) => void;
  index: number;
}

function ToastItem({ id, type, message, description, duration = 4000, onRemove, index }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const scheme = colorSchemes[type];
  const progressRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Staggered entrance animation
    const enterDelay = setTimeout(() => {
      setIsVisible(true);
    }, index * 50);

    return () => clearTimeout(enterDelay);
  }, [index]);

  // Smooth progress bar animation
  useEffect(() => {
    if (duration <= 0) return;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining > 0) {
        progressRef.current = setTimeout(tick, 16);
      }
    };

    progressRef.current = setTimeout(tick, 16);

    return () => {
      if (progressRef.current) clearTimeout(progressRef.current);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(id);
    }, 300);
  };

  return (
    <div
      className={`
        relative overflow-hidden
        w-full max-w-[380px]
        ${scheme.bg}
        border ${scheme.border}
        rounded-2xl
        shadow-xl ${scheme.glow}
        ring-1 ${scheme.ring}
        backdrop-blur-xl
        transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        ${isVisible && !isLeaving
          ? 'translate-x-0 opacity-100 scale-100'
          : isLeaving
            ? 'translate-x-full opacity-0 scale-95'
            : 'translate-x-12 opacity-0 scale-90'
        }
      `}
      role="alert"
      style={{
        transitionDelay: isVisible && !isLeaving ? `${index * 50}ms` : '0ms',
      }}
    >
      {/* Decorative gradient line at top */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${scheme.gradient} opacity-80`} />

      <div className="flex items-start gap-3.5 p-4 pt-5">
        {/* Icon with animated background */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl ${scheme.iconBg}
          flex items-center justify-center
          transform transition-transform duration-500
          ${isVisible ? 'scale-100 rotate-0' : 'scale-50 -rotate-12'}
        `}>
          <div className={scheme.icon}>
            {icons[type]}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className={`text-sm font-semibold ${scheme.title} leading-tight`}>
            {message}
          </p>
          {description && (
            <p className={`mt-1.5 text-sm ${scheme.desc} leading-relaxed opacity-90`}>
              {description}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 w-8 h-8 rounded-xl
            flex items-center justify-center
            ${scheme.iconBg} ${scheme.icon}
            opacity-70 hover:opacity-100
            transform hover:scale-110 active:scale-95
            transition-all duration-200
          `}
          aria-label="Close"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 4l8 8m0-8l-8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Animated progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 overflow-hidden rounded-b-2xl">
          <div
            className={`h-full ${scheme.progress} transition-all duration-100 ease-linear rounded-full`}
            style={{
              width: `${progress}%`,
              boxShadow: '0 0 8px currentColor',
            }}
          />
        </div>
      )}

      {/* Subtle pulse animation for emphasis */}
      <div
        className={`
          absolute inset-0 rounded-2xl pointer-events-none
          bg-gradient-to-r ${scheme.gradient} opacity-0
          ${isVisible && type === 'error' ? 'animate-pulse-subtle' : ''}
        `}
        style={{ mixBlendMode: 'overlay' }}
      />
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <>
      <div
        className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-3 pointer-events-none max-w-[400px]"
        aria-live="polite"
      >
        {toasts.map((toast, index) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem
              id={toast.id}
              type={toast.type}
              message={toast.message}
              description={toast.description}
              duration={toast.duration}
              onRemove={removeToast}
              index={index}
            />
          </div>
        ))}
      </div>

      {/* Global styles for toast animations */}
      <style jsx global>{`
        @keyframes draw {
          0% {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.05;
          }
        }

        .animate-draw {
          animation: draw 0.5s ease-out forwards;
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
