'use client';

import TimeAgo from '@/components/common/TimeAgo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { ClipboardCheck, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';

export interface ProjectDecision {
  id: string;
  text: string;
  decidedBy?: string;
  decidedByName?: string;
  createdAt: string;
}

interface ProjectDecisionsProps {
  projectId: string;
  decisions: ProjectDecision[];
  canManage: boolean; // client: can remove any decision
  onChanged: () => Promise<void> | void;
}

export default function ProjectDecisions({
  projectId,
  decisions,
  canManage,
  onChanged,
}: ProjectDecisionsProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const errMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || t('projects.tryAgain');

  const add = async () => {
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    try {
      await api.post(`/projects/${projectId}/decisions`, {
        text,
        decidedByName: user?.name,
      });
      setDraft('');
      await onChanged();
      toast.success(t('projects.decisionLogged'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (decisionId: string) => {
    setRemovingId(decisionId);
    try {
      await api.delete(`/projects/${projectId}/decisions/${decisionId}`);
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setRemovingId(null);
    }
  };

  // Newest first.
  const ordered = [...decisions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="inline-flex items-center gap-2 text-[18px] font-bold text-[var(--hm-fg-primary)]">
          <ClipboardCheck className="w-5 h-5 text-[var(--hm-brand-500)]" />
          {t('projects.decisionsTitle')}
        </h2>
      </div>
      <p className="text-[13px] text-[var(--hm-fg-muted)] mb-5 max-w-[60ch]">
        {t('projects.decisionsSubtitle')}
      </p>

      {/* Log a decision */}
      <div className="flex items-center gap-2 mb-5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              add();
            }
          }}
          placeholder={t('projects.decisionPlaceholder')}
          maxLength={500}
        />
        <Button
          onClick={add}
          disabled={busy || !draft.trim()}
          leftIcon={
            busy ? (
              <LoadingSpinner size="xs" color="white" />
            ) : (
              <Send className="w-4 h-4" />
            )
          }
          className="shrink-0"
        >
          {t('projects.logDecision')}
        </Button>
      </div>

      {ordered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 flex flex-col items-center text-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)]">
            <ClipboardCheck className="w-6 h-6" />
          </span>
          <p className="text-[14px] text-[var(--hm-fg-muted)] max-w-[42ch]">
            {t('projects.noDecisions')}
          </p>
        </div>
      ) : (
        <ol className="relative border-l border-[var(--hm-border-subtle)] ml-2 space-y-5">
          {ordered.map((d) => {
            const mine = (!!user?.id && d.decidedBy === user.id) || canManage;
            return (
              <li key={d.id} className="relative pl-6 group">
                {/* Timeline dot */}
                <span
                  className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--hm-bg-elevated)]"
                  style={{ backgroundColor: 'var(--hm-brand-500)' }}
                  aria-hidden
                />
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[var(--hm-fg-primary)] whitespace-pre-wrap break-words">
                      {d.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--hm-fg-muted)]">
                      <span>{d.decidedByName || t('projects.someone')}</span>
                      <span aria-hidden>·</span>
                      <TimeAgo isoDate={d.createdAt} variant="compact" />
                    </div>
                  </div>
                  {mine && (
                    <button
                      type="button"
                      onClick={() => remove(d.id)}
                      disabled={removingId === d.id}
                      aria-label={t('common.delete')}
                      className="shrink-0 p-1.5 rounded-lg text-[var(--hm-fg-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)] transition-all"
                    >
                      {removingId === d.id ? (
                        <LoadingSpinner size="xs" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
