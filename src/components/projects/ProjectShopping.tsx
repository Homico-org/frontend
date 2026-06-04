'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilterPills } from '@/components/projects/TableCard';
import { Room } from '@/components/projects/ProjectRooms';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import {
  ChevronDown,
  ExternalLink,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

export type ProductStatus = 'to_buy' | 'ordered' | 'delivered';

export interface ProjectProduct {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  vendor?: string;
  url?: string;
  imageUrl?: string;
  phase?: string;
  engagementId?: string;
  roomId?: string;
  status: ProductStatus;
  note?: string;
  createdAt: string;
}

const STATUSES: ProductStatus[] = ['to_buy', 'ordered', 'delivered'];

const STATUS_LABEL_KEY: Record<ProductStatus, string> = {
  to_buy: 'projects.prodToBuy',
  ordered: 'projects.prodOrdered',
  delivered: 'projects.prodDelivered',
};

const STATUS_DOT: Record<ProductStatus, string> = {
  to_buy: 'var(--hm-border)',
  ordered: 'var(--hm-brand-500)',
  delivered: 'var(--hm-success-500)',
};

interface ProjectShoppingProps {
  projectId: string;
  products: ProjectProduct[];
  rooms?: Room[];
  canManage: boolean;
  onChanged: () => Promise<void> | void;
}

export default function ProjectShopping({
  projectId,
  products,
  rooms = [],
  canManage,
  onChanged,
}: ProjectShoppingProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const [filter, setFilter] = useState<'all' | ProductStatus>('all');
  // Room scope: 'all' | 'none' (whole object) | a room id.
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    qty: '1',
    unitPrice: '',
    vendor: '',
    url: '',
    roomId: '',
  });

  const roomName = (roomId?: string) =>
    roomId ? rooms.find((r) => r.id === roomId)?.name : undefined;

  const errMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || t('projects.tryAgain');

  const total = products.reduce(
    (s, p) => s + (p.unitPrice || 0) * (p.qty || 0),
    0,
  );
  const counts = {
    to_buy: products.filter((p) => p.status === 'to_buy').length,
    ordered: products.filter((p) => p.status === 'ordered').length,
    delivered: products.filter((p) => p.status === 'delivered').length,
  };

  const fmt = (n: number) => `${n.toLocaleString()} ₾`;

  const add = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.post(`/projects/${projectId}/products`, {
        name: form.name.trim(),
        qty: form.qty ? Number(form.qty) : 1,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : 0,
        vendor: form.vendor.trim() || undefined,
        url: form.url.trim() || undefined,
        roomId: form.roomId || undefined,
      });
      setForm({
        name: '',
        qty: '1',
        unitPrice: '',
        vendor: '',
        url: '',
        roomId: roomFilter !== 'all' && roomFilter !== 'none' ? roomFilter : '',
      });
      setAdding(false);
      await onChanged();
      toast.success(t('projects.shopAdded'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: ProductStatus) => {
    setBusyId(id);
    try {
      await api.patch(`/projects/${projectId}/products/${id}`, { status });
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await api.delete(`/projects/${projectId}/products/${id}`);
      await onChanged();
      toast.success(t('projects.shopRemoved'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  const byRoom =
    roomFilter === 'all'
      ? products
      : roomFilter === 'none'
        ? products.filter((p) => !p.roomId)
        : products.filter((p) => p.roomId === roomFilter);
  const filtered =
    filter === 'all' ? byRoom : byRoom.filter((p) => p.status === filter);

  // Room scope pills: All / Whole object / one per room (only when rooms exist).
  const roomOptions = [
    { id: 'all', label: t('projects.filterAll') },
    { id: 'none', label: t('projects.wholeObject') },
    ...rooms.map((r) => ({ id: r.id, label: r.name })),
  ];

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="inline-flex items-center gap-2 text-[18px] font-bold text-[var(--hm-fg-primary)]">
          <ShoppingCart className="w-5 h-5 text-[var(--hm-brand-500)]" />
          {t('projects.shoppingTitle')}
        </h2>
        {canManage && (
          <Button
            size="sm"
            onClick={() => setAdding((v) => !v)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('projects.shopAddItem')}
          </Button>
        )}
      </div>

      {/* Totals + stock split */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-4 text-[13px]">
        <span className="font-semibold text-[var(--hm-fg-primary)]">
          {t('projects.shopTotal')}: <span className="tabular-nums">{fmt(total)}</span>
        </span>
        {STATUSES.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 text-[var(--hm-fg-muted)]"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATUS_DOT[s] }}
            />
            {t(STATUS_LABEL_KEY[s])} <span className="tabular-nums">{counts[s]}</span>
          </span>
        ))}
      </div>

      {/* Add form */}
      {adding && canManage && (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-5 mb-5 flex flex-col gap-3">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t('projects.shopName')}
            autoFocus
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Input
              type="number"
              min={0}
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              placeholder={t('projects.shopQty')}
            />
            <Input
              type="number"
              min={0}
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              placeholder={t('projects.shopUnitPrice')}
            />
            <Input
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              placeholder={t('projects.shopVendor')}
            />
            <Input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder={t('projects.shopLink')}
            />
          </div>
          {rooms.length > 0 && (
            <select
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              className="h-10 w-full rounded-lg border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] px-3 text-[14px] text-[var(--hm-fg-primary)]"
            >
              <option value="">{t('projects.wholeObject')}</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAdding(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button size="sm" onClick={add} disabled={saving || !form.name.trim()}>
              {t('common.add')}
            </Button>
          </div>
        </div>
      )}

      {/* Space scope pills (only when spaces exist) */}
      {rooms.length > 0 && (
        <FilterPills
          options={roomOptions}
          active={roomFilter}
          onChange={setRoomFilter}
          className="mb-3"
        />
      )}

      {/* Status filter pills */}
      {products.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', ...STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s as 'all' | ProductStatus)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                filter === s
                  ? 'bg-[var(--hm-fg-primary)] text-[var(--hm-bg-elevated)]'
                  : 'text-[var(--hm-fg-muted)] hover:bg-[var(--hm-bg-tertiary)]'
              }`}
            >
              {s === 'all'
                ? t('projects.filterAll')
                : t(STATUS_LABEL_KEY[s as ProductStatus])}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 text-center text-[14px] text-[var(--hm-fg-muted)]">
          {t('projects.shopEmpty')}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] divide-y divide-[var(--hm-border-subtle)] overflow-hidden">
          {filtered.map((p) => {
            const busy = busyId === p.id;
            const line = (p.unitPrice || 0) * (p.qty || 0);
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_DOT[p.status] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] font-medium text-[var(--hm-fg-primary)] truncate hover:text-[var(--hm-brand-500)] inline-flex items-center gap-1"
                      >
                        {p.name}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-[14px] font-medium text-[var(--hm-fg-primary)] truncate">
                        {p.name}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--hm-fg-muted)] mt-0.5">
                    {p.qty} × {fmt(p.unitPrice || 0)}
                    {p.vendor ? ` · ${p.vendor}` : ''}
                    {` · ${roomName(p.roomId) || t('projects.wholeObject')}`}
                  </div>
                </div>

                <span className="text-[13px] font-semibold tabular-nums text-[var(--hm-fg-primary)] shrink-0">
                  {fmt(line)}
                </span>

                {canManage ? (
                  <div className="relative shrink-0">
                    <select
                      value={p.status}
                      disabled={busy}
                      onChange={(e) =>
                        setStatus(p.id, e.target.value as ProductStatus)
                      }
                      className="h-8 appearance-none rounded-full border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] pl-3 pr-7 text-[11px] font-medium text-[var(--hm-fg-primary)] transition-colors focus:border-[var(--hm-brand-500)] focus:outline-none hover:border-[var(--hm-n-300)]"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(STATUS_LABEL_KEY[s])}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden
                      className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--hm-n-500)]"
                    />
                  </div>
                ) : (
                  <span className="text-[12px] text-[var(--hm-fg-muted)] shrink-0">
                    {t(STATUS_LABEL_KEY[p.status])}
                  </span>
                )}

                {canManage && (
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    disabled={busy}
                    aria-label={t('common.delete')}
                    className="shrink-0 p-1.5 rounded-lg text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
