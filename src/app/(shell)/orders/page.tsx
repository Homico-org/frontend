'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Package } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ORDER_STATUS_TONE,
  orderStatusLabelKey,
} from '@/components/shop/orderStatus';

interface OrderRow {
  _id: string;
  orderNumber: string;
  totalMinor: number;
  status: string;
  createdAt: string;
  items: { name: string; qty: number }[];
}

const fmt = (minor: number) => `${(minor / 100).toLocaleString()} ₾`;

export default function ClientOrdersPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    api
      .get<OrderRow[]>('/orders')
      .then((r) => setOrders(r.data || []))
      .catch(() => setOrders([]));
  }, [isLoading, isAuthenticated]);

  if (isLoading || orders === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-5 sm:px-6">
      <h1 className="mb-1 text-[24px] font-bold text-[var(--hm-fg-primary)]">
        {t('orders.myOrders')}
      </h1>
      <p className="mb-6 text-[14px] text-[var(--hm-fg-muted)]">
        {t('orders.trackYourOngoingAndCompleted')}
      </p>

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
          {orders.map((o) => (
            <Link
              key={o._id}
              href={`/orders/${o._id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4 transition-colors hover:border-[var(--hm-brand-500)]"
            >
              <div className="min-w-0">
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
                <p className="mt-1 truncate text-[12px] text-[var(--hm-fg-muted)]">
                  {o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                </p>
              </div>
              <span className="shrink-0 text-[15px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
                {fmt(o.totalMinor)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
