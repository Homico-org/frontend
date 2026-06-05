'use client';

import AuthGuard from '@/components/common/AuthGuard';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { supplierLabel } from '@/components/shop/types';
import {
  ORDER_STATUS_TONE,
  orderStatusLabelKey,
} from '@/components/shop/orderStatus';
import { useCallback, useEffect, useState } from 'react';

interface AdminOrderItem {
  supplierKey: string;
  name: string;
  externalUrl?: string;
  unitPriceMinor: number;
  qty: number;
  lineTotalMinor: number;
}
interface AdminOrder {
  _id: string;
  orderNumber: string;
  status: string;
  items: AdminOrderItem[];
  subtotalMinor: number;
  feeMinor: number;
  totalMinor: number;
  refundedAmountMinor: number;
  deliveryAddress: { formattedAddress: string; phone: string; apartment?: string; notes?: string };
  customerNote?: string;
  createdAt: string;
}

const fmt = (m: number) => `${(m / 100).toLocaleString()} ₾`;

// Forward transitions the admin can apply, by current status.
const NEXT: Record<string, string[]> = {
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
};

const STATUS_FILTERS = ['', 'paid', 'processing', 'shipped', 'delivered', 'refunded', 'cancelled'];

export default function AdminOrdersPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ items: AdminOrder[] }>('/orders/admin', {
        params: { status: statusFilter || undefined },
      })
      .then((r) => setOrders(r.data.items || []))
      .catch(() => setOrders([]));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    setBusy(true);
    try {
      await api.patch(`/orders/admin/${id}/status`, { status });
      toast.success(t('admin.orders.updated'));
      load();
    } catch (err) {
      toast.error(t('projects.tryAgain'), (err as any)?.response?.data?.message);
    } finally {
      setBusy(false);
    }
  };

  const refund = async (id: string) => {
    const reason = window.prompt(t('admin.orders.refundReason'));
    if (reason == null) return;
    setBusy(true);
    try {
      await api.post(`/orders/admin/${id}/refund`, { reason: reason || 'admin refund' });
      toast.success(t('admin.orders.refunded'));
      load();
    } catch (err) {
      toast.error(t('projects.tryAgain'), (err as any)?.response?.data?.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-[24px] font-bold text-[var(--hm-fg-primary)]">
          {t('admin.orders.title')}
        </h1>

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-[var(--hm-fg-primary)] text-[var(--hm-bg-elevated)]'
                  : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]'
              }`}
            >
              {s ? t(orderStatusLabelKey(s)) : t('projects.filterAll')}
            </button>
          ))}
        </div>

        {orders === null ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-[14px] text-[var(--hm-fg-muted)]">
            {t('admin.orders.empty')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => {
              const open = openId === o._id;
              const byShop = o.items.reduce<Record<string, AdminOrderItem[]>>((m, it) => {
                (m[it.supplierKey] ??= []).push(it);
                return m;
              }, {});
              return (
                <div
                  key={o._id}
                  className="overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : o._id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-[var(--hm-fg-primary)]">{o.orderNumber}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ORDER_STATUS_TONE[o.status] || ''}`}>
                        {t(orderStatusLabelKey(o.status))}
                      </span>
                    </span>
                    <span className="text-[14px] font-bold tabular-nums text-[var(--hm-fg-primary)]">{fmt(o.totalMinor)}</span>
                  </button>

                  {open && (
                    <div className="border-t border-[var(--hm-border-subtle)] px-4 py-3">
                      {/* Items grouped by shop - the ops buy list */}
                      {Object.entries(byShop).map(([shop, list]) => (
                        <div key={shop} className="mb-3">
                          <div className="mb-1 text-[12px] font-semibold text-[var(--hm-brand-500)]">
                            {supplierLabel(shop)}
                          </div>
                          {list.map((it, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 text-[13px]">
                              <a
                                href={it.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-w-0 flex-1 truncate text-[var(--hm-fg-secondary)] hover:text-[var(--hm-brand-500)]"
                              >
                                {it.qty} × {it.name}
                              </a>
                              <span className="shrink-0 tabular-nums text-[var(--hm-fg-primary)]">{fmt(it.lineTotalMinor)}</span>
                            </div>
                          ))}
                        </div>
                      ))}

                      <div className="mb-3 rounded-lg bg-[var(--hm-bg-tertiary)] p-2.5 text-[12px] text-[var(--hm-fg-secondary)]">
                        <strong>{o.deliveryAddress.formattedAddress}</strong> · {o.deliveryAddress.phone}
                        {o.deliveryAddress.notes ? ` · ${o.deliveryAddress.notes}` : ''}
                        {o.customerNote ? ` · "${o.customerNote}"` : ''}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {(NEXT[o.status] || []).map((s) => (
                          <Button key={s} size="sm" variant={s === 'cancelled' ? 'outline' : 'default'} disabled={busy} onClick={() => setStatus(o._id, s)}>
                            {t(`admin.orders.action.${s}`)}
                          </Button>
                        ))}
                        {['paid', 'processing', 'shipped', 'delivered'].includes(o.status) && o.refundedAmountMinor === 0 && (
                          <Button size="sm" variant="destructive" disabled={busy} onClick={() => refund(o._id)}>
                            {t('admin.orders.refund')}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
