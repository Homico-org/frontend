'use client';

import { useEffect, useState } from 'react';
import { CalendarX2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';

type FeeStatus = 'pending' | 'waived' | 'charged' | 'paid' | 'failed';

interface PendingCancellation {
  _id: string;
  title: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  budgetAmount?: number;
  cancellation?: {
    cancelledAt?: string;
    reason?: string;
    hoursNotice?: number;
    tier?: string;
    rate?: number;
    feeAmount?: number;
    feeStatus?: FeeStatus;
    decidedAt?: string;
  };
}

/**
 * Cancellations waiting on this cleaner's fee decision. The policy already
 * priced each one; the cleaner either charges it or lets the client off.
 * Renders nothing when there is nothing to decide.
 */
export default function ProCancellationFees() {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const [items, setItems] = useState<PendingCancellation[] | null>(null);
  const [decided, setDecided] = useState<PendingCancellation[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .get<PendingCancellation[]>('/jobs/cancellation-fees/pending')
      .then((r) => alive && setItems(r.data || []))
      .catch(() => alive && setItems([]));
    // Already-decided fees, with their payment state refreshed server-side -
    // this is where a charged fee becomes visibly paid or failed.
    api
      .get<PendingCancellation[]>('/jobs/cancellation-fees/decided')
      .then((r) => alive && setDecided(r.data || []))
      .catch(() => alive && setDecided([]));

    return () => {
      alive = false;
    };
  }, []);

  const decide = async (jobId: string, action: 'waive' | 'charge') => {
    setBusyId(jobId);
    try {
      await api.post(`/jobs/${jobId}/cancellation-fee/${action}`);
      setItems((prev) => (prev ?? []).filter((i) => i._id !== jobId));
      success(
        action === 'waive'
          ? t('cancellationFees.waived')
          : t('cancellationFees.charged'),
      );
    } catch {
      error(t('common.tryAgain'));
    } finally {
      setBusyId(null);
    }
  };

  if ((!items || items.length === 0) && decided.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]">
          <CalendarX2 className="h-4 w-4" />
        </span>
        <h2 className="text-[15px] font-bold text-[var(--hm-fg-primary)]">
          {t('cancellationFees.title')}
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {(items ?? []).map((job) => {
          const fee = job.cancellation?.feeAmount ?? 0;
          const notice = job.cancellation?.hoursNotice;
          return (
            <div
              key={job._id}
              className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4"
            >
              <p className="text-[14px] font-semibold text-[var(--hm-fg-primary)]">
                {job.title}
              </p>
              <p className="mt-1 text-[12px] text-[var(--hm-fg-muted)]">
                {job.scheduledDate}
                {job.scheduledSlot ? ` · ${job.scheduledSlot}` : ''}
                {typeof notice === 'number'
                  ? ` · ${t('cancellationFees.notice', {
                      hours: String(Math.max(0, Math.round(notice))),
                    })}`
                  : ''}
              </p>

              <p className="mt-2 text-[13px] text-[var(--hm-fg-secondary)]">
                {t('cancellationFees.proposed', {
                  amount: String(fee),
                  percent: String(Math.round((job.cancellation?.rate ?? 0) * 100)),
                })}
              </p>

              {job.cancellation?.reason ? (
                <p className="mt-1 text-[12px] italic text-[var(--hm-fg-muted)]">
                  “{job.cancellation.reason}”
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="default"
                  size="sm"
                  disabled={busyId === job._id}
                  onClick={() => decide(job._id, 'charge')}
                >
                  {t('cancellationFees.charge', { amount: String(fee) })}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === job._id}
                  onClick={() => decide(job._id, 'waive')}
                >
                  {t('cancellationFees.waive')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {decided.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--hm-fg-muted)]">
            {t('cancellationFees.recent')}
          </p>
          <div className="flex flex-col gap-1.5">
            {decided.map((job) => {
              const status = job.cancellation?.feeStatus ?? 'charged';
              const tone =
                status === 'paid'
                  ? 'text-[var(--hm-success-600,#16A34A)]'
                  : status === 'failed'
                    ? 'text-[var(--hm-danger-600,#DC2626)]'
                    : 'text-[var(--hm-fg-muted)]';
              return (
                <div
                  key={job._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--hm-border-subtle)] px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--hm-fg-secondary)]">
                    {job.title}
                  </span>
                  <span className="text-[13px] tabular-nums text-[var(--hm-fg-primary)]">
                    {status === 'waived' ? '-' : `${job.cancellation?.feeAmount ?? 0} ₾`}
                  </span>
                  <span className={`text-[12px] font-semibold ${tone}`}>
                    {t(`cancellationFees.status.${status}`)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
