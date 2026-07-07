'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { formatTimeAgoCompact } from '@/utils/dateUtils';
import {
  Boxes,
  Clock,
  FileText,
  ListChecks,
  Package,
  Settings2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ActivityEntry {
  _id: string;
  actorId?: { _id?: string; name?: string; avatar?: string } | null;
  actorRole?: string;
  type: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

type L = { en: string; ka: string; ru: string };

// Human verb per activity type. Falls back to the raw type if unmapped, so new
// backend types still render (just less prettily) instead of breaking.
const ACTION: Record<string, L> = {
  'project.created': { en: 'created the project', ka: 'შექმნა პროექტი', ru: 'создал проект' },
  'project.updated': { en: 'updated the project', ka: 'დაარედაქტირა პროექტი', ru: 'изменил проект' },
  'project.status_changed': { en: 'changed the status', ka: 'შეცვალა სტატუსი', ru: 'изменил статус' },
  'project.deleted': { en: 'deleted the project', ka: 'წაშალა პროექტი', ru: 'удалил проект' },
  'room.added': { en: 'added a space', ka: 'დაამატა სივრცე', ru: 'добавил помещение' },
  'room.updated': { en: 'edited a space', ka: 'შეასწორა სივრცე', ru: 'изменил помещение' },
  'room.removed': { en: 'removed a space', ka: 'წაშალა სივრცე', ru: 'удалил помещение' },
  'product.added': { en: 'added a product', ka: 'დაამატა პროდუქტი', ru: 'добавил товар' },
  'product.updated': { en: 'edited a product', ka: 'შეასწორა პროდუქტი', ru: 'изменил товар' },
  'product.status_changed': { en: 'changed a product status', ka: 'შეცვალა პროდუქტის სტატუსი', ru: 'изменил статус товара' },
  'product.reviewed': { en: 'reviewed a product', ka: 'შეაფასა პროდუქტი', ru: 'проверил товар' },
  'product.removed': { en: 'removed a product', ka: 'წაშალა პროდუქტი', ru: 'удалил товар' },
  'step.added': { en: 'added a step', ka: 'დაამატა ეტაპი', ru: 'добавил этап' },
  'step.removed': { en: 'removed a step', ka: 'წაშალა ეტაპი', ru: 'удалил этап' },
};

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  project: Settings2,
  room: Boxes,
  product: Package,
  step: ListChecks,
  document: FileText,
};

export default function ProjectHistory({ projectId }: { projectId: string }) {
  const { t, pick, locale } = useLanguage();
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<ActivityEntry[]>(
        `/projects/${projectId}/activity`,
      );
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setEntries([]);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  if (entries === null) {
    return (
      <div className="py-16 text-center text-[var(--hm-fg-muted)]">…</div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <Clock className="h-8 w-8 text-[var(--hm-fg-subtle)]" />
        <p className="text-[14px] text-[var(--hm-fg-muted)]">
          {t('projects.historyEmpty')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {entries.map((e) => {
        const Icon = ICON[e.targetType || ''] || Clock;
        const action = ACTION[e.type] ? pick(ACTION[e.type]) : e.type;
        const who = e.actorId?.name || t('projects.historySomeone');
        return (
          <div
            key={e._id}
            className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--hm-bg-tertiary)]/50"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] leading-snug text-[var(--hm-fg-primary)]">
                <span className="font-semibold">{who}</span>{' '}
                <span className="text-[var(--hm-fg-secondary)]">{action}</span>
                {e.targetLabel ? (
                  <span className="font-medium"> · {e.targetLabel}</span>
                ) : null}
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--hm-fg-muted)]">
                {formatTimeAgoCompact(e.createdAt, locale)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
