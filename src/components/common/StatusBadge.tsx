'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { ProStatus } from '@/types';

interface StatusBadgeProps {
  status: ProStatus | 'active' | 'busy' | 'away';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  variant?: 'default' | 'minimal';
}

const statusConfig = {
  active: {
    color: 'bg-[#E07B4F]',
    ring: 'ring-[#E07B4F]/30',
    glow: 'shadow-[#E07B4F]/40',
    labelKa: 'აქტიური',
    labelEn: 'Active',
  },
  busy: {
    color: 'bg-amber-500',
    ring: 'ring-amber-400/30',
    glow: 'shadow-amber-500/40',
    labelKa: 'დაკავებული',
    labelEn: 'Busy',
  },
  away: {
    color: 'bg-zinc-400',
    ring: 'ring-zinc-400/30',
    glow: 'shadow-zinc-400/40',
    labelKa: 'გასული',
    labelEn: 'Away',
  },
};

export default function StatusBadge({
  status,
  size = 'sm',
  showLabel = true,
  variant = 'default',
}: StatusBadgeProps) {
  const { locale } = useLanguage();
  const config = statusConfig[status] || statusConfig.away;

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-2 py-1' : 'px-2.5 py-1.5';

  if (variant === 'minimal') {
    return (
      <div className="relative flex items-center justify-center">
        <div
          className={`
            ${dotSize} rounded-full ${config.color}
            ${status === 'active' ? 'animate-pulse' : ''}
            ring-2 ${config.ring}
          `}
        />
      </div>
    );
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 ${padding} rounded-full
        bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm
        shadow-sm ${config.glow}
        border border-white/20 dark:border-zinc-700/50
      `}
    >
      <div className="relative">
        <div
          className={`
            ${dotSize} rounded-full ${config.color}
            ${status === 'active' ? 'animate-pulse' : ''}
          `}
        />
        {status === 'active' && (
          <div
            className={`
              absolute inset-0 ${dotSize} rounded-full ${config.color}
              animate-ping opacity-75
            `}
          />
        )}
      </div>
      {showLabel && (
        <span
          className={`
            ${textSize} font-semibold
            ${status === 'active' ? 'text-[#E07B4F] dark:text-[#CD853F]' : ''}
            ${status === 'busy' ? 'text-amber-700 dark:text-amber-400' : ''}
            ${status === 'away' ? 'text-zinc-500 dark:text-zinc-400' : ''}
          `}
        >
          {locale === 'ka' ? config.labelKa : config.labelEn}
        </span>
      )}
    </div>
  );
}
