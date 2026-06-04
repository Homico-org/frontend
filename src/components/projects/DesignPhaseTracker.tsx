'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Check, Send, X } from 'lucide-react';
import { useState } from 'react';

type DesignPhaseKey = 'concept' | 'schematic' | 'detailed' | 'construction';
type ApprovalStatus = 'none' | 'pending' | 'approved' | 'changes_requested';

const PHASES: { key: DesignPhaseKey; labelKey: string }[] = [
  { key: 'concept', labelKey: 'projects.dpConcept' },
  { key: 'schematic', labelKey: 'projects.dpSchematic' },
  { key: 'detailed', labelKey: 'projects.dpDetailed' },
  { key: 'construction', labelKey: 'projects.dpConstructionDocs' },
];

interface DesignPhaseTrackerProps {
  projectId: string;
  engagementId: string;
  designApproval?: {
    phase?: DesignPhaseKey;
    status: ApprovalStatus;
    note?: string;
  };
  canSubmit: boolean; // the assigned pro
  canReview: boolean; // the client
  onChanged: () => Promise<void> | void;
}

export default function DesignPhaseTracker({
  projectId,
  engagementId,
  designApproval,
  canSubmit,
  canReview,
  onChanged,
}: DesignPhaseTrackerProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const current: DesignPhaseKey = designApproval?.phase || 'concept';
  const status: ApprovalStatus = designApproval?.status || 'none';
  const currentIdx = PHASES.findIndex((p) => p.key === current);

  const errMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || t('projects.tryAgain');

  const submit = async () => {
    setBusy(true);
    try {
      await api.patch(
        `/projects/${projectId}/engagements/${engagementId}/design-phase`,
        { status: 'pending' },
      );
      await onChanged();
      toast.success(t('projects.dpSubmitted'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const review = async (decision: 'approved' | 'changes_requested') => {
    setBusy(true);
    try {
      await api.patch(
        `/projects/${projectId}/engagements/${engagementId}/design-review`,
        { status: decision },
      );
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)] p-3">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[12px] font-semibold text-[var(--hm-fg-secondary)]">
          {t('projects.dpTitle')}
        </span>
        {status === 'pending' && (
          <Badge variant="warning" size="sm">
            {t('projects.docPendingReview')}
          </Badge>
        )}
        {status === 'changes_requested' && (
          <Badge variant="danger" size="sm">
            {t('projects.docChangesRequested')}
          </Badge>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-3">
        {PHASES.map((p, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={p.key} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full h-1 rounded-full"
                style={{
                  backgroundColor:
                    done || active
                      ? 'var(--hm-brand-500)'
                      : 'var(--hm-border)',
                }}
              />
              <span
                className={`text-[10px] leading-tight text-center ${
                  active
                    ? 'font-semibold text-[var(--hm-brand-500)]'
                    : 'text-[var(--hm-fg-muted)]'
                }`}
              >
                {t(p.labelKey)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {canSubmit && (status === 'none' || status === 'changes_requested') && (
        <Button
          size="sm"
          className="w-full"
          disabled={busy}
          onClick={submit}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          {t('projects.dpSubmitReview')}
        </Button>
      )}
      {canSubmit && status === 'pending' && (
        <p className="text-[12px] text-[var(--hm-fg-muted)] text-center">
          {t('projects.dpAwaitingReview')}
        </p>
      )}
      {canReview && status === 'pending' && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={busy}
            onClick={() => review('changes_requested')}
            leftIcon={<X className="w-3.5 h-3.5" />}
          >
            {t('projects.requestChanges')}
          </Button>
          <Button
            size="sm"
            variant="default"
            className="flex-1"
            disabled={busy}
            onClick={() => review('approved')}
            leftIcon={<Check className="w-3.5 h-3.5" />}
          >
            {t('projects.docApprove')}
          </Button>
        </div>
      )}
    </div>
  );
}
