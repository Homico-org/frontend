'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

const icons = {
  success: (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 18a8 8 0 100-16 8 8 0 000 16z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M6.5 10l2.5 2.5 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 18a8 8 0 100-16 8 8 0 000 16z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M12.5 7.5l-5 5m0-5l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 18a8 8 0 100-16 8 8 0 000 16z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M10 6v5m0 3v.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 18a8 8 0 100-16 8 8 0 000 16z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M10 9v5m0-8v.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const colors = {
  success: {
    bg: 'bg-[#E07B4F]/5 dark:bg-[#E07B4F]/10',
    border: 'border-[#E07B4F]/20 dark:border-[#E07B4F]/30',
    icon: 'text-[#E07B4F] dark:text-[#CD853F]',
    title: 'text-[#B8560E] dark:text-[#CD853F]',
    desc: 'text-[#E07B4F] dark:text-[#CD853F]',
    progress: 'bg-[#E07B4F]',
  },
  error: {
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    border: 'border-rose-200 dark:border-rose-800/50',
    icon: 'text-rose-600 dark:text-rose-400',
    title: 'text-rose-900 dark:text-rose-100',
    desc: 'text-rose-700 dark:text-rose-300',
    progress: 'bg-rose-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-200 dark:border-amber-800/50',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-900 dark:text-amber-100',
    desc: 'text-amber-700 dark:text-amber-300',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-sky-50 dark:bg-sky-950/50',
    border: 'border-sky-200 dark:border-sky-800/50',
    icon: 'text-sky-600 dark:text-sky-400',
    title: 'text-sky-900 dark:text-sky-100',
    desc: 'text-sky-700 dark:text-sky-300',
    progress: 'bg-sky-500',
  },
};

interface ToastItemProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
  onRemove: (id: string) => void;
}

function ToastItem({ id, type, message, description, duration = 4000, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const color = colors[type];

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(id);
    }, 200);
  };

  return (
    <div
      className={`
        relative overflow-hidden
        w-full max-w-sm
        ${color.bg} ${color.border}
        border rounded-xl
        shadow-lg shadow-black/5 dark:shadow-black/20
        backdrop-blur-sm
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`flex-shrink-0 ${color.icon}`}>
          {icons[type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className={`text-sm font-medium ${color.title}`}>
            {message}
          </p>
          {description && (
            <p className={`mt-1 text-sm ${color.desc} opacity-80`}>
              {description}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 p-1 rounded-lg
            ${color.icon} opacity-60 hover:opacity-100
            transition-opacity duration-150
          `}
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 4l8 8m0-8l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 dark:bg-white/5">
          <div
            className={`h-full ${color.progress} opacity-60`}
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem
            id={toast.id}
            type={toast.type}
            message={toast.message}
            description={toast.description}
            duration={toast.duration}
            onRemove={removeToast}
          />
        </div>
      ))}
    </div>
  );
}
