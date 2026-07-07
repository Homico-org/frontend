'use client';

import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label } from '@/components/ui/input';
import AddressPicker from '@/components/common/AddressPicker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { useState } from 'react';

const STATUS_OPTIONS: { value: string; labelKey: string }[] = [
  { value: 'draft', labelKey: 'projects.statusDraft' },
  { value: 'active', labelKey: 'projects.statusActive' },
  { value: 'in_progress', labelKey: 'projects.statusInProgress' },
  { value: 'completed', labelKey: 'projects.statusCompleted' },
  { value: 'cancelled', labelKey: 'projects.statusCancelled' },
];

// Kept in lockstep with the creation form: a project edits down to a
// title + location + status. Budget / description / site-details were
// dropped (they no longer exist on creation either), and deleting a
// project is now a separate action outside this modal.
export interface EditProjectInitial {
  title: string;
  location?: string;
  status?: string;
}

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  initial: EditProjectInitial;
  onSaved: () => Promise<void> | void;
}

export default function EditProjectModal({
  isOpen,
  onClose,
  projectId,
  initial,
  onSaved,
}: EditProjectModalProps) {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState({
    title: initial.title || '',
    location: initial.location || '',
    status: initial.status || 'draft',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/projects/${projectId}`, {
        title: form.title.trim(),
        location: form.location.trim() || undefined,
        status: form.status,
      });
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton>
      <ModalHeader title={t('projects.editProject')} />
      <ModalBody>
        <div className="flex flex-col gap-4">
          <FormGroup>
            <Label>{t('common.title')}</Label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>{t('common.location')}</Label>
            <AddressPicker
              value={form.location}
              onChange={(address) => set('location', address)}
              locale={locale as 'ka' | 'en' | 'ru'}
            />
          </FormGroup>

          <FormGroup>
            <Label>{t('projects.statusLabel')}</Label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-3 text-[14px] text-[var(--hm-fg-primary)] focus:outline-none focus:border-[var(--hm-brand-500)]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.labelKey)}
                </option>
              ))}
            </select>
          </FormGroup>
        </div>
      </ModalBody>
      <ModalFooter className="justify-end">
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={submit} loading={saving} disabled={!form.title.trim()}>
          {t('common.save')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
