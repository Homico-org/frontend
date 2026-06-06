'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Label } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  Check,
  ImagePlus,
  Link2,
  ListChecks,
  MapPin,
  Package,
  Plus,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Room } from './ProjectRooms';
import { ProjectProduct, ProductStatus } from './ProjectShopping';
import CatalogPickerModal from './CatalogPickerModal';

const STATUSES: ProductStatus[] = ['to_buy', 'ordered', 'delivered'];
const STATUS_LABEL_KEY: Record<ProductStatus, string> = {
  to_buy: 'projects.prodToBuy',
  ordered: 'projects.prodOrdered',
  delivered: 'projects.prodDelivered',
};
const STATUS_TONE: Record<ProductStatus, string> = {
  to_buy:
    'bg-[var(--hm-warning-50)] text-[var(--hm-warning-600)] border-[var(--hm-warning-100)]',
  ordered:
    'bg-[var(--hm-info-50)] text-[var(--hm-info-600)] border-[var(--hm-info-100)]',
  delivered:
    'bg-[var(--hm-success-50)] text-[var(--hm-success-600)] border-[var(--hm-success-100)]',
};

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  rooms?: Room[];
  steps?: { id: string; name: string }[];
  /** Pre-select a space when adding from a space card. */
  roomId?: string;
  /** Pre-select a step (plan). */
  stepId?: string;
  /** Pre-fill the category (e.g. when adding into a category group). */
  category?: string;
  /** Existing category names across the project, for the combobox suggestions. */
  categories?: string[];
  /** Pass an existing product to edit it. */
  item?: ProjectProduct;
  onSaved: () => Promise<void> | void;
}

const fmtGel = (n: number) =>
  `${Math.round(n).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

export default function AddProductModal({
  isOpen,
  onClose,
  projectId,
  rooms = [],
  steps = [],
  roomId,
  stepId,
  category,
  categories = [],
  item,
  onSaved,
}: AddProductModalProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const isEdit = !!item;
  const imageRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [form, setForm] = useState(() => ({
    name: item?.name ?? '',
    qty: item?.qty != null ? String(item.qty) : '1',
    unitPrice: item?.unitPrice != null ? String(item.unitPrice) : '',
    vendor: item?.vendor ?? '',
    url: item?.url ?? '',
    imageUrl: item?.imageUrl ?? '',
    status: (item?.status ?? 'to_buy') as ProductStatus,
    roomId: item?.roomId ?? roomId ?? '',
    stepId: item?.stepId ?? stepId ?? '',
    category: item?.category ?? category ?? '',
  }));
  const [saving, setSaving] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  // Category combobox dropdown.
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useClickOutside<HTMLDivElement>(() => setCatOpen(false), catOpen);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const qtyNum = Number(form.qty) || 0;
  const priceNum = Number(form.unitPrice) || 0;
  const total = qtyNum * priceNum;

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await api.post('/upload', fd);
      set('imageUrl', (up.data.url || up.data.filename) as string);
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
    } finally {
      setImageUploading(false);
      if (imageRef.current) imageRef.current.value = '';
    }
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      // Always send every field (empty string clears it) so edits - including
      // clearing the stage, category or resetting status - persist.
      const body = {
        name: form.name.trim(),
        qty: form.qty ? Number(form.qty) : 1,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : 0,
        vendor: form.vendor.trim() || undefined,
        url: form.url.trim() || undefined,
        imageUrl: form.imageUrl || undefined,
        roomId: form.roomId || '',
        stepId: form.stepId || '',
        category: form.category.trim(),
        status: form.status,
      };
      if (isEdit && item) {
        await api.patch(`/projects/${projectId}/products/${item.id}`, body);
      } else {
        await api.post(`/projects/${projectId}/products`, body);
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

  const selectCls =
    'h-10 w-full rounded-lg border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] pl-9 pr-3 text-[14px] text-[var(--hm-fg-primary)]';

  const catQuery = form.category.trim().toLowerCase();
  const catMatches = categories.filter((c) =>
    c.toLowerCase().includes(catQuery),
  );
  const catExact = categories.some((c) => c.toLowerCase() === catQuery);
  const showCreateCat = !!form.category.trim() && !catExact;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton>
      <ModalHeader
        title={isEdit ? t('projects.editProduct') : t('projects.addProduct')}
      />
      <ModalBody className="flex flex-col gap-4">
        {/* Live preview card - image upload doubles as the thumbnail */}
        <div className="flex gap-3 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)] p-3">
          <button
            type="button"
            onClick={() => imageRef.current?.click()}
            disabled={imageUploading}
            className="group relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-lg border border-dashed border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-muted)] transition-colors hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)]"
            aria-label={t('projects.addPhoto')}
          >
            {form.imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  referrerPolicy="no-referrer"
                  src={storage.getOptimizedImageUrl(form.imageUrl, 'feedCard')}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute right-1 top-1 hidden rounded-full bg-black/55 p-1 text-white group-hover:block">
                  <ImagePlus className="h-3 w-3" />
                </span>
              </>
            ) : (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                {imageUploading ? (
                  <span className="text-[11px]">…</span>
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[9px] font-medium">
                      {t('projects.addPhoto')}
                    </span>
                  </>
                )}
              </span>
            )}
          </button>
          {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadImage}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="truncate text-[15px] font-semibold text-[var(--hm-fg-primary)]">
              {form.name.trim() || (
                <span className="font-normal text-[var(--hm-fg-muted)]">
                  {t('projects.addProduct')}
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-[12px] text-[var(--hm-fg-muted)]">
              {qtyNum} × {fmtGel(priceNum)}
              {form.vendor.trim() ? ` · ${form.vendor.trim()}` : ''}
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[form.status]}`}
              >
                {t(STATUS_LABEL_KEY[form.status])}
              </span>
              <span className="text-[15px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
                {fmtGel(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Paste a link - the catalog parser will autofill from it */}
        <FormGroup>
          <Label>{t('projects.shopLink')}</Label>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--hm-fg-muted)]" />
            <Input
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
              placeholder="https://"
              className="pl-9"
            />
          </div>
          <p className="mt-1 text-[12px] text-[var(--hm-fg-muted)]">
            {t('projects.shopLinkHint')}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Search className="h-4 w-4" />}
            onClick={() => setCatalogOpen(true)}
            className="mt-2"
          >
            {t('projects.catalogSearch')}
          </Button>
        </FormGroup>

        <FormGroup>
          <Label>{t('projects.shopName')}</Label>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            autoFocus
          />
        </FormGroup>

        <div className="grid grid-cols-2 gap-3">
          <FormGroup>
            <Label>{t('projects.shopQty')}</Label>
            <Input
              type="number"
              min={0}
              value={form.qty}
              onChange={(e) => set('qty', e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label>{t('projects.shopUnitPrice')}</Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                value={form.unitPrice}
                onChange={(e) => set('unitPrice', e.target.value)}
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--hm-fg-muted)]">
                ₾
              </span>
            </div>
          </FormGroup>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormGroup>
            <Label>{t('projects.shopVendor')}</Label>
            <Input
              value={form.vendor}
              onChange={(e) => set('vendor', e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <Label>{t('projects.shopCategory')}</Label>
            <div className="relative" ref={catRef}>
              <Tag className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--hm-fg-muted)]" />
              <Input
                value={form.category}
                onChange={(e) => {
                  set('category', e.target.value);
                  setCatOpen(true);
                }}
                onFocus={() => setCatOpen(true)}
                placeholder={t('projects.shopCategoryHint')}
                className="pl-9 pr-8"
                autoComplete="off"
              />
              {form.category && (
                <button
                  type="button"
                  onClick={() => {
                    set('category', '');
                    setCatOpen(true);
                  }}
                  aria-label={t('common.clear')}
                  className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 rounded p-0.5 text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {catOpen && (catMatches.length > 0 || showCreateCat) && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] py-1 shadow-lg">
                  {catMatches.map((c) => {
                    const active = c.toLowerCase() === catQuery;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          set('category', c);
                          setCatOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--hm-fg-primary)] transition-colors hover:bg-[var(--hm-bg-tertiary)]"
                      >
                        <Tag className="h-3.5 w-3.5 shrink-0 text-[var(--hm-fg-muted)]" />
                        <span className="truncate">{c}</span>
                        {active && (
                          <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-[var(--hm-brand-500)]" />
                        )}
                      </button>
                    );
                  })}
                  {showCreateCat && (
                    <button
                      type="button"
                      onClick={() => setCatOpen(false)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-[var(--hm-brand-500)] transition-colors hover:bg-[var(--hm-bg-tertiary)] ${
                        catMatches.length
                          ? 'border-t border-[var(--hm-border-subtle)]'
                          : ''
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {t('projects.shopCreateCategory', {
                          name: form.category.trim(),
                        })}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </FormGroup>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rooms.length > 0 && (
            <FormGroup>
              <Label>{t('projects.roomLabel')}</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--hm-fg-muted)]" />
                <select
                  value={form.roomId}
                  onChange={(e) => set('roomId', e.target.value)}
                  className={selectCls}
                >
                  <option value="">{t('projects.wholeObject')}</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </FormGroup>
          )}
          {steps.length > 0 && (
            <FormGroup>
              <Label>{t('projects.stepLabel')}</Label>
              <div className="relative">
                <ListChecks className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--hm-fg-muted)]" />
                <select
                  value={form.stepId}
                  onChange={(e) => set('stepId', e.target.value)}
                  className={selectCls}
                >
                  <option value="">{t('projects.unassignedStep')}</option>
                  {steps.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </FormGroup>
          )}
        </div>

        <FormGroup>
          <Label>{t('projects.statusLabel')}</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {STATUSES.map((s) => {
              const active = form.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  className={`rounded-lg border px-2 py-2 text-[13px] font-medium transition-colors ${
                    active
                      ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)] text-white'
                      : 'border-[var(--hm-border)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-fg-primary)] hover:text-[var(--hm-fg-primary)]'
                  }`}
                >
                  {t(STATUS_LABEL_KEY[s])}
                </button>
              );
            })}
          </div>
        </FormGroup>

        <div className="flex items-center justify-between border-t border-[var(--hm-border-subtle)] pt-4">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--hm-fg-secondary)]">
            <Package className="h-4 w-4 text-[var(--hm-fg-muted)]" />
            {t('projects.total')}
            <span className="text-[16px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
              {fmtGel(total)}
            </span>
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={save} loading={saving} disabled={!form.name.trim()}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </ModalBody>

      {catalogOpen && (
        <CatalogPickerModal
          isOpen={catalogOpen}
          mode="prefill"
          onClose={() => setCatalogOpen(false)}
          onPrefill={(p) => {
            setForm((f) => ({
              ...f,
              name: p.name,
              unitPrice: String(p.unitPrice),
              vendor: p.vendor,
              url: p.url,
              imageUrl: p.imageUrl ?? f.imageUrl,
            }));
            setCatalogOpen(false);
          }}
        />
      )}
    </Modal>
  );
}
