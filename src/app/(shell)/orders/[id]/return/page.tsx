'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * BoG return URL. Reconciles the payment (handles the webhook-vs-return race),
 * then shows the result and links into the order.
 */
export default function OrderReturnPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [status, setStatus] = useState<'checking' | 'paid' | 'pending' | 'failed'>('checking');

  useEffect(() => {
    if (!id) return;
    api
      .get<{ status: string }>(`/orders/${id}/reconcile`)
      .then((r) => {
        const s = r.data?.status;
        if (s === 'paid' || s === 'processing' || s === 'shipped' || s === 'delivered') setStatus('paid');
        else if (s === 'payment_failed' || s === 'cancelled') setStatus('failed');
        else setStatus('pending');
      })
      .catch(() => setStatus('pending'));
  }, [id]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      {status === 'checking' && (
        <>
          <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
          <p className="mt-4 text-[14px] text-[var(--hm-fg-muted)]">{t('orders.confirmingPayment')}</p>
        </>
      )}
      {status === 'paid' && (
        <>
          <CheckCircle2 className="h-14 w-14 text-[var(--hm-success-500)]" />
          <h1 className="mt-3 text-[20px] font-bold text-[var(--hm-fg-primary)]">{t('orders.paidTitle')}</h1>
          <p className="mt-1 text-[14px] text-[var(--hm-fg-muted)]">{t('orders.paidBody')}</p>
          <Button className="mt-5" onClick={() => router.push(`/orders/${id}`)}>
            {t('orders.viewOrder')}
          </Button>
        </>
      )}
      {status === 'pending' && (
        <>
          <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
          <h1 className="mt-3 text-[18px] font-bold text-[var(--hm-fg-primary)]">{t('orders.pendingTitle')}</h1>
          <p className="mt-1 text-[14px] text-[var(--hm-fg-muted)]">{t('orders.pendingBody')}</p>
          <Button variant="outline" className="mt-5" onClick={() => router.push(`/orders/${id}`)}>
            {t('orders.viewOrder')}
          </Button>
        </>
      )}
      {status === 'failed' && (
        <>
          <XCircle className="h-14 w-14 text-[var(--hm-error-500)]" />
          <h1 className="mt-3 text-[20px] font-bold text-[var(--hm-fg-primary)]">{t('orders.failedTitle')}</h1>
          <p className="mt-1 text-[14px] text-[var(--hm-fg-muted)]">{t('orders.failedBody')}</p>
          <Button variant="outline" className="mt-5" onClick={() => router.push('/shop')}>
            {t('header.shop')}
          </Button>
        </>
      )}
    </div>
  );
}
