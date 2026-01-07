'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { ProStatus } from '@/types';
import { COMPANY_ACCENT } from '@/constants/theme';

interface StatusBadgeProps {
  status: ProStatus | 'active' | 'busy' | 'away';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  variant?: 'default' | 'minimal';
}

// Dynamic styles using theme constants
const getStatusConfig = (status: string) => {
  const configs = {
    active: {
      colorClass: '', // Use inline style for theme color
      colorStyle: { backgroundColor: COMPANY_ACCENT },
      ring: `ring-2`,
      ringStyle: { '--tw-ring-color': `${COMPANY_ACCENT}4D` } as React.CSSProperties,
      glow: 'shadow-sm',
      glowStyle: { '--tw-shadow-color': `${COMPANY_ACCENT}66` } as React.CSSProperties,
      labelKa: 'აქტიური',
      labelEn: 'Active',
      textStyle: { color: COMPANY_ACCENT },
    },
    busy: {
      colorClass: 'bg-amber-500',
      colorStyle: undefined,
      ring: 'ring-2 ring-amber-400/30',
      ringStyle: undefined,
      glow: 'shadow-sm shadow-amber-500/40',
      glowStyle: undefined,
      labelKa: 'დაკავებული',
      labelEn: 'Busy',
      textStyle: undefined,
    },
    away: {
      colorClass: 'bg-zinc-400',
      colorStyle: undefined,
      ring: 'ring-2 ring-zinc-400/30',
      ringStyle: undefined,
      glow: 'shadow-sm shadow-zinc-400/40',
      glowStyle: undefined,
      labelKa: 'გასული',
      labelEn: 'Away',
      textStyle: undefined,
    },
  };
  return configs[status as keyof typeof configs] || configs.away;
};

export default function StatusBadge({
  status,
  size = 'sm',
  showLabel = true,
  variant = 'default',
}: StatusBadgeProps) {
  const { locale } = useLanguage();
  const config = getStatusConfig(status);

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-2 py-1' : 'px-2.5 py-1.5';

  if (variant === 'minimal') {
    return (
      <div className="relative flex items-center justify-center">
        <div
          className={`
            ${dotSize} rounded-full ${config.colorClass}
            ${status === 'active' ? 'animate-pulse' : ''}
            ${config.ring}
          `}
          style={{ ...config.colorStyle, ...config.ringStyle }}
        />
      </div>
    );
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 ${padding} rounded-full
        bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm
        ${config.glow}
        border border-white/20 dark:border-zinc-700/50
      `}
      style={config.glowStyle}
    >
      <div className="relative">
        <div
          className={`
            ${dotSize} rounded-full ${config.colorClass}
            ${status === 'active' ? 'animate-pulse' : ''}
          `}
          style={config.colorStyle}
        />
        {status === 'active' && (
          <div
            className={`
              absolute inset-0 ${dotSize} rounded-full ${config.colorClass}
              animate-ping opacity-75
            `}
            style={config.colorStyle}
          />
        )}
      </div>
      {showLabel && (
        <span
          className={`
            ${textSize} font-semibold
            ${status === 'busy' ? 'text-amber-700 dark:text-amber-400' : ''}
            ${status === 'away' ? 'text-zinc-500 dark:text-zinc-400' : ''}
          `}
          style={config.textStyle}
        >
          {locale === 'ka' ? config.labelKa : config.labelEn}
        </span>
      )}
    </div>
  );
}
