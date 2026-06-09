'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Search, X } from 'lucide-react';

interface AiSearchBarProps {
  value: string;
  onChange: (next: string) => void;
  aiLoading: boolean;
  aiResultsCount: number;
  /**
   * True when AI was actually dispatched for the current query but
   * returned no matches (vs. query too short / AI not called). When
   * true AND aiResultsCount === 0, render the "AI didn't match" state
   * so the user knows AI ran and missed (and can adjust the query)
   * instead of wondering whether AI is silently broken.
   */
  aiAttempted?: boolean;
  /**
   * When AI returned nothing but the consumer's local keyword search
   * has results, pass `true` so we skip the "AI didn't match" message
   * (local results carry the user forward and the message would just
   * read as noise next to a populated result list).
   */
  hasLocalResults?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Shared service/category search input with AI status surfacing.
 * Owns no query state - parent keeps `value` and wires it to `useAiServiceSearch`.
 * Emits the cleared event via onChange('').
 */
export default function AiSearchBar({
  value,
  onChange,
  aiLoading,
  aiResultsCount,
  aiAttempted = false,
  hasLocalResults = false,
  placeholder,
  className = '',
}: AiSearchBarProps) {
  const { t } = useLanguage();
  const hasQuery = value.trim().length > 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        {aiLoading ? (
          <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--hm-brand-500)] z-10" />
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

      {/* Search status indicator. Spinner during AI lookup, plain dot
          when results are in - the badge label already says it's AI so
          the icon is redundant. */}
      {hasQuery && aiLoading && (
        <div
          className="flex items-center gap-2 px-3 py-2 text-xs"
          style={{ color: 'var(--hm-fg-secondary)' }}
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--hm-brand-500)]" />
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
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--hm-brand-500)' }}
          />
          <span className="text-xs font-semibold text-[var(--hm-brand-500)]">
            {t('browse.aiSuggested')}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--hm-fg-secondary)' }}>
            · {t('browse.aiSuggestedHint')}
          </span>
        </div>
      )}

      {/* AI ran and found no match. Suppressed when local keyword
          search has results (the populated list already tells the
          user there's something to pick) - this message only fires
          when both AI and local are empty, so the user gets explicit
          feedback that AI considered the query but couldn't help,
          rather than wondering whether anything was tried. */}
      {hasQuery && !aiLoading && aiAttempted && aiResultsCount === 0 && !hasLocalResults && (
        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed text-[11px]"
          style={{
            borderColor: 'var(--hm-border-subtle)',
            color: 'var(--hm-fg-muted)',
          }}
        >
          <span className="font-semibold text-[var(--hm-fg-secondary)]">
            {t('browse.aiNoMatch')}
          </span>
          <span>· {t('browse.aiNoMatchHint')}</span>
        </div>
      )}
    </div>
  );
}
