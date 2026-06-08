'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import {
  CheckCircle2,
  CreditCard,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export type MilestonePaymentStatus =
  | 'proposed'
  | 'approved'
  | 'declined'
  | 'funded'
  | 'submitted'
  | 'confirmed'
  | 'released'
  | 'in_dispute'
  | 'refunded'
  | 'cancelled';

interface MilestonePayment {
  _id: string;
  id?: string;
  engagementId: string;
  label: string;
  amountMinor: number;
  status: MilestonePaymentStatus;
}

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const STATUS_TONE: Record<MilestonePaymentStatus, Tone> = {
  proposed: 'warning',
  approved: 'info',
  declined: 'neutral',
  funded: 'info',
  submitted: 'warning',
  confirmed: 'success',
  released: 'success',
  in_dispute: 'danger',
  refunded: 'neutral',
  cancelled: 'neutral',
};

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]',
  info: 'bg-[var(--hm-info-50)] text-[var(--hm-info-600)]',
  success: 'bg-[var(--hm-success-50)] text-[var(--hm-success-600)]',
  warning: 'bg-[var(--hm-warning-50)] text-[var(--hm-warning-600)]',
  danger: 'bg-[var(--hm-error-500)]/10 text-[var(--hm-error-500)]',
};

const gel = (minor: number) =>
  `${Math.round(minor / 100)
    .toLocaleString('en-US')
    .replace(/,/g, ' ')} ₾`;

interface Props {
  projectId: string;
  engagementId: string;
  /** 'client' funds/confirms; 'pro' proposes/marks-done. */
  role: 'client' | 'pro';
  /** Called after any change so the parent can refresh project rollups. */
  onChanged?: () => void;
}

export default function MilestonePaymentsPanel({
  projectId,
  engagementId,
  role,
  onChanged,
}: Props) {
  const { t } = useLanguage();
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState<MilestonePayment[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ label: string; amount: string }[]>([
    { label: '', amount: '' },
  ]);
  const [suggestion, setSuggestion] = useState<{
    total: number;
    source: 'scope' | 'budget' | 'none';
    scopeCount: number;
  } | null>(null);
  const [disputeFor, setDisputeFor] = useState<MilestonePayment | null>(null);

  // When the pro opens the propose form, pull a suggested total (scope/budget)
  // so they can one-click a deposit/progress/final split instead of a blank form.
  useEffect(() => {
    if (role !== 'pro' || !adding || suggestion) return;
    api
      .get(`/milestone-payments/suggest/${projectId}/${engagementId}`)
      .then((r) => setSuggestion(r.data))
      .catch(() => setSuggestion({ total: 0, source: 'none', scopeCount: 0 }));
  }, [role, adding, suggestion, projectId, engagementId]);

  const fmtMajor = (n: number) =>
    `${n.toLocaleString('en-US').replace(/,/g, ' ')} ₾`;

  const applySplit = () => {
    if (!suggestion || suggestion.total <= 0) return;
    const total = suggestion.total;
    const dep = Math.round(total * 0.3);
    const prog = Math.round(total * 0.4);
    const fin = total - dep - prog;
    setDraft([
      { label: t('projects.mpSplitDeposit'), amount: String(dep) },
      { label: t('projects.mpSplitProgress'), amount: String(prog) },
      { label: t('projects.mpSplitFinal'), amount: String(fin) },
    ]);
  };

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<MilestonePayment[]>(
        `/milestone-payments/project/${projectId}`,
      );
      setRows((data || []).filter((r) => r.engagementId === engagementId));
    } catch {
      setRows([]);
    }
  }, [projectId, engagementId]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    await load();
    onChanged?.();
  };

  const err = (e: unknown) =>
    toast.error(
      t('projects.tryAgain'),
      (e as { response?: { data?: { message?: string } } })?.response?.data
        ?.message,
    );

  // ---- pro: propose -----------------------------------------------------
  const submitProposal = async () => {
    const items = draft
      .map((d) => ({ label: d.label.trim(), amount: Number(d.amount) || 0 }))
      .filter((d) => d.label && d.amount > 0);
    if (!items.length) return;
    setBusyId('propose');
    try {
      await api.post('/milestone-payments/propose', {
        projectId,
        engagementId,
        items,
      });
      toast.success(t('projects.mpProposedToast'));
      setAdding(false);
      setDraft([{ label: '', amount: '' }]);
      await refresh();
    } catch (e) {
      err(e);
    } finally {
      setBusyId(null);
    }
  };

  // ---- client: approve / fund / confirm / decline -----------------------
  const approve = async () => {
    setBusyId('approve');
    try {
      await api.post('/milestone-payments/approve', { projectId, engagementId });
      toast.success(t('projects.mpApprovedToast'));
      await refresh();
    } catch (e) {
      err(e);
    } finally {
      setBusyId(null);
    }
  };

  const act = async (
    mp: MilestonePayment,
    path: string,
    successKey?: string,
  ) => {
    setBusyId(mp._id);
    try {
      const { data } = await api.post<{ redirectUrl?: string }>(
        `/milestone-payments/${mp._id}/${path}`,
      );
      if (path === 'fund' && data?.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (successKey) toast.success(t(successKey));
      await refresh();
    } catch (e) {
      err(e);
    } finally {
      setBusyId(null);
    }
  };

  const confirmRelease = async (mp: MilestonePayment) => {
    const ok = await confirm({
      title: t('projects.mpConfirmTitle'),
      description: t('projects.mpConfirmHint', { amount: gel(mp.amountMinor) }),
      confirmLabel: t('projects.mpConfirmCta'),
      cancelLabel: t('common.cancel'),
      variant: 'accent',
    });
    if (!ok) return;
    await act(mp, 'confirm', 'projects.mpConfirmedToast');
  };

  const removeRow = async (mp: MilestonePayment) => {
    setBusyId(mp._id);
    try {
      await api.delete(`/milestone-payments/${mp._id}`);
      await refresh();
    } catch (e) {
      err(e);
    } finally {
      setBusyId(null);
    }
  };

  if (rows === null) {
    return (
      <div className="flex justify-center py-3">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  const hasProposed = rows.some((r) => r.status === 'proposed');
  const total = rows
    .filter((r) => r.status !== 'declined' && r.status !== 'cancelled')
    .reduce((s, r) => s + r.amountMinor, 0);

  return (
    <div className="mt-1 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--hm-fg-muted)]">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t('projects.paymentSchedule')}
        </p>
        {total > 0 && (
          <span className="text-[12px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
            {gel(total)}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="py-1 text-[12px] text-[var(--hm-fg-muted)]">
          {role === 'pro' ? t('projects.mpProPrompt') : t('projects.mpEmpty')}
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--hm-border-subtle)]">
          {rows.map((mp) => {
            const busy = busyId === mp._id;
            return (
              <div
                key={mp._id}
                className="flex items-center gap-2 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-[var(--hm-fg-primary)]">
                    {mp.label}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] tabular-nums text-[var(--hm-fg-secondary)]">
                      {gel(mp.amountMinor)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${TONE_CLASS[STATUS_TONE[mp.status]]}`}
                    >
                      {t(`projects.mpStatus_${mp.status}`)}
                    </span>
                  </div>
                </div>

                {/* Row actions by role + status */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {role === 'client' && mp.status === 'approved' && (
                    <Button
                      size="sm"
                      loading={busy}
                      leftIcon={<CreditCard className="h-3.5 w-3.5" />}
                      onClick={() => act(mp, 'fund')}
                    >
                      {t('projects.mpFund')}
                    </Button>
                  )}
                  {role === 'client' && mp.status === 'submitted' && (
                    <Button
                      size="sm"
                      variant="success"
                      loading={busy}
                      leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      onClick={() => confirmRelease(mp)}
                    >
                      {t('projects.mpConfirmCta')}
                    </Button>
                  )}
                  {role === 'pro' && mp.status === 'funded' && (
                    <Button
                      size="sm"
                      loading={busy}
                      onClick={() => act(mp, 'mark-done', 'projects.mpMarkedToast')}
                    >
                      {t('projects.mpMarkDone')}
                    </Button>
                  )}
                  {/* Dispute available to either party once funded */}
                  {['funded', 'submitted', 'confirmed'].includes(mp.status) && (
                    <button
                      type="button"
                      onClick={() => setDisputeFor(mp)}
                      className="text-[11px] font-medium text-[var(--hm-fg-muted)] underline-offset-2 hover:text-[var(--hm-error-500)] hover:underline"
                    >
                      {t('projects.mpDispute')}
                    </button>
                  )}
                  {/* Remove a not-yet-funded row */}
                  {['proposed', 'approved', 'declined'].includes(mp.status) && (
                    <button
                      type="button"
                      onClick={() => removeRow(mp)}
                      aria-label={t('common.delete')}
                      disabled={busy}
                      className="p-1 text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-error-500)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client: approve a freshly proposed schedule */}
      {role === 'client' && hasProposed && (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-[var(--hm-border-subtle)] pt-2">
          <span className="text-[11px] text-[var(--hm-fg-muted)]">
            {t('projects.mpAwaitingApproval')}
          </span>
          <Button
            size="sm"
            loading={busyId === 'approve'}
            onClick={approve}
          >
            {t('projects.mpApprove')}
          </Button>
        </div>
      )}

      {/* Pro: propose installments */}
      {role === 'pro' && !adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--hm-brand-500)] hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('projects.mpAddInstallment')}
        </button>
      )}
      {role === 'pro' && adding && (
        <div className="mt-2 flex flex-col gap-2 border-t border-[var(--hm-border-subtle)] pt-2">
          {suggestion && suggestion.total > 0 && (
            <button
              type="button"
              onClick={applySplit}
              className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-[var(--hm-brand-500)]/40 bg-[var(--hm-brand-500)]/[0.04] px-3 py-2 text-left transition-colors hover:bg-[var(--hm-brand-500)]/[0.08]"
            >
              <span className="min-w-0">
                <span className="block text-[12px] font-semibold text-[var(--hm-brand-500)]">
                  {t('projects.mpSuggestSplit')}
                </span>
                <span className="block truncate text-[11px] text-[var(--hm-fg-muted)]">
                  {suggestion.source === 'scope'
                    ? t('projects.mpSuggestFromScope', {
                        count: suggestion.scopeCount,
                        amount: fmtMajor(suggestion.total),
                      })
                    : t('projects.mpSuggestFromBudget', {
                        amount: fmtMajor(suggestion.total),
                      })}
                </span>
              </span>
              <Plus className="h-4 w-4 shrink-0 text-[var(--hm-brand-500)]" />
            </button>
          )}
          {draft.map((d, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={d.label}
                onChange={(e) =>
                  setDraft((p) =>
                    p.map((x, j) =>
                      j === i ? { ...x, label: e.target.value } : x,
                    ),
                  )
                }
                placeholder={t('projects.mpLabelPlaceholder')}
                className="flex-1"
              />
              <div className="relative w-28 shrink-0">
                <Input
                  type="number"
                  min={1}
                  value={d.amount}
                  onChange={(e) =>
                    setDraft((p) =>
                      p.map((x, j) =>
                        j === i ? { ...x, amount: e.target.value } : x,
                      ),
                    )
                  }
                  className="pr-7"
                  placeholder="0"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-[var(--hm-fg-muted)]">
                  ₾
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setDraft((p) => [...p, { label: '', amount: '' }])}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)]"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('projects.mpAddRow')}
            </button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAdding(false);
                  setDraft([{ label: '', amount: '' }]);
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                loading={busyId === 'propose'}
                onClick={submitProposal}
              >
                {t('projects.mpPropose')}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-[var(--hm-fg-muted)]">
            {t('projects.mpFeeNote')}
          </p>
        </div>
      )}

      {/* Escrow reassurance line */}
      {rows.some((r) =>
        ['funded', 'submitted', 'confirmed', 'released'].includes(r.status),
      ) && (
        <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-[var(--hm-fg-muted)]">
          <Lock className="h-3 w-3 text-[var(--hm-success-600)]" />
          {t('projects.mpProtected')}
        </p>
      )}

      {disputeFor && (
        <DisputeModal
          mp={disputeFor}
          onClose={() => setDisputeFor(null)}
          onDone={async () => {
            setDisputeFor(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------

function DisputeModal({
  mp,
  onClose,
  onDone,
}: {
  mp: MilestonePayment;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useLanguage();
  const toast = useToast();
  const [type, setType] = useState<'quality' | 'cancellation' | 'other'>(
    'quality',
  );
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!description.trim()) return;
    setSaving(true);
    try {
      await api.post(`/milestone-payments/${mp._id}/dispute`, {
        type,
        description: description.trim(),
      });
      toast.success(t('projects.mpDisputeRaised'));
      onDone();
    } catch (e) {
      toast.error(
        t('projects.tryAgain'),
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message,
      );
      setSaving(false);
    }
  };

  const TYPES: { v: 'quality' | 'cancellation' | 'other'; k: string }[] = [
    { v: 'quality', k: 'projects.mpDisputeQuality' },
    { v: 'cancellation', k: 'projects.mpDisputeCancellation' },
    { v: 'other', k: 'projects.mpDisputeOther' },
  ];

  return (
    <Modal isOpen onClose={onClose} size="md" showCloseButton>
      <ModalHeader title={t('projects.mpDisputeTitle')} />
      <ModalBody className="flex flex-col gap-3">
        <p className="text-[13px] text-[var(--hm-fg-secondary)]">
          {t('projects.mpDisputeHint')}
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {TYPES.map((tp) => (
            <button
              key={tp.v}
              type="button"
              onClick={() => setType(tp.v)}
              className={`rounded-lg border px-2 py-2 text-[12px] font-medium transition-colors ${
                type === tp.v
                  ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)] text-white'
                  : 'border-[var(--hm-border)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-fg-primary)]'
              }`}
            >
              {t(tp.k)}
            </button>
          ))}
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder={t('projects.mpDisputePlaceholder')}
          className="w-full rounded-xl border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] p-3 text-[14px] text-[var(--hm-fg-primary)] focus:border-[var(--hm-brand-500)] focus:outline-none"
        />
      </ModalBody>
      <ModalFooter className="justify-end">
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="destructive"
          loading={saving}
          disabled={!description.trim()}
          onClick={submit}
        >
          {t('projects.mpDisputeSubmit')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
