'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Sparkles, X } from 'lucide-react';

interface AiSearchBarProps {
  value: string;
  onChange: (next: string) => void;
  aiLoading: boolean;
  aiResultsCount: number;
  placeholder?: string;
  className?: string;
}

/**
 * Shared service/category search input with AI status surfacing.
 * Owns no query state — parent keeps `value` and wires it to `useAiServiceSearch`.
 * Emits the cleared event via onChange('').
 */
export default function AiSearchBar({
  value,
  onChange,
  aiLoading,
  aiResultsCount,
  placeholder,
  className = '',
}: AiSearchBarProps) {
  const { t } = useLanguage();
  const hasQuery = value.trim().length > 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        {aiLoading ? (
          <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-pulse text-[var(--hm-brand-500)] z-10" />
        ) : (
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10"
            style={{ color: 'var(--hm-fg-muted)' }}
          />
        )}
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? t('browse.searchServices')}
          className="pl-10 pr-9 py-3 rounded-xl text-sm"
        />
        {hasQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 [&_svg]:size-3.5"
            aria-label={t('common.close')}
          >
            <X style={{ color: 'var(--hm-fg-muted)' }} />
          </Button>
        )}
      </div>

      {/* AI status indicator */}
      {hasQuery && aiLoading && (
        <div
          className="flex items-center gap-2 px-3 py-2 text-xs"
          style={{ color: 'var(--hm-fg-secondary)' }}
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-[var(--hm-brand-500)]" />
          {t('browse.searchingAI')}
        </div>
      )}
      {hasQuery && !aiLoading && aiResultsCount > 0 && (
        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border"
          style={{
            borderColor: 'rgba(239,78,36,0.25)',
            background: 'rgba(239,78,36,0.06)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--hm-brand-500)]" />
          <span className="text-xs font-semibold text-[var(--hm-brand-500)]">
            {t('browse.aiSuggested')}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--hm-fg-secondary)' }}>
            · {t('browse.aiSuggestedHint')}
          </span>
        </div>
      )}
    </div>
  );
}
