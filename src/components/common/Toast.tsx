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

/**
 * Homico Design System — Toast
 * Dark ink bg (n-900), no radius, 4px left color bar.
 * Monospace kicker. Auto-dismiss 4s.
 */
const barColors: Record<string, string> = {
  success: 'var(--hm-success-500)',
  error: 'var(--hm-error-500)',
  warning: 'var(--hm-warning-500)',
  info: 'var(--hm-info-500)',
};

const iconColors: Record<string, string> = {
  success: 'var(--hm-success-500)',
  error: 'var(--hm-error-500)',
  warning: 'var(--hm-warning-500)',
  info: 'var(--hm-info-500)',
};

// Keep colorSchemes for backward compat (some code references scheme.icon etc)
const colorSchemes: Record<string, Record<string, string>> = {
  success: { icon: 'text-[var(--hm-success-500)]', bg: '', border: '', iconBg: '', title: '', desc: '', progress: '', gradient: '', glow: '', ring: '' },
  error: { icon: 'text-[var(--hm-error-500)]', bg: '', border: '', iconBg: '', title: '', desc: '', progress: '', gradient: '', glow: '', ring: '' },
  warning: { icon: 'text-[var(--hm-warning-500)]', bg: '', border: '', iconBg: '', title: '', desc: '', progress: '', gradient: '', glow: '', ring: '' },
  info: { icon: 'text-[var(--hm-info-500)]', bg: '', border: '', iconBg: '', title: '', desc: '', progress: '', gradient: '', glow: '', ring: '' },
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
        w-full max-w-[420px]
        shadow-xl
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
        backgroundColor: 'var(--hm-n-900)',
        color: 'var(--hm-n-50)',
        transitionDelay: isVisible && !isLeaving ? `${index * 50}ms` : '0ms',
      }}
    >
      {/* Left color bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: barColors[type] }} />

      <div className="grid grid-cols-[auto_1fr_auto] gap-3.5 items-start p-4 pl-6">
        {/* Icon */}
        <div className="flex-shrink-0" style={{ color: iconColors[type] }}>
          {icons[type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">
            {message}
          </p>
          {description && (
            <p className="mt-0.5 text-[13px] leading-relaxed opacity-72">
              {description}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 opacity-55 hover:opacity-100 transition-opacity cursor-pointer"
          style={{ background: 'transparent', border: 0, color: 'inherit' }}
          aria-label="Close"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8m0-8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
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
