'use client';

import { Modal, ModalBody, ModalHeader } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/projects/TableCard';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  Check,
  ExternalLink,
  MessageSquare,
  RotateCcw,
  Send,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { ProjectDoc } from './ProjectDocuments';

interface DocumentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  doc: ProjectDoc;
  /** Client or editor - can replace + comment. */
  canEdit: boolean;
  /** Client only - can approve / request changes. */
  isClient: boolean;
  onChanged: () => Promise<void> | void;
}

const IMG = /\.(jpe?g|png|webp|gif|avif|heic|heif)(\?|$)/i;
const isImage = (d: { fileType?: string; url: string }) =>
  d.fileType?.startsWith('image/') || IMG.test(d.url) || d.url.startsWith('data:image');

export default function DocumentReviewModal({
  isOpen,
  onClose,
  projectId,
  doc,
  canEdit,
  isClient,
  onChanged,
}: DocumentReviewModalProps) {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const replaceRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState<'all' | 'version' | 'comment'>('all');

  const errMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(
      locale === 'en' ? 'en-US' : locale === 'ru' ? 'ru-RU' : 'ka-GE',
      { day: 'numeric', month: 'short', year: 'numeric' },
    );

  const replace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await api.post('/upload', fd);
      const url = (up.data.url || up.data.filename) as string;
      await api.post(`/projects/${projectId}/documents/${doc.id}/version`, {
        url,
        name: file.name,
        fileType: file.type,
      });
      await onChanged();
      toast.success(t('projects.docVersionUploaded'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusy(false);
      if (replaceRef.current) replaceRef.current.value = '';
    }
  };

  const setApproval = async (status: 'approved' | 'changes_requested') => {
    setBusy(true);
    try {
      await api.patch(`/projects/${projectId}/documents/${doc.id}/approval`, {
        status,
      });
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const addComment = async () => {
    const text = comment.trim();
    if (!text) return;
    setBusy(true);
    try {
      await api.post(`/projects/${projectId}/documents/${doc.id}/comments`, {
        text,
        authorName: user?.name,
      });
      setComment('');
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      await api.delete(
        `/projects/${projectId}/documents/${doc.id}/comments/${commentId}`,
      );
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    }
  };

  if (!isOpen) return null;

  const approval = doc.approvalStatus;
  const approvalTone =
    approval === 'approved'
      ? 'success'
      : approval === 'changes_requested'
        ? 'warning'
        : approval === 'pending'
          ? 'info'
          : 'neutral';

  const nameOf = (u?: { name?: string } | string) =>
    u && typeof u === 'object' ? u.name : undefined;

  // Unified, chronological activity feed: every version + every comment.
  type Event =
    | {
        kind: 'version';
        at: number;
        version: number;
        url: string;
        current: boolean;
        author?: string;
      }
    | { kind: 'comment'; at: number; id: string; text: string; author?: string };
  const allEvents: Event[] = [
    ...(doc.versions ?? []).map((v) => ({
      kind: 'version' as const,
      at: new Date(v.createdAt).getTime(),
      version: v.version,
      url: v.url,
      current: false,
      author: nameOf(v.uploadedBy),
    })),
    {
      kind: 'version' as const,
      at: new Date(doc.createdAt).getTime(),
      version: doc.version ?? 1,
      url: doc.url,
      current: true,
      author: nameOf(doc.uploadedBy),
    },
    ...(doc.comments ?? []).map((c) => ({
      kind: 'comment' as const,
      at: new Date(c.createdAt).getTime(),
      id: c.id,
      text: c.text,
      author: c.authorName,
    })),
  ].sort((a, b) => a.at - b.at);
  const events =
    filter === 'all' ? allEvents : allEvents.filter((e) => e.kind === filter);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" showCloseButton>
      <ModalHeader title={doc.name} />
      <ModalBody className="p-0">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* LEFT: preview + actions */}
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <a
              href={storage.getFileUrl(doc.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]"
            >
              {isImage(doc) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={storage.getOptimizedImageUrl(doc.url, 'feedCard')}
                  alt={doc.name}
                  className="max-h-[420px] w-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center gap-2 py-12 text-[14px] font-medium text-[var(--hm-brand-500)]">
                  <ExternalLink className="h-4 w-4" />
                  {t('common.viewAll')}
                </div>
              )}
            </a>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Pill tone={approvalTone}>
                  {t(`projects.docApproval_${approval}`)}
                </Pill>
                <span className="font-mono text-[12px] text-[var(--hm-fg-muted)]">
                  v{doc.version ?? 1}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => replaceRef.current?.click()}
                    loading={busy}
                    leftIcon={<RotateCcw />}
                  >
                    {t('projects.replaceFile')}
                  </Button>
                )}
                {isClient && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setApproval('changes_requested')}
                      disabled={busy}
                    >
                      {t('projects.requestChanges')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setApproval('approved')}
                      disabled={busy}
                      leftIcon={<Check />}
                    >
                      {t('projects.approve')}
                    </Button>
                  </>
                )}
              </div>
            </div>
            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
            <input
              ref={replaceRef}
              type="file"
              className="hidden"
              onChange={replace}
            />
          </div>

          {/* RIGHT: activity timeline + comment box */}
          <div className="flex max-h-[78vh] flex-col border-t border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)]/40 lg:max-h-[80vh] lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--hm-border-subtle)] px-4 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--hm-fg-muted)]">
                {t('projects.activityLabel')}
              </span>
              <div className="flex items-center gap-0.5 rounded-full bg-[var(--hm-bg-tertiary)] p-0.5">
                {(
                  [
                    ['all', t('projects.filterAll')],
                    ['version', t('projects.versionHistory')],
                    ['comment', t('projects.docComments')],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFilter(k)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      filter === k
                        ? 'bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] shadow-sm'
                        : 'text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="relative flex flex-col gap-4">
                <span
                  aria-hidden
                  className="absolute bottom-2 left-[11px] top-2 w-px bg-[var(--hm-border-subtle)]"
                />
                {events.map((ev, i) => (
                  <div key={i} className="relative flex gap-3">
                    <span
                      className={`z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        ev.kind === 'version'
                          ? 'bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]'
                          : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
                      }`}
                    >
                      {ev.kind === 'version' ? (
                        <UploadCloud className="h-3.5 w-3.5" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1 pb-1">
                      {ev.kind === 'version' ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[14px] font-semibold text-[var(--hm-fg-primary)]">
                              {t('projects.versionUploaded')} · v{ev.version}
                            </span>
                            {ev.current && (
                              <Pill tone="brand">
                                {t('projects.currentVersion')}
                              </Pill>
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[var(--hm-fg-muted)]">
                            {ev.author && (
                              <span className="font-medium text-[var(--hm-fg-secondary)]">
                                {ev.author}
                              </span>
                            )}
                            <span>{fmtDate(new Date(ev.at).toISOString())}</span>
                            <a
                              href={storage.getFileUrl(ev.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-[var(--hm-brand-500)] hover:underline"
                            >
                              {t('common.viewAll')}
                            </a>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[14px] text-[var(--hm-fg-primary)]">
                              {ev.text}
                            </p>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => removeComment(ev.id)}
                                aria-label={t('common.delete')}
                                className="shrink-0 p-0.5 text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <span className="text-[12px] text-[var(--hm-fg-muted)]">
                            {ev.author ? `${ev.author} · ` : ''}
                            {fmtDate(new Date(ev.at).toISOString())}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2 border-t border-[var(--hm-border-subtle)] p-3">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addComment();
                  }}
                  placeholder={t('projects.docAddComment')}
                  className="h-10 flex-1 rounded-lg border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] px-3 text-[14px] text-[var(--hm-fg-primary)] focus:border-[var(--hm-brand-500)] focus:outline-none"
                />
                <Button
                  size="icon"
                  onClick={addComment}
                  disabled={busy || !comment.trim()}
                  aria-label={t('common.save')}
                >
                  <Send />
                </Button>
              </div>
            )}
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
