'use client';

import Link from 'next/link';
import {
  Calculator,
  Database,
  FileSearch,
  Scale,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountryLink } from '@/hooks/useCountry';

type ToolId = 'analyzer' | 'prices' | 'calculator' | 'compare';

const TOOLS: { id: ToolId; href: string; icon: LucideIcon }[] = [
  { id: 'analyzer', href: '/tools/analyzer', icon: FileSearch },
  { id: 'prices', href: '/tools/prices', icon: Database },
  { id: 'calculator', href: '/tools/calculator', icon: Calculator },
  { id: 'compare', href: '/tools/compare', icon: Scale },
];

interface RelatedToolsProps {
  /** The tool currently being viewed - excluded from the list. */
  current: ToolId;
  className?: string;
}

/**
 * Cross-links the research tools so users flow between them (browse prices ->
 * analyze an estimate -> compare quotes) instead of leaving after one. Shown at
 * the foot of each tool. Hidden from print via `.print-hide`.
 */
export function RelatedTools({ current, className = '' }: RelatedToolsProps) {
  const { t } = useLanguage();
  const cl = useCountryLink();
  const others = TOOLS.filter((tool) => tool.id !== current);

  return (
    <div className={`print-hide ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-[var(--hm-fg-secondary)]">
        {t('tools.moreTools')}
      </h3>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {others.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              href={cl(tool.href)}
              className="group flex items-center gap-3 rounded-xl border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] p-3.5 transition-colors hover:border-[var(--hm-brand-500)]/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--hm-brand-500)]/10">
                <Icon
                  className="h-5 w-5 text-[var(--hm-brand-500)]"
                  strokeWidth={1.5}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--hm-fg-primary)]">
                  {t(`tools.home.${tool.id}.title`)}
                </span>
                <span className="block truncate text-xs text-[var(--hm-fg-muted)]">
                  {t(`tools.home.${tool.id}.tag`)}
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-[var(--hm-fg-muted)] transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default RelatedTools;
