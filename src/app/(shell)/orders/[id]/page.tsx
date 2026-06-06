'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supplierLabel } from '@/components/shop/types';
import {
  FULFILMENT_STEPS,
  ORDER_STATUS_TONE,
  orderStatusLabelKey,
} from '@/components/shop/orderStatus';
import { Check, MapPin, Package } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface OrderItem {
  supplierKey: string;
  name: string;
  imageUrl?: string;
  unitPriceMinor: number;
  qty: number;
  lineTotalMinor: number;
}
interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  subtotalMinor: number;
  feeMinor: number;
  totalMinor: number;
  deliveryAddress: { formattedAddress: string; phone: string; apartment?: string; notes?: string };
  createdAt: string;
}

const fmt = (minor: number) => `${(minor / 100).toLocaleString()} ₾`;

export default function OrderDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<Order>(`/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-[var(--hm-fg-muted)]">
        {t('orders.notFound')}{' '}
        <Link href="/orders" className="text-[var(--hm-brand-500)] hover:underline">
          {t('orders.myOrders')}
        </Link>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
      </div>
    );
  }

  const isCancelled = ['cancelled', 'refunded', 'payment_failed'].includes(order.status);
  const activeStep = FULFILMENT_STEPS.indexOf(order.status as never);

  // Group items by shop.
  const byShop = order.items.reduce<Record<string, OrderItem[]>>((m, it) => {
    (m[it.supplierKey] ??= []).push(it);
    return m;
  }, {});

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-5 sm:px-6">
      <Link href="/orders" className="text-[13px] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]">
        ← {t('orders.myOrders')}
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-[22px] font-bold text-[var(--hm-fg-primary)]">{order.orderNumber}</h1>
        <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${ORDER_STATUS_TONE[order.status] || ''}`}>
          {t(orderStatusLabelKey(order.status))}
        </span>
      </div>

      {/* Timeline */}
      {!isCancelled && (
        <div className="mt-5 flex items-center gap-1.5">
          {FULFILMENT_STEPS.map((step, i) => {
            const done = i <= activeStep;
            return (
              <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full items-center gap-1.5">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                      done ? 'bg-[var(--hm-brand-500)] text-white' : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  {i < FULFILMENT_STEPS.length - 1 && (
                    <span className={`h-0.5 flex-1 ${i < activeStep ? 'bg-[var(--hm-brand-500)]' : 'bg-[var(--hm-bg-tertiary)]'}`} />
                  )}
                </div>
                <span className="text-[10px] text-[var(--hm-fg-muted)]">{t(orderStatusLabelKey(step))}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Items grouped by shop */}
      <div className="mt-6 flex flex-col gap-3">
        {Object.entries(byShop).map(([shop, list]) => (
          <div key={shop} className="overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
            <div className="border-b border-[var(--hm-border-subtle)] px-4 py-2 text-[12px] font-semibold text-[var(--hm-fg-muted)]">
              {supplierLabel(shop)}
            </div>
            <div className="divide-y divide-[var(--hm-border-subtle)]">
              {list.map((it, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
                    {it.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.imageUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--hm-fg-primary)]">
                    {it.qty} × {it.name}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[var(--hm-fg-primary)]">
                    {fmt(it.lineTotalMinor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-4 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4 text-[13px]">
        <div className="flex justify-between text-[var(--hm-fg-muted)]">
          <span>{t('projects.checkoutSubtotal')}</span>
          <span className="tabular-nums">{fmt(order.subtotalMinor)}</span>
        </div>
        <div className="mt-1 flex justify-between text-[var(--hm-fg-muted)]">
          <span>{t('projects.checkoutFee')}</span>
          <span className="tabular-nums">{fmt(order.feeMinor)}</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t border-[var(--hm-border-subtle)] pt-2">
          <span className="text-[14px] font-bold text-[var(--hm-fg-primary)]">{t('projects.checkoutTotal')}</span>
          <span className="text-[18px] font-bold tabular-nums text-[var(--hm-fg-primary)]">{fmt(order.totalMinor)}</span>
        </div>
      </div>

      {/* Delivery */}
      <div className="mt-4 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4">
        <div className="mb-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--hm-fg-muted)]">
          <MapPin className="h-3.5 w-3.5" />
          {t('projects.checkoutAddress')}
        </div>
        <p className="text-[13px] text-[var(--hm-fg-primary)]">{order.deliveryAddress.formattedAddress}</p>
        <p className="text-[12px] text-[var(--hm-fg-muted)]">{order.deliveryAddress.phone}</p>
      </div>
    </div>
  );
}
