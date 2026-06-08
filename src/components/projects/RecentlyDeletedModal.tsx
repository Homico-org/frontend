'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { formatDateShort } from '@/utils/dateUtils';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DeletedProject {
  id: string;
  title: string;
  deletedAt?: string;
  coverImage?: string;
  photos?: string[];
}

interface RecentlyDeletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a project is restored, with its id (parent navigates). */
  onRestored?: (id: string) => void;
}

export default function RecentlyDeletedModal({
  isOpen,
  onClose,
  onRestored,
}: RecentlyDeletedModalProps) {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [projects, setProjects] = useState<DeletedProject[] | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    setProjects(null);
    api
      .get('/projects/trash')
      .then((r) => alive && setProjects((r.data as DeletedProject[]) || []))
      .catch(() => alive && setProjects([]));
    return () => {
      alive = false;
    };
  }, [isOpen]);

  const restore = async (id: string) => {
    setRestoringId(id);
    try {
      await api.post(`/projects/${id}/restore`);
      setProjects((prev) => (prev ?? []).filter((p) => p.id !== id));
      toast.success(t('projects.restored'));
      onClose();
      onRestored?.(id);
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    } finally {
      setRestoringId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton>
      <ModalHeader title={t('projects.trashTitle')} />
      <ModalBody>
        {projects === null ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="md" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
              <Trash2 className="h-5 w-5" />
            </span>
            <p className="text-[14px] font-medium text-[var(--hm-fg-primary)]">
              {t('projects.trashEmpty')}
            </p>
            <p className="max-w-xs text-[13px] text-[var(--hm-fg-muted)]">
              {t('projects.trashEmptyHint')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((p) => {
              const cover = p.coverImage || p.photos?.[0];
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-2.5"
                >
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--hm-bg-tertiary)]">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={storage.getOptimizedImageUrl(cover, 'avatar')}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-[var(--hm-brand-500)]/[0.10] text-[15px] font-bold text-[var(--hm-brand-500)]">
                        {p.title.trim().charAt(0) || '?'}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-[var(--hm-fg-primary)]">
                      {p.title}
                    </p>
                    {p.deletedAt && (
                      <p className="text-[12px] text-[var(--hm-fg-muted)]">
                        {t('projects.deletedOn', {
                          date: formatDateShort(p.deletedAt, locale),
                        })}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    loading={restoringId === p.id}
                    onClick={() => restore(p.id)}
                    className="shrink-0"
                  >
                    {t('projects.restore')}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
