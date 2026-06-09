'use client';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Landing page after a milestone-payment funding redirect. Reconciles the
 * payment with the provider (the webhook may not have arrived yet), then sends
 * the client back to the project's Team tab where the schedule lives.
 */
export default function MilestonePaymentReturnPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const projectId = String(params?.id || '');
  const mp = search.get('mp') || '';
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const back = () =>
      router.replace(`/projects/${projectId}?tab=team`);
    if (!mp) {
      back();
      return;
    }
    api
      .post(`/milestone-payments/${mp}/reconcile`)
      .then((r) => {
        const status = (r.data as { status?: string })?.status;
        const ok =
          status === 'funded' ||
          status === 'submitted' ||
          status === 'confirmed' ||
          status === 'released';
        setState(ok ? 'ok' : 'fail');
        // Brief confirmation, then return to the schedule.
        window.setTimeout(back, ok ? 1600 : 3000);
      })
      .catch(() => {
        setState('fail');
        window.setTimeout(back, 3000);
      });
  }, [mp, projectId, router]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-4 text-center">
      {state === 'loading' && (
        <>
          <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
          <p className="text-[15px] font-medium text-[var(--hm-fg-secondary)]">
            {t('projects.checkoutPlacing')}
          </p>
        </>
      )}
      {state === 'ok' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-[var(--hm-success-500)]" />
          <p className="text-[17px] font-bold text-[var(--hm-fg-primary)]">
            {t('projects.mpFundedOk')}
          </p>
          <p className="text-[13px] text-[var(--hm-fg-muted)]">
            {t('projects.mpProtected')}
          </p>
        </>
      )}
      {state === 'fail' && (
        <>
          <XCircle className="h-12 w-12 text-[var(--hm-error-500)]" />
          <p className="text-[17px] font-bold text-[var(--hm-fg-primary)]">
            {t('projects.tryAgain')}
          </p>
          <Button
            variant="outline"
            onClick={() => router.replace(`/projects/${projectId}?tab=team`)}
          >
            {t('common.back')}
          </Button>
        </>
      )}
    </div>
  );
}
