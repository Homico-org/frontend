'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Check, Ruler, Square, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Room } from './ProjectRooms';

interface SpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  /** Pass an existing space to edit it; omit to create one. */
  space?: Room;
  onSaved: () => Promise<void> | void;
}

const SPACE_TYPES: { key: string; labelKey: string }[] = [
  { key: 'bathroom', labelKey: 'projects.spaceTypeBathroom' },
  { key: 'kitchen', labelKey: 'projects.spaceTypeKitchen' },
  { key: 'living', labelKey: 'projects.spaceTypeLiving' },
  { key: 'bedroom', labelKey: 'projects.spaceTypeBedroom' },
  { key: 'balcony', labelKey: 'projects.spaceTypeBalcony' },
  { key: 'hall', labelKey: 'projects.spaceTypeHall' },
  { key: 'toilet', labelKey: 'projects.spaceTypeToilet' },
  { key: 'office', labelKey: 'projects.spaceTypeOffice' },
];

const round2 = (n: number) => Math.round(n * 100) / 100;
const fmtArea = (n: number) => `${round2(n)} მ²`;
const fmtGel = (n: number) =>
  `${Math.round(n).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

export default function SpaceModal({
  isOpen,
  onClose,
  projectId,
  space,
  onSaved,
}: SpaceModalProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const isEdit = !!space;
  const [form, setForm] = useState(() => ({
    name: space?.name ?? '',
    length: space?.length != null ? String(space.length) : '',
    width: space?.width != null ? String(space.width) : '',
    height: space?.height != null ? String(space.height) : '',
    area: space?.area != null ? String(space.area) : '',
    wallArea: space?.wallArea != null ? String(space.wallArea) : '',
    budget: space?.budget != null ? String(space.budget) : '',
    note: space?.note ?? '',
  }));
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));
  const num = (v: string) => (v ? Number(v) : undefined);

  const L = Number(form.length) || 0;
  const W = Number(form.width) || 0;
  const H = Number(form.height) || 0;

  // Floor = L x W. Walls = perimeter x height = 2(L + W) x H.
  const floorCalc = L > 0 && W > 0 ? round2(L * W) : null;
  const wallCalc = L > 0 && W > 0 && H > 0 ? round2(2 * (L + W) * H) : null;

  const areaNum = Number(form.area) || 0;
  const wallNum = Number(form.wallArea) || 0;
  const budgetNum = Number(form.budget) || 0;

  const showFloorApply = floorCalc != null && floorCalc !== areaNum;
  const showWallApply = wallCalc != null && wallCalc !== wallNum;

  const effArea = areaNum || floorCalc || 0;
  const effWall = wallNum || wallCalc || 0;
  const hasSummary = effArea > 0 || effWall > 0 || budgetNum > 0;

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        length: num(form.length),
        width: num(form.width),
        height: num(form.height),
        // Fall back to the computed values when left blank.
        area: num(form.area) ?? floorCalc ?? undefined,
        wallArea: num(form.wallArea) ?? wallCalc ?? undefined,
        budget: num(form.budget),
        note: form.note.trim() || undefined,
      };
      if (isEdit && space) {
        await api.patch(`/projects/${projectId}/rooms/${space.id}`, body);
      } else {
        await api.post(`/projects/${projectId}/rooms`, body);
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

  const applyChip = (value: number, onApply: () => void) => (
    <button
      type="button"
      onClick={onApply}
      aria-label={t('projects.applySuggested')}
      className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--hm-brand-500)] transition-opacity hover:opacity-80"
    >
      <Check className="h-3 w-3" />≈ {fmtArea(value)}
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton>
      <ModalHeader title={isEdit ? t('common.edit') : t('projects.roomAdd')} />
      <ModalBody className="flex flex-col gap-4">
        <FormGroup>
          <Label>{t('projects.selName')}</Label>
          {!isEdit && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {SPACE_TYPES.map((tp) => {
                const label = t(tp.labelKey);
                const active = form.name.trim() === label;
                return (
                  <button
                    key={tp.key}
                    type="button"
                    onClick={() => set('name', label)}
                    className={`rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      active
                        ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)] text-white'
                        : 'border-[var(--hm-border)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-fg-primary)] hover:text-[var(--hm-fg-primary)]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            autoFocus
          />
        </FormGroup>

        <FormGroup>
          <Label className="inline-flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5 text-[var(--hm-fg-muted)]" />
            {t('projects.roomDimensions')}{' '}
            <span className="font-normal text-[var(--hm-fg-muted)]">
              ({t('common.optional')})
            </span>
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              min={0}
              value={form.length}
              onChange={(e) => set('length', e.target.value)}
              placeholder={t('projects.dimLength')}
            />
            <Input
              type="number"
              min={0}
              value={form.width}
              onChange={(e) => set('width', e.target.value)}
              placeholder={t('projects.dimWidth')}
            />
            <Input
              type="number"
              min={0}
              value={form.height}
              onChange={(e) => set('height', e.target.value)}
              placeholder={t('projects.dimHeight')}
            />
          </div>
        </FormGroup>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <FormGroup>
            <Label>{t('projects.landAreaLabel')}</Label>
            <Input
              type="number"
              min={0}
              value={form.area}
              onChange={(e) => set('area', e.target.value)}
              placeholder={floorCalc != null ? String(floorCalc) : ''}
            />
            {showFloorApply &&
              floorCalc != null &&
              applyChip(floorCalc, () => set('area', String(floorCalc)))}
          </FormGroup>
          <FormGroup>
            <Label>{t('projects.wallAreaLabel')}</Label>
            <Input
              type="number"
              min={0}
              value={form.wallArea}
              onChange={(e) => set('wallArea', e.target.value)}
              placeholder={wallCalc != null ? String(wallCalc) : ''}
            />
            {showWallApply &&
              wallCalc != null &&
              applyChip(wallCalc, () => set('wallArea', String(wallCalc)))}
          </FormGroup>
          <FormGroup>
            <Label>{t('projects.statBudgetLabel')}</Label>
            <Input
              type="number"
              min={0}
              value={form.budget}
              onChange={(e) => set('budget', e.target.value)}
            />
          </FormGroup>
        </div>

        <FormGroup>
          <Label>
            {t('common.description')}{' '}
            <span className="font-normal text-[var(--hm-fg-muted)]">
              ({t('common.optional')})
            </span>
          </Label>
          <Textarea
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            rows={2}
          />
        </FormGroup>

        {hasSummary && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--hm-border-subtle)] pt-3 text-[13px]">
            {effArea > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[var(--hm-fg-secondary)]">
                <Square className="h-4 w-4 text-[var(--hm-fg-muted)]" />
                <span className="font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                  {fmtArea(effArea)}
                </span>
              </span>
            )}
            {effWall > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[var(--hm-fg-secondary)]">
                {t('projects.wallAreaLabel')}
                <span className="font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                  {fmtArea(effWall)}
                </span>
              </span>
            )}
            {budgetNum > 0 && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-[var(--hm-fg-secondary)]">
                <Wallet className="h-4 w-4 text-[var(--hm-fg-muted)]" />
                <span className="font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                  {fmtGel(budgetNum)}
                </span>
              </span>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-[var(--hm-border-subtle)] pt-4">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save} loading={saving} disabled={!form.name.trim()}>
            {t('common.save')}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
