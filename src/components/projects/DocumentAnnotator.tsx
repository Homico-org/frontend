'use client';

import TimeAgo from '@/components/common/TimeAgo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { ProjectDoc } from './ProjectDocuments';

interface DocumentAnnotatorProps {
  projectId: string;
  doc: ProjectDoc;
  canManage: boolean; // client can delete any pin
  onChanged: () => Promise<void> | void;
  onClose: () => void;
}

export default function DocumentAnnotator({
  projectId,
  doc,
  canManage,
  onChanged,
  onClose,
}: DocumentAnnotatorProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const imgRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [draftText, setDraftText] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const errMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || t('projects.tryAgain');

  // Pins are the document's comments that carry coordinates.
  const pins = useMemo(
    () =>
      (doc.comments ?? []).filter(
        (c) => typeof c.x === 'number' && typeof c.y === 'number',
      ),
    [doc.comments],
  );

  const placePin = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setSelectedId(null);
    setDraft({ x, y });
    setDraftText('');
  };

  const savePin = async () => {
    if (!draft) return;
    const text = draftText.trim();
    if (!text) return;
    setBusy(true);
    try {
      await api.post(`/projects/${projectId}/documents/${doc.id}/comments`, {
        text,
        authorName: user?.name,
        x: draft.x,
        y: draft.y,
      });
      setDraft(null);
      setDraftText('');
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const deletePin = async (commentId: string) => {
    try {
      await api.delete(
        `/projects/${projectId}/documents/${doc.id}/comments/${commentId}`,
      );
      if (selectedId === commentId) setSelectedId(null);
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="full"
      showCloseButton
      ariaLabel={t('projects.markup')}
    >
      <div className="flex flex-col lg:flex-row h-[80vh] max-h-[80vh]">
        {/* Image + pins */}
        <div className="flex-1 min-h-0 bg-[var(--hm-bg-tertiary)] flex items-center justify-center p-3 overflow-auto">
          <div ref={imgRef} className="relative inline-block cursor-crosshair">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={storage.getFileUrl(doc.url)}
              alt={doc.name}
              className="max-h-[74vh] w-auto select-none"
              draggable={false}
              onClick={placePin}
            />
            {/* Existing pins */}
            {pins.map((c, i) => {
              const active = selectedId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(c.id);
                    setDraft(null);
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center ring-2 ring-white shadow-md transition-transform hover:scale-110"
                  style={{
                    left: `${(c.x ?? 0) * 100}%`,
                    top: `${(c.y ?? 0) * 100}%`,
                    backgroundColor: active
                      ? 'var(--hm-brand-600)'
                      : 'var(--hm-brand-500)',
                    transform: active
                      ? 'translate(-50%,-50%) scale(1.15)'
                      : undefined,
                  }}
                  aria-label={`${t('projects.markup')} ${i + 1}`}
                >
                  {i + 1}
                </button>
              );
            })}
            {/* Draft pin */}
            {draft && (
              <span
                className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full ring-2 ring-white shadow-md flex items-center justify-center"
                style={{
                  left: `${draft.x * 100}%`,
                  top: `${draft.y * 100}%`,
                  backgroundColor: 'var(--hm-brand-700)',
                }}
                aria-hidden
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </span>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--hm-border-subtle)] flex flex-col min-h-0 bg-[var(--hm-bg-elevated)]">
          <div className="px-4 py-3 border-b border-[var(--hm-border-subtle)]">
            <h3 className="text-[15px] font-bold text-[var(--hm-fg-primary)] truncate">
              {doc.name}
            </h3>
            <p className="text-[11px] text-[var(--hm-fg-muted)] mt-0.5">
              {t('projects.markupHint')}
            </p>
          </div>

          {/* Draft pin composer */}
          {draft && (
            <div className="px-4 py-3 border-b border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]/40">
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      savePin();
                    }
                    if (e.key === 'Escape') setDraft(null);
                  }}
                  placeholder={t('projects.pinPlaceholder')}
                  className="h-9 text-[13px]"
                  maxLength={500}
                />
                <Button
                  size="sm"
                  onClick={savePin}
                  disabled={busy || !draftText.trim()}
                  className="shrink-0 px-2.5"
                >
                  {busy ? <LoadingSpinner size="xs" color="white" /> : t('common.add')}
                </Button>
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  aria-label={t('common.cancel')}
                  className="shrink-0 p-1.5 rounded-lg text-[var(--hm-fg-muted)] hover:bg-[var(--hm-bg-tertiary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Pin list */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {pins.length === 0 ? (
              <p className="text-[12px] text-[var(--hm-fg-muted)] text-center px-4 py-8">
                {t('projects.noPins')}
              </p>
            ) : (
              <ul className="space-y-1">
                {pins.map((c, i) => {
                  const mine =
                    (!!user?.id && c.authorId === user.id) || canManage;
                  const active = selectedId === c.id;
                  return (
                    <li key={c.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedId(c.id);
                          setDraft(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setSelectedId(c.id);
                        }}
                        className={`group flex items-start gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                          active
                            ? 'bg-[var(--hm-brand-500)]/[0.08]'
                            : 'hover:bg-[var(--hm-bg-tertiary)]'
                        }`}
                      >
                        <span
                          className="shrink-0 mt-0.5 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                          style={{ backgroundColor: 'var(--hm-brand-500)' }}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-[var(--hm-fg-primary)] truncate">
                              {c.authorName || t('projects.someone')}
                            </span>
                            <TimeAgo
                              isoDate={c.createdAt}
                              variant="compact"
                              className="text-[10px] text-[var(--hm-fg-muted)]"
                            />
                          </div>
                          <p className="text-[12px] text-[var(--hm-fg-secondary)] whitespace-pre-wrap break-words">
                            {c.text}
                          </p>
                        </div>
                        {mine && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePin(c.id);
                            }}
                            aria-label={t('common.delete')}
                            className="shrink-0 p-1 rounded text-[var(--hm-fg-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--hm-error-500)] transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
