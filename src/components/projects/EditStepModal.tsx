'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { useState } from 'react';

export interface ProjectStepShape {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface EditStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  /** Pass an existing step to edit it; omit to create a new one. */
  step?: ProjectStepShape;
  onSaved: () => Promise<void> | void;
}

const SUGGESTED_COLORS = [
  '#EF4E24', // brand vermillion
  '#3A6B47', // sage
  '#C7903F', // amber
  '#1F4B7A', // indigo
  '#7A3A6B', // plum
  '#36342E', // ink neutral
];

export default function EditStepModal({
  isOpen,
  onClose,
  projectId,
  step,
  onSaved,
}: EditStepModalProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const [name, setName] = useState(step?.name || '');
  const [description, setDescription] = useState(step?.description || '');
  const [color, setColor] = useState(step?.color || SUGGESTED_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const isEdit = !!step;

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t('projects.tryAgain'), t('projects.stepNameRequired'));
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: trimmed,
        description: description.trim() || undefined,
        color,
      };
      if (isEdit && step) {
        await api.patch(`/projects/${projectId}/steps/${step.id}`, body);
      } else {
        await api.post(`/projects/${projectId}/steps`, body);
      }
      await onSaved();
      onClose();
      toast.success(
        isEdit ? t('projects.stepUpdated') : t('projects.stepCreated'),
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
      <ModalHeader title={isEdit ? t('projects.editStep') : t('projects.addStep')} />
      <ModalBody>
        <div className="flex flex-col gap-3">
          <FormGroup>
            <Label>{t('projects.stepName')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('projects.stepNamePlaceholder')}
              autoFocus
            />
          </FormGroup>
          <FormGroup>
            <Label>
              {t('projects.stepDescription')}{' '}
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
          <FormGroup>
            <Label>{t('projects.stepColor')}</Label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_COLORS.map((c) => {
                const selected = c === color;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={c}
                    style={{ backgroundColor: c }}
                    className={`h-6 w-6 rounded-full border-2 transition-all ${
                      selected
                        ? 'border-[var(--hm-n-900)] scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                  />
                );
              })}
            </div>
          </FormGroup>

          <div className="mt-2 flex justify-end gap-2 border-t border-[var(--hm-border-subtle)] pt-4">
            <Button variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submit} loading={saving}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
