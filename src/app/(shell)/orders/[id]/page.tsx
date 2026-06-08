'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useCart } from '@/hooks/useCart';
import { useCartUI } from '@/contexts/CartUIContext';
import { api } from '@/lib/api';
import { PageShell } from '@/components/ui/PageShell';
import { Skeleton } from '@/components/ui/Skeleton';
import { supplierLabel } from '@/components/shop/types';
import {
  FULFILMENT_STEPS,
  ORDER_STATUS_TONE,
  orderStatusLabelKey,
} from '@/components/shop/orderStatus';
import { formatDate, formatDateShort } from '@/utils/dateUtils';
import {
  CreditCard,
  Check,
  MapPin,
  Package,
  PackageCheck,
  RotateCcw,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useEffect, Fragment, useState } from 'react';

interface OrderItem {
  supplierProductId?: string;
  supplierKey: string;
  name: string;
  nameKa?: string;
  externalUrl?: string;
  imageUrl?: string;
  unitPriceMinor: number;
  qty: number;
  lineTotalMinor: number;
}
interface StatusEvent {
  status: string;
  at: string;
}
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  subtotalMinor: number;
  feeMinor: number;
  deliveryFeeMinor?: number;
  totalMinor: number;
  deliveryAddress: { formattedAddress: string; phone: string; apartment?: string; notes?: string };
  statusHistory?: StatusEvent[];
  createdAt: string;
}

const fmt = (minor: number) =>
  `${(minor / 100).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

// Per-step icon + one-line hint for the fulfilment timeline.
const STEP_ICON: Record<string, LucideIcon> = {
  paid: CreditCard,
  processing: Package,
  shipped: Truck,
  delivered: PackageCheck,
};
const STEP_HINT_KEY: Record<string, string> = {
  paid: 'orders.fulfilHintPaid',
  processing: 'orders.fulfilHintProcessing',
  shipped: 'orders.fulfilHintShipped',
  delivered: 'orders.fulfilHintDelivered',
};

export default function OrderDetailPage() {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const confirm = useConfirm();
  const cart = useCart();
  const { openCart } = useCartUI();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    api
      .get<Order>(`/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Re-fetch when the tab regains focus - returning from the payment gateway
  // (or the /return page) lands here, and the GET re-syncs payment status, so
  // a just-paid order flips from "awaiting" to "paid" without a manual reload.
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  // Resume an unfinished payment: get a fresh gateway/return URL and go.
  const payNow = async () => {
    setBusy(true);
    try {
      const { data } = await api.post<{ redirectUrl: string }>(`/orders/${id}/pay`);
      let internalPath: string | null = null;
      try {
        const u = new URL(data.redirectUrl, window.location.origin);
        if (u.origin === window.location.origin)
          internalPath = u.pathname + u.search;
      } catch {
        if (data.redirectUrl.startsWith('/')) internalPath = data.redirectUrl;
      }
      if (internalPath) router.push(internalPath);
      else window.location.href = data.redirectUrl;
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message,
      );
      setBusy(false);
    }
  };

  const cancelOrder = async () => {
    const ok = await confirm({
      title: t('orders.cancelConfirm'),
      confirmLabel: t('orders.cancel'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.post(`/orders/${id}/cancel`);
      toast.success(t('orders.cancelled'));
      load();
    } catch (err) {
      toast.error(
        t('projects.tryAgain'),
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message,
      );
    } finally {
      setBusy(false);
    }
  };

  // Rebuild cart items from the order's lines and open the cart. Uses the
  // stored supplierProductId (falling back to a stable key) so quantities
  // merge correctly with anything already in the cart.
  const reorder = () => {
    if (!order) return;
    order.items.forEach((it) => {
      cart.add(
        {
          id: it.supplierProductId || it.externalUrl || `${it.supplierKey}:${it.name}`,
          supplierKey: it.supplierKey,
          name: it.name,
          nameKa: it.nameKa,
          priceGel: it.unitPriceMinor / 100,
          currency: 'GEL',
          imageUrl: it.imageUrl,
          imageUrls: it.imageUrl ? [it.imageUrl] : undefined,
          externalUrl: it.externalUrl || '',
          isAvailable: true,
        },
        it.qty,
      );
    });
    toast.success(t('projects.productAddedToCart'));
    openCart();
  };

  const shellBase = {
    icon: Package,
    backHref: '/orders',
    backLabel: t('orders.myOrders'),
    bodyContentClassName: 'mx-auto max-w-3xl',
  } as const;

  if (notFound) {
    return (
      <PageShell {...shellBase} title={t('orders.orderDetails')}>
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 text-center text-[var(--hm-fg-muted)]">
          {t('orders.notFound')}{' '}
          <Link href="/orders" className="font-semibold text-[var(--hm-brand-500)] hover:underline">
            {t('orders.myOrders')}
          </Link>
        </div>
      </PageShell>
    );
  }

  if (!order) {
    return (
      <PageShell {...shellBase} title={t('orders.orderDetails')}>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  const isCancelled = ['cancelled', 'refunded', 'payment_failed'].includes(order.status);
  const activeStep = FULFILMENT_STEPS.indexOf(order.status as never);

  // Group items by shop.
  const byShop = order.items.reduce<Record<string, OrderItem[]>>((m, it) => {
    (m[it.supplierKey] ??= []).push(it);
    return m;
  }, {});

  const isUnpaid = ['awaiting_payment', 'payment_failed'].includes(order.status);
  const itemCount = order.items.reduce((s, it) => s + (it.qty || 0), 0);
  // The most recent timestamp recorded for a given step, if any.
  const stepDate = (step: string): string | null => {
    const ev = (order.statusHistory ?? []).filter((e) => e.status === step).pop();
    return ev ? formatDateShort(ev.at, locale) : null;
  };
  const currentHintKey = STEP_HINT_KEY[order.status];

  return (
    <PageShell
      {...shellBase}
      title={order.orderNumber}
      subtitle={formatDate(order.createdAt, locale)}
      rightContent={
        <div className="flex items-center gap-2.5">
          <span
            className={`rounded-full px-3 py-1 text-[12px] font-semibold ${ORDER_STATUS_TONE[order.status] || ''}`}
          >
            {t(orderStatusLabelKey(order.status))}
          </span>
          <button
            type="button"
            onClick={reorder}
            aria-label={t('orders.reorder')}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--hm-border)] px-2.5 sm:px-3 text-[12px] font-semibold text-[var(--hm-fg-primary)] transition-colors hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('orders.reorder')}</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-24 sm:pb-2">
        {/* Payment-pending banner - the path to finish or drop an unpaid order */}
        {isUnpaid && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--hm-warning-500)]/30 bg-[var(--hm-warning-50)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[var(--hm-warning-600)]" />
              <div>
                <p className="text-[14px] font-bold text-[var(--hm-fg-primary)]">
                  {t('orders.paymentPending')}
                </p>
                <p className="mt-0.5 text-[13px] text-[var(--hm-fg-secondary)]">
                  {t('orders.paymentPendingHint')}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={cancelOrder}
                disabled={busy}
                className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-[13px] font-semibold text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-error-500)] disabled:opacity-50"
              >
                {t('orders.cancel')}
              </button>
              <button
                type="button"
                onClick={payNow}
                disabled={busy}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--hm-brand-500)] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--hm-brand-600)] disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                {t('orders.payNow')}
              </button>
            </div>
          </div>
        )}

        {/* Fulfilment timeline */}
        {!isCancelled && activeStep >= 0 && (
          <div className="overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
            {/* Current-status headline */}
            <div className="flex items-center gap-3 border-b border-[var(--hm-border-subtle)] px-5 py-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]">
                {(() => {
                  const Icon = STEP_ICON[order.status] ?? Package;
                  return <Icon className="h-5 w-5" strokeWidth={1.9} />;
                })()}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-[var(--hm-fg-primary)]">
                  {t(orderStatusLabelKey(order.status))}
                </p>
                {currentHintKey && (
                  <p className="text-[13px] text-[var(--hm-fg-muted)]">
                    {t(currentHintKey)}
                  </p>
                )}
              </div>
            </div>

            {/* Stepper - icon per step, current step ringed, date when known */}
            <div className="flex items-start px-4 py-5">
              {FULFILMENT_STEPS.map((step, i) => {
                const done = i <= activeStep;
                const current = i === activeStep;
                const Icon = STEP_ICON[step] ?? Package;
                const date = done ? stepDate(step) : null;
                return (
                  <Fragment key={step}>
                    <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                          done
                            ? 'bg-[var(--hm-brand-500)] text-white'
                            : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
                        } ${current ? 'ring-4 ring-[var(--hm-brand-500)]/15' : ''}`}
                      >
                        {done && !current ? (
                          <Check className="h-4 w-4" strokeWidth={2.6} />
                        ) : (
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        )}
                      </span>
                      <span
                        className={`px-0.5 text-[10px] leading-tight ${done ? 'font-semibold text-[var(--hm-fg-primary)]' : 'text-[var(--hm-fg-muted)]'}`}
                      >
                        {t(orderStatusLabelKey(step))}
                      </span>
                      {date && (
                        <span className="text-[9px] tabular-nums text-[var(--hm-fg-subtle)]">
                          {date}
                        </span>
                      )}
                    </div>
                    {i < FULFILMENT_STEPS.length - 1 && (
                      <span
                        className={`mx-0.5 mt-[18px] h-0.5 flex-1 rounded-full ${i < activeStep ? 'bg-[var(--hm-brand-500)]' : 'bg-[var(--hm-bg-tertiary)]'}`}
                      />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Items grouped by shop */}
        <div className="flex flex-col gap-3">
          {Object.entries(byShop).map(([shop, list]) => (
            <div
              key={shop}
              className="overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]"
            >
              <div className="border-b border-[var(--hm-border-subtle)] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--hm-fg-muted)]">
                {supplierLabel(shop)}
              </div>
              <div className="divide-y divide-[var(--hm-border-subtle)]">
                {list.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
                      {it.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.imageUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[var(--hm-fg-primary)]">
                        {it.name}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[var(--hm-fg-muted)] tabular-nums">
                        {it.qty} × {fmt(it.unitPriceMinor)}
                      </span>
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
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4 text-[13px]">
          <div className="flex justify-between text-[var(--hm-fg-muted)]">
            <span>{t('projects.checkoutSubtotal')}</span>
            <span className="tabular-nums">{fmt(order.subtotalMinor)}</span>
          </div>
          <div className="mt-1 flex justify-between text-[var(--hm-fg-muted)]">
            <span>{t('projects.checkoutFee')}</span>
            <span className="tabular-nums">{fmt(order.feeMinor)}</span>
          </div>
          {order.deliveryFeeMinor != null && order.deliveryFeeMinor > 0 && (
            <div className="mt-1 flex justify-between text-[var(--hm-fg-muted)]">
              <span>{t('projects.checkoutDelivery')}</span>
              <span className="tabular-nums">{fmt(order.deliveryFeeMinor)}</span>
            </div>
          )}
          <div className="mt-2 flex items-baseline justify-between border-t border-[var(--hm-border-subtle)] pt-2">
            <span className="text-[14px] font-bold text-[var(--hm-fg-primary)]">{t('projects.checkoutTotal')}</span>
            <span className="text-[18px] font-bold tabular-nums text-[var(--hm-brand-500)]">{fmt(order.totalMinor)}</span>
          </div>
        </div>

        {/* Delivery */}
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4">
          <div className="mb-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--hm-fg-muted)]">
            <MapPin className="h-3.5 w-3.5" />
            {t('projects.checkoutAddress')}
          </div>
          <p className="text-[13px] text-[var(--hm-fg-primary)]">{order.deliveryAddress.formattedAddress}</p>
          <p className="text-[12px] text-[var(--hm-fg-muted)] tabular-nums">{order.deliveryAddress.phone}</p>
          {order.deliveryAddress.notes && (
            <p className="mt-1 text-[12px] text-[var(--hm-fg-secondary)]">{order.deliveryAddress.notes}</p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
