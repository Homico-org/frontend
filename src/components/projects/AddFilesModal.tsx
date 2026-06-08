'use client';

import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface AddFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  /** Space these files belong to (omit for project-level). */
  roomId?: string;
  /** Pre-fill the group label (e.g. when adding to an existing group). */
  group?: string;
  onSaved: () => Promise<void> | void;
}

export default function AddFilesModal({
  isOpen,
  onClose,
  projectId,
  roomId,
  group,
  onSaved,
}: AddFilesModalProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState(group ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles((f) => [...f, ...list]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const save = async () => {
    if (!label.trim() || files.length === 0) return;
    setSaving(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const up = await api.post('/upload', fd);
        const url = (up.data.url || up.data.filename) as string;
        await api.post(`/projects/${projectId}/documents`, {
          name: file.name,
          url,
          fileType: file.type || undefined,
          roomId: roomId || undefined,
          group: label.trim(),
        });
      }
      await onSaved();
      onClose();
      toast.success(t('projects.savedChanges'));
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton>
      <ModalHeader
        title={t('projects.addFiles')}
        description={t('projects.addFilesHint')}
      />
      <ModalBody className="flex flex-col gap-4">
        <FormGroup>
          <Label>{t('projects.groupLabel')}</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('projects.groupPlaceholder')}
            autoFocus={!group}
          />
        </FormGroup>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--hm-border-strong)] py-8 text-[var(--hm-fg-muted)] transition-colors hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)]"
        >
          <UploadCloud className="h-7 w-7" />
          <span className="text-[13px] font-medium">
            {t('projects.chooseFiles')}
          </span>
        </button>
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={pick}
        />

        {files.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg bg-[var(--hm-bg-tertiary)]/50 px-3 py-2 text-[13px]"
              >
                <span className="min-w-0 flex-1 truncate text-[var(--hm-fg-primary)]">
                  {f.name}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFiles((cur) => cur.filter((_, idx) => idx !== i))
                  }
                  aria-label={t('common.delete')}
                  className="shrink-0 text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

      </ModalBody>
      <ModalFooter className="justify-end">
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={save}
          loading={saving}
          disabled={!label.trim() || files.length === 0}
        >
          {t('common.save')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
