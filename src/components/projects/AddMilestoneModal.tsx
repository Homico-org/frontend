'use client';

import DatePicker from '@/components/common/DatePicker';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { useState } from 'react';

export type MilestoneStatus = 'pending' | 'active' | 'done' | 'blocked';

export interface MilestoneShape {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: MilestoneStatus;
}

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  /** Pass an existing milestone to edit it; omit to create a new one. */
  milestone?: MilestoneShape;
  onSaved: () => Promise<void> | void;
}

const STATUSES: MilestoneStatus[] = ['pending', 'active', 'done', 'blocked'];

// dueDate is stored as an ISO string; <input type="date"> wants yyyy-mm-dd.
const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '');

export default function AddMilestoneModal({
  isOpen,
  onClose,
  projectId,
  milestone,
  onSaved,
}: AddMilestoneModalProps) {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [title, setTitle] = useState(milestone?.title || '');
  const [description, setDescription] = useState(milestone?.description || '');
  const [dueDate, setDueDate] = useState(toDateInput(milestone?.dueDate));
  const [status, setStatus] = useState<MilestoneStatus>(
    milestone?.status || 'pending',
  );
  const [saving, setSaving] = useState(false);
  const isEdit = !!milestone;

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error(t('projects.tryAgain'), t('projects.milestoneTitleRequired'));
      return;
    }
    setSaving(true);
    try {
      if (isEdit && milestone) {
        await api.patch(`/projects/${projectId}/milestones/${milestone.id}`, {
          title: trimmed,
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
          status,
        });
      } else {
        await api.post(`/projects/${projectId}/milestones`, {
          title: trimmed,
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
        });
      }
      await onSaved();
      onClose();
      toast.success(
        isEdit
          ? t('projects.milestoneUpdated')
          : t('projects.milestoneCreated'),
      );
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
        <div className="flex flex-col gap-3">
          <FormGroup>
            <Label>{t('projects.milestoneTitle')}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('projects.milestoneTitlePlaceholder')}
              autoFocus
            />
          </FormGroup>
          <FormGroup>
            <Label>
              {t('projects.milestoneDueDate')}{' '}
              <span className="font-normal text-[var(--hm-fg-muted)]">
                ({t('common.optional')})
              </span>
            </Label>
            <DatePicker
              value={dueDate}
              onChange={setDueDate}
              locale={locale}
              placeholder={t('projects.milestoneDueDate')}
            />
          </FormGroup>
          <FormGroup>
            <Label>
              {t('common.description')}{' '}
              <span className="font-normal text-[var(--hm-fg-muted)]">
                ({t('common.optional')})
              </span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </FormGroup>
          {isEdit && (
            <FormGroup>
              <Label>{t('projects.milestoneStatus')}</Label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => {
                  const selected = s === status;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                        selected
                          ? 'border-[var(--hm-brand-500)] text-[var(--hm-brand-500)]'
                          : 'border-[var(--hm-border-subtle)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]'
                      }`}
                    >
                      {t(`projects.msStatus_${s}`)}
                    </button>
                  );
                })}
              </div>
            </FormGroup>
          )}
        </div>
      </ModalBody>
      <ModalFooter className="justify-end">
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={submit} loading={saving} disabled={!title.trim()}>
          {isEdit ? t('common.save') : t('common.add')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
