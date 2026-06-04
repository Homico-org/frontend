'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { useState } from 'react';

const MS_PHASES: { key: string; labelKey: string }[] = [
  { key: 'design', labelKey: 'projects.phaseDesign' },
  { key: 'permits', labelKey: 'projects.phasePermits' },
  { key: 'construction', labelKey: 'projects.phaseConstruction' },
  { key: 'finishing', labelKey: 'projects.phaseFinishing' },
];

export interface EditableMilestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  phase?: string;
}

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onAdded: () => Promise<void> | void;
  // When provided, the modal edits this milestone instead of adding one.
  milestone?: EditableMilestone;
}

export default function AddMilestoneModal({
  isOpen,
  onClose,
  projectId,
  onAdded,
  milestone,
}: AddMilestoneModalProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const isEdit = !!milestone;
  const [title, setTitle] = useState(milestone?.title ?? '');
  const [description, setDescription] = useState(milestone?.description ?? '');
  const [dueDate, setDueDate] = useState(
    milestone?.dueDate ? milestone.dueDate.slice(0, 10) : '',
  );
  const [phase, setPhase] = useState(milestone?.phase ?? 'construction');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        phase: phase || undefined,
      };
      if (isEdit) {
        await api.patch(
          `/projects/${projectId}/milestones/${milestone!.id}`,
          body,
        );
      } else {
        await api.post(`/projects/${projectId}/milestones`, body);
        setTitle('');
        setDescription('');
        setDueDate('');
        setPhase('construction');
      }
      await onAdded();
      onClose();
      toast.success(isEdit ? t('projects.savedChanges') : t('projects.msAdded'));
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
        title={isEdit ? t('projects.editMilestone') : t('projects.addMilestone')}
      />
      <ModalBody>
        <div className="flex flex-col gap-4">
          <FormGroup>
            <Label>{t('common.title')}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </FormGroup>
          <FormGroup>
            <Label>
              {t('common.description')}{' '}
              <span className="text-[var(--hm-fg-muted)] font-normal">
                ({t('common.optional')})
              </span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </FormGroup>
          <FormGroup>
            <Label>
              {t('common.date')}{' '}
              <span className="text-[var(--hm-fg-muted)] font-normal">
                ({t('common.optional')})
              </span>
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label>{t('projects.phasesTitle')}</Label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="w-full rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)] text-[var(--hm-fg-primary)] px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--hm-brand-500)]/30"
            >
              {MS_PHASES.map((p) => (
                <option key={p.key} value={p.key}>
                  {t(p.labelKey)}
                </option>
              ))}
            </select>
          </FormGroup>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submit} disabled={saving || !title.trim()}>
              {isEdit ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
