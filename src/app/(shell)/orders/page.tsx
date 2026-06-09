'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { PageShell } from '@/components/ui/PageShell';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import { formatDate } from '@/utils/dateUtils';
import { ChevronRight, Package } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ORDER_STATUS_TONE,
  orderStatusLabelKey,
} from '@/components/shop/orderStatus';

interface OrderRow {
  id: string;
  orderNumber: string;
  totalMinor: number;
  status: string;
  createdAt: string;
  items: { name: string; qty: number; imageUrl?: string }[];
}

const fmt = (minor: number) => `${(minor / 100).toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

export default function ClientOrdersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t, locale } = useLanguage();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  const loadOrders = useCallback(() => {
    if (isLoading || !isAuthenticated) return;
    api
      .get<OrderRow[]>('/orders')
      .then((r) => setOrders(r.data || []))
      .catch(() => setOrders([]));
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Refresh on tab focus so returning from a payment shows the synced status
  // (the list endpoint re-syncs awaiting orders) without a manual reload.
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') loadOrders();
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadOrders]);

  const headerProps = {
    icon: Package,
    title: t('orders.myOrders'),
    subtitle: t('orders.trackYourOngoingAndCompleted'),
    bodyContentClassName: 'mx-auto max-w-3xl',
  } as const;

  if (isLoading || orders === null) {
    return (
      <PageShell {...headerProps}>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[84px] rounded-2xl" />
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      {...headerProps}
      rightContent={
        orders.length > 0 ? (
          <span className="inline-flex items-center justify-center rounded-full bg-[var(--hm-brand-500)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--hm-brand-500)] tabular-nums">
            {orders.length}
          </span>
        ) : undefined
      }
    >
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]">
          <EmptyState
            icon={Package}
            title={t('orders.emptyTitle')}
            description={t('orders.emptyBody')}
            actionLabel={t('header.shop')}
            actionHref="/shop"
            variant="illustrated"
            size="md"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => {
            const itemCount = o.items.reduce((s, i) => s + i.qty, 0);
            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-3.5 transition-all hover:border-[var(--hm-brand-500)] hover:shadow-[var(--hm-shadow-sm)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] transition-colors group-hover:bg-[var(--hm-brand-500)]/10 group-hover:text-[var(--hm-brand-500)]">
                  {o.items.find((i) => i.imageUrl)?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      referrerPolicy="no-referrer"
                      src={storage.getOptimizedImageUrl(
                        o.items.find((i) => i.imageUrl)!.imageUrl!,
                        'feedCard',
                      )}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5" strokeWidth={1.8} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-[var(--hm-fg-primary)]">
                      {o.orderNumber}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ORDER_STATUS_TONE[o.status] || ''}`}
                    >
                      {t(orderStatusLabelKey(o.status))}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[12px] text-[var(--hm-fg-secondary)]">
                    {o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--hm-fg-muted)] tabular-nums">
                    {formatDate(o.createdAt, locale)} · {itemCount}×
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[15px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
                    {fmt(o.totalMinor)}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--hm-fg-muted)] transition-colors group-hover:text-[var(--hm-brand-500)]" />
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
