'use client';

import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const PHASES: { value: string; labelKey: string }[] = [
  { value: 'design', labelKey: 'projects.phaseDesign' },
  { value: 'permits', labelKey: 'projects.phasePermits' },
  { value: 'construction', labelKey: 'projects.phaseConstruction' },
  { value: 'finishing', labelKey: 'projects.phaseFinishing' },
];

export interface EditRoleEngagement {
  id: string;
  roleLabel: string;
  scope?: string;
  budget?: number;
  phase?: string;
}

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  engagement: EditRoleEngagement;
  onSaved: () => Promise<void> | void;
}

export default function EditRoleModal({
  isOpen,
  onClose,
  projectId,
  engagement,
  onSaved,
}: EditRoleModalProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const [label, setLabel] = useState(engagement.roleLabel || '');
  const [scope, setScope] = useState(engagement.scope || '');
  const [budget, setBudget] = useState(
    engagement.budget != null ? String(engagement.budget) : '',
  );
  const [phase, setPhase] = useState(engagement.phase || 'construction');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.patch(`/projects/${projectId}/engagements/${engagement.id}`, {
        roleLabel: label.trim() || undefined,
        scope: scope.trim() || undefined,
        budget: budget ? Number(budget) : undefined,
        phase,
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
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton>
      <ModalBody className="pt-7">
        <div className="mb-4 flex items-baseline gap-3">
          <span aria-hidden className="block h-px w-5 bg-[var(--hm-n-900)]" />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--hm-n-500)]">
            {t('projects.teamHeaderEyebrow')}
          </span>
        </div>
        <h2 className="mb-5 font-display text-[14px] font-bold italic tracking-[-0.02em] text-[var(--hm-n-900)] sm:text-[16px]">
          {t('projects.editRole')}
        </h2>

        <div className="flex flex-col gap-3">
          <FormGroup>
            <Label>{t('common.title')}</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>
              {t('projects.scopeLabel')}{' '}
              <span className="font-normal text-[var(--hm-fg-muted)]">
                ({t('common.optional')})
              </span>
            </Label>
            <Textarea
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              rows={3}
            />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup>
              <Label>{t('projects.statBudgetLabel')}</Label>
              <Input
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>{t('projects.phasesTitle')}</Label>
              <div className="relative">
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] pl-3 pr-9 text-[14px] text-[var(--hm-fg-primary)] transition-colors focus:border-[var(--hm-brand-500)] focus:outline-none"
                >
                  {PHASES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {t(p.labelKey)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--hm-n-500)]"
                />
              </div>
            </FormGroup>
          </div>

        </div>
      </ModalBody>
      <ModalFooter className="justify-end">
        <button
          type="button"
          onClick={onClose}
          className="border border-[var(--hm-n-200)] px-3 py-2 text-[11px] font-semibold text-[var(--hm-n-700)] transition-colors hover:border-[var(--hm-n-900)] hover:text-[var(--hm-n-900)]"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="bg-[var(--hm-n-900)] px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[var(--hm-brand-500)] disabled:opacity-60"
        >
          {saving ? '...' : t('common.save')}
        </button>
      </ModalFooter>
    </Modal>
  );
}
