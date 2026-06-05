'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Building2 } from 'lucide-react';
import { useState } from 'react';

const STATUS_OPTIONS: { value: string; labelKey: string }[] = [
  { value: 'draft', labelKey: 'projects.statusDraft' },
  { value: 'active', labelKey: 'projects.statusActive' },
  { value: 'in_progress', labelKey: 'projects.statusInProgress' },
  { value: 'completed', labelKey: 'projects.statusCompleted' },
  { value: 'cancelled', labelKey: 'projects.statusCancelled' },
];

export interface EditProjectInitial {
  title: string;
  description?: string;
  location?: string;
  budgetMax?: number;
  status?: string;
  cadastralId?: string;
  landArea?: number;
  floorCount?: number;
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
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    location: initial.location || '',
    budgetMax: initial.budgetMax != null ? String(initial.budgetMax) : '',
    status: initial.status || 'draft',
    cadastralId: initial.cadastralId || '',
    landArea: initial.landArea != null ? String(initial.landArea) : '',
    floorCount: initial.floorCount != null ? String(initial.floorCount) : '',
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
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        status: form.status,
        cadastralId: form.cadastralId.trim() || undefined,
        landArea: form.landArea ? Number(form.landArea) : undefined,
        floorCount: form.floorCount ? Number(form.floorCount) : undefined,
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
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>
              {t('common.description')}{' '}
              <span className="text-[var(--hm-fg-muted)] font-normal">
                ({t('common.optional')})
              </span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
            />
          </FormGroup>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormGroup>
              <Label>{t('projects.locationLabel')}</Label>
              <Input
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>{t('projects.statBudgetLabel')}</Label>
              <Input
                type="number"
                min={0}
                value={form.budgetMax}
                onChange={(e) => set('budgetMax', e.target.value)}
              />
            </FormGroup>
          </div>
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

          <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]/40 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]">
                <Building2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[var(--hm-fg-primary)]">
                  {t('projects.siteDetails')}
                </p>
                <p className="text-[11px] text-[var(--hm-fg-muted)]">
                  {t('common.optional')}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <FormGroup>
                <Label>{t('projects.cadastralLabel')}</Label>
                <Input
                  value={form.cadastralId}
                  onChange={(e) => set('cadastralId', e.target.value)}
                />
              </FormGroup>
              <div className="grid grid-cols-2 gap-3">
                <FormGroup>
                  <Label>{t('projects.landAreaLabel')}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.landArea}
                    onChange={(e) => set('landArea', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>{t('projects.floorCountLabel')}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.floorCount}
                    onChange={(e) => set('floorCount', e.target.value)}
                  />
                </FormGroup>
              </div>
            </div>
          </div>

          <div className="mt-1 flex justify-end gap-2 border-t border-[var(--hm-border-subtle)] pt-4">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={submit}
              loading={saving}
              disabled={!form.title.trim()}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
