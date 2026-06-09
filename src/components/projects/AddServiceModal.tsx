'use client';

import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import {
  CatalogUnitOption,
  useCategories,
} from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  DoorOpen,
  Droplets,
  HardHat,
  Layers,
  type LucideIcon,
  Paintbrush,
  Palette,
  Search,
  SprayCan,
  Trees,
  Triangle,
  Truck,
  Waves,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Room } from './ProjectRooms';
import { ScopeItem } from './ProjectScope';

// Outlined Lucide icon per catalog category (cleaning uses SprayCan, not the
// AI-cliche Sparkles). Unknown categories fall back to a wrench.
const CATEGORY_ICON: Record<string, LucideIcon> = {
  cleaning: SprayCan,
  handyman: Wrench,
  landscaping: Trees,
  movers: Truck,
  plumbing: Droplets,
  electrical: Zap,
  painters: Paintbrush,
  hvac: Wind,
  contractors: HardHat,
  architects: Compass,
  pool_spa: Waves,
  roofing: Triangle,
  windows_doors: DoorOpen,
  concrete_masonry: Layers,
  designers: Palette,
};
const iconForCategory = (key: string): LucideIcon =>
  CATEGORY_ICON[key] || Wrench;
// Soft color backplate from the category's brand hex (falls back to neutral).
const tintBg = (hex?: string) =>
  hex && hex.startsWith('#') ? `${hex}1a` : 'var(--hm-bg-tertiary)';
const tintInk = (hex?: string) =>
  hex && hex.startsWith('#') ? hex : 'var(--hm-fg-secondary)';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  /** Step the service is added under (omit for an unassigned/object service). */
  stepId?: string;
  rooms: Room[];
  /** Pre-select a space when adding from a space card. */
  roomId?: string;
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
  roomId,
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
      : { ...emptyForm, roomId: roomId ?? '' },
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

  // When editing a catalog service, reload its unit options so the unit
  // picker + price range work (we only have the saved unit otherwise).
  useEffect(() => {
    if (!isEdit || unitOptions.length > 0 || !item?.serviceKey) return;
    const svc = catalogServices.find((s) => s.key === item.serviceKey);
    if (svc) setUnitOptions(svc.unitOptions);
  }, [isEdit, item?.serviceKey, catalogServices, unitOptions.length]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalogServices
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, catalogServices]);

  const browseCategories = useMemo(() => {
    const withServices = new Set(catalogServices.map((s) => s.categoryKey));
    return categories
      .filter((c) => withServices.has(c.key))
      .map((c) => ({
        key: c.key,
        name: pick({ en: c.name, ka: c.nameKa }),
        color: c.color,
      }));
  }, [categories, catalogServices, pick]);

  const browseCatMeta = browseCat
    ? browseCategories.find((c) => c.key === browseCat)
    : null;

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
      // Always send stepId (empty string clears it) so moving a service back
      // to "no stage" on edit persists.
      const body = {
        name: form.name.trim(),
        roomId: form.roomId || '',
        stepId: selectedStepId || '',
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
  const fmtN = (n: number) =>
    Math.round(n).toLocaleString('en-US').replace(/,/g, ' ');
  // The unit option currently selected (for the market price range hint).
  const activeUnit = unitOptions.find((u) => (u.unit || u.key) === form.unit);
  const unitIsArea = form.unit === 'sqm';
  const selectedRoomArea = rooms.find((r) => r.id === form.roomId)?.area;

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
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--hm-fg-muted)]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('projects.searchServices')}
                className="h-11 rounded-xl pl-10"
                autoFocus
              />
            </div>

            {query.trim() ? (
              <div className="-mx-1 flex flex-col">
                {searchResults.length === 0 ? (
                  <p className="px-1 py-3 text-[13px] text-[var(--hm-fg-muted)]">
                    {t('projects.noServicesFound')}
                  </p>
                ) : (
                  searchResults.map((s) => {
                    const Icon = iconForCategory(s.categoryKey);
                    return (
                      <button
                        key={`${s.categoryKey}-${s.key}`}
                        type="button"
                        onClick={() => pickService(s)}
                        className="group flex items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)]">
                          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium text-[var(--hm-fg-primary)]">
                            {s.name}
                          </span>
                          <span className="block truncate text-[12px] text-[var(--hm-fg-muted)]">
                            {s.categoryName}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--hm-fg-muted)] transition-transform group-hover:translate-x-0.5" />
                      </button>
                    );
                  })
                )}
              </div>
            ) : browseCat ? (
              <div className="-mx-1 flex flex-col">
                <button
                  type="button"
                  onClick={() => setBrowseCat(null)}
                  className="mb-1 ml-1 inline-flex items-center gap-2 self-start text-[13px] font-medium text-[var(--hm-fg-secondary)] transition-colors hover:text-[var(--hm-fg-primary)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {browseCatMeta?.name ?? t('common.back')}
                </button>
                {browseServices.map((s) => (
                  <button
                    key={`${s.categoryKey}-${s.key}`}
                    type="button"
                    onClick={() => pickService(s)}
                    className="group flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]"
                  >
                    <span className="truncate text-[14px] font-medium text-[var(--hm-fg-primary)]">
                      {s.name}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--hm-fg-muted)] transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="-mx-1 flex flex-col">
                  {browseCategories.map((c) => {
                    const Icon = iconForCategory(c.key);
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setBrowseCat(c.key)}
                        className="group flex items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[var(--hm-bg-tertiary)]"
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: tintBg(c.color),
                            color: tintInk(c.color),
                          }}
                        >
                          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--hm-fg-primary)]">
                          {c.name}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--hm-fg-muted)] transition-transform group-hover:translate-x-0.5" />
                      </button>
                    );
                  })}
                </div>
                {/* Custom (non-catalog) service */}
                <button
                  type="button"
                  onClick={() => setPicked(true)}
                  className="mt-1 self-start px-2 text-[13px] font-medium text-[var(--hm-brand-500)] transition-opacity hover:opacity-80"
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
                {unitIsArea &&
                  selectedRoomArea != null &&
                  String(selectedRoomArea) !== form.quantity && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          quantity: String(selectedRoomArea),
                        }))
                      }
                      className="mt-1 text-left text-[12px] font-medium text-[var(--hm-brand-500)] transition-opacity hover:opacity-80"
                    >
                      {t('projects.scopeUseRoomArea', {
                        area: selectedRoomArea,
                      })}
                    </button>
                  )}
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
                {activeUnit && (
                  <p className="mt-1 text-[12px] text-[var(--hm-fg-muted)]">
                    {t('projects.marketRange')}:{' '}
                    {activeUnit.maxPrice && activeUnit.maxPrice > activeUnit.defaultPrice
                      ? `${fmtN(activeUnit.defaultPrice)}-${fmtN(activeUnit.maxPrice)}`
                      : fmtN(activeUnit.defaultPrice)}{' '}
                    ₾
                  </p>
                )}
              </FormGroup>
            </div>

            {steps.length > 0 && (
              <FormGroup>
                <Label>{t('projects.stepLabel')}</Label>
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

          </>
        )}
      </ModalBody>
      {picked && (
        <ModalFooter className="justify-end">
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
        </ModalFooter>
      )}
    </Modal>
  );
}
