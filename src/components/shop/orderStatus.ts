/** Shared order-status presentation: i18n key + badge tone. */
export const ORDER_STATUSES = [
  'awaiting_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'payment_failed',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function orderStatusLabelKey(status: string): string {
  return `orders.status.${status}`;
}

export const ORDER_STATUS_TONE: Record<string, string> = {
  awaiting_payment:
    'bg-[var(--hm-warning-50)] text-[var(--hm-warning-600)]',
  paid: 'bg-[var(--hm-info-50)] text-[var(--hm-info-600)]',
  processing: 'bg-[var(--hm-info-50)] text-[var(--hm-info-600)]',
  shipped: 'bg-[var(--hm-info-50)] text-[var(--hm-info-600)]',
  delivered: 'bg-[var(--hm-success-50)] text-[var(--hm-success-600)]',
  cancelled: 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]',
  refunded: 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]',
  payment_failed: 'bg-[var(--hm-error-50)] text-[var(--hm-error-500)]',
};

/** The forward fulfilment steps shown in the customer timeline. */
export const FULFILMENT_STEPS: OrderStatus[] = [
  'paid',
  'processing',
  'shipped',
  'delivered',
];
