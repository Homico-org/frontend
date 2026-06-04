'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { DoorOpen, Pencil, Plus, Ruler, Trash2, Wallet } from 'lucide-react';
import { useState } from 'react';

export interface Room {
  id: string;
  name: string;
  length?: number;
  width?: number;
  height?: number;
  area?: number;
  budget?: number;
  note?: string;
  photos?: string[];
  createdAt: string;
}

interface ProjectRoomsProps {
  projectId: string;
  rooms: Room[];
  canManage: boolean;
  onChanged: () => Promise<void> | void;
}

const fmtGel = (n: number) =>
  `${Math.round(n).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

const emptyForm = {
  name: '',
  length: '',
  width: '',
  height: '',
  area: '',
  budget: '',
  note: '',
};

export default function ProjectRooms({
  projectId,
  rooms,
  canManage,
  onChanged,
}: ProjectRoomsProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const errMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || t('projects.tryAgain');

  const openAdd = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setOpen(true);
  };

  const openEdit = (r: Room) => {
    setForm({
      name: r.name || '',
      length: r.length != null ? String(r.length) : '',
      width: r.width != null ? String(r.width) : '',
      height: r.height != null ? String(r.height) : '',
      area: r.area != null ? String(r.area) : '',
      budget: r.budget != null ? String(r.budget) : '',
      note: r.note || '',
    });
    setEditingId(r.id);
    setOpen(true);
  };

  const num = (v: string) => (v ? Number(v) : undefined);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        length: num(form.length),
        width: num(form.width),
        height: num(form.height),
        area: num(form.area),
        budget: num(form.budget),
        note: form.note.trim() || undefined,
      };
      if (editingId) {
        await api.patch(`/projects/${projectId}/rooms/${editingId}`, body);
      } else {
        await api.post(`/projects/${projectId}/rooms`, body);
      }
      setOpen(false);
      await onChanged();
      toast.success(t('projects.savedChanges'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await api.delete(`/projects/${projectId}/rooms/${id}`);
      await onChanged();
      toast.success(t('projects.itemRemoved'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  // Live area preview from L x W when area isn't manually set.
  const previewArea =
    !form.area && form.length && form.width
      ? Math.round(Number(form.length) * Number(form.width) * 100) / 100
      : null;

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="inline-flex items-center gap-2 text-[18px] font-bold text-[var(--hm-fg-primary)]">
          <DoorOpen className="w-5 h-5 text-[var(--hm-brand-500)]" />
          {t('projects.tabRooms')}
        </h2>
        {canManage && (
          <Button size="sm" onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>
            {t('projects.roomAdd')}
          </Button>
        )}
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 flex flex-col items-center text-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)]">
            <DoorOpen className="w-6 h-6" />
          </span>
          <p className="text-[14px] text-[var(--hm-fg-muted)]">
            {t('projects.roomEmpty')}
          </p>
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={openAdd}
            >
              {t('projects.roomAdd')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-[var(--hm-fg-primary)] min-w-0 truncate">
                  {r.name}
                </h3>
                {canManage && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      aria-label={t('common.edit')}
                      className="p-1.5 rounded-md text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      disabled={busyId === r.id}
                      aria-label={t('common.delete')}
                      className="p-1.5 rounded-md text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[var(--hm-fg-muted)]">
                {!!r.area && (
                  <span className="inline-flex items-center gap-1.5">
                    <Ruler className="w-4 h-4" />
                    {r.area} {t('projects.sqm')}
                  </span>
                )}
                {(r.length || r.width || r.height) && (
                  <span className="tabular-nums">
                    {[r.length, r.width, r.height]
                      .map((d) => d ?? '-')
                      .join(' × ')}
                  </span>
                )}
                {!!r.budget && (
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="w-4 h-4" />
                    {fmtGel(r.budget)}
                  </span>
                )}
              </div>
              {r.note && (
                <p className="text-[13px] text-[var(--hm-fg-secondary)] mt-2">
                  {r.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal isOpen={open} onClose={() => setOpen(false)} size="md" showCloseButton>
          <ModalHeader title={t('projects.roomAdd')} />
          <ModalBody>
            <div className="flex flex-col gap-4">
              <FormGroup>
                <Label>{t('projects.selName')}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </FormGroup>
              <FormGroup>
                <Label>
                  {t('projects.roomDimensions')}{' '}
                  <span className="text-[var(--hm-fg-muted)] font-normal">
                    ({t('common.optional')})
                  </span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={form.length}
                    onChange={(e) => setForm({ ...form, length: e.target.value })}
                    placeholder="L"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={form.width}
                    onChange={(e) => setForm({ ...form, width: e.target.value })}
                    placeholder="W"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                    placeholder="H"
                  />
                </div>
              </FormGroup>
              <div className="grid grid-cols-2 gap-3">
                <FormGroup>
                  <Label>{t('projects.landAreaLabel')}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    placeholder={previewArea != null ? String(previewArea) : ''}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>{t('projects.statBudgetLabel')}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  />
                </FormGroup>
              </div>
              <FormGroup>
                <Label>
                  {t('common.description')}{' '}
                  <span className="text-[var(--hm-fg-muted)] font-normal">
                    ({t('common.optional')})
                  </span>
                </Label>
                <Textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={2}
                />
              </FormGroup>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={save} disabled={saving || !form.name.trim()}>
                  {editingId ? t('common.save') : t('common.add')}
                </Button>
              </div>
            </div>
          </ModalBody>
        </Modal>
      )}
    </section>
  );
}
