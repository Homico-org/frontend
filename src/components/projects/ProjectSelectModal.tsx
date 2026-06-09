'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { FolderOpen } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProjectRow {
  id: string;
  name: string;
}

interface ProjectSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the chosen project id; parent performs the add. */
  onSelect: (projectId: string) => void;
  busyId?: string | null;
}

/**
 * Lightweight picker for "add this catalog product to which project". Used by
 * the standalone /shop page where there's no ambient project context.
 */
export default function ProjectSelectModal({
  isOpen,
  onClose,
  onSelect,
  busyId,
}: ProjectSelectModalProps) {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    api
      .get('/projects')
      .then((r) => {
        if (cancelled) return;
        const list: Array<{ id?: string; _id?: string; name?: string; title?: string }> =
          r.data || [];
        setProjects(
          list.map((p) => ({
            id: (p.id || p._id) as string,
            name: p.name || p.title || t('projects.untitledProject'),
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, t]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton>
      <ModalHeader title={t('projects.catalogAddToProject')} />
      <ModalBody>
        {projects === null ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="md" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <FolderOpen className="h-6 w-6 text-[var(--hm-fg-muted)]" />
            <p className="text-[14px] text-[var(--hm-fg-muted)]">
              {t('projects.listEmpty')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={!!busyId}
                onClick={() => onSelect(p.id)}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-4 py-3 text-left transition-colors hover:border-[var(--hm-brand-500)] disabled:opacity-50"
              >
                <span className="truncate text-[14px] font-medium text-[var(--hm-fg-primary)]">
                  {p.name}
                </span>
                {busyId === p.id && <LoadingSpinner size="xs" />}
              </button>
            ))}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
