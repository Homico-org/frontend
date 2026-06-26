'use client';

import { Button } from '@/components/ui/button';
import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import AddProductModal from '@/components/projects/AddProductModal';
import CatalogPickerModal from '@/components/projects/CatalogPickerModal';
import CheckoutModal from '@/components/shop/CheckoutModal';
import { features } from '@/config/features';
import ProductCard from '@/components/shop/ProductCard';
import type { CartItem } from '@/hooks/useCart';
import { FilterPills } from '@/components/projects/TableCard';
import { Room } from '@/components/projects/ProjectRooms';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clock,
  Download,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export type ProductStatus = 'to_buy' | 'ordered' | 'delivered';

export interface ProjectProduct {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  vendor?: string;
  url?: string;
  imageUrl?: string;
  /** Catalog link - present makes the row orderable via checkout. */
  supplierProductId?: string;
  supplierKey?: string;
  phase?: string;
  engagementId?: string;
  roomId?: string;
  stepId?: string;
  category?: string;
  /** FF&E schedule / procurement details. */
  sku?: string;
  dimensions?: string;
  leadTimeDays?: number;
  etaDate?: string;
  /** Client sign-off on the line item. */
  approvalStatus?: 'none' | 'pending' | 'approved' | 'changes_requested';
  approvedAt?: string;
  status: ProductStatus;
  note?: string;
  createdAt: string;
}

export interface ProductLogEntry {
  action: string; // added | edited | removed | to_buy | ordered | delivered
  name?: string;
  at: string;
}

const STATUSES: ProductStatus[] = ['to_buy', 'ordered', 'delivered'];

const STATUS_LABEL_KEY: Record<ProductStatus, string> = {
  to_buy: 'projects.prodToBuy',
  ordered: 'projects.prodOrdered',
  delivered: 'projects.prodDelivered',
};

const STATUS_DOT: Record<ProductStatus, string> = {
  to_buy: 'var(--hm-n-300)',
  ordered: 'var(--hm-brand-500)',
  delivered: 'var(--hm-success-500)',
};

// Tinted pill style for the per-row status control.
const STATUS_PILL: Record<ProductStatus, string> = {
  to_buy: 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)]',
  ordered: 'bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)]',
  delivered: 'bg-[var(--hm-success-500)]/[0.12] text-[var(--hm-success-600)]',
};

// History action -> label key + accent color, and -> icon.
const LOG_META: Record<string, { labelKey: string; tone: string }> = {
  added: { labelKey: 'projects.logAdded', tone: 'var(--hm-fg-secondary)' },
  edited: { labelKey: 'projects.logEdited', tone: 'var(--hm-fg-secondary)' },
  removed: { labelKey: 'projects.logRemoved', tone: 'var(--hm-error-500)' },
  to_buy: { labelKey: 'projects.prodToBuy', tone: 'var(--hm-fg-muted)' },
  ordered: { labelKey: 'projects.prodOrdered', tone: 'var(--hm-brand-500)' },
  delivered: {
    labelKey: 'projects.prodDelivered',
    tone: 'var(--hm-success-500)',
  },
};
const LOG_ICON: Record<string, typeof Plus> = {
  added: Plus,
  edited: Pencil,
  removed: Trash2,
  to_buy: Package,
  ordered: ShoppingCart,
  delivered: Check,
};

interface ProjectShoppingProps {
  projectId: string;
  products: ProjectProduct[];
  log?: ProductLogEntry[];
  rooms?: Room[];
  canManage: boolean;
  /** The client (owner) - only they can sign off on schedule line items. */
  canApprove?: boolean;
  /** Project budget ceiling (budgetMax) for the variance readout. */
  budget?: number;
  onChanged: () => Promise<void> | void;
}

export default function ProjectShopping({
  projectId,
  products,
  log = [],
  rooms = [],
  canManage,
  canApprove = false,
  budget,
  onChanged,
}: ProjectShoppingProps) {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [filter, setFilter] = useState<'all' | ProductStatus>('all');
  // Room scope: 'all' | 'none' (whole object) | a room id.
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // Card grid (browse) vs schedule table (the FF&E procurement master view).
  const [view, setView] = useState<'cards' | 'schedule'>('cards');
  // How the list is grouped: by category (default), room, or supplier (the PO view).
  const [groupBy, setGroupBy] = useState<'category' | 'room' | 'supplier'>(
    'category',
  );
  // The add/edit modal: { item } edits, { category } adds into that group.
  const [modal, setModal] = useState<{
    item?: ProjectProduct;
    category?: string;
  } | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Inline category rename (applies across every product in the group).
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Shopping history, most recent first.
  const history = useMemo(() => [...log].reverse(), [log]);
  const dateLocale =
    locale === 'en' ? 'en-US' : locale === 'ru' ? 'ru-RU' : 'ka-GE';
  const fmtWhen = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(dateLocale, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Remember which category groups are collapsed (per project, this device).
  const collapseKey = `homico:shop-collapsed:${projectId}`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(collapseKey);
      if (raw) setCollapsed(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
  }, [collapseKey]);
  useEffect(() => {
    try {
      localStorage.setItem(collapseKey, JSON.stringify([...collapsed]));
    } catch {
      /* ignore */
    }
  }, [collapseKey, collapsed]);

  const toggleGroup = (cat: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  // Remember the view mode (cards vs schedule) per project, this device.
  const viewKey = `homico:shop-view:${projectId}`;
  useEffect(() => {
    const raw = localStorage.getItem(viewKey);
    if (raw === 'schedule' || raw === 'cards') setView(raw);
  }, [viewKey]);
  useEffect(() => {
    try {
      localStorage.setItem(viewKey, view);
    } catch {
      /* ignore */
    }
  }, [viewKey, view]);

  const roomName = (roomId?: string) =>
    roomId ? rooms.find((r) => r.id === roomId)?.name : undefined;

  // ETA date -> short "24 Jun"; lead time -> "14 d" (locale-aware unit).
  const fmtEta = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(
      locale === 'en' ? 'en-US' : locale === 'ru' ? 'ru-RU' : 'ka-GE',
      { day: 'numeric', month: 'short' },
    );
  };

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

  // Export the full schedule to CSV. UTF-8 BOM so Excel reads Georgian/Russian.
  const exportCsv = () => {
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = [
      'Category',
      'Item',
      'Ref',
      'Room',
      'Vendor',
      'Dimensions',
      'Qty',
      'Unit price',
      'Total',
      'Lead (days)',
      'ETA',
      'Status',
    ];
    const rows = products.map((p) => [
      p.category || '',
      p.name,
      p.sku || '',
      roomName(p.roomId) || '',
      p.vendor || '',
      p.dimensions || '',
      p.qty ?? '',
      p.unitPrice ?? '',
      (p.unitPrice || 0) * (p.qty || 0),
      p.leadTimeDays ?? '',
      p.etaDate ? p.etaDate.slice(0, 10) : '',
      t(STATUS_LABEL_KEY[p.status]),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map(esc).join(','))
      .join('\r\n');
    const blob = new Blob(['﻿' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Catalog-linked, not-yet-delivered rows can be ordered through the real
  // checkout. Map them to the cart shape CheckoutModal consumes; it re-quotes
  // against the live catalog (by supplierProductId) and offers the
  // all / bulk / by-item delivery modes - so "quick order" is one click here.
  const orderable: CartItem[] = useMemo(
    () =>
      products
        .filter((p) => p.supplierProductId && p.status !== 'delivered')
        .map((p) => ({
          product: {
            id: p.supplierProductId as string,
            supplierKey: p.supplierKey || (p.vendor || '').toLowerCase(),
            name: p.name,
            priceGel: p.unitPrice || 0,
            currency: 'GEL',
            imageUrl: p.imageUrl,
            externalUrl: p.url || '',
            category: p.category,
            isAvailable: true,
          },
          qty: p.qty || 1,
        })),
    [products],
  );

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

  // Client sign-off on a line item (approve / request changes).
  const reviewProduct = async (
    id: string,
    status: 'approved' | 'changes_requested',
  ) => {
    setBusyId(id);
    try {
      await api.patch(`/projects/${projectId}/products/${id}/review`, {
        status,
      });
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

  // Rename a category across every product that carries it.
  const renameCategory = async (from: string, to: string) => {
    const target = to.trim();
    setRenaming(null);
    if (!target || target === from) return;
    const items = products.filter((p) => (p.category || '').trim() === from);
    try {
      await Promise.all(
        items.map((p) =>
          api.patch(`/projects/${projectId}/products/${p.id}`, {
            category: target,
          }),
        ),
      );
      await onChanged();
      toast.success(t('projects.savedChanges'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
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

  // Distinct categories across all products (for the modal combobox).
  const allCategories = useMemo(
    () =>
      Array.from(
        new Set(
          products.map((p) => (p.category || '').trim()).filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  // Group the visible products by the selected dimension (category / room /
  // supplier). Each entry is [key, label, items]; the empty group sinks last.
  const groups = useMemo<[string, string, ProjectProduct[]][]>(() => {
    const m = new Map<string, [string, ProjectProduct[]]>();
    for (const p of filtered) {
      const key =
        groupBy === 'room'
          ? p.roomId || ''
          : groupBy === 'supplier'
            ? (p.supplierKey || p.vendor || '').toLowerCase()
            : (p.category || '').trim();
      const label =
        groupBy === 'room'
          ? roomName(p.roomId) || t('projects.wholeObject')
          : groupBy === 'supplier'
            ? p.vendor || p.supplierKey || t('projects.shopUncategorized')
            : key || t('projects.shopUncategorized');
      const entry = m.get(key) ?? [label, []];
      entry[1].push(p);
      m.set(key, entry);
    }
    return [...m.entries()]
      .map(
        ([key, [label, items]]): [string, string, ProjectProduct[]] => [
          key,
          label,
          items,
        ],
      )
      .sort((a, b) => {
        if (a[0] === '') return 1;
        if (b[0] === '') return -1;
        return a[1].localeCompare(b[1]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, groupBy, rooms]);

  // Room scope pills: All / Whole object / one per room (only when rooms exist).
  const roomOptions = [
    { id: 'all', label: t('projects.filterAll') },
    { id: 'none', label: t('projects.wholeObject') },
    ...rooms.map((r) => ({ id: r.id, label: r.name })),
  ];

  // Reuses the shared <ProductCard> (same tile as the shop) with the project's
  // management footer: change status, edit, delete.
  const productCard = (p: ProjectProduct) => {
    const busy = busyId === p.id;
    const line = (p.unitPrice || 0) * (p.qty || 0);
    return (
      <ProductCard
        key={p.id}
        name={p.name}
        imageUrl={p.imageUrl}
        priceLabel={fmt(line)}
        supplierKey={p.vendor ? p.vendor.toLowerCase() : undefined}
        vendorLabel={p.vendor}
        externalUrl={p.url}
        subline={`${p.qty} × ${fmt(p.unitPrice || 0)} · ${
          roomName(p.roomId) || t('projects.wholeObject')
        }`}
        topRight={
          !canManage ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.06em] shadow-sm ${STATUS_PILL[p.status]}`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: STATUS_DOT[p.status] }}
              />
              {t(STATUS_LABEL_KEY[p.status])}
            </span>
          ) : undefined
        }
        footer={
          canManage ? (
            <div className="flex items-center gap-1.5">
              <div className="relative min-w-0 flex-1">
                <select
                  value={p.status}
                  disabled={busy}
                  onChange={(e) =>
                    setStatus(p.id, e.target.value as ProductStatus)
                  }
                  className={`h-8 w-full cursor-pointer appearance-none rounded-lg pl-2.5 pr-6 text-[11px] font-semibold transition-colors focus:outline-none ${STATUS_PILL[p.status]}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(STATUS_LABEL_KEY[s])}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60"
                />
              </div>
              <button
                type="button"
                onClick={() => setModal({ item: p })}
                aria-label={t('common.edit')}
                className="shrink-0 rounded-md p-1.5 text-[var(--hm-fg-muted)] transition-colors hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)]"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(p.id)}
                disabled={busy}
                aria-label={t('common.delete')}
                className="shrink-0 rounded-md p-1.5 text-[var(--hm-fg-muted)] transition-colors hover:bg-[var(--hm-error-50)] hover:text-[var(--hm-error-500)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : undefined
        }
      />
    );
  };

  // Schedule (FF&E) row: the procurement master view - one line per item with
  // ref, qty, unit, total, lead time, ETA and order status.
  const productRow = (p: ProjectProduct) => {
    const busy = busyId === p.id;
    const line = (p.unitPrice || 0) * (p.qty || 0);
    const appr = p.approvalStatus || 'none';
    return (
      <tr key={p.id} className="align-middle text-[var(--hm-fg-primary)]">
        <td className="px-3 py-2">
          <div className="flex items-center gap-2.5">
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.imageUrl}
                alt=""
                loading="lazy"
                className="h-9 w-9 shrink-0 rounded-md object-cover ring-1 ring-[var(--hm-border-subtle)]"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
                <Package className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate font-medium">
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--hm-brand-500)] hover:underline"
                  >
                    {p.name}
                  </a>
                ) : (
                  p.name
                )}
              </div>
              <div className="truncate text-[11px] text-[var(--hm-fg-muted)]">
                {[roomName(p.roomId) || t('projects.wholeObject'), p.vendor]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
          </div>
        </td>
        <td className="px-2 py-2 font-mono text-[11px] text-[var(--hm-fg-secondary)]">
          {p.sku || '-'}
        </td>
        <td className="px-2 py-2 text-right tabular-nums">{p.qty}</td>
        <td className="px-2 py-2 text-right tabular-nums text-[var(--hm-fg-secondary)]">
          {fmt(p.unitPrice || 0)}
        </td>
        <td className="px-2 py-2 text-right font-semibold tabular-nums">
          {fmt(line)}
        </td>
        <td className="px-2 py-2 tabular-nums text-[var(--hm-fg-secondary)]">
          {p.leadTimeDays ? t('projects.leadDays', { n: p.leadTimeDays }) : '-'}
        </td>
        <td className="px-2 py-2 tabular-nums text-[var(--hm-fg-secondary)]">
          {fmtEta(p.etaDate) || '-'}
        </td>
        <td className="px-2 py-2">
          {canManage ? (
            <div className="relative inline-block">
              <select
                value={p.status}
                disabled={busy}
                onChange={(e) =>
                  setStatus(p.id, e.target.value as ProductStatus)
                }
                className={`h-7 cursor-pointer appearance-none rounded-full pl-2.5 pr-6 text-[11px] font-semibold focus:outline-none ${STATUS_PILL[p.status]}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(STATUS_LABEL_KEY[s])}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60"
              />
            </div>
          ) : (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px] font-semibold ${STATUS_PILL[p.status]}`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: STATUS_DOT[p.status] }}
              />
              {t(STATUS_LABEL_KEY[p.status])}
            </span>
          )}
        </td>
        <td className="px-2 py-2">
          {canApprove ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => reviewProduct(p.id, 'approved')}
                disabled={busy}
                aria-label={t('projects.approve')}
                className={`rounded-md p-1 transition-colors ${
                  appr === 'approved'
                    ? 'bg-[var(--hm-success-500)]/[0.14] text-[var(--hm-success-600)]'
                    : 'text-[var(--hm-fg-muted)] hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-success-600)]'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reviewProduct(p.id, 'changes_requested')}
                disabled={busy}
                aria-label={t('projects.requestChanges')}
                className={`rounded-md p-1 transition-colors ${
                  appr === 'changes_requested'
                    ? 'bg-[var(--hm-warning-500)]/[0.16] text-[var(--hm-warning-600)]'
                    : 'text-[var(--hm-fg-muted)] hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-warning-600)]'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : appr === 'approved' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--hm-success-600)]">
              <Check className="h-3.5 w-3.5" />
              {t('projects.apprApproved')}
            </span>
          ) : appr === 'changes_requested' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--hm-warning-600)]">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('projects.apprChanges')}
            </span>
          ) : (
            <span className="text-[11px] text-[var(--hm-fg-muted)]">
              {t('projects.apprAwaiting')}
            </span>
          )}
        </td>
        {canManage && (
          <td className="px-2 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setModal({ item: p })}
                aria-label={t('common.edit')}
                className="rounded-md p-1.5 text-[var(--hm-fg-muted)] transition-colors hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)]"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(p.id)}
                disabled={busy}
                aria-label={t('common.delete')}
                className="rounded-md p-1.5 text-[var(--hm-fg-muted)] transition-colors hover:bg-[var(--hm-error-50)] hover:text-[var(--hm-error-500)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </td>
        )}
      </tr>
    );
  };

  const scheduleTable = (items: ProjectProduct[]) => (
    <div className="overflow-x-auto px-1 pb-1">
      <table className="w-full min-w-[820px] border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-[var(--hm-border-subtle)] text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--hm-fg-muted)]">
            <th className="px-3 py-2 font-semibold">{t('projects.colItem')}</th>
            <th className="px-2 py-2 font-semibold">{t('projects.colRef')}</th>
            <th className="px-2 py-2 text-right font-semibold">
              {t('projects.colQty')}
            </th>
            <th className="px-2 py-2 text-right font-semibold">
              {t('projects.colUnit')}
            </th>
            <th className="px-2 py-2 text-right font-semibold">
              {t('projects.colTotal')}
            </th>
            <th className="px-2 py-2 font-semibold">{t('projects.colLead')}</th>
            <th className="px-2 py-2 font-semibold">{t('projects.colEta')}</th>
            <th className="px-2 py-2 font-semibold">
              {t('projects.colStatus')}
            </th>
            <th className="px-2 py-2 font-semibold">
              {t('projects.colApproval')}
            </th>
            {canManage && <th className="px-2 py-2" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--hm-border-subtle)]">
          {items.map(productRow)}
        </tbody>
      </table>
    </div>
  );

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="inline-flex min-w-0 items-center gap-2 text-[18px] font-bold text-[var(--hm-fg-primary)]">
          <ShoppingCart className="h-5 w-5 shrink-0 text-[var(--hm-brand-500)]" />
          <span className="truncate">{t('projects.shoppingTitle')}</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHistory(true)}
            leftIcon={<Clock className="w-4 h-4" />}
          >
            {t('projects.shopHistory')}
          </Button>
          {canManage && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCatalogOpen(true)}
                leftIcon={<Search className="w-4 h-4" />}
              >
                {t('projects.catalogBrowse')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModal({})}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t('projects.shopAddItem')}
              </Button>
              {features.payments && orderable.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setCheckoutOpen(true)}
                  leftIcon={<ShoppingCart className="w-4 h-4" />}
                >
                  {t('projects.quickOrder', { count: orderable.length })}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Summary - compact total + status counts */}
      {products.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
              {fmt(total)}
            </span>
            <span className="inline-flex items-center gap-1 text-[12px] tabular-nums text-[var(--hm-fg-muted)]">
              <ShoppingCart className="h-3.5 w-3.5" />
              {products.length}
            </span>
            {budget != null && budget > 0 && (
              <>
                <span className="text-[12px] tabular-nums text-[var(--hm-fg-muted)]">
                  / {fmt(budget)}
                </span>
                <span
                  className={`text-[12px] font-medium tabular-nums ${
                    total > budget
                      ? 'text-[var(--hm-error-500)]'
                      : 'text-[var(--hm-success-600)]'
                  }`}
                >
                  {total > budget
                    ? t('projects.overBudget', { amount: fmt(total - budget) })
                    : t('projects.underBudget', { amount: fmt(budget - total) })}
                </span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
            {STATUSES.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 text-[12px] text-[var(--hm-fg-secondary)]"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: STATUS_DOT[s] }}
                />
                {t(STATUS_LABEL_KEY[s])}
                <span className="font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                  {counts[s]}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Shared add / edit modal - the store-link field is where merchant
          auto-fill plugs in; the category field builds the tree. */}
      {canManage && modal && (
        <AddProductModal
          isOpen
          onClose={() => setModal(null)}
          projectId={projectId}
          rooms={rooms}
          categories={allCategories}
          category={modal.category}
          item={modal.item}
          roomId={
            !modal.item && roomFilter !== 'all' && roomFilter !== 'none'
              ? roomFilter
              : undefined
          }
          onSaved={onChanged}
        />
      )}

      {/* Browse the supplier catalog and multi-add into this project. */}
      {canManage && catalogOpen && (
        <CatalogPickerModal
          isOpen={catalogOpen}
          mode="direct"
          onClose={() => setCatalogOpen(false)}
          projectId={projectId}
          roomId={
            roomFilter !== 'all' && roomFilter !== 'none' ? roomFilter : undefined
          }
          onSaved={onChanged}
        />
      )}

      {/* Quick order - feed the catalog-linked rows straight into the shared
          checkout (delivery mode + Flitt payment live inside CheckoutModal). */}
      {canManage && checkoutOpen && orderable.length > 0 && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          items={orderable}
          onOrderPlaced={() => {
            setCheckoutOpen(false);
            void onChanged();
          }}
        />
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

      {/* Status filter + card/schedule view toggle */}
      {products.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="scrollbar-hide inline-flex max-w-full overflow-x-auto rounded-full bg-[var(--hm-bg-tertiary)] p-1 align-top">
          {(['all', ...STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s as 'all' | ProductStatus)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                filter === s
                  ? 'bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] shadow-[0_1px_2px_rgba(17,16,13,0.06)]'
                  : 'text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]'
              }`}
            >
              {s === 'all'
                ? t('projects.filterAll')
                : t(STATUS_LABEL_KEY[s as ProductStatus])}
            </button>
          ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={exportCsv}
            >
              {t('projects.export')}
            </Button>
            <div className="inline-flex rounded-full bg-[var(--hm-bg-tertiary)] p-1">
            {(['cards', 'schedule'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  view === v
                    ? 'bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] shadow-[0_1px_2px_rgba(17,16,13,0.06)]'
                    : 'text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]'
                }`}
              >
                {v === 'cards'
                  ? t('projects.viewCards')
                  : t('projects.viewSchedule')}
              </button>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* Group-by selector (category / room / supplier-as-PO) */}
      {products.length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-[12px]">
          <span className="text-[var(--hm-fg-muted)]">
            {t('projects.groupBy')}
          </span>
          <div className="inline-flex rounded-full bg-[var(--hm-bg-tertiary)] p-0.5">
            {(['category', 'room', 'supplier'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupBy(g)}
                className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                  groupBy === g
                    ? 'bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] shadow-[0_1px_2px_rgba(17,16,13,0.06)]'
                    : 'text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]'
                }`}
              >
                {g === 'category'
                  ? t('projects.groupCategory')
                  : g === 'room'
                    ? t('projects.groupRoom')
                    : t('projects.groupSupplier')}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 text-center text-[14px] text-[var(--hm-fg-muted)]">
          {t('projects.shopEmpty')}
        </div>
      ) : (
        <div className="divide-y divide-[var(--hm-border-subtle)] overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
          {groups.map(([cat, label, items]) => {
            const open = !collapsed.has(cat);
            const named = cat !== '';
            const isCat = groupBy === 'category';
            const sub = items.reduce(
              (acc, p) => acc + (p.unitPrice || 0) * (p.qty || 0),
              0,
            );
            return (
              <div key={cat || '__none__'}>
                <div className="flex items-center gap-2 px-3 py-2">
                  {renaming === cat ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        renameCategory(cat, renameValue);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-1.5"
                    >
                      {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setRenaming(null);
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-[var(--hm-brand-500)] bg-[var(--hm-bg-elevated)] px-2.5 py-1 text-[13px] font-semibold text-[var(--hm-fg-primary)] focus:outline-none"
                      />
                      <button
                        type="submit"
                        aria-label={t('common.save')}
                        className="shrink-0 rounded-md p-1.5 text-[var(--hm-brand-500)] hover:bg-[var(--hm-bg-tertiary)]"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenaming(null)}
                        aria-label={t('common.cancel')}
                        className="shrink-0 rounded-md p-1.5 text-[var(--hm-fg-muted)] hover:bg-[var(--hm-bg-tertiary)]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleGroup(cat)}
                        className="group flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <ChevronDown
                          className={`h-3.5 w-3.5 shrink-0 text-[var(--hm-fg-muted)] transition-transform ${
                            open ? '' : '-rotate-90'
                          }`}
                        />
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                            named
                              ? 'bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)]'
                              : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
                          }`}
                        >
                          <Tag className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate text-[13.5px] font-semibold text-[var(--hm-fg-primary)]">
                          {label}
                        </span>
                        <span className="shrink-0 rounded-full bg-[var(--hm-bg-tertiary)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--hm-fg-muted)]">
                          {items.length}
                        </span>
                      </button>
                      <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                        {fmt(sub)}
                      </span>
                      {canManage && named && isCat && (
                        <button
                          type="button"
                          onClick={() => {
                            setRenameValue(cat);
                            setRenaming(cat);
                          }}
                          aria-label={t('common.edit')}
                          className="shrink-0 rounded-md p-1 text-[var(--hm-fg-muted)] transition-colors hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canManage && isCat && (
                        <button
                          type="button"
                          onClick={() => setModal({ category: cat })}
                          aria-label={t('projects.shopAddItem')}
                          className="shrink-0 rounded-md p-1 text-[var(--hm-fg-muted)] transition-colors hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-brand-500)]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
                {open &&
                  (view === 'schedule' ? (
                    scheduleTable(items)
                  ) : (
                    <div className="grid grid-cols-2 gap-3 p-3 pt-1 sm:grid-cols-3 lg:grid-cols-4">
                      {items.map(productCard)}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      )}

      {/* History - opens as an overlay so the shopping list and its actions
          stay put (no destructive view swap, no hidden buttons). */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        size="md"
        showCloseButton
        ariaLabel={t('projects.shopHistory')}
      >
        <ModalHeader title={t('projects.shopHistory')} />
        <ModalBody>
          {history.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-[var(--hm-fg-muted)]">
              {t('projects.shopHistoryEmpty')}
            </p>
          ) : (
            <ol className="overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] divide-y divide-[var(--hm-border-subtle)]">
              {history.map((e, i) => {
                const meta = LOG_META[e.action];
                const Icon = LOG_ICON[e.action] || Pencil;
                return (
                  <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: `${meta?.tone ?? 'var(--hm-fg-muted)'}1a`,
                        color: meta?.tone ?? 'var(--hm-fg-muted)',
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[13px] text-[var(--hm-fg-primary)]">
                        <span className="font-semibold">
                          {t(meta?.labelKey ?? 'projects.logEdited')}
                        </span>
                        {e.name ? ` · ${e.name}` : ''}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-[var(--hm-fg-muted)]">
                      {fmtWhen(e.at)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </ModalBody>
      </Modal>
    </section>
  );
}
