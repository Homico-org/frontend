'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  Check,
  ExternalLink,
  Palette,
  Plus,
  ShoppingCart,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';

export type SelectionStatus = 'proposed' | 'approved' | 'changes_requested';

export interface SelectionOption {
  id: string;
  type: 'color' | 'material';
  name: string;
  colorHex?: string;
  imageUrl?: string;
  brand?: string;
  product?: string;
  price?: number;
  vendor?: string;
  url?: string;
  note?: string;
}

export interface Selection {
  id: string;
  title: string;
  roomId?: string;
  surface?: string;
  phase?: string;
  options: SelectionOption[];
  chosenOptionId?: string;
  /** Set once the chosen option has been added to the procurement schedule. */
  productId?: string;
  status: SelectionStatus;
  note?: string;
  createdAt: string;
}

const STATUS_BADGE: Record<
  SelectionStatus,
  { key: string; variant: 'warning' | 'success' | 'danger' }
> = {
  proposed: { key: 'projects.selProposed', variant: 'warning' },
  approved: { key: 'projects.docApproved', variant: 'success' },
  changes_requested: {
    key: 'projects.docChangesRequested',
    variant: 'danger',
  },
};

interface ProjectSelectionsProps {
  projectId: string;
  selections: Selection[];
  rooms?: { id: string; name: string }[];
  canManage: boolean; // designer/participant: create/edit options
  canReview: boolean; // client: pick / approve
  onChanged: () => Promise<void> | void;
}

export default function ProjectSelections({
  projectId,
  selections,
  rooms = [],
  canManage,
  canReview,
  onChanged,
}: ProjectSelectionsProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const imgRef = useRef<HTMLInputElement>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Add-selection modal
  const [addingSel, setAddingSel] = useState(false);
  const [selForm, setSelForm] = useState({ title: '', surface: '', roomId: '' });
  const roomName = (rid?: string) =>
    rid ? rooms.find((r) => r.id === rid)?.name : undefined;

  // Add-option modal (for a given selection)
  const [optionFor, setOptionFor] = useState<string | null>(null);
  const [optForm, setOptForm] = useState({
    type: 'material' as 'color' | 'material',
    name: '',
    colorHex: '#cccccc',
    imageUrl: '',
    price: '',
    vendor: '',
    url: '',
  });
  const [imgUploading, setImgUploading] = useState(false);

  const errMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || t('projects.tryAgain');

  const createSelection = async () => {
    if (!selForm.title.trim()) return;
    setSaving(true);
    try {
      await api.post(`/projects/${projectId}/selections`, {
        title: selForm.title.trim(),
        surface: selForm.surface.trim() || undefined,
        roomId: selForm.roomId || undefined,
      });
      setSelForm({ title: '', surface: '', roomId: '' });
      setAddingSel(false);
      await onChanged();
      toast.success(t('projects.savedChanges'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const removeSelection = async (sid: string) => {
    setBusyId(sid);
    try {
      await api.delete(`/projects/${projectId}/selections/${sid}`);
      await onChanged();
      toast.success(t('projects.itemRemoved'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  const uploadOptionImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await api.post('/upload', fd);
      setOptForm((f) => ({
        ...f,
        imageUrl: (up.data.url || up.data.filename) as string,
      }));
    } catch (err) {
      toast.error(t('projects.docUploadFailed'), errMsg(err));
    } finally {
      setImgUploading(false);
      if (imgRef.current) imgRef.current.value = '';
    }
  };

  const addOption = async () => {
    if (!optionFor || !optForm.name.trim()) return;
    setSaving(true);
    try {
      await api.post(`/projects/${projectId}/selections/${optionFor}/options`, {
        type: optForm.type,
        name: optForm.name.trim(),
        colorHex: optForm.type === 'color' ? optForm.colorHex : undefined,
        imageUrl: optForm.type === 'material' ? optForm.imageUrl || undefined : undefined,
        price: optForm.price ? Number(optForm.price) : undefined,
        vendor: optForm.vendor.trim() || undefined,
        url: optForm.url.trim() || undefined,
      });
      setOptForm({
        type: 'material',
        name: '',
        colorHex: '#cccccc',
        imageUrl: '',
        price: '',
        vendor: '',
        url: '',
      });
      setOptionFor(null);
      await onChanged();
      toast.success(t('projects.savedChanges'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const removeOption = async (sid: string, oid: string) => {
    setBusyId(sid + oid);
    try {
      await api.delete(
        `/projects/${projectId}/selections/${sid}/options/${oid}`,
      );
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  const pick = async (sid: string, oid: string) => {
    setBusyId(sid + oid);
    try {
      await api.patch(`/projects/${projectId}/selections/${sid}/choose`, {
        chosenOptionId: oid,
      });
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  const review = async (sid: string, status: SelectionStatus) => {
    setBusyId(sid);
    try {
      await api.patch(`/projects/${projectId}/selections/${sid}/review`, {
        status,
      });
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  // Materialize the chosen option into the procurement schedule.
  const addToSchedule = async (sid: string) => {
    setBusyId(sid + 'sched');
    try {
      await api.post(`/projects/${projectId}/selections/${sid}/to-product`);
      await onChanged();
      toast.success(t('projects.selAddedToSchedule'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="inline-flex items-center gap-2 text-[18px] font-bold text-[var(--hm-fg-primary)]">
          <Palette className="w-5 h-5 text-[var(--hm-brand-500)]" />
          {t('projects.selTab')}
        </h2>
        {canManage && (
          <Button
            size="sm"
            onClick={() => setAddingSel(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('projects.selAdd')}
          </Button>
        )}
      </div>

      {selections.length === 0 ? (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 flex flex-col items-center text-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)]">
            <Palette className="w-6 h-6" />
          </span>
          <p className="text-[14px] text-[var(--hm-fg-muted)] max-w-[44ch]">
            {t('projects.selEmpty')}
          </p>
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setAddingSel(true)}
            >
              {t('projects.selAdd')}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {selections.map((sel) => {
            const badge = STATUS_BADGE[sel.status];
            return (
              <div
                key={sel.id}
                className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-[var(--hm-fg-primary)] truncate">
                      {sel.title}
                    </h3>
                    {(sel.surface || roomName(sel.roomId)) && (
                      <span className="text-[12px] text-[var(--hm-fg-muted)]">
                        {[roomName(sel.roomId), sel.surface]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={badge.variant} size="sm">
                      {t(badge.key)}
                    </Badge>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => removeSelection(sel.id)}
                        disabled={busyId === sel.id}
                        aria-label={t('common.delete')}
                        className="p-1.5 rounded-md text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {sel.options.map((o) => {
                    const chosen = sel.chosenOptionId === o.id;
                    const ob = busyId === sel.id + o.id;
                    return (
                      <div
                        key={o.id}
                        className={`relative rounded-xl border overflow-hidden ${
                          chosen
                            ? 'border-[var(--hm-brand-500)] ring-2 ring-[var(--hm-brand-500)]/30'
                            : 'border-[var(--hm-border-subtle)]'
                        }`}
                      >
                        {/* Swatch / image */}
                        {o.type === 'color' ? (
                          <div
                            className="h-20 w-full"
                            style={{ backgroundColor: o.colorHex || '#ccc' }}
                          />
                        ) : o.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={storage.getOptimizedImageUrl(o.imageUrl, 'feedCard')}
                            alt={o.name}
                            className="h-20 w-full object-cover"
                          />
                        ) : (
                          <div className="h-20 w-full bg-[var(--hm-bg-tertiary)]" />
                        )}

                        {chosen && (
                          <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--hm-brand-500)] text-white">
                            <Check className="w-3 h-3" />
                            {t('projects.selChosen')}
                          </span>
                        )}
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => removeOption(sel.id, o.id)}
                            disabled={ob}
                            aria-label={t('common.delete')}
                            className="absolute top-1.5 left-1.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="p-2.5">
                          <div className="text-[13px] font-medium text-[var(--hm-fg-primary)] truncate">
                            {o.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--hm-fg-muted)] mt-0.5">
                            {o.type === 'color' && o.colorHex && (
                              <span className="tabular-nums uppercase">
                                {o.colorHex}
                              </span>
                            )}
                            {!!o.price && (
                              <span className="tabular-nums">
                                {o.price.toLocaleString('en-US').replace(/,/g, ' ')} ₾
                              </span>
                            )}
                            {o.url && (
                              <a
                                href={o.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[var(--hm-brand-500)]"
                                aria-label={o.vendor || o.url}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {canReview && !chosen && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                              disabled={ob}
                              onClick={() => pick(sel.id, o.id)}
                            >
                              {t('projects.selPick')}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setOptionFor(sel.id)}
                      className="flex flex-col items-center justify-center gap-1.5 min-h-[8rem] rounded-xl border border-dashed border-[var(--hm-border-subtle)] text-[var(--hm-fg-muted)] hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-[12px]">
                        {t('projects.selAddOption')}
                      </span>
                    </button>
                  )}
                </div>

                {/* Client review actions */}
                {canReview && sel.status !== 'changes_requested' && (
                  <div className="flex justify-end mt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === sel.id}
                      onClick={() => review(sel.id, 'changes_requested')}
                      leftIcon={<X className="w-3.5 h-3.5" />}
                    >
                      {t('projects.requestChanges')}
                    </Button>
                  </div>
                )}

                {/* Materialize the chosen option into the procurement schedule */}
                {canManage && sel.chosenOptionId && (
                  <div className="mt-3 flex justify-end">
                    {sel.productId ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--hm-success-600)]">
                        <Check className="h-3.5 w-3.5" />
                        {t('projects.selOnSchedule')}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === sel.id + 'sched'}
                        onClick={() => addToSchedule(sel.id)}
                        leftIcon={<ShoppingCart className="h-3.5 w-3.5" />}
                      >
                        {t('projects.selAddToSchedule')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add-selection modal */}
      {addingSel && (
        <Modal isOpen={addingSel} onClose={() => setAddingSel(false)} size="md" showCloseButton>
          <ModalHeader title={t('projects.selAdd')} />
          <ModalBody>
            <div className="flex flex-col gap-4">
              <FormGroup>
                <Label>{t('common.title')}</Label>
                <Input
                  value={selForm.title}
                  onChange={(e) => setSelForm({ ...selForm, title: e.target.value })}
                  autoFocus
                />
              </FormGroup>
              {rooms.length > 0 && (
                <FormGroup>
                  <Label>
                    {t('projects.roomLabel')}{' '}
                    <span className="text-[var(--hm-fg-muted)] font-normal">
                      ({t('common.optional')})
                    </span>
                  </Label>
                  <select
                    value={selForm.roomId}
                    onChange={(e) =>
                      setSelForm({ ...selForm, roomId: e.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-3 text-[14px] text-[var(--hm-fg-primary)] focus:outline-none focus:border-[var(--hm-brand-500)]"
                  >
                    <option value="">-</option>
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
                  {t('projects.selSurface')}{' '}
                  <span className="text-[var(--hm-fg-muted)] font-normal">
                    ({t('common.optional')})
                  </span>
                </Label>
                <Input
                  value={selForm.surface}
                  onChange={(e) => setSelForm({ ...selForm, surface: e.target.value })}
                />
              </FormGroup>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddingSel(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={createSelection} disabled={saving || !selForm.title.trim()}>
                  {t('common.add')}
                </Button>
              </div>
            </div>
          </ModalBody>
        </Modal>
      )}

      {/* Add-option modal */}
      {optionFor && (
        <Modal isOpen={!!optionFor} onClose={() => setOptionFor(null)} size="md" showCloseButton>
          <ModalHeader title={t('projects.selAddOption')} />
          <ModalBody>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                {(['material', 'color'] as const).map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setOptForm({ ...optForm, type: tp })}
                    className={`flex-1 px-3 py-2 rounded-xl text-[13px] font-medium border transition-colors ${
                      optForm.type === tp
                        ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/[0.08] text-[var(--hm-brand-500)]'
                        : 'border-[var(--hm-border-subtle)] text-[var(--hm-fg-muted)]'
                    }`}
                  >
                    {tp === 'material'
                      ? t('projects.selMaterial')
                      : t('projects.selColor')}
                  </button>
                ))}
              </div>

              <FormGroup>
                <Label>{t('projects.selName')}</Label>
                <Input
                  value={optForm.name}
                  onChange={(e) => setOptForm({ ...optForm, name: e.target.value })}
                  autoFocus
                />
              </FormGroup>

              {optForm.type === 'color' ? (
                <FormGroup>
                  <Label>{t('projects.selColor')}</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={optForm.colorHex}
                      onChange={(e) =>
                        setOptForm({ ...optForm, colorHex: e.target.value })
                      }
                      className="w-12 h-10 rounded-lg border border-[var(--hm-border-subtle)] bg-transparent cursor-pointer"
                    />
                    <Input
                      value={optForm.colorHex}
                      onChange={(e) =>
                        setOptForm({ ...optForm, colorHex: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </FormGroup>
              ) : (
                <>
                  <FormGroup>
                    <Label>
                      {t('common.photos')}{' '}
                      <span className="text-[var(--hm-fg-muted)] font-normal">
                        ({t('common.optional')})
                      </span>
                    </Label>
                    <div className="flex items-center gap-3">
                      {optForm.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={storage.getOptimizedImageUrl(optForm.imageUrl, 'thumbnail')}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => imgRef.current?.click()}
                        disabled={imgUploading}
                        leftIcon={
                          imgUploading ? (
                            <LoadingSpinner size="xs" color="var(--hm-brand-500)" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )
                        }
                      >
                        {t('projects.upload')}
                      </Button>
                      <input
                        ref={imgRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={uploadOptionImage}
                      />
                    </div>
                  </FormGroup>
                  <div className="grid grid-cols-2 gap-3">
                    <FormGroup>
                      <Label>{t('projects.shopUnitPrice')}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={optForm.price}
                        onChange={(e) => setOptForm({ ...optForm, price: e.target.value })}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>{t('projects.shopVendor')}</Label>
                      <Input
                        value={optForm.vendor}
                        onChange={(e) => setOptForm({ ...optForm, vendor: e.target.value })}
                      />
                    </FormGroup>
                  </div>
                  <FormGroup>
                    <Label>{t('projects.shopLink')}</Label>
                    <Input
                      value={optForm.url}
                      onChange={(e) => setOptForm({ ...optForm, url: e.target.value })}
                    />
                  </FormGroup>
                </>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOptionFor(null)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={addOption} disabled={saving || !optForm.name.trim()}>
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
