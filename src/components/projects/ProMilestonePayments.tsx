'use client';

import MilestonePaymentsPanel from '@/components/projects/MilestonePaymentsPanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { Wallet } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface PayableEngagement {
  projectId: string;
  projectTitle: string;
  engagementId: string;
  roleLabel: string;
  status: string;
}

/**
 * Pro-side payments surface for /my-space: one schedule panel per engagement
 * the pro is hired on, so they can propose a payment schedule and mark
 * milestones done. Renders nothing when the pro has no payable engagements.
 */
export default function ProMilestonePayments() {
  const { t } = useLanguage();
  const [engagements, setEngagements] = useState<PayableEngagement[] | null>(
    null,
  );

  useEffect(() => {
    let alive = true;
    api
      .get<PayableEngagement[]>('/milestone-payments/my-engagements')
      .then((r) => alive && setEngagements(r.data || []))
      .catch(() => alive && setEngagements([]));
    return () => {
      alive = false;
    };
  }, []);

  if (!engagements || engagements.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]">
          <Wallet className="h-4 w-4" />
        </span>
        <h2 className="text-[15px] font-bold text-[var(--hm-fg-primary)]">
          {t('projects.paymentSchedule')}
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        {engagements.map((e) => (
          <div
            key={`${e.projectId}:${e.engagementId}`}
            className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-3"
          >
            <Link
              href={`/projects/${e.projectId}`}
              className="mb-1 block truncate text-[13px] font-semibold text-[var(--hm-fg-primary)] hover:text-[var(--hm-brand-500)]"
            >
              {e.projectTitle}
              <span className="ml-1.5 font-normal text-[var(--hm-fg-muted)]">
                · {e.roleLabel}
              </span>
            </Link>
            <MilestonePaymentsPanel
              projectId={e.projectId}
              engagementId={e.engagementId}
              role="pro"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
