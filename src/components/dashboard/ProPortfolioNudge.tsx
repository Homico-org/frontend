'use client';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, ImagePlus } from 'lucide-react';

/**
 * Supply-activation hero for pros with no portfolio. Only ~5% of pros have
 * any work samples, yet a portfolio is the single biggest thing that converts
 * a browsing client into a hire - so it gets the top of the dashboard, framed
 * around the reward, instead of being buried as item 5/6 in the completion
 * checklist. Self-hides the moment the pro adds any portfolio project.
 */
export default function ProPortfolioNudge({ onAdd }: { onAdd: () => void }) {
  const { t } = useLanguage();

  return (
    <div
      className="relative mb-5 overflow-hidden rounded-2xl p-5 sm:p-6"
      style={{
        backgroundColor: 'var(--hm-bg-elevated)',
        border: '1px solid var(--hm-border-subtle)',
      }}
    >
      {/* warm corner wash - one quiet vermillion moment, no icon cluster */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--hm-brand-500) 12%, transparent) 0%, transparent 70%)',
        }}
      />
      <p
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: 'var(--hm-brand-500)' }}
      >
        {t('mySpace.portfolioNudgeEyebrow')}
      </p>
      <h2
        className="mt-1.5 text-[20px] sm:text-[24px] font-bold tracking-[-0.02em]"
        style={{ color: 'var(--hm-fg-primary)' }}
      >
        {t('mySpace.portfolioNudgeTitle')}
      </h2>
      <p
        className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
        style={{ color: 'var(--hm-fg-secondary)' }}
      >
        {t('mySpace.portfolioNudgeSub')}
      </p>

      <Button
        variant="default"
        className="mt-4"
        onClick={onAdd}
        leftIcon={<ImagePlus className="h-4 w-4" />}
        rightIcon={<ArrowRight className="h-4 w-4" />}
      >
        {t('mySpace.portfolioNudgeCta')}
      </Button>
    </div>
  );
}
