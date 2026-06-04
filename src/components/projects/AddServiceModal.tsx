'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import {
  CatalogUnitOption,
  useCategories,
} from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { ChevronLeft, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Room } from './ProjectRooms';
import { ScopeItem } from './ProjectScope';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  /** Step the service is added under (omit for an unassigned/object service). */
  stepId?: string;
  rooms: Room[];
  /** Project steps, so the service can be filed under / moved between them. */
  steps?: { id: string; name: string }[];
  /** Pass an existing scope item to edit it; omit to create a new one. */
  item?: ScopeItem;
  onSaved: () => Promise<void> | void;
}

const emptyForm = {
  roomId: '',
  name: '',
  serviceKey: undefined as string | undefined,
  categoryKey: undefined as string | undefined,
  unit: '',
  unitLabel: '',
  quantity: '',
  unitPrice: '',
  note: '',
};

export default function AddServiceModal({
  isOpen,
  onClose,
  projectId,
  stepId,
  rooms,
  steps = [],
  item,
  onSaved,
}: AddServiceModalProps) {
  const { t, pick } = useLanguage();
  const toast = useToast();
  const { categories } = useCategories();
  const isEdit = !!item;
  const [selectedStepId, setSelectedStepId] = useState(
    item?.stepId ?? stepId ?? '',
  );

  const [form, setForm] = useState(() =>
    item
      ? {
          roomId: item.roomId ?? '',
          name: item.name,
          serviceKey: item.serviceKey,
          categoryKey: item.categoryKey,
          unit: item.unit ?? '',
          unitLabel: item.unitLabel ?? item.unit ?? '',
          quantity: item.quantity != null ? String(item.quantity) : '',
          unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
          note: item.note ?? '',
        }
      : { ...emptyForm },
  );
  const [unitOptions, setUnitOptions] = useState<CatalogUnitOption[]>([]);
  const [query, setQuery] = useState('');
  const [browseCat, setBrowseCat] = useState<string | null>(null);
  const [picked, setPicked] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // Flatten the catalog into searchable services with their unit options.
  const catalogServices = useMemo(() => {
    const out: {
      key: string;
      categoryKey: string;
      categoryName: string;
      name: string;
      unitOptions: CatalogUnitOption[];
    }[] = [];
    for (const c of categories) {
      const categoryName = pick({ en: c.name, ka: c.nameKa });
      for (const sc of c.subcategories || []) {
        for (const s of sc.services || []) {
          out.push({
            key: s.key,
            categoryKey: c.key,
            categoryName,
            name: pick({ en: s.name, ka: s.nameKa }),
            unitOptions:
              s.unitOptions && s.unitOptions.length
                ? s.unitOptions
                : [
                    {
                      key: s.unit,
                      unit: s.unit,
                      label: { en: s.unitName, ka: s.unitNameKa, ru: s.unitName },
                      defaultPrice: s.basePrice,
                    },
                  ],
          });
        }
      }
    }
    return out;
  }, [categories, pick]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalogServices
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, catalogServices]);

  const browseCategories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of catalogServices)
      if (!seen.has(s.categoryKey)) seen.set(s.categoryKey, s.categoryName);
    return Array.from(seen, ([key, name]) => ({ key, name }));
  }, [catalogServices]);

  const browseServices = useMemo(
    () =>
      browseCat
        ? catalogServices.filter((s) => s.categoryKey === browseCat)
        : [],
    [browseCat, catalogServices],
  );

  const pickService = (svc: (typeof catalogServices)[number]) => {
    const first = svc.unitOptions[0];
    setForm((f) => ({
      ...f,
      name: svc.name,
      serviceKey: svc.key,
      categoryKey: svc.categoryKey,
      unit: first?.unit || first?.key || '',
      unitLabel: first ? pick(first.label) : '',
      unitPrice:
        first?.defaultPrice != null ? String(first.defaultPrice) : f.unitPrice,
    }));
    setUnitOptions(svc.unitOptions);
    setQuery('');
    setBrowseCat(null);
    setPicked(true);
  };

  const onUnitChoice = (idx: number) => {
    const u = unitOptions[idx];
    if (!u) return;
    setForm((f) => ({
      ...f,
      unit: u.unit || u.key,
      unitLabel: pick(u.label),
      unitPrice: u.defaultPrice != null ? String(u.defaultPrice) : f.unitPrice,
    }));
  };

  const num = (v: string) => (v ? Number(v) : undefined);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        stepId: selectedStepId || '',
        roomId: form.roomId || '',
        serviceKey: form.serviceKey || undefined,
        categoryKey: form.categoryKey || undefined,
        unit: form.unit || undefined,
        unitLabel: form.unitLabel.trim() || undefined,
        quantity: num(form.quantity),
        unitPrice: num(form.unitPrice),
        note: form.note.trim() || undefined,
      };
      if (isEdit && item) {
        await api.patch(`/projects/${projectId}/scope-items/${item.id}`, body);
      } else {
        await api.post(`/projects/${projectId}/scope-items`, body);
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

  const lineTotal =
    (num(form.quantity) || 0) * (num(form.unitPrice) || 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton>
      <ModalHeader
        title={isEdit ? t('projects.editService') : t('projects.addService')}
      />
      <ModalBody className="flex flex-col gap-4">
        {!picked ? (
          <>
            {/* Catalog search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--hm-fg-muted)]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('projects.searchServices')}
                className="pl-9"
                autoFocus
              />
            </div>

            {query.trim() ? (
              <div className="flex flex-col">
                {searchResults.length === 0 ? (
                  <p className="px-1 py-3 text-[13px] text-[var(--hm-fg-muted)]">
                    {t('projects.noServicesFound')}
                  </p>
                ) : (
                  searchResults.map((s) => (
                    <button
                      key={`${s.categoryKey}-${s.key}`}
                      type="button"
                      onClick={() => pickService(s)}
                      className="flex items-center justify-between gap-3 border-b border-[var(--hm-border-subtle)] px-1 py-2.5 text-left transition-colors hover:text-[var(--hm-brand-500)]"
                    >
                      <span className="text-[14px] font-medium text-[var(--hm-fg-primary)]">
                        {s.name}
                      </span>
                      <span className="text-[12px] text-[var(--hm-fg-muted)]">
                        {s.categoryName}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : browseCat ? (
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setBrowseCat(null)}
                  className="mb-1 inline-flex items-center gap-1 self-start text-[13px] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('common.back')}
                </button>
                {browseServices.map((s) => (
                  <button
                    key={`${s.categoryKey}-${s.key}`}
                    type="button"
                    onClick={() => pickService(s)}
                    className="border-b border-[var(--hm-border-subtle)] px-1 py-2.5 text-left text-[14px] font-medium text-[var(--hm-fg-primary)] transition-colors hover:text-[var(--hm-brand-500)]"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {browseCategories.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setBrowseCat(c.key)}
                      className="rounded-full border border-[var(--hm-border)] px-3 py-1.5 text-[13px] text-[var(--hm-fg-secondary)] transition-colors hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)]"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                {/* Custom (non-catalog) service */}
                <button
                  type="button"
                  onClick={() => setPicked(true)}
                  className="self-start text-[13px] font-medium text-[var(--hm-brand-500)] hover:underline"
                >
                  {t('projects.customService')}
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <FormGroup>
              <Label>{t('projects.serviceName')}</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                autoFocus={!form.name}
              />
            </FormGroup>

            {unitOptions.length > 1 && (
              <FormGroup>
                <Label>{t('projects.unit')}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {unitOptions.map((u, i) => {
                    const active = (u.unit || u.key) === form.unit;
                    return (
                      <button
                        key={u.key}
                        type="button"
                        onClick={() => onUnitChoice(i)}
                        className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
                          active
                            ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)] text-white'
                            : 'border-[var(--hm-border)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-brand-500)]'
                        }`}
                      >
                        {pick(u.label)}
                      </button>
                    );
                  })}
                </div>
              </FormGroup>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormGroup>
                <Label>
                  {t('projects.quantity')}
                  {form.unitLabel ? ` · ${form.unitLabel}` : ''}
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                />
              </FormGroup>
              <FormGroup>
                <Label>{t('projects.unitPrice')}</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unitPrice: e.target.value }))
                  }
                />
              </FormGroup>
            </div>

            {steps.length > 0 && (
              <FormGroup>
                <Label>{t('projects.addStep')}</Label>
                <select
                  value={selectedStepId}
                  onChange={(e) => setSelectedStepId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] px-3 text-[14px] text-[var(--hm-fg-primary)]"
                >
                  <option value="">{t('projects.unassignedStep')}</option>
                  {steps.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormGroup>
            )}

            {rooms.length > 0 && (
              <FormGroup>
                <Label>
                  {t('projects.roomLabel')}{' '}
                  <span className="font-normal text-[var(--hm-fg-muted)]">
                    ({t('common.optional')})
                  </span>
                </Label>
                <select
                  value={form.roomId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, roomId: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] px-3 text-[14px] text-[var(--hm-fg-primary)]"
                >
                  <option value="">{t('projects.wholeObject')}</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </FormGroup>
            )}

            <FormGroup>
              <Label>
                {t('projects.docNoteLabel')}{' '}
                <span className="font-normal text-[var(--hm-fg-muted)]">
                  ({t('common.optional')})
                </span>
              </Label>
              <Textarea
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
                rows={2}
              />
            </FormGroup>

            {lineTotal > 0 && (
              <div className="flex items-center justify-between border-t border-[var(--hm-border-subtle)] pt-3 text-[14px]">
                <span className="text-[var(--hm-fg-secondary)]">
                  {t('projects.total')}
                </span>
                <span className="font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                  {`${Math.round(lineTotal)
                    .toLocaleString('en-US')
                    .replace(/,/g, ' ')} ₾`}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              {!isEdit && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPicked(false);
                    setUnitOptions([]);
                  }}
                >
                  {t('common.back')}
                </Button>
              )}
              <Button onClick={save} loading={saving} disabled={!form.name.trim()}>
                {t('common.save')}
              </Button>
            </div>
          </>
        )}
      </ModalBody>
    </Modal>
  );
}
