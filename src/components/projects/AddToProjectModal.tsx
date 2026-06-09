'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { FolderPlus, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ProjectSummary {
  id: string;
  title: string;
  status: string;
  engagements?: unknown[];
}

interface AddToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Exactly one of these identifies the standalone entity being graduated.
  bookingId?: string;
  jobId?: string;
  roleLabel?: string;
  onAttached?: () => void;
}

export default function AddToProjectModal({
  isOpen,
  onClose,
  bookingId,
  jobId,
  roleLabel,
  onAttached,
}: AddToProjectModalProps) {
  const toast = useToast();
  const { t } = useLanguage();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachingId, setAttachingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    api
      .get('/projects')
      .then((res) => setProjects((res.data as ProjectSummary[]) || []))
      .catch(() => setProjects([]))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  const attach = async (projectId: string) => {
    setAttachingId(projectId);
    try {
      await api.post(`/projects/${projectId}/attach`, {
        bookingId,
        jobId,
        roleLabel,
      });
      toast.success(t('projects.addedToProject'));
      onAttached?.();
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t('projects.tryAgain');
      toast.error(t('projects.couldNotAddToProject'), message);
    } finally {
      setAttachingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton>
      <ModalHeader
        icon={<FolderPlus className="w-6 h-6" />}
        title={t('projects.addToProjectTitle')}
        description={t('projects.addToProjectSubtitle')}
      />
      <ModalBody>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="md" color="var(--hm-brand-500)" />
          </div>
        ) : (
          <>
            {projects.length > 0 && (
              <ul className="space-y-2 mb-4 max-h-[320px] overflow-y-auto">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--hm-border-subtle)]"
                  >
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-[var(--hm-fg-primary)] truncate">
                        {p.title}
                      </div>
                      <div className="text-[12px] text-[var(--hm-fg-muted)] capitalize">
                        {t('projects.statusRolesCount', {
                          status: p.status,
                          count: p.engagements?.length ?? 0,
                        })}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => attach(p.id)}
                      disabled={attachingId !== null}
                    >
                      {attachingId === p.id ? (
                        <LoadingSpinner size="xs" color="white" />
                      ) : (
                        t('projects.addAction')
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Button asChild variant="outline" className="w-full" leftIcon={<Plus className="w-4 h-4" />}>
              <Link href="/projects/new">{t('projects.createNewProject')}</Link>
            </Button>
          </>
        )}
      </ModalBody>
    </Modal>
  );
}
