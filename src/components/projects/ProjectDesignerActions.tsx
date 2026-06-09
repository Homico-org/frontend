'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, ChevronRight } from 'lucide-react';

interface Eng {
  id: string;
  roleLabel: string;
  status?: string;
  assignedProId?: { name?: string } | string;
}
interface Sel {
  id: string;
  title: string;
  options?: { id: string }[];
}

interface Props {
  engagements?: Eng[];
  selections?: Sel[];
  onGoTo: (tab: string) => void;
}

/**
 * A focused "what needs doing now" strip for the project lead (editor/designer).
 * The full dashboard shows everything at once, which overwhelms; this surfaces
 * only the handful of items the designer must act on, each linking into the
 * relevant tab. Renders nothing when nothing needs attention, so it never adds
 * permanent chrome - it's a starting point, not another panel.
 */
export default function ProjectDesignerActions({
  engagements,
  selections,
  onGoTo,
}: Props) {
  const { t } = useLanguage();

  const items: { id: string; label: string; tab: string }[] = [];

  (engagements || []).forEach((e) => {
    const assigned =
      typeof e.assignedProId === 'object'
        ? !!e.assignedProId
        : !!e.assignedProId;
    if (!assigned && e.status !== 'completed' && e.status !== 'cancelled') {
      items.push({
        id: `asg-${e.id}`,
        label: t('projects.designer.assignPro', { role: e.roleLabel }),
        tab: 'team',
      });
    }
  });
  (selections || []).forEach((s) => {
    if ((s.options?.length ?? 0) === 0) {
      items.push({
        id: `opt-${s.id}`,
        label: t('projects.designer.addOptions', { item: s.title }),
        tab: 'materials',
      });
    }
  });

  if (items.length === 0) return null;

  return (
    <div
      className="mb-5 overflow-hidden rounded-2xl"
      style={{
        backgroundColor: 'var(--hm-bg-elevated)',
        border: `1px solid color-mix(in srgb, var(--hm-brand-500) 28%, transparent)`,
      }}
    >
      <div
        className="flex items-center gap-2 px-4 pt-3"
        style={{ color: 'var(--hm-brand-500)' }}
      >
        <AlertCircle className="h-4 w-4" />
        <span className="text-[12px] font-semibold">
          {t('projects.designer.actionNeeded', { count: items.length })}
        </span>
      </div>
      <div className="mt-1 px-2 pb-2">
        {items.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onGoTo(a.tab)}
            className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]"
          >
            <span
              className="min-w-0 flex-1 truncate text-[13px]"
              style={{ color: 'var(--hm-fg-primary)' }}
            >
              {a.label}
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0"
              style={{ color: 'var(--hm-fg-muted)' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
