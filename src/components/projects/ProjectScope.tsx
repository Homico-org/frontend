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
import {
  Check,
  ChevronDown,
  ChevronLeft,
  DoorOpen,
  ListChecks,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion';
import { Room } from './ProjectRooms';

export interface ScopeItem {
  id: string;
  roomId?: string;
  stepId?: string;
  categoryKey?: string;
  serviceKey?: string;
  name: string;
  quantity?: number;
  unit?: string;
  unitLabel?: string;
  unitPrice?: number;
  engagementId?: string;
  note?: string;
  createdAt?: string;
}

interface ScopeEngagement {
  id: string;
  roleKey: string;
  roleLabel: string;
  assignedProId?: { name?: string } | string;
}

interface ProjectScopeProps {
  projectId: string;
  scopeItems: ScopeItem[];
  rooms: Room[];
  engagements: ScopeEngagement[];
  canManage: boolean;
  onChanged: () => Promise<void> | void;
}

const fmtGel = (n: number) =>
  `${Math.round(n).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

const emptyForm = {
  roomId: '',
  name: '',
  serviceKey: '' as string | undefined,
  categoryKey: '' as string | undefined,
  categoryName: '',
  unit: '',
  unitLabel: '',
  quantity: '',
  unitPrice: '',
  engagementId: '',
  note: '',
};

const lineTotal = (s: ScopeItem) => (s.quantity || 0) * (s.unitPrice || 0);

// Area-based units let us prefill quantity from the room's m².
const isAreaUnit = (unit?: string, label?: string) => {
  const s = `${unit || ''} ${label || ''}`.toLowerCase();
  return /m2|m²|sqm|кв|მ²|მ2|კვ/.test(s);
};

// Money that counts up to its value - tweens from the prior amount so the
// rollup totals feel alive as items are added/removed. Honors reduced motion.
function AnimatedGel({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const [shown, setShown] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(mv, value, {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
    });
    return () => controls.stop();
  }, [value, reduce, mv]);
  return <>{fmtGel(shown)}</>;
}

export default function ProjectScope({
  projectId,
  scopeItems,
  rooms,
  engagements,
  canManage,
  onChanged,
}: ProjectScopeProps) {
  const { t, pick, locale } = useLanguage();
  const toast = useToast();
  const { categories } = useCategories();
  const reduce = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [unitOptions, setUnitOptions] = useState<CatalogUnitOption[]>([]);
  const [query, setQuery] = useState('');
  const [browseCat, setBrowseCat] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [roomOpen, setRoomOpen] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: '', area: '' });
  const [roomSaving, setRoomSaving] = useState(false);

  const errMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || t('projects.tryAgain');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, locale]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalogServices
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, catalogServices]);

  // Distinct categories (with at least one service) for browse mode.
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

  const engagementLabel = (e: ScopeEngagement) => {
    const pro =
      e.assignedProId && typeof e.assignedProId === 'object'
        ? e.assignedProId.name
        : undefined;
    return pro ? `${e.roleLabel} · ${pro}` : e.roleLabel;
  };

  const workerName = (engagementId?: string) => {
    if (!engagementId) return null;
    const e = engagements.find((x) => x.id === engagementId);
    return e ? engagementLabel(e) : null;
  };

  const openAdd = (roomId?: string) => {
    setForm({ ...emptyForm, roomId: roomId ?? '' });
    setUnitOptions([]);
    setQuery('');
    setBrowseCat(null);
    setEditingId(null);
    setOpen(true);
  };

  const openEdit = (s: ScopeItem) => {
    const cat = s.categoryKey
      ? categories.find((c) => c.key === s.categoryKey)
      : undefined;
    setForm({
      roomId: s.roomId ?? '',
      name: s.name,
      serviceKey: s.serviceKey,
      categoryKey: s.categoryKey,
      categoryName: cat ? pick({ en: cat.name, ka: cat.nameKa }) : '',
      unit: s.unit ?? '',
      unitLabel: s.unitLabel ?? s.unit ?? '',
      quantity: s.quantity != null ? String(s.quantity) : '',
      unitPrice: s.unitPrice != null ? String(s.unitPrice) : '',
      engagementId: s.engagementId ?? '',
      note: s.note ?? '',
    });
    setUnitOptions([]);
    setQuery('');
    setBrowseCat(null);
    setEditingId(s.id);
    setOpen(true);
  };

  const pickService = (svc: (typeof catalogServices)[number]) => {
    const first = svc.unitOptions[0];
    // Auto-assign the team member whose role matches this service's trade.
    const match = engagements.find((e) => e.roleKey === svc.categoryKey);
    setForm((f) => ({
      ...f,
      name: svc.name,
      serviceKey: svc.key,
      categoryKey: svc.categoryKey,
      categoryName: svc.categoryName,
      unit: first?.unit || first?.key || '',
      unitLabel: first ? pick(first.label) : '',
      unitPrice:
        first?.defaultPrice != null ? String(first.defaultPrice) : f.unitPrice,
      engagementId: match ? match.id : f.engagementId,
    }));
    setUnitOptions(svc.unitOptions);
    setQuery('');
    setBrowseCat(null);
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

  const save = async (addAnother = false) => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        roomId: form.roomId || '',
        serviceKey: form.serviceKey || undefined,
        categoryKey: form.categoryKey || undefined,
        unit: form.unit || undefined,
        unitLabel: form.unitLabel.trim() || undefined,
        quantity: num(form.quantity),
        unitPrice: num(form.unitPrice),
        engagementId: form.engagementId || '',
        note: form.note.trim() || undefined,
      };
      if (editingId) {
        await api.patch(`/projects/${projectId}/scope-items/${editingId}`, body);
      } else {
        await api.post(`/projects/${projectId}/scope-items`, body);
      }
      await onChanged();
      toast.success(t('projects.savedChanges'));
      if (addAnother && !editingId) {
        // Keep the room selected; clear the rest for rapid entry.
        setForm({ ...emptyForm, roomId: form.roomId });
        setUnitOptions([]);
        setQuery('');
        setBrowseCat(null);
      } else {
        setOpen(false);
      }
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await api.delete(`/projects/${projectId}/scope-items/${id}`);
      await onChanged();
      toast.success(t('projects.itemRemoved'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  // Quick worker (re)assignment straight from a row.
  const assignWorker = async (item: ScopeItem, engagementId: string) => {
    setBusyId(item.id);
    try {
      await api.patch(`/projects/${projectId}/scope-items/${item.id}`, {
        engagementId,
      });
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  const addRoom = async () => {
    if (!roomForm.name.trim()) return;
    setRoomSaving(true);
    try {
      await api.post(`/projects/${projectId}/rooms`, {
        name: roomForm.name.trim(),
        area: roomForm.area ? Number(roomForm.area) : undefined,
      });
      setRoomOpen(false);
      setRoomForm({ name: '', area: '' });
      await onChanged();
      toast.success(t('projects.savedChanges'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setRoomSaving(false);
    }
  };

  // Group: every room (so the apartment structure is visible) + a general
  // bucket for items not tied to a room.
  const groups: { id: string; name: string; area?: number; items: ScopeItem[] }[] =
    [
      ...rooms.map((r) => ({
        id: r.id,
        name: r.name,
        area: r.area,
        items: scopeItems.filter((s) => s.roomId === r.id),
      })),
    ];
  const generalItems = scopeItems.filter(
    (s) => !s.roomId || !rooms.some((r) => r.id === s.roomId),
  );
  if (generalItems.length > 0 || rooms.length === 0) {
    groups.push({
      id: '',
      name: t('projects.scopeGeneral'),
      items: generalItems,
    });
  }

  const grandTotal = scopeItems.reduce((s, i) => s + lineTotal(i), 0);
  const isEmpty = scopeItems.length === 0 && rooms.length === 0;

  const unitChoiceIdx = unitOptions.findIndex(
    (u) => (u.unit || u.key) === form.unit,
  );

  const selectedRoom = rooms.find((r) => r.id === form.roomId);
  const roomArea = selectedRoom?.area;
  const canUseRoomArea =
    roomArea != null && isAreaUnit(form.unit, form.unitLabel);
  // True once a catalog service is picked but no team member covers its trade.
  const missingTrade =
    !!form.serviceKey &&
    !!form.categoryKey &&
    !engagements.some((e) => e.roleKey === form.categoryKey);

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="inline-flex items-center gap-2 text-[18px] font-bold text-[var(--hm-fg-primary)]">
          <ListChecks className="w-5 h-5 text-[var(--hm-brand-500)]" />
          {t('projects.scopeTitle')}
        </h2>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRoomOpen(true)}
              leftIcon={<DoorOpen className="w-4 h-4" />}
            >
              {t('projects.roomAdd')}
            </Button>
            <Button
              size="sm"
              onClick={() => openAdd()}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t('projects.scopeAddService')}
            </Button>
          </div>
        )}
      </div>
      <p className="text-[13px] text-[var(--hm-fg-muted)] mb-5">
        {t('projects.scopeSubtitle')}
      </p>

      {grandTotal > 0 && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-[var(--hm-brand-500)]/15 bg-gradient-to-r from-[var(--hm-brand-500)]/[0.07] to-transparent px-5 py-3.5">
          <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--hm-fg-secondary)]">
            <ListChecks className="w-4 h-4 text-[var(--hm-brand-500)]" />
            {t('projects.scopeEstTotal')}
          </span>
          <span className="text-[18px] font-bold text-[var(--hm-fg-primary)] tabular-nums">
            <AnimatedGel value={grandTotal} />
          </span>
        </div>
      )}

      {isEmpty ? (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 flex flex-col items-center text-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)]">
            <ListChecks className="w-6 h-6" />
          </span>
          <p className="text-[14px] text-[var(--hm-fg-muted)] max-w-sm">
            {t('projects.scopeEmpty')}
          </p>
          {canManage && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                leftIcon={<DoorOpen className="w-4 h-4" />}
                onClick={() => setRoomOpen(true)}
              >
                {t('projects.roomAdd')}
              </Button>
              <Button
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => openAdd()}
              >
                {t('projects.scopeAddService')}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g, gi) => {
            const subtotal = g.items.reduce((s, i) => s + lineTotal(i), 0);
            return (
              <motion.div
                key={g.id || 'general'}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : {
                        type: 'spring',
                        stiffness: 320,
                        damping: 30,
                        delay: gi * 0.06,
                      }
                }
                className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.10)]"
              >
                <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 bg-[var(--hm-bg-page)]/40 border-b border-[var(--hm-border-subtle)]">
                  <h3 className="inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--hm-fg-primary)] min-w-0">
                    <span className="truncate">{g.name}</span>
                    {!!g.area && (
                      <span className="shrink-0 text-[12px] font-normal text-[var(--hm-fg-muted)]">
                        {g.area} {t('projects.sqm')}
                      </span>
                    )}
                    {g.items.length > 0 && (
                      <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--hm-bg-tertiary)] text-[11px] font-medium text-[var(--hm-fg-muted)] tabular-nums">
                        {g.items.length}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3 shrink-0">
                    {subtotal > 0 && (
                      <span className="text-[13px] font-semibold text-[var(--hm-fg-secondary)] tabular-nums">
                        <AnimatedGel value={subtotal} />
                      </span>
                    )}
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => openAdd(g.id)}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--hm-brand-500)] hover:opacity-80 transition-opacity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t('projects.scopeAddService')}
                      </button>
                    )}
                  </div>
                </div>

                {g.items.length === 0 ? (
                  <p className="px-4 sm:px-5 py-4 text-[13px] text-[var(--hm-fg-muted)]">
                    {t('projects.scopeRoomEmpty')}
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--hm-border-subtle)]">
                    <AnimatePresence initial={false}>
                      {g.items.map((s) => (
                        <motion.li
                          key={s.id}
                          layout={!reduce}
                          initial={reduce ? false : { opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, transition: { duration: 0.15 } }}
                          transition={
                            reduce
                              ? { duration: 0 }
                              : { type: 'spring', stiffness: 380, damping: 32 }
                          }
                          className="group flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 transition-colors hover:bg-[var(--hm-bg-tertiary)]/40"
                        >
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-[var(--hm-fg-primary)] truncate">
                            {s.name}
                          </p>
                          {s.quantity != null && (
                            <p className="mt-0.5 text-[12px] text-[var(--hm-fg-muted)] tabular-nums">
                              {s.quantity}
                              {s.unitLabel ? ` ${s.unitLabel}` : ''}
                              {s.unitPrice ? ` · ${fmtGel(s.unitPrice)}` : ''}
                            </p>
                          )}
                          {s.note && (
                            <p className="mt-0.5 text-[12px] text-[var(--hm-fg-secondary)] truncate">
                              {s.note}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          {lineTotal(s) > 0 && (
                            <span className="text-[14px] font-bold text-[var(--hm-fg-primary)] tabular-nums">
                              {fmtGel(lineTotal(s))}
                            </span>
                          )}

                          {canManage ? (
                            <div className="relative">
                              <select
                                value={s.engagementId ?? ''}
                                disabled={busyId === s.id}
                                onChange={(e) => assignWorker(s, e.target.value)}
                                className={`appearance-none cursor-pointer rounded-full border pl-3 pr-7 py-1.5 text-[12px] font-medium max-w-[150px] truncate focus:outline-none focus:ring-2 focus:ring-[var(--hm-brand-500)]/30 transition-colors ${
                                  s.engagementId
                                    ? 'border-[var(--hm-brand-500)]/30 bg-[var(--hm-brand-500)]/[0.08] text-[var(--hm-brand-500)]'
                                    : 'border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)] text-[var(--hm-fg-muted)]'
                                }`}
                              >
                                <option value="">
                                  {t('projects.scopeUnassigned')}
                                </option>
                                {engagements.map((e) => (
                                  <option key={e.id} value={e.id}>
                                    {engagementLabel(e)}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
                                  s.engagementId
                                    ? 'text-[var(--hm-brand-500)]'
                                    : 'text-[var(--hm-fg-muted)]'
                                }`}
                              />
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)] px-3 py-1.5 text-[12px] font-medium text-[var(--hm-fg-secondary)] max-w-[150px] truncate">
                              {workerName(s.engagementId) ||
                                t('projects.scopeUnassigned')}
                            </span>
                          )}

                          {canManage && (
                            <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => openEdit(s)}
                                aria-label={t('common.edit')}
                                className="p-1.5 rounded-md text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => remove(s.id)}
                                disabled={busyId === s.id}
                                aria-label={t('common.delete')}
                                className="p-1.5 rounded-md text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)] transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / edit service */}
      {open && (
        <Modal isOpen={open} onClose={() => setOpen(false)} size="md" showCloseButton>
          <ModalHeader
            title={
              editingId
                ? t('common.edit')
                : t('projects.scopeAddService')
            }
          />
          <ModalBody>
            <div className="flex flex-col gap-4">
              <FormGroup>
                <Label>{t('projects.scopeRoom')}</Label>
                <select
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  className="w-full rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)] text-[var(--hm-fg-primary)] px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--hm-brand-500)]/30"
                >
                  <option value="">{t('projects.scopeGeneral')}</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {selectedRoom?.area != null && (
                  <p className="mt-1 text-[12px] text-[var(--hm-fg-muted)]">
                    {selectedRoom.area} {t('projects.sqm')}
                  </p>
                )}
              </FormGroup>

              <FormGroup>
                <Label>{t('projects.scopeService')}</Label>
                <div className="relative">
                  <Input
                    value={form.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setQuery(v);
                      // Typing detaches from the catalog pick until re-chosen.
                      setForm({
                        ...form,
                        name: v,
                        serviceKey: undefined,
                        categoryKey: undefined,
                        categoryName: '',
                      });
                      setUnitOptions([]);
                    }}
                    placeholder={t('projects.scopeSearchService')}
                    leftIcon={<Search className="w-4 h-4" />}
                    autoFocus
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] shadow-lg">
                      {searchResults.map((svc) => (
                        <button
                          key={`${svc.categoryKey}-${svc.key}`}
                          type="button"
                          onClick={() => pickService(svc)}
                          className="flex w-full items-center justify-between gap-3 text-left px-3 py-2 hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                        >
                          <span className="text-[13px] text-[var(--hm-fg-primary)] truncate">
                            {svc.name}
                          </span>
                          <span className="shrink-0 text-[11px] text-[var(--hm-fg-muted)] truncate max-w-[45%]">
                            {svc.categoryName}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {form.serviceKey ? (
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-[var(--hm-success-500)]">
                    <Check className="w-3.5 h-3.5" />
                    {form.categoryName
                      ? `${t('projects.scopeFromCatalog')} · ${form.categoryName}`
                      : t('projects.scopeFromCatalog')}
                  </p>
                ) : form.name.trim() ? (
                  <p className="mt-1.5 text-[12px] text-[var(--hm-fg-muted)]">
                    {t('projects.scopeCustomHint')}
                  </p>
                ) : null}

                {/* Browse the catalog by trade when nothing is typed/picked. */}
                {!form.serviceKey && !form.name.trim() && (
                  <div className="mt-2.5">
                    {!browseCat ? (
                      <>
                        <p className="text-[11px] text-[var(--hm-fg-muted)] mb-1.5">
                          {t('projects.scopeBrowseHint')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {browseCategories.map((c) => (
                            <button
                              key={c.key}
                              type="button"
                              onClick={() => setBrowseCat(c.key)}
                              className="px-2.5 py-1 rounded-full border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)] text-[12px] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-brand-500)]/40 hover:text-[var(--hm-brand-500)] transition-colors"
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl border border-[var(--hm-border-subtle)] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setBrowseCat(null)}
                          className="flex w-full items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-[var(--hm-brand-500)] border-b border-[var(--hm-border-subtle)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          {browseCategories.find((c) => c.key === browseCat)
                            ?.name || t('common.back')}
                        </button>
                        <div className="max-h-48 overflow-y-auto">
                          {browseServices.map((svc) => (
                            <button
                              key={`${svc.categoryKey}-${svc.key}`}
                              type="button"
                              onClick={() => pickService(svc)}
                              className="block w-full text-left px-3 py-2 text-[13px] text-[var(--hm-fg-primary)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                            >
                              {svc.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </FormGroup>

              <FormGroup>
                <Label>{t('projects.scopeUnit')}</Label>
                {unitOptions.length > 1 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {unitOptions.map((u, i) => {
                      const active =
                        (unitChoiceIdx >= 0 ? unitChoiceIdx : 0) === i;
                      return (
                        <button
                          key={u.key || i}
                          type="button"
                          onClick={() => onUnitChoice(i)}
                          className={`px-3 py-1.5 rounded-lg border text-[13px] transition-colors ${
                            active
                              ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/[0.08] text-[var(--hm-brand-500)] font-semibold'
                              : 'border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-brand-500)]/40'
                          }`}
                        >
                          {pick(u.label)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Input
                    value={form.unitLabel}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        unitLabel: e.target.value,
                        unit: e.target.value,
                      })
                    }
                    placeholder={t('projects.sqm')}
                  />
                )}
              </FormGroup>

              <div className="grid grid-cols-2 gap-3">
                <FormGroup>
                  <Label>{t('projects.scopeQuantity')}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    placeholder="0"
                  />
                  {canUseRoomArea && (
                    <button
                      type="button"
                      onClick={() =>
                        roomArea != null &&
                        setForm((f) => ({ ...f, quantity: String(roomArea) }))
                      }
                      className="mt-1 text-[11px] font-semibold text-[var(--hm-brand-500)] hover:opacity-80 transition-opacity"
                    >
                      {t('projects.scopeUseRoomArea', { area: String(roomArea) })}
                    </button>
                  )}
                </FormGroup>
                <FormGroup>
                  <Label>
                    {t('projects.scopeUnitPrice')}{' '}
                    <span className="text-[var(--hm-fg-muted)] font-normal">
                      ({t('common.optional')})
                    </span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.unitPrice}
                    onChange={(e) =>
                      setForm({ ...form, unitPrice: e.target.value })
                    }
                    placeholder="0"
                  />
                </FormGroup>
              </div>

              <FormGroup>
                <Label>{t('projects.scopeWorker')}</Label>
                <select
                  value={form.engagementId}
                  onChange={(e) =>
                    setForm({ ...form, engagementId: e.target.value })
                  }
                  className="w-full rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)] text-[var(--hm-fg-primary)] px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--hm-brand-500)]/30"
                >
                  <option value="">{t('projects.scopeUnassigned')}</option>
                  {engagements.map((e) => (
                    <option key={e.id} value={e.id}>
                      {engagementLabel(e)}
                    </option>
                  ))}
                </select>
                {missingTrade && (
                  <p className="mt-1 text-[12px] text-[var(--hm-fg-muted)]">
                    {t('projects.scopeMissingTrade')}
                  </p>
                )}
              </FormGroup>

              {Number(form.quantity) > 0 && Number(form.unitPrice) > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-[var(--hm-bg-page)] px-4 py-2.5">
                  <span className="text-[13px] text-[var(--hm-fg-muted)]">
                    {t('projects.scopeLineTotal')}
                  </span>
                  <span className="text-[15px] font-bold text-[var(--hm-fg-primary)] tabular-nums">
                    {fmtGel(Number(form.quantity) * Number(form.unitPrice))}
                  </span>
                </div>
              )}

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

              <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-1 px-4 sm:px-6 py-3 bg-[var(--hm-bg-page)] border-t border-[var(--hm-border-subtle)] flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t('common.cancel')}
                </Button>
                {!editingId && (
                  <Button
                    variant="secondary"
                    onClick={() => save(true)}
                    disabled={saving || !form.name.trim()}
                  >
                    {t('projects.scopeSaveAndAdd')}
                  </Button>
                )}
                <Button
                  onClick={() => save(false)}
                  disabled={saving || !form.name.trim()}
                >
                  {editingId ? t('common.save') : t('common.add')}
                </Button>
              </div>
            </div>
          </ModalBody>
        </Modal>
      )}

      {/* Quick add room */}
      {roomOpen && (
        <Modal
          isOpen={roomOpen}
          onClose={() => setRoomOpen(false)}
          size="sm"
          showCloseButton
        >
          <ModalHeader title={t('projects.roomAdd')} />
          <ModalBody>
            <div className="flex flex-col gap-4">
              <FormGroup>
                <Label>{t('projects.selName')}</Label>
                <Input
                  value={roomForm.name}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, name: e.target.value })
                  }
                  autoFocus
                />
              </FormGroup>
              <FormGroup>
                <Label>
                  {t('projects.landAreaLabel')}{' '}
                  <span className="text-[var(--hm-fg-muted)] font-normal">
                    ({t('common.optional')})
                  </span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={roomForm.area}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, area: e.target.value })
                  }
                  placeholder="0"
                />
              </FormGroup>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRoomOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={addRoom}
                  disabled={roomSaving || !roomForm.name.trim()}
                >
                  {t('common.add')}
                </Button>
              </div>
            </div>
          </ModalBody>
        </Modal>
      )}
    </section>
  );
}
