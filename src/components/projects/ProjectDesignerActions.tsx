'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, ChevronRight, Clock, Palette, UserPlus } from 'lucide-react';

interface Eng {
  id: string;
  roleLabel: string;
  status?: string;
  assignedProId?: { name?: string } | string;
  designApproval?: { status?: string };
}
interface Sel {
  id: string;
  title: string;
  options?: { id: string }[];
  chosenOptionId?: string;
}
interface Doc {
  id: string;
  name?: string;
  approvalStatus?: string;
}

interface ActionItem {
  id: string;
  icon: 'assign' | 'options';
  label: string;
  sub: string;
  tab: string;
}

// A client decision the lead is blocked on. Read-only for the editor - they
// can jump to the tab to see/nudge, but only the client can resolve it.
interface WaitingItem {
  id: string;
  label: string;
  tab: string;
}

interface Props {
  engagements?: Eng[];
  selections?: Sel[];
  documents?: Doc[];
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
  documents,
  onGoTo,
}: Props) {
  const { t } = useLanguage();

  const items: ActionItem[] = [];

  (engagements || []).forEach((e) => {
    // Unassigned = no pro linked. `assignedProId` is either a populated object,
    // a non-empty id string, or null/'' - all of which `!!` classifies right.
    const assigned = !!e.assignedProId;
    if (!assigned && e.status !== 'completed' && e.status !== 'cancelled') {
      items.push({
        id: `asg-${e.id}`,
        icon: 'assign',
        label: t('projects.designer.assignPro', { role: e.roleLabel }),
        sub: t('projects.designer.assignProSub'),
        tab: 'team',
      });
    }
  });
  (selections || []).forEach((s) => {
    if ((s.options?.length ?? 0) === 0) {
      items.push({
        id: `opt-${s.id}`,
        icon: 'options',
        label: t('projects.designer.addOptions', { item: s.title }),
        sub: t('projects.designer.addOptionsSub'),
        tab: 'materials',
      });
    }
  });

  // Read-only: decisions the client owns and hasn't made yet. Surfaced so the
  // lead knows what's blocking, not because they can act on it.
  const waiting: WaitingItem[] = [];
  (engagements || []).forEach((e) => {
    if (e.designApproval?.status === 'pending') {
      waiting.push({
        id: `w-design-${e.id}`,
        label: t('projects.client.needApproveDesign', { role: e.roleLabel }),
        tab: 'team',
      });
    }
  });
  (documents || []).forEach((d) => {
    if (d.approvalStatus === 'pending') {
      waiting.push({
        id: `w-doc-${d.id}`,
        label: t('projects.client.needApprove', {
          item: d.name || t('projects.client.aDocument'),
        }),
        tab: 'library',
      });
    }
  });
  (selections || []).forEach((s) => {
    if ((s.options?.length ?? 0) > 0 && !s.chosenOptionId) {
      waiting.push({
        id: `w-sel-${s.id}`,
        label: t('projects.client.needChoose', { item: s.title }),
        tab: 'materials',
      });
    }
  });

  if (items.length === 0 && waiting.length === 0) return null;

  const icon = (kind: ActionItem['icon']) => {
    const cls = 'h-4 w-4 shrink-0';
    const style = { color: 'var(--hm-fg-secondary)' };
    return kind === 'assign' ? (
      <UserPlus className={cls} style={style} />
    ) : (
      <Palette className={cls} style={style} />
    );
  };

  return (
    <div
      className="mb-5 overflow-hidden rounded-2xl"
      style={{
        backgroundColor: 'var(--hm-bg-elevated)',
        border:
          items.length > 0
            ? `1px solid color-mix(in srgb, var(--hm-brand-500) 28%, transparent)`
            : '1px solid var(--hm-border-subtle)',
      }}
    >
      {items.length > 0 && (
        <>
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
                className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]"
              >
                {icon(a.icon)}
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-medium"
                    style={{ color: 'var(--hm-fg-primary)' }}
                  >
                    {a.label}
                  </span>
                  <span
                    className="block truncate text-[11px]"
                    style={{ color: 'var(--hm-fg-muted)' }}
                  >
                    {a.sub}
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: 'var(--hm-fg-muted)' }}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {waiting.length > 0 && (
        <div
          style={{
            borderTop:
              items.length > 0 ? '1px solid var(--hm-border-subtle)' : 'none',
          }}
        >
          <p className="flex items-center gap-2 px-4 pt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--hm-fg-muted)]">
            <Clock className="h-3.5 w-3.5" />
            {t('projects.designer.waitingHeader')}
          </p>
          <div className="mt-1 px-2 pb-2">
            {waiting.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onGoTo(w.tab)}
                className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]"
              >
                <span
                  className="min-w-0 flex-1 truncate text-[13px]"
                  style={{ color: 'var(--hm-fg-secondary)' }}
                >
                  {w.label}
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: 'var(--hm-fg-muted)' }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
