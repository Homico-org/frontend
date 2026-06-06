'use client';

import { Button } from '@/components/ui/button';
import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import AddProductModal from '@/components/projects/AddProductModal';
import CatalogPickerModal from '@/components/projects/CatalogPickerModal';
import ProductCard from '@/components/shop/ProductCard';
import { FilterPills } from '@/components/projects/TableCard';
import { Room } from '@/components/projects/ProjectRooms';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import {
  Check,
  ChevronDown,
  Clock,
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
  phase?: string;
  engagementId?: string;
  roomId?: string;
  stepId?: string;
  category?: string;
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
  onChanged: () => Promise<void> | void;
}

export default function ProjectShopping({
  projectId,
  products,
  log = [],
  rooms = [],
  canManage,
  onChanged,
}: ProjectShoppingProps) {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [filter, setFilter] = useState<'all' | ProductStatus>('all');
  // Room scope: 'all' | 'none' (whole object) | a room id.
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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

  // Group the visible products into a category tree. Uncategorized sinks last.
  const groups = useMemo(() => {
    const m = new Map<string, ProjectProduct[]>();
    for (const p of filtered) {
      const key = (p.category || '').trim();
      const arr = m.get(key) ?? [];
      arr.push(p);
      m.set(key, arr);
    }
    return [...m.entries()].sort((a, b) => {
      if (a[0] === '') return 1;
      if (b[0] === '') return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [filtered]);

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
                onClick={() => setModal({})}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t('projects.shopAddItem')}
              </Button>
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

      {/* Space scope pills (only when spaces exist) */}
      {rooms.length > 0 && (
        <FilterPills
          options={roomOptions}
          active={roomFilter}
          onChange={setRoomFilter}
          className="mb-3"
        />
      )}

      {/* Status filter - segmented control */}
      {products.length > 0 && (
        <div className="scrollbar-hide mb-4 inline-flex max-w-full overflow-x-auto rounded-full bg-[var(--hm-bg-tertiary)] p-1 align-top">
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
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 text-center text-[14px] text-[var(--hm-fg-muted)]">
          {t('projects.shopEmpty')}
        </div>
      ) : (
        <div className="divide-y divide-[var(--hm-border-subtle)] overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
          {groups.map(([cat, items]) => {
            const open = !collapsed.has(cat);
            const named = cat !== '';
            const sub = items.reduce(
              (acc, p) => acc + (p.unitPrice || 0) * (p.qty || 0),
              0,
            );
            const label = cat || t('projects.shopUncategorized');
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
                      {canManage && named && (
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
                      {canManage && (
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
                {open && (
                  <div className="grid grid-cols-2 gap-3 p-3 pt-1 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map(productCard)}
                  </div>
                )}
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
